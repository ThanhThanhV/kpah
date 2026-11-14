import { assetUrl, characterPartEntries, loadAssetManifest } from './kpah-assets.js';

const TYPES = ['head', 'body', 'leg'];
const LABELS = { head: 'Đầu', body: 'Thân', leg: 'Chân' };
const PRESETS = {
  head: { x: 142, y: 18, scale: 1 },
  body: { x: 132, y: 92, scale: 1 },
  leg: { x: 132, y: 174, scale: 1 },
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function mountCharacterComposer(root) {
  if (!root) return () => {};
  root.innerHTML = `
    <div class="character-composer__layout">
      <section class="character-composer__source">
        <div class="character-composer__bar">
          <label>Bộ phận <select data-composer-type><option value="head">Đầu</option><option value="body" selected>Thân</option><option value="leg">Chân</option></select></label>
          <label>Mẫu ảnh <select data-composer-id></select></label>
          <button type="button" data-composer-add disabled>Lấy vùng đã chọn</button>
        </div>
        <canvas data-composer-atlas width="480" height="260" aria-label="Chọn vùng sprite trên atlas"></canvas>
        <p>Kéo chuột trên atlas để khoanh đúng một mảnh nhân vật, sau đó bấm “Lấy vùng đã chọn”.</p>
      </section>
      <section class="character-composer__result">
        <div class="character-composer__bar">
          <strong>Nhân vật tự ghép</strong>
          <button type="button" data-composer-export>Xuất tọa độ JSON</button>
        </div>
        <canvas data-composer-preview width="320" height="320" aria-label="Nhân vật đang được ghép"></canvas>
        <div class="character-composer__layers" data-composer-layers></div>
        <p>Kéo trực tiếp từng mảnh trên khung xem trước để căn vị trí. Dữ liệu ghép được lưu trong trình duyệt.</p>
      </section>
    </div>`;
  const typeSelect = root.querySelector('[data-composer-type]');
  const idSelect = root.querySelector('[data-composer-id]');
  const atlasCanvas = root.querySelector('[data-composer-atlas]');
  const atlasContext = atlasCanvas.getContext('2d');
  const previewCanvas = root.querySelector('[data-composer-preview]');
  const previewContext = previewCanvas.getContext('2d');
  const addButton = root.querySelector('[data-composer-add]');
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
          });
          controls.append(input);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Bỏ';
        remove.addEventListener('click', () => { layers.delete(type); renderLayers(); drawPreview(); });
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
    addButton.disabled = true;
    drawAtlas();
    if (!atlasEntry) return;
    const image = new Image();
    image.onload = () => {
      if (disposed || atlasEntry?.image !== image.dataset.source) return;
      atlasImage = image;
      images.set(type + ':' + id, image);
      drawAtlas();
    };
    image.dataset.source = atlasEntry.image;
    image.onerror = () => { atlasContext.fillStyle = '#ffb6a0'; atlasContext.fillText('Không tải được atlas: ' + atlasEntry.image, 12, 22); };
    image.src = assetUrl(atlasEntry.image);
  }

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
  previewCanvas.addEventListener('pointerup', () => { moveOffset = null; renderLayers(); drawPreview(); });
  typeSelect.addEventListener('change', fillIds);
  idSelect.addEventListener('change', loadSelectedAtlas);
  root.querySelector('[data-composer-export]').addEventListener('click', () => {
    const config = {
      format: 'kpah-manual-character-composition-v1',
      canvas: { width: 320, height: 320 },
      parts: Object.fromEntries([...layers.entries()].map(([type, layer]) => [type, {
        partId: layer.partId, source: layer.source, crop: layer.crop,
        x: layer.x, y: layer.y, scale: layer.scale,
      }])),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kpah-character-composition.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });

  loadAssetManifest().then(manifest => {
    if (disposed) return;
    catalog = characterPartEntries(manifest);
    fillIds();
  }).catch(error => {
    atlasContext.fillStyle = '#ffb6a0';
    atlasContext.font = '11px sans-serif';
    atlasContext.fillText('Không tải được manifest atlas: ' + error.message, 12, 24);
  });
  drawPreview();
  return () => { disposed = true; root.replaceChildren(); };
}
