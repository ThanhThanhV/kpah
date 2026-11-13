#!/usr/bin/env node
import http from "node:http";
import net from "node:net";
import { WebSocketServer, WebSocket } from "ws";

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];
const DEFAULT_MAX_PAYLOAD = 16 * 1024 * 1024;

function isLoopbackHost(host) {
  if (host === "localhost") return true;
  if (net.isIPv4(host)) return host.split(".")[0] === "127";
  return host === "::1";
}

/**
 * Local-only WebSocket-to-TCP byte bridge. It forwards opaque binary chunks;
 * protocol framing, XOR and handshake remain owned by KpahProtocolSession.
 */
export function createTcpWebSocketBridge({
  listenHost = "127.0.0.1",
  listenPort = 22101,
  upstreamHost,
  upstreamPort,
  allowedOrigins = DEFAULT_ORIGINS,
  connectTimeoutMs = 20_000,
  maxPayload = DEFAULT_MAX_PAYLOAD,
  maxConnections = 4,
} = {}) {
  if (!isLoopbackHost(listenHost)) throw new Error("Bridge listen host must be loopback-only");
  if (!upstreamHost || typeof upstreamHost !== "string") throw new TypeError("An explicit upstream TCP host is required");
  if (!Number.isInteger(upstreamPort) || upstreamPort < 1 || upstreamPort > 65535) {
    throw new RangeError("Upstream TCP port must be between 1 and 65535");
  }
  if (!Number.isInteger(listenPort) || listenPort < 0 || listenPort > 65535) {
    throw new RangeError("Listen port must be between 0 and 65535");
  }
  if (!Array.isArray(allowedOrigins) || allowedOrigins.some(origin => typeof origin !== "string")) {
    throw new TypeError("allowedOrigins must be an array of exact origin strings");
  }

  const connections = new Set();
  const httpServer = http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ status: "ok", transport: "websocket-to-tcp", activeConnections: connections.size }));
      return;
    }
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  });
  const wss = new WebSocketServer({
    noServer: true,
    clientTracking: false,
    perMessageDeflate: false,
    maxPayload,
  });

  httpServer.on("upgrade", (request, socket, head) => {
    const origin = request.headers.origin;
    if (request.url !== "/kpah" || typeof origin !== "string" || !allowedOrigins.includes(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
      socket.destroy();
      return;
    }
    if (connections.size >= maxConnections) {
      socket.write("HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, websocket => {
      wss.emit("connection", websocket, request);
    });
  });

  wss.on("connection", websocket => {
    const tcp = net.createConnection({ host: upstreamHost, port: upstreamPort });
    const connection = { websocket, tcp, connected: false, closed: false };
    connections.add(connection);
    websocket.binaryType = "nodebuffer";
    tcp.setNoDelay(true);
    tcp.setKeepAlive(true, 15_000);
    tcp.setTimeout(connectTimeoutMs);

    const closeBoth = (code = 1000, reason = "Connection closed") => {
      if (connection.closed) return;
      connection.closed = true;
      connections.delete(connection);
      if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
        try { websocket.close(code, reason.slice(0, 120)); } catch { websocket.terminate(); }
      }
      tcp.destroy();
    };

    tcp.once("connect", () => {
      connection.connected = true;
      tcp.setTimeout(0);
    });
    tcp.on("data", chunk => {
      if (websocket.readyState !== WebSocket.OPEN) return;
      websocket.send(chunk, { binary: true }, error => {
        if (error) closeBoth(1011, "WebSocket send failed");
        else if (websocket.bufferedAmount < 1024 * 1024 && !connection.closed) tcp.resume();
      });
      if (websocket.bufferedAmount > 4 * 1024 * 1024) tcp.pause();
    });
    websocket.on("message", (data, isBinary) => {
      if (!isBinary) {
        closeBoth(1003, "Binary messages only");
        return;
      }
      if (!connection.connected || connection.closed) {
        closeBoth(1011, "TCP upstream is not ready");
        return;
      }
      const accepted = tcp.write(data);
      if (!accepted) websocket._socket?.pause();
    });
    tcp.on("drain", () => websocket._socket?.resume());
    tcp.on("timeout", () => closeBoth(1011, "TCP upstream timeout"));
    tcp.on("error", () => closeBoth(1011, "TCP upstream error"));
    tcp.on("end", () => closeBoth(1000, "TCP upstream ended"));
    websocket.on("error", () => closeBoth(1011, "WebSocket transport error"));
    websocket.on("close", () => closeBoth());
  });

  return {
    httpServer,
    async listen() {
      await new Promise((resolve, reject) => {
        const onError = error => { httpServer.off("listening", onListening); reject(error); };
        const onListening = () => { httpServer.off("error", onError); resolve(); };
        httpServer.once("error", onError);
        httpServer.once("listening", onListening);
        httpServer.listen(listenPort, listenHost);
      });
      return httpServer.address();
    },
    async close() {
      for (const connection of [...connections]) {
        connection.tcp.destroy();
        connection.websocket.terminate();
      }
      connections.clear();
      wss.close();
      if (httpServer.listening) {
        await new Promise((resolve, reject) => httpServer.close(error => error ? reject(error) : resolve()));
      }
    },
  };
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error("Unexpected argument: " + arg);
    const key = arg.slice(2);
    if (key === "help") { values.help = true; continue; }
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) throw new Error("Missing value for --" + key);
    index += 1;
    if (key === "allowed-origin") (values.allowedOrigins ??= []).push(value);
    else values[key] = value;
  }
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write("Usage: node tools/kpah-tcp-ws-bridge.mjs --upstream-host HOST --upstream-port PORT [--listen-port 22101] [--allowed-origin http://localhost:5173]\n");
    return;
  }
  if (!args["upstream-host"] || !args["upstream-port"]) {
    throw new Error("Both --upstream-host and --upstream-port are required; no production endpoint is assumed");
  }
  const bridge = createTcpWebSocketBridge({
    upstreamHost: args["upstream-host"],
    upstreamPort: Number(args["upstream-port"]),
    listenHost: args["listen-host"] ?? "127.0.0.1",
    listenPort: Number(args["listen-port"] ?? 22101),
    allowedOrigins: args.allowedOrigins ?? DEFAULT_ORIGINS,
  });
  const address = await bridge.listen();
  process.stdout.write(JSON.stringify({
    event: "listening",
    websocketUrl: "ws://" + address.address + ":" + address.port + "/kpah",
    upstream: args["upstream-host"] + ":" + args["upstream-port"],
    allowedOrigins: args.allowedOrigins ?? DEFAULT_ORIGINS,
  }) + "\n");
  const shutdown = async () => { await bridge.close(); process.exit(0); };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write("KPAH bridge: " + error.message + "\n");
    process.exitCode = 1;
  });
}
