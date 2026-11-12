# Khí Phách Anh Hùng — Web recreation

Bản tái hiện client giao diện KPAH từ tài liệu tham chiếu `KPAH_278.jar` (MIDlet 1.5.9, MIDP 2.0 / CLDC 1.0).

## WBS và theo dõi tiến độ

Nguồn theo dõi tiến độ chính thức: [KPAH Web WBS](./KPAH_Web_WBS_Theo_doi_tien_do_va_danh_gia.md). Mọi task được cập nhật theo ID, phụ thuộc, đợt bàn giao và tiêu chí nghiệm thu trong file này. Các phần demo/local không được đánh dấu hoàn thành thay cho tính năng có dữ liệu gốc hoặc backend authoritative.
## Chạy local

Yêu cầu Node.js và Python 3.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal. Build production bằng `npm run build`.

## Trích xuất tài nguyên gốc

Đặt `KPAH_278.jar` tại thư mục gốc repo (repo đã giữ file JAR tham chiếu), sau đó chạy:

```bash
npm run extract:assets
```

Hoặc chạy trực tiếp:

```bash
python tools/extract_kpah_jar.py KPAH_278.jar
```

Công cụ giữ nguyên các gói gốc và tạo:
- `public/assets/kpah-original/archive-manifest.json`: danh mục các entry và tài nguyên đã giải mã.
- `public/assets/kpah-original/decoded-sh/`: nội dung các gói giao diện, NPC, hiệu ứng.
- `public/assets/kpah-original/decoded-packed/`: nội dung các gói splash/preview `.wp`, `.wps`.

Sau khi trích xuất, chạy lại Vite và mở **Tài nguyên gốc** ở thanh bên để tìm kiếm, lọc theo gói và xem trước ảnh PNG. Nếu deploy lên hosting, phải đưa cả thư mục `public/assets/kpah-original/` vào bản build.

## Gợi ý vai trò class obfuscated

Sau khi có báo cáo bytecode, chạy:

```bash
npm run suggest:class-roles
```

`tools/suggest_class_roles.py` tạo danh sách class theo vai trò ứng viên (transport, packet, resource loader, rendering, input, screen, world entity, persistence và thread lifecycle), dựa trên chuỗi hằng, superclass/interface, method/field signature, call graph, field-reference graph và type-reference graph. Báo cáo kèm string evidence và caller/callee/class-reference để review. Kết quả có cả JSON và Markdown để review.

Tool giữ riêng các anchor đã xác minh từ quá trình đọc JAR (ví dụ `km`, `uj`, `ro`, `mj`, `ba`) và đánh dấu các gợi ý khác là giả thuyết cần kiểm tra. Điểm số chỉ dùng để xếp hàng review, tuyệt đối không tự đổi tên class hoặc kết luận nghiệp vụ.
## Phân tích JAR gốc trên CI

Workflow có job `analyze-original-jar`: giải mã tài nguyên và trích class vào `tools/reports/class-files/` (không nằm trong `public/`), kiểm tra hash, chạy class analyzer, tạo class-role review map rồi upload artifact `kpah-original-jar-analysis` trong 14 ngày. Artifact gồm class-analysis JSON, role-candidate JSON/Markdown và archive manifest.

Job này giúp tạo báo cáo từ đúng JAR đã commit mà không cần cài JADX trên máy phát triển. Role suggestions vẫn là giả thuyết; phải review caller/callee, chuỗi và bytecode trước khi xác nhận tên class.

## CI validation

GitHub Actions workflow `.github/workflows/validate.yml` runs on pushes to `main`, pull requests and manual dispatch. It installs the browser client dependencies and runs the Vite production build, compiles the Python tools, compiles a small Java 8-compatible fixture and smoke-tests the bytecode analyzer/class-role report, then verifies a synthetic asset manifest and confirms that a modified asset is rejected.

This workflow validates the toolchain with synthetic fixtures; it does not claim that the original JAR has been extracted/analyzed, nor does it deploy a staging environment. Check the Actions tab for the actual run result after each push.

