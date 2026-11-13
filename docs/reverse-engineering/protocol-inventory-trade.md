# KPAH 2.7.8 — inventory, equipment, market và trade

> Nguồn: CFR 0.152 source của `jy.java`, `ka.java`, `mj.java`, `xg.java`, `bo.java`, `be.java`, `de.java`. Tài liệu giữ nguyên field order; các trường chưa xác định ngữ nghĩa được mô tả trung tính.

## Runtime data models

- `bo`: item/gear record trong character inventory và market window; chứa item ID `i`, type/category `D/m`, price/listing value `B`, stat vector `H`, description `d` và các thuộc tính item khác.
- `be`: material/equipment-list record; field `a` là category/type, `b` là item ID, `c` là quantity/count.
- `de`: market listing record; field `a` là item ID, `b` là owner/character ID, `c` là price.
- `xg.E`: danh sách item/listing đang hiển thị trong market/trade panel.
- `ca.N`, `ca.O`: hai nhóm material/recipe list; `ca.P`: equipment/gear list được refresh trong character panel.

## Client → server

### Opcode 94 — request trade/market panel data

Writer `jy.a(int modeA, int modeB, int targetId)` ghi: byte subcommand `1`, byte modeA, byte modeB, short targetId. Đây là request mở/refresh panel; S2C opcode 94 trả danh sách player hoặc item records theo subcommand.

### Opcode 92 — market listing / retrieve listing

Writer ghi theo thứ tự:

1. boolean add/list or retrieve
2. byte market category
3. byte market subcategory
4. short item ID (lấy từ `bo.i` hoặc tham số item ID)
5. int price
6. byte source mode (`0` cho item `bo`, `1` cho listing `de`)

Caller `xg.a(bo, itemId, price, isListing)` dùng writer này để đưa item vào gian hàng hoặc lấy item ra. Đây là market action; không nhầm với packet purchase.

### Opcode 95 — market item action

Writer `jy.a(int ownerOrContext, int category, int subcategory, int itemId, int action)` ghi: byte category, byte subcategory, short owner/context ID, short item ID, byte action. Caller `zx` truyền owner/context từ panel, hai category bytes, item ID và action 0/1; caller `ez` dùng owner/context 0 để thao tác item đang chọn.

Không gán action 0/1 thành buy/sell nếu chưa đối chiếu từng caller; chúng là action flag được source truyền vào.

## Server → client

### Opcode 73 — recipe/material lists

Payload: short record count; mỗi record gồm short item ID (`be.b`), short material/category (`be.a`), short quantity (`be.c`); cuối packet có byte selector. Selector `0` thay `ca.N`, khác `0` thay `ca.O`. Nếu đang mở crafting/material tab, UI refresh list tương ứng.

### Opcode 76 — equipment/gear list

Payload: byte record count; mỗi record gồm short item ID (`be.b`), byte equipment slot/category (`be.a`), short value/count (`be.c`). Handler thay `ca.P`; nếu character panel đang mở ở equipment tab, refresh UI.

### Opcode 94 — trade/market window

Prefix gồm hai byte mode. Theo mode thứ ba:

- Mode `0`: byte player count; mỗi entry là UTF player name + short player ID. Client tạo lựa chọn người chơi để mở trade.
- Mode `1`: clear `xg.E`; đọc byte item count và short owner/character ID; mỗi item `bo` gồm byte type/category, short item ID, short `r`, byte `s`, int price/value, byte `y`, short `u`, byte `I`, byte `J`, byte stat count, lặp unsigned-byte stat ID + short stat value, các byte flags `K/n/o/p/q/C`, UTF description. Tiếp theo đọc byte listing count; mỗi `de` gồm short item ID, short owner ID, int price.

Handler lưu category/mode vào `xg.af/ag`, owner ID vào `xg.D`, và danh sách item/listing vào `xg.E`. Nếu panel là chính người chơi, client merge trạng thái item với inventory `z.bx`.

### Opcode 92 — market listing response

Payload prefix: boolean listed/retrieve, short item ID, int price nếu boolean true, byte result/mode.

- Result `0`: tìm `bo` trong player inventory; cập nhật flag listed `bo.z` và price `bo.B`; add/remove khỏi `xg.E`; hiển thị message đưa vào/lấy khỏi gian hàng.
- Nhánh khác: đọc short owner/record ID. Khi listed, giảm quantity của material `be` và tạo `de` listing với owner/price. Khi retrieve, remove `de` khỏi `xg.E` và cộng lại quantity vào material list.

