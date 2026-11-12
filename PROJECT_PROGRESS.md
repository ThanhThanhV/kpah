# KPAH Web reconstruction — progress snapshot

> **WBS chuẩn:** [KPAH_Web_WBS_Theo_doi_tien_do_va_danh_gia.md](./KPAH_Web_WBS_Theo_doi_tien_do_va_danh_gia.md) là nguồn theo dõi chính thức từ 10/11/2026. Phần trăm P0–P4 dưới đây là snapshot theo roadmap 41 mục cũ, chỉ giữ để tham khảo lịch sử; không quy đổi trực tiếp sang 118 task của WBS mới. Mọi cập nhật tiếp theo phải ghi theo task ID và tiêu chí nghiệm thu trong WBS.

Updated: 2026-11-10

This percentage is a task-weighted estimate against the agreed 41-item roadmap (P0–P4), not a line-of-code percentage. A task receives partial credit only for verified implementation; mock UI does not count as a completed gameplay/backend feature.

## Phase progress

| Phase | Scope | Progress | Basis |
|---|---|---:|---|
| P0 | Foundation and original resources (5 tasks) | 41% | Resource extraction, geometry hints, source-pack family taxonomy/filtering, camera/entity runtime, explicit sprite-sheet loading and animation helpers exist; original map data, tile mapping and verified character animation mappings remain unimplemented. |
| P1 | Reconstructed client/gameplay (10 tasks) | 40% | Demo server/login/character flow, profession previews, player movement, NPC interactions, selectable monsters and three connected local zones with level-gated travel, zone-specific NPC quest interactions and checkpoint respawn are implemented; original map data, real animation and server combat remain unimplemented. |
| P2 | Game systems (10 tasks) | 39.5% | Character/inventory/equipment, skill progression, quest progression, local world hunting, merchant purchases, guild contribution and mailbox rewards now share wallet/inventory state; local friends/party and guild systems are present, with browser-local saves for character progression, inventory/equipment, quests and learned skill configuration. All content remains client-side demo data. |
| P3 | Backend and multiplayer (10 tasks) | 2.5% | Some original packet/opcode/socket behavior is documented; no agreed or implemented backend. |
| P4 | Optimization and release (6 tasks) | 1.5% | Initial mobile viewport compatibility only; performance, reconnect, security and deployment work remain pending. |

**Overall estimate: about 25.8%** (weighted average of the 41 roadmap items).

- Mobile viewport compatibility: synchronize shell and modal height to `visualViewport` (falling back to `innerHeight`) so the visible layout can adapt when the virtual keyboard opens; chat inputs use 16px text to avoid iOS focus zoom. Real-device testing remains pending.

## P0 — Foundation detail

| Task | Status | Progress |
|---|---|---:|
| 1. Extract .sh, .wp, .wps | Implemented in extractor | 100% |
| 2. Classify images/resources | PNG geometry hints plus verified source-pack family labels and family filtering; individual sprite semantics pending | 45% |
| 3. Sprite/animation engine | Manual frame inspector, Phaser texture loader, animation registration/play helpers, exact configured-sequence preview and locally saved mapping drafts; original in-game mappings not integrated | 30% |
| 4. Original tilemap engine | Generic verified-data adapter added; original map format/data not traced | 5% |
| 5. Original camera/render pipeline | Shared camera-follow rig, movement bounds and Y-depth sorting integrated; current 960 × 560 mock world cannot demonstrate scrolling | 25% |

## Latest implementation

- B15 replay-harness slice: added a loopback-only TCP mock that sends the unencrypted server `-40` key before the client flushes queued encrypted `-40/-1/1` packets, maintains the XOR cursor, and redacts login payloads. Added a socketpair self-test to CI. This is handshake/login capture only; the original JAR has not yet been run in an emulator, and auth/world responses plus a WebSocket↔TCP bridge remain open.

- B14 protocol codegen slice: added canonical `protocol/protocol.yaml` with 110 C2S and 142 S2C direction-specific entries; generated Java/JS command enums, primitive readers/writers and typed payload codecs for 13 verified schemas. 239 payloads remain opaque by design. Added deterministic generation check, JS payload/modified-UTF test and Java 21 compile/smoke test to CI. Transport frame/XOR codec is now generated for Java and JavaScript from the transport section of protocol.yaml (handshake, independent cursor, C2S, S2C short/long); synthetic vectors and Java 21 smoke tests are in CI. Full nested/conditional request-response models and production capture remain open.

- B10 R4 feature assessment: source-backed evidence now covers equipment refining actions (C2S -25), pet equipment/fusion UI, sacred-tree farming (C2S/S2C -66 and C2S 109), artifact panel (S2C -67), ranking (-19, already tracked in B9) and NPC boat-ticket dialogue. No adequate client evidence was found for horse/mount, arena or auction; `-62/-63` are the lucky-box mini-game, not arena. Detailed matrix and proposed B10.1–B10.8 split: `docs/reverse-engineering/advanced-features-r4.md`.

- B16 initialization data slice: documented global config opcode 1 (skill metadata, profession lookup tables, tile blobs and character-part data), selected-character snapshot 3, shop/catalog 15 and inventory/skill/auxiliary state 16, including runtime destinations and optional sections. Exact business meaning of several lookup arrays, full part/tile binary schemas and server packet order remain open.

- B13 client formula slice: documented actor speed step (`cT`, default 3) and distance-based increments, sequential X-then-Y movement, click-to-move tile waypoint/collision checks, 250 ms C2S coordinate sends, and floating damage/MISS text drift/30-tick expiry. Jump physics and damage/crit formula remain unverified.

- B12 client lifecycle slice: documented MIDlet/resource bootstrap, server selection, login form, socket opening, XOR handshake, roster/create/select, loading/map transition, world screen, connection failure, 20-second connect timeout, reader disconnect and reset callbacks. Confirmed `km.q` owns the active screen while `km.s` is the persistent world state. No auto-reconnect loop was found; opcode 1/3 initialization and server session semantics remain open.

