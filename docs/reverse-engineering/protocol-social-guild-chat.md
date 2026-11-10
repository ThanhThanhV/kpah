# KPAH 2.7.8 — chat, friends, party và guild protocol

> Nguồn: CFR 0.152 source của `ka.java`, `jy.java`, `mj.java`, `sj.java`, `tb.java`, `mn/mo`, `kh/ki`, `ah/ae`. Các trường chưa có tên nghiệp vụ chắc chắn được giữ trung tính.

## Chat

### Client → server

| Opcode | Payload | Caller |
|---:|---|---|
| `-5` | UTF destination/channel + UTF message | `sj` gửi world/private channel; `rf` gửi message tới friend |
| `-18` | UTF message | `sj` gửi guild chat khi channel là `Bang hội` |

### Server → client

- Opcode `-5`: byte count, lặp count lần: UTF sender + UTF message. Handler thêm từng dòng vào `sj` chat log.
- Opcode `-18`: UTF message; handler thêm vào chat channel `Bang hội`.
- Opcode `-26`: UTF message line được đưa vào world message/chat list (`mj.f`).
- Opcode `77` và `-35`: UTF message hiển thị qua `mj.d(String)`; chưa gán channel cụ thể.

## Friends

### S2C opcode 101 — friend request event

Payload: byte event type, UTF requester name, short requester ID.

- Type `0`: mở dialog “muốn kết bạn”; accept/reject callbacks gửi response.
- Type `1`: không mở dialog ở handler hiện tại.

### C2S opcode 101 — accept/reject friend request

Payload: short requester ID + byte result. `mn` gửi result `1`; `mo` gửi `-1`. Writer là `jy.f(int id, int result)`.

### C2S opcode -6 — remove friend

Payload: UTF friend name. Caller `rl` gửi tên friend đang chọn rồi xóa entry khỏi local friend list.

### S2C opcode 103 — friend roster data

Payload: byte count; mỗi record có ba UTF strings. Handler lưu vào ba vectors `mj.cy/cz/cA`. Source chưa gắn tên nghiệp vụ rõ cho từng UTF field; cần trace UI friend list trước khi đặt schema names.

## Party / invitation prompts

### S2C opcode -11 — invitation/result dialog

- Subtype `0`: short requester/target ID + UTF prompt text; client mở accept/reject dialog.
- Subtype khác: UTF result text + boolean; nếu boolean true, đọc thêm hai short ID và cập nhật party/group state.

Accept/reject callbacks gửi C2S opcode `-11`: byte subtype `1`, short ID, boolean accepted.

Đây là generic invitation prompt. Cần đối chiếu caller cụ thể trước khi gắn mọi packet này thành party invite; cùng dialog mechanism có thể dùng cho các quan hệ khác.

## Guild

| Opcode | Direction | Payload/side effect đã xác nhận |
|---:|---|---|
| `-10` | S2C | short guild/context ID + UTF text; cập nhật guild context và mở guild panel |
| `-12` | S2C | guild record `ah`: short ID, UTF name/description, byte rank/state, short member count, long timestamps/counters, UTF fields, boolean và optional UTF; chuyển vào `mj.a(ah)` |
| `-13` | S2C | thông báo bị mời/loại khỏi guild; reset guild ID local về `-1` |
| `-17` | S2C | short count; mỗi announcement: int ID + UTF title + UTF body; hiển thị bảng `THÔNG BÁO` |
| `-18` | C2S/S2C | UTF guild chat message |
| `-19` | S2C | byte ranking type + UTF title; type 5 đọc guild ranking records, type 4/7/8 chuyển các bảng top tương ứng |
| `-20` | S2C | int currency amount; prompt nhận xu từ guild, callback xử lý reward |

Guild record `ah` được giữ dưới dạng model riêng; chưa đổi tất cả long fields thành thời điểm hoặc currency vì cần xác nhận từng UI binding.

## Các giới hạn

- Friend roster opcode 103 mới xác định được số record và ba UTF strings; chưa đặt tên ba field.
- Opcode -11 là generic invitation dialog; chưa xác định mọi caller/request type.
- Chưa đóng guild create/join/leave/donate/member permission/upgrade workflows và party create/join/leave/member list.
- Chat protocol chưa xác nhận giới hạn độ dài, throttling, channel permission, private message delivery và offline mailbox.
- Tiếp theo: trace `jy` callers của guild request opcodes, friend roster UI và party membership handlers; sau đó đối chiếu các response -9/-10/-11/-12/-17/-19.

