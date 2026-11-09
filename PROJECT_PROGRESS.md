# KPAH Web reconstruction — progress snapshot

Updated: 2026-11-09

This percentage is a task-weighted estimate against the agreed 41-item roadmap (P0–P4), not a line-of-code percentage. A task receives partial credit only for verified implementation; mock UI does not count as a completed gameplay/backend feature.

## Phase progress

| Phase | Scope | Progress | Basis |
|---|---|---:|---|
| P0 | Foundation and original resources (5 tasks) | 36% | Resource extraction and manifest are implemented; camera/entity runtime and a generic tile-layer adapter now exist, but original map data, tile mapping and animation remain unimplemented. |
| P1 | Reconstructed client/gameplay (10 tasks) | 25% | Demo server/login/character flow and profession previews exist; player movement works in the mock scene and NPCs now have clickable dialogue/actions; original world, combat and real animation remain unimplemented. |
| P2 | Game systems (10 tasks) | 6% | Inventory category filtering and local chat-channel interactions are implemented in the client; other systems remain placeholders and nothing is server-backed. |
| P3 | Backend and multiplayer (10 tasks) | 2.5% | Some original packet/opcode/socket behavior is documented; no agreed or implemented backend. |
| P4 | Optimization and release (6 tasks) | 0% | Not started. |

**Overall estimate: about 12.6%** (weighted average of the 41 roadmap items).

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
- Routed pointer, keyboard and directional-pad movement through the shared runtime; the player name label now follows the moving entity.
- Made the offline server state explicit instead of displaying a false connected status.
- Adjusted mobile safe-area spacing for notched phones and compressed the action bar on very narrow screens to reduce horizontal overflow.
- Added clickable world NPC hit areas. The village elder opens a dialogue with a route to the quest panel; the merchant opens a dialogue with a route to the shop. These are local client interactions and do not imply original NPC scripts or server transactions.
- Added client-side chat channel selection/filtering for World, Guild, Private and System; System is read-only and sent messages use the selected channel and current character name. Messages remain local to the browser.
- Added working inventory filters for equipment, consumables, materials and quest items. Item categories are provisional demo data, not reconstructed server inventory.
  - Kiếm Khách → kiem
  - Chiến Binh → daidao
  - Pháp Sư → phapsu
  - Đấu Sĩ → bua
  - Cung Thủ → cung
- Corrected the character-creation navigation callback (showStep → existing step function).
- Documented that these are static profession previews; gender/hair composition and animation mapping are not yet verified.

## Validation limitations

GitHub file updates were confirmed on main. The current environment did not run npm install, npm run build, or a browser session, so runtime/build success is not claimed. The new tile-layer adapter is infrastructure only; no original map data or tile-ID mapping has been supplied to it. The original extracted asset directory is generated locally from KPAH_278.jar and is not committed; run npm run extract:assets before testing previews.
