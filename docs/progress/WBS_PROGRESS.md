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
| 8.1–8.3 | Combat, damage, death and respawn | IN PROGRESS | Server validates basic/skill attacks; equipment ATK is added to basic/skill damage and equipment DEF mitigates monster hits (minimum 1); drops, EXP and respawn implemented. |
| 9 | Skills and visual effects | IN PROGRESS | Two server-defined monster-target skills with authoritative range, damage and cooldown; skill resources, area targeting and authored VFX remain. |
| 10 | Multiplayer replication | IN PROGRESS | Player, monster, HP, EXP, inventory, loot and quest snapshots; authentication, heartbeat, reconnect and interest management remain. |
| 11 | Character progression | IN PROGRESS | Level every 100 EXP; character ID, map position, HP and EXP persist in PostgreSQL; stat growth and authenticated ownership remain. |
| 12 | Loot, item catalog and equipment | IN PROGRESS | Catalog-driven green-slime drop table, 99-stack material limit, 1-stack equipment limit, 20-slot inventory, partial pickup with overflow left on ground, persistent inventory/equipment and HUD. |
| 13.1 | NPC interaction | IN PROGRESS | NPC name and opening dialogue are loaded from Tiled object metadata; server validates NPC identity and 100px interaction range. |
| 14.1 | Quest lifecycle | IN PROGRESS | QuestCatalog defines NPC binding, target monster, required kills, dialogue and reward; progress persists and both basic/skill kills advance matching objectives. |
| 14.2 | Quest Journal UI | IN PROGRESS | Client journal displays objective, kill progress, ready-to-claim and claimed states; toggle with J. |
| 15–17 | Economy, QA and operations | NOT STARTED | Item catalog, equipment, trading, production observability and load testing remain. |

## Latest implementation batch
- Added the Inventory & Equipment panel (I) with item counts, equipped weapon/body slots and displayed ATK/DEF bonuses.
- Keyboard controls: 1 equip novice sword, 2 equip cloth tunic, 3 unequip weapon, 4 unequip body. Server validates ownership and slot, then returns displaced gear to inventory.
- Added a server-side item catalog for slime gel, novice sword and cloth tunic.
- New characters receive one novice sword and cloth tunic in their inventory.
- Equip/unequip requests validate item ownership and equipment slot on the server; replaced gear returns to inventory.
- Equipment slots are persisted in PostgreSQL and replicated in world snapshots.
- Added an in-game Quest Journal panel anchored to the HUD.
- The panel is driven by the server's persisted quest snapshot, not client-side quest state.
- Displays the correct guidance for available, active, ready-to-claim and claimed states.
- Shows kill progress and a progress bar; press J to show/hide the panel.
- Existing E interaction remains the authoritative NPC start/turn-in action.

- Equipment bonuses are calculated server-side: +5 ATK from novice sword and +3 DEF from cloth tunic; damage reduction never lowers a hit below 1.
- Fixed invalid literal newline markers in the inventory HUD TypeScript and connected I / 1–4 keyboard controls.
- Green Slime loot is now driven by a drop table; gel quantity rolls from 1 to 2.
- Inventory accepts at most 20 distinct item stacks; gel stacks to 99 and equipment stacks to 1. Overflow remains on the ground.
- NPC dialogue is loaded from Tiled object properties; quest objectives and rewards are defined in QuestCatalog.
- Basic attacks and skills now both advance only quests matching the defeated monster type.

## CI results
- Workflow: `.github/workflows/ci.yml`.
- Equipment + HUD + combat stats: [run 44238329614 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44238329614).
- Loot/drop-table and inventory limits: [run 44238861303 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44238861303).
- Quest/NPC catalog batch: pending CI verification.

## Current risks
1. Character, monster and drop visuals remain original procedural placeholders.
2. Monster navigation uses a 24px grid; hitbox-aware movement and path smoothing remain.
3. Identity is browser-local and not protected by authentication.
4. WebSocket authentication, heartbeat, reconnect, rate limiting and interest management remain.
5. Consumables, vendors, crafting, trading and account authentication remain.

## Next implementation sequence
1. Expand quest definitions and NPC dialogue into data-driven catalogs.
2. Add authenticated accounts and server-issued sessions before production deployment.
3. Replace debug visuals with original art and concrete animation adapters.
4. Add automated gameplay/integration coverage and keep GitHub Actions green.