## Kiểm tra tính toàn vẹn tài nguyên

Sau khi trích xuất, chạy:

```bash
npm run verify:assets
```

`tools/verify_asset_manifest.py` kiểm tra SHA-256 của từng tài nguyên đã giải mã, xác nhận `assetVersion` có thể tái tạo từ manifest và đối chiếu hash JAR nguồn nếu truyền `--jar`. Lệnh trả mã lỗi khác 0 nếu thiếu file, sai hash, trùng output path hoặc manifest bị sửa không đồng bộ. Đây là bước kiểm tra dữ liệu asset, chưa thay thế CI build/test toàn dự án.

## Chat, friends, party và guild protocol

Source-backed notes cho chat -5/-18, friend request 101, friend removal -6, friend roster 103, invitation -11 và guild records/announcements/chat/ranking/reward -10/-12/-13/-17/-18/-19/-20: [protocol-social-guild-chat.md](./docs/reverse-engineering/protocol-social-guild-chat.md).

## NPC, menu và quest protocol

Source-backed notes cho entity speech opcode 27, help text -24, world message -26, quest collection -64, objective/detail -30/-31 và confirmation prompt -32: [protocol-npc-quest-menu.md](./docs/reverse-engineering/protocol-npc-quest-menu.md).

## Inventory, equipment và trade protocol

Source-backed schema cho material list opcode 73, equipment list 76, trade/market panel 94 và market listing actions 92/95: [protocol-inventory-trade.md](./docs/reverse-engineering/protocol-inventory-trade.md). Purchase/use/equip/upgrade flows còn được truy vết riêng.

## Combat, skill và buff protocol

Packet schemas đã trace cho C2S skill cast opcode 51, S2C damage opcode 6/9/10/83/106 và effect/buff events `-74/-71/-73`: [protocol-combat-skills.md](./docs/reverse-engineering/protocol-combat-skills.md). Các công thức damage và buff stacking chưa được suy diễn từ packet.

## Map, movement và world entity protocol

Source-backed packet schemas cho movement opcode 4, map transition opcode 12, entity spawn/update opcode 4 S2C, player snapshot opcode 5, entity snapshot opcode 7 và despawn opcode 8: [protocol-world-map.md](./docs/reverse-engineering/protocol-world-map.md).

## Local TCP replay harness

Mock TCP loopback server để kiểm tra handshake `-40`, XOR cursor và capture C2S login đầu tiên (login payload được redacted): [local-tcp-replay-harness.md](./docs/reverse-engineering/local-tcp-replay-harness.md). Chưa có emulator replay hoặc auth/world response.

## Protocol YAML và code generation

`protocol/protocol.yaml` hiện catalog 110 C2S + 142 S2C entries; Java/JS command constants và payload codecs được generate từ cùng spec. Chỉ 13 payload schema đã đủ bằng chứng để typed encode/decode; các command còn lại được giữ opaque: [protocol-codegen.md](./docs/reverse-engineering/protocol-codegen.md).

## Nhóm tính năng nâng cao R4

Đánh giá bằng chứng client cho luyện trang bị, pet, cây thần, cổ vật, ranking, vé tàu và các mục chưa xác minh như ngựa/mount, đấu trường, đấu giá: [advanced-features-r4.md](./docs/reverse-engineering/advanced-features-r4.md).

## Server initialization data

Typed source-bounded decoders now cover opcode 1 global configuration, opcode 3's fixed prefix plus independently guarded extension groups, opcode 15 shop/context and pet-equipment image variants, and opcode 16 modes 0–3, and world-state opcodes 4/5/6/8/9/12. Run `npm run check:opcode1` / `npm run test:opcode1`, `npm run check:initialization-protocol` / `npm run test:initialization-protocol`, `npm run check:opcode3-extension` / `npm run test:opcode3-extension`, `npm run check:opcode5` / `npm run test:opcode5`, and `npm run check:opcode15` / `npm run test:opcode15`, `npm run check:world-state` / `npm run test:world-state` to verify generated codecs. The image atlas bytes remain opaque until the client image decoder runs; this does not claim a complete server bootstrap schema.

