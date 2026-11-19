import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const TARGET_VUS = Number(__ENV.KPAH_VUS || 10);
const SESSION_SECONDS = Number(__ENV.KPAH_SESSION_SECONDS || 270);
const WS_URL = __ENV.KPAH_WS_URL || "ws://127.0.0.1:8080/ws/world";
const WS_ORIGIN = __ENV.KPAH_WS_ORIGIN || "http://localhost:5173";
const sessions = JSON.parse(__ENV.KPAH_TEST_SESSIONS || "[]");

const connected = new Counter("world_ws_connected");
const snapshots = new Counter("world_ws_full_snapshots");
const deltas = new Counter("world_ws_snapshot_deltas");
const combatEvents = new Counter("world_ws_combat_events");
const receivedBytes = new Trend("world_ws_received_bytes");
const snapshotGap = new Trend("world_ws_snapshot_interarrival_ms");
const sessionDuration = new Trend("world_ws_session_duration_ms");
const firstSnapshotLatency = new Trend("world_ws_first_snapshot_ms");
const initialSnapshotFailures = new Rate("world_ws_initial_snapshot_failures");
const socketErrors = new Counter("world_ws_errors");
const upgradeFailures = new Rate("world_ws_upgrade_failures");

export const options = {
  scenarios: {
    world_gateway: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: TARGET_VUS },
        { duration: "3m", target: TARGET_VUS },
        { duration: "30s", target: 0 }
      ],
      gracefulRampDown: "10s",
      gracefulStop: "10s"
    }
  },
  thresholds: {
    ws_connecting: ["p(95)<2000"],
    world_ws_upgrade_failures: ["rate==0"],
    world_ws_initial_snapshot_failures: ["rate==0"],
    world_ws_errors: ["count<10"]
  }
};

export default function () {
  if (sessions.length < TARGET_VUS) {
    throw new Error("KPAH_TEST_SESSIONS must contain at least KPAH_VUS unique {token, characterId} entries.");
  }
  const session = sessions[__VU - 1];
  if (!session || !session.token || !session.characterId) {
    throw new Error("Missing test session for VU " + __VU + ".");
  }

  const url = WS_URL + (WS_URL.includes("?") ? "&" : "?")
    + "characterId=" + encodeURIComponent(session.characterId);
  const startedAt = Date.now();
  let lastSnapshotAt = 0;
  let sawFullSnapshot = false;
  let movementSequence = 0;
  let movementTick = 0;
  let attackTick = 0;
  const monsterIds = [];

  const response = ws.connect(url, {
    headers: {
      "Sec-WebSocket-Protocol": "auth." + session.token,
      "Origin": WS_ORIGIN
    },
    tags: { endpoint: "world" }
  }, function (socket) {
    socket.on("open", function () {
      connected.add(1);
      socket.setInterval(function () {
        movementTick += 1;
        const phase = movementTick / 10;
        const axisX = Math.sin(phase);
        const axisY = Math.cos(phase);
        socket.send(JSON.stringify({
          type: "move",
          sequence: ++movementSequence,
          axisX: axisX,
          axisY: axisY
        }));
      }, 100);

      socket.setInterval(function () {
        socket.send(JSON.stringify({ type: "ping" }));
      }, 20000);

      socket.setInterval(function () {
        if (monsterIds.length === 0) return;
        const targetMonsterId = monsterIds[attackTick % monsterIds.length];
        attackTick += 1;
        socket.send(JSON.stringify({ type: "attack", targetMonsterId: targetMonsterId }));
      }, 3000);

      socket.setTimeout(function () {
        socket.close();
      }, SESSION_SECONDS * 1000);
    });

    socket.on("message", function (raw) {
      receivedBytes.add(String(raw).length);
      let message;
      try {
        message = JSON.parse(raw);
      } catch (_) {
        socketErrors.add(1);
        return;
      }

      if (message.type === "snapshot" || message.type === "snapshot-delta") {
        const now = Date.now();
        if (lastSnapshotAt > 0) snapshotGap.add(now - lastSnapshotAt);
        lastSnapshotAt = now;

        if (message.type === "snapshot") {
          snapshots.add(1);
          if (!sawFullSnapshot) firstSnapshotLatency.add(now - startedAt);
          sawFullSnapshot = true;
        } else deltas.add(1);

        (message.monsters || []).forEach(function (monster) {
          if (monster && monster.monsterId && !monsterIds.includes(monster.monsterId)) {
            monsterIds.push(monster.monsterId);
          }
        });
        (message.removedMonsterIds || []).forEach(function (removedId) {
          const index = monsterIds.indexOf(removedId);
          if (index >= 0) monsterIds.splice(index, 1);
        });
      } else if (message.type === "combat") {
        combatEvents.add(1);
      }
    });

    socket.on("error", function () {
      socketErrors.add(1);
    });

    socket.on("close", function () {
      sessionDuration.add(Date.now() - startedAt);
      const initialSnapshotReceived = check(sawFullSnapshot, {
        "received initial full world snapshot": (received) => received
      });
      initialSnapshotFailures.add(!initialSnapshotReceived);
      if (!initialSnapshotReceived) socketErrors.add(1);
    });
  });

  const upgraded = check(response, {
    "world websocket upgrade returns 101": (r) => r && r.status === 101
  });
  upgradeFailures.add(!upgraded);
  if (!upgraded) socketErrors.add(1);
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify({
      metrics: data.metrics,
      root_group: data.root_group
    }, null, 2) + "\n",
    "world-load-summary.json": JSON.stringify(data, null, 2)
  };
}
