# KPAH 2.7.8 — protocol.yaml và code generation Java/JavaScript

## Mục tiêu

`protocol/protocol.yaml` là nguồn khai báo trung tâm cho command catalog và các payload schema đã được xác minh. File dùng cú pháp JSON subset hợp lệ của YAML 1.2 để generator đọc bằng Python standard library, không thêm dependency YAML.

## Catalog hiện tại

| Phạm vi | Số lượng | Ý nghĩa |
|---|---:|---|
| C2S command entries | 110 | 109 opcode được all-source catalog đánh dấu có enqueue, cộng frame handshake client `-40` được queue trực tiếp trong `acy` |
| S2C dispatcher entries | 142 | Các opcode case trong inbound dispatcher `ka` |
| Tổng entries | 252 | Tách direction nên cùng opcode ở hai chiều là hai command khác nhau |
| Payload schema typed | 13 | Chỉ các payload có field order đủ bằng chứng client mới được generate encoder/decoder |
| Payload opaque | 239 | Có command ID nhưng chưa gán schema nghiệp vụ; không được tự serialize theo phỏng đoán |

Command chưa có schema typed sẽ bị `encodePayload`/`decodePayload` từ chối thay vì phát packet sai format.

## Generated outputs

| Ngôn ngữ | File | Nội dung |
|---|---|---|
| JavaScript | `src/protocol/generated/commands.js` | C2S/S2C constants, catalog và payload schema |
| JavaScript | `src/protocol/generated/packet-codec.js` | `PacketWriter`, `PacketReader`, typed payload encode/decode |
| Java | `protocol/generated/java/com/kpah/protocol/generated/ProtocolCommand.java` | Enum direction + opcode, lookup theo direction/opcode |
| Java | `protocol/generated/java/com/kpah/protocol/generated/ProtocolPacketCodec.java` | Encode/decode payload theo schema đã xác minh |
| Java | `protocol/generated/java/com/kpah/protocol/generated/PacketWriter.java` | Primitive writer và Java modified UTF-8 |
| Java | `protocol/generated/java/com/kpah/protocol/generated/PacketReader.java` | Primitive reader và Java modified UTF-8 |

## Các payload typed ban đầu

- Login opcode `1`: UTF fields, reserved byte, screen width, feature byte và server flag. Ba client property strings được đặt tên trung tính vì chưa gán được business meaning.
- Session init `-1`: một byte protocol marker.
- Character select `13`: subcommand byte + character ID int.
- Character create `14`: UTF name + năm byte field; các field chưa xác định được giữ tên trung tính.
- Movement `4`: X/Y signed short.
- Use item `48`: item ID int.
- Chat `-5`, guild chat `-18`, remove friend `-6`.
- Refine item `-25`: action byte + item ID byte.
- Farm panel action `-66`: action byte + index byte.
- Farm plot action `109`: action byte + plot ID byte.
- Open artifact panel `-76`: short sentinel `-10000`.

Đây là payload layout phía client. Việc đặt tên action chỉ dùng cho các trường có caller/handler đối chiếu; không thay thế xác nhận server-side validation.

## Quy tắc tạo và kiểm tra

```bash
npm run generate:protocol
npm run check:protocol-generated
npm run test:protocol-codegen
```

- `tools/generate_protocol.py` sinh toàn bộ file generated từ `protocol/protocol.yaml`.
- `--check` so sánh byte-for-byte để phát hiện generated source lệch khỏi canonical spec.
- Java generated sources được compile bằng Java 21 trong CI.
- JS test kiểm tra opcode counts, payload vectors, signed integer, modified UTF-8 (bao gồm NUL và surrogate pair), payload trailing bytes và bounds.

## Giới hạn còn lại của B14

- Chưa có schema typed cho toàn bộ 109 C2S và 142 S2C entries; 239 command entries còn opaque.
- Chưa generate đầy đủ request/response classes cho payload có conditional fields, arrays, nested records và optional extension sections.
- Chưa generate frame-level TCP codec/XOR vào Java/JS từ cùng YAML; hiện framing/XOR reference vẫn nằm ở `tools/kpah_protocol_reference.py` và `protocol-transport.md`.
- Chưa có capture phiên production để xác nhận packet order, optional fields và server version negotiation.
- Chưa xây WebSocket gateway hoặc server session; các generated Java classes chỉ là protocol contract độc lập, chưa phải BE.