### Opcode 95 — remove/update market item

Payload: short item ID, short owner/context ID, byte item class. Handler gọi `mj.c(...)`, tìm `bo` hoặc `de` phù hợp trong `xg.E`, loại khỏi panel và refresh UI nếu market tab đang mở.

## Phân biệt với các hệ thống khác

- Opcode 73 là material/recipe data; không phải inventory bag snapshot tổng thể.
- Opcode 76 là equipment/gear list; không phải character stat snapshot.
- Opcode 94 là trade/market panel data; hai mode trả player list hoặc item/listing list.
- Opcode 92/95 là market listing actions và responses; không tự động suy ra purchase semantics.
- Đã source-trace request/result item sale opcode 78; vẫn chưa đóng NPC purchase transaction, unequip-to-bag, refinement callback details và server-authoritative warehouse/purchase persistence.

## Bước tiếp theo

- Trace shop NPC purchase và item use/equip/unequip theo caller trong `xg`, `tb`, `dh` và handler response.
- Trace upgrade/refine/material consumption, đối chiếu opcode `-52`, `-51`, `-48` cùng các bảng item/material.
- Xác nhận currency debit/credit và server-side validation; không dùng client message làm nguồn sự thật.



## Generated S2C decoders — opcodes 73 and 76

The source-backed Java/JavaScript decoders preserve the wire order without assigning undocumented gameplay meanings:

- Opcode 73 reads a signed-short record count, then each material record as three signed shorts: item ID, material/category, quantity. The final signed byte selects destination `ca.N` when zero or `ca.O` otherwise.
- Opcode 76 reads a signed-byte record count, then each equipment record as item ID (short), slot/category (byte), and value/count (short), corresponding to `be.b`, `be.a`, and `be.c`; the consumer replaces `ca.P`.

The decoders are parse-only. They do not mutate inventory/material/equipment collections or refresh panels. Negative record counts are rejected; zero-count lists and signed field values are covered by synthetic tests.

Run `npm run check:world-state` and `npm run test:world-state` to verify generated outputs and JavaScript vectors. The Java 21 CI smoke test includes matching vectors.


## C2S opcode 62 — collection action variants

The outbound writer in `jy.java` has seven distinct mode branches:

| Mode | Writer method | Wire fields after mode |
|---:|---|---|
| 0 | `a(int,int,int,int)` | signed short, signed int, signed int |
| 2 | `b(int,int,int,int,int)` | five signed bytes |
| 3 | `o(int,int)` | signed byte, signed short |
| 4 | `w(int)` | signed byte |
| 5 | `o()` | none |
| 6 | `f(int,int,int)` | signed byte, signed short, signed int |
| 7 | `g(String)` | modified UTF string |

The schema records the source method and line for each branch. The argument names remain neutral because the complete UI call graph and server-side handling have not yet been tied to these values. No mode 1 writer was found; it is not treated as a supported variant. Generated JS/Java codecs include encode/decode round trips and preserve unknown-mode payload bytes. CI run `43189624674` passed.


## C2S inventory / market command payloads

The following outbound writer layouts are now represented as typed command schemas:

| Opcode | Writer payload after opcode | Source evidence |
|---:|---|---|
| 61 | signed short item ID | jy.h(short) |
| 68 | signed short item ID | jy.d(short) |
| 69 | signed short item ID | jy.e(short) |
| 78 | signed short item ID, signed byte option | jy.d(short, byte) |
| 92 | boolean, two signed bytes, signed short item ID, signed int, signed selector byte | jy.a(int,int,bo,short,int,boolean); the short is taken from the item record or fallback argument, and the final byte distinguishes those branches |
| 95 | two signed bytes, two signed shorts with the first short as item ID, one signed byte | jy.a(int,int,int,int,int) |
| 100 | signed mode byte, signed short item ID | jy.d(int,int); inspected writer uses mode 0 |

These layouts describe client packet serialization only. The actual item transfer, listing, purchase, sale and persistence rules remain server-authoritative and are not implemented by this codec.


### C2S inventory/market schema validation