Schema notes for S2C global configuration opcode 1, selected-character snapshot 3, shop/catalog 15 and character inventory/skill extension 16: [protocol-initialization-data.md](./docs/reverse-engineering/protocol-initialization-data.md). Field consumers and optional sections are recorded separately from unresolved business semantics.

## Client movement và damage feedback

Client movement step/target/path handling, 250 ms coordinate send throttle và floating damage/MISS lifecycle: [client-motion-and-damage.md](./docs/reverse-engineering/client-motion-and-damage.md). Jump physics và damage formula chưa được xác minh.

## Client lifecycle và state machine

Luồng MIDlet startup → resource bootstrap → server select → login/transport handshake → character roster/create/select → loading → world map, cùng disconnect/timeout/reset: [client-state-machine.md](./docs/reverse-engineering/client-state-machine.md).

## Auth và character protocol

Đặc tả source-backed cho server list, login opcode 1, registration opcode 39, roster opcode 13, select/delete/restore và create character opcode 14: [protocol-auth-character.md](./docs/reverse-engineering/protocol-auth-character.md).

## Quét toàn bộ C2S packet builders

Opcode catalog scanner hiện duyệt toàn bộ CFR `.java` files, không chỉ `jy.java`; nó nhận diện `jy.b(...)` và `new acu(...)` với cả opcode hằng/biến, ghi source file/line, payload write order và số lần packet được enqueue. Các factory/helper không gửi được đánh dấu riêng. Cần nối caller của wrapper và rà soát dynamic opcode trước khi coi catalog là đầy đủ.

## Catalog opcode C2S/S2C

`tools/extract_protocol_catalog.py` đọc CFR source `jy.java` và `ka.java`, xuất opcode writer phía client, thứ tự `write*`, số lần enqueue, cùng dispatcher case và `read*`/dispatch target phía server. Chạy `npm run catalog:protocol` sau khi CFR decompile; CI tự sinh JSON/Markdown và đính kèm artifact.

Catalog hiện là bằng chứng cấu trúc, chưa gán tên nghiệp vụ cho mọi opcode. Một packet builder không gọi send queue được đánh dấu `not enqueued`, không tính nhầm thành lệnh gửi thực tế.

## Opcode catalog từ CFR

Sau khi CFR decompile JAR, workflow chạy `tools/extract_protocol_catalog.py` trên `jy.java` và `ka.java`, trích danh sách C2S writer opcode cùng thứ tự `writeByte/writeShort/writeInt/writeUTF/writeBoolean`, và S2C dispatcher case cùng read operations/dispatch targets. JSON/Markdown catalog được đính kèm artifact CI.

Catalog giữ tên method obfuscated và chỉ ghi bằng chứng source; chưa tự gán tên nghiệp vụ hoặc coi payload schema là hoàn chỉnh. Dùng nó làm đầu vào cho B4–B16.

## Đặc tả transport TCP gốc

Đặc tả frame, handshake `-40`, XOR key/cursor, marker long-length `0x80` và test vectors được ghi tại [protocol-transport.md](./docs/reverse-engineering/protocol-transport.md). Codec tham chiếu nằm trong `tools/kpah_protocol_reference.py`; chạy `npm run test:protocol` để kiểm tra vector tổng hợp.

## Bản đồ vai trò class từ JAR gốc

Xem [class-role-map.md](./docs/reverse-engineering/class-role-map.md) để biết 16 anchor class đã xác minh, nhóm class ứng viên cần review, SHA-256 JAR và số liệu bytecode scan thực tế. Không tự đổi tên class dựa riêng vào điểm heuristic.

## Phân tích bytecode Java

Sau khi giải nén JAR, có thể yêu cầu extractor xuất cả `.class` vào thư mục tài nguyên phân tích (không đưa class lên web client):

```bash
python tools/extract_kpah_jar.py KPAH_278.jar --include-classes --class-output tools/reports/class-files
npm run analyze:classes
```