- B11 C2S coverage increment: `tools/extract_protocol_catalog.py` now scans every CFR `.java` file for constant or dynamic `jy.b(...)` and direct `new acu(...)` packet builders, recording source file/line, opcode expression, payload write order and send-call count. It distinguishes factory/helper declarations that do not enqueue a packet. CI run and wrapper-caller linking are pending.

- B9 social protocol slice: documented chat C2S/S2C opcodes -5/-18, friend request/accept/reject 101, friend removal -6, friend roster 103, generic invitation -11, and guild profile/kick/announcement/chat/ranking/reward -10/-12/-13/-17/-18/-19/-20. Traced `sj`, `mj`, `ka`, `jy` and callbacks `mn/mo/kh/ki`; friend roster field semantics and full party/guild lifecycle remain open.

- B8 NPC/menu/quest slice: documented entity speech opcode 27, help/information -24, world message -26, quest collection -64, quest detail/objectives -30/-31 and generic accept/reject prompt -32. Traced quest model `cy`, menu `tb`, world state `mj` and prompt callbacks `kk/kc`. NPC action trees and reward schema remain open.

- B7 inventory/equipment/trade slice: documented material/recipe list opcode 73, equipment list 76, trade/market panel 94, market listing request/response 92 and item update/remove 95. Traced item models `bo`, `be`, `de` and client collections `xg.E`, `ca.N/O/P`. NPC shop purchase, use-item, equip/unequip, upgrade/refine and warehouse flows remain open.

- B6 combat/skill protocol slice: documented C2S skill cast opcode 51 and S2C damage events 6/9/10/83/106 plus timed effect/buff events -74/-71 and extended effect -73. Traced target HP mutation, floating damage/MISS, attacker animation callbacks and entity effect-list lifecycle. Damage formula, crit/defense rules, complete skill-code mapping and buff stacking remain unverified.

- B5 world/map protocol slice: documented C2S movement opcode 4 and map request opcode 12; S2C entity spawn/update opcode 4, player snapshot opcode 5, entity snapshot opcode 7, despawn opcode 8 and map transition opcode 12. Traced `ca extends z`, `z`, `cd`, `ce`, `mj`, `hf`, including the factory mapping from entity kind/template to runtime classes. Ground drops and full movement interpolation remain open.

- B4 auth/character protocol slice: added `docs/reverse-engineering/protocol-auth-character.md` with source-backed server-list HTTP/RMS format, login opcode 1 field order, pre-login opcode -1, registration opcode 39, character select/delete/restore subcommands on opcode 13, create-character opcode 14, roster response opcode 13 and registration response opcode 39. Caller methods `rq`, `lk`, `ln`, `lp`, `lv` were traced into `jy` writers and `ka` handlers. Response opcode 1/3 and gameplay payloads remain to be decoded.

- B4 protocol extraction increment: `tools/extract_protocol_catalog.py` reads CFR `jy.java` and `ka.java` to produce a source-backed C2S writer/payload-field catalog and S2C dispatch/read catalog. First scan found 125 opcode declarations, 124 with actual send calls, 106 unique enqueued C2S opcodes, and 149 S2C cases (142 unique opcodes). One declaration (opcode 11) creates/closes a packet but never enqueues it, so it is explicitly excluded from sent-opcode counts. Business semantics remain to be annotated.

- B3 protocol increment: CFR source confirmed the transport framing and handshake. Added a reference codec with synthetic test vectors for cumulative-XOR key derivation, C2S short frames, S2C short frames, encrypted 0x80 long-length frames and independent cursor wrap. Added `npm run test:protocol` and a GitHub Actions step; CI result is pending. No production server capture has been used.

- Original JAR scan completed in GitHub Actions run `80b1df5`: 1,024 archive entries; all 782 class files parsed with zero errors; 3,094 methods, 19,878 call edges, 38,448 field references and 3,968 type references. All 198 decoded packed resources passed SHA-256 verification. The role mapper produced 16 known anchors, 129 role hypotheses and 637 unclassified classes. Added `docs/reverse-engineering/class-role-map.md` with evidence-backed anchors and a prioritized candidate review queue. This does not mean all 129 hypotheses are confirmed.

- Reverse-engineering CI extension: added a separate `analyze-original-jar` job. It extracts the committed `KPAH_278.jar`, isolates class files outside `public/`, verifies decoded asset hashes, analyzes all extracted classes, generates evidence-ranked class-role reports, and uploads the JSON/Markdown reports plus manifest as a 14-day artifact. The new job's first run is pending; no original-JAR scan result is claimed yet.

- CI refinement: validation workflow now groups runs by workflow and ref and cancels superseded runs, preventing multiple long builds from piling up after consecutive main commits.

- WBS A3/C9 increment: added `.github/workflows/validate.yml` to run the Vite production build, Python compileall, a Java fixture bytecode-analysis/class-role smoke test, and synthetic asset-manifest integrity/tamper checks on pushes to main, pull requests and manual dispatch. Workflow is committed but its GitHub Actions run has not yet been observed; this is validation CI, not staging deployment or full original-JAR extraction.

- B1/B2 dependency evidence increment: the bytecode analyzer now exports field-reference edges (`getfield`/`putfield`/static variants) and type-reference edges (class operands), in addition to method call edges. The class-role review tool consumes these graphs and includes field-owner/type-reference summaries while excluding external JDK packages from the internal class map. This improves the review evidence but does not yet establish the semantic names of unverified classes.

- B2 refinement: role-candidate output now includes superclass/interfaces, field summaries, filtered string evidence samples and ranked caller/callee class references. Package-qualified class names are matched using the longest known class prefix so graph ownership is not truncated at the package separator.

- WBS B2 increment: added `tools/suggest_class_roles.py` and `npm run suggest:class-roles`. It ranks nine semantic role families from constant strings, inheritance/interfaces, member signatures and call-graph references; preserves 16 previously verified class anchors and outputs a JSON/Markdown review queue. It does not rename classes. The real role map remains pending until the analyzer is run against original JAR class files.

- WBS C9 follow-up: added `tools/verify_asset_manifest.py` and `npm run verify:assets` to verify decoded-file SHA-256 values, recompute `assetVersion`, and optionally compare the source JAR hash. Synthetic-manifest smoke test passed for both intact and tampered assets. Class bytecode extraction is isolated under `tools/reports/class-files/`, outside `public/`.

