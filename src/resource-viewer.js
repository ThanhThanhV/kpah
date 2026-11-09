import { renderSpriteLab } from './sprite-lab.js';
import { assetUrl, decodedPngEntries, loadAssetManifest } from './kpah-assets.js';

const style = document.createElement('style');
style.textContent = `
.resource-browser{display:grid;gap:12px;color:#e8d8b8;font-size:12px}
.resource-toolbar{display:grid;grid-template-columns:minmax(0,1fr) 180px 180px;gap:8px}
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
.resource-metadata{display:grid;gap:7px;padding:10px;border:1px solid #66513b;background:#1b171e}
.resource-metadata h3{margin:0;color:#f0d28e;font-size:12px}
.resource-metadata select{width:100%;height:34px;padding:0 8px;background:#17141b;border:1px solid #66513b;color:#f0dfbd}
.resource-hex{max-height:220px;overflow:auto;padding:8px;background:#121015;color:#cbbd9e;font:10px/1.6 ui-monospace,monospace;white-space:pre}
.resource-metadata-note{color:#a99a81;font-size:9px;line-height:1.5}
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
    manifest = await loadAssetManifest();
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

  const images = decodedPngEntries(manifest)
    .sort((a,b) => String(a.archive).localeCompare(String(b.archive)) || String(a.path).localeCompare(String(b.path)));
  const packs = [...new Set(images.map(item => item.archive))].sort();
  const families = [...new Map(images.map(item => [
    item.resourceFamily || 'unclassified-pack',
    item.resourceFamilyLabel || 'Gói chưa phân loại'
  ])).entries()].sort((a,b) => a[1].localeCompare(b[1], 'vi'));
  root.innerHTML = `
    <section class="resource-browser">
      <div class="resource-toolbar">
        <input type="search" id="resource-search" placeholder="Tìm tên ảnh hoặc đường dẫn..." aria-label="Tìm tài nguyên">
        <select id="resource-pack" aria-label="Lọc theo gói"><option value="">Tất cả gói</option>${packs.map(pack => `<option value="${escapeHtml(pack)}">${escapeHtml(pack)}</option>`).join('')}</select>
        <select id="resource-family" aria-label="Lọc theo nhóm tài nguyên"><option value="">Tất cả nhóm tài nguyên</option>${families.map(([id,label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join('')}</select>
      </div>
      <div class="resource-summary" id="resource-summary"></div>
      <div class="resource-grid" id="resource-grid"></div>
      <div id="resource-sprite-lab"></div>\n      <div id="resource-metadata"></div>
    </section>`;

  const search = root.querySelector('#resource-search');
  const packSelect = root.querySelector('#resource-pack');
  const familySelect = root.querySelector('#resource-family');
  const grid = root.querySelector('#resource-grid');
  const summary = root.querySelector('#resource-summary');

  function draw() {
    const term = search.value.trim().toLowerCase();
    const pack = packSelect.value;
    const family = familySelect.value;
    const visible = images.filter(item =>
      (!pack || item.archive === pack) &&
      (!family || (item.resourceFamily || 'unclassified-pack') === family) &&
      (!term || (item.path + ' ' + item.archive + ' ' + (item.imageClassHint || '') + ' ' + (item.resourceFamilyLabel || '')).toLowerCase().includes(term))
    );
    summary.innerHTML = `Hiển thị <b>${visible.length}</b> / <b>${images.length}</b> ảnh PNG · ${packs.length} gói · ${families.length} nhóm nguồn · ${Number(manifest.entryCount || 0)} file trong JAR`;
    if (!visible.length) {
      grid.innerHTML = '<div class="resource-empty">Không tìm thấy ảnh phù hợp.</div>';
      return;
    }
    grid.innerHTML = visible.map(item => {
      const url = assetUrl(item.output);
      return `
        <article class="resource-card">
          <div class="resource-thumb"><img loading="lazy" src="${url}" alt="${escapeHtml(item.path)}"></div>
          <div class="resource-name">${escapeHtml(item.path)}</div>
          <div class="resource-meta">${escapeHtml(item.resourceFamilyLabel || 'Gói chưa phân loại')} · ${escapeHtml(item.archive)} · ${item.width && item.height ? item.width + '×' + item.height + ' px · ' : ''}${escapeHtml(item.imageClassHint || 'chưa phân loại')} · ${Number(item.size || 0).toLocaleString('vi-VN')} byte</div>
        </article>`;
    }).join('');
  }
  search.addEventListener('input', draw);
  packSelect.addEventListener('change', draw);
  familySelect.addEventListener('change', draw);
  draw();
  renderSpriteLab(root.querySelector('#resource-sprite-lab'), images);
  renderBinaryMetadata(root.querySelector('#resource-metadata'), manifest.decodedPackedEntries || []);
}

function renderBinaryMetadata(root, entries) {
  if (!root) return;
  const metadata = entries.filter(item => /\.d$/i.test(item.path || '') && assetUrl(item.output));
  if (!metadata.length) {
    root.innerHTML = '<div class="resource-metadata-note">Không có file metadata .d trong manifest.</div>';
    return;
  }
  root.innerHTML = `
    <section class="resource-metadata">
      <h3>Phân tích metadata nhị phân (.d)</h3>
      <select id="metadata-entry" aria-label="Chọn file metadata">
        ${metadata.map((item,index) => `<option value="${index}">${escapeHtml(item.archive)} / ${escapeHtml(item.path)} · ${Number(item.size || 0)} byte</option>`).join('')}
      </select>
      <div class="resource-metadata-note">Hiển thị byte theo offset và ASCII tương ứng. Chưa gán ý nghĩa trường dữ liệu khi chưa xác minh bằng bytecode.</div>
      <pre class="resource-hex" id="metadata-hex">Chọn file để đọc...</pre>
    </section>`;
  const select = root.querySelector('#metadata-entry');
  const output = root.querySelector('#metadata-hex');
  let request = 0;
  async function load() {
    const current = ++request;
    const item = metadata[Number(select.value)] || metadata[0];
    const url = assetUrl(item.output);
    output.textContent = 'Đang đọc ' + item.path + '...';
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (current !== request) return;
      const lines = [];
      for (let offset = 0; offset < bytes.length; offset += 16) {
        const slice = bytes.slice(offset, offset + 16);
        const hex = [...slice].map(value => value.toString(16).padStart(2,'0')).join(' ').padEnd(47,' ');
        const ascii = [...slice].map(value => value >= 32 && value <= 126 ? String.fromCharCode(value) : '.').join('');
        lines.push(offset.toString(16).padStart(4,'0') + '  ' + hex + '  ' + ascii);
      }
      output.textContent = lines.join('\\n') + '\\n\\n' + bytes.length + ' bytes';
    } catch (error) {
      output.textContent = 'Không đọc được metadata: ' + error.message;
    }
  }
  select.addEventListener('change',load);
  load();
}
