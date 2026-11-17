# World network protocol v1

## Transport

- WebSocket endpoint: `/ws/world`
- Development default client URL: `ws://localhost:8080/ws/world`
- Optional query parameter: `mapId`; defaults to `starter-meadow`.
- On connect, the server sends a `welcome` frame containing the socket's ephemeral `playerId` and selected `mapId`.
- The gateway currently creates an ephemeral player identity per socket. Authentication, account-to-character binding and reconnect tokens are not implemented.

## Server to client: welcome

```json
{ "type": "welcome", "playerId": "ephemeral-session-player-id", "mapId": "starter-meadow" }
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
- Player IDs and positions are in memory and disappear on server restart.
- No authentication, rate limiting, heartbeat, reconnect/resume, interest management or delta compression yet.
- The client currently renders its local character; remote snapshot entities are the next multiplayer presentation task.
- Server map geometry is still a manually maintained registry and must be generated from the same versioned map source as the Tiled client map.
