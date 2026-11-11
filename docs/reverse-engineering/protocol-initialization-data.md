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

### Opcode 1 — typed global configuration decoder

A separate generated decoder now covers the handler's observed section order. It returns neutral field names where consumers are not known and preserves the part-data section's best-effort error behavior:

1. Signed movement byte (also returns the client-effective value clamped to at least 3), ticket price short, unsigned-byte skill count and skill records (icon ID, UTF name, UTF description, cooldown short, enabled boolean). Skill point counters start at zero locally; opcode 16 later supplies the server values.
2. Five signed profession slot-count bytes, followed by five profession catalogs. Each catalog uses a signed-byte count and records of one consumed byte, two UTF strings and an int. The consumed byte is exposed as discardedByte because CFR assigns it to a temporary ia instance.
3. If any bytes remain after the five catalogs, parse the optional auxiliary short, unsigned-byte unlocked-ID list and 5×5×4 signed-byte matrices. This follows the literal available()>0 check in ka.java; it is not an independently length-framed section.
4. Four global bytes; signed-byte stat-label count with UTF+byte records; support-hotline UTF; signed-byte paired-lookup count with byte/int/byte/int rows; signed-byte quest-objective count with byte+UTF records; external URL UTF.
5. Signed-byte tile count and short-length-prefixed tile blobs. The only verified keys in km.M are t_hang and t_thanh, so the decoder rejects counts beyond those two keys rather than inventing names.
6. One consumed part-data flag, then the best-effort signed-byte part count and short-length-prefixed blobs. ka.java clears hd.a and catches errors in this final section; the decoder returns successfully parsed records plus partDataError and any unconsumed tail.

The generated decoder does not assign business meaning to the four global bytes, auxiliary matrix cells, paired lookup values or part-data bytes. The ia byte is explicitly marked discarded pending bytecode verification of the CFR temporary-object assignment.

Generator and checks:

```bash
npm run generate:opcode1
npm run check:opcode1
npm run test:opcode1
```

### Opcode 1 lookup consumers — deeper trace

The cv records are skill definitions, not player-owned item records. The loader sets d to the array index, e to the skill icon/resource ID, g/h to name and description, c to the cooldown value and f to the enabled flag. The live state is held in a/b: the UI and validation compare a - b to show remaining upgrade points, and skill upgrade requests are bounded by that difference. The skill quick-slot renderer uses e as the icon and c for cooldown display.

The five z.bw bytes are per-profession skill/action-slot counts: z.A() returns bw[aR], and skill/equipment panels use that value to size the profession-specific slot grid.

The five mj.A vectors are profession-specific skill-description/catalog rows. Each record reads a byte, two UTF strings and an int; the two strings are displayed as skill name and description, and the int is shown as the skill's coin cost. CFR assigns the initial byte through new ia().c rather than the retained ia2 instance, while the UI later reads ia.c. Treat that icon/category byte as a bytecode-review item rather than silently repairing the decompiler output.

Further confirmed destinations:

- mj.aS is used as the ticket price in the boat/travel menu.
- ku.ad is indexed by item-stat ID (bk.c() - 10) when rendering equipment stat labels. ku.ac is loaded beside it but no consumer was found in the current CFR source scan.
- bq.e/d is a quest objective catalog: bq.e supplies the icon/resource byte and bq.d the displayed objective/item name used by quest progress text.
- GameMidlet.g is a URL later passed to platformRequest from the menu.
- Tile blobs are stored using the two named keys t_hang and t_thanh. The later part-data table is stored in hd.a, a static map keyed by record index and consumed by the hd character-part renderer.
- mj.Z, the four mj.ac/ad/ae/af bytes, the z.cy/cz/cA/cB matrices and paired mj.bb/bc arrays are populated by this handler, but their runtime consumer was not found in the scanned CFR source. They remain neutral lookup/config data; no business meaning is assigned.

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

### Opcode 3 — optional character extension groups

The typed prefix decoder stops after the 33 fixed fields ending at cT. CFR ka.java then continues inside independently guarded reads; the handler does not expose one contiguous, fully required extension schema.

