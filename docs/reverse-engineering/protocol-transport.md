# KPAH 2.7.8 — đặc tả transport TCP

> Nguồn: CFR 0.152 decompile trực tiếp `KPAH_278.jar`; đối chiếu `acv`, `acy`, `acw`, `acz`, `acx`, `acu`. Đây là mô tả framing/handshake quan sát được trong client, không phải suy đoán từ server.

## Luồng kết nối và handshake

1. `acy.run()` mở `SocketConnection` bằng `Connector.open(socketUrl)`, mở `DataOutputStream` và `DataInputStream`, sau đó khởi chạy writer queue `acz` và reader worker `acx`.
2. Client đưa `new acu(-40)` (payload rỗng) vào outbound queue. Writer `acz` chỉ flush queue khi cờ mã hóa `g` đã bật.
3. Reader nhận frame đầu tiên có opcode `-40` khi chưa bật mã hóa. Payload có cấu trúc: `keyLength` (signed byte) + `keyLength` byte key đã delta/XOR hóa.
4. Client giải mã key theo phép prefix XOR: `key[i] = encoded[i] XOR key[i-1]` với `i` từ 1 đến cuối; `key[0]` giữ nguyên. Sau đó đặt `g=true`.
5. Khi `g=true`, writer queue bắt đầu gửi frame `-40` đang chờ bằng XOR stream. Vì vậy `-40` xuất hiện ở hai chiều: server gửi key material trước; client gửi frame xác nhận đã xếp hàng sau khi key sẵn sàng.
6. `acw` là timeout worker: đợi 20 giây; nếu kết nối vẫn ở trạng thái đang kết nối thì đóng socket và reset trạng thái.

## Frame client → server

```text
opcode: 1 byte
payloadLength: 2 bytes, unsigned big-endian
payload: payloadLength bytes
```

`acv.b(acu)` luôn ghi opcode, `writeShort(payload.length)` và payload. Khi mã hóa bật, từng byte của cả header và payload được XOR theo send key cursor `s`. C2S writer hiện chỉ có header length 16-bit; không thấy nhánh long-length marker trong writer này.

## Frame server → client

Frame thông thường:

```text
opcode: 1 byte
payloadLength: 2 bytes, unsigned big-endian
payload: payloadLength bytes
```

Khi mã hóa bật, nếu byte đầu sau XOR là `0x80` (signed `-128`), đây là marker mở rộng header, không được dispatch như opcode nghiệp vụ:

```text
marker: 0x80 (1 byte, XOR)
opcode: 1 byte (XOR)
payloadLength: 4 bytes, unsigned big-endian (XOR)
payload: payloadLength bytes (XOR)
```

Reader `acx` kiểm tra marker sau khi giải mã byte đầu. Nếu không phải `0x80`, nó đọc 2 byte length; nếu là `0x80`, nó đọc opcode kế tiếp và 4 byte length. Nhánh long-length chỉ xuất hiện trong receive parser khi mã hóa đã bật.

## XOR stream và cursor

- Key material lấy từ payload opcode `-40`; byte đầu là độ dài key, các byte sau được prefix-XOR giải mã.
- Mỗi byte của opcode/header/body tiêu thụ một key byte.
- Send cursor `s` và receive cursor `r` độc lập; mỗi cursor tăng một sau từng byte và quay vòng modulo `key.length`.
- Khi đóng/reset connection (`acv.c()`), key `h` bị xóa và cả `r`, `s` được đặt về 0.
- XOR được áp dụng trên byte unsigned: `out = key[cursor] XOR input`.
- Không dùng chung cursor hai chiều; không reset cursor ở ranh giới packet.

## Test vectors tổng hợp

Các vector dưới đây dùng key giả lập, không phải key production. Chúng được dùng để kiểm tra thứ tự byte, prefix-XOR, marker long-length và cursor wrap.

| Trường hợp | Input / cursor | Output hex |
|---|---|---|
| Key handshake | encoded `10 20 30` | payload `03 10 20 30` → key `10 30 00` |
| C2S plain | opcode `01`, body `01 02 03` | `01 00 03 01 02 03` |
| C2S encrypted | same, key `10 30 00`, send cursor 0 | `11 30 03 11 32 03`; cursor về 0 |
| S2C encrypted short | opcode `2A`, body `AA BB`, receive cursor 1 | `1A 00 12 9A BB`; cursor về 0 |
| S2C encrypted long | opcode `35`, body `01 02 03`, receive cursor 2 | `80 25 30 00 10 33 01 12 33`; cursor về 2 |

Chạy kiểm tra tham chiếu và codegen:

```bash
npm run test:protocol
npm run check:transport-generated
npm run test:transport-codegen
```

## Mã tham chiếu và giới hạn

CI đã chạy self-test thành công cho codec tham chiếu (key derivation, C2S, S2C short/long và cursor wrap). Xem thêm [protocol-auth-character.md](./protocol-auth-character.md) cho login, server list và character payloads.

- `tools/kpah_protocol_reference.py` là oracle Python độc lập để tái lập test vectors.
- `src/protocol/generated/transport-codec.js` và `TransportCodec.java` được sinh từ `protocol/protocol.yaml`; cung cấp handshake key derivation, XOR stream, C2S encoder/decoder, S2C short/long encoder/decoder.
- Mỗi hàm mã hóa/giải mã trả cursor tiếp theo; ứng dụng phải duy trì hai cursor riêng cho send và receive. Không tạo singleton cursor trong codec, tránh state ẩn và giúp test/replay deterministic.
- Các codec Java/JS và Python reference chỉ xử lý byte layout; chưa phải socket client/server và chưa triển khai WebSocket gateway.
- Đã xác minh framing trong client decompile; chưa có capture mạng thật hoặc server source để đối chiếu tương tác với server production.
- Các packet opcode nghiệp vụ, schema payload, xác thực và trạng thái server được theo dõi riêng trong B4–B16.



## Incremental S2C stream framing

`ServerFrameStreamDecoder` incrementally reconstructs S2C frames from arbitrary TCP read chunks.

- Buffers incomplete short or encrypted long headers and incomplete payloads.
- Emits multiple complete frames when one read contains concatenated packets.
- Maintains the receive XOR cursor across all bytes and packet boundaries.
- Supports a caller-controlled frame limit so the cleartext `-40` key handshake can be emitted first; the caller can then call `setKey(decodedKey)` before parsing buffered encrypted bytes.
- The decoder accepts chunks, not sockets. The TCP reader, connection lifecycle, timeout and send queue remain separate work.


## Client protocol session

`KpahProtocolSession` composes a WebSocket-compatible binary transport with the verified frame and payload layers.

- Waits for the cleartext S2C `-40` key frame, decodes the prefix-XOR key, installs it in the receive stream and creates an independent send cursor.
- Sends the empty C2S `-40` acknowledgement encrypted with the new key. This represents the original client's queued acknowledgement becoming writable after key activation.
- Handles a clear handshake and encrypted application frames coalesced into one transport message by pausing after the first frame, installing the key, then draining buffered bytes.
- Sends caller-supplied C2S opcode/payload pairs using the verified short C2S frame encoder. It deliberately does not invent login credentials or send a login automatically.
- Applies the implemented initialization reducers for S2C opcodes 1, 3, 15 and 16; forwards other decoded frames to `onPacket` without assigning unverified semantics.

In a browser this class requires a WebSocket-compatible binary transport, normally supplied by a separately deployed TCP-to-WebSocket bridge. It is not a raw browser TCP socket, does not implement the bridge/server, and has not been tested against a production KPAH endpoint. Send and receive XOR cursors remain independent.
