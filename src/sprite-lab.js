import { assetUrl } from './kpah-assets.js';

const style = document.createElement('style');
style.textContent = `
.sprite-lab{display:grid;gap:9px;margin-top:14px;padding:10px;border:1px solid #66513b;background:#1b171e;color:#e8d8b8}
.sprite-lab h3{margin:0;color:#f0d28e;font-size:12px}
.sprite-lab-controls{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,64px);gap:6px}
.sprite-lab-mapping{display:grid;grid-template-columns:minmax(0,1fr) 90px 90px 90px;gap:6px}
.sprite-lab-mapping input,.sprite-lab-mapping select{min-width:0;width:100%;height:32px;padding:0 6px;background:#17141b;border:1px solid #66513b;color:#f0dfbd;font-size:10px}
.sprite-lab-mapping .wide{grid-column:1/-1}.sprite-lab-export{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sprite-lab-export pre{flex:1;min-width:180px;max-height:120px;overflow:auto;padding:8px;background:#121015;color:#cbbd9e;font:9px/1.5 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.sprite-lab select,.sprite-lab input{min-width:0;width:100%;height:32px;padding:0 6px;background:#17141b;border:1px solid #66513b;color:#f0dfbd;font-size:10px}
.sprite-lab-stage{min-height:180px;display:grid;place-items:center;background:repeating-conic-gradient(#302a2b 0% 25%,#211d22 0% 50%) 50%/16px 16px}
.sprite-lab-stage canvas{width:min(100%,320px);height:220px;object-fit:contain;image-rendering:pixelated}
.sprite-lab-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.sprite-lab button{padding:6px 10px;background:#403128;border:1px solid #8d7048;color:#f0d9ad;font-size:10px}
.sprite-lab input[type=range]{flex:1;min-width:90px}
.sprite-lab-meta{font-size:9px;color:#ad9c80;line-height:1.5}
@media(max-width:520px){.sprite-lab-controls{grid-template-columns:1fr 58px 58px 58px}.sprite-lab-mapping{grid-template-columns:1fr 1fr}.sprite-lab-stage canvas{height:180px}}
`;
document.head.append(style);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
}

