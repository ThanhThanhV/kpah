# World network protocol v1

## Transport

- WebSocket endpoint: `/ws/world`
- Development default client URL: `ws://localhost:8080/ws/world`
- The client supplies `characterId` as a query parameter and sends the opaque 256-bit session credential in a custom `Sec-WebSocket-Protocol` value (`auth.<token>`); the token is not placed in the URL. The server stores only the token's SHA-256 hash.
- The server validates the session and confirms the requested character is the account's owned character before adding the socket to the world. Invalid or expired sessions are closed with policy violation.
- Each account receives one starter character and may create up to two more (maximum three). The selected character ID is stored on the authenticated session. Class base HP, attack and defense are applied server-side; class-specific skill trees remain.
- Account endpoints: `GET /api/auth/characters`, `POST /api/auth/characters`, and `POST /api/auth/select-character`.
- Optional query parameter `mapId` is retained for compatibility but the persisted character's map is authoritative.

## Server to client: welcome

```json
{ "type": "welcome", "playerId": "persistent-character-id", "mapId": "starter-meadow" }
```

## Client to server: movement intent

```json
{
  "type": "move",
  "sequence": 12,
  "axisX": 1,
  "axisY": 0
}
```

The client sends intent, never authoritative coordinates. Axis values must be finite, and the vector magnitude cannot exceed 1. Sequence numbers must increase monotonically for each connection.

## Server to client: world snapshot

```json
{
  "type": "snapshot",
  "players": [
    {
      "playerId": "ephemeral-session-player-id",
      "mapId": "starter-meadow",
      "x": 640,
      "y": 384,
      "sequence": 12
    }
  ]
}
```

Snapshots include all connected players in the same map. The client identifies its own player using the preceding welcome frame. Coordinates are calculated by `MovementService` using server-measured elapsed time (capped at 50 ms), map bounds and collision geometry.

## Server to client: error

```json
{ "type": "error", "message": "Movement sequence must increase monotonically." }
```

## Current limitations

- The gateway is a development transport, not a production-ready zone simulation.
- Live positions are held in memory and are persisted to PostgreSQL as movement updates; multi-zone coordination is not implemented.
- Per-IP throttles currently protect login and registration. World-message rate limiting is implemented per connection; interest management is implemented, while delta compression remains outstanding.
- The WebSocket container caps text and binary message buffers at 8,192 bytes; asynchronous sends time out after 10 seconds. The handler also caps text payloads at 8,192 Java characters before JSON parsing and closes oversized messages with code 1009. The container limit protects transport buffering before the handler guard.
- WebSocket handshake origins are exact-match allowlisted through `WEBSOCKET_ALLOWED_ORIGINS` (comma-separated); the development default permits only `http://localhost:5173` and `http://127.0.0.1:5173`. Set the deployed frontend origin explicitly. The browser stores the opaque session token in localStorage and sends it as a custom WebSocket subprotocol. Production handshake/header logging must redact credentials, public deployments must use HTTPS/WSS, and browser XSS exposure still needs production hardening.
- The client renders local and remote player entities from authoritative snapshots; original spritesheet/Spine assets are not integrated yet.
- Server map geometry is still a manually maintained registry and must be generated from the same versioned map source as the Tiled client map.

## Remote character facing

Facing is derived from consecutive authoritative position snapshots. When the displacement is non-zero, clients select the dominant cardinal axis (horizontal or vertical); exact diagonal ties resolve vertically. This keeps remote sprite orientation consistent without trusting a client-supplied facing value. The interpolated render position remains client-side and does not affect server movement authority.

## Remote combat animation events

The server broadcasts accepted combat actions to every connected player on the same map. Events identify the authoritative source player for basic attacks and skill casts, or the target player for monster-hit reactions. Clients use these events only for presentation: remote characters play attack/cast/hit animations while damage, target validation and world state remain server-authoritative.

## Heartbeat and reconnect lifecycle

- The client sends an application-level `ping` every 20 seconds while connected; the server replies with `pong`.
- If a pong is not received within 10 seconds, the client closes the stale socket and enters the retryable reconnect path.
- Unexpected network disconnects reconnect with bounded exponential backoff from 1 to 30 seconds. Destroying the scene cancels heartbeat and reconnect timers.
- A policy-violation close (1008) is terminal for the current credentials/character selection: the client does not retry the same WebSocket credentials. It revalidates `/api/auth/me` and returns a valid account to character selection, or returns an expired account to sign-in.
- Protocol/data closes (1002, 1003, 1007), message-too-large (1009) and unsupported-extension (1010) are terminal for the current socket attempt. The client stops automatic reconnect and shows a protocol-error state; retrying the same frame would otherwise repeat the failure. Transient network closes and heartbeat timeouts remain retryable.

## World message rate limits

The world gateway applies per-connection fixed-window limits before gameplay dispatch:

| Message type | Maximum |
|---|---:|
| `move` | 30 / second |
| `attack`, `cast` | 5 / second each |
| `interact` | 3 / second |
| `equip`, `unequip` | 5 / second each |
| `ping` | 2 / second |
| Unsupported message types (shared bucket) | 10 / second |

All unsupported or missing message types share one rate-limit bucket per connection, preventing arbitrary type strings from creating unbounded counters. Excess frames are silently dropped before persistence, combat processing or map broadcast. Counters are scoped to a WebSocket connection and released when it closes. These in-memory limits protect a single server process; they are not a substitute for distributed quotas when horizontally scaling.


