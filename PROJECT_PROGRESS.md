# KPAH Web reconstruction — progress snapshot

Updated: 2026-11-09

This percentage is a task-weighted estimate against the agreed 41-item roadmap (P0–P4), not a line-of-code percentage. A task receives partial credit only for verified implementation; mock UI does not count as a completed gameplay/backend feature.

## Phase progress

| Phase | Scope | Progress | Basis |
|---|---|---:|---|
| P0 | Foundation and original resources (5 tasks) | 41% | Resource extraction, geometry hints, source-pack family taxonomy/filtering, camera/entity runtime, explicit sprite-sheet loading and animation helpers exist; original map data, tile mapping and verified character animation mappings remain unimplemented. |
| P1 | Reconstructed client/gameplay (10 tasks) | 37% | Demo server/login/character flow, profession previews, player movement, NPC interactions, selectable monsters and three connected local zones with level-gated travel, zone-specific NPC quest interactions and checkpoint respawn are implemented; original map data, real animation and server combat remain unimplemented. |
| P2 | Game systems (10 tasks) | 39% | Character/inventory/equipment, skill progression, quest progression, local world hunting, merchant purchases, guild contribution and mailbox rewards now share wallet/inventory state; local friends/party and guild systems are present, with browser-local saves for character progression, inventory/equipment, quests and learned skill configuration. All content remains client-side demo data. |
| P3 | Backend and multiplayer (10 tasks) | 2.5% | Some original packet/opcode/socket behavior is documented; no agreed or implemented backend. |
| P4 | Optimization and release (6 tasks) | 0% | Not started. |

**Overall estimate: about 25.2%** (weighted average of the 41 roadmap items).

## P0 — Foundation detail

| Task | Status | Progress |
|---|---|---:|
| 1. Extract .sh, .wp, .wps | Implemented in extractor | 100% |
| 2. Classify images/resources | PNG geometry hints plus verified source-pack family labels and family filtering; individual sprite semantics pending | 45% |
| 3. Sprite/animation engine | Manual frame inspector, Phaser texture loader, animation registration/play helpers, exact configured-sequence preview and locally saved mapping drafts; original in-game mappings not integrated | 30% |
| 4. Original tilemap engine | Generic verified-data adapter added; original map format/data not traced | 5% |
| 5. Original camera/render pipeline | Shared camera-follow rig, movement bounds and Y-depth sorting integrated; current 960 × 560 mock world cannot demonstrate scrolling | 25% |

## Latest implementation