C2S command catalog now includes typed payload schemas for opcodes 61, 68, 69, 78, 92, 95 and 100, plus a dedicated generated variant codec for opcode 62. JS vectors and Java 21 smoke tests passed in CI run `43190442561`. These are wire codecs only; they do not authorize or persist transactions.


## C2S opcode 94 — market-panel modes

The outbound writer has two verified variants: mode 0 writes two signed bytes; mode 1 writes the same two signed bytes followed by a signed short. The command-variant codec generates both modes in Java and JavaScript, preserves unknown-mode payload bytes on decode, and rejects unsupported modes on encode. Field names remain positional/neutral until the caller graph is fully mapped.


### Opcode 94 codec verification

The two mode branches now have generated Java/JavaScript encoders and decoders. The generator validates the schema against the observed mode set; unknown modes are preserved on decode but rejected on encode. CI run `43191399012` passed all protocol checks and Java 21 smoke tests.


## C2S — use-item and equipment-upgrade requests

Source trace from the CFR artifact generated by CI run 43195783681:

- Opcode 48 `USE_ITEM`: `jy.g(int)` writes one signed 32-bit item ID. The inventory menu adds “Sử dụng” for `bo` items; `xj.a()` delegates to `xg.a(bo)`, which checks profession, class and minimum level before sending `jy.g(bo.i)`. This confirms the client request path, not server acceptance or item effects.
- Opcode -25 `EQUIPMENT_UPGRADE_ACTION`: `jy.a(int,int)` writes two bytes. The gear menu adds “Thăng cấp thường” (`xo.a()` sends action 10) and “Thăng cấp giữ thuộc tính” (`xp.a()` sends action 11); both send the item ID in the second byte. This is equipment upgrade, not material refinement.
- Opcode -68 is the refinement request family: `jy.a(short,int,int,int)` writes action byte + equipment ID short + selected material ID short + option byte. `tx` invokes this for modes 1, 2 and 3; its mode 5 branch writes an additional material short and option byte. The mode-specific payload remains opaque until every branch and response is traced.

Generated Java/JavaScript codecs use the corrected command names and cover both upgrade action values (10 and 11). The S2C response handler `ka.case-68 → mj.x` reads a result byte: result 0 invokes the refinement panel reset path; result 4 reads a short and two bytes and forwards them to the active screen callback. The conditional response is named `REFINEMENT_RESULT` but kept opaque until the callback contract is traced. C2S opcode -68 remains opaque across its modes. These checks validate client request serialization and response dispatch only; they do not infer server acceptance, item eligibility, material/currency consumption, or authoritative inventory mutation.


## C2S — equip and drop equipped item

- Opcode 86 `EQUIP_ITEM`: the `ca.P` equipment/gear list is rendered in the equipment panel. Its “Sử dụng” action is `acm.a()`, which sends `be.b` (item ID) through `jy.b(int)`; the writer emits one signed short. This confirms the client equip request path, not the server-side result.
- Opcode -21 `DROP_EQUIPPED_ITEM`: the equipped-slot menu offers “Bỏ ra đất”; after confirmation, `yf.a()` calls `jy.p(slotIndex)`, and the writer emits the slot index as one signed short. This is a drop-to-ground action, not unequip-to-inventory.
- No unequip-to-bag request has been established from these callsites. Keep that flow open until another source path is found.


## C2S — shop purchase request families

- Opcode 85 `SHOP_PURCHASE_ITEM`: tab 20 purchase confirmation callbacks `abv`/`gt` call `jy.c(itemId)`; the writer emits one byte. S2C opcode 85 is a separate direction and its handler displays “Đã mua, món đồ đang ở trong hành trang.”, so it is named `SHOP_PURCHASE_SUCCESS` and remains payload-opaque.
- Opcode 74 `SHOP_PURCHASE_BATCH`: tab 10 “Gian hàng” accumulates selected item quantities; `xg.p()` → `jy.a(Vector)` (source: `xg.java:3257-3265`, `jy.java:756-780`). The wire payload is a signed-short expanded total quantity followed by that many signed-short item IDs; each selected item ID is repeated `bd.n` times. Added a typed variable-list codec; negative decoded counts are rejected and the signed-short count is bounded to 32767.
- Opcode 24 `SHOP_BATCH_ACTION`: `xg.p()` selects `jy.c(Vector)` for tab 19, otherwise `jy.b(Vector)` (source: `xg.java:3257-3265`). Both begin with an unsigned-byte record count, but there is no wire discriminator between layouts, so the caller must select the variant. `catalog` (`jy.java:816-844`) writes category byte, template ID short, constant quantity 1, and an option byte only when category = 3 (selected global option when nonnegative, otherwise the item template default). `category4_fixed` (`jy.java:846-865`) writes constant category 4, item ID short and quantity short. Added caller-selected typed codecs; unknown variant names fail closed.
- These are client request/response paths only. Do not treat local optimistic currency/inventory updates in the UI callbacks as authoritative server results.


