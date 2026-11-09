import Phaser from 'phaser';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">K</span><div><b>KHÍ PHÁCH ANH HÙNG</b><small>PHIÊN BẢN TÁI HIỆN WEB</small></div></div>
      <div class="server"><i></i><span>Máy chủ: <b>Long Kiếm</b></span><span class="online">Đang kết nối</span></div>
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
        </nav>
        <div class="mini-status"><div><span>Xu</span><b>125.600</b></div><div><span>Lượng</span><b>320</b></div><div><span>Danh vọng</span><b>48</b></div></div>
      </aside>
      <section class="world-column">
        <div class="world-toolbar"><div class="location"><span>◈</span><b>Làng Sói Trắng</b><small>· Khu vực an toàn</small></div><div class="world-tools"><button data-window="map">Bản đồ</button><button data-window="ranking">Xếp hạng</button><button data-window="events">Sự kiện</button></div></div>
        <div class="world-frame"><div id="world"></div><div class="scene-vignette"></div><div class="zone-title"><b>LÀNG SÓI TRẮNG</b><small>Vùng đất khởi nguyên</small></div><div class="world-coords">X: 124 · Y: 087</div><div class="world-hint">Kéo để di chuyển · Chạm mục tiêu để tương tác</div><div class="npc-tag merchant">Thương nhân</div><div class="npc-tag elder">Trưởng làng</div></div>
        <div class="world-bottom"><div class="chat"><div class="chat-tabs"><button class="selected">Thế giới</button><button>Bang hội</button><button>Riêng</button><button>Hệ thống</button></div><div class="chat-lines" id="chat-lines"><p><b class="system">[Hệ thống]</b> Chào mừng đến với Khí Phách Anh Hùng!</p><p><b class="world-chat">[Thế giới]</b> <strong>Kiếm Khách</strong>: Có ai đi săn Sói không?</p><p><b class="world-chat">[Thế giới]</b> <strong>PhongVân</strong>: Làng đông vui quá.</p></div><form id="chat-form"><select aria-label="Kênh chat"><option>Thế giới</option><option>Bang hội</option><option>Riêng</option></select><input id="chat-input" placeholder="Nhập nội dung trò chuyện..." maxlength="120"><button>Gửi</button></form></div><div class="quick-panel"><div class="quick-title">THAO TÁC NHANH</div><div class="quick-grid"><button data-window="inventory"><span>▣</span>Túi đồ</button><button data-window="skills"><span>✦</span>Kỹ năng</button><button data-window="quests"><span>⚑</span>Nhiệm vụ</button><button data-window="map"><span>⌖</span>Bản đồ</button></div></div></div>
      </section>
      <aside class="right-rail">
        <div class="rail-heading">THÔNG TIN KHU VỰC <button data-window="map">⌖</button></div>
        <div class="mini-map"><div class="map-grid"></div><span class="map-player"></span><span class="map-npc n1"></span><span class="map-npc n2"></span><div class="map-label">Làng Sói Trắng</div></div>
        <div class="section-label">NHÂN VẬT GẦN ĐÂY <span>3</span></div>
        <div class="nearby"><div class="nearby-avatar blue">風</div><div><b>PhongVân</b><small>Cấp 27 · Kiếm khách</small></div><i class="online-dot"></i></div>
        <div class="nearby"><div class="nearby-avatar red">炎</div><div><b>HỏaLong</b><small>Cấp 31 · Chiến binh</small></div><i class="online-dot"></i></div>
        <div class="nearby"><div class="nearby-avatar green">月</div><div><b>NguyệtNhi</b><small>Cấp 24 · Pháp sư</small></div><i class="online-dot"></i></div>
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
  character: {title:'Thông tin nhân vật',html:`<div class="character-sheet"><div class="big-avatar">⚔<span>Cấp 25</span></div><div class="character-details"><h2>Kiếm Khách</h2><p class="muted">Chiến binh tập sự · Nam</p><div class="stat-grid"><div><small>Cấp độ</small><b>25</b></div><div><small>Kinh nghiệm</small><b>72.450 / 90.000</b></div><div><small>Sức mạnh</small><b>1.285</b></div><div><small>Thể lực</small><b>860</b></div><div><small>Nhanh nhẹn</small><b>740</b></div><div><small>Tinh thần</small><b>520</b></div></div><button class="gold-button">Phân phối tiềm năng</button></div></div>`},
  inventory:{title:'Hành trang',html:`<div class="tabs"><button class="chosen">Tất cả</button><button>Trang bị</button><button>Tiêu hao</button><button>Nhiệm vụ</button></div><div class="inventory-grid">${['Kiếm tân thủ','Áo vải','Bình máu nhỏ','Bình mana nhỏ','Nhẫn đồng','Đá cường hóa','Lá bùa','Túi nguyên liệu','Giày vải','Găng tay','Ngọc xanh','Rương gỗ'].map((x,i)=>`<div class="item-cell"><span>${['⚔','♧','🧪','🧴','◉','◆','✧','▣','⌑','♢','💎','▤'][i]}</span><small>${x}</small>${i===2||i===3?'<em>×5</em>':''}</div>`).join('')}</div><div class="inventory-footer"><span>Ô trống: 18 / 30</span><button class="gold-button">Mở rộng túi</button></div>`},
  equipment:{title:'Trang bị nhân vật',html:`<div class="equipment-layout"><div class="equip-slots">${['Mũ','Áo','Vũ khí','Găng','Giày','Nhẫn','Dây chuyền','Bùa'].map((x,i)=>`<div class="equip-cell"><span>${['♜','♧','⚔','♢','⌑','◉','◇','✧'][i]}</span><small>${x}</small></div>`).join('')}</div><div class="equip-preview">⚔<b>Kiếm Khách</b><small>Chưa trang bị đầy đủ</small></div></div>`},
  skills:{title:'Kỹ năng',html:`<div class="tabs"><button class="chosen">Kỹ năng chủ động</button><button>Bị động</button></div><div class="skill-list">${[['Kiếm khí','Cấp 3','Gây sát thương lên mục tiêu phía trước.','✧'],['Liên hoàn trảm','Cấp 2','Tấn công liên tiếp nhiều lần.','⚔'],['Hồi phục','Cấp 1','Khôi phục một phần sinh lực.','✚'],['Bạt kiếm thức','Chưa học','Tuyệt kỹ gây sát thương lớn.','✹']].map(x=>`<div class="skill-row"><span>${x[3]}</span><div><b>${x[0]} <small>${x[1]}</small></b><p>${x[2]}</p></div><button>Chi tiết</button></div>`).join('')}</div>`},
  quests:{title:'Sổ nhiệm vụ',html:`<div class="tabs"><button class="chosen">Đang thực hiện</button><button>Có thể nhận</button><button>Hoàn thành</button></div><div class="quest-card"><b>✦ Dọn dẹp bầy sói</b><p>Tiêu diệt 8 Sói hoang để bảo vệ dân làng.</p><div class="quest-progress"><i style="width:62%"></i></div><small>5 / 8 Sói hoang</small><div class="quest-reward">Phần thưởng: 1.200 EXP · 500 Xu</div></div><div class="quest-card"><b>✦ Gặp trưởng làng</b><p>Đến gặp trưởng làng để nhận chỉ dẫn.</p><small class="complete">Đã hoàn thành mục tiêu</small></div>`},
  map:{title:'Bản đồ thế giới',html:`<div class="map-large"><div class="map-location">◈ LÀNG SÓI TRẮNG</div><span class="map-pin p1">●</span><span class="map-pin p2">●</span><span class="map-pin p3">●</span><span class="map-path"></span></div><div class="map-legend"><span>● Vị trí của bạn</span><span>◆ NPC</span><span>♞ Quái vật</span></div>`},
  friends:{title:'Bạn bè',html:`<div class="friend-list"><div class="nearby"><div class="nearby-avatar blue">風</div><div><b>PhongVân</b><small>Đang trực tuyến · Cấp 27</small></div><button>Mời nhóm</button></div><div class="nearby"><div class="nearby-avatar red">炎</div><div><b>HỏaLong</b><small>Đang trực tuyến · Cấp 31</small></div><button>Nhắn tin</button></div><div class="nearby"><div class="nearby-avatar green">月</div><div><b>NguyệtNhi</b><small>Đang trực tuyến · Cấp 24</small></div><button>Mời nhóm</button></div></div>`},
  guild:{title:'Bang hội',html:`<div class="empty-state"><span>⚑</span><b>Chưa gia nhập bang hội</b><p>Gia nhập bang hội để cùng bằng hữu khám phá thế giới.</p><button class="gold-button">Tìm bang hội</button></div>`},
  ranking:{title:'Bảng xếp hạng',html:`<div class="tabs"><button class="chosen">Cấp độ</button><button>Chiến lực</button><button>Bang hội</button></div><div class="rank-list"><p>① <b>ThiênMệnh</b><span>Cấp 68</span></p><p>② <b>PhongVân</b><span>Cấp 27</span></p><p>③ <b>HỏaLong</b><span>Cấp 31</span></p></div>`},
  events:{title:'Sự kiện',html:`<div class="quest-card"><b>✦ Đua top tân thủ</b><p>Nhận thưởng khi đạt mốc cấp độ trong thời gian sự kiện.</p><small>Thời gian còn lại: 5 ngày 12 giờ</small></div><div class="quest-card"><b>✦ Săn boss cuối tuần</b><p>Đánh bại boss thế giới cùng những người chơi khác.</p></div>`},
  settings:{title:'Cài đặt',html:`<div class="settings-list"><label>Âm thanh <input type="checkbox" checked></label><label>Hiệu ứng <input type="checkbox" checked></label><label>Hiển thị tên nhân vật <input type="checkbox" checked></label><label>Chất lượng đồ họa <select><option>Cao</option><option>Trung bình</option><option>Thấp</option></select></label></div>`},
  help:{title:'Trợ giúp',html:`<div class="help-copy"><b>Điều khiển</b><p>Dùng cụm phím mũi tên để di chuyển nhân vật. Chọn kỹ năng ở thanh thao tác phía dưới để sử dụng.</p><b>Tương tác</b><p>Chạm vào NPC, người chơi hoặc quái vật trong bản đồ để xem các hành động khả dụng.</p></div>`},
  party:{title:'Tổ đội',html:`<div class="empty-state"><span>♙</span><b>Bạn chưa tham gia tổ đội</b><p>Tạo tổ đội hoặc nhận lời mời từ người chơi khác.</p><button class="gold-button">Tạo tổ đội</button></div>`},
  mail:{title:'Hòm thư',html:`<div class="empty-state"><span>✉</span><b>Hòm thư trống</b><p>Khi có thư mới, thư sẽ hiển thị tại đây.</p></div>`},
  shop:{title:'Cửa hàng',html:`<div class="tabs"><button class="chosen">Vật phẩm</button><button>Trang bị</button><button>Tiện ích</button></div><div class="shop-row"><span>🧪</span><b>Bình máu nhỏ</b><small>150 Xu</small><button>Mua</button></div><div class="shop-row"><span>🧴</span><b>Bình mana nhỏ</b><small>150 Xu</small><button>Mua</button></div>`}
};
function openWindow(key){const p=panelData[key]||panelData.help;document.querySelector('#window-title').textContent=p.title;document.querySelector('#window-content').innerHTML=p.html;document.querySelector('#game-window').classList.add('open');document.querySelector('#modal-backdrop').classList.add('show');document.querySelectorAll('.side-nav button').forEach(b=>b.classList.toggle('active',b.dataset.window===key));}
function closeWindow(){document.querySelector('#game-window').classList.remove('open');document.querySelector('#modal-backdrop').classList.remove('show');}
document.querySelectorAll('[data-window]').forEach(b=>b.addEventListener('click',()=>openWindow(b.dataset.window)));
document.querySelector('#window-close').addEventListener('click',closeWindow);
document.querySelector('#modal-backdrop').addEventListener('click',closeWindow);
document.querySelector('#logout').addEventListener('click',()=>window.dispatchEvent(new Event('kpah:logout')));
document.querySelector('#chat-form').addEventListener('submit',e=>{e.preventDefault();const i=document.querySelector('#chat-input');if(!i.value.trim())return;const p=document.createElement('p');p.innerHTML='<b class="world-chat">[Thế giới]</b> <strong>Kiếm Khách</strong>: '+escapeHtml(i.value);document.querySelector('#chat-lines').append(p);i.value='';document.querySelector('#chat-lines').scrollTop=9999;});
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let toastTimer;function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}
document.querySelectorAll('.slot').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.slot').forEach(x=>x.classList.remove('active'));b.classList.add('active');toast('Đã chọn: '+b.dataset.skill);}));
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen');}));
const movementVectors={'move-left':[-1,0],'move-right':[1,0],'move-up':[0,-1],'move-down':[0,1]};
function movePlayer(dx,dy){
  const scene=game.scene.getScene('world');
  if(!scene?.playerSprite)return;
  const distance=18;
  scene.tweens.add({targets:scene.playerSprite,x:Phaser.Math.Clamp(scene.playerSprite.x+dx*distance,30,930),y:Phaser.Math.Clamp(scene.playerSprite.y+dy*distance,270,520),duration:105,onUpdate:()=>scene.playerSprite.setDepth(scene.playerSprite.y)});
}
document.querySelectorAll('.movement button').forEach(button=>{
  const vector=movementVectors[button.id];
  if(!vector)return;
  let repeat;
  const stop=()=>{if(repeat){clearInterval(repeat);repeat=null;}};
  button.addEventListener('pointerdown',event=>{event.preventDefault();movePlayer(...vector);stop();repeat=setInterval(()=>movePlayer(...vector),145);});
  ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(type=>button.addEventListener(type,stop));
});
window.addEventListener('kpah:character-selected',event=>{
  const {name,className}=event.detail||{};
  const safeName=name||'Kiếm Khách';
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
  constructor(){super('world');this.player={x:480,y:330};}
  create(){
    const g=this.add.graphics();g.fillGradientStyle(0x344c39,0x344c39,0x243b31,0x243b31,1);g.fillRect(0,0,960,560);
    for(let y=0;y<560;y+=42){for(let x=0;x<960;x+=42){const shade=((x*13+y*7)%5);g.fillStyle(shade===0?0x456044:shade===1?0x3b563e:0x38533b,0.45);g.fillRect(x+((y/42)%2)*20,y,40,38);}}
    // Stone path and village square
    g.fillStyle(0x9a8867,0.9);g.fillPoints([new Phaser.Geom.Point(0,390),new Phaser.Geom.Point(240,340),new Phaser.Geom.Point(430,350),new Phaser.Geom.Point(640,300),new Phaser.Geom.Point(960,330),new Phaser.Geom.Point(960,470),new Phaser.Geom.Point(650,430),new Phaser.Geom.Point(420,455),new Phaser.Geom.Point(190,440)],true);
    g.lineStyle(3,0x655744,0.55);g.strokePoints([new Phaser.Geom.Point(0,390),new Phaser.Geom.Point(240,340),new Phaser.Geom.Point(430,350),new Phaser.Geom.Point(640,300),new Phaser.Geom.Point(960,330)],true);
    this.drawTree(g,110,170,1.2);this.drawTree(g,220,100,0.9);this.drawTree(g,820,155,1.35);this.drawTree(g,720,95,0.9);this.drawTree(g,900,390,1);
    this.drawHouse(g,330,185,1.05,0x9a5542);this.drawHouse(g,650,180,0.9,0x6f7f91);this.drawHouse(g,505,100,0.75,0x9a804f);
    this.drawNpc(370,325,0xf0c16b,'Trưởng làng');this.drawNpc(715,320,0x7ec3c8,'Thương nhân');
    // Ambient flowers and rocks
    for(let i=0;i<45;i++){const x=(i*173+47)%950,y=(i*97+35)%500;if(y<280&&x>280&&x<700)continue;g.fillStyle(i%3===0?0xd9c16d:0x8eb66a,0.8);g.fillCircle(x,y,1.7);}
    this.playerSprite=this.add.container(this.player.x,this.player.y);const shadow=this.add.ellipse(0,19,28,9,0x111510,0.35);const cape=this.add.triangle(0,2,0,-2,-17,20,13,20,0x9b3f32);const body=this.add.rectangle(0,0,17,25,0xd5d0b9).setStrokeStyle(2,0x42372b);const head=this.add.circle(0,-17,8,0xe0b88d).setStrokeStyle(2,0x42372b);const hair=this.add.triangle(0,-23,-8,-16,0,-31,9,-15,0x29232a);const sword=this.add.rectangle(13,-3,4,27,0xd6d8d1).setAngle(25).setStrokeStyle(1,0x514d48);this.playerSprite.add([shadow,cape,body,head,hair,sword]);this.playerSprite.setDepth(this.player.y);
    this.playerLabel=this.add.text(480,282,'Kiếm Khách',{fontFamily:'Arial',fontSize:'12px',color:'#fff3c6',stroke:'#34251d',strokeThickness:3}).setOrigin(.5).setDepth(999);
    this.add.text(370,291,'Trưởng làng',{fontFamily:'Arial',fontSize:'11px',color:'#ffe6a8',stroke:'#30251a',strokeThickness:3}).setOrigin(.5);
    this.add.text(715,286,'Thương nhân',{fontFamily:'Arial',fontSize:'11px',color:'#ffe6a8',stroke:'#30251a',strokeThickness:3}).setOrigin(.5);
    this.input.on('pointerdown',p=>{const wx=p.worldX,wy=p.worldY;this.tweens.add({targets:this.playerSprite,x:Phaser.Math.Clamp(wx,35,925),y:Phaser.Math.Clamp(wy,270,510),duration:450,ease:'Sine.easeOut',onUpdate:()=>this.playerSprite.setDepth(this.playerSprite.y)});});
    this.cameras.main.setBounds(0,0,960,560);this.scale.on('resize',()=>this.cameras.resize(this.scale.width,this.scale.height));
  }
  drawTree(g,x,y,s){g.fillStyle(0x4a3325);g.fillRect(x-4*s,y,8*s,24*s);g.fillStyle(0x203c2a);g.fillCircle(x,y-8*s,22*s);g.fillStyle(0x365d39);g.fillCircle(x-8*s,y-17*s,15*s);g.fillStyle(0x537346);g.fillCircle(x+7*s,y-12*s,13*s);g.fillStyle(0x172d20,0.3);g.fillEllipse(x,y+20*s,38*s,8*s);}
  drawHouse(g,x,y,s,roof){g.fillStyle(0x2a241f);g.fillRect(x-42*s,y-42*s,84*s,70*s);g.fillStyle(0xc3a77b);g.fillRect(x-38*s,y-39*s,76*s,64*s);g.fillStyle(roof);g.fillPoints([new Phaser.Geom.Point(x-52*s,y-37*s),new Phaser.Geom.Point(x,y-79*s),new Phaser.Geom.Point(x+52*s,y-37*s)],true);g.fillStyle(0x563b2c);g.fillRect(x-10*s,y-2*s,20*s,27*s);g.fillStyle(0x7a9aa0);g.fillRect(x-31*s,y-24*s,13*s,15*s);g.fillRect(x+18*s,y-24*s,13*s,15*s);}
  drawNpc(x,y,color,name){const c=this.add.container(x,y);c.add([this.add.ellipse(0,14,22,7,0x111510,.35),this.add.rectangle(0,0,15,23,color).setStrokeStyle(2,0x3b3027),this.add.circle(0,-17,7,0xe2bd91).setStrokeStyle(2,0x3b3027),this.add.triangle(0,-23,-7,-15,0,-30,8,-15,0x41312a)]);c.setDepth(y);}
}
const game=new Phaser.Game({type:Phaser.AUTO,parent:'world',width:960,height:560,backgroundColor:'#263c2d',render:{pixelArt:true,antialias:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[WorldScene]});
window.addEventListener('keydown',e=>{const dirs={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-15],ArrowDown:[0,15]};if(!dirs[e.key])return;const s=game.scene.getScene('world');if(!s.playerSprite)return;e.preventDefault();const [dx,dy]=dirs[e.key];s.tweens.add({targets:s.playerSprite,x:Phaser.Math.Clamp(s.playerSprite.x+dx,30,930),y:Phaser.Math.Clamp(s.playerSprite.y+dy,270,520),duration:120,onUpdate:()=>s.playerSprite.setDepth(s.playerSprite.y)});});
