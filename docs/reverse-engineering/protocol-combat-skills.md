# KPAH 2.7.8 — combat, skill cast và effect events

> Nguồn: CFR 0.152 source của `jy`, `ka`, `mj`, `z`, `cd`, `bu`, `e`. Payload field order được ghi theo source; tên như damage/currentHP chỉ dùng khi handler cập nhật đúng field runtime.

## Client → server

### Opcode 51 — cast skill lên target

Writer `jy.a(short targetId, byte ignored, byte skillCode, short ignored)` ghi payload:

1. byte subcommand `1`
2. short target entity ID
3. byte `0`
4. byte skill code (caller lấy từ skill mapping theo profession/slot)
5. short `0`

Caller trong `mj` kiểm tra skill slot, MP cost và cooldown trước khi gửi; nếu target là world entity, `targetId` là `this.u.h`. Một số skill path gọi cùng writer với skill code khác. Đây là request cast; client-side MP/cooldown mutation không thay thế server validation.

## Server → client damage events

### Opcode 6 và opcode 9 — attack/damage variants

Cả hai handler đọc cùng cấu trúc 9 field và gọi hai nhánh xử lý tương ứng trong `mj`:

| Thứ tự | Kiểu | Ý nghĩa theo handler |
|---:|---|---|
| 1 | short | attacker entity ID |
| 2 | short | target entity ID |
| 3 | byte | attack/skill action code |
| 4 | int | damage value dùng để hiển thị floating damage |
| 5 | int | target current HP sau event; được ghi qua `a_(int)` vào HP runtime |
| 6 | byte | hit/effect style |
| 7 | byte | hit count / repeat display count ở một nhánh |
| 8 | byte | flag điều khiển effect/status marker |
| 9 | byte | animation/effect variant |

`mj.a(...)` và `mj.b(...)` cập nhật HP target, hiển thị damage, kiểm tra death state và kích hoạt attacker animation. Hai opcode dùng hai nhánh xử lý khác nhau, không gộp thành một packet type trong implementation.

### Opcode 10 — direct hit/HP result

Payload: short source ID, short target ID, int damage, int target current HP. Handler cập nhật HP; nếu damage bằng 0, client hiển thị `MISS`; nếu có damage, tạo floating damage và hit animation.

### Opcode 83 — multi-target HP update

Handler đọc source ID (short), action/type byte, target count byte; mỗi target có short entity ID, int auxiliary/current value và int current HP. Sau danh sách còn hai unsigned byte state values được chuyển vào entity action/state. Đây là batch HP update, không phải movement packet.

### Opcode 106 — multi-target attack event

Handler `mj.a(acu)` đọc source ID, action type, damage, effect flags và target count; mỗi target record có short entity ID và int HP value. Client cập nhật HP từng target, floating damage và gửi danh sách target cho attacker animation controller.

## Skill/buff/effect events

### Opcode -74 — timed effect attached to an entity

Handler `mj.C(acu)` hiện xử lý subcommand byte `0`:

1. byte subcommand
2. byte entity kind
3. short entity ID
4. short effect/skill ID
5. int duration (nếu dương, đổi thành expiry timestamp)
6. boolean flags A và B
7. byte effect variant (optional)

Handler tìm entity theo ID/kind và gọi method attach effect với effect ID, vị trí entity, expiry và flags. Đây là event gắn effect có thời hạn; chưa gán mọi ID thành buff hay debuff vì cùng pipeline có thể phục vụ animation/effect khác.

### Opcode -71 — effect/buff object lifecycle

Payload prefix được đọc theo thứ tự: byte action, short effect ID, short entity ID, long expiry/time, byte X tile, byte Y tile, byte entity kind, byte attach/remove mode, byte state; int auxiliary có thể có thêm.

- Entity kind `0` được tra trong player/entity lookup; kind khác tra trong NPC/monster lookup.
- Nếu action bằng `1` và attach mode bằng `0`, handler tìm effect cùng ID trong entity effect list; mode `1` đặt expiry về `0` để loại effect; mode `0` thêm effect mới.
- Các nhánh khác có thể gắn effect trực tiếp vào entity hoặc thêm effect object vào world effect list.

Không dùng field `long` như cooldown duration khi chưa xác định clock semantics; source lưu nó vào `e.b` và effect runtime tự kiểm tra expiry.

### Opcode -73 — effect-object target links và entity visual-effect overlay

Handler `ka.java:case-73` dispatch đến `mj.A(acu)`, có hai nhánh đã xác minh:

