const MANIFEST_URL = '/assets/kpah-original/archive-manifest.json';
const ASSET_ROOT = '/assets/kpah-original/';
const PROFESSION_PACKS = {
  'Kiếm Khách': 'kiem',
  'Chiến Binh': 'daidao',
  'Pháp Sư': 'phapsu',
  'Đấu Sĩ': 'bua',
  'Cung Thủ': 'cung'
};

const style = document.createElement('style');
style.textContent = `
.character-preview{display:grid;gap:7px;padding:9px;background:#17141b;border:1px solid #66513b}
.character-preview-stage{height:112px;display:grid;place-items:center;background:repeating-conic-gradient(#302a2b 0% 25%,#211d22 0% 50%) 50%/16px 16px}
.character-preview-stage img{max-width:100%;max-height:108px;object-fit:contain;image-rendering:pixelated}
.character-preview-title{display:flex;justify-content:space-between;gap:8px;color:#e8d3a9;font-size:9px}
.character-preview-strip{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
.character-preview-thumb{flex:0 0 48px;width:48px;height:48px;padding:3px;background:#28222a;border:1px solid #5a4937}
.character-preview-thumb.selected{border-color:#e3c17d;background:#4a382e}
.character-preview-thumb img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}
.character-preview-note{font-size:8px;color:#a99a81;line-height:1.5}
`;
document.head.append(style);

function assetUrl(path) {
  return ASSET_ROOT + path.split('/').map(encodeURIComponent).join('/');
}

export async function mountCharacterPreview(root, classSelect) {
  if (!root || !classSelect) return;
  root.className = 'character-preview';
  root.innerHTML = '<div class="character-preview-note">Đang tải ảnh xem trước môn phái...</div>';
  let entries;
  try {
    const response = await fetch(MANIFEST_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const manifest = await response.json();
    entries = manifest.decodedPackedEntries || [];
  } catch (error) {
    root.innerHTML = '<div class="character-preview-note">Chưa có ảnh xem trước. Hãy chạy <code>npm run extract:assets</code> để giải mã JAR.</div>';
    return;
  }

  let requestVersion = 0;
  function render() {
    const version = ++requestVersion;
    const profession = classSelect.value;
    const pack = PROFESSION_PACKS[profession];
    const packSuffix = '/wpsplash/' + pack + '.wps';
    const images = entries
      .filter(item => item.packType === '.wps' && String(item.archive || '').endsWith(packSuffix) &&
        /\.png$/i.test(item.path || '') && item.output)
      .sort((a,b) => a.path.localeCompare(b.path));

    if (!images.length) {
      root.innerHTML = '<div class="character-preview-note">Không tìm thấy gói ảnh gốc cho ' + profession + '. Kiểm tra manifest sau khi trích xuất JAR.</div>';
      return;
    }

    let activeIndex = 0;
    const title = document.createElement('div');
    title.className = 'character-preview-title';
    const label = document.createElement('b');
    label.textContent = profession + ' · Ảnh gốc';
    const count = document.createElement('span');
    count.textContent = images.length + ' ảnh';
    title.append(label, count);

    const stage = document.createElement('div');
    stage.className = 'character-preview-stage';
    const large = document.createElement('img');
    large.alt = profession + ' preview';
    stage.append(large);

    const strip = document.createElement('div');
    strip.className = 'character-preview-strip';
    const note = document.createElement('div');
    note.className = 'character-preview-note';
    note.textContent = 'Ảnh xem trước theo gói môn phái trong JAR; chưa đại diện cho tổ hợp giới tính, kiểu tóc hoặc animation trong game.';

    function select(index) {
      activeIndex = index;
      const item = images[index];
      large.src = assetUrl(item.output);
      large.alt = profession + ' · ' + item.path;
      [...strip.children].forEach((button, i) => button.classList.toggle('selected', i === index));
    }

    images.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'character-preview-thumb';
      button.title = item.path;
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.src = assetUrl(item.output);
      image.alt = item.path;
      button.append(image);
      button.addEventListener('click', () => select(index));
      strip.append(button);
    });

    root.replaceChildren(title, stage, strip, note);
    select(0);
    if (version !== requestVersion) return;
  }

  classSelect.addEventListener('change', render);
  render();
}
