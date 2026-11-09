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
      <button class="server-option selected" data-server="Máy chủ 1"><span>Máy chủ 1<small>Máy chủ minh họa</small></span><b class="server-state">Demo</b></button>
      <button class="server-option" data-server="Máy chủ 2"><span>Máy chủ 2<small>Máy chủ minh họa</small></span><b class="server-state">Demo</b></button>
      <button class="server-option" data-server="Máy chủ 3"><span>Máy chủ 3<small>Máy chủ minh họa</small></span><b class="server-state">Demo</b></button>
    </div>
    <button class="login-primary" id="server-next">TIẾP TỤC</button>
  </div>
  <div class="login-step" data-step="character">
    <h2>CHỌN NHÂN VẬT</h2>
    <div class="char-choice">
      <button class="char-option selected" data-class="Kiếm Khách"><span>⚔</span>Kiếm Khách</button>
      <button class="char-option" data-class="Chiến Binh"><span>🛡</span>Chiến Binh</button>
      <button class="char-option" data-class="Pháp Sư"><span>✧</span>Pháp Sư</button>
      <button class="char-option" data-class="Đấu Sĩ"><span>♜</span>Đấu Sĩ</button>
      <button class="char-option" data-class="Cung Thủ"><span>➶</span>Cung Thủ</button>
    </div>
    <div class="login-form"><label>TÊN NHÂN VẬT<input id="character-name" value="Kiếm Khách" maxlength="16"></label></div>
    <button class="login-primary" id="enter-world">VÀO THẾ GIỚI</button>
    <button class="login-back" data-back="login">← Quay lại đăng nhập</button>
  </div>
</section>`;
document.body.append(cover);
let selectedServer='Máy chủ 1',selectedClass='Kiếm Khách';
function step(name){cover.querySelectorAll('.login-step').forEach(x=>x.classList.toggle('current',x.dataset.step===name));}
cover.querySelector('#login-form').addEventListener('submit',e=>{e.preventDefault();const user=cover.querySelector('#login-user').value.trim();const pass=cover.querySelector('#login-pass').value;if(!user||!pass){cover.querySelector('#login-error').textContent='Vui lòng nhập đầy đủ tài khoản và mật khẩu.';return;}step('character');});
cover.querySelectorAll('.server-option').forEach(b=>b.addEventListener('click',()=>{selectedServer=b.dataset.server;cover.querySelectorAll('.server-option').forEach(x=>x.classList.toggle('selected',x===b));}));
cover.querySelector('#server-next').addEventListener('click',()=>step('login'));
cover.querySelectorAll('.char-option').forEach(b=>b.addEventListener('click',()=>{selectedClass=b.dataset.class;cover.querySelectorAll('.char-option').forEach(x=>x.classList.toggle('selected',x===b));}));
cover.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>step(b.dataset.back)));
function enterWorld(){
  const name=cover.querySelector('#character-name').value.trim()||'Kiếm Khách';
  const location=document.querySelector('.server span b');
  if(location)location.textContent=selectedServer;
  window.dispatchEvent(new CustomEvent('kpah:character-selected',{detail:{name,className:selectedClass,server:selectedServer}}));
  cover.remove();
}
cover.querySelector('#enter-world').addEventListener('click',enterWorld);
window.addEventListener('kpah:logout',()=>{
  step('login');
  cover.querySelector('#login-error').textContent='';
  document.body.append(cover);
  cover.querySelector('#login-user').focus();
});
