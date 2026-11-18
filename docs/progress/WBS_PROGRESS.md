# WBS progress report

Last updated: 2026-11-18  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

> CI is configured through GitHub Actions. Each push to main runs client typecheck/build and server Maven test/package. The latest earlier runs exposed a client TypeScript error; see the CI section below. No unverified build result is described as passing.

## Current summary
| Measure | Status |
|---|---|
| Repository reset | DONE |
| Project foundation | IN PROGRESS |
| P0 vertical slice | IN PROGRESS |
| Character Renderer | IN PROGRESS |
| Map Engine / Movement | IN PROGRESS |
| Multiplayer transport and client replication | IN PROGRESS |
| Monster system and aggro AI | IN PROGRESS |
| Basic combat, loot and progression | IN PROGRESS |
| Skills / Quests / persistent economy | NOT STARTED |
| QA / Operations | IN PROGRESS |

## WBS activity tracking
| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 3.1–3.4 | Client/server foundation, world transport and CI | IN PROGRESS | Phaser, Spring Boot, PostgreSQL Compose and GitHub Actions committed; latest CI runs need clean pass. |
| 4.1–4.5 | Character renderer and animation | IN PROGRESS | Procedural player placeholder and SpriteSheet/Spine adapter contracts; concrete art adapters remain. |
| 5 | Map Engine | IN PROGRESS | Tiled map loading and rectangular collision; collision-aware monster navigation and map art remain. |
| 6.1–6.3 | Input, movement and facing | IN PROGRESS | Client prediction and server-authoritative movement; touch controls and replicated facing remain. |
| 7.1 | Monster definitions and spawn regions | IN PROGRESS | Tiled spawn properties define type, alive cap, respawn, roam radius and speed. |
| 7.2 | Monster simulation and AI | IN PROGRESS | Initial spawn, bounded roam, aggro, direct pursuit, attack range/cooldown and leash; obstacle-aware pathfinding remains. |
| 7.3 | Monster presentation | IN PROGRESS | Snapshot-driven slime and ground-drop placeholders; final sprite/Spine animations remain. |
| 8.1 | Target selection and basic attack | IN PROGRESS | Nearest monster selection; server validates target, map, 58px range and 600ms cooldown. |
| 8.2 | Damage and monster defeat | IN PROGRESS | Server applies damage and configured respawn delay; kill creates a material drop and grants 25 EXP. |
| 8.3 | Player damage, death and respawn | IN PROGRESS | Monster attacks reduce player HP; server respawns at map spawn after 3 seconds. |
| 9 | Skills and visual effects | NOT STARTED | Skill definitions, cooldowns and authoritative execution remain. |
| 10 | Multiplayer replication | IN PROGRESS | Players, monsters, HP, EXP, level, inventory and ground loot snapshots; auth/reconnect/interest management remain. |
| 11 | Character progression | IN PROGRESS | Level advances every 100 EXP; persistent character records and stat growth remain. |
| 12 | Loot and inventory | IN PROGRESS | One material drop per defeated monster, proximity auto-pickup and per-session inventory counts; item catalog, equipment and persistence remain. |
| 13–17 | Economy, quests, QA and operations | NOT STARTED | No committed implementation evidence yet. |

## CI findings
- Workflow: `.github/workflows/ci.yml`.
- Server job passed on the previous run for commit `d06f9a5`.
- Client job failed at TypeScript typecheck because `CharacterEntity` declared an unused constructor property `scene`; this was corrected in commit `01905e7`.
- The CI run for `01905e7` was still in progress when this report was prepared; its final result must be checked before claiming a pass.

## Current risks
1. Character and monster visuals remain original procedural placeholders.
2. Monster pursuit uses direct movement and is not collision-aware.
3. Loot, EXP and inventory are in-memory and reset on server restart.
4. WebSocket authentication, heartbeat, reconnect, rate limiting and interest management remain.
5. No persistent character database, item catalog or equipment implementation yet.

## Next implementation sequence
1. Add collision-aware monster pursuit with simple grid pathfinding and attack/idle state feedback.
2. Add skill definitions, cooldowns and server-authoritative skill execution.
3. Add persistent character progression and inventory.
4. Replace debug character/monster/drop visuals with original art and concrete animation adapters.
5. Run and resolve the full GitHub Actions CI suite on each implementation batch.
