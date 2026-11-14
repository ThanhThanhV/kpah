import { assetUrl, characterPartEntries, loadAssetManifest } from './kpah-assets.js';

const subscribers = new Set();
let latestCharacterPart = null;
let latestKey = null;
let pendingKey = null;
let pendingRequest = 0;
let pendingPlayback = null;

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
  const key = String(partIndex) + ':' + imageBytes.length;
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
  if (key === pendingKey) {
    pendingPlayback = nextPlayback;
    return;
  }
  pendingKey = key;
  pendingPlayback = nextPlayback;
  const request = ++pendingRequest;
  const image = new Image();
  image.onload = () => {
    if (request !== pendingRequest || pendingKey !== key) return;
    latestKey = key;
    pendingKey = null;
    latestCharacterPart = { partIndex, metadata, image, playback: pendingPlayback };
    pendingPlayback = null;
    publish();
  };
  image.onerror = () => {
    if (request !== pendingRequest || pendingKey !== key) return;
    pendingKey = null;
    pendingPlayback = null;
    console.warn('KPAH character preview atlas could not be decoded', partIndex);
  };
  image.src = toDataUrl(imageBytes);
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
    </div>
    <div class="original-character-stage__atlas-controls" hidden>
      <label>Đầu <select data-atlas-part="head"></select></label>
      <label>Thân <select data-atlas-part="body"></select></label>
      <label>Chân <select data-atlas-part="leg"></select></label>
    </div>
    <div class="original-character-stage__caption">Atlas pixel gốc từ JAR. Khi có metadata frame từ máy chủ, sân khấu tự chuyển sang hoạt ảnh nhân vật hoàn chỉnh.</div>`;
  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const empty = root.querySelector('.original-character-stage__empty');
  const stateButtons = [...root.querySelectorAll('[data-stage-state]')];
  const stateControls = root.querySelector('.original-character-stage__states');
  const directionButton = root.querySelector('[data-stage-direction]');
  const atlasControls = root.querySelector('.original-character-stage__atlas-controls');
  const atlasSelects = [...root.querySelectorAll('[data-atlas-part]')];
  const atlasImages = new Map();
  const selectedAtlasIds = { head: '0', body: '0', leg: '0' };
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
    const groups = [
      { type: 'head', x: 8, width: 146, label: 'ĐẦU' },
      { type: 'body', x: 167, width: 146, label: 'THÂN' },
      { type: 'leg', x: 326, width: 146, label: 'CHÂN' },
    ];
    context.textAlign = 'center';
    context.font = 'bold 11px sans-serif';
    for (const group of groups) {
      context.fillStyle = '#f0d49a';
      context.fillText(group.label + ' · ' + selectedAtlasIds[group.type], group.x + group.width / 2, 25);
      const image = atlasImages.get(group.type);
      if (!image) {
        context.fillStyle = '#c6ad82';
        context.font = '9px sans-serif';
        context.fillText('Đang tải atlas…', group.x + group.width / 2, 175);
        continue;
      }
      const scale = Math.min(2.2, (group.width - 12) / image.naturalWidth, 235 / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, group.x + (group.width - width) / 2, 42 + (235 - height) / 2, width, height);
      context.strokeStyle = '#876b49';
      context.strokeRect(group.x + 2, 38, group.width - 4, 244);
    }
    context.fillStyle = '#bba989';
    context.font = '9px sans-serif';
    context.fillText('ẢNH ATLAS GỐC · CHƯA CÓ DỮ LIỆU GHÉP FRAME', canvas.width / 2, 315);
    empty.hidden = true;
    atlasControls.hidden = false;
    stateControls.hidden = true;
    directionButton.hidden = true;
  }

  function loadAtlas(type, id) {
    selectedAtlasIds[type] = id;
    const entry = atlasCatalog.find(item => item.partType === type && item.partId === id);
    if (!entry) return;
    const token = ++atlasLoadTokens[type];
    const image = new Image();
    image.onload = () => {
      // Each part selector has its own request sequence. A slow response for
      // an older selection must never overwrite the image currently selected.
      if (disposed || token !== atlasLoadTokens[type] || selectedAtlasIds[type] !== id) return;
      atlasImages.set(type, image);
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
    stateControls.hidden = false;
    directionButton.hidden = false;
    const frame = getFrame();
    if (!frame) {
      empty.textContent = 'Không có frame cho trạng thái hoạt ảnh đang chọn trong dữ liệu gốc.';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    const scale = Math.min(3.1, 270 / frame.canvas.width, 290 / frame.canvas.height);
    const width = frame.canvas.width * scale;
    const height = frame.canvas.height * scale;
    context.imageSmoothingEnabled = false;
    context.drawImage(frame.canvas,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2 + 12,
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
