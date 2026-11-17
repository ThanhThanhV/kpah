# Architecture baseline

Status: initial implementation baseline; validate through the P0 vertical slice before treating framework choices as irrevocable.

## Decisions

| Area | Baseline | Rationale / boundary |
|---|---|---|
| Game client | TypeScript + Phaser 3 | Browser-first 2D runtime; scene lifecycle, input, cameras and rendering. |
| Character visuals | Hybrid adapter contract | Sprite sheets for frame-based directional clips; Spine runtime only where rigging/attachments/deformation justify it. |
| Account/admin UI | Start with the game client shell; add a separate React surface only when admin/login scope requires it. | Avoid introducing a second UI stack before the game loop exists. |
| Game server | Java 21 + Spring Boot | Owns authoritative movement, combat, AI, drops, inventory, quests and currency. |
| Realtime | WebSocket planned | Versioned messages, sequence numbers, snapshots, event ordering, heartbeat and reconnect. Not yet implemented. |
| Persistence | PostgreSQL planned | Durable accounts, characters and economy. Redis is optional and deferred until ephemeral session/presence needs are measured. |
| Deployment | Docker Compose for local dependencies; CI for client/server validation | Keep local setup reproducible. |

## Runtime boundaries

- The client sends input intent; it must not decide final position, damage, loot or currency.
- The server validates movement against speed, map bounds and collision data.
- The server resolves combat and emits ordered authoritative events.
- The client predicts only for responsiveness and reconciles to server snapshots when realtime transport is introduced.
- Durable state belongs in PostgreSQL. Redis is not a source of truth.

## Character asset contract

A character definition is independent of the renderer and contains a stable character key, logical frame size, feet pivot, directional clips, and optional equipment attachment metadata. A directional clip identifies its source type (`spritesheet` or `spine`), animation key, frame rate/loop policy, and action markers. The first implementation uses a procedural debug adapter so the renderer can be validated before original art is authored.

## Facing rule

Movement is a continuous 2D vector. Normalize diagonal input so diagonal speed equals cardinal speed. The visual facing remains one of `up`, `down`, `left`, `right`: the axis with the larger absolute component wins; an exact tie retains the previous facing. When input becomes zero, retain the last facing.

## P0 acceptance gate

A character animates in four directions and moves freely on a collision-enabled test map; the server validates movement; and the asset pipeline is proven. This commit starts the client renderer/movement spike and API foundation. It does not yet satisfy the full gate.
