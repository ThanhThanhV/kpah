# WBS progress report

Last updated: 2026-11-17  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

## Status legend

- **DONE** — deliverable and acceptance evidence are complete.
- **IN PROGRESS** — implementation is committed; remaining integration or acceptance work is open.
- **NOT STARTED** — no implementation evidence committed.
- **BLOCKED** — waiting on a dependency or decision.

> User instruction: continue implementation without waiting for build-success confirmation. This report tracks committed deliverables and remaining work; it does not claim a local build or browser session was run.

## Current summary

| Measure | Status |
|---|---|
| Repository reset | DONE |
| Project foundation | IN PROGRESS |
| P0 vertical slice | IN PROGRESS |
| Character Renderer | IN PROGRESS |
| Map Engine | IN PROGRESS |
| Movement | IN PROGRESS |
| Multiplayer transport | IN PROGRESS |
| Monster / Combat / Skills | NOT STARTED |
| Progression / Economy / Quests | NOT STARTED |
| QA / Operations | NOT STARTED |

## WBS activity tracking

| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 2.1.1 | Specify login-to-world player journey | IN PROGRESS | MVP journey in README; formal game design and flow acceptance remain. |
| 2.1.2 | Specify move, hunt, loot, upgrade and quest loop | IN PROGRESS | MVP loop in architecture baseline; detailed content/rules remain. |
| 2.2.1 | Specify free movement and four-direction facing | IN PROGRESS | Rule and client prototype exist; mobile input and runtime feel remain. |
| 3.1.1 | Select and validate 2D renderer/game framework | IN PROGRESS | Phaser 3 client committed; framework validation and asset benchmark remain. |
| 3.1.2 | Define scene lifecycle, entity model and update loop | IN PROGRESS | Phaser scene, character entity and Tiled-backed map lifecycle committed; integration remains. |
| 3.1.3 | Define asset loading, caching and memory budgets | IN PROGRESS | SpriteSheet/Spine adapter contract started; concrete adapters and profiling remain. |
| 3.2.1 | Define zone simulation ownership and tick model | IN PROGRESS | Server-authoritative movement service and WebSocket intent gateway committed; fixed-step zone loop remains. |
| 3.2.2 | Define server authority for movement/combat/loot/inventory | IN PROGRESS | Movement authority implemented; combat, loot and inventory authority remain. |
| 3.2.3 | Define account API versus realtime simulation boundaries | IN PROGRESS | REST health endpoint and WebSocket world endpoint committed; auth/session gateway remains. |
| 3.3.1 | Define versioned client-server message schema | IN PROGRESS | World protocol v1 for movement intent, snapshots and errors documented; version negotiation remains. |
| 3.3.2 | Define PostgreSQL and Redis data policy | IN PROGRESS | PostgreSQL Compose service and policy documented; persistent player/world schemas remain. |
| 3.3.3 | Define idempotency, event ordering and reconnect semantics | IN PROGRESS | Monotonic movement sequence validation implemented; reconnect/resume and durable idempotency remain. |
| 3.4.1 | Repository structure and code standards | IN PROGRESS | Monorepo structure committed; contribution guide and branch protections remain. |
| 3.4.2 | Local development environment and seeded world | IN PROGRESS | Client/server commands, PostgreSQL Compose and starter Tiled map committed; unified map seeding remains. |
| 3.4.3 | CI build, lint, test and artifact pipeline | IN PROGRESS | CI workflow committed; no execution result is claimed. |
| 4.1 | Character asset model and hybrid renderer | IN PROGRESS | Character definition, directional facing and SpriteSheet/Spine adapter contract committed; concrete adapters remain. |
| 4.2 | Character animation state machine | IN PROGRESS | Idle/walk/attack/cast/hit/death states represented in debug renderer; real animation clips remain. |
| 4.3 | Character composition and world presentation | IN PROGRESS | Feet pivot, nameplate, HP bar and Y-based depth implemented; equipment layers and full world sorting remain. |
| 4.4 | Character performance and visibility | NOT STARTED | Culling, LOD and crowd profiling remain. |
| 4.5 | Character preview and asset validation | IN PROGRESS | Playable debug preview exists; dedicated inspector and asset validator remain. |
| 5 | Map Engine | IN PROGRESS | Finite orthogonal Tiled JSON is loaded in Phaser preload and converted into terrain, collision and world-object runtime data. Debug colors/markers remain; texture atlas, richer shapes, transitions, streaming and final art remain. |
| 6.1 | Input capture | IN PROGRESS | WASD/arrows and attack/cast wired; touch joystick and focus recovery remain. |
| 6.2 | Free movement and collision | IN PROGRESS | Client prediction uses normalized movement and collision; server validates intent and computes authoritative coordinates with monotonic sequence and capped elapsed time. Reconciliation tuning remains. |
| 6.3 | Facing and animation synchronization | IN PROGRESS | Four cardinal facings and character state transitions implemented; server-facing state and real clips remain. |
| 10.1 | Realtime transport and session lifecycle | IN PROGRESS | Spring WebSocket endpoint accepts movement intent and broadcasts same-map snapshots; authentication, heartbeat and reconnect remain. |
| 10.2 | Multiplayer world replication | IN PROGRESS | Server snapshot includes connected players in a map; client remote-entity rendering and interpolation remain. |
| 7–9, 11–17 | Monster, Combat, Skills/VFX, progression, economy, quests, QA and live operations | NOT STARTED | No gameplay implementation committed for these workstreams yet. |

## Current risks

1. Character visual remains an original procedural debug figure, not final character art.
2. SpriteSheet and Spine adapters are contracts only; no third-party or original game assets are included.
3. Map terrain is still rendered with procedural colors; Tiled image tilesets and atlas rendering remain.
4. The development WebSocket gateway has ephemeral identity and in-memory state; authentication and persistence are not implemented.
5. Server collision geometry is manually maintained and is not yet generated from the Tiled source.

## Next implementation sequence

1. Render remote players from world snapshots with interpolation and stable Y-depth sorting.
2. Generate server collision geometry from the same versioned Tiled map data.
3. Add monster entities, spawn timers and simple server-authoritative roaming AI.
4. Add target selection, attack range, damage and death/respawn loop.
5. Continue into skills/VFX, inventory, NPC/quest, persistence and production multiplayer hardening.