Immediately after the prefix:

1. Read short i. If i != -1, read byte af. If the resulting current-player af is 0, read a boolean into global z.ae.
2. Read boolean bM; bytes e, t and u; short cd; int cc; short ce; int dm; UTF dn; boolean ak.
3. Optional pair A: short + byte, passed to the current character's a(short,int) method. If either read fails, both local values default to -1.
4. Optional triple B: short + byte + short, passed to a(int,int,int); defaults are -1/-1/-1 on read failure.
5. Optional triple C: three shorts, passed to a(short,short,short); defaults are -1/-1/-1 on read failure.
6. Optional mapping: signed-byte count, repeated short + byte pairs, then UTF text. The pair arrays are passed to the character; the UTF text is parsed with kw.a(text, "@") into xg.n. Any failure is swallowed by this group's catch.
7. Optional short bf; defaults to -1 on read failure.
8. After the main character block, a separately guarded group reads byte bi, short bn, byte bj, byte bk; fallback values are -1, -1, 0, 0.
9. A final separately guarded group reads byte bm, short bo, byte bl; fallback values are -1, -1, 0.

The client calls km.s.j() after these groups. These are not all-or-nothing optional fields: each try/catch has its own defaults and the input cursor is not rewound after a partially consumed group. The current generated opcode 3 decoder intentionally returns this area as opaque trailing bytes; do not decode it as one fixed block until each consumer and truncation behavior is tested.

The independently guarded extension groups now also have a separate generated decoder. It accepts only the trailing bytes returned by the opcode 3 fixed-prefix decoder; it does not accept a full opcode 3 packet. It reproduces the per-group fallback values and does not rewind the reader after a partially consumed group. The counted mapping group exposes its short/byte pairs and raw UTF string; it does not invent the semantics of kw.a's parsed mapping.

```bash
npm run generate:opcode3-extension
npm run check:opcode3-extension
npm run test:opcode3-extension
```

## S2C opcode 15 — shop/catalog payloads

First byte is subtype:

- Subtype `0`: short shop/context ID, byte item count, then item `bo` records. Each record includes type byte, item ID, several short/byte properties, UTF description, unsigned-short value and a stat count followed by `(unsigned-byte statId, short statValue)` pairs. Trailer includes category/mode bytes, five short values, optional UTF/byte pair and optional `l` shop context record. Handler calls `mj.a(...)` to populate the shop/list panel.
- Other subtype: short context ID, signed-byte item count, `bo` records, byte frame count, then remaining packet bytes decoded as an image atlas; handler calculates frame width/height and updates the shop UI.

Opcode 15 is lazy shop/catalog data; do not assume it is always part of the initial login exchange.

## S2C opcode 16 — character inventory/skill extension

First byte is mode; handler creates `int[]` sized by global skill count `z.Z` and calls `mj.s.a(currency, skillValues, itemVector, auxiliaryVector, mode)`.

| Mode | Data read |
|---:|---|
| `0` | long currency; unsigned-byte count; each record: unsigned-byte skill index + int skill value; then common `aY` int and `aZ` int; updates `ca.S[index].a` and skill value array |
| `1` | signed short item count; each `bo` item consumes a type byte, item/property shorts and bytes, UTF description, unsigned-short value, signed-byte stat count with `(unsigned-byte statId, short statValue)` pairs, then a final byte; common `aY` and `aZ` ints follow the mode-specific section |
| `2` | common `aY` int; first signed-byte-counted collection (`discarded short`, discarded byte, `h`, `c`, UTF `b`, UTF `a`, `d`); second signed-byte-counted collection (`discarded short`, discarded byte, `h`, UTF `b`, discarded byte, UTF `a`, int `g`, `d`); common `aZ` int |
| `3` | common `aY` int; signed-byte count followed by short array stored as `ca.T`; common `aZ` int |