- WBS B1 increment: added a Python Java class-file indexer that reads constant pools, class/method metadata, disassembles common JVM bytecode including switch/wide instructions, counts opcodes and builds method call edges. Supports string and opcode filtering. `py_compile`, a `javac`-generated synthetic class smoke test and `invokevirtual` filter passed; class files are extracted to `tools/reports/class-files/` rather than `public/`; the original 782-class JAR scan is pending because the JAR is not mounted in this execution environment.

- WBS C9 increment: the extractor now records SHA-256 for the source JAR, each archive entry and each decoded packed resource; it derives a content fingerprint (`assetVersion`) and the shared browser asset loader appends it to asset URLs for cache-busting. The extractor has not yet been run against the original JAR in this execution environment.

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

## P1 — Character selection roster

- Replaced the placeholder profession picker on the character-selection screen with a three-slot character roster, matching the original client's documented maximum of three character previews.
- Characters created in the offline client are saved locally in the browser; the roster supports selecting an existing character, creating up to three entries, and deleting an entry after confirmation.
- The selected character's name, profession, gender and hair selection are passed through the existing client events when entering the world. No account identity, server-side character list, or character restoration service is implied.
- The roster validates stored records, ignores malformed entries, escapes user-provided text before rendering, and handles unavailable/corrupt local storage without crashing.
- This is a client-side reconstruction of the selection flow; exact original portrait composition and server character operations remain pending.

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

## Latest client increment — saved location in character roster

- Character cards now show the saved zone and approximate X/Y coordinates alongside level, EXP, Xu, inventory occupancy and last-save time.
- The roster only recognizes the three zone IDs currently defined in the demo map. Unknown/missing zones and legacy saves without coordinates display safe fallback labels; malformed coordinate values are not rendered.
- This completes the visible resume loop: the roster previews where a character was last saved, and selecting that character restores the saved zone and obstacle-checked position.
- JavaScript syntax and targeted static checks passed. Browser/mobile interaction and production build remain untested.

## Latest client increment — exact per-character world-position resume

- Per-character saves now include the player's world X/Y coordinates as well as the current zone.
- Switching characters and re-entering the page restores the saved location; old saves without coordinates remain compatible and fall back to the zone entry point.
- Restored coordinates are passed through the existing obstacle-aware movement resolver after the destination zone is rebuilt, preventing a stale save from placing the player inside demo scenery. The camera and name label are repositioned with the player.
- The current location is flushed on page hide and when the tab becomes hidden, in addition to the existing saves on zone travel, respawn, logout and gameplay state updates.
- Syntax and targeted static checks passed. Browser lifecycle, mobile interaction and production build have not been run.

## Latest client increment — per-character world location resume

- The active zone is now stored in the same versioned save as that character's inventory, quests and skills.
- Switching characters restores their saved zone independently; characters without a zone save start in Làng Sói Trắng. The scene places the player at that zone's entry point and rebuilds the zone entities, NPCs and drops.
- Successful zone travel and checkpoint respawn save the resulting location. This is browser-local resume only; player coordinates and monster state are not yet persisted, and the map/zone definitions remain demo data.
- JavaScript syntax and targeted source checks passed, including zone save/restore, scene restoration, entry-point placement and save-on-travel/respawn. No browser run or production build was performed.

## Latest client increment — character roster save previews

- The character-selection screen now reads each roster entry's own versioned save key and displays level, current/next-level EXP, Xu, occupied inventory slots and last-save time.
- New characters are clearly distinguished from characters with an existing save. Malformed JSON, unsupported save versions, missing state and invalid timestamps fall back safely to the no-save presentation.
- This reads only the browser-local save for that character; it does not imply server-side account data or remote character status. The UI remains capped at the original three-character roster.
- JavaScript syntax and targeted static checks passed. Browser/mobile interaction and Vite production build have not been run.

## Latest client increment — equipment and inventory presentation

- Equipment slots now resolve equipped item names and show attribute bonuses where available. The equipment panel displays current HP/MP and all four effective attributes, including equipment bonuses.
- Inventory entries show concise item effects: attribute bonuses for gear, HP/MP restoration values for consumables, and usage categories for materials and quest items.
- Existing equip, unequip and potion actions remain connected to shared character state and HUD updates. Item definitions and values remain demo data, not extracted original KPAH definitions.
- Mobile styles were added for equipment stats and item detail text. JavaScript syntax and targeted source checks passed; browser interaction and production build remain untested.

## Latest client increment — character deletion and logout lifecycle

- Logout now saves the active character before returning to the login overlay and clears the active in-memory profile pointer.
- Deleting a local roster entry emits a validated character-deleted event; the matching per-character browser save key is cleared so deleted profiles do not leave stale progression behind.
- This is local browser data lifecycle handling only; it does not issue a delete request to the original game server.

## Latest client increment — merchant purchase quantities

- Merchant rows now allow selecting a purchase quantity from 1 to 99 with increment/decrement controls and a live line total. The purchase handler clamps the value again before calling the existing shop transaction, so direct input edits cannot bypass the limit.
- Each successful transaction still uses the existing wallet/inventory capacity checks and updates the character HUD. This remains a demo catalog and browser-local transaction, not an original server shop implementation.

## Latest client increment — character-specific saves

- Split browser save data by stable local character ID instead of sharing one progression record across every roster entry. Each character now has an independent save key for stats, level, wallet, inventory/equipment, quests, skill progression/loadout, social state, guild and mailbox.
- Selecting a character resets in-memory gameplay models to their defaults before hydrating that character's save, preventing the previous character's state from leaking into the next selection. HUD, action bar, quest badge and mail badge refresh after activation.
- The former single-profile save is migrated only when its saved character name and profession match the selected roster entry; otherwise it is not assigned to another character. Saves are written only after a valid roster character ID is activated.
- All persistence remains browser-local and is not account/server persistence.

