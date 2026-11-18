# WBS progress report

Last updated: 2026-11-18  
Repository: `ThanhThanhV/kpah` · branch: `main`  
Baseline: `WBS_Master_KPAH_Style_2D_MMO.xlsx`

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
| Skills / Quests / persistent economy | IN PROGRESS |
| QA / Operations | IN PROGRESS |

## WBS activity tracking
| WBS ID | Activity / deliverable | Status | Evidence / remaining work |
|---|---|---|---|
| 3.1–3.4 | Client/server foundation, world transport and CI | IN PROGRESS | Phaser, Spring Boot, PostgreSQL Compose, JPA persistence and GitHub Actions; latest client/server CI result is tracked below. |
| 4.1–4.5 | Character renderer and animation | IN PROGRESS | Procedural player placeholder and SpriteSheet/Spine adapter contracts; concrete art adapters remain. |
| 5 | Map Engine | IN PROGRESS | Tiled map loading, rectangular collision and server-side grid pathfinding for monster navigation; map art remains. |
| 6.1–6.3 | Input, movement and facing | IN PROGRESS | Client prediction and server-authoritative movement; touch controls and replicated facing remain. |
| 7.1 | Monster definitions and spawn regions | IN PROGRESS | Tiled spawn properties define type, alive cap, respawn, roam radius and speed. |
| 7.2 | Monster simulation and AI | IN PROGRESS | Initial spawn, bounded roam, aggro, leash, attack range/cooldown and bounded A* pursuit using Tiled collision; pathfinding tests added. |
| 7.3 | Monster presentation | IN PROGRESS | Snapshot-driven slime and ground-drop placeholders; final sprite/Spine animations remain. |
| 8.1 | Target selection and basic attack | IN PROGRESS | Nearest monster selection; server validates target, map, 58px range and 600ms cooldown. |
| 8.2 | Damage and monster defeat | IN PROGRESS | Server applies damage and configured respawn delay; kill creates a material drop and grants 25 EXP. |
| 8.3 | Player damage, death and respawn | IN PROGRESS | Monster attacks reduce player HP; server respawns at map spawn after 3 seconds. |
| 9 | Skills and visual effects | IN PROGRESS | Two server-defined monster-target skills with authoritative range, damage and per-player cooldown; client hotkeys and cast feedback. Skill trees, mana, area targeting and authored VFX remain. |
| 10 | Multiplayer replication | IN PROGRESS | Players, monsters, HP, EXP, level, inventory and ground loot snapshots; auth/reconnect/interest management remain. |
| 11 | Character progression | IN PROGRESS | Level advances every 100 EXP; character ID, map position, HP and EXP now persist in PostgreSQL; stat growth and authenticated accounts remain. |
| 12 | Loot and inventory | IN PROGRESS | One material drop per defeated monster, proximity auto-pickup and inventory counts persisted through JPA; item catalog and equipment remain. |
| 13–17 | Economy, quests, QA and operations | NOT STARTED | No committed implementation evidence yet. |

## CI results
- Workflow: `.github/workflows/ci.yml`.
- **PASS** — commit `1844235a49aa07718d976d561984a1104dde404b`: client typecheck + production build; server Maven test + package.
- Earlier CI runs identified and led to fixes for strict TypeScript unused-property errors and Java's 10-entry `Map.of` limit.
- Commit `8a4764ca9fc0cf5fa3bbf5aee081d59a46c2fda3` adds the EXP/level/inventory HUD; its CI run is queued at the time of this report.

## Current risks
1. Character and monster visuals remain original procedural placeholders.
2. Monster navigation uses a 24px grid and collision-cell centers; finer hitbox-aware movement and path smoothing remain.
3. Character state and inventory are persisted in PostgreSQL; identity is browser-local and not protected by authentication. Reconnecting while dead schedules a fresh respawn timer.
4. WebSocket authentication, heartbeat, reconnect, rate limiting and interest management remain.
5. No persistent character database, item catalog or equipment implementation yet.

## Next implementation sequence
1. Expand skill system with resource costs, area targeting and original skill effects.
2. Add character authentication, server-issued sessions and account-to-character ownership.
3. Add NPC interactions and quest progression.
4. Replace debug character/monster/drop visuals with original art and concrete animation adapters.
5. Keep GitHub Actions green for every implementation batch.