Some fields (`aY`, `aZ`) are currency/state counters; exact split between wallet, market balance and auxiliary points requires caller/UI trace. The mode-1 item model is `bo` and is assigned to `z.bx` for the inventory UI. The decoder keeps original field names where business semantics are not independently verified. Mode 2 builds two typed auxiliary collections in packet order; `mj.java` assigns their combined vector to `z.by`. `k.java` defines `a/b` as strings, `c/d/h` as bytes, `e` as short, `f` as long, and `g` as int. The first collection populates `h/c/b/a/d`; the second populates `h/b/a/g/d` and sets `f` to local receive time. `acf.java` renders `b + ' lv' + c` with `a` when `d == 0`; otherwise it calculates remaining minutes from `g` and `f`. `acg.java` renders the icon from `h + 7500`. The packet's short and some bytes are consumed into discarded temporary values, not stored on the final `k` instance. The decoder preserves those as explicitly discarded wire fields. Mode 3 values populate `ca.T` and are rendered with the `bq.d/e` item catalog. In `xg`, `aY` is displayed with the `l` suffix and participates in purchase affordability checks; `aZ` is displayed with the `lk` suffix. The exact business name of `aZ` remains unverified. The item model `bo` is shared with shop/trade packets but mode 1 has its own field order.

## S2C opcode 15 — shop context and pet-equipment atlas

CFR evidence: ka.java case 15 and the two destination overloads in mj.java.

The first signed byte is the subtype; the next fields are always target character ID (short) and signed-byte item count. The item record is read in this exact order:

- itemType:i8, i:i16, r:i16, s:i8, y:i8, v:i16, u:i16
- K:i8, L:i8, n:i8, o:i8, p:i8, q:i8, C:i8, d:UTF
- For subtype 0 only: w:u16
- Signed-byte stat count, then repeated statId:u8, statValue:i16

Subtype 0 (shop/context variant):

1. Read the item list above. bo.F is set locally and bo.x is initialized to client receive time; neither is transmitted.
2. Read byte aS, then five shorts (ca array).
3. Read optionalTextSentinel. If it is not -1, read UTF text and one byte (am).
4. Read optionalContextSentinel. If it is not -1, consume one byte, one short (l.S), one byte (l.M), UTF (l.Y) and int (l.V). CFR shows the first byte assigned to a newly constructed, otherwise discarded l object, so it is retained as discardedTypeByte rather than falsely assigned to the context instance. The client initializes l.X to receive time, l.U/l.T to zero and l.g to 12.
5. mj.a(short, Vector, byte, byte, String, l, short[], byte) applies the list and context to the selected/local character or matching remote character.

Any non-zero subtype (pet-equipment image variant):

1. Read the same item record but without w; the signed-byte stat count follows UTF d directly.
2. If the signed item count is negative, the original handler exits this branch without updating the character; remaining bytes are not interpreted. The decoder preserves them as unparsedBytes.
3. Otherwise read signed-byte frame count; every remaining byte is the packed image passed to ku.b. The client decodes the image, gets its width and height, calculates frame height as image height divided by frame count, and chooses layout code 3 when frame count is 3, otherwise 6.
4. mj.a(short, Vector, Image, byte, int, int, byte) stores the image, frame count, calculated dimensions and layout code on the target character and opens the pet-equipment panel for a remote target.

Signed item/stat counts follow the original loops: a negative subtype-0 item count or negative stat count produces zero loop iterations; a negative non-zero subtype item count skips the update branch. The decoder does not reinterpret image bytes or guess image dimensions before actual image decoding.

The schema and generated decoders are in protocol/protocol.yaml (variantSchemas), src/protocol/generated/opcode15-codec.js and ProtocolOpcode15Codec.java. Tests cover both branches, field order, optional sentinels, negative counts, UTF, stats and opaque image bytes.

Generator and checks:

```bash
npm run generate:opcode15
npm run check:opcode15
npm run test:opcode15
```

## S2C opcode 5 — world entity snapshot decoder

The opcode 5 handler first checks that the world scene is active, reads a signed-short entity ID, and resolves that ID against an already-known client entity. If no entity exists, it returns immediately after consuming only the ID; it does not construct an entity from this packet.