## Latest client increment — character roster\n\n- Rebuilt the post-login character-selection step as a maximum-three-character roster instead of the previous five-profession shortcut. Existing local characters can be selected, new characters can be created while a slot is free, and entries can be deleted with confirmation.\n- Character roster data is isolated under its own versioned localStorage key and does not store login credentials. It remains browser-local demo data and is not connected to an account or server.\n- Verified the committed source contains the three-slot limit, roster rendering, selection/deletion handlers, and the existing character-selected event. Full browser interaction and mobile-device checks have not been run.\n\n## Validation limitations

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

## Interactive live world map panel

- Replaced the map panel's decorative-only overview with a schematic map using the same 960×560 world coordinate system as the Phaser scene.
- Shows the player's live position, current-zone NPCs, and currently alive monsters. Elite monsters and the selected target have separate visual states.
- Tapping an NPC pin invokes the existing NPC interaction flow; tapping a monster pin selects that monster as the combat target and refreshes the map selection state.
- The map panel still uses the current demo zone definitions; this is not original KPAH map data or a reconstructed original map texture.
- Validation: JavaScript syntax passed; isolated renderer smoke test confirmed escaped NPC labels, NPC/monster/player pins, target state and zone travel controls. No browser interaction or Vite build was run.

## Live world-map marker synchronization

- The player marker now follows movement while the map panel remains open, synchronized against the same Phaser world coordinates.
- Alive monster markers update their position and selected state; defeated monsters are hidden and the live monster count is refreshed.
- When a monster respawns, the map panel rebuilds its marker list so the new living monster can be selected.
- Marker DOM updates are throttled to 100 ms rather than rebuilt every render frame.
- Validation: main module JavaScript syntax passed; static checks verified player/monster marker hooks, throttling, defeated-monster visibility, selected state, live count and respawn refresh. No browser/device test or Vite build was run.


## P1 — World movement collision

- Added collision geometry for the procedural village houses/trees, forest trees and cave rock formations at the same time those scene objects are drawn.
- Pointer movement, directional controls and combat approach movement now sample the requested path and stop at the last walkable point before a solid obstacle. The player can no longer walk straight through those demo structures.
- Collision shapes are derived from the current procedural mock scenery only. Original KPAH collision masks, map boundaries and tile collision semantics remain unverified and are not claimed.
- Validation in this increment: source-level checks confirmed all three zone obstacle-registration branches, path sampling, radius-expanded circle/rectangle tests, and use of the resolved destination by the shared movement entrypoint. No browser/device test or Vite production build was run.


- Follow-up movement refinement: when the direct sampled path is blocked, the resolver evaluates horizontal-first and vertical-first alternatives and selects the route with the greatest valid progress. This improves wall sliding around the current demo obstacles without weakening collision checks. Source/static checks confirm both alternate routes use the same collision-tested trace function; no browser/device test or Vite build was run.


## P1 — Nearby monster pressure and knockout integration

- Living monsters now periodically attack when the player enters their local engagement radius. Each monster has an independent attack cooldown; the player receives damage through the shared character state, so HP bars, local save snapshots and the existing knockout overlay remain synchronized.
- Monster attacks stop when the player is knocked out. The existing checkpoint respawn flow restores the character in the safe village and rebuilds the active zone state.
- Attack range, cadence and damage reuse the current demo monster definitions and remain provisional client-side values. This does not claim original KPAH aggro, attack animation, targeting or damage formulas.
- Validation: the updated src/main.js passed a V8 syntax compilation check after removing static imports. No browser interaction, timing test or Vite production build was run.


## P1 — Monster aggro and pursuit

- Living demo monsters now acquire the player inside a 230-world-unit radius and move toward the player at a bounded, time-step-based speed. Pack leaders use a slightly faster provisional speed.
- Monsters stop at close range and use their individual damage values on a per-monster cooldown. Their updated coordinates are written to the shared world-entity state, so the scene views, world-map pins and combat target positions use the same location.
- Monster movement respects the current demo obstacle shapes by rejecting a blocked movement step. It does not yet implement pathfinding around obstacles, original monster AI states, attack animations or server-authoritative combat.
- Validation: main.js and world-entities.js passed V8 syntax compilation after removing static imports and export declarations. No browser timing/interaction test or Vite production build was run.


## P1 — Monster leash and spawn recovery

- Each local monster now retains its spawn/home coordinates and a persisted local AI state (`idle`, `chasing`, `attacking`, `returning`) in the shared world-entity model.
- Monsters acquire the player within the existing demo aggro radius, stop at attack distance, and return toward their original spawn when the player breaks the leash. Returning monsters move more slowly; their respawn also restores the original spawn position and clears the AI state.
- Pursuit/return steps now try direct and axis-aligned alternatives against the current demo obstacle geometry instead of freezing at the first blocked diagonal step. This is still lightweight local steering, not navmesh pathfinding or original KPAH AI.
- Validation: V8 syntax compilation passed for `src/main.js` and `src/world-entities.js` after stripping module imports/exports. GitHub writes were verified on `main`; no browser timing test or Vite production build was run.


## P1 — Monster attack telegraph and AI feedback

- Monster entities now show a lightweight state cue while idle, chasing, attacking or returning. A selected target ring remains separate from the attack warning.
- Close-range attacks now have a 450 ms warning wind-up with a pulsing red ring before damage is applied. Leaving attack range cancels the pending strike, giving the player a short reaction window to move away.
- Attack cooldown and pending wind-up timers reset when changing zones and when a monster respawns, preventing stale timers from leaking across a new spawn lifecycle.
- Values and visuals are provisional client-side behavior, not original KPAH combat timing or assets. Validation: `src/main.js` passed V8 syntax compilation after stripping module imports/exports; no browser timing test or Vite production build was run.


## P1 — Keyboard target cycling

- Added deterministic cycling through living monsters with **Tab** and reverse cycling with **Shift+Tab**. The selection wraps at either end and skips defeated monsters.
- Keyboard selection uses the same target synchronization path as pointer/map selection, refreshing the target HUD, scene ring, combat target and open world-map marker state together.
- The existing 1–5 action-slot shortcuts remain unchanged; editable fields and login overlays continue to suppress gameplay shortcuts.
- This is client-side target selection only. It does not add server targeting or claim original KPAH key bindings.


## B14 — Generated transport codec increment

