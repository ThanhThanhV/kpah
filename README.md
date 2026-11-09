# Khí Phách Anh Hùng — Web recreation

Bản tái hiện client giao diện KPAH từ tài liệu tham chiếu `KPAH_278.jar` (MIDlet 1.5.9, MIDP 2.0 / CLDC 1.0).

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
