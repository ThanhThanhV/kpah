# World WebSocket load test (k6)

This is an opt-in load test for a **local or dedicated test server**. It is not part of normal CI and must not be pointed at production without an explicit capacity-test window.

## What it exercises

- Opens one authenticated `/ws/world` WebSocket per virtual user.
- Sends normalized movement intents at 10 messages/second (below the gateway's 30/s movement budget).
- Sends heartbeat pings every 20 seconds.
- Attacks a monster learned from full/delta snapshots every 3 seconds (below the 5/s attack budget).
- Measures connection upgrade time, full snapshots, deltas, combat events, received frame sizes, snapshot inter-arrival time, session duration and socket errors.
- Writes `world-load-summary.json` in the current working directory.

Each VU must use a **different test account/session and character**. Reusing one character across many sockets would distort gameplay state and can cause duplicate-player behavior. Do not commit tokens or passwords.

## Prerequisites

1. Start the backend against a dedicated MySQL test database and ensure the world map is initialized.
2. Create enough disposable test accounts and characters for the target VU count.
3. Sign in each account through the client or `POST /api/auth/login`; collect its returned `token` and `characterId`. The session token is also stored in browser local storage as `kpah.sessionToken`, with the selected character ID in `kpah.characterId`.
4. Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/

The script does not register accounts or log in during the run. This avoids auth-rate-limit interference and keeps the test focused on the world gateway.

## Run on Windows PowerShell

Set one JSON array entry per VU. Use unique tokens and character IDs belonging to those tokens:

```powershell
$env:KPAH_WS_URL = "ws://127.0.0.1:8080/ws/world"
$env:KPAH_WS_ORIGIN = "http://localhost:5173"
$env:KPAH_VUS = "10"
$env:KPAH_SESSION_SECONDS = "270"
$env:KPAH_TEST_SESSIONS = '[{"token":"TOKEN_1","characterId":"CHARACTER_ID_1"},{"token":"TOKEN_2","characterId":"CHARACTER_ID_2"}]'
k6 run infra/load/k6-world.js
```

The example above intentionally contains only two placeholders; add one valid unique entry for every configured VU. For 10 VUs, the JSON array must contain 10 entries.

For a smaller smoke test, set `KPAH_VUS=1` and provide one test session.

## Metrics and interpretation

- `ws_connecting`: k6 WebSocket connection/upgrade time; threshold p95 under 2 seconds.
- `world_ws_first_snapshot_ms`: time from VU start until the first full world snapshot; every VU must receive one before closing.
- `world_ws_upgrade_failures`: failed HTTP 101 upgrades; threshold zero.
- `world_ws_initial_snapshot_failures`: VUs that connected but did not receive the initial full snapshot; threshold zero.
- `world_ws_full_snapshots` / `world_ws_snapshot_deltas`: server frame counts observed by clients.
- `world_ws_snapshot_interarrival_ms`: client-observed time between snapshot/delta frames; not server simulation tick time.
- `world_ws_received_bytes`: received JavaScript string length (approximate payload size; not a wire-byte counter).
- `world_ws_session_duration_ms`: connection lifetime.
- `world_ws_errors`: socket or malformed-frame errors.

The server-side Micrometer measurements are available from `GET /actuator/metrics/world.websocket.connections.active`, `world.websocket.outbound.messages`, `world.websocket.outbound.payload`, `world.websocket.send.duration` and `world.websocket.send.failures`. For tagged metrics, append the appropriate `?tag=message_type:snapshot-delta` filter.

Run increasing profiles (for example 1, 10, 25, 50 VUs) as separate runs and compare p95 connection time, snapshot gaps, payload distributions, server send duration, CPU, heap, MySQL load and error rate. Stop increasing load when latency/errors rise materially or resource headroom becomes unsafe. Do not infer a production player cap from one short run.

The test intentionally uses the existing movement and combat protocol. Combat changes character/monster state and may award drops/experience; use disposable test data and reset it between runs if repeatability matters.
