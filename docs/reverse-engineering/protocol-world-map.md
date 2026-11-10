# KPAH 2.7.8 — map, movement và world entities

> Nguồn: CFR 0.152 decompile của `ka.java`, `jy.java`, `mj.java`, `ca.java`, `cd.java`. Trường được đặt tên nghiệp vụ chỉ khi class usage xác nhận; các trường chưa rõ giữ tên trung tính.

## Client → server

### Opcode 4 — gửi tọa độ di chuyển

- Writer: `jy.h(int x, int y)`.
- Payload: `short x`, `short y` (big-endian).
- Caller: `ca` (player actor, extends `z`) gửi `this.l`, `this.m` trong movement tick, có throttle bằng `mj.av`.
- Trước khi gửi, client kiểm tra `hf.m`, kiểm tra tile/map bounds và điều kiện collision. Vì vậy đây là request tọa độ đã qua client-side movement guard, không phải server-authoritative movement result.

### Opcode 12 — yêu cầu chuyển map/zone

- Writer: `jy.b(int a, int b, int c)`.
- Payload: ba `short` theo thứ tự tham số.
- Caller trong world screen chọn destination object/map; client chuyển sang loading screen `li` và clear một số world state sau khi gửi.
- Ý nghĩa riêng của từng short chưa được xác định đầy đủ; không tự đổi tên thành mapId/x/y nếu chưa trace caller cụ thể.

## Server → client

### Opcode 4 — spawn/update world object

Handler lặp đến khi hết payload. Mỗi record:

| Thứ tự | Kiểu | Ý nghĩa đã xác nhận |
|---:|---|---|
| 1 | byte | entity kind |
| 2 | unsigned byte | template/type ID |
| 3 | short | entity ID |
| 4 | short | X coordinate |
| 5 | short | Y coordinate |
| 6 | byte | state/status |
| 7 | int (optional) | extra numeric value; default `-1` nếu không có |
| 8 | byte (optional, chỉ kind `1`) | extra subtype/state |
| 9 | byte (optional) | extra marker; default `-1` |
| 10 | boolean (optional) | active/visibility-like flag; default `true` |

`mj.a(...)` tạo hoặc cập nhật entity theo kind/template. Factory mapping trong `mj` xác nhận:

- kind `0`: player `z`, hoặc subclass `hd` nếu extra subtype không âm.
- kind `1`: monster/NPC family; template ID chọn `cd` hoặc các subclass như `v`, `u`, `x`, `w`, `hj`, `p`, `q`, `t`, `aj`, `hy`, `cf`.
- kind `3`: `al`; kind `4`: `am`; kinds `6/7`: `ak`; kind `14`: `bq`.

### Opcode 5 — player/character state snapshot

Handler tìm player `z` theo short ID đã tồn tại trong world. Phần prefix bắt buộc:

1. short entity ID
2. UTF character name
3. short X, short Y
4. int current HP, int max HP
5. int current MP, int max MP
6. byte + byte state/class flags
7. raw part/appearance byte array có độ dài lấy từ cấu hình entity hiện tại
8. một short cho mỗi part slot
9. short/byte status, appearance, equipment and action fields tiếp theo

Phía sau còn nhiều extension field được đọc trong các `try/catch` riêng; cần phân tích sâu trước khi đóng băng schema đầy đủ. Handler không tạo player mới nếu entity ID chưa có.

### Opcode 7 — entity state snapshot

Handler đọc một record thành `ce`, rồi cập nhật entity `cd` có ID tương ứng:

| Field trong `ce` | Kiểu | Vai trò được xác nhận qua `cd.a(ce)` |
|---|---|---|
| `a` | short | entity ID |
| `h` | unsigned byte | template/sprite type |
| `b`, `c` | short, short | X, Y |
| `e` | int | current HP |
| `d` | byte | status/state |
| `i` | byte | animation/state marker |
| `f` | int | max HP |
| `g` | int | auxiliary state value |

### Opcode 8 — remove world entity

Payload gồm các short entity ID liên tiếp cho đến hết packet. Mỗi ID được đưa vào `mj.d(short)` để đánh dấu object tương ứng đã bị loại khỏi world list.

### Opcode 12 — map/zone data transition

Payload prefix:

1. short, short, short
2. byte optional (default `-1`)
3. short
4. UTF map/zone label
5. boolean có dữ liệu bổ sung hay không
6. nếu true: phần byte array còn lại của packet

Handler gọi `mj.a(short,short,short,short,String,byte[])` và cập nhật `hf.k`. Chưa khẳng định tên nghiệp vụ chính xác của ba short đầu; giữ nguyên thứ tự cho tới khi trace sâu hơn.

## World entity model đã xác nhận

- `ca extends z`: player-controlled actor; gửi movement request opcode 4.
- `z extends bu`: character/player state model, có name, HP/MP, appearance/part arrays và action state.
- `cd extends bu`: generic world actor/NPC/monster renderer/model; nhận `ce` snapshot và template data.
- `ce`: compact server snapshot record dùng để cập nhật entity `cd`.
- `mj`: world state, entity collection, lookup/factory, spawn/update/remove và map event handling.
- `hf`: map/tile data loader và tile/NPC layer renderer.

## Giới hạn và bước kế tiếp

- Opcode 4/5/7/8/12 đã có cấu trúc đọc và caller/handler source evidence; các optional field và extension của opcode 5/12 cần schema sâu hơn.
- Chưa xác định trọn movement interpolation/path update từ server; opcode 4/7 cung cấp tọa độ spawn/snapshot, còn opcode 4 C2S là request coordinate.
- Chưa có server source hoặc live packet capture để xác nhận server validation, anti-cheat và timing.
- Tiếp theo: phân tích entity movement state machine trong `ca/z/cd`, rồi packet damage/skill/effect và ground drops; không triển khai mô phỏng server trước khi chốt thứ tự field.