Class files được lưu riêng trong `tools/reports/class-files/`, không nằm trong `public/` và không được phục vụ cho trình duyệt. Tool `tools/analyze_class_files.py` đọc constant pool, class/interface/field/method metadata, giải mã bytecode cơ bản, đếm opcode, tạo call graph từ lệnh invoke, field-reference graph từ get/put field/static và type-reference graph từ class operands. Báo cáo mặc định ở `tools/reports/kpah-class-analysis.json`. Có thể lọc dấu vết bằng `--contains <chuỗi>` hoặc `--opcode <mnemonic|0xNN>` (lặp `--opcode` để kết hợp nhiều opcode); `--disassemble-all` xuất bytecode mọi method và có thể tạo JSON lớn.

Tool chỉ lập chỉ mục bằng chứng bytecode, không tự đặt tên class obfuscated hoặc suy diễn ý nghĩa nghiệp vụ. Cần đối chiếu các call edge/string/opcode với JADX/CFR/Vineflower và kiểm tra thủ công trước khi đưa kết luận vào protocol/gameplay spec.

## Kiến trúc hiện tại

- Vite + JavaScript modules
- Phaser 3 cho vùng thế giới 2D và tương tác bản đồ
- HTML/CSS cho HUD, cửa sổ chức năng, chat và các màn hình UI
- Trình duyệt tài nguyên đọc manifest do extractor tạo; ảnh được hiển thị với nearest-neighbor/pixelated scaling
- `src/kpah-assets.js` quản lý việc tải manifest dùng chung và chỉ tạo URL cho đường dẫn tài nguyên hợp lệ.
- Dữ liệu gameplay hiện tại vẫn là mock UI; chưa kết nối backend

## Trạng thái và giới hạn

Đây là nền tảng tái hiện client. Resource Viewer hiện chỉ duyệt và xem trước PNG đã giải mã; chưa tự suy luận animation, tilemap, collision hay mapping sprite. Extractor đã chặn đường dẫn archive không an toàn và entry trùng tên; phía trình duyệt cũng kiểm tra đường dẫn trước khi tạo URL. Các dữ liệu đó cần được phân tích và xác minh riêng từ bytecode/tài nguyên gốc. Giao thức và backend sẽ được thiết kế riêng sau khi thống nhất.


## Character preview

The character creation form loads the five verified `.wps` profession-preview packs from `archive-manifest.json`: `kiem` (Kiếm Khách), `daidao` (Chiến Binh), `phapsu` (Pháp Sư), `bua` (Đấu Sĩ), and `cung` (Cung Thủ). It displays the five original PNG entries per pack with nearest-neighbor scaling. These are profession preview images only; gender/hair composition and animation mapping remain unverified.


## Sprite inspection

Open **Tài nguyên gốc** and use the Sprite Sheet Inspector below the PNG browser. Select an extracted PNG, enter the number of rows and columns, set preview FPS, then step through or play the resulting frame grid. The grid is manually configured for inspection; it does not claim to know the original animation frame order or timing.


## Binary metadata inspection

The Resource Viewer includes a read-only `.d` inspector for decoded packed metadata files. It displays byte offsets, hexadecimal bytes and printable ASCII. No semantic field interpretation is assumed until the client bytecode confirms the record layout.


## Asset manifest integrity and cache versioning

The extractor records SHA-256 fingerprints for the original JAR, every archive entry and every decoded packed resource. It derives a content-based `assetVersion` in `archive-manifest.json`; the shared asset loader appends this version to decoded asset URLs so browsers do not keep displaying stale images after the asset output changes. Re-run `npm run extract:assets` after changing the source JAR or extraction output. CI automation and atlas-level manifests remain pending.

## Asset dimensions and browsing

The extractor records PNG width and height from the PNG header and adds a neutral geometry hint (`small-image`, `wide-image`, `tall-image`, or `general-image`) to each decoded PNG manifest entry. These hints support asset triage only; they do not claim a sprite, animation, or UI role. Re-run `npm run extract:assets` after updating the extractor to regenerate the manifest.

## Character and inventory client slice

