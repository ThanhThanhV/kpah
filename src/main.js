import Phaser from 'phaser';
import './style.css';
import { renderResourceViewer } from './resource-viewer.js';
import { configureWorldCamera, moveWorldEntity, setWorldEntityDepth } from './world-runtime.js';
import { createCharacterState } from './character-state.js';
import { createSkillCombatState } from './skill-combat.js';
import { createQuestState } from './quest-state.js';
import { createWorldEntityState } from './world-entities.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">K</span><div><b>KHÍ PHÁCH ANH HÙNG</b><small>PHIÊN BẢN TÁI HIỆN WEB</small></div></div>
      <div class="server"><i class="offline-dot"></i><span>Máy chủ: <b>Long Kiếm</b></span><span class="offline">Demo offline</span></div>
      <div class="top-actions"><button data-window="settings" title="Cài đặt">⚙</button><button data-window="help" title="Trợ giúp">?</button><button class="exit" id="logout">Thoát</button></div>
    </header>
    <section class="game-layout">
      <aside class="left-rail">
        <div class="profile-card">
          <div class="avatar-frame"><div class="avatar-art">⚔</div><span class="level">25</span></div>
          <div class="profile-info"><b class="hero-name">Kiếm Khách</b><small>Chiến binh tập sự</small><div class="bar-label"><span>HP</span><b>1.250 / 1.250</b></div><div class="meter hp"><i style="width:100%"></i></div><div class="bar-label"><span>MP</span><b>680 / 680</b></div><div class="meter mp"><i style="width:100%"></i></div></div>
        </div>
        <nav class="side-nav">
          <button class="active" data-window="character"><span>♙</span>Nhân vật</button>
          <button data-window="inventory"><span>▣</span>Hành trang</button>
          <button data-window="equipment"><span>✥</span>Trang bị</button>
          <button data-window="skills"><span>✦</span>Kỹ năng</button>
          <button data-window="quests"><span>⚑</span>Nhiệm vụ</button>
          <button data-window="friends"><span>♧</span>Bạn bè</button>
          <button data-window="guild"><span>⚑</span>Bang hội</button>
          <button data-window="resources"><span>▧</span>Tài nguyên gốc</button>
        </nav>
        <div class="mini-status"><div><span>Xu</span><b>125.600</b></div><div><span>Lượng</span><b>320</b></div><div><span>Danh vọng</span><b>48</b></div></div>
      </aside>
      <section class="world-column">
        <div class="world-toolbar"><div class="location"><span>◈</span><b>Làng Sói Trắng</b><small>· Khu vực an toàn</small></div><div class="world-tools"><button data-window="map">Bản đồ</button><button data-window="ranking">Xếp hạng</button><button data-window="events">Sự kiện</button></div></div>
        <div class="world-frame"><div id="world"></div><div class="scene-vignette"></div><div class="zone-title"><b>LÀNG SÓI TRẮNG</b><small>Vùng đất khởi nguyên</small></div><div class="world-coords">X: 124 · Y: 087</div><div class="world-hint">Chạm điểm đến để di chuyển · Chạm NPC để tương tác</div><div class="npc-tag merchant">Thương nhân</div><div class="npc-tag elder">Trưởng làng</div><div class="world-target" id="world-target" hidden><div class="world-target-heading"><b id="world-target-name">Sói hoang</b><small id="world-target-level">Cấp 18</small></div><div class="world-target-health"><i id="world-target-health-fill"></i></div><small id="world-target-hp">620 / 620 HP</small></div></div>
        <div class="world-bottom"><div class="chat"><div class="chat-tabs"><button class="selected" data-chat-channel="world">Thế giới</button><button data-chat-channel="guild">Bang hội</button><button data-chat-channel="private">Riêng</button><button data-chat-channel="system">Hệ thống</button></div><div class="chat-lines" id="chat-lines"><p data-channel="system"><b class="system">[Hệ thống]</b> Chào mừng đến với Khí Phách Anh Hùng!</p><p data-channel="world"><b class="world-chat">[Thế giới]</b> <strong>Kiếm Khách</strong>: Có ai đi săn Sói không?</p><p data-channel="world"><b class="world-chat">[Thế giới]</b> <strong>PhongVân</strong>: Làng đông vui quá.</p></div><form id="chat-form"><select id="chat-channel-select" aria-label="Kênh chat"><option value="world">Thế giới</option><option value="guild">Bang hội</option><option value="private">Riêng</option><option value="system">Hệ thống</option></select><input id="chat-input" placeholder="Nhập nội dung trò chuyện..." maxlength="120"><button type="submit">Gửi</button></form></div><div class="quick-panel"><div class="quick-title">THAO TÁC NHANH</div><div class="quick-grid"><button data-window="inventory"><span>▣</span>Túi đồ</button><button data-window="skills"><span>✦</span>Kỹ năng</button><button data-window="quests"><span>⚑</span>Nhiệm vụ</button><button data-window="map"><span>⌖</span>Bản đồ</button></div></div></div>
      </section>
      <aside class="right-rail">
        <div class="rail-heading">THÔNG TIN KHU VỰC <button data-window="map">⌖</button></div>
        <div class="mini-map"><div class="map-grid"></div><span class="map-player"></span><span class="map-npc n1"></span><span class="map-npc n2"></span><div class="map-label">Làng Sói Trắng</div></div>
        <div class="section-label">NHÂN VẬT GẦN ĐÂY <span>3</span></div>
        <div class="nearby"><div class="nearby-avatar blue">風</div><div><b>PhongVân</b><small>Cấp 27 · Kiếm khách</small></div><i class="online-dot"></i></div>
        <div class="nearby"><div class="nearby-avatar red">炎</div><div><b>HỏaLong</b><small>Cấp 31 · Chiến binh</small></div><i class="online-dot"></i></div>
        <div class="nearby"><div class="nearby-avatar green">月</div><div><b>NguyệtNhi</b><small>Cấp 24 · Cung thủ</small></div><i class="online-dot"></i></div>
        <div class="section-label">MỤC TIÊU <span>2</span></div>
        <div class="target-row"><span class="target-icon wolf">♞</span><div><b>Sói hoang</b><small>Cấp 18 · Quái thường</small></div><span class="target-count">× 8</span></div>
        <div class="target-row"><span class="target-icon boss">♜</span><div><b>Sói đầu đàn</b><small>Cấp 22 · Tinh anh</small></div><span class="target-count">× 1</span></div>
        <div class="right-footer"><span>Ping: <b>42ms</b></span><span>FPS: <b id="fps">60</b></span></div>
      </aside>
    </section>
    <footer class="actionbar">
      <div class="movement"><button id="move-left">◀</button><button id="move-down">▼</button><button id="move-up">▲</button><button id="move-right">▶</button></div>
      <div class="action-slots"><button class="slot active" data-skill="Đánh thường"><small>1</small><span>⚔</span><em>Đánh</em></button><button class="slot" data-skill="Kiếm khí"><small>2</small><span>✧</span><em>Kiếm khí</em></button><button class="slot" data-skill="Hồi phục"><small>3</small><span>✚</span><em>Hồi phục</em></button><button class="slot" data-skill="Tuyệt kỹ"><small>4</small><span>✹</span><em>Tuyệt kỹ</em></button><button class="slot potion" data-skill="Bình HP"><small>5</small><span>🧪</span><em>Bình HP</em></button></div>
      <div class="action-meta"><button data-window="party">☷ <span>Tổ đội</span></button><button data-window="mail">✉ <span>Thư</span><i class="notify"></i></button><button data-window="shop">♜ <span>Cửa hàng</span></button></div>
    </footer>
  </main>
  <div class="modal-backdrop" id="modal-backdrop"></div><section class="game-window" id="game-window" aria-live="polite"><header class="window-title"><b id="window-title">Nhân vật</b><button id="window-close">×</button></header><div class="window-content" id="window-content"></div></section>
  <div class="toast" id="toast"></div>
