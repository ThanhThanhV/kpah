# WBS progress report

Last updated: 2026-11-18  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

> This report tracks committed deliverables; no local build or browser test is claimed.

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
| Basic combat and player vitals | IN PROGRESS |
| Skills / Progression / Economy / Quests | NOT STARTED |
| QA / Operations | NOT STARTED |

## WBS activity tracking
| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 3.1–3.4 | Client/server foundation, world transport and CI | IN PROGRESS | Phaser, Spring Boot, PostgreSQL Compose, WebSocket and CI workflow committed; CI execution and production hardening remain. |
| 4.1–4.5 | Character renderer and animation | IN PROGRESS | Procedural player placeholder and SpriteSheet/Spine adapter contracts; concrete art adapters remain. |
| 5 | Map Engine | IN PROGRESS | Client/server share Tiled map source for dimensions, spawn and rectangular collision; art tilesets and richer collision remain. |
| 6.1–6.3 | Input, movement and facing | IN PROGRESS | Client prediction and server-authoritative movement; touch controls and replicated facing remain. |
| 7.1 | Monster definitions and spawn regions | IN PROGRESS | Tiled spawn properties define type, alive cap, respawn, roam radius and speed. |
| 7.2 | Monster simulation and AI | IN PROGRESS | Initial spawn, bounded roaming, aggro acquisition, chase movement, attack range/cooldown and leash bounds; pathfinding and richer behavior remain. |
| 7.3 | Monster presentation | IN PROGRESS | WebSocket snapshots and original placeholder slime with HP/name/damage feedback; state-specific animation and final art remain. |
| 8.1 | Target selection and basic attack | IN PROGRESS | Client selects nearest visible monster; server validates map, target, 58px range and 600ms cooldown. |
| 8.2 | Damage and monster defeat | IN PROGRESS | Server applies 20 damage to 60 HP monsters, publishes HP/damage feedback and respects configured respawn; loot/EXP remain. |
| 8.3 | Player damage, death and respawn | IN PROGRESS | Monster attacks deal server-authoritative damage; player has 100 HP and respawns at map spawn after 3 seconds; persistent character stats and death UX remain. |
| 9 | Skills and visual effects | NOT STARTED | Skill runtime and effect pipeline remain. |
| 10 | Multiplayer replication | IN PROGRESS | Player vitals and monster snapshots replicated; authentication, reconnect, interest management and scale testing remain. |
| 11–17 | Progression, economy, inventory, quests, QA and operations | NOT STARTED | No committed implementation evidence yet. |

## Current risks
1. Player and monster visuals are original procedural placeholders, not final art.
2. Monster navigation is direct pursuit inside a spawn-region leash; collision-aware pathfinding is not implemented.
3. Player sessions and monster state are in-memory and reset on server restart.
4. WebSocket authentication, heartbeat, reconnect, rate limiting and interest management remain.
5. Loot, EXP, inventory, quests and persistence are not implemented.
6. No local build/browser test result is claimed for these commits.

## Next implementation sequence
1. Add monster pathfinding/collision-aware pursuit and state-specific visual feedback.
2. Add loot drops and EXP reward on monster defeat.
3. Add skill definitions, cooldowns and server-authoritative skill execution.
4. Add inventory, NPC/quest and character persistence.
