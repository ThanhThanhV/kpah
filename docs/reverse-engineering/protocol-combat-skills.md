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

### Opcode -73 — extended entity/effect attachment

Handler `mj.A(acu)` chứa nhiều nhánh: đọc entity ID/type, danh sách target/offset/int pairs và long time value; gắn vector/effect vào entity hoặc tạo effect trên world. Cấu trúc có nhiều optional branch; được giữ ở trạng thái chưa annotate đầy đủ thay vì đoán semantics.

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