The character profile, inventory and equipment panels share a local state model. The demo supports potential-point allocation, derived HP/MP limits, equipment bonuses, equipping/unequipping, category filters and consumable use. This is client-only sample data: it is not the original server item database, game balance, or persistent account state. Backend integration is intentionally deferred until the BE design stage.

## Skills and training combat client slice

The skills panel includes active/passive skill progression, point-based learning and upgrades, and assignment/removal across four action-bar slots. The action bar and 1–5 shortcuts execute a local turn-based training encounter with target HP, damage, MP costs, cooldowns, self-healing, enemy retaliation, combat log and restart. Slot five consumes an HP potion from the shared inventory. All skill definitions, balance values, target data and combat formulas are illustrative demo content; they are not verified KPAH data and are not server-authoritative.

## Quest journal and character progression client slice

The quest journal supports accepting objectives, tracking progress from the village elder interaction and training-wolf defeats, filtering quest states, and claiming rewards. Rewards grant experience, currency and inventory items through the shared character state; experience thresholds can increase level and potential points. The HUD wallet and pending-reward indicator are synchronized locally. Quest names, objectives, targets and rewards are illustrative demo content only, not verified original KPAH data or server transactions.


## World entities and hunting loop

The mock village now has a structured local entity catalog for four ordinary wolves and one pack leader. Monsters can be selected in the Phaser scene; the selected target HUD shows level and current HP. Using an action-bar skill approaches a distant target before the action executes, then applies damage, monster retaliation, experience rewards and chance-based item drops to the shared character/inventory state. Defeated monsters disappear and respawn after their configured local delay. Ordinary wolf defeats also advance the matching accepted hunt objective.

NPC dialogue remains connected to the quest journal and shop entry points. Monster stats, spawn points, respawn delays, rewards and drop chances are illustrative client-side data, not verified original KPAH server values. Combat remains offline and is not authoritative or multiplayer-synchronized.

Combat feedback is positioned over the affected world entity using the active camera viewport: outgoing damage appears over the selected monster, while retaliation and healing appear over the player. A ground ring marks the selected monster and follows its alive/selected state. This presentation is still awaiting browser/device visual verification.


## Merchant and local economy slice

The merchant NPC opens a functional local shop for HP potions, MP potions and upgrade stones. Purchases validate the wallet balance and inventory capacity, deduct Xu and add the purchased stack to the same inventory used by character, combat and quest rewards. The HUD and inventory wallet read the shared currency value. Prices and stock are demo values; there is no server transaction or persistent economy yet.


## Multi-zone world and travel

The client now has three connected illustrative zones: White Wolf Village (safe hub), Bamboo Forest (level 15 recommendation) and Black Stone Cave (level 20 recommendation). The world map lists current/connected/locked destinations and enforces the local level requirement before travel. A gate marker in each scene opens the map; travel redraws the zone palette and environment, updates the location HUD/minimap label, places the player at the destination entry point, and loads that zone's NPC and monster spawn definitions. Zone transitions cancel a pending monster-approach action so an attack cannot accidentally fire in the next area.

The zone names, layouts, connections, NPC placement, monster spawn points and level gates are client-side reconstruction placeholders. They are not claimed to be verified original KPAH map data; original tile IDs, map files and collision rules remain to be decoded.


## Ground loot and social client slice

Monster drop rolls now create visible ground-loot entities at the defeat location instead of inserting items directly into the bag. Loot expires after a local lifetime, can be clicked or collected with the E key when nearby, and is added to the shared inventory only after a capacity check. If the bag is full, the item remains available on the ground. Zone changes clear local ground loot. The drop lifetime, placement and pickup radius are demo rules.

Friends and party panels now use a shared local social state. The client can add a friend by name, invite online demo friends, create a party by inviting the first online friend, accept/decline simulated invitations, remove members and leave the party. Party size is capped at five. These are offline UI/state simulations only; there is no real player directory, network invitation, chat delivery or synchronized party combat.


## NPC exploration, guild and mailbox client slice

