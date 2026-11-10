import { mountCharacterPreview } from './character-preview.js';

const style = document.createElement('style');
style.textContent = `
.login-cover{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:20px;background:radial-gradient(ellipse at 50% 35%,#59422d99 0,#19131deF 58%,#0b0a10 100%);backdrop-filter:blur(5px)}
.login-cover:before,.login-cover:after{content:"";position:absolute;inset:18px;border:1px solid #c19a5b55;pointer-events:none}
.login-cover:after{inset:25px;border:1px solid #c19a5b22}
.login-card{position:relative;width:min(440px,100%);padding:28px 30px 24px;background:linear-gradient(145deg,#382b2c,#1c1821 72%);border:2px solid #a17b49;box-shadow:0 22px 90px #000c,inset 0 0 0 1px #e9ca8a22;text-align:center}
.login-emblem{width:68px;height:68px;margin:0 auto 13px;border:2px solid #d4ae6d;display:grid;place-items:center;transform:rotate(45deg);background:linear-gradient(145deg,#51382e,#241d24);box-shadow:0 0 28px #d4a85c33}
.login-emblem span{transform:rotate(-45deg);font:800 42px Cinzel,serif;color:#f0d28e;text-shadow:0 3px #74472b}
.login-title{font:800 23px Cinzel,serif;letter-spacing:1px;color:#f3d79b;text-shadow:0 2px 4px #000;margin:13px 0 3px}
.login-subtitle{font-size:9px;letter-spacing:3px;color:#b9a17b;margin-bottom:22px}
.login-form{display:grid;gap:10px;text-align:left}
.login-form label{font-size:9px;color:#cbb895;display:grid;gap:5px}
.login-form input,.login-form select{width:100%;height:39px;background:#17141b;border:1px solid #67513b;color:#f0e2c5;padding:0 11px;outline:none;font-size:11px}
.login-form input:focus,.login-form select:focus{border-color:#d4ae6d}
.login-primary{width:100%;height:42px;margin-top:8px;border:1px solid #edcd8b;background:linear-gradient(#b98e51,#76502f);color:#fff0c6;font:700 12px Cinzel,serif;letter-spacing:1px;box-shadow:inset 0 1px #fff5}
.login-foot{margin-top:15px;color:#9e8e77;font-size:8px;line-height:1.7}
.login-step{display:none}.login-step.current{display:block}
.login-cover{overflow:auto;align-items:start}
.login-card{margin:auto}
.character-roster{display:grid;gap:8px;margin:0 0 12px;max-height:min(42vh,330px);overflow:auto}
.character-roster-empty{padding:18px 12px;border:1px dashed #70593d;background:#211c23;color:#b9a88e;font-size:10px;line-height:1.7}
.character-roster-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;background:#28222a;border:1px solid #5a4937}
.character-roster-card.selected{border-color:#e3c17d;background:#49382f}
.character-roster-card .roster-select{display:flex;align-items:center;gap:10px;min-width:0;text-align:left;background:none;border:0;color:#e5d2ac}
.character-roster-card .roster-avatar{width:38px;height:42px;display:grid;place-items:center;flex:none;border:1px solid #8d7048;background:#1a171d;color:#e0bd7a;font-size:22px}
.character-roster-card b,.character-roster-card small{display:block}
.character-roster-card b{font-size:10px;overflow-wrap:anywhere}
.character-roster-card small{font-size:8px;color:#b5a184;margin-top:3px}
.character-roster-card .roster-delete{border:1px solid #80504a;background:#42282a;color:#f0b7a7;padding:7px 9px;font-size:9px}
.roster-actions{display:grid;gap:7px}
.roster-actions .login-primary{margin:0}
.login-secondary{width:100%;min-height:38px;border:1px solid #8a704d;background:#30272b;color:#e6ca92;font-size:10px}
.login-secondary:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:520px){.login-cover{padding:12px}.login-card{margin:auto;padding:20px 16px}.character-roster{max-height:34vh}}
.login-step h2{font:700 16px Cinzel,serif;color:#f0d28e;margin:0 0 14px}
.server-choice{display:grid;gap:7px;margin-bottom:13px}
.server-option{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;background:#28222a;border:1px solid #584635;color:#d9c7a7;text-align:left;font-size:11px}
.server-option.selected{border-color:#d4ad69;background:#49382f}
.server-option small{display:block;color:#9eaa89;font-size:8px;margin-top:3px}
.server-state{color:#84c98a;font-size:9px}
.char-choice{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:13px}
.char-option{padding:12px 5px;background:#28222a;border:1px solid #5a4937;color:#e5d2ac;display:grid;gap:7px;justify-items:center;font-size:9px}
.char-option span{font-size:29px;color:#e0bd7a}.char-option.selected{border-color:#e3c17d;background:#4a382e}
.login-back{background:none;border:0;color:#c5ae86;font-size:9px;margin-top:12px}
.login-error{font-size:9px;color:#f19a83;min-height:12px;text-align:center}

@media(max-width:520px){.login-card{padding:24px 18px 19px}.login-title{font-size:19px}.login-cover:before{inset:8px}.login-cover:after{inset:14px}}
`;
document.head.append(style);
const cover=document.createElement('div');
cover.className='login-cover';
cover.innerHTML=`
<section class="login-card">
  <div class="login-emblem"><span>K</span></div>
  <div class="login-title">KHÍ PHÁCH ANH HÙNG</div>
  <div class="login-subtitle">HÀNH TRÌNH HUYỀN THOẠI</div>
  <div class="login-step" data-step="login">
    <form class="login-form" id="login-form">
      <label>TÀI KHOẢN<input id="login-user" autocomplete="username" placeholder="Nhập tên tài khoản" value=""></label>
      <label>MẬT KHẨU<input id="login-pass" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" value=""></label>
      <div class="login-error" id="login-error"></div>
      <button class="login-primary">ĐĂNG NHẬP</button>
    </form>
    <div class="login-foot">Bản tái hiện giao diện Web · Chế độ demo ngoại tuyến<br>Thông tin đăng nhập chưa được gửi đến máy chủ.</div>
  </div>
  <div class="login-step current" data-step="server">
    <h2>CHỌN MÁY CHỦ</h2>
    <div class="server-choice">
      <button class="server-option selected" data-server="Máy chủ 1"><span>Máy chủ 1<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 2"><span>Máy chủ 2<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 3"><span>Máy chủ 3<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 4"><span>Máy chủ 4<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 5"><span>Máy chủ 5<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 6"><span>Máy chủ 6<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 7"><span>Máy chủ 7<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 8"><span>Máy chủ 8<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
      <button class="server-option" data-server="Máy chủ 9"><span>Máy chủ 9<small>Vị trí máy chủ gốc · Demo offline</small></span><b class="server-state">Chưa kết nối</b></button>
    </div>
    <button class="login-primary" id="server-next">TIẾP TỤC</button>
  </div>
  <div class="login-step" data-step="character">
    <h2>CHỌN NHÂN VẬT</h2>
    <div class="character-roster" id="character-roster" aria-live="polite"></div>
    <div class="roster-actions">
      <button class="login-primary" id="enter-world" disabled>VÀO THẾ GIỚI</button>
      <button class="login-secondary" id="open-create-character">TẠO NHÂN VẬT MỚI · 0/3</button>
    </div>
    <button class="login-back" data-back="login">← Quay lại đăng nhập</button>
  </div>
  <div class="login-step" data-step="create">
    <h2>TẠO NHÂN VẬT</h2>
    <div class="login-form">
      <label>TÊN NHÂN VẬT<input id="new-character-name" maxlength="16" placeholder="Nhập tên nhân vật"></label>
      <label>MÔN PHÁI<select id="new-character-class">
        <option value="Kiếm Khách">Kiếm Khách · Kiếm · Miền Bắc · Kim</option>
        <option value="Chiến Binh">Chiến Binh · Đại đao · Miền Bắc · Hỏa</option>
        <option value="Pháp Sư">Pháp Sư · Địa thần · Miền Nam · Thủy</option>
        <option value="Đấu Sĩ">Đấu Sĩ · Rìu · Miền Nam · Thổ</option>
        <option value="Cung Thủ">Cung Thủ · Cung · Miền Bắc · Mộc</option>
      </select></label>
      <div id="character-preview"></div>
      <label>GIỚI TÍNH<select id="new-character-gender"><option>Nam</option><option>Nữ</option></select></label>
      <label>KIỂU TÓC<select id="new-character-hair">
        <option>Đầu đinh</option><option>Tóc búi</option><option>Tóc cột cao</option>
        <option>Tóc chéo</option><option>Tóc xù</option><option>Tóc ngang vai</option>
      </select></label>
    </div>
    <div class="login-error" id="create-error"></div>
    <button class="login-primary" id="save-character">HOÀN TẤT TẠO NHÂN VẬT</button>
    <button class="login-back" data-back="character">← Quay lại</button>
  </div>
</section>`;
document.body.append(cover);
let selectedServer='Máy chủ 1',selectedCharacterId=null;
const CHARACTER_STORAGE_KEY='kpah.character-roster.v1';
const MAX_CHARACTERS=3;
const professionIcons={'Kiếm Khách':'⚔','Chiến Binh':'🛡','Pháp Sư':'✧','Đấu Sĩ':'♜','Cung Thủ':'➶'};
function loadCharacterRoster(){
  try{
    const parsed=JSON.parse(localStorage.getItem(CHARACTER_STORAGE_KEY)||'[]');
    if(!Array.isArray(parsed))return [];
    return parsed.filter(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&c.name.length>0&&Object.hasOwn(professionIcons,c.className)).slice(0,MAX_CHARACTERS);
  }catch{return [];}
}
let characterRoster=loadCharacterRoster();
function saveCharacterRoster(){
  try{localStorage.setItem(CHARACTER_STORAGE_KEY,JSON.stringify(characterRoster));return true;}
  catch{return false;}
}
function renderCharacterRoster(){
  const list=cover.querySelector('#character-roster');
  const enter=cover.querySelector('#enter-world');
  const create=cover.querySelector('#open-create-character');
  if(!list||!enter||!create)return;
  if(!characterRoster.some(c=>c.id===selectedCharacterId))selectedCharacterId=characterRoster[0]?.id||null;
  list.innerHTML=characterRoster.length?characterRoster.map(c=>`<article class="character-roster-card ${c.id===selectedCharacterId?'selected':''}">
    <button class="roster-select" data-select-character="${c.id}">
      <span class="roster-avatar">${professionIcons[c.className]}</span>
      <span><b>${escapeRosterText(c.name)}</b><small>${escapeRosterText(c.className)} · ${escapeRosterText(c.gender||'Nam')}</small></span>
    </button>
    <button class="roster-delete" data-delete-character="${c.id}" aria-label="Xóa ${escapeRosterText(c.name)}">XÓA</button>
  </article>`).join(''):'<div class="character-roster-empty">Chưa có nhân vật nào. Hãy tạo nhân vật mới để bắt đầu hành trình.</div>';
  enter.disabled=!selectedCharacterId;
  create.disabled=characterRoster.length>=MAX_CHARACTERS;
  create.textContent=characterRoster.length>=MAX_CHARACTERS?'ĐÃ ĐỦ 3/3 NHÂN VẬT':`TẠO NHÂN VẬT MỚI · ${characterRoster.length}/3`;
}
function escapeRosterText(value){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function step(name){cover.querySelectorAll('.login-step').forEach(x=>x.classList.toggle('current',x.dataset.step===name));}
cover.querySelector('#login-form').addEventListener('submit',e=>{e.preventDefault();const user=cover.querySelector('#login-user').value.trim();const pass=cover.querySelector('#login-pass').value;if(!user||!pass){cover.querySelector('#login-error').textContent='Vui lòng nhập đầy đủ tài khoản và mật khẩu.';return;}renderCharacterRoster();step('character');});
cover.querySelectorAll('.server-option').forEach(b=>b.addEventListener('click',()=>{selectedServer=b.dataset.server;cover.querySelectorAll('.server-option').forEach(x=>x.classList.toggle('selected',x===b));}));
cover.querySelector('#server-next').addEventListener('click',()=>step('login'));
cover.querySelector('#character-roster').addEventListener('click',e=>{
  const select=e.target.closest('[data-select-character]');
  const remove=e.target.closest('[data-delete-character]');
  if(select){selectedCharacterId=select.dataset.selectCharacter;renderCharacterRoster();return;}
  if(remove){
    const character=characterRoster.find(c=>c.id===remove.dataset.deleteCharacter);
    if(!character||!window.confirm(`Xóa nhân vật "${character.name}" khỏi danh sách demo trên trình duyệt?`))return;
    characterRoster=characterRoster.filter(c=>c.id!==character.id);
    if(selectedCharacterId===character.id)selectedCharacterId=characterRoster[0]?.id||null;
    saveCharacterRoster();renderCharacterRoster();
  }
});
cover.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>step(b.dataset.back)));
function enterWorld(){
  const character=characterRoster.find(c=>c.id===selectedCharacterId);
  if(!character)return;
  const location=document.querySelector('.server span b');
  if(location)location.textContent=selectedServer;
  window.dispatchEvent(new CustomEvent('kpah:character-selected',{detail:{name:character.name,className:character.className,gender:character.gender,hair:character.hair,server:selectedServer}}));
  cover.remove();
}
cover.querySelector('#enter-world').addEventListener('click',enterWorld);
cover.querySelector('#open-create-character').addEventListener('click',()=>{
  if(characterRoster.length>=MAX_CHARACTERS)return;
  cover.querySelector('#new-character-name').value='';
  cover.querySelector('#create-error').textContent='';
  step('create');
  mountCharacterPreview(cover.querySelector('#character-preview'), cover.querySelector('#new-character-class'));
});
cover.querySelector('#save-character').addEventListener('click',()=>{
  if(characterRoster.length>=MAX_CHARACTERS){cover.querySelector('#create-error').textContent='Danh sách đã đủ 3 nhân vật.';return;}
  const name=cover.querySelector('#new-character-name').value.trim();
  if(!name){cover.querySelector('#create-error').textContent='Vui lòng nhập tên nhân vật.';return;}
  if(name.length>16){cover.querySelector('#create-error').textContent='Tên nhân vật tối đa 16 ký tự.';return;}
  if(characterRoster.some(c=>c.name.toLocaleLowerCase()===name.toLocaleLowerCase())){cover.querySelector('#create-error').textContent='Tên nhân vật đã tồn tại trong danh sách.';return;}
  const className=cover.querySelector('#new-character-class').value;
  const gender=cover.querySelector('#new-character-gender').value;
  const hair=cover.querySelector('#new-character-hair').selectedIndex;
  const character={id:`local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,name,className,gender,hair};
  characterRoster.push(character);selectedCharacterId=character.id;saveCharacterRoster();
  window.dispatchEvent(new CustomEvent('kpah:character-created',{detail:{name,className,gender,hair}}));
  renderCharacterRoster();step('character');
});
renderCharacterRoster();
window.addEventListener('kpah:logout',()=>{
  selectedCharacterId=characterRoster[0]?.id||null;
  renderCharacterRoster();
  step('server');
  cover.querySelector('#login-error').textContent='';
  document.body.append(cover);
  cover.querySelector('#login-user').focus();
});
