import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import WebSocket from "ws";
import { createTcpWebSocketBridge } from "../tools/kpah-tcp-ws-bridge.mjs";

const tcpServer = net.createServer(socket => {
  socket.on("data", data => socket.write(Buffer.from(data).map(byte => byte ^ 0xff)));
});
await new Promise(resolve => tcpServer.listen(0, "127.0.0.1", resolve));
const tcpPort = tcpServer.address().port;
const bridge = createTcpWebSocketBridge({
  upstreamHost: "127.0.0.1",
  upstreamPort: tcpPort,
  listenPort: 0,
  allowedOrigins: ["http://localhost:5173"],
});
const address = await bridge.listen();
const base = "http://127.0.0.1:" + address.port;
try {
  const health = await fetch(base + "/health");
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  const missing = await fetch(base + "/not-found");
  assert.equal(missing.status, 404);

  const ws = new WebSocket("ws://127.0.0.1:" + address.port + "/kpah", { origin: "http://localhost:5173" });
  await new Promise((resolve, reject) => { ws.once("open", resolve); ws.once("error", reject); });
  const response = new Promise((resolve, reject) => {
    ws.once("message", (data, isBinary) => isBinary ? resolve(data) : reject(new Error("Expected binary WS frame")));
    ws.once("error", reject);
  });
  const sent = Buffer.from([0x00, 0x80, 0xfe, 0x11, 0x22]);
  ws.send(sent, { binary: true });
  assert.deepEqual(await response, Buffer.from(sent).map(byte => byte ^ 0xff));
  ws.close();
  await new Promise(resolve => ws.once("close", resolve));

  const rejected = new WebSocket("ws://127.0.0.1:" + address.port + "/kpah", { origin: "https://untrusted.example" });
  const rejection = await new Promise(resolve => {
    rejected.once("unexpected-response", (_request, response) => resolve(response.statusCode));
    rejected.once("error", () => resolve(0));
  });
  assert.equal(rejection, 403);

  assert.throws(() => createTcpWebSocketBridge({
    listenHost: "0.0.0.0", upstreamHost: "127.0.0.1", upstreamPort: tcpPort,
  }), /loopback-only/);
  console.log("KPAH TCP/WebSocket bridge: PASS (binary forwarding, health endpoint, origin allowlist, loopback bind)");
} finally {
  await bridge.close();
  await new Promise(resolve => tcpServer.close(resolve));
}