The hunter in Bamboo Forest and the cave guardian now advance separate zone-exploration quest objectives when interacted with. The quest journal includes these NPC objectives alongside the village elder objective. This is local quest progression; it does not recreate verified original NPC dialogue scripts.

The guild panel now supports browsing a small demo guild catalog, submitting a local join request (auto-accepted in this offline prototype), viewing guild/member contribution summaries, contributing Xu and leaving the guild. Contributions deduct currency from the shared character wallet. Guild membership and ranks are local illustrative state only.

The mailbox now displays sample system/NPC messages, tracks read/unread state, shows an unread indicator on the mail shortcut and allows claiming a sample currency attachment into the shared wallet. Mail content and attachments are demo data; no remote mail delivery exists.


The chat composer now includes a recipient selector for local private messages. The guild channel is blocked until the local character joins a guild; world/private/system channel filtering remains local to the current browser session. These controls do not deliver messages to other clients.


## Local character save and recovery

Character identity, level/experience, attributes and potential points, HP/MP, currency, inventory/equipment, quest progress and learned skill/loadout configuration are saved in versioned browser local storage. Loading validates the save against the current local catalogs and ignores unknown items/quests/skills. Storage denial, quota errors, malformed JSON and unsupported save versions fall back to a fresh demo state without blocking the game.

Battle target HP, cooldowns, turn counters, ground drops, player credentials, social/guild/mail sessions and other transient world state are not included. This is device/browser-local demo persistence, not account storage or cross-device synchronization.


## Knockout and checkpoint respawn

When the local character reaches 0 HP, world movement and action-bar attacks are blocked and a knockout overlay is shown. The respawn action restores HP and part of MP, returns the player to the Làng Sói Trắng checkpoint, reloads that zone's local NPC/monster entities and resets the world camera. This is a client-side demo rule; original KPAH death penalties, revive items, respawn timers and server validation remain unverified.


## Story quest chain

The offline quest journal now follows a prerequisite sequence: village elder → wolf patrol → forest hunter → cave guardian → return to the village elder. Later quests remain visible but cannot be accepted until the previous quest reward is claimed. The final preparation objective requires returning to the elder. This is a coherent client demo progression, not verified original KPAH quest content.


## Local social, guild and mailbox recovery

The versioned browser save also retains locally added friends, the simulated party roster/invitations, guild membership and personal contribution, plus read/claimed flags for the sample mailbox. Restore only accepts known demo guild/mail IDs and known or locally created friend IDs; transient online status and network delivery are not represented. These features remain local-only simulations.

The extractor also tags decoded entries with a source-pack family (for example effects, NPC, public skills, main UI, fonts or profession previews). This is a verified archive-level grouping only; it does not infer the meaning, frame order or timing of an individual image. The Resource Viewer exposes this family as a filter. The Phaser runtime offers explicit sprite-sheet loading and animation registration/play helpers, but callers must supply measured frame dimensions and verified frame lists. The Sprite Lab also supports explicit animation keys, first/last frame selection or a custom comma-separated frame order, FPS and repeat policy. It exports a copyable JSON definition containing the original asset source, Phaser texture-loader arguments and animation-registration arguments. The asset selector can be narrowed by verified source family and original pack. Playback follows the configured frame range/order and repeat policy. Mapping definitions include the measured grid and can be saved as browser-local drafts for later review; drafts are not synchronized to the server. This is a manual mapping workbench: it does not infer original animation semantics or frame order.


Mobile viewport handling: the app synchronizes its shell and modal height to `visualViewport` when available, falls back to `innerHeight`, and uses 16px chat input text to avoid automatic focus zoom on iOS. Real-device validation is still required.

The world map panel now renders a live schematic from the current zone's world coordinates: player location, NPCs and alive monsters. NPC pins open their existing interaction flow; monster pins select the combat target, with a distinct marker for elite monsters and the current target. The panel remains based on demo zone data, not original KPAH map resources.

The live world map now keeps its player marker synchronized while the character moves. Monster markers follow their current world positions, reflect the selected target, disappear on defeat and return after respawn; the living-monster count updates while the panel is open. DOM synchronization is throttled to 100 ms.