- Added `tools/generate_transport_codec.py`; it validates the transport declaration in `protocol/protocol.yaml` and generates JavaScript `transport-codec.js` plus Java `TransportCodec.java`.
- Both runtimes implement prefix-XOR handshake key derivation, XOR stream with explicit independent cursors, C2S u16 frames, S2C short frames, and encrypted S2C long frames (0x80 marker + u32 length).
- Synthetic cross-language vectors cover handshake, encrypted C2S, S2C short/long and cursor wrap. The APIs return the updated cursor; callers must maintain send and receive cursors independently.
- CI run `42797122962`: SUCCESS. Vite production build, generated-source consistency, JavaScript transport tests, Java 21 compilation and transport smoke tests passed. The earlier stale-output failure was corrected by regenerating committed files from the canonical generator templates.
- Scope remains protocol tooling only: no production network capture, live server, WebSocket gateway, or BE session has been implemented.


- B16 follow-up: added a typed, evidence-bounded prefix decoder for S2C opcode 3 in `protocol/protocol.yaml`. JavaScript and Java generated decoders parse the fixed prefix through `cT`, including the length-prefixed action mapping, and preserve all remaining extension bytes as opaque `trailingBytes`. The full opcode 3 command remains opaque; this is deliberately not represented as a complete schema. CI now checks generator determinism and both runtime decoders.


## B16 — Opcode 16 mode 0 decoder

- Added `modeSchemas` to `protocol/protocol.yaml` for the source-verified S2C opcode 16 mode 0 layout: signed 64-bit currency, unsigned-byte record count, then repeated unsigned-byte skill index + signed 32-bit skill value.
- Added `tools/generate_initialization_codec.py` and generated JavaScript/Java decoders. JavaScript retains currency as `BigInt`; Java retains it as `long`. Both preserve trailing bytes.
- Modes 1–3 remain opaque after their mode byte. This increment does not claim a full opcode 16 decoder or server-side state integration.
- Added JavaScript vectors for >2^53 currency, signed skill values, repeated records, opaque modes and truncation; CI also compiles and smoke-tests the generated Java decoder.


- Source refinement: CFR `ka.java` opcode 16 case reads two additional signed 32-bit values into `km.s.t.aY` and `km.s.t.aZ` after mode-specific sections. The mode-0 decoder and both-language smoke vectors now parse these common fields explicitly; business semantics remain unnamed.


## B16 — Opcode 16 mode 3 decoder

- Traced CFR ka.java case 16 and xg.java inventory rendering: mode 3 reads common aY counter, signed-byte count, short array into ca.T, then common aZ; the array is displayed against bq.d/e catalog entries.
- Extended the generated JavaScript/Java initialization decoder for mode 3. It preserves signed short values, validates negative counts, parses common counters and retains any tail bytes.
- Modes 1 and 2 remain opaque; no inferred item/auxiliary record schema is claimed.
- Added JavaScript and Java synthetic vectors for mode 3 and retained mode 0 64-bit currency/skill tests.


## B16 — Opcode 16 mode 1 inventory decoder

- Traced CFR ka.java case 16 and the bo/bk item/stat structures. Mode 1 reads a signed-short item count, per-item property fields, UTF description, unsigned-short value, nested stat pairs and a trailing byte; then common aY/aZ counters.
- Added source-bounded JavaScript/Java decoding into inventory item records while retaining original obfuscated field names where semantics are not verified. Mode 1 items are the inventory collection assigned to z.bx.
- Added synthetic tests for signed item/stat values, modified UTF-8 description, unsigned-short value, nested stats, common counters and opaque tail bytes. Mode 2 remains opaque.


- Opcode 16 mode 3 validation: CI run 42974710824 SUCCESS (Vite build, generated initialization-codec consistency, JS tests and Java 21 compile/smoke). Mode 1 inventory decoder has been added after this run and is awaiting its own CI run.


## B16 — Opcode 16 mode 2 auxiliary decoder

- Re-read CFR `ka.java` case 16 and `mj.java` consumer: mode 2 starts with common `aY`, then two signed-byte-counted collections of `k` records, then common `aZ`; `mj.a(long,int[],Vector,Vector,int)` assigns the second vector to `z.by`.
- Added generated JavaScript and Java decoders for both collection layouts, preserving the source read order and marking discarded values explicitly rather than assigning guessed meanings.
- Added synthetic JS and Java vectors for both record types, UTF fields, signed `g`, common counters, and opaque tail bytes. Negative collection counts are rejected. Unknown mode values remain opaque.
- CI run `42981960004` PASS: Vite build, generated initialization-codec consistency, JavaScript tests, local TCP replay harness, and Java 21 compile/smoke tests.


## B16 — Opcode 15 source trace expansion

- Revisited CFR `ka.java` case 15 and both `mj.java` overloads. Subtype 0 is a character-targeted item/context update with a `bo` list, five short metadata values, optional UTF/byte data and optional `l` record; the non-zero subtype carries a character-targeted item list plus a packed image payload used for pet-equipment presentation.
- Traced `l.java`, `bo.java`, `bk.java`, and `xg.java` consumer fields. Optional records are sentinel-guarded; the non-zero branch's image bytes are decoded as an image atlas and frame dimensions are calculated from the image and frame count.
- Updated `protocol-initialization-data.md` with exact read order and runtime destinations. Generated JavaScript and Java opcode 15 decoders now cover subtype 0 shop/context data and non-zero pet-equipment image data. Dedicated synthetic vectors cover both item layouts, stat records, sentinels, negative counts and opaque image bytes; actual atlas decoding/dimensions remain in the image runtime.


## B5 — World entity movement source trace

- Traced `cd.a(ce)`, `cd.b()`, `cd.c(x,y)`, `cd.y()` and `ca.b()` in CFR. Remote snapshots set target M/N; local actor snapshots set current l/m. Per-template movement speed is `ku.T[R].c`; movement steps one axis at a time, prioritizes X, then Y, and sets facing cO 0–3.
- Documented the distinction between C2S movement requests and S2C entity snapshots, plus the client-side movement throttle and collision checks.
- This is reverse-engineering evidence/documentation only; no server-authoritative network interpolation is connected to the demo runtime yet.


## B16 — Opcode 15 typed variants

