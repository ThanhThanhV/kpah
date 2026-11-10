# KPAH 2.7.8 — bản đồ vai trò class từ bytecode

> Trạng thái: bản đồ nền dựa trên lần quét JAR gốc ngày 10/11/2026. Các class ở bảng anchor đã có bằng chứng trực tiếp từ superclass/interface, method signature, string constant hoặc luồng gọi đã xác minh. Nhóm ứng viên chưa được đổi tên và cần đối chiếu decompiler.

## Nguồn và kết quả quét

- JAR: `KPAH_278.jar`
- SHA-256: `d9679312f8ea646870915522f46290d0cc770a227a54f54e75d5d73968d27c40`
- Archive: 1.024 entries; 782 `.class`; 198 tài nguyên nội bộ được giải mã.
- Asset integrity: 198/198 tài nguyên giải mã khớp SHA-256; `assetVersion=9750a6d205d77c1d`.
- Bytecode: 782/782 class parse thành công, 0 lỗi; 3.094 methods; 19.878 method-call edges; 38.448 field-reference edges; 3.968 type-reference edges.
- Role suggestions: 16 anchor đã biết; 129 class có ít nhất một giả thuyết vai trò; 637 class chưa đủ tín hiệu.
- CI run: [#42781275080](https://github.com/ThanhThanhV/kpah/actions/runs/42781275080). Artifact: `kpah-original-jar-analysis`.

## Anchor đã xác minh

| Class | Vai trò | Bằng chứng chính |
|---|---|---|
| `game.GameMidlet` | MIDlet entry point | Extends `javax.microedition.midlet.MIDlet`; lifecycle `startApp`, `pauseApp`, `destroyApp`; version `2.7.8`. |
| `km` | Canvas chính, vòng lặp render/input | Extends MIDP `Canvas`; implements `Runnable`, `CommandListener`; `run`, `paint`, `keyPressed`, `pointerPressed`; giữ screen/world state. |
| `tj` | Base class cho screen/state | Abstract screen-like base; nhận `Graphics`, chuyển state và lifecycle callbacks; các màn hình `uj`, `ro`, `lj`, `ls`, `li`, `mj`, `tb` kế thừa. |
| `uj` | Màn hình chọn server | Kế thừa `tj`; chứa danh sách server/host/port, tên vùng và thao tác chọn/cập nhật. |
| `ro` | Màn hình đăng nhập | Kế thừa `tj`; string `Game ID:`, `Password:`, `Đăng nhập`, `Đăng ký`, `nqshlogin`. |
| `lj` | Màn hình chọn nhân vật | Kế thừa `tj`; string `Chọn nhân vật:`, `Tạo mới`, `Xóa`, `Khôi phục`. |
| `ls` | Màn hình tạo nhân vật | Kế thừa `tj`; string năm hệ/phái, giới tính, tóc, vũ khí và nút tạo. |
| `li` | Màn hình chuyển/loading | Kế thừa `tj`; state/progress fields và hàm render/loading. |
| `mj` | World screen/state và renderer chính | Kế thừa `tj`; 205 methods, gần 3.000 call edges; chứa xử lý map/entity, chat, nhóm, giao dịch và các sự kiện thế giới. |
| `tb` | Menu chức năng trong game | Kế thừa `tj`; string `Bang hội`, `Bạn bè`, `Bản đồ lớn`, `Bảng Top`, cài đặt và các mục menu. |
| `ba` | Bộ đọc gói tài nguyên `.sh/.wp/.wps` | Method nhận tên file, trả `Image`, byte array và `InputStream`; string `.png`, `/c/body/`, `/c/coat/`, `/c/hat/`, `/c/head/`, `/c/leg/`. |
| `bc` | Helper vẽ frame/region sprite | Nhận `Image`, kích thước frame và `Graphics`; có hàm draw-region theo tọa độ/frame. |
| `acu` | Packet builder / reader-writer | Constructor nhận opcode/payload; method trả byte array, `DataInputStream`, `DataOutputStream`. |
| `acv` | Connection/transport state | Methods thao tác `SocketConnection`, `DataOutputStream`, opcode/packet và worker; liên kết với `acu`, `acz`. |
| `kv` | Startup/resource initialization worker | Implements `Runnable`; `run()` khởi tạo tài nguyên và kích hoạt bước startup tiếp theo. |
| `jy` | Protocol request/handshake helper | Kế thừa `jx`; nhiều method dựng `acu` với opcode và payload; liên quan login/handshake. |

## Ứng viên vai trò cần decompile/review

| Class | Vai trò ứng viên | Bằng chứng bytecode/tài nguyên | Mức xác nhận |
|---|---|---|---|
| `uk` | Tải/cập nhật danh sách server | Giữ tham chiếu `uj`; URL `http://teamobi.com/srvips/NQSH2.txt`; `ipnqsh`; dùng stream và callback `bg`. | Cao, cần xác nhận body |
| `ku` | Resource/data manager cấp cao | Nạp `/main.sh`, `/arrow.sh`, `/box.sh`, `/eff.sh`, `/g.sh`, `.wp`, `.png`, `/t.png`, `/t.type`, `/nation`, `/wpsplash/`; gọi `ba`, `Graphics`, `Image`. | Cao, phạm vi trách nhiệm cần tách |
| `mh` | Bitmap font manager/renderer | Charset tiếng Việt đầy đủ; `/font.sh`, `/arial11.png`, `/font/fbv.png`, các font ID; nhận `Graphics`. | Cao |
| `hf` | NPC pack/data loader | String `/npc.sh`, `DataInputStream`, `Hashtable`, các hàm nhận dữ liệu và render. | Cao |
| `ka` | Incoming command/message dispatcher | Implements `acs`; method `a(Lacu;)V` có bytecode lớn; nhiều nhánh xử lý thông báo, nhiệm vụ, bang hội, item; liên kết `mj`, `acu`, `DataInputStream`. | Cao, cần lập bảng opcode |
| `acx` | Network worker | Implements `Runnable`; giữ `acv`; `run()` gọi `DataInputStream`, `acv`, `acu`. | Trung bình-cao |
| `acy` | Connection/session worker | Implements `Runnable`; giữ `acv` và `String`; liên kết `acw`, `acs`, `Thread`. | Trung bình |
| `acw` | Socket connection worker | Implements `Runnable`; giữ `acy`; tham chiếu `javax.microedition.io.Connection`, `acv`. | Trung bình |
| `xg` | Màn hình túi đồ/trang bị/kỹ năng/chức năng nhân vật | Kế thừa `tj`; string `Hành trang`, `Trang bị`, `Kỹ năng`, `Tiềm năng`, `Giao dịch`, `Luyện đồ`, `Kho đồ`, `Thú cưng`. | Cao |
| `im` | Renderer/loader animation vũ khí hoặc skill | Kế thừa `aq`; nạp `/sword skill/all1.png`, `/sword skill/kiem01.png`; dùng `bc`. | Cao, cần phân biệt skill và weapon |
| `jo` | Resource/animation handler cho skill công cộng | Kế thừa `ib`; nạp `/skillpublic.sh`; liên kết `ku`, `z`. | Cao, cần xác nhận cách render |
| `w` | Boss entity renderer | Kế thừa `cd`; nạp `/m/bosshothanh.png`; nhận world entity `j`. | Cao |
| `r` | Dragon entity renderer | Kế thừa `cd`; nạp `/rong/Big0.png`, `/rong/shadow.png`, `/rong/dragonData`. | Cao |
| `ad` | Character-part/sprite data renderer | Mảng dữ liệu 2 chiều, `Image`, byte array; string `LOI PART`; có hàm vẽ `Graphics`. | Trung bình-cao |
| `i` | Effect/frame data decoder | Nhận byte array; string `loi dataeff:`; tạo frame/region và render bằng `Image`/`Graphics`. | Trung bình-cao |
| `cg` | Boss data loader | String `/boss/`, `_h`, `data`; parse byte arrays và danh sách entity. | Cao |

## Cách đọc kết quả

- Bảng anchor là các tên/vai trò đã có bằng chứng độc lập; không thay bằng tên tự đặt.
- Bảng ứng viên là thứ tự ưu tiên review, không phải kết luận decompile. Một class có thể có nhiều vai trò phụ.
- Heuristic scoring cố ý không tự rename class. Tín hiệu `Graphics`/`DataInputStream` xuất hiện ở nhiều class nên điểm vai trò có thể trùng và có false positive.
- Full JSON/Markdown role report và bytecode index nằm trong artifact CI `kpah-original-jar-analysis` (giữ 14 ngày).
- Bước tiếp theo: đối chiếu CFR/Vineflower, bắt đầu từ `acv/acx/acy/acw/ka/acu/jy` để chốt protocol, sau đó `ku/ba/hf/mh/ad/i/cg` để chốt asset/data pipeline.

## Các giới hạn chưa được xác nhận

- Chưa giải mã hoặc mô tả đầy đủ các file `qs`, `boss`, `dragonData`, `nation` theo schema có kiểm chứng.
- Chưa xác nhận đầy đủ chiều nhận của XOR, key cursor, reset key và ngoại lệ opcode `-128`.
- Chưa có bảng opcode C2S/S2C hoàn chỉnh; call graph chỉ cho biết quan hệ gọi, không tự xác định semantics từng packet.
- Chưa dùng decompiler để review source toàn bộ 782 class ở phiên cập nhật này; job CFR đang được bổ sung vào CI.