## World movement and obstacle collision

- The illustrative village, forest and cave scenes now register collision geometry alongside the structures, trees and rock formations they draw.
- Tap-to-move, directional controls and combat approach movement resolve their travel path against that geometry, stopping at the last walkable point instead of passing through solid scenery.
- Collision geometry is deliberately limited to the current procedural demo scenery. It is not original KPAH collision data, and the world still needs source-derived map boundaries and obstacle masks.
- Collision resolution samples the requested path at short intervals; it is a lightweight client-side approximation pending a verified tile/collision map.


## Obstacle-aware path sliding

- Improved the local movement resolver: when a direct diagonal path meets a registered obstacle, it also tests horizontal-first and vertical-first routes and selects the valid route that advances furthest.
- This allows the character to slide around the edge of demo scenery instead of always stopping at the first blocked sample. All routes still respect the existing obstacle geometry and walk bounds.
- This remains a lightweight client-side path approximation; it is not a full navigation mesh or source-derived KPAH pathfinding system.


## Character selection roster

After the offline login step, the character-selection screen displays up to three locally saved character entries. Select an existing character to enter the world, create another while a slot is available, or delete an entry after confirmation. The roster is stored separately in browser local storage and never stores the account password. This is a client-only convenience flow; it does not create, delete, restore or synchronize characters on the original game server.


## Per-character offline progress

Each locally created character now has an independent browser save, keyed by its roster ID. Character level/stats, wallet, inventory/equipment, quests, skill progress/loadout, and local social/guild/mail state are restored separately when that character is selected. Switching characters resets the in-memory client models before loading the selected profile. The older single-profile demo save is migrated only when its saved name and profession match the selected roster entry. This remains local browser storage and is not server/account persistence.


## Merchant quantity selection

The offline merchant now supports buying between 1 and 99 units per transaction. Each item row has decrement/increment controls, a numeric quantity field and a live total price. The value is clamped again at purchase time; the existing shop state checks wallet balance and inventory capacity before completing the transaction. Catalog entries and prices remain demo data.


## Character logout and deletion

Leaving the world saves the active local character before returning to the login overlay. Deleting a roster entry also clears that character's separate browser save after validating its local ID, preventing orphaned local progression. These actions affect only this browser's demo data and do not call the original game server.


## Equipment and inventory details

The equipment panel shows equipped item names, attribute bonuses, and the character's effective strength, stamina, agility and spirit. Current/max HP and MP are displayed alongside them. Inventory cards show equipment bonuses or HP/MP restoration values for consumables. Equipping, unequipping and consuming items continue to update shared local character state. All item definitions and values remain demo data pending verified original-game mappings.


## Character roster progress preview

The character-selection roster reads each character's own browser save and shows level, current/next EXP, Xu, occupied inventory slots and the last local save time. Characters without a save are labelled as new. The reader validates the save version and payload and safely falls back if local data is malformed. The roster remains a three-character local demo and does not display server-side character status.


## Per-character world location

Each character's browser-local save now includes the current world zone. Switching between characters restores their individual zone, and entering a restored zone places the player at its entry point while rebuilding that zone's demo NPCs, monsters and ground drops. Zone travel and checkpoint respawn save the new location. Player coordinates and live monster state are not persisted yet.


## Exact character location resume

Per-character browser saves now also store the player's world coordinates. On character selection, the zone is rebuilt and the saved coordinates are passed through the current obstacle-aware movement resolver before restoring the player and camera. Older saves without coordinates remain compatible and use the zone entry point. The client flushes the save on page hide and when the tab becomes hidden. This is still local browser persistence, not server-side character position synchronization.


The character-selection cards also preview the saved zone and rounded world coordinates for each character. Unknown zones and older saves without coordinates use fallback labels, keeping the roster compatible with existing local saves.


## Nearby monster combat

Living monsters in the current offline demo zone now periodically attack when the player is within their engagement radius. Damage is applied through the shared character state and can trigger the existing knockout/checkpoint respawn flow. Attack range, cadence and damage are provisional demo values, not verified original KPAH rules. This is still client-side combat without server authority or multiplayer synchronization.