For a known entity, the decoder reads the ordered base snapshot:

- UTF name; two signed-short coordinates; four signed ints retained as neutral combat-state values.
- Two action bytes; exactly seven appearance bytes and seven appearance shorts (the source entity class initializes these arrays to length seven).
- A short, byte, two shorts and two bytes; a nonnegative co wire byte is converted to wireValue - 1, otherwise co is left unchanged.
- cp, cn, cT bytes; i short; db byte; af byte only when i != -1; aS byte; five short ca values.
- bM boolean and the presence boolean (the original handler invokes mj.a(entity) before reading this presence flag; a true value triggers km.s.G.u(entityId)).
- t/u bytes and ak boolean.

The tail has independently guarded pair-A, triple-B, triple-C, bf-short, group-D and group-E reads. Their fallback values match the source handler and the reader is not rewound on a partial read. Unknown field meanings are intentionally neutral in the codec; mj.a, entity refresh L() and guild-side side effects remain application behavior, not packet decoding.

The generated Java and JS codecs accept an explicit entityExists guard because the original client resolves an existing entity before consuming the rest of the record. They do not fabricate a new world entity when that lookup fails.

```bash
npm run generate:opcode5
npm run check:opcode5
npm run test:opcode5
```

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

## Opcode 3 — typed prefix decoder

The first 33 fields are now represented as an explicitly partial S2C prefix schema in `protocol/protocol.yaml` (`prefixSchemas`). The generated JavaScript and Java decoders read, in order:

- Character ID/name, HP/MP current and maximum.
- Profession/class bytes and the three numeric values `cV/cW/cX`.
- Three short values `cP/cQ/cR`, two state bytes `da/cY`, and eight short slots retaining the original obfuscated destination names.
- `dl`, `cb`, the byte-counted action mapping, `r`, then `aq/co/cp/cn/cT`.

The decoder returns any remaining bytes as `trailingBytes`; it does not pretend the independently guarded optional/extension fields are understood. The command catalog still labels full opcode 3 payload as opaque. This prefix decoder is not a full packet schema and must not be used to construct server responses.

Generator and checks:

```bash
npm run generate:prefix-protocol
npm run check:prefix-protocol
npm run test:prefix-protocol
```

## Opcode 16 — typed mode 0 decoder

The verified mode-0 layout is now represented in `protocol/protocol.yaml` (`modeSchemas`) and decoded by generated JavaScript and Java code:

1. Mode byte (`0`).
2. Signed Java `long` currency (`i64`, big-endian).
3. Unsigned-byte skill record count.
4. Repeated records: unsigned-byte skill index, signed 32-bit skill value.
5. Common signed 32-bit fields `aY` and `aZ`, read by the handler for every mode.

The decoder preserves the full 64-bit currency value (JavaScript `BigInt`; Java `long`) and returns skill records in wire order and preserves `aY`/`aZ` as numeric fields without guessing their business meaning. Any bytes after the verified fields are returned as an opaque tail. All four observed mode branches (0–3) now have separate source-bounded decoders. Mode 1 parses the `bo` inventory records; mode 2 parses both auxiliary collections using the exact `ka.java` read order and retains common `aY`/`aZ`; mode 3 parses the `ca.T` short array. Unknown mode values remain opaque. The full opcode 16 command remains opaque in the general command catalog.

Generator and checks:

```bash
npm run generate:initialization-protocol
npm run check:initialization-protocol
npm run test:initialization-protocol
```

## B16 chưa hoàn tất

- Chưa phân loại hết các lookup arrays trong opcode 1 hoặc gán semantic names cho toàn bộ numeric fields.
- Chưa xác định toàn bộ skill metadata mapping, profession growth curves, item templates, tile/object catalogs và part binary schema.
- Chưa có live packet capture để xác nhận server send order, optional-field versioning và error/retry behavior.
- Opcode 16 modes 0–3 đã có decoder source-bounded; opcode 15 subtype 0 và non-zero có decoder riêng. Tiếp theo: trace lookup/catalog consumers và xác minh cấu trúc ảnh atlas thực tế bằng payload/assets hợp lệ; chưa có live packet capture.



