import { assetUrl } from './kpah-assets.js';

const style = document.createElement('style');
style.textContent = `
.sprite-lab{display:grid;gap:9px;margin-top:14px;padding:10px;border:1px solid #66513b;background:#1b171e;color:#e8d8b8}
.sprite-lab h3{margin:0;color:#f0d28e;font-size:12px}
.sprite-lab-controls{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,64px);gap:6px}
.sprite-lab select,.sprite-lab input{min-width:0;width:100%;height:32px;padding:0 6px;background:#17141b;border:1px solid #66513b;color:#f0dfbd;font-size:10px}
.sprite-lab-stage{min-height:180px;display:grid;place-items:center;background:repeating-conic-gradient(#302a2b 0% 25%,#211d22 0% 50%) 50%/16px 16px}
.sprite-lab-stage canvas{width:min(100%,320px);height:220px;object-fit:contain;image-rendering:pixelated}
.sprite-lab-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.sprite-lab button{padding:6px 10px;background:#403128;border:1px solid #8d7048;color:#f0d9ad;font-size:10px}
.sprite-lab input[type=range]{flex:1;min-width:90px}
.sprite-lab-meta{font-size:9px;color:#ad9c80;line-height:1.5}
@media(max-width:520px){.sprite-lab-controls{grid-template-columns:1fr 58px 58px 58px}.sprite-lab-stage canvas{height:180px}}
`;
document.head.append(style);

export function renderSpriteLab(root, assets) {
  if (!root) return;
  const images = assets.filter(item => /\.png$/i.test(item.path || '') && item.output);
  if (!images.length) {
    root.innerHTML = '<div class="sprite-lab-meta">Không có PNG để phân tích sprite.</div>';
    return;
  }

  root.innerHTML = `
    <section class="sprite-lab">
      <h3>Phân tích sprite sheet</h3>
      <div class="sprite-lab-controls">
        <select id="sprite-asset" aria-label="Chọn ảnh sprite">${images.map((item,index) => `<option value="${index}">${item.archive} / ${item.path}</option>`).join('')}</select>
        <input id="sprite-cols" type="number" min="1" max="128" value="1" title="Số cột" aria-label="Số cột">
        <input id="sprite-rows" type="number" min="1" max="128" value="1" title="Số hàng" aria-label="Số hàng">
        <input id="sprite-fps" type="number" min="1" max="30" value="6" title="FPS" aria-label="FPS">
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
    </section>`;

  const $ = id => root.querySelector('#' + id);
  const imageSelect = $('sprite-asset');
  const colsInput = $('sprite-cols');
  const rowsInput = $('sprite-rows');
  const fpsInput = $('sprite-fps');
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
    if (!image.complete || !image.naturalWidth || !total) return;
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
    total = cols * rows;
    frame = 0;
    slider.max = String(total - 1);
    slider.value = '0';
    const valid = Number.isInteger(frameWidth) && Number.isInteger(frameHeight);
    meta.textContent = image.naturalWidth + '×' + image.naturalHeight + ' px · frame ' +
      frameWidth + '×' + frameHeight + ' px · ' + total + ' frame' + (total > 1 ? 's' : '') +
      (valid ? '' : ' · Lưới này chia không hết kích thước ảnh');
    draw();
  }

  function loadAsset() {
    stop();
    const item = images[Number(imageSelect.value)] || images[0];
    image = new Image();
    image.onload = updateGrid;
    image.onerror = () => { meta.textContent = 'Không tải được ảnh: ' + item.path; };
    image.src = assetUrl(item.output) || '';
  }

  imageSelect.addEventListener('change',loadAsset);
  colsInput.addEventListener('change',updateGrid);
  rowsInput.addEventListener('change',updateGrid);
  slider.addEventListener('input',() => { frame = Number(slider.value); draw(); });
  $('sprite-prev').addEventListener('click',() => { frame = (frame - 1 + total) % total; draw(); });
  $('sprite-next').addEventListener('click',() => { frame = (frame + 1) % total; draw(); });
  $('sprite-play').addEventListener('click',() => {
    if (timer !== null) { stop(); return; }
    const fps = Math.max(1,Math.min(30,Number(fpsInput.value)||6));
    fpsInput.value = String(fps);
    $('sprite-play').textContent = 'Dừng';
    timer = setInterval(() => { frame = (frame + 1) % total; draw(); },1000/fps);
  });
  loadAsset();
}
