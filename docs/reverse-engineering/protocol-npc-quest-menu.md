# KPAH 2.7.8 — NPC speech, menu và quest protocol

> Nguồn: CFR 0.152 source của `ka.java`, `mj.java`, `jy.java`, `cy.java`, `tb.java`, `kk.java`, `kc.java`. Chỉ ghi những luồng có caller/handler rõ; không đồng nhất mọi dialog UI với NPC dialogue.

## Menu chức năng

`tb` là menu client-side kế thừa `tj`. Các mục menu được tạo ở client và chuyển tới panel tương ứng; mở menu không đồng nghĩa gửi một packet riêng. Các chức năng như inventory, skills, potential, equipment, quests, friends, world chat và settings có request/response riêng.

## NPC speech / world message

### S2C opcode 27 — text gắn với entity

Payload: short entity ID + UTF text. Handler `ka` gọi `mj.a(short, String)`; world state tìm entity theo ID, gắn text bubble có thời hạn. Nếu entity là player (`z`), text còn được thêm vào local chat log với tên nhân vật.

Đây là bằng chứng cho entity speech bubble; source không đủ để kết luận mọi text opcode 27 đều là NPC dialogue.

### S2C opcode -26 — message line

Payload: UTF text; handler gọi `mj.f(String)`, thêm dòng vào world message/chat list và `sj` chat panel.

### S2C opcode -24 — help/information text

Payload: byte type + UTF text. Type `0` mở `qu` screen có tiêu đề `Hướng dẫn` và render text đã wrap; type `1` không xử lý ở nhánh hiện tại.

## Quest list và progress

### S2C opcode -64 — quest record collection

Payload prefix: byte mode + byte record count. Nếu mode `0`, client clear quest list trước. Mỗi record:

1. short quest ID
2. byte quest state/type `e`
3. UTF title/name `i`
4. phần còn lại tùy mode:

| Mode | Field order |
|---:|---|
| `0` | byte category; UTF objectives separated by `>`; byte `a`; byte `s` |
| `1` | byte `d`; UTF objective/status strings separated by `>`; UTF `h`; UTF `q` |
| `2` | byte subtype `a`; UTF `h`; byte `d`; byte `s`; UTF `q`; sau đó data arrays tùy subtype |

Mode `2` có các subtype đã thấy: `a=2` đọc count và các bộ ba short; `a=0` đọc count và các bộ ba short khác; `a=4` đọc hai short. Client lưu quest records vào `cy` và các active quest slots.

### S2C opcode -30 — quest detail/objective text

Payload: short quest ID, byte section/state, byte string count, rồi count UTF strings. Handler cập nhật `mj.a(short, byte, String[])` để thay nội dung objective/detail tương ứng.

### S2C opcode -31 — quest status text

Payload: short quest ID, byte state, UTF text, byte result/flag. Handler gọi `mj.a(short, byte, String, int)` để cập nhật trạng thái quest.

### S2C opcode -32 — confirmation prompt

Payload: short request ID, byte request type, UTF prompt text. Client mở confirm dialog. Accept gửi C2S opcode `-32` với cùng ID/type/text và byte `1`; reject gửi cùng ba field và byte `0`.

Đây là generic confirmation request; chưa gán riêng thành quest acceptance vì handler dùng callback tổng quát.

## NPC/quest interaction requests

- `jy` có writer C2S `-32` cho accept/reject confirmation; field order là short ID, byte type, UTF prompt/context, byte result.
- Quest list mode và quest detail updates được server đẩy qua `-64`, `-30`, `-31`; chưa có đủ bằng chứng để đóng gói mọi thao tác nhận/trả quest thành một opcode duy nhất.
- NPC click/dialogue request cụ thể vẫn cần trace thêm từ world object factory, NPC action metadata và caller của các writer `jy`.

## Giới hạn

- Chưa xác định đầy đủ quest acceptance/reward/abandon flows, prerequisite chain, repeatable quests và reward schema.
- Chưa xác định đầy đủ NPC dialogue tree; opcode 27 chỉ xác nhận entity speech text, không phải toàn bộ hội thoại tương tác.
- Menu `tb` là client navigation; không nên giả lập packet chỉ vì người chơi mở menu.
- Tiếp theo: trace các NPC action object, quest reward handlers, party/guild/friend/chat messages và các response -11/-12/-13.

