# KPAH 2.7.8 — local TCP handshake/replay harness

## Mục tiêu

`tools/kpah_replay_harness.py` là mock TCP server chạy loopback để quan sát bước mở socket, XOR handshake và các packet C2S đầu tiên của client MIDP gốc. Nó không kết nối tới server game thật và không ghi nội dung login credentials.

## Cách chạy

```bash
python tools/kpah_replay_harness.py --host 127.0.0.1 --port 22100 --encoded-key 1020304050 --max-packets 3
```

1. Chạy mock server trên máy host.
2. Cấu hình emulator/MIDlet trỏ tới endpoint loopback có thể truy cập từ emulator; cách bridge host phụ thuộc emulator đang dùng.
3. Khi client kết nối, mock server gửi S2C opcode `-40` không mã hóa, payload gồm key length + prefix-XOR key bytes.
4. Client giải mã key và flush các packet đã queue; harness đọc frame C2S có XOR, giữ send cursor qua từng frame.
5. Harness in opcode và payload length. Payload opcode `1` luôn bị redacted vì chứa thông tin tài khoản/client.

## Thứ tự handshake được mô phỏng

```mermaid
sequenceDiagram
    participant MIDlet as Original MIDlet
    participant Mock as Loopback TCP mock
    MIDlet->>Mock: TCP connect
    Note over MIDlet: Queue empty C2S -40; writer waits for XOR key
    Mock->>MIDlet: S2C -40 (plain keyLength + encoded key)
    Note over MIDlet: Derive XOR key; enable encrypted writer
    MIDlet->>Mock: C2S -40 (encrypted queued probe)
    MIDlet->>Mock: C2S -1 (session init)
    MIDlet->>Mock: C2S 1 (login; payload redacted)
    Note over Mock: Capture initial handshake only; close socket
```

Điểm quan trọng: client không gửi probe `-40` rõ trước khi nhận key. Nó enqueue packet này, chờ S2C `-40`, rồi mới flush queue. Harness đã mô phỏng đúng thứ tự này.

## Giới hạn hiện tại

- Harness chỉ mô phỏng handshake và thu tối đa N packet C2S đầu tiên; chưa giả lập response auth, character roster, map hoặc gameplay.
- Chưa chạy thử JAR trong emulator thật; self-test hiện dùng `socketpair` và synthetic key/frame vectors.
- Chưa có WebSocket↔TCP bridge. Đây là mock TCP endpoint dành cho MIDlet gốc; gateway cho browser client vẫn thuộc phần network/backend cần chốt sau.
- Không log payload login, password, Game ID hoặc các client identifiers.
- Chỉ cho phép bind địa chỉ loopback; không dùng để scan hoặc kết nối server production.

## Kiểm tra

```bash
npm run test:replay-harness
```

CI chạy self-test kiểm tra framing, XOR cursor và server handshake frame. Bài test này chưa thay thế emulator replay.