## S2C opcode 17 — entity action/effect event

CFR source path: `ka.java:case17`, `kl.java`, `jz.java`, and consumer `mj.a(kl)`.

Wire order decoded by the generated JavaScript/Java codec:

1. First signed short, retained as `firstShortWireValue`. CFR shows this read assigned to a temporary `new kl()`, while the consumer later reads `kl.a`; this assignment is a decompiler anomaly and is **not** silently repaired in the schema.
2. Second signed short, target entity ID: `mj.a(kl)` resolves `kl.b` with `mj.n(short)`.
3. Event byte, signed int value, display byte.
4. Signed-byte effect count, followed by records: type byte + four signed shorts. Each record is passed to the effect factory and positioned relative to the resolved target entity.
5. Optional repeat-count byte (default 1), optional consumed/discarded byte, optional mode byte (default 0). Each is read only when bytes remain.

The consumer uses the first short as an entity lookup key and the second as the target lookup key; because CFR's constructor/assignment output for the first field is inconsistent with that consumer, the decoder exposes the first value neutrally and this mapping remains pending bytecode verification. The integer value is used by the client damage/feedback path; the codec retains its neutral name. Effect coordinates/parameters also remain neutral.

A negative effect count causes the original signed-byte array allocation to fail inside the handler's catch; the generated decoder rejects it explicitly rather than fabricating an empty event. The decoder only parses bytes and does not mutate entities, apply damage, or instantiate visual effects.

```bash
npm run generate:world-state
npm run check:world-state
npm run test:world-state
```


## S2C opcode 7 — existing entity state update

Bytecode-verified from `ka.class` (switch target 5322; field writes on the retained `ce` instance), then traced through `mj.a(ce)` and `cd.a(ce)`.

Wire order:

1. Entity ID: signed short `ce.a`; `mj.a(ce)` resolves the existing `cd` entity by this ID and does nothing if it is not present.
2. Template ID: unsigned byte, stored as short `ce.h`.
3. X/Y: signed shorts, assigned to current or target coordinates depending on the entity's local/remote state.
4. Current HP: signed int `ce.e`; `cd.a(ce)` assigns it to `cE/cG`.
5. Signed byte `ce.d`, then signed byte `ce.i`; retained as neutral state bytes in the codec (`ce.d` is stored in a short field but originates from readByte).
6. Max HP: signed int `ce.f`, assigned to `cH`.
7. Opaque signed int `ce.g`, assigned to `j.E`; no business meaning is asserted.

This is an update for an entity already in the world, not an entity creation packet. The earlier CFR output incorrectly displayed the first short as assigned to a temporary `new ce()`; bytecode proves it is assigned to the retained instance. The generated codec reflects the bytecode, not the faulty decompiler expression.

## Opcode 17 — bytecode confirmation

Bytecode for `ka.class` confirms the first short is written to the retained `kl.a` field (the `dup; astore_3; ... putfield kl.a` sequence). It is therefore the actor/source entity ID used by `mj.a(kl)`; the second short `kl.b` is the target entity ID. The generated codecs now expose `actorEntityId` and `targetEntityId`, replacing the earlier neutral first-short name.


## S2C opcodes 18–21 — ground-item and inventory events

These handlers are traced from CFR `ka.java` and cross-checked against `bo.java`, the `mj` consumers, and bytecode read order.

