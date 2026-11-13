import { KpahProtocolSession } from "./kpah-protocol-session.js";

let activeSession = null;
let currentView = null;
let statusText = "Chưa kết nối";
let packetCount = 0;
let lastState = null;
let lastError = "";

export function normalizeLocalBridgeUrl(value) {
  const url = new URL(String(value || "").trim());
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const loopback = host === "localhost" || host === "::1"
    || /^127(?:\.\d{1,3}){3}$/.test(host);
  if (url.protocol !== "ws:" || !loopback) {
    throw new Error("Chỉ chấp nhận ws:// tới localhost hoặc địa chỉ loopback");
  }
  if (url.username || url.password) throw new Error("Không đưa thông tin đăng nhập vào URL bridge");
  if (url.pathname !== "/kpah" || url.search || url.hash) {
    throw new Error("Đường dẫn bridge phải là /kpah và không có query/hash");
  }
  return url.href;
}

function renderStatus() {
  if (!currentView?.isConnected) return;
  const status = currentView.querySelector("[data-connection-status]");
  const packets = currentView.querySelector("[data-connection-packets]");
  const state = currentView.querySelector("[data-connection-state]");
  const error = currentView.querySelector("[data-connection-error]");
  if (status) status.textContent = statusText;
  if (packets) packets.textContent = String(packetCount);
  if (error) error.textContent = lastError;
  if (state) {
    if (!lastState) state.textContent = "Chưa nhận dữ liệu initialization";
    else {
      const resources = Object.keys(lastState.resourcesByIndex || {}).length;
      state.textContent = "Xu: " + (lastState.currency == null ? "chưa có" : String(lastState.currency))
        + " · Vật phẩm: " + (lastState.inventory?.length ?? 0)
        + " · Resource index: " + resources
        + " · World entities: " + (lastState.serverWorld?.entityOrder?.length ?? 0);
    }
  }
}

function disconnect() {
  if (activeSession) {
    activeSession.close(1000, "Người dùng ngắt kết nối");
    activeSession.dispose();
    activeSession = null;
  }
  statusText = "Đã ngắt kết nối";
  renderStatus();
}

export function mountProtocolConnectionPanel(root) {
  if (!root) throw new TypeError("Connection panel root is required");
  root.innerHTML = `
    <section class="protocol-connection-panel">
      <p class="settings-note">Kết nối thử nghiệm qua TCP-to-WebSocket bridge chạy trên máy của bạn. Đây chưa phải đăng nhập game và không gửi tài khoản/mật khẩu.</p>
      <label class="protocol-field">Địa chỉ bridge
        <input data-bridge-url type="url" spellcheck="false" value="ws://127.0.0.1:22101/kpah" autocomplete="off">
      </label>
      <div class="protocol-actions">
        <button type="button" class="gold-button" data-bridge-connect>Kết nối</button>
        <button type="button" class="protocol-secondary" data-bridge-disconnect>Ngắt kết nối</button>
      </div>
      <div class="protocol-status"><span>Trạng thái</span><b data-connection-status></b></div>
      <div class="protocol-status"><span>Packet đã nhận</span><b data-connection-packets>0</b></div>
      <p class="protocol-state" data-connection-state></p>
      <p class="protocol-error" data-connection-error></p>
      <p class="settings-note">Để chạy bridge: <code>npm run bridge:tcp-ws -- --upstream-host HOST --upstream-port PORT</code>. Bridge chỉ bind loopback; HOST/PORT phải là endpoint TCP hợp lệ do bạn cung cấp.</p>
    </section>
  `;
  currentView = root;
  renderStatus();

  const urlInput = root.querySelector("[data-bridge-url]");
  const connectButton = root.querySelector("[data-bridge-connect]");
  const disconnectButton = root.querySelector("[data-bridge-disconnect]");

  const connect = () => {
    lastError = "";
    if (activeSession && !activeSession.closed) {
      lastError = "Đã có một phiên kết nối. Hãy ngắt phiên hiện tại trước.";
      renderStatus();
      return;
    }
    let url;
    try { url = normalizeLocalBridgeUrl(urlInput.value); }
    catch (error) { lastError = error.message; renderStatus(); return; }

    statusText = "Đang mở WebSocket...";
    packetCount = 0;
    lastState = null;
    renderStatus();
    const socket = new WebSocket(url);
    activeSession = new KpahProtocolSession(socket, {
      onOpen: () => { statusText = "WebSocket đã mở · chờ handshake -40"; renderStatus(); },
      onHandshake: () => { statusText = "Đã handshake · protocol sẵn sàng"; renderStatus(); },
      onPacket: () => { packetCount += 1; renderStatus(); },
      onState: state => {
        lastState = state;
        window.dispatchEvent(new CustomEvent("kpah:protocol-state", { detail: { state } }));
        renderStatus();
      },
      onClose: () => { statusText = "Kết nối đã đóng"; activeSession = null; renderStatus(); },
      onError: error => { statusText = "Lỗi kết nối/protocol"; lastError = error?.message || "Lỗi không xác định"; renderStatus(); },
    });
  };

  connectButton.addEventListener("click", connect);
  disconnectButton.addEventListener("click", disconnect);
  const onPageHide = () => disconnect();
  window.addEventListener("pagehide", onPageHide);
  return () => {
    connectButton.removeEventListener("click", connect);
    disconnectButton.removeEventListener("click", disconnect);
    window.removeEventListener("pagehide", onPageHide);
    if (currentView === root) currentView = null;
  };
}
