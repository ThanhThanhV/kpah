# KPAH 2.7.8 — server initialization và character data

> Nguồn: CFR 0.152 source của `ka.java`, `mj.java`, `ca.java`, `z.java`, `ku.java`, `hd.java`, `bo.java`, `bk.java`. Các field obfuscated chưa rõ nghiệp vụ được giữ trung tính; không suy ra toàn bộ login sequence nếu chưa có packet capture.

## S2C opcode 1 — global/client configuration

Handler đọc dữ liệu cấu hình dùng chung và kết thúc bằng `km.s.l()`.

| Thứ tự | Kiểu | Runtime destination / ghi chú |
|---:|---|---|
| 1 | byte | `z.cf` movement base step; clamp tối thiểu `3` |
| 2 | short | `mj.aS` |
| 3 | unsigned byte | số skill metadata records; tạo `z.Z` và `ca.S[]` |
| 4 | lặp N: unsigned byte + UTF + UTF + short + boolean | `cv` skill metadata: code, two text fields, numeric field, enabled flag |
| 5 | 5 byte | `z.bw[5]`, class/profession-related config bytes |
| 6 | 5 nhóm: byte count + records (byte + UTF + UTF + int) | `mj.A` vectors; category/label/description/value |
| 7 | optional: short + byte count + unsigned-byte IDs | `mj.Z` và `xg.al` |
| 8 | optional: 5×5×4 byte | `z.cy/cz/cA/cB` 5×5 profession/stat matrices |
| 9 | 4 byte | `mj.ac/ad/ae/af` |
| 10 | byte count + lặp UTF + byte | `ku.ac/ad` string/flag catalog |
| 11 | UTF | support hotline (`ro.i`), persisted in RMS `numbersupport` |
| 12 | byte count + lặp byte/int + byte/int | `mj.bb/bc` paired lookup tables |
| 13 | byte count + lặp byte + UTF | `bq.e/d` catalog |
| 14 | UTF | `GameMidlet.g` |
| 15 | byte tile count + lặp short length + byte[] | tile/resource blobs persisted under `km.M[]` names (`t_hang`, `t_thanh`) |
| 16 | byte flag | consumed before part-data section |
| 17 | byte part count + lặp short length + byte[] | `hd.a(index, data)` character-part data |

Optional sections are guarded by `available()>0` or local try/catch. The exact meaning of every lookup table is not fully resolved. The server's tile count is expected to fit the two named `km.M` slots observed in this client.

## S2C opcode 3 — selected character snapshot

Handler writes into the current player `km.s.t` (`ca extends z`). Confirmed prefix:

| Thứ tự | Kiểu | Destination / semantics |
|---:|---|---|
| 1 | short | character ID `ca.h` |
| 2 | UTF | character name `ca.an` |
| 3 | int | current HP `cG` and `cE` |
| 4 | int | max HP `cH` |
| 5 | int | current MP `bC` |
| 6 | int | max MP `bB` |
| 7 | byte | profession/class-related `aM` |
| 8 | byte | skill class/index `aR` |
| 9–11 | int ×3 | `cV/cW/cX` character numeric stats |
| 12–14 | short ×3 | `cP/cQ/cR` |
| 15–16 | byte ×2 | `da/cY` state flags |
| 17–24 | short ×8 | equipment/attribute slots `aU/aE/aG/aF/aH/aI/aC/aD` |
| 25 | int | `dl` |
| 26 | short | `cb` |
| 27 | byte count + byte[] | skill/action mapping `z.aV` |
| 28 | short | `r` |
| 29–33 | byte fields | `aq/co/cp/cn/cT`; `cT` is movement base step |
| 34 | short | `i` companion/appearance-related ID; optional following byte `af` |
| 35+ | boolean/byte/short/int/UTF groups | flags, counters, status, title/description and optional extension records |

Several trailing field groups are read inside independent `try/catch` blocks and default to `-1` when absent. Do not serialize them as mandatory fields until server-version behavior is confirmed.

## S2C opcode 15 — shop/catalog payloads

First byte is subtype:

- Subtype `0`: short shop/context ID, byte item count, then item `bo` records. Each record includes type byte, item ID, several short/byte properties, UTF description, unsigned-short value and a stat count followed by `(unsigned-byte statId, short statValue)` pairs. Trailer includes category/mode bytes, five short values, optional UTF/byte pair and optional `l` shop context record. Handler calls `mj.a(...)` to populate the shop/list panel.
- Other subtype: short context ID, signed-byte item count, `bo` records, byte frame count, then remaining packet bytes decoded as an image atlas; handler calculates frame width/height and updates the shop UI.

Opcode 15 is lazy shop/catalog data; do not assume it is always part of the initial login exchange.

## S2C opcode 16 — character inventory/skill extension

First byte is mode; handler creates `int[]` sized by global skill count `z.Z` and calls `mj.s.a(currency, skillValues, itemVector, auxiliaryVector, mode)`.

| Mode | Data read |
|---:|---|
| `0` | long currency; unsigned-byte count; each record: unsigned-byte skill index + int skill value; updates `ca.S[index].a` and skill value array |
| `1` | short item count; each item `bo` includes type, ID, property shorts/bytes, UTF description, unsigned-short value and stat pairs; then character currency/state int |
| `2` | two byte-counted collections of `k` records containing short IDs, byte flags, UTF text, optional int value and timestamps |
| `3` | byte count followed by short array, stored as `ca.T` |

Some fields (`aY`, `aZ`) are currency/state counters; exact split between wallet, market balance and auxiliary points requires caller/UI trace. The item model `bo` is shared with shop/trade packets but mode 1 has its own field order.

## Related initialization packets

- S2C opcode `5`: full player/entity snapshot for a character already present in world; it reuses many of opcode 3's `z` fields but is not the selected-character bootstrap packet.
- S2C opcode `12`: map transition and optional map data; see [protocol-world-map.md](./protocol-world-map.md).
- S2C opcode `13`: character roster; see [protocol-auth-character.md](./protocol-auth-character.md).
- S2C opcode `15`: shop catalog/assets; S2C opcode `16`: inventory/skill/auxiliary character state.

## Server bootstrap dependency order — evidence vs open questions

1. Opcode `1` populates shared skill metadata, class lookup tables, tile blobs, part data and client configuration.
2. Opcode `13` supplies the roster after authentication.
3. Character selection sends C2S opcode `13` subcommand `1`; server then sends selected-character state (opcode `3`) and world/map data (opcode `12`) in the observed client flow.
4. Opcode `16` supplies character inventory/skill/auxiliary state; opcode `15` is requested/received for shop panels.
5. In-world entity snapshots use opcode `4/5/7`, separate from player bootstrap.

The exact ordering of opcodes `3`, `12`, `16` and any additional initialization messages must be confirmed from a captured session; the client code only establishes their individual handlers and required destination objects.

## B16 chưa hoàn tất

- Chưa phân loại hết các lookup arrays trong opcode 1 hoặc gán semantic names cho toàn bộ numeric fields.
- Chưa xác định toàn bộ skill metadata mapping, profession growth curves, item templates, tile/object catalogs và part binary schema.
- Chưa có live packet capture để xác nhận server send order, optional-field versioning và error/retry behavior.
- Tiếp theo: trace `cv`, `ia`, `hd`, `bo`, `bk`, `ku` consumers; map mỗi field tới UI/runtime reader và tạo bảng required/optional cho protocol spec.

