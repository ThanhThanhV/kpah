# WBS progress report

Last updated: 2026-11-17  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

## Status legend

- **DONE** — deliverable exists and its acceptance evidence is available.
- **IN PROGRESS** — implementation/documentation exists, but acceptance evidence is incomplete.
- **NOT STARTED** — no implementation evidence yet.
- **BLOCKED** — cannot proceed until a dependency or decision is resolved.

> Important: this report records repository evidence. A GitHub commit is not proof that a local build, browser run, integration test, or load test passed. Those are marked pending until actually executed.

## Current summary

| Measure | Status |
|---|---:|
| Repository reset | DONE |
| Initial project skeleton | IN PROGRESS |
| P0 vertical slice | IN PROGRESS |
| P1 playable core | NOT STARTED |
| P2 MVP hardening | NOT STARTED |
| P3 social/content | NOT STARTED |
| P4 competitive/instanced | NOT STARTED |
| P5 live operations/scale | NOT STARTED |

## WBS activity tracking

| WBS ID | Activity / deliverable | Status | Evidence / next acceptance step |
|---|---|---|---|
| 2.1.1 | Specify login-to-world player journey | IN PROGRESS | MVP journey documented in README/architecture; formal GDD and flow acceptance pending. |
| 2.1.2 | Specify move, hunt, loot, upgrade, quest loop | IN PROGRESS | MVP loop is in baseline scope; detailed game rules/content bible pending. |
| 2.2.1 | Specify free 360-degree input with 4-direction facing | DONE | `docs/architecture/DECISIONS.md`; client input/facing implementation committed. |
| 3.1.1 | Select and validate 2D renderer/game framework | IN PROGRESS | Phaser client spike committed; must install dependencies and verify browser rendering locally/CI. |
| 3.1.2 | Define scene lifecycle, entity model and update loop | IN PROGRESS | Phaser scene and character entity implemented; runtime validation pending. |
| 3.1.3 | Define asset loading, caching and memory budgets | IN PROGRESS | Asset contract documented; actual atlas/Spine loading and memory budget profiling pending. |
| 3.2.1 | Define zone simulation ownership and tick model | IN PROGRESS | Server-authority boundary documented; zone tick implementation pending. |
| 3.2.2 | Define server authority for movement/combat/loot/inventory | IN PROGRESS | Authority boundary documented; server validators and game simulation pending. |
| 3.2.3 | Define account API versus realtime simulation boundaries | IN PROGRESS | REST health skeleton exists; WebSocket gateway boundary pending. |
| 3.3.1 | Define versioned client-server message schema | IN PROGRESS | Protocol boundary recorded; concrete schema/version negotiation pending. |
| 3.3.2 | Define PostgreSQL model and Redis ephemeral-data policy | IN PROGRESS | PostgreSQL local service and data policy documented; schema/migrations pending. |
| 3.3.3 | Define idempotency, event ordering and reconnect semantics | NOT STARTED | Design and tests pending. |
| 3.4.1 | Create repository structure, branching and code standards | IN PROGRESS | Monorepo skeleton committed; contribution rules and protected-branch policy pending. |
| 3.4.2 | Create local dev environment and seeded test world | IN PROGRESS | Client/server commands and PostgreSQL Compose file committed; full seeded world pending. |
| 3.4.3 | Create CI build, lint, test and artifact pipeline | IN PROGRESS | Workflow committed; CI execution/result pending. |
| 4.1.1–4.1.4 | Character asset model and hybrid runtime | IN PROGRESS | Renderer-facing animation contract started; real sprite-sheet/Spine adapters and asset validation pending. |
| 4.2.1–4.2.4 | Character animation state machine | IN PROGRESS | Idle/walk/attack debug poses implemented; cast/hit/death and full transition validation pending. |
| 4.3.1–4.3.4 | Character composition and world presentation | IN PROGRESS | Feet pivot, nameplate/HP and depth ordering started; equipment overlays and full Y-sort integration pending. |
| 4.4.1–4.4.4 | Character runtime performance/visibility | NOT STARTED | Culling, LOD and crowd profiling pending. |
| 4.5.1–4.5.4 | Character preview/debug and asset validation | IN PROGRESS | Debug arena/character preview committed; dedicated animation inspector and asset validation pending. |
| 6.1.1 | Capture keyboard directional input | DONE | WASD/arrow input implemented in client spike; runtime test pending. |
| 6.1.2 | Capture virtual joystick/touch input | NOT STARTED | Mobile control implementation pending. |
| 6.1.3 | Normalize simultaneous inputs and diagonal speed | DONE | Movement vector normalization implemented. |
| 6.1.4 | Handle input focus, key release and lost-focus recovery | IN PROGRESS | Phaser keyboard lifecycle used; browser focus recovery test pending. |
| 6.2.1 | Implement free 2D vector movement | DONE | Continuous 2D movement implemented in client spike. |
| 6.2.2 | Normalize diagonal movement at consistent speed | DONE | Vector normalization implemented. |
| 6.2.3 | Acceleration/deceleration tuning | NOT STARTED | Deferred until movement feel review. |
| 6.2.4 | Collision resolution and sliding | IN PROGRESS | Test arena obstacles and axis-separated collision implemented; runtime edge-case validation pending. |
| 6.3.1 | Resolve facing from movement vector | DONE | Four-direction dominant-axis resolver implemented. |
| 6.3.2 | Diagonal facing priority and stable last-facing | DONE | Exact diagonal tie retains previous facing. |
| 6.3.3 | Drive walk/idle from movement state | IN PROGRESS | Character entity receives moving state; visual runtime test pending. |
| 6.3.4 | Synchronize facing with attack/skill intent | IN PROGRESS | Attack pose uses current facing; skill intent integration pending. |
| 3.5+ | Remaining WBS activities | NOT STARTED | To be updated as implementation reaches each dependency. |

## Current blockers / risks

1. No original character art has been authored or approved yet; the current character is a procedural debug visualization only.
2. Phaser framework selection is a candidate until CI/browser validation passes.
3. WebSocket simulation, authoritative movement validation, map asset pipeline, monster/combat and persistence are not implemented yet.
4. GitHub connector can commit source files but cannot prove local browser rendering or execute Maven/npm builds in the user's machine.

## Next implementation sequence

1. Verify client build and browser preview; fix compile/runtime issues.
2. Complete renderer contract and directional action-state transitions.
3. Add map schema, tile/layer loader and collision data pipeline.
4. Move movement validation to the Java server and add versioned WebSocket input/snapshot messages.
5. Add monsters, server-side combat and skill/VFX events.
6. Continue through MVP inventory, NPC/quest, persistence, multiplayer QA and release gates.
