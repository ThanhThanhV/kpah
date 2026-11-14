const subscribers = new Set();
let latestCharacterPart = null;
let latestKey = null;

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
export function publishCharacterPartData(partIndex, metadata, imageBytes) {
  if (!Number.isInteger(partIndex) || !metadata?.frames?.length
    || !(imageBytes instanceof Uint8Array) || !imageBytes.length) return;
  const key = String(partIndex) + ':' + imageBytes.length;
  if (key === latestKey && latestCharacterPart?.metadata === metadata) return;
  const image = new Image();
  image.onload = () => {
    latestKey = key;
    latestCharacterPart = { partIndex, metadata, image };
    publish();
  };
  image.onerror = () => {
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
      <div class="original-character-stage__empty">Đang chờ dữ liệu nhân vật gốc từ máy chủ KPAH</div>
      <span class="original-character-stage__tag">NHÂN VẬT GỐC</span>
    </div>
    <div class="original-character-stage__toolbar">
      <div class="original-character-stage__states">
        <button type="button" data-stage-state="0" class="selected">Đứng</button>
        <button type="button" data-stage-state="2">Di chuyển</button>
        <button type="button" data-stage-state="3">Ra đòn</button>
      </div>
      <button type="button" data-stage-direction="toggle" aria-label="Đổi hướng">↔ Đổi hướng</button>
    </div>
    <div class="original-character-stage__caption">Hoạt ảnh dùng frame và atlas được server gửi theo định dạng gốc.</div>`;
  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const empty = root.querySelector('.original-character-stage__empty');
  const stateButtons = [...root.querySelectorAll('[data-stage-state]')];
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
  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!data) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    const frame = getFrame();
    if (!frame) return;
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
    if (data && accumulator >= 40) {
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
  const directionButton = root.querySelector('[data-stage-direction]');
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
    cursor = 0;
    draw();
  };
  subscribers.add(onData);
  draw();
  raf = requestAnimationFrame(tick);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    subscribers.delete(onData);
    root.replaceChildren();
    root.classList.remove('original-character-stage');
  };
}
