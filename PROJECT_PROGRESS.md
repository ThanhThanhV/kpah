# KPAH Web reconstruction — progress snapshot

Updated: 2026-11-09

This percentage is a task-weighted estimate against the agreed 41-item roadmap (P0–P4), not a line-of-code percentage. A task receives partial credit only for verified implementation; mock UI does not count as a completed gameplay/backend feature.

## Phase progress

| Phase | Scope | Progress | Basis |
|---|---|---:|---|
| P0 | Foundation and original resources (5 tasks) | 36% | Resource extraction and manifest are implemented; camera/entity runtime and a generic tile-layer adapter now exist, but original map data, tile mapping and animation remain unimplemented. |
| P1 | Reconstructed client/gameplay (10 tasks) | 25% | Demo server/login/character flow and profession previews exist; player movement works in the mock scene and NPCs now have clickable dialogue/actions; original world, combat and real animation remain unimplemented. |
| P2 | Game systems (10 tasks) | 18% | Character/inventory/equipment share a client state model; skill learning/upgrades, action-bar assignment and a turn-based training-combat loop are now wired locally. Values and combat formulas are illustrative only; other systems and server authority remain unimplemented. |
| P3 | Backend and multiplayer (10 tasks) | 2.5% | Some original packet/opcode/socket behavior is documented; no agreed or implemented backend. |
| P4 | Optimization and release (6 tasks) | 0% | Not started. |

**Overall estimate: about 15.5%** (weighted average of the 41 roadmap items).

## P0 — Foundation detail

| Task | Status | Progress |
|---|---|---:|
| 1. Extract .sh, .wp, .wps | Implemented in extractor | 100% |
| 2. Classify images/resources | Initial pack inventory plus PNG dimension/geometry metadata; semantic sprite mapping pending | 40% |
| 3. Sprite/animation engine | Manual frame inspector exists; runtime character animation engine/mapping not implemented | 10% |
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

## Validation limitations

GitHub file updates were confirmed on main. The current environment did not run npm install, npm run build, or a browser session, so runtime/build success is not claimed. The new tile-layer adapter is infrastructure only; no original map data or tile-ID mapping has been supplied to it. The original extracted asset directory is generated locally from KPAH_278.jar and is not committed; run npm run extract:assets before testing previews.
