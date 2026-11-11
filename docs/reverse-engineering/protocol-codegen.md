# KPAH 2.7.8 — protocol.yaml và code generation Java/JavaScript

## Mục tiêu

`protocol/protocol.yaml` là nguồn khai báo trung tâm cho command catalog và các payload schema đã được xác minh. File dùng cú pháp JSON subset hợp lệ của YAML 1.2 để generator đọc bằng Python standard library, không thêm dependency YAML.



### Java-compatible partial-read behavior

The generated JavaScript PacketReader now consumes multi-byte values incrementally, matching java.io.DataInputStream when a packet ends in the middle of a short, int, long or modified-UTF value. This matters for source handlers that catch individual read failures and continue with the next optional group: the cursor must remain at the same position in both languages. Synthetic tests assert both the truncation error and the bytes consumed before failure.
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
| JavaScript | `src/protocol/generated/transport-codec.js` | Handshake key, XOR stream, C2S/S2C framing và long S2C header |
| Java | `protocol/generated/java/com/kpah/protocol/generated/TransportCodec.java` | Cùng transport API và byte layout với JavaScript |
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
npm run generate:transport
npm run check:transport-generated
npm run test:transport-codegen
```

- `tools/generate_protocol.py` sinh toàn bộ file generated từ `protocol/protocol.yaml`.
- `--check` so sánh byte-for-byte để phát hiện generated source lệch khỏi canonical spec.
- Java generated sources được compile bằng Java 21 trong CI.
- JS test kiểm tra opcode counts, payload vectors, signed integer, modified UTF-8 (bao gồm NUL và surrogate pair), payload trailing bytes và bounds.

## Partial S2C prefix schemas

For server payloads whose prefix is source-backed but whose optional tail remains unresolved, `protocol/protocol.yaml` supports a separate `prefixSchemas` catalog. It currently describes the fixed prefix of S2C opcode 3 only. Generated decoders return unparsed trailing bytes instead of silently discarding them or claiming the full payload is typed. The main command schema remains `opaque` until the full payload is understood.

```bash
npm run generate:prefix-protocol
npm run check:prefix-protocol
npm run test:prefix-protocol
```

## Transport codec đã generate

- Handshake opcode -40: đọc signed key length, giải mã prefix-XOR key material; encode helper chỉ phục vụ vector tổng hợp.
- XOR stream dùng cursor độc lập theo từng hướng; cursor được trả về sau mỗi lần encode/decode và không tự động lưu state toàn cục.
- C2S: opcode + u16 big-endian + payload; S2C short cùng header; S2C long dùng marker 0x80 + opcode + u32 big-endian và chỉ bật ở encrypted mode.
- API nhận/trả cursor rõ ràng để caller quản lý stream state; không reset cursor ở ranh giới packet.
- JavaScript và Java có cùng test vectors cho handshake, C2S, S2C short/long và cursor wrap.

## Giới hạn còn lại của B14

- Chưa có schema typed cho toàn bộ 109 C2S và 142 S2C entries; 239 command entries còn opaque.
- Chưa generate đầy đủ request/response classes cho payload có conditional fields, arrays, nested records và optional extension sections.
- Đã generate frame-level TCP codec/XOR cho Java và JavaScript từ transport section trong `protocol/protocol.yaml`; các vector tổng hợp được kiểm tra ở cả hai ngôn ngữ. Chưa có capture mạng thật hoặc kiểm chứng với server đang hoạt động.
- Chưa có capture phiên production để xác nhận packet order, optional fields và server version negotiation.
- Chưa xây WebSocket gateway hoặc server session; các generated Java classes chỉ là protocol contract độc lập, chưa phải BE.

