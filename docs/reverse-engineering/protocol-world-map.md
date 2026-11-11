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

The generated decoder requires the source-defined fixed array sizes from z: bF/bH are seven entries and ca is five entries. The packet starts with an existing entity ID (short), UTF name, X/Y shorts, current/max HP and MP ints, profession/class bytes, seven part bytes, seven part-slot shorts, then r/s/cW/cX/cY/da, co wire byte, cp/cn/cT, i/db, optional af when i != -1, aS, five ca shorts, bM boolean, the trade-panel boolean, t/u bytes and ak boolean.

The co byte is retained as coWire; the client normalizes co to coWire - 1 only when coWire >= 0. A negative co byte leaves the existing entity value unchanged, so the decoder returns coNormalized=null in that case.

After the required body, each optional group has its own catch/default behavior:

- short + byte, defaults -1/-1
- short + byte + short, defaults -1/-1/-1
- three shorts, defaults -1/-1/-1
- signed-byte count followed by repeated short + byte pairs; negative count or truncated data skips applying this mapping
- short bf, default -1
- byte bi + short bn + byte bj + byte bk, defaults -1/-1/0/0
- byte bm + short bo + byte bl, defaults -1/-1/0

The handler only applies this packet when the world is active and the target entity already exists. It recalculates derived entity state with z.L(), updates the world through mj.a(z), and may open the trade panel based on the packet boolean. The decoder returns the data and does not itself mutate a world entity or open UI.

### Opcode 7 — entity state snapshot

Handler đọc một record thành `ce`, rồi cập nhật entity `cd` có ID tương ứng:

| Field trong `ce` | Kiểu | Vai trò được xác nhận qua `cd.a(ce)` |
|---|---|---|
| `a` | short | intended entity lookup key in `mj.a(ce)`, but CFR shows the read assigned to a temporary `new ce()` rather than the retained record; unresolved pending bytecode verification |
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

## Entity movement state machine — CFR cd/ca

- `cd.a(ce)` applies an entity snapshot. It copies `ce.g` to the entity update interval `E`, applies `ce.e` to current/max HP state, and sets the template/type `R = ce.h`. When the entity is the locally controlled actor (`cd.a == true`), it writes `ce.b/ce.c` directly to current `l/m`; otherwise it stores them as movement targets `M/N` for interpolation. It also applies status `ce.d` and max HP `ce.f`.
- Movement speed `cT` is not a fixed global constant: it is loaded from the selected entity template `ku.T[R].c` and refreshed in `cd.b()`; the same template supplies animation/state metadata. Do not hardcode a single speed for all NPC/monster types.
- In `cd.b()`, movement states `w = 2, 6, 7` route through `y()`; `cd.c(x,y)` uses the same axis-priority stepping rule for explicit targets. Each update first snaps X when `abs(x-targetX) <= cT`, and snaps Y when `abs(y-targetY) < cT`; otherwise it advances one axis by exactly `cT`, prioritizing X before Y. It does not use a diagonal normalized vector or time-based tween.
- Facing/direction `cO`: `0` down, `1` up, `2` left, `3` right. The direction is updated when the selected axis moves. A snapshot for a remote actor therefore means “move toward target at template speed,” not “teleport to the received coordinate.”
- Player-controlled `ca.b()` sends C2S opcode 4 using the current `l/m` coordinate after the movement-send throttle `mj.av`; collision and tile checks occur client-side before the request. This is distinct from S2C opcode 4 spawn/update records and S2C opcode 5 entity snapshots.

## Generated packet decoders — S2C opcode 4, 8 and 12

The JavaScript and Java generated world-state codec covers opcodes 4, 6, 8, 9 and 12; opcode 5 has its own dedicated codec because it must guard on whether the target entity already exists:

- Opcode 4: repeated entity spawn/update records. Fields are kind (signed byte), template ID (unsigned byte), entity ID/X/Y (shorts), state byte, optional int (default -1), optional subtype byte for kind 1 only (default 0), optional marker byte (default -1), and optional boolean (default true). The optional reads are individually caught and preserve DataInputStream's partial-read cursor behavior.
- Opcode 5 (dedicated ProtocolOpcode5Codec): an existing player/entity snapshot with fixed seven-part and five-appearance arrays, normalized co state, a trade-panel flag and independently guarded extension groups, including the counted short/byte mapping.
- Opcodes 6 and 9: fixed combat-event records containing two signed entity IDs, one byte, two ints and four bytes. They are kept under neutral wire names because the meaning of the fields depends on which side is the local player and on the receiving mj.a/mj.b branch.
- Opcode 8: repeated signed-short entity IDs passed to mj.d(short) for removal.
- Opcode 12: three leading shorts, optional byte hfK (default -1), fourth short, UTF label, optional boolean and remaining map bytes when true. The decoder keeps the four shorts neutral because their exact business meanings are not fully proven.

Opcode 7 is deliberately not included in the generated decoder yet. CFR renders the first short as assignment to new ce().a rather than the retained ce2.a, but mj.a(ce) later looks up cd using ce.a. Since the decompiled assignment and runtime consumer disagree, that first short's destination must be verified from bytecode before labeling it entityId or generating a typed record.

Generator and checks:

```bash
npm run generate:world-state
npm run check:world-state
npm run test:world-state
```

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