- **Branch 0**: short source entity ID, byte branch = 0, short effect ID, signed-byte target count; mỗi target gồm byte entity kind, short entity ID và hai int. Source tìm effect object bằng `mj.d(id, 12)`, resolve từng target bằng cặp kind + ID, rồi gọi `j.a(Vector, byte, short, int[], int[])`. Lớp effect actor `hz` có cùng entity ID với source actor (`hz` constructor copy `j2.h`) nhưng là object riêng trong `mj.o`, được tra theo cặp (ID, kind 12); không thể biểu diễn nó bằng cách ghi đè player trong map chỉ-key-ID. Trong `hz.b()` (state 2), actor chỉ di chuyển về target đầu tiên; khi vào ngưỡng 30 px và chờ thêm 7 update ticks, nó áp dụng đồng thời toàn bộ target records: int thứ nhất được đưa vào `km.s.a(String.valueOf(value), ...)` để hiển thị sát thương; int thứ hai truyền vào `target.f(value)`, và `bu.f(int)` gán vào `cG` (HP hiện tại). Sau đó `target.a(effectId, target.x, target.y, 0L, ...)` kích hoạt visual effect trên từng target. Vì vậy codec dùng `damageValue` và `targetCurrentHp`. Browser hiện lưu target-linked event riêng; chưa mô phỏng actor `hz` hoặc áp dụng các side effects này.
- **Branch 1**: short entity ID, byte branch = 1, short effect ID và signed 64-bit time/expiry. Source tìm entity theo ID rồi gọi `bu.a(effectId, entity.x, entity.y, long)`; implementation `bu` thêm hoặc cập nhật record cùng effect ID trong collection `dg` (được render qua pipeline effect overlay). Browser giữ collection riêng `effectOverlays` và giữ long dưới dạng BigInt.
- Các branch byte khác không được parser đoán cấu trúc; payload còn lại được giữ opaque. Branch 0 chỉ gắn target list khi source object đã tồn tại với kind 12; mỗi target chỉ được đánh dấu resolved khi cả ID và kind khớp. Branch 1 chỉ cập nhật overlay khi entity đã tồn tại.

Đây là hai cơ chế effect khác nhau: liên kết một effect object với nhiều target/offset, và gắn một visual overlay vào entity. Chưa hoàn thiện mô phỏng chuyển động/animation của actor loại 12 trong browser; không suy diễn hai int thành offset tọa độ. Branch 0 chỉ mô tả sát thương và HP đích theo handler đã truy vết.

### Effect image resource request — opcode -51

Source trace confirms the resource-fetch path used by entity effect overlays:

- Opcode 26 loads effect-definition records into `d.i`; each record is keyed by a signed-short effect/resource ID and contains binary frame/animation definition bytes.
- When the original overlay renderer asks `mi.a(effectId)` for its image and no image is cached, `mi.a(short)` sends C2S opcode -51 with only that signed-short resource ID (`jy.j(short)`).
- S2C opcode -51 reads the same short ID and treats every remaining byte as an image passed to `Image.createImage`.

The browser retains opcode 26 effect-definition bytes and now parses the source-backed `d.a(byte[])` format:

- A signed-byte region count followed by five unsigned bytes per region; the original `h` object uses bytes 2–5 as atlas x/y/width/height while byte 1 is retained as `headerTag`.
- A signed-short frame count; each frame has a signed-byte part count. Each part contains destination x/y shorts, region index byte, four auxiliary bytes/shorts as present in source, and a group flag byte. Group flag zero and nonzero are retained separately, matching the original `f.c` / `f.b` vectors.
- An unsigned-byte frame-sequence count followed by short entries (the original casts these to byte), one preserved header byte, then three signed-byte-length auxiliary arrays corresponding to `m[0]`, `m[1]`, and `m[3]`.
- Bounds and negative-count checks reject truncated or invalid definitions. Unconsumed tail bytes remain visible.