`;

const panelData = {
  resources: {title:'Trình duyệt tài nguyên gốc',html:'<div id="resource-viewer"></div>'},
  character: {title:'Thông tin nhân vật',html:`<div class="character-sheet"><div class="big-avatar">⚔<span>Cấp 25</span></div><div class="character-details"><h2>Kiếm Khách</h2><p class="muted">Chiến binh tập sự · Nam</p><div class="stat-grid"><div><small>Cấp độ</small><b>25</b></div><div><small>Kinh nghiệm</small><b>72.450 / 90.000</b></div><div><small>Sức mạnh</small><b>1.285</b></div><div><small>Thể lực</small><b>860</b></div><div><small>Nhanh nhẹn</small><b>740</b></div><div><small>Tinh thần</small><b>520</b></div></div><button class="gold-button">Phân phối tiềm năng</button></div></div>`},
  inventory:{title:'Hành trang',html:`<div class="tabs inventory-tabs"><button class="chosen" data-inventory-filter="all">Tất cả</button><button data-inventory-filter="equipment">Trang bị</button><button data-inventory-filter="consumable">Tiêu hao</button><button data-inventory-filter="material">Nguyên liệu</button><button data-inventory-filter="quest">Nhiệm vụ</button></div><div class="inventory-grid">${['Kiếm tân thủ','Áo vải','Bình máu nhỏ','Bình mana nhỏ','Nhẫn đồng','Đá cường hóa','Lá bùa','Túi nguyên liệu','Giày vải','Găng tay','Ngọc xanh','Rương gỗ'].map((x,i)=>`<div class="item-cell" data-item-category="${['equipment','equipment','consumable','consumable','equipment','material','consumable','material','equipment','equipment','material','quest'][i]}"><span>${['⚔','♧','🧪','🧴','◉','◆','✧','▣','⌑','♢','💎','▤'][i]}</span><small>${x}</small>${i===2||i===3?'<em>×5</em>':''}</div>`).join('')}</div><div class="inventory-footer"><span>Ô trống: 18 / 30</span><button class="gold-button">Mở rộng túi</button></div>`},
  equipment:{title:'Trang bị nhân vật',html:`<div class="equipment-layout"><div class="equip-slots">${['Mũ','Áo','Vũ khí','Găng','Giày','Nhẫn','Dây chuyền','Bùa'].map((x,i)=>`<div class="equip-cell"><span>${['♜','♧','⚔','♢','⌑','◉','◇','✧'][i]}</span><small>${x}</small></div>`).join('')}</div><div class="equip-preview">⚔<b>Kiếm Khách</b><small>Chưa trang bị đầy đủ</small></div></div>`},
  skills:{title:'Kỹ năng',html:`<div class="tabs"><button class="chosen">Kỹ năng chủ động</button><button>Bị động</button></div><div class="skill-list">${[['Kiếm khí','Cấp 3','Gây sát thương lên mục tiêu phía trước.','✧'],['Liên hoàn trảm','Cấp 2','Tấn công liên tiếp nhiều lần.','⚔'],['Hồi phục','Cấp 1','Khôi phục một phần sinh lực.','✚'],['Bạt kiếm thức','Chưa học','Tuyệt kỹ gây sát thương lớn.','✹']].map(x=>`<div class="skill-row"><span>${x[3]}</span><div><b>${x[0]} <small>${x[1]}</small></b><p>${x[2]}</p></div><button>Chi tiết</button></div>`).join('')}</div>`},
  quests:{title:'Sổ nhiệm vụ',html:`<div class="tabs"><button class="chosen">Đang thực hiện</button><button>Có thể nhận</button><button>Hoàn thành</button></div><div class="quest-card"><b>✦ Dọn dẹp bầy sói</b><p>Tiêu diệt 8 Sói hoang để bảo vệ dân làng.</p><div class="quest-progress"><i style="width:62%"></i></div><small>5 / 8 Sói hoang</small><div class="quest-reward">Phần thưởng: 1.200 EXP · 500 Xu</div></div><div class="quest-card"><b>✦ Gặp trưởng làng</b><p>Đến gặp trưởng làng để nhận chỉ dẫn.</p><small class="complete">Đã hoàn thành mục tiêu</small></div>`},
  map:{title:'Bản đồ thế giới',html:`<div class="map-large"><div class="map-location">◈ LÀNG SÓI TRẮNG</div><span class="map-pin p1">●</span><span class="map-pin p2">●</span><span class="map-pin p3">●</span><span class="map-path"></span></div><div class="map-legend"><span>● Vị trí của bạn</span><span>◆ NPC</span><span>♞ Quái vật</span></div>`},
  friends:{title:'Bạn bè',html:`<div class="friend-list"><div class="nearby"><div class="nearby-avatar blue">風</div><div><b>PhongVân</b><small>Đang trực tuyến · Cấp 27</small></div><button>Mời nhóm</button></div><div class="nearby"><div class="nearby-avatar red">炎</div><div><b>HỏaLong</b><small>Đang trực tuyến · Cấp 31</small></div><button>Nhắn tin</button></div><div class="nearby"><div class="nearby-avatar green">月</div><div><b>NguyệtNhi</b><small>Đang trực tuyến · Cấp 24</small></div><button>Mời nhóm</button></div></div>`},
  guild:{title:'Bang hội',html:`<div class="empty-state"><span>⚑</span><b>Chưa gia nhập bang hội</b><p>Gia nhập bang hội để cùng bằng hữu khám phá thế giới.</p><button class="gold-button">Tìm bang hội</button></div>`},
  ranking:{title:'Bảng xếp hạng',html:`<div class="tabs"><button class="chosen">Cấp độ</button><button>Chiến lực</button><button>Bang hội</button></div><div class="rank-list"><p>① <b>ThiênMệnh</b><span>Cấp 68</span></p><p>② <b>PhongVân</b><span>Cấp 27</span></p><p>③ <b>HỏaLong</b><span>Cấp 31</span></p></div>`},
  events:{title:'Sự kiện',html:`<div class="quest-card"><b>✦ Đua top tân thủ</b><p>Nhận thưởng khi đạt mốc cấp độ trong thời gian sự kiện.</p><small>Thời gian còn lại: 5 ngày 12 giờ</small></div><div class="quest-card"><b>✦ Săn boss cuối tuần</b><p>Đánh bại boss thế giới cùng những người chơi khác.</p></div>`},
  settings:{title:'Cài đặt hiển thị',html:`<div class="settings-list"><label for="setting-player-name">Hiển thị tên nhân vật <input id="setting-player-name" data-setting="playerName" type="checkbox" checked></label><label for="setting-coordinates">Hiển thị tọa độ <input id="setting-coordinates" data-setting="coordinates" type="checkbox" checked></label><label for="setting-minimap">Hiển thị bản đồ nhỏ <input id="setting-minimap" data-setting="minimap" type="checkbox" checked></label><p class="settings-note">Tùy chọn được lưu trên trình duyệt này. Âm thanh và hiệu ứng chiến đấu sẽ được bổ sung khi có runtime tương ứng.</p><button type="button" class="gold-button" data-reset-display-settings>Khôi phục mặc định</button></div>`},
  help:{title:'Trợ giúp',html:`<div class="help-copy"><b>Điều khiển</b><p>Dùng cụm phím mũi tên để di chuyển nhân vật. Chọn kỹ năng ở thanh thao tác phía dưới để sử dụng.</p><b>Tương tác</b><p>Chạm vào NPC, người chơi hoặc quái vật trong bản đồ để xem các hành động khả dụng.</p></div>`},
  party:{title:'Tổ đội',html:`<div class="empty-state"><span>♙</span><b>Bạn chưa tham gia tổ đội</b><p>Tạo tổ đội hoặc nhận lời mời từ người chơi khác.</p><button class="gold-button">Tạo tổ đội</button></div>`},
  mail:{title:'Hòm thư',html:`<div class="empty-state"><span>✉</span><b>Hòm thư trống</b><p>Khi có thư mới, thư sẽ hiển thị tại đây.</p></div>`},
  shop:{title:'Cửa hàng',html:`<div class="tabs"><button class="chosen">Vật phẩm</button><button>Trang bị</button><button>Tiện ích</button></div><div class="shop-row"><span>🧪</span><b>Bình máu nhỏ</b><small>150 Xu</small><button>Mua</button></div><div class="shop-row"><span>🧴</span><b>Bình mana nhỏ</b><small>150 Xu</small><button>Mua</button></div>`}
};
let activeCharacterName='Kiếm Khách',activeCharacterClass='Kiếm khách';
const characterState=createCharacterState();
const skillCombat=createSkillCombatState();
const questState=createQuestState();
const worldEntityState=createWorldEntityState();

function openWindow(key){
  const p=panelData[key]||panelData.help;
  document.querySelector('#window-title').textContent=p.title;
  const html=['character','inventory','equipment'].includes(key)?renderCharacterPanel(key):key==='skills'?renderSkillPanel():key==='quests'?renderQuestPanel():p.html;
  document.querySelector('#window-content').innerHTML=html;
  document.querySelector('#game-window').classList.add('open');
  document.querySelector('#modal-backdrop').classList.add('show');
  document.querySelectorAll('.side-nav button').forEach(b=>b.classList.toggle('active',b.dataset.window===key));
  if(key==='resources')renderResourceViewer(document.querySelector('#resource-viewer'));
  if(key==='settings')syncDisplaySettings();
}
function closeWindow(){document.querySelector('#game-window').classList.remove('open');document.querySelector('#modal-backdrop').classList.remove('show');}
const DISPLAY_SETTINGS_KEY='kpah.display-settings.v1';
const displaySettings={playerName:true,coordinates:true,minimap:true};
function loadDisplaySettings(){try{const saved=JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY)||'null');if(saved&&typeof saved==='object'){for(const key of Object.keys(displaySettings)){if(typeof saved[key]==='boolean')displaySettings[key]=saved[key];}}}catch(error){console.warn('Không thể đọc cài đặt hiển thị đã lưu.',error);}}
function saveDisplaySettings(){try{localStorage.setItem(DISPLAY_SETTINGS_KEY,JSON.stringify(displaySettings));}catch(error){console.warn('Không thể lưu cài đặt hiển thị.',error);}}
loadDisplaySettings();
function syncDisplaySettings(){document.querySelectorAll('[data-setting]').forEach(input=>{input.checked=displaySettings[input.dataset.setting]!==false;});applyDisplaySettings();}
function applyDisplaySettings(){const scene=game.scene.getScene('world');if(scene?.playerLabel)scene.playerLabel.setVisible(displaySettings.playerName);const coords=document.querySelector('.world-coords');if(coords)coords.style.display=displaySettings.coordinates?'':'none';const map=document.querySelector('.mini-map');if(map)map.style.display=displaySettings.minimap?'':'none';}
document.querySelector('#window-content').addEventListener('change',event=>{const input=event.target.closest('[data-setting]');if(!input)return;displaySettings[input.dataset.setting]=input.checked;saveDisplaySettings();applyDisplaySettings();});
document.querySelector('#window-content').addEventListener('click',event=>{if(!event.target.closest('[data-reset-display-settings]'))return;Object.assign(displaySettings,{playerName:true,coordinates:true,minimap:true});saveDisplaySettings();syncDisplaySettings();});
document.querySelectorAll('[data-window]').forEach(b=>b.addEventListener('click',()=>openWindow(b.dataset.window)));
document.querySelector('#window-close').addEventListener('click',closeWindow);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('#game-window').classList.contains('open'))closeWindow();});
document.querySelector('#modal-backdrop').addEventListener('click',closeWindow);
document.querySelector('#logout').addEventListener('click',()=>window.dispatchEvent(new Event('kpah:logout')));
const chatChannelSelect=document.querySelector('#chat-channel-select');
const chatLines=document.querySelector('#chat-lines');
const chatChannelNames={world:'Thế giới',guild:'Bang hội',private:'Riêng',system:'Hệ thống'};
function selectChatChannel(channel){
  chatChannelSelect.value=channel;
  document.querySelectorAll('.chat-tabs [data-chat-channel]').forEach(button=>button.classList.toggle('selected',button.dataset.chatChannel===channel));
  chatLines.querySelectorAll('[data-channel]').forEach(line=>{line.hidden=line.dataset.channel!==channel;});
  const readOnly=channel==='system';
  document.querySelector('#chat-input').disabled=readOnly;
  document.querySelector('#chat-input').placeholder=readOnly?'Kênh hệ thống chỉ để xem...':channel==='private'?'Nhập tin nhắn riêng...':'Nhập nội dung trò chuyện...';
  document.querySelector('#chat-form button').disabled=readOnly;
  chatLines.scrollTop=chatLines.scrollHeight;
}
document.querySelectorAll('.chat-tabs [data-chat-channel]').forEach(button=>button.addEventListener('click',()=>selectChatChannel(button.dataset.chatChannel)));
chatChannelSelect.addEventListener('change',()=>selectChatChannel(chatChannelSelect.value));
document.querySelector('#chat-form').addEventListener('submit',e=>{
  e.preventDefault();
  const input=document.querySelector('#chat-input');
  const message=input.value.trim();
  const channel=chatChannelSelect.value;
  if(!message||channel==='system')return;
  const line=document.createElement('p');
  line.dataset.channel=channel;
  const label=document.createElement('b');
  label.className=channel==='world'?'world-chat':'system';
  label.textContent='['+chatChannelNames[channel]+']';
  const author=document.createElement('strong');
  author.textContent=activeCharacterName;
  line.append(label,document.createTextNode(' '),author,document.createTextNode(': '+message));
  chatLines.append(line);
  input.value='';
  selectChatChannel(channel);
});
selectChatChannel('world');
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderCharacterPanel(key){
  const data=characterState.snapshot();
  const stats=data.stats;
  const statRows=Object.entries(characterState.statLabels).map(([id,label])=>`
    <div class="progression-stat"><div><small>${label}</small><b>${stats[id]}</b></div><button type="button" data-stat-up="${id}" ${data.statPoints<=0?'disabled':''}>+</button></div>`).join('');
  if(key==='character')return `
    <div class="character-overview">
      <div class="character-portrait"><div class="portrait-art">⚔</div><span>Cấp ${data.level}</span></div>
      <div class="character-overview-main"><h2>${escapeHtml(data.name)}</h2><p class="muted">${escapeHtml(data.profession)} · Nhân vật</p>
        <div class="character-xp"><div><span>Kinh nghiệm</span><b>${data.experience.toLocaleString('vi-VN')} / ${data.nextLevelExperience.toLocaleString('vi-VN')}</b></div><i><em style="width:${Math.min(100,data.experience/data.nextLevelExperience*100)}%"></em></i></div>
        <div class="character-vitals"><div><span>HP</span><b>${data.hp.toLocaleString('vi-VN')} / ${data.maxHp.toLocaleString('vi-VN')}</b></div><div><span>MP</span><b>${data.mp.toLocaleString('vi-VN')} / ${data.maxMp.toLocaleString('vi-VN')}</b></div></div>
        <div class="progression-stat-grid">${statRows}</div>
        <div class="potential-footer"><span>Điểm tiềm năng còn: <b>${data.statPoints}</b></span><small>Điểm cộng được áp dụng ngay trong bản demo.</small></div>
      </div>
    </div>
    <div class="character-subnav"><button type="button" data-character-open="equipment">Trang bị nhân vật</button><button type="button" data-character-open="inventory">Mở hành trang</button></div>`;
  if(key==='equipment'){
    const slots=data.equipmentSlots.map(([id,label,icon])=>{
      const itemId=data.equipment[id];
      const equipped=itemId?({ 'starter-sword':'Kiếm tân thủ','cloth-hat':'Mũ vải','cloth-armor':'Áo vải','bronze-ring':'Nhẫn đồng'}[itemId]||'Trang bị'):'Chưa trang bị';
      return `<div class="equip-cell ${itemId?'filled':''}"><span>${icon}</span><small>${label}</small><b>${equipped}</b>${itemId?`<button type="button" data-unequip="${id}">Tháo</button>`:''}</div>`;
    }).join('');
    return `<div class="equipment-screen"><div class="equip-slots">${slots}</div><div class="equip-preview"><div class="equip-character">⚔</div><b>${escapeHtml(data.name)}</b><small>${escapeHtml(data.profession)} · Cấp ${data.level}</small><div class="equip-summary"><span>HP <b>${data.maxHp}</b></span><span>MP <b>${data.maxMp}</b></span></div></div></div><p class="panel-hint">Chọn vật phẩm trang bị trong hành trang để thay đổi bộ trang bị.</p><button type="button" class="gold-button" data-character-open="inventory">Mở hành trang</button>`;
  }
  const categories=[['all','Tất cả'],['equipment','Trang bị'],['consumable','Tiêu hao'],['material','Nguyên liệu'],['quest','Nhiệm vụ']];
  const items=data.inventory.map(item=>`<article class="inventory-item" data-item-category="${item.category}"><div class="inventory-item-icon">${item.icon}</div><b>${escapeHtml(item.name)}</b><small>${item.category==='equipment'?'Trang bị':item.category==='consumable'?'Vật phẩm tiêu hao':item.category==='material'?'Nguyên liệu':'Nhiệm vụ'}</small><em>×${item.quantity}</em><button type="button" data-item-action="${item.category==='equipment'?'equip':item.category==='consumable'?'use':'info'}" data-item-id="${item.id}" ${item.category==='material'||item.category==='quest'?'disabled':''}>${item.category==='equipment'?'Trang bị':item.category==='consumable'?'Sử dụng':'Chi tiết'}</button></article>`).join('');
  return `<div class="inventory-toolbar"><div class="inventory-capacity"><b>${data.inventory.length} / ${data.inventoryCapacity}</b><span>Ô hành trang đang sử dụng</span></div><div class="inventory-currency"><span>Xu <b>125.600</b></span><span>Lượng <b>320</b></span></div></div><div class="tabs inventory-tabs">${categories.map(([id,label],i)=>`<button type="button" class="${i===0?'chosen':''}" data-inventory-filter="${id}">${label}</button>`).join('')}</div><div class="inventory-grid inventory-grid-live">${items||'<div class="inventory-empty">Hành trang trống</div>'}</div><p class="panel-hint">Vật phẩm và thao tác hiện được mô phỏng ở client; chưa đồng bộ máy chủ.</p>`;
}


function renderQuestPanel(){
  const data=questState.snapshot();
  const initialFilter=data.counts.completed?'completed':data.counts.active?'active':data.quests.some(q=>q.status==='available')?'available':'claimed';
  const filters=[
    ['active','Đang thực hiện',data.counts.active],
    ['available','Có thể nhận',data.quests.filter(q=>q.status==='available').length],
    ['completed','Chờ nhận thưởng',data.counts.completed],
    ['claimed','Đã nhận',data.counts.claimed]
  ];
  const cards=data.quests.map(quest=>{
    const percent=Math.min(100,quest.progress/quest.objective.required*100);
    const reward=quest.reward;
    const rewardText=[reward.experience+' EXP',reward.currency+' Xu',...reward.items.map(item=>item.quantity+' vật phẩm')].join(' · ');
    const action=quest.status==='available'
      ?`<button type="button" data-quest-accept="${quest.id}">Nhận nhiệm vụ</button>`
      :quest.status==='completed'
        ?`<button type="button" data-quest-claim="${quest.id}">Nhận thưởng</button>`
        :quest.status==='claimed'?'<span class="quest-state-tag claimed">Đã nhận thưởng</span>':'<span class="quest-state-tag active">Đang thực hiện</span>';
    return `<article class="quest-card-live" data-quest-status="${quest.status}" ${quest.status!==initialFilter?'hidden':''}>
      <div class="quest-card-heading"><span class="quest-symbol">⚑</span><div><b>${escapeHtml(quest.title)}</b><small>${quest.status==='available'?'Chưa nhận':quest.status==='active'?'Đang thực hiện':quest.status==='completed'?'Hoàn thành mục tiêu':'Đã hoàn tất'}</small></div></div>
      <p>${escapeHtml(quest.description)}</p>
      <div class="quest-objective"><span>${escapeHtml(quest.objective.label)}</span><b>${quest.progress} / ${quest.objective.required}</b></div>
      <div class="quest-progress-live"><i style="width:${percent}%"></i></div>
      <div class="quest-reward-live"><small>Phần thưởng</small><span>${escapeHtml(rewardText)}</span></div>
      <div class="quest-card-footer">${action}</div>
    </article>`;
  }).join('');
  return `<div class="quest-summary"><div><b>${data.counts.active}</b><small>Đang làm</small></div><div><b>${data.quests.filter(q=>q.status==='available').length}</b><small>Có thể nhận</small></div><div><b>${data.counts.completed}</b><small>Chờ thưởng</small></div></div>
    <div class="quest-filter-tabs">${filters.map(([id,label,count])=>`<button type="button" data-quest-filter="${id}" class="${id===initialFilter?'chosen':''}">${label} <em>${count}</em></button>`).join('')}</div>
    <div class="quest-list-live">${cards}</div>
    <div class="quest-history"><b>Nhật ký nhiệm vụ</b>${data.log.map(line=>`<p>${escapeHtml(line)}</p>`).join('')}</div>
    <p class="panel-hint">Nhiệm vụ, mục tiêu và phần thưởng hiện là dữ liệu mô phỏng phía client, chưa phải nội dung máy chủ KPAH.</p>`;
}
function claimQuestReward(id){
  const result=questState.claim(id);
  if(!result.ok){toast(result.message);return;}
  const reward=result.reward;
  const exp=characterState.addExperience(reward.experience);
  const coins=characterState.addCurrency(reward.currency);
  const items=reward.items.map(item=>characterState.addItem(item.id,item.quantity));
  questState.record('claim','any');
  updateQuestBadge();
  updateCharacterHud();
  const itemFailures=items.filter(item=>!item.ok).length;
  toast('Nhận '+reward.experience+' EXP · '+reward.currency+' Xu'+(exp.levelsGained?' · Lên cấp '+exp.level:'')+(itemFailures?' · Hành trang đầy, thiếu vật phẩm':''));
  document.querySelector('#window-content').innerHTML=renderQuestPanel();
}

function renderSkillPanel(){
  const data=skillCombat.snapshot();
  const active=data.skills.filter(skill=>skill.type==='active');
  const passive=data.skills.filter(skill=>skill.type==='passive');
  const cards=items=>items.map(skill=>{
    const learned=skill.level>0;
    const maxed=skill.level>=skill.maxLevel;
    const cost=learned?1:(skill.requiredPoints||1);
    const assigned=data.loadout.indexOf(skill.id);
    const cooldown=data.cooldowns[skill.id]||0;
    return `<article class="skill-card ${learned?'learned':'locked'}">
      <div class="skill-icon">${skill.icon}</div>
      <div class="skill-card-main"><div class="skill-card-title"><b>${escapeHtml(skill.name)}</b><span>${learned?'Cấp '+skill.level:'Chưa học'}</span></div>
        <p>${escapeHtml(skill.description)}</p>
        <small>${skill.type==='passive'?'Bị động':`MP ${skill.mpCost} · Hồi chiêu ${skill.cooldown} lượt`}</small>
        ${skill.type==='active'&&learned?`<label class="skill-assign">Gán ô thao tác <select data-skill-assign="${skill.id}"><option value="">Chưa gán</option>${[1,2,3,4].map(slot=>`<option value="${slot}" ${assigned===slot-1?'selected':''}>Ô ${slot}</option>`).join('')}</select></label>`:''}
      </div>
      <div class="skill-card-actions">${maxed?'<span class="skill-max">Tối đa</span>':`<button type="button" data-skill-upgrade="${skill.id}" ${data.skillPoints<cost?'disabled':''}>${learned?'Nâng cấp':'Học'} · ${cost} điểm</button>`}</div>
      ${cooldown? `<em class="skill-cooldown">Hồi chiêu ${cooldown}</em>`:''}
    </article>`;
  }).join('');
  const target=data.target;
  const hpPercent=Math.max(0,target.hp/target.maxHp*100);
  return `<div class="skill-header"><div><b>Điểm kỹ năng: <strong>${data.skillPoints}</strong></b><small>Học và nâng cấp kỹ năng, sau đó gán vào thanh thao tác.</small></div><span class="skill-mode">CLIENT DEMO</span></div>
    <section class="training-battle">
      <div class="training-target"><div class="training-monster">♞</div><div class="training-target-info"><b>${escapeHtml(target.name)}</b><small>Cấp ${target.level} · Mục tiêu luyện tập</small><div class="training-hp"><i style="width:${hpPercent}%"></i></div><small>${target.hp.toLocaleString('vi-VN')} / ${target.maxHp.toLocaleString('vi-VN')} HP</small></div></div>
      <div class="training-controls"><span>Lượt ${data.turn}</span><button type="button" data-training-reset>${data.battleActive?'Đặt lại mục tiêu':'Đánh lại'}</button></div>
      <div class="training-log">${data.log.map(line=>`<p>${escapeHtml(line)}</p>`).join('')}</div>
      <p class="panel-hint">Mô phỏng chiến đấu theo lượt ở client. Công thức và chỉ số chỉ là dữ liệu thử nghiệm, không đại diện máy chủ KPAH.</p>
    </section>
    <div class="skill-section-title">KỸ NĂNG CHỦ ĐỘNG</div><div class="skill-list skill-list-live">${cards(active)}</div>
    <div class="skill-section-title">KỸ NĂNG BỊ ĐỘNG</div><div class="skill-list skill-list-live">${cards(passive)}</div>`;
}
function renderWorldTarget(){
  const target=worldEntityState.snapshot().selected;
  const panel=document.querySelector('#world-target');
  if(!panel)return;
  if(!target){panel.hidden=true;return;}
  panel.hidden=false;
  document.querySelector('#world-target-name').textContent=target.name;
  document.querySelector('#world-target-level').textContent='Cấp '+target.level;
  document.querySelector('#world-target-hp').textContent=target.hp.toLocaleString('vi-VN')+' / '+target.maxHp.toLocaleString('vi-VN')+' HP';
  document.querySelector('#world-target-health-fill').style.width=(target.hp/target.maxHp*100)+'%';
}
function updateActionBar(){
  const data=skillCombat.snapshot();
  const icons={basic:'⚔','sword-wave':'✧',heal:'✚','combo-slash':'⚔','blade-storm':'✹'};
  const names=Object.fromEntries(data.skills.map(skill=>[skill.id,skill.name]));
  document.querySelectorAll('.action-slots .slot').forEach((button,index)=>{
    if(index===4){button.dataset.skill='Bình HP';button.querySelector('span').textContent='🧪';button.querySelector('em').textContent='Bình HP';return;}
    const id=data.loadout[index];
    button.dataset.skillId=id||'';
    button.dataset.skill=id?names[id]:'Chưa gán';
    button.querySelector('span').textContent=id?icons[id]||'✦':'＋';
    button.querySelector('em').textContent=id?names[id]:'Trống';
    const cooldown=id?(data.cooldowns[id]||0):0;
    button.classList.toggle('on-cooldown',cooldown>0);
    button.title=cooldown?'Hồi chiêu '+cooldown+' lượt':(id?names[id]:'Chưa gán kỹ năng');
  });
}
function showCombatFeedback(result){
  const frame=document.querySelector('.world-frame');
  if(!frame)return;
  const effect=document.createElement('div');
  effect.className='combat-feedback '+(result.healing?'healing':'damage');
  effect.textContent=result.healing?'+'+result.healing+' HP':'-'+result.damage;
  frame.appendChild(effect);
  effect.addEventListener('animationend',()=>effect.remove(),{once:true});
}
function executeActionSlot(slot){
  if(slot===5){
    const item=characterState.snapshot().inventory.find(entry=>entry.category==='consumable'&&entry.restore?.hp);
    if(!item){toast('Không còn bình HP trong hành trang.');return;}
    const result=characterState.useItem(item.id);
    toast(result.message);updateCharacterHud();refreshCharacterPanel();return;
  }
  const target=worldEntityState.snapshot().selected;
  if(!target){toast('Hiện không có quái vật sống trong khu vực. Hãy chờ chúng hồi sinh.');return;}
  skillCombat.setTarget(target);
  const character=characterState.snapshot();
  const result=skillCombat.useSlot(slot,character);
  if(!result.ok){toast(result.message);return;}
  characterState.spendMp(result.mpCost);
  if(result.healing)characterState.restoreHp(result.healing);
  const worldHit=worldEntityState.damage(target.id,result.damage);
  if(worldHit.ok){
    result.targetHp=worldHit.monster.hp;
    result.targetMaxHp=worldHit.monster.maxHp;
    result.defeated=worldHit.defeated;
    result.enemyDamage=worldHit.defeated?0:target.damage;
    if(worldHit.defeated){
      if(target.type==='training-wolf')questState.record('kill','training-wolf');
      const gained=characterState.addExperience(worldHit.experience);
      const collected=[];
      for(const drop of worldHit.drops){
        const added=characterState.addItem(drop.itemId,drop.quantity);
        if(added.ok)collected.push(drop.quantity+' × '+added.itemId);
      }
      updateQuestBadge();
      result.message+=' · nhận '+worldHit.experience+' EXP'+(collected.length?' · rơi '+collected.join(', '):'');
      if(gained.levelsGained)toast('Lên cấp '+gained.level+'!');
      const nextTarget=worldEntityState.snapshot().selected;
      if(nextTarget)skillCombat.setTarget(nextTarget);
    }else{
      characterState.receiveDamage(result.enemyDamage);
    }
  }
  const afterAction=characterState.snapshot();
  if(afterAction.hp<=0)toast('Nhân vật đã gục. Hãy dùng bình HP trong hành trang.');
  showCombatFeedback(result);
  updateCharacterHud();
  updateActionBar();
  renderWorldTarget();
  const panel=document.querySelector('#window-title').textContent;
  if(panel==='Kỹ năng')document.querySelector('#window-content').innerHTML=renderSkillPanel();
  toast(result.message+(result.enemyDamage?' · nhận '+result.enemyDamage+' sát thương':''));
}

function refreshCharacterPanel(){
  const title=document.querySelector('#window-title').textContent;
  const key=title==='Thông tin nhân vật'?'character':title==='Trang bị nhân vật'?'equipment':title==='Hành trang'?'inventory':null;
  if(key)document.querySelector('#window-content').innerHTML=renderCharacterPanel(key);
  updateCharacterHud();
}
function updateCharacterHud(){
  const data=characterState.snapshot();
  document.querySelectorAll('.hero-name').forEach(el=>el.textContent=data.name);
  const profile=document.querySelector('.profile-info');
  if(profile){
    const labels=profile.querySelectorAll('.bar-label b');
    if(labels[0])labels[0].textContent=data.hp.toLocaleString('vi-VN')+' / '+data.maxHp.toLocaleString('vi-VN');
    if(labels[1])labels[1].textContent=data.mp.toLocaleString('vi-VN')+' / '+data.maxMp.toLocaleString('vi-VN');
    const bars=profile.querySelectorAll('.meter i');
    if(bars[0])bars[0].style.width=(data.hp/data.maxHp*100)+'%';
    if(bars[1])bars[1].style.width=(data.mp/data.maxMp*100)+'%';
  }
  const wallet=document.querySelector('.mini-status div:first-child b');
  if(wallet)wallet.textContent=data.currency.toLocaleString('vi-VN');
  const level=document.querySelector('.avatar-frame .level');
  if(level)level.textContent=String(data.level);
}
function updateQuestBadge(){
  const button=document.querySelector('[data-window="quests"]');
  if(!button)return;
  const pending=questState.snapshot().counts.completed;
  let badge=button.querySelector('.quest-nav-count');
  if(pending>0){
    if(!badge){badge=document.createElement('em');badge.className='quest-nav-count';button.appendChild(badge);}
    badge.textContent=String(pending);
  }else if(badge)badge.remove();
}
updateCharacterHud();
updateActionBar();
updateQuestBadge();

let toastTimer;function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}
function selectActionSlot(button){
  if(!button)return;
  document.querySelectorAll('.slot').forEach(slot=>slot.classList.toggle('active',slot===button));
  executeActionSlot(Number(button.querySelector('small')?.textContent||0));
}
document.querySelectorAll('.slot').forEach(button=>button.addEventListener('click',()=>selectActionSlot(button)));
window.addEventListener('keydown',event=>{
  if(document.querySelector('.login-cover'))return;
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  const target=event.target;
  if(target instanceof HTMLElement&&(target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;
  if(!/^[1-5]$/.test(event.key))return;
  const slot=document.querySelectorAll('.slot')[Number(event.key)-1];
  if(slot){event.preventDefault();selectActionSlot(slot);}
});
document.querySelector('#window-content').addEventListener('change',event=>{
  const select=event.target.closest('[data-skill-assign]');
  if(!select)return;
  const result=select.value
    ?skillCombat.assignSkill(select.dataset.skillAssign,Number(select.value))
    :skillCombat.unassignSkill(select.dataset.skillAssign);
  toast(result.message);updateActionBar();document.querySelector('#window-content').innerHTML=renderSkillPanel();
});
document.querySelector('#window-content').addEventListener('click',event=>{
  const accept=event.target.closest('[data-quest-accept]')?.dataset.questAccept;
  if(accept){const result=questState.accept(accept);toast(result.message);document.querySelector('#window-content').innerHTML=renderQuestPanel();return;}
  const claim=event.target.closest('[data-quest-claim]')?.dataset.questClaim;
  if(claim){claimQuestReward(claim);return;}
  const filter=event.target.closest('[data-quest-filter]')?.dataset.questFilter;
  if(filter){
    document.querySelectorAll('[data-quest-filter]').forEach(button=>button.classList.toggle('chosen',button.dataset.questFilter===filter));
    document.querySelectorAll('.quest-card-live').forEach(card=>card.hidden=card.dataset.questStatus!==filter);
    return;
  }
  const upgrade=event.target.closest('[data-skill-upgrade]')?.dataset.skillUpgrade;
  if(upgrade){const result=skillCombat.learnOrUpgrade(upgrade);toast(result.message);updateActionBar();document.querySelector('#window-content').innerHTML=renderSkillPanel();return;}
  if(event.target.closest('[data-training-reset]')){skillCombat.resetTarget();updateActionBar();document.querySelector('#window-content').innerHTML=renderSkillPanel();toast('Đã làm mới mục tiêu luyện tập.');return;}
  const stat=event.target.closest('[data-stat-up]')?.dataset.statUp;
  if(stat){const result=characterState.allocateStat(stat);toast(result.message);refreshCharacterPanel();return;}
  const itemButton=event.target.closest('[data-item-action]');
  if(itemButton){
    const id=itemButton.dataset.itemId;
    const result=itemButton.dataset.itemAction==='equip'?characterState.equip(id):itemButton.dataset.itemAction==='use'?characterState.useItem(id):{ok:false,message:'Đây là vật phẩm không thể sử dụng trực tiếp.'};
    toast(result.message);
    refreshCharacterPanel();
    return;
  }
  const slot=event.target.closest('[data-unequip]')?.dataset.unequip;
  if(slot){const result=characterState.unequip(slot);toast(result.message);refreshCharacterPanel();return;}
  const panel=event.target.closest('[data-character-open]')?.dataset.characterOpen;
  if(panel){openWindow(panel);return;}
});
document.querySelector('#window-content').addEventListener('click',event=>{
  const button=event.target.closest('.tabs button');
  if(!button)return;
  const tabs=button.closest('.tabs');
  tabs.querySelectorAll('button').forEach(item=>item.classList.toggle('chosen',item===button));
  if(button.dataset.inventoryFilter){
    const filter=button.dataset.inventoryFilter;
    document.querySelectorAll('#window-content [data-item-category]').forEach(item=>{
      item.hidden=filter!=='all'&&item.dataset.itemCategory!==filter;
    });
  }
});
window.addEventListener('kpah:monster-select',event=>{
  const id=event.detail?.id;
  const result=worldEntityState.select(id);
  if(!result.ok){toast(result.message);return;}
  skillCombat.setTarget(result.monster);
  renderWorldTarget();
  toast('Đã chọn '+result.monster.name+'. Tiếp cận mục tiêu và sử dụng kỹ năng.');
});
window.addEventListener('kpah:npc-interact',event=>{
  const npc=event.detail?.name;
  const actions={
    'Trưởng làng':{description:'Dân làng đang cần người giúp đỡ. Hãy xem các nhiệm vụ hiện có.',buttons:[['Xem nhiệm vụ','quests'],['Để sau','close']]},
    'Thương nhân':{description:'Thương nhân bày bán vật phẩm cơ bản cho chuyến hành trình.',buttons:[['Mở cửa hàng','shop'],['Để sau','close']]}
  };
  const data=actions[npc];
  if(!data)return;
  if(npc==='Trưởng làng'){
    questState.record('talk','elder');
    updateQuestBadge();
  }
  document.querySelector('#window-title').textContent=npc;
  document.querySelector('#window-content').innerHTML='<div class="npc-dialog"><p>'+escapeHtml(data.description)+'</p><div class="npc-actions">'+data.buttons.map(([label,action])=>'<button class="gold-button" data-npc-action="'+action+'">'+label+'</button>').join('')+'</div></div>';
  document.querySelector('#game-window').classList.add('open');
  document.querySelector('#modal-backdrop').classList.add('show');
  document.querySelectorAll('.side-nav button').forEach(button=>button.classList.remove('active'));
});
document.querySelector('#window-content').addEventListener('click',event=>{
  const action=event.target.closest('[data-npc-action]')?.dataset.npcAction;
  if(!action)return;
  if(action==='close'){closeWindow();return;}
  openWindow(action);
});
const movementVectors={'move-left':[-1,0],'move-right':[1,0],'move-up':[0,-1],'move-down':[0,1]};
function movePlayer(dx,dy){
  const scene=game.scene.getScene('world');
  scene?.movePlayerBy(dx,dy);
}
let activeMovement=null;
function stopActiveMovement(){
  if(!activeMovement)return;
  clearInterval(activeMovement.repeat);
  activeMovement=null;
}
document.querySelectorAll('.movement button').forEach(button=>{
  const vector=movementVectors[button.id];
  if(!vector)return;
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    event.preventDefault();
    stopActiveMovement();
    try{button.setPointerCapture(event.pointerId);}catch(error){/* Capture is optional on older browsers. */}
    movePlayer(...vector);
    activeMovement={button,pointerId:event.pointerId,repeat:setInterval(()=>{
      if(activeMovement?.button===button)movePlayer(...vector);
    },145)};
  });
  button.addEventListener('pointerup',event=>{
    if(activeMovement?.button===button&&activeMovement.pointerId===event.pointerId)stopActiveMovement();
  });
  button.addEventListener('pointercancel',stopActiveMovement);
  button.addEventListener('lostpointercapture',()=>{
    if(activeMovement?.button===button)stopActiveMovement();
  });
});
window.addEventListener('blur',stopActiveMovement);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)stopActiveMovement();
});
window.addEventListener('kpah:character-selected',event=>{
  const {name,className}=event.detail||{};
  const safeName=name||'Kiếm Khách';
  activeCharacterName=safeName;activeCharacterClass=className||'Kiếm khách';
  characterState.setIdentity(safeName,activeCharacterClass);
  updateCharacterHud();
  document.querySelectorAll('.hero-name').forEach(el=>el.textContent=safeName);
  document.querySelectorAll('#chat-lines strong').forEach(el=>{if(el.textContent==='Kiếm Khách')el.textContent=safeName;});
  const scene=game.scene.getScene('world');
  if(scene?.playerLabel)scene.playerLabel.setText(safeName);
  const heading=document.querySelector('.character-details h2');
  if(heading)heading.textContent=safeName;
  const role=document.querySelector('.character-details .muted');
  if(role)role.textContent=(className||'Kiếm khách')+' · Nhân vật';
});

class WorldScene extends Phaser.Scene {
  constructor(){super('world');this.player={x:480,y:330};this.worldBounds={x:0,y:0,width:960,height:560};this.walkBounds={x:30,y:270,width:900,height:250};this.monsterViews=[];}
  create(){
    const g=this.add.graphics();g.fillGradientStyle(0x344c39,0x344c39,0x243b31,0x243b31,1);g.fillRect(0,0,960,560);
    for(let y=0;y<560;y+=42){for(let x=0;x<960;x+=42){const shade=((x*13+y*7)%5);g.fillStyle(shade===0?0x456044:shade===1?0x3b563e:0x38533b,0.45);g.fillRect(x+((y/42)%2)*20,y,40,38);}}
    // Stone path and village square
    g.fillStyle(0x9a8867,0.9);g.fillPoints([new Phaser.Geom.Point(0,390),new Phaser.Geom.Point(240,340),new Phaser.Geom.Point(430,350),new Phaser.Geom.Point(640,300),new Phaser.Geom.Point(960,330),new Phaser.Geom.Point(960,470),new Phaser.Geom.Point(650,430),new Phaser.Geom.Point(420,455),new Phaser.Geom.Point(190,440)],true);
    g.lineStyle(3,0x655744,0.55);g.strokePoints([new Phaser.Geom.Point(0,390),new Phaser.Geom.Point(240,340),new Phaser.Geom.Point(430,350),new Phaser.Geom.Point(640,300),new Phaser.Geom.Point(960,330)],true);
    this.drawTree(g,110,170,1.2);this.drawTree(g,220,100,0.9);this.drawTree(g,820,155,1.35);this.drawTree(g,720,95,0.9);this.drawTree(g,900,390,1);
    this.drawHouse(g,330,185,1.05,0x9a5542);this.drawHouse(g,650,180,0.9,0x6f7f91);this.drawHouse(g,505,100,0.75,0x9a804f);
    this.drawNpc(370,325,0xf0c16b,'Trưởng làng');this.drawNpc(715,320,0x7ec3c8,'Thương nhân');
    this.createMonsterViews();
    // Ambient flowers and rocks
    for(let i=0;i<45;i++){const x=(i*173+47)%950,y=(i*97+35)%500;if(y<280&&x>280&&x<700)continue;g.fillStyle(i%3===0?0xd9c16d:0x8eb66a,0.8);g.fillCircle(x,y,1.7);}
    this.playerSprite=this.add.container(this.player.x,this.player.y);const shadow=this.add.ellipse(0,19,28,9,0x111510,0.35);const cape=this.add.triangle(0,2,0,-2,-17,20,13,20,0x9b3f32);const body=this.add.rectangle(0,0,17,25,0xd5d0b9).setStrokeStyle(2,0x42372b);const head=this.add.circle(0,-17,8,0xe0b88d).setStrokeStyle(2,0x42372b);const hair=this.add.triangle(0,-23,-8,-16,0,-31,9,-15,0x29232a);const sword=this.add.rectangle(13,-3,4,27,0xd6d8d1).setAngle(25).setStrokeStyle(1,0x514d48);this.playerSprite.add([shadow,cape,body,head,hair,sword]);setWorldEntityDepth(this.playerSprite);
    this.playerLabel=this.add.text(480,282,'Kiếm Khách',{fontFamily:'Arial',fontSize:'12px',color:'#fff3c6',stroke:'#34251d',strokeThickness:3}).setOrigin(.5).setDepth(999);
    this.destinationMarker=this.add.circle(0,0,12,0xf4d58c,0.18)
      .setStrokeStyle(2,0xf4d58c,0.9).setDepth(500).setVisible(false);
    this.destinationPulse=this.tweens.add({
      targets:this.destinationMarker,scale:1.35,alpha:0.25,duration:650,
      yoyo:true,repeat:-1,paused:true,ease:'Sine.easeInOut'
    });
    this.configureCamera();
    this.coordsLabel=document.querySelector('.world-coords');
    this.mapPlayerMarker=document.querySelector('.map-player');
    this.add.text(370,291,'Trưởng làng',{fontFamily:'Arial',fontSize:'11px',color:'#ffe6a8',stroke:'#30251a',strokeThickness:3}).setOrigin(.5);
    this.add.text(715,286,'Thương nhân',{fontFamily:'Arial',fontSize:'11px',color:'#ffe6a8',stroke:'#30251a',strokeThickness:3}).setOrigin(.5);
    this.input.on('pointerdown',p=>this.movePlayerTo(p.worldX,p.worldY,450,true));
    this.scale.on('resize',()=>this.cameras.main.setSize(this.scale.width,this.scale.height));
  }
  createMonsterViews(){
    for(const monster of worldEntityState.snapshot().monsters){
      const view=this.drawMonster(monster);
      this.monsterViews.push({id:monster.id,view,monster});
    }
    renderWorldTarget();
  }
  drawMonster(monster){
    const c=this.add.container(monster.x,monster.y);
    const elite=monster.id==='pack-leader';
    const color=elite?0x8c4c46:0x777d55;
    const shadow=this.add.ellipse(0,13,30,8,0x10130f,.4);
    const body=this.add.ellipse(0,0,elite?31:25,18,color).setStrokeStyle(2,0x30291f);
    const head=this.add.circle(elite?13:10,-8,elite?9:7,0xa99a72).setStrokeStyle(2,0x30291f);
    const ear=this.add.triangle(elite?17:13,-16,-5,4,0,-8,5,4,0x55463a);
    const eye=this.add.circle(elite?16:13,-9,1.5,0xf4d18a);
    const label=this.add.text(0,-42,monster.name+' · Lv.'+monster.level,{fontFamily:'Arial',fontSize:elite?'11px':'10px',color:elite?'#ffd18b':'#f2e8c9',stroke:'#241e19',strokeThickness:3}).setOrigin(.5);
    const bar=this.add.rectangle(0,-31,34,4,0x241b19).setOrigin(.5);
    const fill=this.add.rectangle(-16,-31,30,2,0xb94d3e).setOrigin(0,.5);
    c.add([shadow,body,head,ear,eye,label,bar,fill]);
    c.setDepth(monster.y);
    c.setSize(42,54).setInteractive(new Phaser.Geom.Rectangle(-22,-27,44,54),Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown',(pointer,localX,localY,event)=>{
      event?.stopPropagation();
      window.dispatchEvent(new CustomEvent('kpah:monster-select',{detail:{id:monster.id}}));
    });
    c.setData('hpFill',fill);
    return c;
  }
  syncMonsterViews(){
    const revived=worldEntityState.update();
    const states=worldEntityState.snapshot().monsters;
    for(const entry of this.monsterViews){
      const state=states.find(item=>item.id===entry.id);
      if(!state)continue;
      entry.view.setVisible(state.alive);
      entry.view.setDepth(state.y);
      const fill=entry.view.getData('hpFill');
      if(fill)fill.width=Math.max(0,30*state.hp/state.maxHp);
    }
    if(revived.length){
      const selected=worldEntityState.snapshot().selected;
      if(selected){skillCombat.setTarget(selected);renderWorldTarget();}
    }
  }
  configureCamera(){
    configureWorldCamera(this,this.playerSprite,this.worldBounds,{
      lerpX:0.12,lerpY:0.12,deadzone:{width:180,height:100},roundPixels:true
    });
  }
  movePlayerBy(dx,dy){
    if(!this.playerSprite)return;
    const distance=18;
    this.movePlayerTo(this.playerSprite.x+dx*distance,this.playerSprite.y+dy*distance,105);
  }
  movePlayerTo(x,y,duration=120,showDestination=false){
    if(!this.playerSprite)return;
    const destination={
      x:Phaser.Math.Clamp(x,this.walkBounds.x,this.walkBounds.x+this.walkBounds.width),
      y:Phaser.Math.Clamp(y,this.walkBounds.y,this.walkBounds.y+this.walkBounds.height)
    };
    if(showDestination&&this.destinationMarker){
      this.destinationMarker.setPosition(destination.x,destination.y+18).setScale(1).setAlpha(0.9).setVisible(true);
      this.destinationPulse?.restart();
    }else if(this.destinationMarker){
      this.destinationPulse?.pause();
      this.destinationMarker.setVisible(false);
    }
    moveWorldEntity(this,this.playerSprite,destination,{
      bounds:this.walkBounds,duration,
      onComplete:()=>{
        if(showDestination&&this.destinationMarker){
          this.destinationPulse?.pause();
          this.destinationMarker.setVisible(false);
        }
      }
    });
  }
  update(){
    this.syncMonsterViews();
    if(!this.playerSprite)return;
    const {x,y}=this.playerSprite;
    if(this.playerLabel){
      this.playerLabel.setPosition(x,y-52);
      this.playerLabel.setDepth(this.playerSprite.depth+1);
      this.playerLabel.setVisible(displaySettings.playerName);
    }
    if(this.coordsLabel){
      this.coordsLabel.textContent='X: '+Math.round(x)+' · Y: '+Math.round(y);
    }
    if(this.mapPlayerMarker){
      this.mapPlayerMarker.style.left=(x/this.worldBounds.width*100)+'%';
      this.mapPlayerMarker.style.top=(y/this.worldBounds.height*100)+'%';
    }
  }
  drawTree(g,x,y,s){g.fillStyle(0x4a3325);g.fillRect(x-4*s,y,8*s,24*s);g.fillStyle(0x203c2a);g.fillCircle(x,y-8*s,22*s);g.fillStyle(0x365d39);g.fillCircle(x-8*s,y-17*s,15*s);g.fillStyle(0x537346);g.fillCircle(x+7*s,y-12*s,13*s);g.fillStyle(0x172d20,0.3);g.fillEllipse(x,y+20*s,38*s,8*s);}
  drawHouse(g,x,y,s,roof){g.fillStyle(0x2a241f);g.fillRect(x-42*s,y-42*s,84*s,70*s);g.fillStyle(0xc3a77b);g.fillRect(x-38*s,y-39*s,76*s,64*s);g.fillStyle(roof);g.fillPoints([new Phaser.Geom.Point(x-52*s,y-37*s),new Phaser.Geom.Point(x,y-79*s),new Phaser.Geom.Point(x+52*s,y-37*s)],true);g.fillStyle(0x563b2c);g.fillRect(x-10*s,y-2*s,20*s,27*s);g.fillStyle(0x7a9aa0);g.fillRect(x-31*s,y-24*s,13*s,15*s);g.fillRect(x+18*s,y-24*s,13*s,15*s);}
  drawNpc(x,y,color,name){
    const c=this.add.container(x,y);
    c.add([this.add.ellipse(0,14,22,7,0x111510,.35),this.add.rectangle(0,0,15,23,color).setStrokeStyle(2,0x3b3027),this.add.circle(0,-17,7,0xe2bd91).setStrokeStyle(2,0x3b3027),this.add.triangle(0,-23,-7,-15,0,-30,8,-15,0x41312a)]);
    c.setDepth(y);
    c.setInteractive(new Phaser.Geom.Rectangle(-19,-38,38,54),Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown',(pointer,localX,localY,event)=>{
      event?.stopPropagation();
      window.dispatchEvent(new CustomEvent('kpah:npc-interact',{detail:{name}}));
    });
    return c;
  }
}
const game=new Phaser.Game({type:Phaser.AUTO,parent:'world',width:960,height:560,backgroundColor:'#263c2d',render:{pixelArt:true,antialias:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[WorldScene]});
window.addEventListener('keydown',e=>{const dirs={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-15],ArrowDown:[0,15]};if(!dirs[e.key])return;const s=game.scene.getScene('world');if(!s.playerSprite)return;e.preventDefault();const [dx,dy]=dirs[e.key];s.movePlayerTo(s.playerSprite.x+dx,s.playerSprite.y+dy,120);});
