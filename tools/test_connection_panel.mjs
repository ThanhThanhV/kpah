import assert from "node:assert/strict";
import { normalizeLocalBridgeUrl } from "../src/protocol/connection-panel.js";

assert.equal(normalizeLocalBridgeUrl("ws://127.0.0.1:22101/kpah"), "ws://127.0.0.1:22101/kpah");
assert.equal(normalizeLocalBridgeUrl("ws://localhost:22101/kpah"), "ws://localhost:22101/kpah");
assert.throws(() => normalizeLocalBridgeUrl("wss://localhost:22101/kpah"), /ws:\/\//);
assert.throws(() => normalizeLocalBridgeUrl("ws://example.com:22101/kpah"), /loopback/);
assert.throws(() => normalizeLocalBridgeUrl("ws://127.0.0.1:22101/other"), /\/kpah/);
assert.throws(() => normalizeLocalBridgeUrl("ws://user:pass@127.0.0.1:22101/kpah"), /đăng nhập/);
console.log("Browser connection panel URL guard: PASS (loopback-only WebSocket endpoint)");