- Added protocol YAML variant declarations with explicit wire-order layouts for subtype 0 and the non-zero image branch.
- Generated JavaScript and Java decoders preserve the subtype-specific item layouts: subtype 0 includes unsigned-short w; non-zero subtype omits w and reads frame count followed by the remaining image bytes.
- Subtype 0 parses aS, five short values, optional UTF/byte data and optional l context. The byte assigned to a discarded temporary l object is named discardedTypeByte, not misrepresented as a field on the retained context.
- Matched the original signed-count loops: negative subtype-0 item/stat counts result in zero iterations; negative non-zero item count skips the character update and preserves the remaining bytes.
- Added exact-layout generator checks, JavaScript vectors and Java 21 smoke coverage. CI run `42985722022` PASS: Vite build, all generated-code consistency checks, opcode 15 JS vectors, Java 21 compile/smoke (including both item layouts and optional context), replay harness, and original-JAR CFR analysis.


## B16 — Opcode 1 lookup consumer trace

- Expanded the opcode 1 trace from raw field order to consumers: cv skill definition fields (index, icon/resource, name, description, cooldown, enabled, available/used upgrade points), z.bw profession-specific skill-slot count, and the five mj.A profession skill-description vectors.
- Confirmed mj.aS is the boat ticket price, ku.ad maps item-stat IDs to display labels, bq.e/d supplies quest objective icon/name, GameMidlet.g is passed to platformRequest, named tile blobs are t_hang/t_thanh, and hd.a stores indexed character-part data.
- Marked mj.Z, mj.ac/ad/ae/af, z.cy/cz/cA/cB and mj.bb/bc as populated but not semantically resolved from current CFR consumer scan. Flagged the ia icon byte assignment as a CFR/bytecode-review anomaly.


## B16 — Opcode 3 optional extension trace

- Extended the CFR trace beyond the generated 33-field prefix. Documented the main character extension (i/af, bM/e/t/u, cd/cc/ce/dm/dn/ak), three separately guarded numeric groups, a counted short+byte mapping plus UTF metadata, bf, and the final two guarded state groups.
- Recorded each group's fallback defaults and the important cursor behavior: catch blocks do not rewind after partial reads. The generated decoder continues to preserve this area as opaque trailing bytes until dedicated truncation/consumer tests are available.


## B16 — Opcode 1 global configuration decoder

- Added packetSchemas declaration for the observed S2C opcode 1 section order and generated JavaScript/Java decoders.
- Decoder covers skill definitions, five profession slot counts and catalogs, optional unlock IDs/5x5x4 matrices, neutral global bytes, stat labels, hotline, paired lookup rows, quest objective catalog, external URL, named tile blobs and best-effort part-data records.
- Preserves signed/unsigned count behavior, the literal available()>0 optional-block guard, and the final part-data catch without claiming semantics for unresolved arrays. Synthetic JS vector covers the complete section order; Java 21 smoke vector covers skill metadata, profession slot counts, matrices, labels, lookups, quest catalog, tiles and part data. CI run `42987425414` PASS: Vite build, all codegen checks, JS tests, Java 21 compile/smoke and CFR analysis.


## B16 — Opcode 3 optional extension decoder

- Added a separate JavaScript/Java decoder for the bytes following the fixed 33-field opcode 3 prefix. It models the main character extension, three optional numeric groups, counted short/byte mapping + UTF, bf and final state groups.
- Each group has its own catch/default behavior, matching the source's no-rewind cursor semantics. The mapping group returns its raw text and does not invent the semantics of kw.a parsing.
- Added full and truncated synthetic vectors, generator/schema consistency and Java 21 smoke coverage. CI run `42987425414` PASS: Vite build, opcode 3 extension codegen/test, Java 21 compile/smoke and original-JAR CFR analysis.


## Protocol codec — Java-compatible partial reads

- Updated the generated JavaScript PacketReader so readU16/readI16/readI32/readI64/readUTF consume bytes incrementally like DataInputStream. This preserves cursor position after a truncated field and is required to reproduce opcode 3's independent try/catch groups.
- Added JS tests for partial short/int/long/modified-UTF reads and Java smoke checks for partial int/UTF cursor consumption. CI run `42988161515` PASS: all generated-code checks, protocol/initialization/extension tests, Java 21 compile/smoke and CFR analysis.


## B5 — World entity and map packet decoders

- Added source-bounded JavaScript/Java decoders for S2C opcode 4 spawn/update records, opcode 8 despawn ID lists and opcode 12 map transitions/map-data bytes.
- Opcode 4 preserves per-field defaults and kind-1-only subtype behavior; opcode 12 keeps the four shorts neutral. Opcode 7 remains intentionally untyped because CFR assigns the first short to a temporary ce object while mj.a(ce) later looks up ce.a; bytecode verification is required before naming that field.
- Added JS synthetic vectors and Java 21 smoke coverage. CI run `42988786876` PASS: Vite build, world-state generator consistency, JS vectors, Java 21 compile/smoke and CFR analysis.


## B5 — S2C opcode 5 player snapshot decoder

- Consolidated opcode 5 into the dedicated ProtocolOpcode5Codec, which guards on existing-entity availability and uses the fixed z arrays: seven part bytes, seven part-slot shorts and five ca shorts. It parses identity/position/HP/MP, profession/class, status, optional af, trade flag and all independently guarded extension groups, including the previously missing counted short/byte mapping.
- Preserves co wire value and only exposes coNormalized when non-negative; negative co leaves existing runtime state unchanged. Optional groups retain their individual defaults and partial-read cursor behavior.
- Added full JS vector and Java 21 smoke coverage, including the entityExists=false guard, aS/ca alignment and counted mapping. CI run `42990823939` PASS: Vite build, opcode 5 generator check/test, world-state tests, all other protocol suites, Java 21 compile/smoke and CFR analysis. The decoder returns state without mutating world entities.


## B16 — Opcode 5 world entity snapshot

