import { assetUrl, characterPartEntries, loadAssetManifest } from './kpah-assets.js';
import { decodeCharacterPartData } from './protocol/character-part-data.js';

const subscribers = new Set();
let latestCharacterPart = null;
let latestKey = null;
let pendingKey = null;
let pendingRequest = 0;
let pendingPlayback = null;
let pendingMetadata = null;

function toDataUrl(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  const mime = bytes[0] === 0x89 && bytes[1] === 0x50 ? 'image/png'
    : bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg'
    : bytes[0] === 0x47 && bytes[1] === 0x49 ? 'image/gif' : 'image/png';
  return 'data:' + mime + ';base64,' + btoa(binary);
}

function publish() {
  for (const subscriber of subscribers) subscriber(latestCharacterPart);
}

/** Publish only the active local player's decoded original part and atlas. */
export function publishCharacterPartData(partIndex, metadata, imageBytes, playback = null) {
  if (!Number.isInteger(partIndex) || !metadata?.frames?.length
    || !(imageBytes instanceof Uint8Array) || !imageBytes.length) return;
  // Atlas payloads may be replaced while retaining the same part index
  // and byte length. Include payload + frame layout in the preview cache key.
  let hash = 2166136261;
  const mix = value => {
    const text = String(value);
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= 255;
    hash = Math.imul(hash, 16777619);
  };
  for (const byte of imageBytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  for (const region of metadata.regions ?? []) {
    mix(region.x); mix(region.y); mix(region.width); mix(region.height);
  }
  for (const frame of metadata.frames) {
    mix(frame.index);
    for (const piece of frame.pieces ?? []) {
      mix(piece.x); mix(piece.y); mix(piece.regionIndex); mix(piece.layerGroup);
    }
  }
  const key = String(partIndex) + ':' + imageBytes.length + ':' + (hash >>> 0).toString(16);
  const nextPlayback = playback && typeof playback === 'object' ? {
    state: Number.isInteger(playback.state) ? playback.state : 0,
    direction: playback.direction === 1 ? 1 : 0,
    transform: playback.transform === 2 ? 2 : 0,
    frameCursor: Number.isInteger(playback.frameCursor) && playback.frameCursor >= 0
      ? playback.frameCursor : 0,
  } : null;
  if (key === latestKey && latestCharacterPart?.metadata === metadata) {
    const previous = latestCharacterPart.playback;
    if (previous?.state === nextPlayback?.state
      && previous?.direction === nextPlayback?.direction
      && previous?.transform === nextPlayback?.transform
      && previous?.frameCursor === nextPlayback?.frameCursor) return;
    latestCharacterPart = { ...latestCharacterPart, playback: nextPlayback };
    publish();
    return;
  }
  // syncServerWorldViews may publish on every 40 ms animation tick. Reuse an
  // in-flight atlas decode instead of creating a new Image until it finishes.
  if (key === pendingKey && pendingMetadata === metadata) {
    pendingPlayback = nextPlayback;
    return;
  }
  pendingKey = key;
  pendingMetadata = metadata;
  pendingPlayback = nextPlayback;
  const request = ++pendingRequest;
  const image = new Image();
  image.onload = () => {
    if (request !== pendingRequest || pendingKey !== key) return;
    latestKey = key;
    pendingKey = null;
    pendingMetadata = null;
    latestCharacterPart = { partIndex, metadata, image, playback: pendingPlayback };
    pendingPlayback = null;
    publish();
  };
  image.onerror = () => {
    if (request !== pendingRequest || pendingKey !== key) return;
    pendingKey = null;
    pendingMetadata = null;
    pendingPlayback = null;
    console.warn('KPAH character preview atlas could not be decoded', partIndex);
  };
  image.src = toDataUrl(imageBytes);
}


/** Clear the preview when the active local player no longer has valid part data. */
export function clearCharacterPartData() {
  if (!latestCharacterPart && !pendingKey) return;
  pendingRequest += 1;
  pendingKey = null;
  pendingMetadata = null;
  pendingPlayback = null;
  latestKey = null;
  latestCharacterPart = null;
  publish();
}

function composeFrame(metadata, image, frameIndex, transform) {
  const frame = metadata.frames[frameIndex];
  if (!frame?.pieces?.length) return null;
  const pieces = frame.pieces.map(piece => {
    const region = metadata.regions[piece.regionIndex];
    if (!region || region.width <= 0 || region.height <= 0
      || region.x < 0 || region.y < 0
      || region.x + region.width > image.naturalWidth
      || region.y + region.height > image.naturalHeight) return null;
    return { ...piece, region, drawX: transform === 2 ? -piece.x - region.width : piece.x };
  }).filter(Boolean);
  if (!pieces.length) return null;
  const minX = Math.min(0, ...pieces.map(piece => piece.drawX));
  const minY = Math.min(0, ...pieces.map(piece => piece.y));
  const maxX = Math.max(1, ...pieces.map(piece => piece.drawX + piece.region.width));
  const maxY = Math.max(1, ...pieces.map(piece => piece.y + piece.region.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(maxX - minX));
  canvas.height = Math.max(1, Math.ceil(maxY - minY));
  const context = canvas.getContext('2d');
  if (!context) return null;
  for (const group of [pieces.filter(piece => piece.layerGroup !== 0), pieces.filter(piece => piece.layerGroup === 0)]) {
    for (const piece of group) {
      const x = piece.drawX - minX;
      const y = piece.y - minY;
      if (transform === 2) {
        context.save();
        context.translate(x + piece.region.width, y);
        context.scale(-1, 1);
        context.drawImage(image, piece.region.x, piece.region.y, piece.region.width, piece.region.height,
          0, 0, piece.region.width, piece.region.height);
        context.restore();
      } else {
        context.drawImage(image, piece.region.x, piece.region.y, piece.region.width, piece.region.height,
          x, y, piece.region.width, piece.region.height);
      }
    }
  }
  return { canvas, minX, minY };
}

export function mountCharacterStage(root) {
  if (!root) return () => {};
  root.classList.add('original-character-stage');
  root.innerHTML = `
    <div class="original-character-stage__viewport">
      <canvas width="480" height="360" aria-label="Hoạt ảnh nhân vật KPAH gốc"></canvas>
      <div class="original-character-stage__empty">Đang nạp atlas nhân vật gốc từ KPAH_278.jar…</div>
      <span class="original-character-stage__tag">NHÂN VẬT GỐC</span>
    </div>
    <div class="original-character-stage__toolbar">
      <div class="original-character-stage__states">
        <button type="button" data-stage-state="0" class="selected">Đứng</button>
        <button type="button" data-stage-state="2">Di chuyển</button>
        <button type="button" data-stage-state="3">Ra đòn</button>
      </div>
      <button type="button" data-stage-direction="toggle" aria-label="Lật nhân vật trái phải">↔ Lật trái/phải</button>
      <button type="button" data-stage-connect>Nhận hoạt ảnh từ máy chủ</button>
    </div>
    <div class="original-character-stage__atlas-controls" hidden>
      <label>Đầu <select data-atlas-part="head"></select></label>
      <label>Thân <select data-atlas-part="body"></select></label>
      <label>Chân <select data-atlas-part="leg"></select></label>
    </div>
    <div class="original-character-stage__atlas-overview" hidden aria-label="Ba atlas bộ phận nhân vật gốc">
      <figure><figcaption>ĐẦU</figcaption><img data-atlas-overview="head" alt="Atlas đầu gốc"></figure>
      <figure><figcaption>THÂN</figcaption><img data-atlas-overview="body" alt="Atlas thân gốc"></figure>
      <figure><figcaption>CHÂN</figcaption><img data-atlas-overview="leg" alt="Atlas chân gốc"></figure>
    </div>
    <details class="original-character-stage__metadata" hidden>
      <summary>Dữ liệu metadata gốc của bộ phận đang chọn</summary>
      <p data-metadata-corpus>Đang chờ thống kê toàn bộ metadata…</p>
      <p data-metadata-status>Chưa đọc metadata.</p>
      <p data-metadata-structure></p>
      <code data-metadata-preview></code>
    </details>
    <div class="original-character-stage__caption">Đang hiển thị atlas bộ phận gốc từ JAR. Để ghép đúng nhân vật và chạy hoạt ảnh như client KPAH, cần partData cùng ảnh nhân vật do máy chủ cung cấp.</div>`;
  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const empty = root.querySelector('.original-character-stage__empty');
  const stateButtons = [...root.querySelectorAll('[data-stage-state]')];
  const stateControls = root.querySelector('.original-character-stage__states');
  const directionButton = root.querySelector('[data-stage-direction]');
  const stageTag = root.querySelector('.original-character-stage__tag');
  const atlasControls = root.querySelector('.original-character-stage__atlas-controls');
  const atlasSelects = [...root.querySelectorAll('[data-atlas-part]')];
  const atlasImages = new Map();
  const atlasOverview = root.querySelector('.original-character-stage__atlas-overview');
  const atlasOverviewImages = Object.fromEntries(['head', 'body', 'leg'].map(type =>
    [type, root.querySelector('[data-atlas-overview="' + type + '"]')]));
  const metadataPanel = root.querySelector('.original-character-stage__metadata');
  const metadataStatus = root.querySelector('[data-metadata-status]');
  const metadataCorpus = root.querySelector('[data-metadata-corpus]');
  const metadataPreview = root.querySelector('[data-metadata-preview]');
  const metadataStructure = root.querySelector('[data-metadata-structure]');
  const selectedAtlasIds = { head: '0', body: '0', leg: '0' };
  let atlasType = 'body';
  let atlasCatalog = [];
  const atlasLoadTokens = { head: 0, body: 0, leg: 0 };
  let data = latestCharacterPart;
  let state = 0;
  let direction = 0;
  let transform = 0;
  let cursor = 0;
  let accumulator = 0;
  let lastTime = 0;
  let frameCache = new Map();
  let raf = 0;
  let disposed = false;

  function setState(next) {
    state = next;
    cursor = 0;
    stateButtons.forEach(button => button.classList.toggle('selected', Number(button.dataset.stageState) === state));
    draw();
  }
  function getFrame() {
    if (!data) return null;
    const frameIndex = data.metadata.getFrameIndex(direction, state, cursor);
    if (frameIndex == null) return null;
    const cacheKey = frameIndex + ':' + transform;
    if (!frameCache.has(cacheKey)) {
      frameCache.set(cacheKey, composeFrame(data.metadata, data.image, frameIndex, transform));
    }
    return frameCache.get(cacheKey);
  }
  function drawAtlasFallback() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    const parts = [
      { type: 'head', label: 'ĐẦU' },
      { type: 'body', label: 'THÂN' },
      { type: 'leg', label: 'CHÂN' },
    ];
    const top = 42;
    const bottom = 310;
    const gap = 8;
    const panelWidth = (canvas.width - 36 - gap * 2) / 3;
    context.textAlign = 'center';
    context.fillStyle = '#f0d49a';
    context.font = 'bold 12px sans-serif';
    context.fillText('THƯ VIỆN BỘ PHẬN NHÂN VẬT GỐC', canvas.width / 2, 22);

    parts.forEach((part, index) => {
      const x = 18 + index * (panelWidth + gap);
      const image = atlasImages.get(part.type);
      const selected = atlasType === part.type;
      context.fillStyle = selected ? '#49382f' : '#211b20';
      context.fillRect(x, top, panelWidth, bottom - top);
      context.strokeStyle = selected ? '#e3c17d' : '#705638';
      context.lineWidth = selected ? 2 : 1;
      context.strokeRect(x, top, panelWidth, bottom - top);
      context.fillStyle = selected ? '#ffe0a0' : '#cdb58b';
      context.font = 'bold 10px sans-serif';
      context.fillText(part.label + ' · ' + selectedAtlasIds[part.type], x + panelWidth / 2, top + 17);
      if (!image) {
        context.fillStyle = '#c6ad82';
        context.font = '9px sans-serif';
        context.fillText('Đang tải…', x + panelWidth / 2, top + 140);
        return;
      }
      const maxWidth = panelWidth - 12;
      const maxHeight = bottom - top - 42;
      const scale = Math.min(2.4, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, x + (panelWidth - width) / 2, top + 28 + (maxHeight - height) / 2,
        width, height);
    });

    context.fillStyle = '#bba989';
    context.font = '9px sans-serif';
    context.fillText('ATLAS GỐC · CHƯA CÓ BẢNG TỌA ĐỘ GHÉP FRAME', canvas.width / 2, 336);
    empty.hidden = true;
    stageTag.textContent = 'THƯ VIỆN ATLAS GỐC · OFFLINE';
    atlasControls.hidden = false;
    atlasOverview.hidden = false;
    stateControls.hidden = true;
    directionButton.hidden = true;
  }

  function selectAtlasType(type) {
    if (!['head', 'body', 'leg'].includes(type)) return;
    atlasType = type;
    const select = atlasSelects.find(item => item.dataset.atlasPart === type);
    if (select && select.value !== selectedAtlasIds[type]) select.value = selectedAtlasIds[type];
    drawAtlasFallback();
  }

  // The three panels in the canvas are directly selectable, so the user can
  // inspect a part without having to target the small native select control.
  canvas.addEventListener('click', event => {
    if (data || !atlasCatalog.length) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width) return;
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const panelWidth = (canvas.width - 36 - 16) / 3;
    const index = Math.floor((x - 18) / (panelWidth + 8));
    if (index >= 0 && index < 3) selectAtlasType(['head', 'body', 'leg'][index]);
  });

  async function inspectPartMetadata(entry, token) {
    if (!metadataPanel || !metadataStatus || !metadataPreview) return;
    metadataPanel.hidden = false;
    metadataStatus.textContent = 'Đang đọc metadata ' + entry.partType + '/' + entry.partId + '…';
    metadataPreview.textContent = '';
    if (metadataStructure) metadataStructure.textContent = '';
    if (typeof entry.metadata !== 'string') {
      metadataStatus.textContent = 'Manifest không khai báo file metadata cho bộ phận này.';
      return;
    }
    const url = assetUrl(entry.metadata);
    if (!url) {
      metadataStatus.textContent = 'Đường dẫn metadata không hợp lệ.';
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (disposed || token !== atlasLoadTokens[entry.partType]
        || selectedAtlasIds[entry.partType] !== entry.partId) return;
      const hex = [];
      for (let offset = 0; offset < bytes.length; offset += 16) {
        const line = [...bytes.subarray(offset, offset + 16)]
          .map(value => value.toString(16).padStart(2, '0')).join(' ');
        hex.push(offset.toString(16).padStart(4, '0') + '  ' + line);
      }
      const ascii = [...bytes].map(value => value >= 32 && value <= 126
        ? String.fromCharCode(value) : '.').join('');
      let parserReport;
      try {
        const decoded = decodeCharacterPartData(bytes);
        parserReport = 'TƯƠNG THÍCH partData: ' + decoded.regionCount + ' vùng atlas, '
          + decoded.frameCount + ' frame, '
          + decoded.animationSequences.filter(sequence => sequence.length).length
          + '/8 chuỗi animation có dữ liệu.';
      } catch (error) {
        parserReport = 'KHÔNG tương thích định dạng partData của client: ' + error.message
          + '. Đây là trailer metadata nhúng trong resource ảnh; không thể dùng trực tiếp '
          + 'để ghép frame theo parser opcode 1.';
      }
      metadataStatus.textContent = 'File: ' + entry.metadata + ' · ' + bytes.length
        + ' byte · Đã hiển thị toàn bộ nội dung hex.';
      if (metadataStructure) {
        metadataStructure.textContent = parserReport + '\nASCII: '
          + (ascii.slice(0, 160) || '(rỗng)') + (ascii.length > 160 ? '…' : '');
      }
      metadataPreview.textContent = hex.join('\n') || '(file rỗng)';
    } catch (error) {
      if (disposed || token !== atlasLoadTokens[entry.partType]) return;
      metadataStatus.textContent = 'Không đọc được metadata: ' + error.message;
    }
  }

  function loadAtlas(type, id) {
    selectedAtlasIds[type] = id;
    const entry = atlasCatalog.find(item => item.partType === type && item.partId === id);
    if (!entry) return;
    const token = ++atlasLoadTokens[type];
    inspectPartMetadata(entry, token);
    const image = new Image();
    image.onload = () => {
      // Each part selector has its own request sequence. A slow response for
      // an older selection must never overwrite the image currently selected.
      if (disposed || token !== atlasLoadTokens[type] || selectedAtlasIds[type] !== id) return;
      atlasImages.set(type, image);
      if (atlasOverviewImages[type]) atlasOverviewImages[type].src = url;
      if (!data) drawAtlasFallback();
    };
    image.onerror = () => {
      if (disposed || token !== atlasLoadTokens[type] || selectedAtlasIds[type] !== id) return;
      empty.textContent = 'Không tải được atlas gốc: ' + entry.image;
      empty.hidden = false;
    };
    const url = assetUrl(entry.image);
    if (!url) {
      empty.textContent = 'Đường dẫn atlas không hợp lệ: ' + entry.image;
      empty.hidden = false;
      return;
    }
    image.src = url;
  }

  function initializeAtlasFallback() {
    loadAssetManifest().then(manifest => {
      if (disposed) return;
      atlasCatalog = characterPartEntries(manifest);
      if (metadataCorpus) {
        const analysis = manifest.characterMetadataAnalysis;
        const groups = analysis?.groups ?? {};
        metadataCorpus.textContent = ['head', 'body', 'leg'].map(type => {
          const group = groups[type];
          return type.toUpperCase() + ': ' + (group
            ? group.count + ' bộ · trung bình ' + group.averageBytes + ' byte · '
              + group.simpleRegionHeaderCandidateCount + ' bộ đủ độ dài cho header giả định'
            : 'không có dữ liệu');
        }).join(' | ') + (analysis?.method ? '. ' + analysis.method : '');
      }
      for (const type of ['head', 'body', 'leg']) {
        const entries = atlasCatalog.filter(item => item.partType === type)
          .sort((a, b) => Number(a.partId) - Number(b.partId));
        const select = atlasSelects.find(item => item.dataset.atlasPart === type);
        if (!entries.length || !select) continue;
        select.innerHTML = entries.map(item =>
          '<option value="' + item.partId + '">' + item.partId + '</option>'
        ).join('');
        select.value = selectedAtlasIds[type];
        select.addEventListener('change', () => loadAtlas(type, select.value));
      select.addEventListener('focus', () => selectAtlasType(type));
      select.addEventListener('pointerdown', () => selectAtlasType(type));
      const overviewImage = atlasOverviewImages[type];
      overviewImage?.addEventListener('click', () => selectAtlasType(type));
      overviewImage?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectAtlasType(type);
        }
      });
      if (overviewImage) {
        overviewImage.tabIndex = 0;
        overviewImage.setAttribute('role', 'button');
        overviewImage.setAttribute('aria-label', 'Chọn atlas ' + type);
      }
        loadAtlas(type, select.value);
      }
      if (!data) drawAtlasFallback();
    }).catch(error => {
      empty.textContent = 'Chưa tìm thấy atlas nhân vật. Hãy chạy npm run extract:assets với KPAH_278.jar. (' + error.message + ')';
      empty.hidden = false;
    });
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!data) {
      if (atlasCatalog.length) drawAtlasFallback();
      else empty.hidden = false;
      return;
    }
    atlasControls.hidden = true;
    atlasOverview.hidden = true;
    stateControls.hidden = false;
    directionButton.hidden = false;
    const frame = getFrame();
    if (!frame) {
      empty.textContent = 'Không có frame cho trạng thái hoạt ảnh đang chọn trong dữ liệu gốc.';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    stageTag.textContent = 'NHÂN VẬT GỐC · ĐÃ GHÉP FRAME';
    const scale = Math.min(3.1, 270 / frame.canvas.width, 290 / frame.canvas.height);
    const width = frame.canvas.width * scale;
    const height = frame.canvas.height * scale;
    context.imageSmoothingEnabled = false;
    // Frame bounds are offsets from the character's world anchor. Center
    // that anchor in the preview instead of centering the cropped bitmap;
    // otherwise poses with asymmetric limbs visibly jump between frames.
    context.drawImage(frame.canvas,
      canvas.width / 2 + frame.minX * scale,
      canvas.height / 2 + frame.minY * scale + 12,
      width, height);
  }
  function tick(time) {
    if (disposed) return;
    if (lastTime) accumulator += Math.min(100, time - lastTime);
    lastTime = time;
    if (data && !data.playback && accumulator >= 40) {
      const ticks = Math.min(4, Math.floor(accumulator / 40));
      accumulator %= 40;
      const sequenceIndex = data.metadata.getSequenceIndex(direction, state);
      const sequence = sequenceIndex == null ? [] : data.metadata.animationSequences[sequenceIndex] ?? [];
      if (sequence.length) {
        cursor += ticks;
        if (state === 3 && cursor >= sequence.length) setState(0);
        else cursor %= sequence.length;
      }
      draw();
    }
    raf = requestAnimationFrame(tick);
  }
  stateButtons.forEach(button => button.addEventListener('click', () => setState(Number(button.dataset.stageState))));
  directionButton.addEventListener('click', () => {
    transform = transform === 0 ? 2 : 0;
    cursor = 0;
    directionButton.textContent = transform === 0 ? '↔ Lật trái/phải' : '↔ Lật trái/phải';
    frameCache.clear();
    draw();
  });
  root.querySelector('[data-stage-connect]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('kpah:open-window', { detail: { key: 'connection' } }));
  });
  const onData = next => {
    data = next;
    frameCache.clear();
    if (data?.playback) {
      state = data.playback.state;
      direction = data.playback.direction;
      transform = data.playback.transform;
      cursor = data.playback.frameCursor;
      stateButtons.forEach(button => button.classList.toggle('selected', Number(button.dataset.stageState) === state));
      stateControls.hidden = true;
      directionButton.hidden = true;
      stageTag.textContent = 'NHÂN VẬT GỐC · ĐỒNG BỘ MÁY CHỦ';
      root.querySelector('.original-character-stage__caption').textContent =
        'Hoạt ảnh nhân vật gốc đang đồng bộ trực tiếp với trạng thái di chuyển và chiến đấu từ máy chủ KPAH.';
    } else {
      cursor = 0;
      stateControls.hidden = false;
      directionButton.hidden = false;
      root.querySelector('.original-character-stage__caption').textContent =
        'Hoạt ảnh gốc từ dữ liệu partData của máy chủ; có thể chọn đứng, di chuyển hoặc ra đòn để kiểm tra.';
    }
    draw();
  };
  subscribers.add(onData);
  onData(data);
  if (!data) initializeAtlasFallback();
  raf = requestAnimationFrame(tick);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    subscribers.delete(onData);
    root.replaceChildren();
    root.classList.remove('original-character-stage');
  };
}