export function renderSpriteLab(root, assets) {
  if (!root) return;
  const images = assets.filter(item => /\.png$/i.test(item.path || '') && assetUrl(item.output));
  if (!images.length) {
    root.innerHTML = '<div class="sprite-lab-meta">Không có PNG để phân tích sprite.</div>';
    return;
  }

  root.innerHTML = `
    <section class="sprite-lab">
      <h3>Phân tích sprite sheet</h3>
      <div class="sprite-lab-controls">
        <select id="sprite-asset" aria-label="Chọn ảnh sprite">${images.map((item,index) => `<option value="${index}">${escapeHtml(item.archive)} / ${escapeHtml(item.path)}</option>`).join('')}</select>
        <input id="sprite-cols" type="number" min="1" max="128" value="1" title="Số cột" aria-label="Số cột">
        <input id="sprite-rows" type="number" min="1" max="128" value="1" title="Số hàng" aria-label="Số hàng">
        <input id="sprite-fps" type="number" min="1" max="60" value="6" title="FPS" aria-label="FPS">
      </div>
      <div class="sprite-lab-mapping">
        <input id="sprite-animation-key" type="text" maxlength="64" value="kpah_preview" aria-label="Animation key" placeholder="Animation key">
        <input id="sprite-first-frame" type="number" min="0" value="0" aria-label="Frame đầu" title="Frame đầu">
        <input id="sprite-last-frame" type="number" min="0" value="0" aria-label="Frame cuối" title="Frame cuối">
        <select id="sprite-repeat" aria-label="Chế độ lặp"><option value="-1">Lặp vô hạn</option><option value="0">Chạy một lần</option></select>
        <input class="wide" id="sprite-frame-sequence" type="text" placeholder="Thứ tự frame tùy chỉnh, ví dụ: 0,2,1,3 (để trống = chạy liên tiếp)" aria-label="Thứ tự frame tùy chỉnh">
      </div>
      <div class="sprite-lab-stage"><canvas id="sprite-canvas" width="320" height="220"></canvas></div>
      <div class="sprite-lab-actions">
        <button type="button" id="sprite-prev">◀</button>
        <button type="button" id="sprite-play">Phát</button>
        <button type="button" id="sprite-next">▶</button>
        <input id="sprite-frame" type="range" min="0" max="0" value="0" aria-label="Frame">
        <span id="sprite-count">0 / 0</span>
      </div>
      <div class="sprite-lab-meta" id="sprite-meta">Chọn ảnh và nhập số hàng/cột để kiểm tra cách cắt frame. Chưa có mapping animation được giả định.</div>
      <div class="sprite-lab-export">
        <button type="button" id="sprite-export">Tạo mapping JSON</button>
        <button type="button" id="sprite-copy" disabled>Sao chép JSON</button>
        <pre id="sprite-mapping-output">Chưa tạo mapping.</pre>
      </div>
    </section>`;

  const $ = id => root.querySelector('#' + id);
  const imageSelect = $('sprite-asset');
  const colsInput = $('sprite-cols');
  const rowsInput = $('sprite-rows');
  const fpsInput = $('sprite-fps');
  const animationKeyInput = $('sprite-animation-key');
  const firstFrameInput = $('sprite-first-frame');
  const lastFrameInput = $('sprite-last-frame');
  const repeatInput = $('sprite-repeat');
  const frameSequenceInput = $('sprite-frame-sequence');
  const mappingOutput = $('sprite-mapping-output');
  const copyButton = $('sprite-copy');
  const slider = $('sprite-frame');
  const canvas = $('sprite-canvas');
  const ctx = canvas.getContext('2d');
  const count = $('sprite-count');
  const meta = $('sprite-meta');
  let image = new Image();
  let frame = 0;
  let timer = null;
  let frameWidth = 0;
  let frameHeight = 0;
  let total = 0;

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    $('sprite-play').textContent = 'Phát';
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (!image.complete || !image.naturalWidth || !total ||
        !Number.isInteger(frameWidth) || !Number.isInteger(frameHeight)) return;
    const col = frame % Number(colsInput.value);
    const row = Math.floor(frame / Number(colsInput.value));
    const scale = Math.min((canvas.width - 12) / frameWidth, (canvas.height - 12) / frameHeight);
    const width = frameWidth * scale;
    const height = frameHeight * scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image,col*frameWidth,row*frameHeight,frameWidth,frameHeight,
      (canvas.width-width)/2,(canvas.height-height)/2,width,height);
    count.textContent = (frame + 1) + ' / ' + total;
    slider.value = String(frame);
  }

  function updateGrid() {
    stop();
    const cols = Math.max(1,Math.min(128,Number(colsInput.value)||1));
    const rows = Math.max(1,Math.min(128,Number(rowsInput.value)||1));
    colsInput.value = String(cols);
    rowsInput.value = String(rows);
    if (!image.naturalWidth) return;
    frameWidth = image.naturalWidth / cols;
    frameHeight = image.naturalHeight / rows;
    const valid = Number.isInteger(frameWidth) && Number.isInteger(frameHeight);
    total = valid ? cols * rows : 0;
    frame = 0;
    slider.max = String(Math.max(0, total - 1));
    slider.value = '0';
    firstFrameInput.max = String(Math.max(0,total-1));
    lastFrameInput.max = String(Math.max(0,total-1));
    firstFrameInput.value = '0';
    lastFrameInput.value = String(Math.max(0,total-1));
    copyButton.disabled = true;
    mappingOutput.textContent = 'Lưới đã thay đổi. Hãy tạo lại mapping.';
    count.textContent = '0 / ' + total;
    $('sprite-prev').disabled = !valid || total < 2;
    $('sprite-next').disabled = !valid || total < 2;
    $('sprite-play').disabled = !valid || total < 2;
    slider.disabled = !valid || total < 2;
    meta.textContent = image.naturalWidth + '×' + image.naturalHeight + ' px · ' +
      (valid
        ? 'frame ' + frameWidth + '×' + frameHeight + ' px · ' + total + ' frame' + (total > 1 ? 's' : '')
        : 'Lưới ' + cols + '×' + rows + ' không chia hết kích thước ảnh; hãy đổi số hàng/cột');
    draw();
  }

  function loadAsset() {
    stop();
    const item = images[Number(imageSelect.value)] || images[0];
    image = new Image();
    image.onload = () => {
      $('sprite-export').disabled = false;
      updateGrid();
    };
    image.onerror = () => {
      total = 0;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      count.textContent = '0 / 0';
      meta.textContent = 'Không tải được ảnh: ' + item.path;
      $('sprite-prev').disabled = true;
      $('sprite-next').disabled = true;
      $('sprite-play').disabled = true;
      slider.disabled = true;
      $('sprite-export').disabled = true;
      copyButton.disabled = true;
    };
    const url = assetUrl(item.output);
    if (!url) {
      image.onerror();
      return;
    }
    image.src = url;
  }

  imageSelect.addEventListener('change',loadAsset);
  colsInput.addEventListener('change',updateGrid);
  rowsInput.addEventListener('change',updateGrid);
  for (const input of [animationKeyInput,firstFrameInput,lastFrameInput,fpsInput,repeatInput,frameSequenceInput]) {
    input.addEventListener('input',() => { copyButton.disabled = true; });
    input.addEventListener('change',() => { copyButton.disabled = true; });
  }
  $('sprite-export').addEventListener('click',() => {
    const item = images[Number(imageSelect.value)] || images[0];
    const key = animationKeyInput.value.trim();
    const first = Number(firstFrameInput.value);
    const last = Number(lastFrameInput.value);
    const fps = Number(fpsInput.value);
    const repeat = Number(repeatInput.value);
    if (!key || !/^[a-zA-Z0-9_-]{1,64}$/.test(key)) {
      mappingOutput.textContent = 'Animation key chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới.';
      copyButton.disabled = true;
      return;
    }
    const sequenceText = frameSequenceInput.value.trim();
    const frames = sequenceText
      ? sequenceText.split(',').map(value => value.trim()).map(value => /^\\d+$/.test(value) ? Number(value) : NaN)
      : Array.from({length:last-first+1},(_,index)=>first+index);
    if (!total || !frames.length || frames.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= total) ||
        (!sequenceText && (!Number.isInteger(first) || !Number.isInteger(last) || first < 0 || last < first || last >= total))) {
      mappingOutput.textContent = 'Dải hoặc thứ tự frame không hợp lệ. Mỗi frame phải nằm trong khoảng 0 đến ' + (total-1) + '.';
      copyButton.disabled = true;
      return;
    }
    if (!Number.isFinite(fps) || fps < 1 || fps > 60 || ![-1,0].includes(repeat)) {
      mappingOutput.textContent = 'FPS phải từ 1 đến 60; repeat phải là -1 hoặc 0.';
      copyButton.disabled = true;
      return;
    }
    const textureKey = 'kpah_' + key.replace(/[^a-zA-Z0-9_-]/g,'_');
    const mapping = {
      source: { archive:item.archive, path:item.path, output:item.output, width:item.width || image.naturalWidth, height:item.height || image.naturalHeight },
      load: {
        key:textureKey,
        url:new URL(assetUrl(item.output),document.baseURI).href,
        frameWidth,
        frameHeight,
        endFrame:total-1
      },
      animation: {
        key,
        textureKey,
        frames,
        frameRate:fps,
        repeat
      }
    };
    mappingOutput.textContent = JSON.stringify(mapping,null,2);
    copyButton.disabled = false;
  });
  copyButton.addEventListener('click',async () => {
    const value = mappingOutput.textContent;
    if (!value || value === 'Chưa tạo mapping.') return;
    try {
      await navigator.clipboard.writeText(value);
      copyButton.textContent = 'Đã sao chép';
    } catch {
      copyButton.textContent = 'Không thể sao chép';
    }
  });
  slider.addEventListener('input',() => { frame = Number(slider.value); draw(); });
  $('sprite-prev').addEventListener('click',() => {
    if (total < 2) return;
    frame = (frame - 1 + total) % total;
    draw();
  });
  $('sprite-next').addEventListener('click',() => {
    if (total < 2) return;
    frame = (frame + 1) % total;
    draw();
  });
  $('sprite-play').addEventListener('click',() => {
    if (timer !== null) { stop(); return; }
    if (total < 2 || !Number.isInteger(frameWidth) || !Number.isInteger(frameHeight)) return;
    const fps = Math.max(1,Math.min(30,Number(fpsInput.value)||6));
    fpsInput.value = String(fps);
    $('sprite-play').textContent = 'Dừng';
    timer = setInterval(() => { frame = (frame + 1) % total; draw(); },1000/fps);
  });
  loadAsset();
}