- Added Resource Viewer for PNG assets listed in archive-manifest.json.
- Added original profession preview gallery in character creation, sourced from five .wps packs:
- Added a configurable sprite-sheet inspector: choose any decoded PNG, set rows/columns/FPS, step through frames or play a preview. Invalid grids that do not divide the image evenly are now rejected in the UI, and playback/navigation are disabled until a valid multi-frame grid is selected. This is an analysis tool, not yet the in-game animation system.
- Added a binary metadata inspector for decoded `.d` entries: selectable file, byte offsets, hexadecimal values and ASCII view. Field meanings remain intentionally unassigned pending bytecode verification.
- Extended the JAR extractor to record PNG width, height and neutral geometry hints in the manifest; the Resource Viewer now shows these values to help classify original assets without guessing their purpose.
- Hardened archive extraction against traversal paths, Windows-style separators, NUL bytes and duplicate JAR entry names.
- Added a shared asset catalog for manifest loading and validated asset URLs; Resource Viewer, profession preview and sprite inspector now use the same path rules.
- Added a shared Phaser world runtime for camera follow, bounded entity movement, Y-based depth sorting and a tile-layer adapter that requires verified tile IDs.
- Added reusable Phaser sprite-animation registration/play helpers. They require an explicit texture key, frame sequence, FPS and repeat policy, validate frame references, and deliberately do not infer KPAH animation mappings. The helpers are infrastructure only until source-verified frame sequences are connected.
- Routed pointer, keyboard and directional-pad movement through the shared runtime; the player name label now follows the moving entity.
- Made the offline server state explicit instead of displaying a false connected status.
- Added live client display settings for the player name label, world coordinates and minimap visibility; preferences persist in browser local storage, tolerate unavailable/corrupt storage, and can be reset to defaults. The panel can be closed with Escape. These are local presentation preferences, not account settings.
- Adjusted mobile safe-area spacing for notched phones and compressed the action bar on very narrow screens to reduce horizontal overflow.
- Added clickable world NPC hit areas. The village elder opens a dialogue with a route to the quest panel; the merchant opens a dialogue with a route to the shop. These are local client interactions and do not imply original NPC scripts or server transactions.
- Added a structured local world-entity catalog with four ordinary wolf spawn points and one pack leader. Monster views are interactive Phaser entities with name/level labels and health bars; selecting one updates the target HUD.
- Connected action-bar combat to the selected world monster. The player approaches distant targets before attacking; damage, monster retaliation, target defeat, experience, chance-based inventory drops and respawn timers update the shared client state. Ordinary wolf kills advance the accepted hunt quest. These stats, drops and timings are demo data only.
- Synced the mock-world coordinate readout and minimap player marker to the player's current scene position.
- Added 1–5 keyboard shortcuts for selecting action-bar slots, while ignoring editable fields and the login overlay; clarified the world touch hint to match tap-to-move behavior.
- Added client-side chat channel selection/filtering for World, Guild, Private and System; System is read-only and sent messages use the selected channel and current character name. Messages remain local to the browser.
- Added a local skill progression model with active/passive skills, point costs, level upgrades, cooldown tracking and assignable action-bar slots.
- Replaced the skills placeholder with a functional skill book: learn/upgrade skills, assign or remove active skills from four action slots, and inspect costs/cooldowns.
- Added a turn-based training encounter with a practice wolf, HP tracking, skill damage, MP costs, self-healing, enemy retaliation, combat log, defeat state and restart.
- Connected the five-slot action bar and keyboard shortcuts to the training combat loop; slot five consumes an HP potion from the shared inventory and the character HUD reflects combat HP/MP.
- Added floating combat feedback and responsive skill/training panels. Skill data, balance, target and combat formulas are demo-only; no original KPAH skill tables or server rules have been asserted.
- Replaced the disconnected character, inventory and equipment mock panels with a shared client-side state flow. Character stats and potential allocation affect derived HP/MP, equipment changes apply/remove bonuses, consumables update vitals and quantities, and the profile HUD reflects the same state. This is a local UI/gameplay slice only; persistence and server authority are not implemented.
- Hardened press-and-hold movement controls for touch and mouse: pointer capture keeps the hold gesture stable, and pointer release/cancel, lost capture, tab hiding or window blur stops repeated movement. This remains local mock-scene movement.
- Added a temporary pulsing destination marker for tap-to-move. The marker follows the clamped walk destination, disappears when the character arrives, and is cleared when directional-pad movement takes over; it is a navigation cue in the demo scene, not an original-game asset.
  - Kiếm Khách → kiem
  - Chiến Binh → daidao
  - Pháp Sư → phapsu
  - Đấu Sĩ → bua
  - Cung Thủ → cung
- Corrected the character-creation navigation callback (showStep → existing step function).
- Documented that these are static profession previews; gender/hair composition and animation mapping are not yet verified.

## P2 — Character/inventory slice

- Character profile shows level, experience, HP/MP, four attributes and available potential points.
- Potential points can be allocated to strength, stamina, agility or spirit; stamina/spirit affect derived HP/MP limits.
- Starting weapon, hat and armor occupy equipment slots and contribute attribute bonuses.
- Inventory supports category filters, equipping compatible gear, unequipping gear and using HP/MP consumables.
- The profile HUD and all three panels read the same in-memory character state. Values and item catalog are illustrative demo data only.

## P2 — Skills and training combat

