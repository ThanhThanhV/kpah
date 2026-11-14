import { assetUrl, characterPartEntries, loadAssetManifest } from './kpah-assets.js';

const TYPES = ['head', 'body', 'leg'];
const LABELS = { head: 'Đầu', body: 'Thân', leg: 'Chân' };
const PRESETS = {
  head: { x: 142, y: 18, scale: 1 },
  body: { x: 132, y: 92, scale: 1 },
  leg: { x: 132, y: 174, scale: 1 },
};
const STARTER_PARTS = {
  head: { partId: '0', crop: { x: 28, y: 0, width: 19, height: 24 }, x: 131, y: 10, scale: 3 },
  body: { partId: '1', crop: { x: 60, y: 0, width: 24, height: 24 }, x: 120, y: 68, scale: 3 },
  leg: { partId: '1', crop: { x: 74, y: 0, width: 19, height: 37 }, x: 131, y: 128, scale: 3 },
};
const AUTO_LAYOUT = {
  head: { top: 20, maxWidth: 76, maxHeight: 76 },
  body: { top: 94, maxWidth: 112, maxHeight: 122 },
  leg: { top: 216, maxWidth: 112, maxHeight: 94 },
};


export function createStarterCharacterComposition() {
  return {
    format: 'kpah-manual-character-composition-v1',
    canvas: { width: 320, height: 320 },
    parts: Object.fromEntries(TYPES.map(type => {
      const part = STARTER_PARTS[type];
      return [type, {
        partId: part.partId,
        source: 'character-parts/' + type + '/' + part.partId + '.png',
        crop: { ...part.crop },
        x: part.x, y: part.y, scale: part.scale,
      }];
    })),
  };
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function mountCharacterComposer(root) {
  if (!root) return () => {};
  root.innerHTML = `
    <div class="character-composer__layout">
      <section class="character-composer__source">
        <div class="character-composer__bar">
          <label>Bộ phận <select data-composer-type><option value="head">Đầu</option><option value="body" selected>Thân</option><option value="leg">Chân</option></select></label>
          <label>Mẫu ảnh <select data-composer-id></select></label>
          <button type="button" data-composer-detect>Tự tìm mảnh ảnh</button>
          <select data-composer-candidate aria-label="Mảnh ảnh phát hiện được" disabled><option value="">Chưa quét atlas</option></select>
          <button type="button" data-composer-add disabled>Lấy vùng đã chọn</button>
        </div>
        <canvas data-composer-atlas width="480" height="260" aria-label="Chọn vùng sprite trên atlas"></canvas>
        <p>Kéo chuột trên atlas để khoanh đúng một mảnh nhân vật, sau đó bấm “Lấy vùng đã chọn”.</p>
      </section>
      <section class="character-composer__result">
        <div class="character-composer__bar">
          <strong>Nhân vật tự ghép</strong>
          <button type="button" data-composer-starter>Tạo lại nhân vật mẫu KPAH</button>
          <button type="button" data-composer-save>Lưu bản ghép</button>
          <button type="button" data-composer-import-trigger>Nhập JSON</button>
          <input type="file" data-composer-import accept="application/json,.json" hidden>
          <button type="button" data-composer-export>Xuất tọa độ JSON</button>
        </div>
        <canvas data-composer-preview width="320" height="320" aria-label="Nhân vật đang được ghép"></canvas>
        <p data-composer-autodraft-status>Đang ghép nhân vật mẫu từ atlas KPAH gốc…</p>
        <div class="character-composer__layers" data-composer-layers></div>
        <p>Kéo trực tiếp từng mảnh trên khung xem trước để căn vị trí. Có thể xuất cấu hình tọa độ JSON để lưu và dùng lại.</p>
      </section>
    </div>`;
  const typeSelect = root.querySelector('[data-composer-type]');
  const idSelect = root.querySelector('[data-composer-id]');
  const atlasCanvas = root.querySelector('[data-composer-atlas]');
  const atlasContext = atlasCanvas.getContext('2d');
  const previewCanvas = root.querySelector('[data-composer-preview]');
  const previewContext = previewCanvas.getContext('2d');
  const addButton = root.querySelector('[data-composer-add]');
  const detectButton = root.querySelector('[data-composer-detect]');
  const candidateSelect = root.querySelector('[data-composer-candidate]');
  let detectedRegions = [];
  const layerList = root.querySelector('[data-composer-layers]');
  const images = new Map();
  const layers = new Map();
  let catalog = [];
  let atlasImage = null;
  let atlasEntry = null;
  let atlasFit = null;
  let dragStart = null;
  let selection = null;
  let movingType = null;
  let moveOffset = null;
  let disposed = false;
  const STORAGE_KEY = 'kpah.character-composition.v2';
  let restoreAttempted = false;

  function drawAtlas() {
    atlasContext.clearRect(0, 0, 480, 260);
    atlasContext.fillStyle = '#17141b';
    atlasContext.fillRect(0, 0, 480, 260);
    if (!atlasImage) {
      atlasContext.fillStyle = '#d8c49f';
      atlasContext.font = '12px sans-serif';
      atlasContext.fillText('Đang tải atlas…', 16, 24);
      return;
    }
    const scale = Math.min(460 / atlasImage.naturalWidth, 240 / atlasImage.naturalHeight);
    const width = atlasImage.naturalWidth * scale;
    const height = atlasImage.naturalHeight * scale;
    const x = (480 - width) / 2;
    const y = (260 - height) / 2;
    atlasFit = { x, y, scale };
    atlasContext.imageSmoothingEnabled = false;
    atlasContext.drawImage(atlasImage, x, y, width, height);
    if (selection) {
      atlasContext.strokeStyle = '#ffe08a';
      atlasContext.lineWidth = 2;
      atlasContext.strokeRect(selection.x, selection.y, selection.width, selection.height);
      atlasContext.fillStyle = '#ffe08a33';
      atlasContext.fillRect(selection.x, selection.y, selection.width, selection.height);
    }
  }

  function drawPreview() {
    previewContext.clearRect(0, 0, 320, 320);
    previewContext.fillStyle = '#211b20';
    previewContext.fillRect(0, 0, 320, 320);
    previewContext.strokeStyle = '#594632';
    previewContext.strokeRect(159, 0, 1, 320);
    previewContext.strokeRect(0, 280, 320, 1);
    for (const type of ['leg', 'body', 'head']) {
      const layer = layers.get(type);
      if (!layer) continue;
      previewContext.imageSmoothingEnabled = false;
      previewContext.drawImage(layer.image, 0, 0, layer.image.naturalWidth, layer.image.naturalHeight,
        layer.x, layer.y, layer.width * layer.scale, layer.height * layer.scale);
      if (type === movingType) {
        previewContext.strokeStyle = '#ffe08a';
        previewContext.strokeRect(layer.x, layer.y, layer.width * layer.scale, layer.height * layer.scale);
      }
    }
  }

  function compositionConfig() {
    return {
      format: 'kpah-manual-character-composition-v1',
      canvas: { width: 320, height: 320 },
      parts: Object.fromEntries([...layers.entries()].map(([type, layer]) => [type, {
        partId: layer.partId, source: layer.source, crop: layer.crop,
        x: layer.x, y: layer.y, scale: layer.scale,
      }])),
    };
  }

  function saveComposition(showStatus = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compositionConfig()));
      window.dispatchEvent(new CustomEvent('kpah:character-composition-updated'));
      if (showStatus) {
        const button = root.querySelector('[data-composer-save]');
        if (button) {
          const previous = button.textContent;
          button.textContent = 'Đã lưu trên máy này';
          button.disabled = true;
          window.setTimeout(() => {
            if (!disposed && button.isConnected) {
              button.textContent = previous;
              button.disabled = false;
            }
          }, 1400);
        }
      }
      return true;
    } catch (error) {
      console.warn('Không thể lưu cấu hình nhân vật KPAH:', error);
      return false;
    }
  }

  async function restoreComposition(config) {
    if (!config || config.format !== 'kpah-manual-character-composition-v1' || !config.parts) {
      throw new Error('Sai định dạng cấu hình nhân vật.');
    }
    const restored = new Map();
    for (const type of TYPES) {
      const part = config.parts[type];
      if (!part) continue;
      const entry = catalog.find(item => item.partType === type && item.partId === String(part.partId));
      const cropData = part.crop;
      if (!entry || !cropData || ![cropData.x, cropData.y, cropData.width, cropData.height, part.x, part.y, part.scale].every(Number.isFinite)
        || cropData.width < 1 || cropData.height < 1 || part.scale <= 0) continue;
      const image = new Image();
      image.src = assetUrl(entry.image);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Không tải được atlas ' + entry.image));
      });
      if (disposed) return;
      const x = Math.max(0, Math.floor(cropData.x));
      const y = Math.max(0, Math.floor(cropData.y));
      const width = Math.min(Math.floor(cropData.width), image.naturalWidth - x);
      const height = Math.min(Math.floor(cropData.height), image.naturalHeight - y);
      if (width < 1 || height < 1) continue;
      const crop = document.createElement('canvas');
      crop.width = width; crop.height = height;
      crop.getContext('2d').drawImage(image, x, y, width, height, 0, 0, width, height);
      const partImage = new Image();
      partImage.src = crop.toDataURL('image/png');
      await new Promise((resolve, reject) => {
        partImage.onload = resolve;
        partImage.onerror = reject;
      });
      restored.set(type, {
        type, partId: String(part.partId), source: entry.image,
        crop: { x, y, width, height }, image: partImage, width, height,
        x: part.x, y: part.y, scale: clamp(part.scale, 0.1, 5),
      });
    }
    if (disposed) return;
    layers.clear();
    for (const [type, layer] of restored) layers.set(type, layer);
    renderLayers();
    drawPreview();
  }

  function renderLayers() {
    layerList.innerHTML = '';
    for (const type of TYPES) {
      const layer = layers.get(type);
      const row = document.createElement('div');
      row.className = 'character-composer__layer';
      const title = document.createElement('strong');
      title.textContent = LABELS[type] + (layer ? ' · ' + layer.partId : ' · Chưa chọn');
      const controls = document.createElement('div');
      if (layer) {
        for (const [label, key, step] of [['X', 'x', 1], ['Y', 'y', 1], ['Tỷ lệ', 'scale', 0.05]]) {
          const input = document.createElement('input');
          input.type = 'number';
          input.step = String(step);
          input.value = String(layer[key]);
          input.setAttribute('aria-label', LABELS[type] + ' ' + label);
          input.addEventListener('change', () => {
            const value = Number(input.value);
            if (!Number.isFinite(value)) return;
            layer[key] = key === 'scale' ? clamp(value, 0.1, 5) : clamp(value, -320, 640);
            drawPreview();
            saveComposition();
          });
          controls.append(input);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Bỏ';
        remove.addEventListener('click', () => { layers.delete(type); renderLayers(); drawPreview(); saveComposition(); });
        controls.append(remove);
      }
      row.append(title, controls);
      layerList.append(row);
    }
  }

  async function loadSelectedAtlas() {
    const type = typeSelect.value;
    const id = idSelect.value;
    atlasEntry = catalog.find(item => item.partType === type && item.partId === id) ?? null;
    atlasImage = null;
    selection = null;
    detectedRegions = [];
    candidateSelect.innerHTML = '<option value="">Đang tải atlas…</option>';
    candidateSelect.disabled = true;
    addButton.disabled = true;
    drawAtlas();
    if (!atlasEntry) return;
    const image = new Image();
    image.onload = () => {
      if (disposed || atlasEntry?.image !== image.dataset.source) return;
      atlasImage = image;
      images.set(type + ':' + id, image);
      drawAtlas();
      detectTransparentRegions();
    };
    image.dataset.source = atlasEntry.image;
    image.onerror = () => { atlasContext.fillStyle = '#ffb6a0'; atlasContext.fillText('Không tải được atlas: ' + atlasEntry.image, 12, 22); };
    image.src = assetUrl(atlasEntry.image);
  }


  function scanTransparentRegions(image) {
    const scan = document.createElement('canvas');
    scan.width = image.naturalWidth;
    scan.height = image.naturalHeight;
    const scanContext = scan.getContext('2d', { willReadFrequently: true });
    scanContext.drawImage(image, 0, 0);
    const pixels = scanContext.getImageData(0, 0, scan.width, scan.height).data;
    const width = scan.width, height = scan.height, total = width * height;
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    const regions = [];
    for (let start = 0; start < total; start++) {
      if (visited[start]) continue;
      visited[start] = 1;
      if (pixels[start * 4 + 3] < 8) continue;
      let head = 0, tail = 0;
      queue[tail++] = start;
      let minX = width, minY = height, maxX = -1, maxY = -1, area = 0;
      while (head < tail) {
        const point = queue[head++];
        const x = point % width, y = Math.floor(point / width);
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); area++;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const nx = x + ox, ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (visited[next]) continue;
          visited[next] = 1;
          if (pixels[next * 4 + 3] >= 8) queue[tail++] = next;
        }
      }
      const boxWidth = maxX - minX + 1, boxHeight = maxY - minY + 1;
      if (area >= 10 && boxWidth >= 3 && boxHeight >= 3) {
        regions.push({ x: minX, y: minY, width: boxWidth, height: boxHeight, area });
      }
    }
    return regions.sort((a, b) => b.area - a.area);
  }

  function detectTransparentRegions() {
    if (!atlasImage) return;
    try { detectedRegions = scanTransparentRegions(atlasImage); }
    catch (error) {
      candidateSelect.innerHTML = '<option value="">Không đọc được alpha của atlas</option>';
      candidateSelect.disabled = true;
      return;
    }
    candidateSelect.innerHTML = '';
    detectedRegions.forEach((region, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = '#' + (index + 1) + ' · ' + region.width + '×' + region.height
        + ' · (' + region.x + ',' + region.y + ')';
      candidateSelect.append(option);
    });
    candidateSelect.disabled = !detectedRegions.length;
    if (!detectedRegions.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Không tìm thấy vùng alpha tách biệt';
      candidateSelect.append(option);
    } else {
      candidateSelect.dispatchEvent(new Event('change'));
    }
  }

  async function autoComposeFirstDraft() {
    const draft = new Map();
    for (const type of TYPES) {
      const preset = STARTER_PARTS[type];
      const entry = catalog.find(item => item.partType === type && item.partId === preset.partId);
      if (!entry) continue;
      const image = new Image();
      image.src = assetUrl(entry.image);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Không tải được ' + entry.image));
      });
      if (disposed) return;
      const cropData = preset.crop;
      const x = Math.max(0, cropData.x), y = Math.max(0, cropData.y);
      const width = Math.min(cropData.width, image.naturalWidth - x);
      const height = Math.min(cropData.height, image.naturalHeight - y);
      if (width < 1 || height < 1) continue;
      const crop = document.createElement('canvas');
      crop.width = width; crop.height = height;
      crop.getContext('2d').drawImage(image, x, y, width, height, 0, 0, width, height);
      const croppedImage = new Image();
      croppedImage.src = crop.toDataURL('image/png');
      await new Promise((resolve, reject) => {
        croppedImage.onload = resolve;
        croppedImage.onerror = reject;
      });
      if (disposed) return;
      draft.set(type, {
        type, partId: entry.partId, source: entry.image,
        crop: { x, y, width, height }, image: croppedImage, width, height,
        x: preset.x, y: preset.y, scale: preset.scale,
      });
    }
    if (disposed || draft.size !== TYPES.length) {
      const note = root.querySelector('[data-composer-autodraft-status]');
      if (note) note.textContent = 'Không tìm đủ atlas đầu, thân và chân mặc định trong JAR.';
      return;
    }
    layers.clear();
    for (const [type, layer] of draft) layers.set(type, layer);
    renderLayers();
    drawPreview();
    saveComposition();
    const note = root.querySelector('[data-composer-autodraft-status]');
    if (note) note.textContent = 'Đã ghép nhân vật mẫu từ atlas gốc: đầu 0, thân 1, chân 1. Kéo từng phần để căn chỉnh; thay đổi được lưu tự động.';
  }

  async function resetStarterCharacter() {
    layers.clear();
    await autoComposeFirstDraft();
  }

  candidateSelect.addEventListener('change', () => {
    const region = detectedRegions[Number(candidateSelect.value)];
    if (!region || !atlasFit) return;
    selection = {
      x: atlasFit.x + region.x * atlasFit.scale,
      y: atlasFit.y + region.y * atlasFit.scale,
      width: region.width * atlasFit.scale,
      height: region.height * atlasFit.scale,
    };
    addButton.disabled = false;
    drawAtlas();
  });
  detectButton.addEventListener('click', detectTransparentRegions);

  function fillIds() {
    const type = typeSelect.value;
    const entries = catalog.filter(item => item.partType === type)
      .sort((a, b) => Number(a.partId) - Number(b.partId));
    idSelect.innerHTML = '';
    for (const item of entries) {
      const option = document.createElement('option');
      option.value = item.partId;
      option.textContent = item.partId;
      idSelect.append(option);
    }
    loadSelectedAtlas();
  }

  function pointerOnAtlas(event) {
    const bounds = atlasCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * atlasCanvas.width / bounds.width,
      y: (event.clientY - bounds.top) * atlasCanvas.height / bounds.height,
    };
  }
  atlasCanvas.addEventListener('pointerdown', event => {
    if (!atlasFit || !atlasImage) return;
    dragStart = pointerOnAtlas(event);
    selection = { x: dragStart.x, y: dragStart.y, width: 0, height: 0 };
    atlasCanvas.setPointerCapture(event.pointerId);
    drawAtlas();
  });
  atlasCanvas.addEventListener('pointermove', event => {
    if (!dragStart || !atlasFit) return;
    const point = pointerOnAtlas(event);
    const x = clamp(Math.min(dragStart.x, point.x), atlasFit.x, atlasFit.x + atlasImage.naturalWidth * atlasFit.scale);
    const y = clamp(Math.min(dragStart.y, point.y), atlasFit.y, atlasFit.y + atlasImage.naturalHeight * atlasFit.scale);
    const right = clamp(Math.max(dragStart.x, point.x), atlasFit.x, atlasFit.x + atlasImage.naturalWidth * atlasFit.scale);
    const bottom = clamp(Math.max(dragStart.y, point.y), atlasFit.y, atlasFit.y + atlasImage.naturalHeight * atlasFit.scale);
    selection = { x, y, width: right - x, height: bottom - y };
    drawAtlas();
  });
  atlasCanvas.addEventListener('pointerup', () => {
    dragStart = null;
    addButton.disabled = !selection || selection.width < 3 || selection.height < 3;
  });
  addButton.addEventListener('click', () => {
    if (!selection || !atlasImage || !atlasEntry || !atlasFit) return;
    const sx = Math.round((selection.x - atlasFit.x) / atlasFit.scale);
    const sy = Math.round((selection.y - atlasFit.y) / atlasFit.scale);
    const sw = Math.round(selection.width / atlasFit.scale);
    const sh = Math.round(selection.height / atlasFit.scale);
    if (sw < 1 || sh < 1) return;
    const crop = document.createElement('canvas');
    crop.width = sw; crop.height = sh;
    crop.getContext('2d').drawImage(atlasImage, sx, sy, sw, sh, 0, 0, sw, sh);
    const image = new Image();
    image.onload = () => {
      const type = typeSelect.value;
      const preset = PRESETS[type];
      layers.set(type, { type, partId: atlasEntry.partId, source: atlasEntry.image,
        crop: { x: sx, y: sy, width: sw, height: sh },
        image, width: sw, height: sh, ...preset });
      movingType = type;
      renderLayers();
      drawPreview();
      saveComposition();
    };
    image.src = crop.toDataURL('image/png');
  });
  previewCanvas.addEventListener('pointerdown', event => {
    const bounds = previewCanvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * 320 / bounds.width;
    const y = (event.clientY - bounds.top) * 320 / bounds.height;
    for (const type of ['head', 'body', 'leg']) {
      const layer = layers.get(type);
      if (layer && x >= layer.x && x <= layer.x + layer.width * layer.scale
        && y >= layer.y && y <= layer.y + layer.height * layer.scale) {
        movingType = type;
        moveOffset = { x: x - layer.x, y: y - layer.y };
        previewCanvas.setPointerCapture(event.pointerId);
        drawPreview();
        return;
      }
    }
  });
  previewCanvas.addEventListener('pointermove', event => {
    if (!movingType || !moveOffset) return;
    const layer = layers.get(movingType);
    if (!layer) return;
    const bounds = previewCanvas.getBoundingClientRect();
    layer.x = Math.round((event.clientX - bounds.left) * 320 / bounds.width - moveOffset.x);
    layer.y = Math.round((event.clientY - bounds.top) * 320 / bounds.height - moveOffset.y);
    drawPreview();
  });
  previewCanvas.addEventListener('pointerup', () => { moveOffset = null; renderLayers(); drawPreview(); saveComposition(); });
  typeSelect.addEventListener('change', fillIds);
  idSelect.addEventListener('change', loadSelectedAtlas);
  root.querySelector('[data-composer-starter]').addEventListener('click', resetStarterCharacter);
  root.querySelector('[data-composer-save]').addEventListener('click', () => saveComposition(true));
  const importInput = root.querySelector('[data-composer-import]');
  root.querySelector('[data-composer-import-trigger]').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const config = JSON.parse(await file.text());
      await restoreComposition(config);
      saveComposition();
    } catch (error) {
      window.alert('Không thể nhập cấu hình: ' + error.message);
    } finally { importInput.value = ''; }
  });
  root.querySelector('[data-composer-export]').addEventListener('click', () => {
    const config = compositionConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kpah-character-composition.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });

  loadAssetManifest().then(async manifest => {
    if (disposed) return;
    catalog = characterPartEntries(manifest);
    fillIds();
    if (!restoreAttempted) {
      restoreAttempted = true;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { await restoreComposition(JSON.parse(saved)); }
        catch (error) { console.warn('Không thể khôi phục bản ghép đã lưu:', error); }
      }
      if (layers.size !== TYPES.length) {
        try { await resetStarterCharacter(); }
        catch (error) {
          console.warn('Không thể dựng nhân vật mẫu từ atlas gốc:', error);
          const note = root.querySelector('[data-composer-autodraft-status]');
          if (note) note.textContent = 'Không tải được bộ atlas mặc định. Hãy chạy npm run extract:assets rồi tải lại trang.';
        }
      }
    }
  }).catch(error => {
    atlasContext.fillStyle = '#ffb6a0';
    atlasContext.font = '11px sans-serif';
    atlasContext.fillText('Không tải được manifest atlas: ' + error.message, 12, 24);
  });
  drawPreview();
  return () => { disposed = true; root.replaceChildren(); };
}