- **Opcode 18 — ground-item pickup context:** owner character ID short, then a partial item record. One signed byte is assigned to both `bo.m` and `bo.D`; then `k/i/r` shorts, `s/y` signed bytes, and `u/v` shorts. `mj.a(ownerId, bo)` resolves the ground entity using `bo.k`; if the owner is the local character, it adds this item record to the local inventory. The codec preserves neutral field names where the partial item model is not fully transmitted.
- **Opcode 19 — pickup reward:** character ID short, ground item entity ID short, unsigned-byte currency/item index, signed-short amount. The consumer updates local currency when the index is zero, otherwise the corresponding item counter; the ground pickup visual is removed/moved to the character.
- **Opcode 20 — typed entity removal:** signed-byte entity kind followed by signed-short entity ID. The consumer removes the entity whose `j.g` and `j.h` match these values.
- **Opcode 21 — inventory item update:** item ID short, `u` short, `D` byte, `w` unsigned short, signed-byte stat count and repeated unsigned-byte stat ID + signed-short value, `s` byte, optional `C` byte (constructor default 0). The consumer merges the item into current inventory/equipment/trade/shop collections and refreshes the active panel.

Negative opcode-21 stat counts execute zero iterations, matching the original signed-byte loop. Opcode 21's optional `C` read only occurs when bytes remain; absent values preserve the constructor default of zero. Decoders parse only; they do not mutate inventory or award currency.


## S2C opcodes 27, 28, 30, 32 and 33 — character feedback/state events

- **Opcode 27:** entity/character ID short + UTF message. `mj.a(id,text)` displays a timed overhead message; for player characters it also appends a world-chat entry.
- **Opcode 28:** item ID short. `mj.g(itemId)` removes the matching local inventory item and credits the sale proceeds.
- **Opcode 30:** character ID short, experience value short and experience gain int. Consumer updates the character's `aU` experience value and displays the gain.
- **Opcode 32:** character ID short, signed-byte stat count, repeated UTF key + signed int value. For the local character only, the original handler then reads one extra signed byte and one short before applying the stat records. The consumer recognizes `hp`, `mp`, `bp` and `sp`; other keys are retained without inferred semantics. Negative counts are rejected (the source array allocation would fail).
- **Opcode 33:** character ID short, level byte, then two signed ints passed to the level-up consumer, which updates level and HP/MP state and triggers the level-up feedback.

The opcode 32 decoder requires the caller to supply whether the packet targets the local character because the additional two fields are conditional on comparing the packet character ID with the current player ID. All codecs remain parse-only; inventory sale, XP, level and resource changes are not applied by these decoders.


## S2C opcodes 61 and 78 — inventory drop and warehouse sale

- **Opcode 61:** character ID short, inventory item ID short, then `jz` effect data: two signed bytes and three signed shorts. Bytecode confirms the first effect byte is written to the retained `jz.a` field (CFR had shown a temporary instance). Consumer `mj.a(characterId,itemId,jz)` removes the matching inventory item and creates a ground-effect entity from the five effect values.
- **Opcode 78:** one signed-short warehouse item ID. Consumer `mj.h(id)` decrements the matching storage item quantity and credits the sale proceeds when the stack reaches zero.

The generated codecs retain the five effect values with neutral names; they do not invent frame/resource mappings or apply inventory/currency mutations.


## S2C opcode 23 — inventory/equipment context variants

The first signed byte selects one of five source branches in `ka.java:case23`:

- **Subtype 0:** signed-byte length + raw byte list. The consumer rebuilds the local `z` item context from these byte IDs and requests the corresponding server context.
- **Subtype 1:** signed-byte category/template selector, signed-short item count, then item IDs as signed shorts. The consumer derives display/category fields from the static item catalog (not transmitted in this packet). An optional mode byte follows; the static default is 2 when absent.
- **Subtype 2:** signed-byte item count; each partial item record is type byte, item ID short, raw short value (negative values are increased by 256 before assignment), signed bytes `s/y`, then shorts `v/u`. The consumer installs this vector as the active item list.
- **Subtype 3:** no payload; the consumer builds a list from the static catalog entries whose availability flag is true.
- **Subtype 4:** signed-byte count, that many bytes, then two trailer bytes. The consumer uses this byte array to open the three shop-tab actions.

Counts preserve the original signed-byte behavior. Negative subtype 0/4 lengths fail array construction/indexing; negative subtype 2 counts execute zero loop iterations. Subtype 1's signed-short count likewise produces zero iterations when negative. Derived catalog fields and UI side effects are intentionally outside the decoder.
