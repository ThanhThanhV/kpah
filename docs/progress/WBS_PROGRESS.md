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
| 8.1–8.3 | Combat, damage, death and respawn | IN PROGRESS | Server validates basic/skill attacks; class and equipment ATK bonuses affect damage, class/equipment DEF mitigates monster hits (minimum 1), class-specific HP controls health and respawn. |
| 9 | Skills and visual effects | IN PROGRESS | Two server-defined monster-target skills with authoritative range, damage and cooldown; skill resources, area targeting and authored VFX remain. |
| 10 | Multiplayer replication | IN PROGRESS | Player, monster, HP, EXP, inventory, loot and quest snapshots; account session is required at WebSocket connect; heartbeat, reconnect and interest management remain. |
| 11 | Character progression | IN PROGRESS | Level every 100 EXP; character/account ownership and up to 3 characters per account; Warrior/Mage/Archer base HP, ATK and DEF are server-authoritative. Class growth and skill unlocks remain. |
| 12 | Loot, item catalog and equipment | IN PROGRESS | Catalog-driven green-slime drop table, 99-stack material limit, 1-stack equipment limit, 20-slot inventory, partial pickup with overflow left on ground, persistent inventory/equipment and HUD. |
| 13.1 | NPC interaction | IN PROGRESS | NPC name and opening dialogue are loaded from Tiled object metadata; server validates NPC identity and 100px interaction range. |
| 14.1 | Quest lifecycle | IN PROGRESS | QuestCatalog defines NPC binding, target monster, required kills, dialogue and reward; progress persists and both basic/skill kills advance matching objectives. |
| 14.2 | Quest Journal UI | IN PROGRESS | Client journal displays objective, kill progress, ready-to-claim and claimed states; toggle with J. |
| 15–17 | Economy, QA and operations | IN PROGRESS | Account register/login/logout, PBKDF2 password hashes, opaque 30-day sessions and WebSocket ownership checks added; vendors, crafting, trading, production observability and load testing remain. |

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
- Added account registration/login/logout and session restoration endpoints. Passwords use PBKDF2-HMAC-SHA256 with random salts; raw tokens are never stored in the database.
- Each account is provisioned one starter character. Character rows now carry account_id, and WebSocket connect rejects invalid sessions or non-owned character IDs.
- Added browser sign-in/register screen, persisted session restore and sign-out; the world only starts after authentication succeeds.
- Added per-IP login and registration throttles (8 login attempts / 15 minutes; 4 registrations / hour) with bounded in-memory tracking.
- Moved the WebSocket credential out of the URL into a custom `Sec-WebSocket-Protocol` handshake value.
- Added logout-all to revoke every active session belonging to the authenticated account.
- Added account-owned character metadata, a maximum of three characters per account, character list/create/select endpoints and a selection screen.
- Added server-side class definitions: Warrior (120 HP, +3 ATK, +2 DEF), Mage (90 HP, +8 ATK), Archer (100 HP, +5 ATK, +1 DEF). Class stats apply to basic/skill damage, monster damage mitigation and respawn health.
- Player snapshots now include character name/class; remote player nameplates use the selected character name.

## CI results
- Workflow: `.github/workflows/ci.yml`.
- Equipment + HUD + combat stats: [run 44238329614 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44238329614).
- Loot/drop-table and inventory limits: [run 44238861303 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44238861303).
- Quest/NPC catalog batch: [run 44239442720 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44239442720).
- Account authentication batch: [run 44240885387 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44240885387).
- Auth hardening batch: [run 44241375845 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44241375845).
- Multi-character selection batch: [run 44242288598 PASS](https://github.com/ThanhThanhV/kpah/actions/runs/44242288598).

## Current risks
1. Character, monster and drop visuals remain original procedural placeholders.
2. Monster navigation uses a 24px grid; hitbox-aware movement and path smoothing remain.
3. Session token is sent as a custom WebSocket subprotocol; production handshake/header logging must redact credentials, and public deployments must use WSS.
4. Browser stores the opaque session token in localStorage; XSS hardening and CSRF/rate-limit policies need production review.
5. Heartbeat, reconnect, rate limiting, multi-character selection, consumables, vendors, crafting and trading remain.

## Next implementation sequence
1. Add refresh-token rotation and secure cookie strategy for browser sessions.
2. Implement class-specific skill kits, resource costs and progression growth.
3. Replace debug visuals with original art and concrete animation adapters.
4. Expand quest/NPC catalogs, gameplay integration coverage, observability and load testing.