- Added a Java/JS decoder generated from the S2C opcode 5 handler and entity array dimensions in z.java.
- Covers known-entity guard, ordered identity/position/combat/appearance/state fields, conditional af, five short ca values, presence flag, and six independently guarded tail groups.
- Unknown entity behavior is explicit: only the entity ID is consumed and the remainder is returned untouched. No entity is synthesized.
- Added full synthetic packet, unknown-entity vector, generator consistency and Java 21 smoke test. CI validation pending.


## B5 — S2C combat event opcodes 6 and 9

- Added shared source-bounded decoder for the fixed nine-field payload used by ka.java case 6 → mj.a(...) and case 9 → mj.b(...). Fields remain neutral (two IDs, byte, two ints, four bytes) because the runtime interpretation depends on whether the local actor is the source or target.
- Added JS vectors and Java 21 smoke coverage for signed IDs/ints and byte order. Validation pending.


## B5 — Opcode 5 mapping correction

- The first opcode 5 world-state decoder duplicated the existing dedicated opcode5-codec module. Removed the duplicate from world-state-codec and retained one canonical implementation with the entity-exists guard.
- The opcode 5 source handler includes a signed-byte counted short/byte mapping between triple C and bf. Added this missing group to both JavaScript and Java codecs and tests. Corrected the synthetic vector to include the aS byte before the five ca shorts; this fixes the prior shifted ca[4] assertion.


## B5 — S2C opcode 17 entity action/effect event — CI PASS

- Added the source-bounded opcode 17 JavaScript/Java decoder to the generated world-state codec.
- Parses the event header, signed-byte effect count, effect records (type byte + four shorts), and optional repeat/discarded/mode bytes.
- Keeps the first short neutral because CFR's temporary-object assignment conflicts with the consumer's use of kl.a; exact mapping remains open pending bytecode verification. Target ID is supported by the consumer lookup of kl.b.
- JS vectors cover populated and absent optional tails, negative effect count and signed effect values. Java 21 smoke test covers the event header, effect record and optional trailer.
- CI run `42992393021` SUCCESS: Vite production build, Python tooling, all generated-code checks, JS protocol suites, Java 21 compile/smoke tests and original-JAR analysis. No live server, packet capture, browser gameplay test or backend behavior was validated.
- The earlier runs failed first because generated world-state files were stale and then because the schema evidence marker did not match the generator's exact source marker; both were corrected before the passing run.
- Overall weighted project percentage is unchanged; no WBS weights were recalculated. BE stage remains deferred.


## B5 — Bytecode verification and S2C opcode 7 entity update — CI PASS

- Materialized the original `KPAH_278.jar` from the user's Library and inspected `ka.class` with Java 21 `javap -c -p`; no changes were made to the original JAR.
- Bytecode confirms opcode 7 assigns the first short to the retained `ce.a` (entity ID), then reads template ID, X/Y, current HP, two state bytes, max HP and an opaque int. `mj.a(ce)` resolves an existing entity; `cd.a(ce)` updates its coordinates/HP/state. Added the Java/JS decoder and vectors.
- Bytecode confirms opcode 17 assigns the first short to retained `kl.a`; it is the actor/source entity ID. The second short `kl.b` is the target ID. Updated Java/JS codec field to `actorEntityId`; no longer leaves it neutral.
- Added generator schema checks, JS tests, Java 21 smoke vectors, and source-backed docs.
- CI run `42993047244` SUCCESS: Vite production build, Python tooling, all generated-code consistency checks, all JavaScript protocol suites, Java 21 compile/smoke and original-JAR analysis.
- No live server/packet capture, production combat application, browser gameplay test or backend implementation was exercised. Overall weighted percentage unchanged pending WBS recalculation; BE remains deferred.


## B5 — S2C opcodes 18–21 ground-item and inventory events — CI PASS

- Added JavaScript/Java decoders for opcode 18 partial ground-item pickup context, opcode 19 pickup reward, opcode 20 typed entity removal and opcode 21 inventory item update.
- Opcode 18 preserves the shared byte assigned to both `bo.m` and `bo.D`; item/drop IDs and remaining partial fields retain source field order.
- Opcode 19 preserves the unsigned-byte currency/item index and signed-short amount; the client consumer updates local currency for index 0 or an item counter otherwise.
- Opcode 20 decodes signed-byte entity kind before signed-short entity ID.
- Opcode 21 preserves unsigned-short `w`, signed-byte stat count, unsigned-byte stat IDs, signed-short stat values, and optional `C` byte with constructor default zero. Negative stat counts produce zero records, matching the source loop.
- Added schema/generator validation, JS vectors and Java 21 smoke tests. CI run `42993708570` SUCCESS: Vite build, all generator checks, all JS protocol tests, Java 21 compile/smoke and original-JAR analysis.
- Decoders remain parse-only; no server-authoritative inventory mutation, currency award, or live session was implemented. Overall weighted project percentage unchanged pending WBS recalculation; BE remains deferred.


## B5 — S2C opcodes 27, 28, 30, 32 and 33 — CI PASS

- Added JavaScript/Java decoders for overhead chat bubble (27), inventory sale confirmation (28), experience update (30), keyed character resource update (32) and level-up state (33).
- Opcode 32 parses a signed-byte-counted UTF-key/int-value list and requires an explicit `isLocalCharacter` input to parse the extra byte+short trailer only for the local character. Negative counts are rejected.
- Consumer traces confirm opcode 27 updates overhead text/world chat; 28 removes the sold inventory item and credits proceeds; 30 updates experience and displays XP gain; 32 updates hp/mp/bp/sp fields; 33 updates level and HP/MP state.
- Added packet schemas, generator consistency, JS vectors (including local/non-local opcode 32), and Java 21 smoke tests. CI run `42994113670` SUCCESS: Vite build, all generated-code checks, all JS protocol suites, Java 21 compile/smoke and original-JAR analysis.
- Decoders remain parse-only; they do not apply authoritative inventory, currency, XP, level or resource changes. Overall weighted project percentage unchanged pending WBS recalculation; BE remains deferred.


## B5 — S2C opcodes 61 and 78 — CI PASS

