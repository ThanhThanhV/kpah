# WBS progress report

Last updated: 2026-11-17  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

## Status legend

- **DONE** — deliverable and acceptance evidence are complete.
- **IN PROGRESS** — implementation is committed; remaining integration or acceptance work is open.
- **NOT STARTED** — no implementation evidence committed.
- **BLOCKED** — waiting on a dependency or decision.

> Continue implementation without waiting for build-success confirmation. This report tracks committed deliverables and does not claim a local build or browser session was run.

## Current summary

| Measure | Status |
|---|---|
| Repository reset | DONE |
| Project foundation | IN PROGRESS |
| P0 vertical slice | IN PROGRESS |
| Character Renderer | IN PROGRESS |
| Map Engine | IN PROGRESS |
| Movement | IN PROGRESS |
| Multiplayer transport and client replication | IN PROGRESS |
| Monster / Combat / Skills | NOT STARTED |
| Progression / Economy / Quests | NOT STARTED |
| QA / Operations | NOT STARTED |

## WBS activity tracking

| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 2.1.1 | Specify login-to-world player journey | IN PROGRESS | MVP journey in README; formal game design and flow acceptance remain. |
| 2.1.2 | Specify move, hunt, loot, upgrade and quest loop | IN PROGRESS | MVP loop in architecture baseline; detailed content/rules remain. |
| 2.2.1 | Specify free movement and four-direction facing | IN PROGRESS | Keyboard movement and cardinal facing exist; touch input and runtime tuning remain. |
| 3.1.1 | Select and validate 2D renderer/game framework | IN PROGRESS | Phaser 3 client committed; framework validation and asset benchmark remain. |
| 3.1.2 | Define scene lifecycle, entity model and update loop | IN PROGRESS | Phaser scene, character entity and Tiled-backed map lifecycle committed; integration remains. |
| 3.1.3 | Define asset loading, caching and memory budgets | IN PROGRESS | SpriteSheet/Spine adapter contract started; concrete adapters and profiling remain. |
| 3.2.1 | Define zone simulation ownership and tick model | IN PROGRESS | Server-authoritative movement and WebSocket gateway committed; fixed-step zone simulation remains. |
| 3.2.2 | Define server authority for movement/combat/loot/inventory | IN PROGRESS | Movement authority implemented; combat, loot and inventory authority remain. |
| 3.2.3 | Define account API versus realtime simulation boundaries | IN PROGRESS | REST health endpoint and WebSocket world endpoint committed; authentication remains. |
| 3.3.1 | Define versioned client-server message schema | IN PROGRESS | Welcome, movement intent, snapshots and errors documented; version negotiation remains. |
| 3.3.2 | Define PostgreSQL and Redis data policy | IN PROGRESS | PostgreSQL Compose service committed; persistent player/world schemas remain. |
| 3.3.3 | Define idempotency, event ordering and reconnect semantics | IN PROGRESS | Monotonic movement sequence validation implemented; reconnect/resume and durable idempotency remain. |
| 3.4.1 | Repository structure and code standards | IN PROGRESS | Monorepo structure committed; contribution guide and branch protections remain. |
| 3.4.2 | Local development environment and seeded world | IN PROGRESS | Client/server commands, PostgreSQL Compose and starter Tiled map committed; unified map source remains. |
| 3.4.3 | CI build, lint, test and artifact pipeline | IN PROGRESS | CI workflow committed; no execution result is claimed. |
| 4.1 | Character asset model and hybrid renderer | IN PROGRESS | Character definition, directional facing and SpriteSheet/Spine adapter contract committed; concrete adapters remain. |
| 4.2 | Character animation state machine | IN PROGRESS | Idle/walk/attack/cast/hit/death debug states; real animation clips remain. |
| 4.3 | Character composition and world presentation | IN PROGRESS | Feet pivot, nameplate, HP bar and Y-depth; equipment layers remain. |
| 4.4 | Character performance and visibility | NOT STARTED | Culling, LOD and crowd profiling remain. |
| 4.5 | Character preview and asset validation | IN PROGRESS | Playable debug preview exists; dedicated inspector and asset validator remain. |
| 5 | Map Engine | IN PROGRESS | Finite orthogonal Tiled JSON is loaded into terrain, collision and object runtime data; atlas rendering, richer shapes, transitions and final art remain. |
| 6.1 | Input capture | IN PROGRESS | WASD/arrows and attack/cast wired; touch joystick and focus recovery remain. |
| 6.2 | Free movement and collision | IN PROGRESS | Client prediction/collision and server-authoritative movement are implemented; reconciliation and shared map geometry remain. |
| 6.3 | Facing and animation synchronization | IN PROGRESS | Four cardinal facings and state transitions; server-facing state and real clips remain. |
| 10.1 | Realtime transport and session lifecycle | IN PROGRESS | Spring WebSocket endpoint accepts movement intent and broadcasts same-map snapshots; authentication, heartbeat and reconnect remain. |
| 10.2 | Multiplayer world replication | IN PROGRESS | Client now creates remote CharacterEntity instances from snapshots, interpolates their movement and removes stale remote entities; identity, animation replication and scale testing remain. |
| 7.1 | Monster definitions and spawn regions | NOT STARTED | Tiled monster-spawn markers exist; server monster model and spawn scheduler remain. |
| 8 | Combat and damage | NOT STARTED | No server-authoritative target, range, damage or death loop committed yet. |
| 9 | Skills and visual effects | NOT STARTED | No skill runtime or effect pipeline committed yet. |
| 11–17 | Progression, economy, quests, QA and live operations | NOT STARTED | No implementation evidence committed yet. |

## Current risks

1. Character visuals remain original procedural debug figures, not final art.
2. SpriteSheet and Spine adapters are contracts only; no third-party or original-game assets are included.
3. Map terrain uses procedural colors; Tiled image tilesets and atlas rendering remain.
4. WebSocket identity and player state are ephemeral and in-memory; authentication and persistence are not implemented.
5. Server collision geometry is manually maintained and can drift from Tiled client geometry.
6. Remote player presentation uses generic names and snapshot smoothing; authoritative identity, facing, action and animation replication remain.

## Next implementation sequence

1. Establish one versioned map definition as the source for client and server collision geometry.
2. Add server monster definitions, spawn timers and roaming AI from Tiled spawn regions.
3. Add target selection, attack range, damage and death/respawn.
4. Continue into skills/VFX, inventory, NPC/quest, persistence and production multiplayer hardening.
