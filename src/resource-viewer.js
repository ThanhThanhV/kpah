const MANIFEST_URL = '/assets/kpah-original/archive-manifest.json';
const ASSET_ROOT = '/assets/kpah-original/';

const style = document.createElement('style');
style.textContent = `
.resource-browser{display:grid;gap:12px;color:#e8d8b8;font-size:12px}
.resource-toolbar{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:8px}
.resource-toolbar input,.resource-toolbar select{min-width:0;width:100%;height:36px;padding:0 10px;background:#17141b;border:1px solid #66513b;color:#f0dfbd}
.resource-summary{display:flex;flex-wrap:wrap;gap:8px;color:#bca98a;font-size:10px}
.resource-summary b{color:#f0d28e}
.resource-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:9px;max-height:390px;overflow:auto;padding:2px}
.resource-card{min-width:0;background:#211d24;border:1px solid #554431;padding:6px;display:grid;gap:5px}
.resource-thumb{height:104px;display:grid;place-items:center;background:linear-gradient(45deg,#29252b 25%,#332e32 25%,#332e32 50%,#29252b 50%,#29252b 75%,#332e32 75%);background-size:16px 16px;overflow:hidden}
.resource-thumb img{max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated}
.resource-name{overflow-wrap:anywhere;color:#ead6ae;font-size:10px}
.resource-meta{color:#9f9079;font-size:9px;overflow-wrap:anywhere}
.resource-empty{padding:22px 14px;text-align:center;border:1px dashed #715a3c;color:#c4b18e;line-height:1.7}
.resource-empty code{color:#f1d28e}
.resource-error{color:#f0a28d}
@media(max-width:520px){.resource-toolbar{grid-template-columns:1fr}.resource-grid{grid-template-columns:repeat(2,minmax(0,1fr));max-height:45dvh}}
`;
document.head.append(style);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
}

export async function renderResourceViewer(root) {
  if (!root) return;
  root.innerHTML = '<div class="resource-empty">Đang đọc danh mục tài nguyên...</div>';
  let manifest;
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    manifest = await response.json();
  } catch (error) {
    root.innerHTML = `
      <div class="resource-empty">
        <b>Chưa có danh mục tài nguyên đã trích xuất</b><br>
        Chạy lệnh sau tại thư mục gốc dự án:<br>
        <code>python tools/extract_kpah_jar.py KPAH_278.jar</code><br>
        Sau khi chạy, tải thư mục <code>public/assets/kpah-original/</code> lên môi trường đang chạy Web rồi mở lại cửa sổ này.
        <div class="resource-meta resource-error">Không đọc được manifest: ${escapeHtml(error.message)}</div>
      </div>`;
    return;
  }

  const images = (manifest.decodedPackedEntries || [])
    .filter(item => /\.png$/i.test(item.path || '') && item.output)
    .sort((a,b) => String(a.archive).localeCompare(String(b.archive)) || String(a.path).localeCompare(String(b.path)));
  const packs = [...new Set(images.map(item => item.archive))].sort();
  root.innerHTML = `
    <section class="resource-browser">
      <div class="resource-toolbar">
        <input type="search" id="resource-search" placeholder="Tìm tên ảnh hoặc đường dẫn..." aria-label="Tìm tài nguyên">
        <select id="resource-pack" aria-label="Lọc theo gói"><option value="">Tất cả gói</option>${packs.map(pack => `<option value="${escapeHtml(pack)}">${escapeHtml(pack)}</option>`).join('')}</select>
      </div>
      <div class="resource-summary" id="resource-summary"></div>
      <div class="resource-grid" id="resource-grid"></div>
    </section>`;

  const search = root.querySelector('#resource-search');
  const packSelect = root.querySelector('#resource-pack');
  const grid = root.querySelector('#resource-grid');
  const summary = root.querySelector('#resource-summary');

  function draw() {
    const term = search.value.trim().toLowerCase();
    const pack = packSelect.value;
    const visible = images.filter(item =>
      (!pack || item.archive === pack) &&
      (!term || (item.path + ' ' + item.archive).toLowerCase().includes(term))
    );
    summary.innerHTML = `Hiển thị <b>${visible.length}</b> / <b>${images.length}</b> ảnh PNG · ${packs.length} gói · ${Number(manifest.entryCount || 0)} file trong JAR`;
    if (!visible.length) {
      grid.innerHTML = '<div class="resource-empty">Không tìm thấy ảnh phù hợp.</div>';
      return;
    }
    grid.innerHTML = visible.map(item => {
      const url = ASSET_ROOT + item.output.split('/').map(encodeURIComponent).join('/');
      return `
        <article class="resource-card">
          <div class="resource-thumb"><img loading="lazy" src="${url}" alt="${escapeHtml(item.path)}"></div>
          <div class="resource-name">${escapeHtml(item.path)}</div>
          <div class="resource-meta">${escapeHtml(item.archive)} · ${Number(item.size || 0).toLocaleString('vi-VN')} byte</div>
        </article>`;
    }).join('');
  }
  search.addEventListener('input', draw);
  packSelect.addEventListener('change', draw);
  draw();
}
