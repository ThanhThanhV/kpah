# KPAH 2.7.8 — Auth, server list và nhân vật

> Đặc tả này được trích từ CFR 0.152 source của JAR gốc. Các byte/field được ghi theo đúng thứ tự đọc/ghi; tên field nghiệp vụ chỉ dùng khi caller và dữ liệu nguồn xác nhận.

## Danh sách server

- Server list không lấy từ TCP opcode. `uk.a()` gọi HTTP GET `http://teamobi.com/srvips/NQSH2.txt` qua `GameMidlet.a(url)`.
- Response được tách thành các record bằng dấu phẩy; mỗi record tách bằng dấu `:` thành `name`, `host`, `port`, `extraByte`.
- `port` parse thành `short`, `extraByte` parse thành `byte`.
- Danh sách được lưu vào MIDP RMS với key `ipnqsh` theo format: count byte, sau đó mỗi server là UTF name, UTF host, short port, byte extra.
- Chọn server dùng host/port để mở `socket://host:port`; `extraByte` được đưa vào login opcode 1 và create-character opcode 14.

## Login

### Client → server

`rq.run()` đợi 500 ms, gọi `jy.e()` rồi gọi `jy.a(gameId, password, GameMidlet.c)`.

| Opcode | Payload theo thứ tự | Bằng chứng |
|---:|---|---|
| `-1` (`0xFF`) | `writeByte(2)` | `jy.e()`; được gửi ngay trước login request |
| `1` (`0x01`) | 1. UTF gameId; 2. UTF password; 3. UTF client version (`GameMidlet.c`, hiện là `2.7.8`); 4. UTF `microedition.platform`; 5. UTF `GameMidlet.d`; 6. UTF `GameMidlet.e`; 7. UTF `GameMidlet.f`; 8. byte `0`; 9. short `km.m`; 10. byte `km.b ? -1 : 0`; 11. byte server extra (hoặc `0` nếu index ngoài range) | `jy.a(String,String,String)`; caller `rq.run()` |

`GameMidlet.d/e/f` là client metadata fields; không gán tên nghiệp vụ sâu hơn nếu chưa truy vết nơi cập nhật. `GameMidlet.e/f` có thể được server cập nhật từ response opcode 2 (`provider`, `agent`).

### Server → client

- Opcode `1` là packet khởi tạo lớn: cập nhật cấu hình/nhóm dữ liệu trước khi hoàn tất login state. Chưa tách toàn bộ schema trong tài liệu này.
- Opcode `2` có nhiều nhánh theo prefix UTF đầu tiên: prefix `2` đọc danh sách chuỗi/short/chuỗi; prefix `3` đọc hai UTF và lưu thành `provider`/`agent`; nhánh còn lại hiển thị thông báo.
- Opcode `13` trả danh sách nhân vật (xem phần dưới).

## Đăng ký

- C2S opcode `39`: 5 trường UTF theo thứ tự: hai tham số của caller, `GameMidlet.d`, `GameMidlet.e`, `GameMidlet.f`.
- S2C opcode `39`: UTF message, boolean result, UTF SMS text/prefix, UTF SMS destination. Nếu boolean false, client báo tên tài khoản cần chọn lại; nếu true, client gọi `platformRequest` với URI `sms://...`.
- Chưa đổi tên hai tham số UTF đầu thành phone/account field vì cần đối chiếu UI registration caller cụ thể.

## Danh sách / chọn / xóa / khôi phục nhân vật

### Client → server — opcode 13

| Subcommand byte | Ý nghĩa từ caller | Payload sau subcommand |
|---:|---|---|
| `1` | Chọn nhân vật | int character ID |
| `2` | Xóa nhân vật | int character ID |
| `3` | Khôi phục nhân vật | int character ID |

Caller đã xác minh: `lk` gửi subcommand 1; `ln` gửi 2; `lp` gửi 3. Cả ba đều dùng ID `ca.ad` lấy từ roster.

### Server → client — opcode 13

Byte đầu là số nhân vật. Nếu giá trị `-1`, payload tiếp theo là UTF error message. Nếu không, đọc N character records:

1. int character ID
2. UTF character name
3. byte status/type
4. byte attribute-count; lặp attribute-count lần: byte attribute-key + byte attribute-value
5. short level
6. byte `ac` status và byte `t` marker
7. short `dk` remaining duration
8. byte appearance/part marker; nếu khác `-1`: short + byte[] part data, short + byte[] part data, byte `bc`, byte `bd`

Sau N record có thể có phần mở rộng: mỗi record đọc int character ID; nếu ID khớp record tương ứng thì đọc thêm short, byte, byte, short, byte, byte, short, byte, byte. Client dùng các trường này làm thông tin phụ cho roster.

Handler `ka` gọi `lj.a().a(caArray)` rồi `lj.a().b()` để cập nhật màn hình chọn nhân vật.

### Tạo nhân vật — C2S opcode 14

Payload theo thứ tự:

1. UTF character name
2. byte profession index (0–4)
3. byte gender code (2 = Nam, 3 = Nữ theo `ab`)
4. byte gender index (0/1)
5. byte hair index
6. byte server extra (`uj.j[uj.a]`)

Caller `lv` gửi name, profession index, gender code, gender index và hair index. Danh sách 5 profession và 6 hair styles nằm trong `ls`.

### Tạo nhân vật — S2C opcode 14

Handler hiện chỉ hiển thị thông báo `Xin chọn tên nhân vật khác`. Chưa xác định success response riêng; cần tiếp tục truy vết luồng server trả roster opcode 13 sau khi tạo thành công.

## Các bước tiếp theo

- Đối chiếu response opcode 1 và 3 để tách schema character state đầy đủ.
- Truy vết registration caller để đặt tên chính xác cho hai UTF đầu của opcode 39.
- Gắn từng outbound method của `jy` với caller UI/gameplay và annotate 106 opcode C2S thực sự được enqueue.
- Chỉ triển khai backend DTO/handler sau khi payload schema và điều kiện trạng thái được rà soát xong.

