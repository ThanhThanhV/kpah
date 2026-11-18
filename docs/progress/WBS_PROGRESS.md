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
| 3.1–3.4 | Client/server foundation, world transport and CI | IN PROGRESS | Phaser, Spring Boot, PostgreSQL Compose, JPA persistence and GitHub Actions. |
| 4.1–4.5 | Character renderer and animation | IN PROGRESS | Procedural player placeholder and SpriteSheet/Spine adapter contracts; concrete art adapters remain. |
| 5 | Map Engine | IN PROGRESS | Tiled map loading, rectangular collision and server-side grid pathfinding; map art and transitions remain. |
| 6.1–6.3 | Input, movement and facing | IN PROGRESS | Client prediction and server-authoritative movement; touch controls and replicated facing remain. |
| 7.1–7.3 | Monster definitions, AI and presentation | IN PROGRESS | Tiled spawn definitions, bounded roam, aggro, leash, attack cooldown, A* pursuit and snapshot-driven placeholder visuals. |
| 8.1–8.3 | Combat, damage, death and respawn | IN PROGRESS | Server validates basic/skill attacks; monster drops, EXP, player damage and respawn implemented. |
| 9 | Skills and visual effects | IN PROGRESS | Two server-defined monster-target skills with authoritative range, damage and cooldown; skill resources, area targeting and authored VFX remain. |
| 10 | Multiplayer replication | IN PROGRESS | Player, monster, HP, EXP, inventory, loot and quest snapshots; authentication, heartbeat, reconnect and interest management remain. |
| 11 | Character progression | IN PROGRESS | Level every 100 EXP; character ID, map position, HP and EXP persist in PostgreSQL; stat growth and authenticated ownership remain. |
| 12 | Loot, item catalog and equipment | IN PROGRESS | Persistent item catalog, starter weapon/body gear, server-validated equip/unequip, and persisted equipment slots; stat application and inventory UI remain. |
| 13.1 | NPC interaction | IN PROGRESS | Server validates Tiled NPC identity and interaction distance; Meadow Guide dialogue uses E key. |
| 14.1 | Quest lifecycle | IN PROGRESS | Persistent Meadow Slime Hunt: start, 3 Green Slime kills, turn-in and 100 EXP reward. |
| 14.2 | Quest Journal UI | IN PROGRESS | Client journal displays objective, kill progress, ready-to-claim and claimed states; toggle with J. |
| 15–17 | Economy, QA and operations | NOT STARTED | Item catalog, equipment, trading, production observability and load testing remain. |

## Latest implementation batch
- Added the Inventory & Equipment panel (I) with item counts, equipped weapon/body slots and displayed ATK/DEF bonuses.\n- Keyboard controls: 1 equip novice sword, 2 equip cloth tunic, 3 unequip weapon, 4 unequip body. Server validates ownership and slot, then returns displaced gear to inventory.\n- Added a server-side item catalog for slime gel, novice sword and cloth tunic.\n- New characters receive one novice sword and cloth tunic in their inventory.\n- Equip/unequip requests validate item ownership and equipment slot on the server; replaced gear returns to inventory.\n- Equipment slots are persisted in PostgreSQL and replicated in world snapshots.\n- Added an in-game Quest Journal panel anchored to the HUD.
- The panel is driven by the server's persisted quest snapshot, not client-side quest state.
- Displays the correct guidance for available, active, ready-to-claim and claimed states.
- Shows kill progress and a progress bar; press J to show/hide the panel.
- Existing E interaction remains the authoritative NPC start/turn-in action.

## CI results
- Workflow: `.github/workflows/ci.yml`.
- Latest previously verified PASS: [run 44231850025](https://github.com/ThanhThanhV/kpah/actions/runs/44231850025).
- The current Quest Journal commit's CI result must be checked before marking this batch verified.

## Current risks
1. Character, monster and drop visuals remain original procedural placeholders.
2. Monster navigation uses a 24px grid; hitbox-aware movement and path smoothing remain.
3. Identity is browser-local and not protected by authentication.
4. WebSocket authentication, heartbeat, reconnect, rate limiting and interest management remain.
5. Item catalog, equipment, trading and account authentication remain.

## Next implementation sequence
1. Add item definitions and server-validated equipment slots/stats.
2. Build inventory/equipment UI and persist equipment state.
3. Expand quest definitions and NPC dialogue into data-driven catalogs.
4. Add authenticated accounts and server-issued sessions before production deployment.
5. Build the inventory/equipment panel and apply equipment bonuses to combat stats.\n6. Replace debug visuals with original art and concrete animation adapters.
7. Keep GitHub Actions green for every implementation batch.