The browser still retains opcode 26 effect-definition bytes, requests each active branch-1 overlay image once when its definition is available, and stores S2C -51 image bytes by resource ID. **It does not yet render the parsed frames.** The original `d.a(Graphics,...)` renderer crops each region rectangle from the image returned by `mi.a(effectId)`, applies per-part placement and optional horizontal flip, and draws the two frame groups in separate passes. The original `km.run()` loop targets a 40 ms update interval (`Thread.sleep(40L - elapsed)`), and the world update calls `bu.b()`, which invokes `bu.R()` and advances each `d` once. The browser renderer now uses a 40 ms accumulator, decodes the returned image bytes, composes each frame from its atlas crops, and draws it at the entity's world position. It preserves the original two frame groups as separate ordered passes. The renderer does not infer horizontal flip from the decompiler's auxiliary record; that field remains raw. The browser now also has a pure playback cursor that mirrors the three constructor modes: `expiry=-1` loops, `expiry=0` plays once, and any other long value loops until it is earlier than the supplied epoch-millisecond clock. Each advance represents exactly one source `d.a()` invocation; the Phaser scene still needs to decide when to call it. A frame-part resolver maps the two groups to atlas crop rectangles without inventing flip behavior from the decompiler's auxiliary record.

## Các giới hạn gameplay

- Damage event cung cấp cả damage display và HP value sau event; không suy ra công thức damage, crit chance, defense hay server-side mitigation chỉ từ packet này.
- C2S opcode 51 chỉ xác nhận request cast skill và field order; cooldown, MP cost, target validation và skill result do server quyết định vẫn cần xác minh từ response.
- Opcode -74/-71/-73 chứng minh client có effect attachment pipeline; chưa đủ để khẳng định toàn bộ buff/debuff stacking, dispel, duration refresh và immunity rules.
- Tiếp theo: map từng skill code theo profession/level, trace skill animation resource IDs, rồi đối chiếu combat events với các handler còn lại và data tables.



## Browser world-state integration — opcode 6/9

The browser reducer now preserves the two original handler branches separately
and adds explicit source-backed aliases to each event:

- `attackerEntityId` = first signed-short entity ID.
- `targetEntityId` = second signed-short entity ID.
- `damage` = damage integer used by the original floating-damage display.
- `targetCurrentHp` = target HP integer written by the original handler.

When the target entity is already present, its `currentHp` is updated immutably.
Events receive a monotonic sequence number; the retained history is bounded to
100 events without resetting the sequence. The Phaser scene consumes each new
event once and displays the raw damage value above the target, then fades it
upward. The presentation deliberately uses neutral white text: the remaining
style/flag bytes are preserved but are not yet interpreted as critical, miss,
element, or status semantics.

This does not calculate damage, mutate local character progression, or claim
server-authoritative combat simulation. Opcode 10's separately documented
zero-damage MISS behavior is not inferred for opcodes 6/9.

## Browser world-state integration — opcodes 10/83/106

- Opcode 10 is decoded as two signed shorts and two signed ints, then retained as a bounded neutral world event. The dispatcher forwards the four values to the active world scene; no position/effect meaning is assigned in the browser until the scene consumer is traced.
- Opcode 83 is decoded only when the source entity exists, matching the original handler guard. Each target record retains its entity ID and two integer values without assigning speculative field names; the two optional unsigned bytes are preserved. Known targets retain these values under opcode83State.
- Opcode 106 retains the shared damage value, three effect bytes, and the list of target/current-HP records. Known targets receive the source-backed current HP update. One multi-target combat event is emitted for the Phaser combat-event consumer; the effect bytes remain uninterpreted.

All three packet variants preserve unknown/trailing data where available. These reducers do not calculate damage, infer critical hits, or assign animation semantics to opaque bytes.

## Browser world-state integration — opcode -74

The generated decoder handles the verified mj.C(acu) subcommand 0 layout: entity kind, entity ID, effect ID, signed duration value, two booleans and an optional variant byte. Other subcommands are retained as unconsumed bytes and are not interpreted as this variant.

The reducer attaches the raw effect record only when both entity ID and entity kind match a currently known world entity. It preserves the original duration value and flags; it does not invent a local expiry clock, classify the effect as buff/debuff, or apply stat changes. If the target is not present or the kind differs, the packet remains in the bounded world-event history with attachedToKnownEntity=false.

## Browser world-state integration — opcode -71

The decoder retains the verified common prefix: action, effect ID, entity ID, signed 64-bit expiry/time value, tile coordinates, entity kind, attach/remove mode, state byte and an optional auxiliary int. The 64-bit value remains a BigInt and is not converted to a local duration or clock.

For the source-confirmed action 1 branch, attach mode 0 adds or refreshes the matching effect record on a known entity; attach mode 1 sets the matching record expiry value to zero, mirroring the original lifecycle behavior rather than deleting it immediately. The reducer requires both entity ID and entity kind to match. Other actions/modes remain recorded but do not mutate entity state. This does not implement visual effect assets, stat modifiers, buff/debuff classification or client-side expiry scheduling.