## Monster aggro and pursuit

In the offline demo world, living monsters acquire the player within a local radius, approach at a bounded speed and attack at close range using per-monster cooldowns. Monster coordinates are shared by the Phaser views and world-map markers. Pursuit steps are blocked by the current procedural scenery collision shapes; there is no navigation mesh, verified original KPAH AI or server-authoritative combat yet. All aggro and movement tuning remains provisional demo behavior.


## Monster leash and spawn recovery

Local monsters now keep their original spawn coordinates and a small AI state. They chase within the demo aggro radius, attack at close range, and return toward their spawn when the player leaves the leash. Respawn restores the spawn position and idle state. Pursuit and return movement try axis-aligned alternatives when a direct step is blocked by the current procedural scenery. This is client-side steering with illustrative values, not original KPAH AI or navigation data.


## Monster attack telegraph

Local monster AI states have distinct overhead cues. Close-range attacks now show a pulsing warning ring for 450 ms before applying damage; moving out of attack range cancels the pending strike. Cooldown and wind-up state are reset on zone changes and respawns. This is provisional offline combat feedback, not a verified original KPAH mechanic.


## Keyboard target selection

Press **Tab** to select the next living monster or **Shift+Tab** to select the previous one. Selection wraps through the current zone's living monsters and updates the world target HUD, ground ring, combat target and open world map. The existing 1–5 action-bar shortcuts are unchanged. These are web-client controls, not verified original KPAH key bindings.


### S2C opcode 17 entity action/effect decoder

The generated world-state codec includes S2C opcode 17, based on the original client's event handler and consumer. It parses the event header, counted effect records and optional trailer bytes in Java and JavaScript. The first short and effect fields remain neutral where CFR output is inconsistent or semantics are not yet verified. Run `npm run check:world-state` and `npm run test:world-state`; CI also compiles and smoke-tests the Java vector. This decoder does not apply combat damage or render effects.


### Bytecode-verified world-state packets

Opcode 7 is now decoded as an update for an existing entity: entity/template IDs, coordinates, current/max HP, two state bytes and one opaque integer. Opcode 17's first short is confirmed by bytecode as the actor entity ID, resolving the prior CFR assignment ambiguity. These decoders remain parse-only; they do not apply authoritative combat or spawn entities.


### S2C ground-item and inventory events (opcodes 18–21)

Added source-traced decoders for partial ground-item pickup records, pickup rewards, typed entity removal and inventory item updates. The codecs preserve signed/unsigned widths, optional defaults and neutral fields; the application layer still needs to apply authoritative inventory/currency changes.


### S2C character feedback and progression events

Added source-traced codecs for overhead chat (27), inventory sale confirmation (28), experience update (30), keyed character resource update (32) and level-up state (33). Opcode 32 exposes its local-character-only trailer through an explicit decoder argument so the parser follows the original branch condition.


### S2C inventory drop and warehouse sale events

Added bytecode-backed parsing for opcode 61 (inventory item dropped to the world with its effect parameters) and opcode 78 (warehouse item sale confirmation). Both are parse-only; the inventory/economy side effects remain application responsibilities.


### S2C opcode 23 inventory/equipment variants

Added a branch-aware decoder for all five opcode 23 subtypes: raw byte list, catalog-backed item IDs, partial item records, static-catalog selection and shop-tab payload. Signed count behavior and the subtype-1 default mode are covered by JS and Java synthetic vectors.


### S2C opcode 25 static item/shop catalog

Added a structured decoder for lookup records, coordinate pairs, five fixed configuration bytes, indexed item definitions, and two shop/catalog lists. Signed/unsigned widths and per-definition error boundaries are retained; catalog-derived UI fields remain outside the protocol parser.


### S2C opcodes 2 and 22

Added source-backed decoders for server-text variants (option list, provider/agent pair, plain message) and the world-entity auxiliary update, including the optional-byte default. Java and JavaScript synthetic vectors cover all branches.