- The skill book separates active and passive skills, shows levels and costs, and supports learning/upgrading with skill points.
- Four active action slots can be assigned or cleared from the skill book; the bottom action bar and 1–5 keyboard shortcuts invoke the selected slots.
- A local turn-based training encounter tracks a practice target's HP, applies skill damage and MP costs, handles self-healing and enemy retaliation, and can be restarted after defeat.
- Slot five uses an HP consumable from the same inventory state used by the character panel.
- This is a client-side vertical slice with illustrative skill names, values and formulas. It is not a verified recreation of KPAH skill data, balance, effects, PvE rules or server authority.

## P1 — Multi-zone world and travel

- Added three connected client-side zones: Làng Sói Trắng, Rừng Trúc and Hang Đá Đen. Each zone has its own palette/environment treatment, entry/exit coordinates, NPC list, monster spawn points, recommended level and travel connections.
- Added a world map panel that shows current area, connected destinations and level requirements. Travel validates the current zone connection and character level.
- Added a gate marker to each zone; activating it opens the map. Successful travel redraws the zone, updates the location HUD/minimap label, repositions the player at the destination entrance and loads that zone's NPC/monster set.
- Pending approach-to-monster timers are cancelled on zone change to prevent a queued attack from executing in a different area.
- All map layouts, names, connections, spawn points and level gates are placeholders until original map resources and collision data are traced.

## P1/P2 — World hunting gameplay slice

- Added five local monster spawn entities: four ordinary wolves and one stronger pack leader, each with its own level, HP, defense, attack damage, EXP, drop chances and respawn delay.
- Monsters are selectable in the Phaser scene. A target panel shows the selected monster's HP; the action bar approaches distant targets before applying the chosen skill.
- Monster attacks reduce player HP; defeats award experience and may add potions or upgrade stones to the shared inventory. Defeated monsters disappear and return after their configured respawn delay.
- Ordinary wolf defeats advance the existing accepted hunt quest. This is a connected offline gameplay loop, not original KPAH balance or server-authoritative combat.
- Connected the merchant NPC to a working local shop. HP potions, MP potions and upgrade stones can be purchased with Xu; the purchase validates funds and bag capacity, updates the shared wallet and inventory, and keeps HUD/inventory balances synchronized.

## P2 — Merchant and local economy slice

- Added a shop state model with a small illustrative catalog and validated quantity/purchase handling.
- Added currency spending to the shared character state. The merchant panel deducts Xu and adds bought item stacks to the same inventory used by drops, quest rewards and consumable use.
- The merchant NPC routes into the functional shop; the HUD and inventory panel reflect the shared wallet. Prices and catalog remain demo-only.

## P2 — Quest and character progression client slice

- Added a quest state model with available, active, completed and claimed states, objective progress, journal history and one-time reward claiming.
- The village elder interaction advances the accepted conversation objective; defeating the training wolf advances the active monster-hunt objective.
- Quest rewards grant experience, currency and inventory items through the shared character state. Experience thresholds can increase character level and award potential points.
- The quest journal supports status filters, objective progress bars, reward previews, claim actions and a pending-reward navigation indicator.
- Added wallet synchronization to the HUD. The quest catalog, NPC objective, training-wolf target and reward values are illustrative local data, not verified original KPAH content or server transactions.

## Validation limitations

- Ran JavaScript syntax parsing and state-level smoke checks for quest acceptance, NPC objective progress, monster-kill progress, reward claiming, experience/currency grants and inventory item rewards. These checks do not replace browser interaction testing or a production build. The world-entity/combat, multi-zone travel, ground-loot and social integrations have not yet been browser-tested or run through a production build.

- Ran JavaScript syntax parsing for `main.js`, `skill-combat.js` and `character-state.js`, plus state-level smoke checks for locked-skill rejection, learning, slot assignment, damage, MP spending, enemy retaliation, cooldown blocking and potion recovery. These checks do not replace a browser/UI test or a full Vite production build.

GitHub file updates were confirmed on main. The current environment did not run npm install, npm run build, or a browser session, so runtime/build success is not claimed. The new tile-layer adapter is infrastructure only; no original map data or tile-ID mapping has been supplied to it. The original extracted asset directory is generated locally from KPAH_278.jar and is not committed; run npm run extract:assets before testing previews.


