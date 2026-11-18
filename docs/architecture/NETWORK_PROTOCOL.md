# World network protocol v1

## Transport

- WebSocket endpoint: `/ws/world`
- Development default client URL: `ws://localhost:8080/ws/world`
- The client supplies `characterId` as a query parameter and sends the opaque 256-bit session credential in a custom `Sec-WebSocket-Protocol` value (`auth.<token>`). The server stores only the token's SHA-256 hash.
- The server validates the session and confirms the requested character is the account's owned character before adding the socket to the world. Invalid or expired sessions are closed with policy violation.
- Each account receives one starter character and may create up to two more (maximum three). The selected character ID is stored on the authenticated session. Character classes are currently metadata only.
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
- Rate limiting, heartbeat, reconnect/resume, interest management and delta compression remain.
- The token is currently passed in the WebSocket query string; production reverse-proxy access logs must redact the token parameter and public deployments must use WSS.
- The client currently renders its local character; remote snapshot entities are the next multiplayer presentation task.
- Server map geometry is still a manually maintained registry and must be generated from the same versioned map source as the Tiled client map.