## Recipient-private state without per-recipient map rebuilds
- World snapshots now build the public player list, monster list and loot list once per map broadcast.
- Inventory, equipment, item catalog and quest progress are sent in a separate `selfState` object only to the matching authenticated WebSocket recipient.
- The client merges `selfState` into its own player snapshot before notifying the scene, so existing HUD and rendering code remains unchanged.
- This removes the prior O(N²) public-player serialization work per map broadcast while preserving the public/private state boundary.


## Per-player world interest area (AOI)

- Each world snapshot is filtered around its recipient using a server-side circular interest radius of 900 world pixels.
- The recipient's own player entry is always included; nearby players, living monsters and loot drops are included only when their positions fall inside that radius.
- Inventory, equipment, item catalog and quest state remain isolated in the recipient-only `selfState` field.
- The client removes monster and loot renderers that leave the current AOI and retains unseen remote players for the existing 1.5-second grace period to avoid flicker during brief snapshot gaps.
- World snapshot construction builds one immutable uniform-grid index per entity category and map broadcast (300 world pixels per cell). Each recipient queries only cells intersecting its 900-pixel AOI, then applies an exact circular-distance check. This avoids scanning every map entity separately for every recipient; the index is rebuilt once per broadcast, not maintained incrementally.
- Combat events are routed around the acting player (or hit player for monster attacks): source/target participants always receive their event, and other players receive it only within the same 900-pixel interest radius. Events without a resolvable participant retain map-wide delivery as a safe fallback.

## Movement persistence policy
- Client movement remains server-authoritative and is broadcast immediately after validation.
- Position persistence is throttled to at most once per player connection every 5 seconds instead of writing the character row on every accepted movement packet.
- The latest position is always persisted when the WebSocket connection closes; character creation/login still persists the initial state.
- Combat, inventory, equipment, progression and quest-related persistence paths remain immediate.
- A process crash can therefore lose at most the most recent 5 seconds of movement, while avoiding high-frequency database writes during normal movement.


## Snapshot broadcast coalescing

- State-changing paths mark the affected map as pending instead of serializing and sending a snapshot immediately.
- A 50 ms scheduler drains pending map IDs and sends one latest-state snapshot per map, coalescing movement and simulation updates that arrive within the same interval.
- This caps snapshot flush frequency at 20 Hz per map while retaining the latest authoritative state; combat events remain immediate and are not delayed by snapshot coalescing.
- The 100 ms world simulation tick still marks active maps pending, so idle maps with connected players continue to receive periodic snapshots. Delta snapshots are now implemented; unchanged private `selfState` is omitted from deltas. Runtime bandwidth measurement remains outstanding.


## Delta world snapshots
- The first snapshot for a WebSocket session, and the first snapshot after a map transition, is a full `snapshot`.
- Subsequent world updates use `snapshot-delta`: changed player/monster/loot records plus explicit `removedPlayerIds`, `removedMonsterIds` and `removedLootDropIds`.
- A delta includes the recipient's `selfState` only when it differs from the last successfully sent private state; private inventory, equipment, item catalog and quest data are never shared with other players.
- The server keeps the last serialized entity state per WebSocket session and map. It replaces that cache only after the frame is sent, and clears it when the session closes.
- The client applies deltas to its latest full state by stable entity ID. A welcome/reconnect or map-transition event clears the client baseline; deltas received without a baseline are ignored until the next full snapshot.
- Combat events remain immediate and are not folded into snapshot deltas.


### Private self-state delta optimization
- The first full snapshot always contains the recipient's complete `selfState`.
- Later `snapshot-delta` frames include `selfState` only when its serialized value differs from the last successfully sent value for that session.
- When omitted, the client retains its previously merged private state. Inventory, equipment, item catalog and quest data remain recipient-only.
- Entity and private-state baselines advance only after the frame send completes successfully; session close clears all baselines.


## WebSocket operational metrics

The server registers low-cardinality Micrometer metrics for the world gateway:
- `world.websocket.connections.active`: currently authenticated world WebSocket sessions.
- `world.websocket.outbound.messages`: successfully sent frames, tagged by protocol message type.
- `world.websocket.outbound.payload`: UTF-8 payload-size distribution in bytes, tagged by protocol message type.
- `world.websocket.send.duration`: serialization plus synchronous socket-send duration, tagged by protocol message type.
- `world.websocket.send.failures`: failed serialization/send attempts, tagged by protocol message type.

The Actuator `metrics` endpoint is enabled alongside health/info so operators can inspect aggregate measurements at `/actuator/metrics`. Metrics deliberately exclude account IDs, character IDs, session IDs and client-supplied labels. These are instrumentation counters and distributions, not a benchmark: production capacity limits must be set only after representative concurrent-client load tests.


## Gateway load-test procedure

An opt-in k6 scenario is maintained at `infra/load/k6-world.js`, with setup and interpretation instructions in `infra/load/README.md`. It uses one unique test account/session/character per VU, sends movement at 10 messages/second, heartbeats at 20-second intervals and attacks a visible monster every 3 seconds. It records upgrade failures, full/delta frames, combat events, approximate received payload lengths and client-observed snapshot inter-arrival times. Server-side Micrometer metrics provide outbound frame counts, payload-size distributions, send duration and active connections. The script is deliberately excluded from normal CI and must run against disposable test data. A capacity limit is not established until repeatable load runs and host CPU/heap/MySQL measurements are reviewed.