- Added JavaScript/Java decoders for opcode 61 inventory item drop and opcode 78 warehouse item sale.
- Inspected original JAR bytecode for opcode 61: the first effect byte is assigned to the retained `jz.a` instance (not a temporary object as CFR suggested); the packet then carries one more byte and three signed shorts. The consumer removes the matching inventory item and creates a ground-effect visual.
- Opcode 78 carries one signed-short warehouse item ID; the consumer decrements the storage stack and credits sale proceeds when exhausted.
- Added packet schemas, generator consistency, JS vectors, Java 21 smoke tests and documentation. CI run `42994477192` SUCCESS: Vite build, all generated-code checks, all JS protocol suites, Java 21 compile/smoke and original-JAR analysis.
- These are parse-only decoders; no inventory mutation, item spawning or economy side effects are applied. Overall weighted project percentage unchanged pending WBS recalculation; BE remains deferred.


## B5 — S2C opcode 23 inventory/equipment context variants — CI PASS

- Added a branch-aware JavaScript/Java decoder for all five subtype branches.
- Subtype 0: counted raw byte list. Subtype 1: category byte, signed-short item ID list and optional mode byte (default 2). Subtype 2: partial item records with source-compatible negative-value normalization. Subtype 3: no payload. Subtype 4: counted byte list plus two trailer bytes.
- Consumer trace: subtype 0 rebuilds the local item context; subtype 1 resolves catalog fields and opens the appropriate inventory/equipment view; subtype 2 installs the partial item vector; subtype 3 filters static catalog entries; subtype 4 opens the shop-tab actions.
- Added packet schema, generator check, JS branch vectors (including empty/negative count cases), Java 21 smoke vectors and docs. CI run `42994967419` SUCCESS: Vite build, generated-code checks, JS protocol suites, Java 21 compile/smoke and original-JAR analysis.
- Decoder does not resolve static item catalogs or apply UI/inventory mutations. Overall weighted project percentage unchanged pending WBS recalculation; BE remains deferred.


## B16/B5 — S2C opcode 25 static item/shop catalog — CI PASS

- Added a JavaScript/Java decoder for the full opcode 25 section sequence: `ck` lookup records, signed-byte coordinate pairs, five fixed config bytes, indexed `br` definitions, signed-count `bd` list and unsigned-count `bd` list.
- Cross-checked the decompiler's `bd.o` assignments against original `ka.class` bytecode: both first and second `bd` lists write IDs to the retained `bd` instance. Definition entries preserve the original per-entry error boundary; index errors are surfaced as neutral parse errors.
- Added packet schema, generator check, JS synthetic catalog vector and Java 21 smoke vector. CI run `42995767130` SUCCESS: Vite build, all generator checks, all JS protocol suites, Java 21 compile/smoke and original-JAR analysis.
- Catalog decoder does not derive UI labels, instantiate shop models or implement purchases. Overall weighted project percentage unchanged pending WBS recalculation; BE remains deferred.


## B5/B16 — S2C opcode 26 world resource bundle — CI PASS

- Added generated JavaScript/Java decoders for the source-ordered resource payload: template count, primary binary blob, effect blobs, indexed image blobs, indexed graphics blobs, paired four-byte configuration arrays, and three pairs of variable byte arrays.
- Each optional group follows the original client's independent catch boundary. The decoder records section errors and installs the original fallback arrays for `ct/cu`, `cv`, `cw`, and `cx`; the primary blob remains strict.
- Resource IDs and payload bytes are preserved as opaque data; no image formats, rendering meanings, or gameplay semantics are invented.
- Added protocol schema, generator consistency, JS vectors for complete and fallback cases, Java 21 smoke vectors and docs.
- CI run `43173158542` SUCCESS: Vite build, generated-code checks, JS protocol suites, Java 21 compile/smoke and original-JAR analysis.
- Overall weighted project percentage unchanged pending WBS recalculation; BE remains deferred.


## B16 — S2C opcodes 2 and 22 — CI PASS

- Opcode 2 now decodes all three source variants: prefix-2 option list (UTF label, signed-short value, UTF description), prefix-3 provider/agent pair, and plain server message. The UI selector suffix is exposed without implementing navigation.
- Opcode 22 decodes two signed shorts, a signed byte, another short, an int and optional signed byte defaulting to zero.
- Added Java/JS generated decoders, schema validation, synthetic branch vectors and Java 21 smoke tests. CI run `43173158542` SUCCESS.
- The combined CI run also validates opcode 26 world resource bundle. No authoritative server state or browser UI side effects are implemented; weighted project percentage remains unchanged.


## B16 — S2C opcodes -5, 35, 37, 38, 39 and 64 — CI PASS

- Opcode 35 decodes the fixed `ic` tables: 15×11 short grid, 15×11 short grid scaled by 100, 15 row shorts, 15×11 unsigned-byte grid, 15×11 short grid, 15×11 signed-byte grid, and five length-prefixed byte arrays.
- Opcode 64 decodes a signed-byte-counted list of records (two signed bytes + three signed shorts).
- Opcode -5 decodes signed-byte-counted sender/message UTF pairs. Opcodes 37/38/39 decode server dialog, world notice and SMS registration result payloads.
- Added schema, Java/JS generated codecs, tests for grid dimensions/signedness, UTF payloads and registration result. CI run `43173647371` SUCCESS: Vite build, generated-source checks, JS tests, Java 21 compile/smoke and original-JAR analysis.
- These are parse-only decoders; no skill progression, chat state, dialogs or SMS actions are executed. Weighted project percentage unchanged; BE remains deferred.


## B16 — S2C opcodes -8, -9, -10, -11, -12, -17, -18, -19 and -20 — CI PASS

- Added source-backed decoders for binary resource transfer subtypes (-8), signed-short ID/message lists (-9), panel message (-10), conditional confirmation result (-11), social/guild record with three signed 64-bit fields (-12), announcement list (-17), guild chat (-18), ranking result (-19), and guild currency reward (-20).
- Type-5 ranking records are typed; other ranking payloads stay opaque for their ranking-specific parser. Resource image bytes remain opaque; no image format is assumed.
- Added Java/JS codecs and synthetic vectors for nested binary blobs, optional fields, 64-bit values, UTF strings and ranking variants. CI run `43174297049` SUCCESS.
- Decoders do not trigger prompts, alter guild/chat state, render images or apply currency. Weighted project percentage unchanged; BE remains deferred.