## P1/P2 — Ground loot and social client slice

- Monster drops now spawn as collectible world entities at the defeated monster position instead of being granted directly to inventory.
- Ground items can be selected by pointer or collected with the E key within pickup range; items expire after a configured local lifetime.
- Inventory capacity is checked at pickup time. If the bag is full, the item remains on the ground; changing zones clears that zone's transient drops.
- Friends panel supports adding a local friend and inviting online demo friends. Party panel supports a five-member local party, simulated invitations, accept/decline, member removal and leaving the party.
- These are client-only simulations. No server-backed friend directory, online status, party invitation, synchronized combat or persistence exists.


## P1/P2 — NPC exploration, guild and mailbox client slice

- Added separate quest objectives for speaking with the Bamboo Forest hunter and Black Stone Cave guardian. Interactions now record their respective objective progress and refresh the quest badge.
- Added a local guild catalog and membership state: browse demo guilds, submit a join request (automatically accepted in this offline prototype), inspect guild/member contribution summaries, contribute 500/2,000 Xu and leave a guild.
- Guild contributions spend currency from the shared character wallet; failed contributions restore the funds if the guild action cannot be completed.
- Added a mailbox with sample system/NPC messages, read/unread state, an unread counter on the mail shortcut and a claimable sample currency attachment that updates the shared wallet.
- Guild, NPC dialogue, quest content, mail and membership are client-side illustrative data. No server-backed guild service, remote mail, chat delivery, or multiplayer state exists.


## P1/P2 — Guild, mailbox, NPC exploration and chat completion

- Added zone-specific talk objectives for the Bamboo Forest hunter and Black Stone Cave guardian; NPC interaction records progress and refreshes quest notifications.
- Added a local guild catalog, membership, contribution wallet deductions, contribution history/count and leave-guild action. Demo applications are auto-accepted to keep the offline prototype interactive.
- Added a mailbox with sample system/NPC messages, read/unread tracking, an unread shortcut badge and claimable sample currency attachments.
- Added a private-chat recipient selector and a guild-chat membership gate. World, guild, private and system channel visibility remains client-local; messages are not delivered to another player.
- These features use illustrative client data. No guild server, mail service, online friend presence, private message delivery or authoritative quest service exists.


## P2 — Local save and resume

- Added a versioned local save envelope with guarded storage access, JSON/schema-version checks and safe fallback when browser storage is unavailable, corrupt or full.
- Character identity, progression, base attributes, vitals, wallet, inventory and equipment are restored through catalog-validated state hydration. Unknown item IDs and invalid equipment-slot combinations are discarded.
- Quest status/progress and learned skill levels/loadout are restored against the known local catalogs. Skill cooldowns, practice-target HP and turn state are deliberately reset so a saved browser session cannot resume a stale combat encounter.
- Character HUD, quest badge and action-bar refresh points write the shared save snapshot after state changes.
- This remains local browser persistence only. It does not save login credentials, sync across devices, or provide server-authoritative/account persistence.


## P1/P2 — Knockout and checkpoint recovery

- Added a knockout state when world-combat retaliation reduces character HP to zero. The player cannot continue movement or action-bar attacks while knocked out.
- Added an explicit respawn action that restores HP and part of MP, returns the character to the Làng Sói Trắng checkpoint, reloads its local world entities and recenters the camera.
- Death penalties, revive items, timers and original server rules remain unverified; this is an offline reconstruction rule.


- Follow-up static validation found and repaired a malformed nested-template renderer in the party panel. The complete `src/main.js` entrypoint now passes the available V8 syntax compilation check after import declarations are removed for parsing.


- Mobile audit tightened game-window sizing against device safe areas, enabled contained momentum scrolling for long panels, and reduced modal chrome on short phone screens. This is a CSS-level audit; no physical-device/browser verification has been run.


## P2 — Prerequisite-driven quest progression

