# WBS progress report

Last updated: 2026-11-17  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

## Status legend

- **DONE** — deliverable and acceptance evidence are complete.
- **IN PROGRESS** — implementation is committed; remaining integration or acceptance work is open.
- **NOT STARTED** — no implementation evidence committed.
- **BLOCKED** — waiting on a dependency or decision.

> User instruction: continue implementation without waiting for build-success confirmation. This report therefore tracks committed deliverables and remaining work; it does not claim that a local build or browser session was run.

## Current summary

| Measure | Status |
|---|---|
| Repository reset | DONE |
| Project foundation | IN PROGRESS |
| P0 vertical slice | IN PROGRESS |
| Character Renderer | IN PROGRESS |
| Map Engine | IN PROGRESS |
| Movement | IN PROGRESS |
| Monster / Combat / Skills | NOT STARTED |
| Multiplayer / MVP systems | NOT STARTED |
| QA / Operations | NOT STARTED |

## WBS activity tracking

| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 2.1.1 | Specify login-to-world player journey | IN PROGRESS | MVP journey in README; formal game design and flow acceptance remain. |
| 2.1.2 | Specify move, hunt, loot, upgrade and quest loop | IN PROGRESS | MVP loop in architecture baseline; detailed content/rules remain. |
| 2.2.1 | Specify free movement and four-direction facing | IN PROGRESS | Rule and client prototype exist; mobile input and runtime feel remain. |
| 3.1.1 | Select and validate 2D renderer/game framework | IN PROGRESS | Phaser 3 client committed; framework validation and asset benchmark remain. |
| 3.1.2 | Define scene lifecycle, entity model and update loop | IN PROGRESS | Phaser scene, character entity and map renderer committed; integration remains. |
| 3.1.3 | Define asset loading, caching and memory budgets | IN PROGRESS | SpriteSheet/Spine adapter contract started; real adapters and profiling remain. |
| 3.2.1 | Define zone simulation ownership and tick model | IN PROGRESS | Server-authority boundary documented; authoritative zone loop remains. |
| 3.2.2 | Define server authority for movement/combat/loot/inventory | IN PROGRESS | Authority boundary documented; validators and simulation remain. |
| 3.2.3 | Define account API versus realtime simulation boundaries | IN PROGRESS | REST health endpoint exists; WebSocket gateway remains. |
| 3.3.1 | Define versioned client-server message schema | IN PROGRESS | Protocol boundary documented; concrete schema/version negotiation remains. |
| 3.3.2 | Define PostgreSQL and Redis data policy | IN PROGRESS | PostgreSQL Compose service and policy documented; entities/schema remain. |
| 3.3.3 | Define idempotency, event ordering and reconnect semantics | NOT STARTED | Protocol semantics and recovery implementation remain. |
| 3.4.1 | Repository structure and code standards | IN PROGRESS | Monorepo structure committed; contribution guide and branch protections remain. |
| 3.4.2 | Local development environment and seeded world | IN PROGRESS | Client/server commands and PostgreSQL Compose committed; seed data remains. |
| 3.4.3 | CI build, lint, test and artifact pipeline | IN PROGRESS | CI workflow committed; no execution result is claimed. |
| 4.1 | Character asset model and hybrid renderer | IN PROGRESS | Character definition, directional facing and SpriteSheet/Spine adapter contract committed; concrete asset adapters remain. |
| 4.2 | Character animation state machine | IN PROGRESS | Idle/walk/attack/cast/hit/death states and timed transitions represented in debug renderer; real animation clips remain. |
| 4.3 | Character composition and world presentation | IN PROGRESS | Feet pivot, nameplate, HP bar and Y-based depth implemented; equipment layers and full world sorting remain. |
| 4.4 | Character performance and visibility | NOT STARTED | Culling, LOD and crowd profiling remain. |
| 4.5 | Character preview and asset validation | IN PROGRESS | Playable debug preview exists; dedicated inspector and asset validator remain. |
| 5 | Map Engine | IN PROGRESS | Finite orthogonal Tiled JSON is now loaded at scene startup. Ground GIDs map through tileset terrainId properties; object layers supply player spawn, collision rectangles, NPC, monster-spawn and portal markers. Debug marker rendering is wired; texture atlas, richer collision shapes, map transitions, streaming and final art remain. |
| 6.1 | Input capture | IN PROGRESS | WASD/arrow keyboard input and attack/cast actions wired; touch joystick and focus recovery remain. |
| 6.2 | Free movement and collision | IN PROGRESS | Reusable client MovementController handles normalized input, map bounds, axis-separated collision and wall sliding. Java MovementService now computes authoritative coordinates from directional intent and server tick; WebSocket integration and tuning remain. |
| 6.3 | Facing and animation synchronization | IN PROGRESS | Four cardinal facings, dominant-axis selection and stable diagonal tie; character state transitions cover idle/walk/attack/cast/hit/death; skill intent and real animation clips remain. |
| 7–17 | Monster, Combat, Skills/VFX, Multiplayer, progression, economy, quests, QA and live operations | NOT STARTED | No implementation committed for these workstreams yet. |

## Current risks

1. The player visual is still an original procedural debug figure, not final character art.
2. SpriteSheet and Spine adapters are contracts only; no third-party/original game assets are included.
3. Map renderer currently draws procedural tile colors and collision placeholders; it is not yet a Tiled map importer.
4. WebSocket, authoritative movement, monsters, combat, skills, persistence and multiplayer remain future work.

## Next implementation sequence

1. Add Tiled JSON import and map object layers; separate collision geometry from debug rendering.
2. Add movement controller as a reusable module and mobile virtual joystick.
3. Connect the Java authoritative MovementService to versioned WebSocket input/snapshot messages.
4. Add monster entity/AI, server-side combat and skill event pipeline.
5. Continue through inventory, NPC/quest, persistence, multiplayer QA and release gates.
