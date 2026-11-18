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
- Per-IP throttles currently protect login and registration. World-message rate limiting is implemented per connection; interest management and delta compression remain outstanding.
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