- Added a five-step local story chain connecting the village, forest and cave NPCs with the wolf patrol.
- Quest acceptance checks the previous quest's claimed state; locked quests remain visible with an explicit unlock requirement instead of appearing immediately actionable.
- Updated the final preparation objective to return to the village elder after the cave encounter.
- Ground-item pickup is also rejected while the character is knocked out, matching the existing movement/action lock.


- The five-step quest chain was exercised end-to-end in a state-level smoke check: prerequisite rejection, unlock after claiming the prior reward, objective completion and reward claim all passed. Main client and quest modules pass the available JavaScript syntax check. No browser/Vite build was run.


## P2 — Persist local social and mailbox panels

- Extended the versioned local save to include the simulated friends/party roster and invitations, guild membership/contribution, and mailbox read/claimed flags.
- Added catalog-validated restore methods; unknown guilds/mail IDs and unrecognized friend IDs are discarded, while user-added local friends are restricted to the local friend ID namespace and bounded names.
- Rendering these panels snapshots their state so successful local actions are retained on the next browser visit.
- No credentials, server session, online presence, real chat delivery or cross-device state is saved.


- State-level smoke checks restored a locally added friend, pending/accepted party roster, guild membership and contribution, and mailbox read/claimed flags. Party acceptance now checks capacity and duplicate membership before changing an invitation to accepted; the player leader cannot be removed from their own party.


## P1/P2 — Combat target feedback refinement

- Floating damage is now anchored to the selected monster's world position and converted through the active Phaser camera/canvas viewport, rather than appearing at the center of the game frame.
- Monster retaliation and player healing feedback appear at the player position with distinct colors; target damage remains attached to the monster.
- The selected monster now has a visible ground ring, synchronized with selection, defeat and respawn state.
- The entrypoint passed the available V8 syntax compilation check after import declarations were removed. This is not a browser interaction test or production build; camera alignment still needs visual verification at runtime.

## P0 — Source-pack asset taxonomy and runtime animation loading

- The extractor now adds a resource-family label to decoded entries using the verified source archive name: arrow, box, effect, font, general graphics, main UI, NPC, public skills and profession previews.
- The Resource Viewer can filter by source family as well as archive. Each image shows the family label alongside its original pack and geometry hint.
- Family labels are explicitly marked as source-pack classification. They do not claim that an individual PNG is a character, skill, effect frame or animation sequence.
- Added an explicit Phaser runtime sprite-sheet loader that requires a selected asset URL and measured frame width/height. Existing animation registration/play helpers can then consume a caller-supplied verified frame list, FPS and repeat policy.
- No original character/monster animation is enabled yet: source frame ordering, frame dimensions and timing still need to be traced per asset before connecting it to in-world entities.
- The extractor and viewer changes are committed, but the original JAR is not available in this execution environment to regenerate and inspect the resulting manifest. The new taxonomy will appear after running `npm run extract:assets` with `KPAH_278.jar`.

## P0 — Sprite animation mapping workbench

- Extended Sprite Lab with an animation key, frame range, optional explicit comma-separated frame order, FPS and repeat policy.
- The tool validates every frame against the selected sheet grid and exports a JSON mapping with original pack/path, measured image dimensions, absolute asset URL, texture loading definition and Phaser animation registration definition.
- The exported `load` and `animation` objects match the runtime helpers' input contracts; the output can be copied from the UI for review and later committed as source-verified mapping data.
- Added source-family and original-pack filters inside Sprite Lab so large asset sets can be narrowed before selecting a candidate sheet.
- Sprite Lab playback now follows the exact configured frame range/order, FPS and one-shot/loop policy instead of always cycling the whole sheet. Mapping JSON includes measured grid metadata.
- Added a browser-local mapping draft catalog with save, reopen, delete and guarded storage access. Drafts remain on the current browser and are not synchronized or treated as source-verified game data.
- The workbench is an authoring aid, not an automatic reverse-engineering result. No frame sequence has been declared to be a real KPAH walk/attack/death animation without tracing its source.
- Runtime helper smoke checks passed for texture loading, animation registration, playback and rejection of a non-HTTP URL. Sprite Lab and runtime modules pass syntax compilation. No browser clipboard/UI test or Vite build was run.