### Shop batch codec implementation

- `protocol.yaml` now declares both source-backed opcode 24 variants and the opcode 74 expanded item-ID collection.
- Generated JS/Java APIs: `encode/decodeC2SOpcode24(variant, ...)` and `encode/decodeC2SOpcode74(...)`. Opcode 24 variant selection is explicit because no variant tag exists in the packet. Opcode 74 represents quantity expansion directly as repeated item IDs.
- JavaScript round-trip and Java 21 smoke vectors cover category-3 conditional option bytes, category-4 fixed category-4 records, signed item IDs, empty lists, unknown variants, and count bounds.


### Shop batch codec CI verification

- CI run `43403732922` on commit `306ccd0e6c992a107c8ae3c7e80ed4fb70ef8223` passed generated command-variant consistency, JavaScript round-trip/boundary tests, Java 21 compile/smoke (including constant-field rejection), Vite build and original-JAR analysis.
- Opcode 24 variant identifiers are intentionally neutral: `catalog` for the category/template path and `category4_fixed` for the fixed-category-4 path. The packet itself carries no variant discriminator; callers must select the correct layout.
- No server acceptance, currency deduction, stock mutation or inventory persistence is inferred from these client-side codecs.


## Storage deposit / withdraw request-response trace

- C2S opcode 68 `STORAGE_DEPOSIT_ITEM`: one signed-short `itemId`. The tab-22 inventory-side selection calls `jy.d(itemId)` (`aaa.java:15-20`; writer `jy.java:892-903`).
- S2C opcode 68 `STORAGE_DEPOSIT_RESULT`: one signed-short `itemId`. Handler `ka.java:252-255` calls `mj.e(itemId)`, which removes the item from `z.bx` (inventory) and adds it to `z.bA` (storage) if absent (`mj.java:4562-4573`).
- C2S opcode 69 `STORAGE_WITHDRAW_ITEM`: one signed-short `itemId`. The tab-22 storage-side selection calls `jy.e(itemId)` (`aaa.java:35-40`; writer `jy.java:905-915`).
- S2C opcode 69 `STORAGE_WITHDRAW_RESULT`: one signed-short `itemId`. Handler `ka.java:257-260` calls `mj.f(itemId)`, which removes the item from `z.bA` and adds it to `z.bx` if absent (`mj.java:4576-4584`).
- C2S opcode 70 `STORAGE_REFRESH`: empty payload; `jy.i()` sends only the opcode (`jy.java:880-890`) and is called when leaving the tab-22 storage flow (`xg.java:3291-3293`, `dh.java:2097-2100`). No S2C opcode-70 handler was identified in `ka.java`; do not invent a response command.
- These handlers prove original-client collection updates, not server persistence or transaction acceptance. The generated web codecs only serialize/parse the payloads; they do not mutate inventory or storage state.


## Item sale request / result trace

- C2S opcode 78 `SELL_ITEM`: signed-short `itemId` + signed-byte `sourceSelector`. Writer `jy.d(short, byte)` writes the fields in that order (`jy.java:931-942`). The sale-confirmation callbacks send selector 1 for items from `ca.O` and selector 0 for items from `ca.N` (`acn.java:16-20`, `acp.java:16-20`; UI confirmation is in `xg.java:3070-3101`).
- S2C opcode 78 `SELL_ITEM_RESULT`: signed-short `itemId`. Handler `ka.java:1771-1774` calls `mj.h(itemId)`; the client finds the matching stack by its secondary item key in `ca.N` (`be.java:30-40`), decrements the quantity, removes the stack at zero, credits `bd.r / 5`, and displays the sale-success message (`mj.java:4678-4688`).
- This is the original client's optimistic post-result behavior. The result packet has no amount or currency field; the client derives proceeds from its local item template. Do not infer the server's authoritative price validation or persistence from this handler.
