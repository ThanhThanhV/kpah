import { KpahProtocolSession } from "./kpah-protocol-session.js";
import { encodeTemplateAssetRequest } from "./template-assets.js";
import { actorEffectImageResourceId, encodeEffectAssetRequest } from "./effect-assets.js";

let activeSession = null;
let currentView = null;
let statusText = "Chưa kết nối";
let packetCount = 0;
let lastState = null;
let lastError = "";
let requestedTemplateAssets = new Set();
let requestedEffectAssets = new Set();

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
        + " · World entities: " + (lastState.serverWorld?.entityOrder?.length ?? 0)
        + " · Templates: " + Object.keys(lastState.serverWorld?.templatesById ?? {}).length
        + " · Asset payloads: " + Object.keys(lastState.serverWorld?.templateAssetPayloadsById ?? {}).length;
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
    requestedTemplateAssets = new Set();
    requestedEffectAssets = new Set();
    renderStatus();
    const socket = new WebSocket(url);
    const session = new KpahProtocolSession(socket, {
      onOpen: () => { statusText = "WebSocket đã mở · chờ handshake -40"; renderStatus(); },
      onHandshake: () => { statusText = "Đã handshake · protocol sẵn sàng"; renderStatus(); },
      onPacket: () => { packetCount += 1; renderStatus(); },
      onState: state => {
        lastState = state;
        const world = state.serverWorld;
        for (const entityId of world?.entityOrder ?? []) {
          const entity = world.entitiesById?.[String(entityId)];
          const templateId = Number.isInteger(entity?.templateId) ? entity.templateId : null;
          if (templateId === null) continue;
          const template = world.templatesById?.[String(templateId)];
          if (!template || world.templateAssetPayloadsById?.[String(templateId)]
            || requestedTemplateAssets.has(templateId)) continue;
          requestedTemplateAssets.add(templateId);
          try {
            session.sendPacket(-47, encodeTemplateAssetRequest({ ...template, templateId }));
          } catch (error) {
            requestedTemplateAssets.delete(templateId);
            lastError = "Không thể yêu cầu asset template " + templateId + ": " + error.message;
          }
        }
        for (const entityId of world?.entityOrder ?? []) {
          const entity = world.entitiesById?.[String(entityId)];
          for (const effect of entity?.effectOverlays ?? []) {
            const effectId = effect.effectId;
            const key = String(effectId);
            if (!Number.isInteger(effectId) || !world.effectDefinitionsById?.[key]
              || world.effectImagePayloadsById?.[key] || requestedEffectAssets.has(effectId)) continue;
            requestedEffectAssets.add(effectId);
            try {
              session.sendPacket(-51, encodeEffectAssetRequest(effectId));
            } catch (error) {
              requestedEffectAssets.delete(effectId);
              lastError = "Không thể yêu cầu effect image " + effectId + ": " + error.message;
            }
          }
        }
        for (const actor of Object.values(world?.targetLinkedActorsBySourceId ?? {})) {
          const animationId = actor.animationId;
          const key = String(animationId);
          if (!Number.isInteger(animationId) || !world.actorEffectDefinitionsById?.[key]) continue;
          let resourceId;
          try { resourceId = actorEffectImageResourceId(animationId); }
          catch (error) { lastError = "Actor image resource ID không hợp lệ " + animationId + ": " + error.message; continue; }
          const resourceKey = String(resourceId);
          if (world.effectImagePayloadsById?.[resourceKey] || requestedEffectAssets.has(resourceId)) continue;
          requestedEffectAssets.add(resourceId);
          try { session.sendPacket(-51, encodeEffectAssetRequest(resourceId)); }
          catch (error) { requestedEffectAssets.delete(resourceId); lastError = "Không thể yêu cầu actor image " + resourceId + ": " + error.message; }
        }
        window.dispatchEvent(new CustomEvent("kpah:protocol-state", { detail: { state } }));
        renderStatus();
      },
      onClose: () => { statusText = "Kết nối đã đóng"; activeSession = null; renderStatus(); },
      onError: error => { statusText = "Lỗi kết nối/protocol"; lastError = error?.message || "Lỗi không xác định"; renderStatus(); },
    });
    activeSession = session;
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
