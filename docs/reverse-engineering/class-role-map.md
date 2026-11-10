# KPAH 2.7.8 — bản đồ vai trò class từ bytecode

> Trạng thái: bản đồ nền dựa trên lần quét JAR gốc ngày 10/11/2026. Các class ở bảng anchor đã có bằng chứng trực tiếp từ superclass/interface, method signature, string constant hoặc luồng gọi đã xác minh. Nhóm ứng viên chưa được đổi tên và cần đối chiếu decompiler.

## Nguồn và kết quả quét

- JAR: `KPAH_278.jar`
- SHA-256: `d9679312f8ea646870915522f46290d0cc770a227a54f54e75d5d73968d27c40`
- Archive: 1.024 entries; 782 `.class`; 198 tài nguyên nội bộ được giải mã.
- Asset integrity: 198/198 tài nguyên giải mã khớp SHA-256; `assetVersion=9750a6d205d77c1d`.
- Bytecode: 782/782 class parse thành công, 0 lỗi; 3.094 methods; 19.878 method-call edges; 38.448 field-reference edges; 3.968 type-reference edges.
- Role suggestions: 16 anchor trong lần chạy role-ranker đầu tiên; 129 class có ít nhất một giả thuyết vai trò; 637 class chưa đủ tín hiệu. Sau khi CFR review, đã xác nhận thêm 17 class và cập nhật anchor registry; lần chạy role-ranker kế tiếp sẽ chốt lại số liệu.
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

| `acx` | Socket receive worker và inbound frame parser | Implements `Runnable`; đọc opcode, length, body từ `DataInputStream`, xử lý XOR và marker `0x80`, dispatch `acu`. |
| `acy` | Socket connection bootstrap worker | Mở `SocketConnection`, input/output streams, khởi chạy reader/writer và xếp handshake `-40`. |
| `acw` | Connection timeout watchdog | `Runnable` đợi 20 giây; nếu connection vẫn đang connect thì đóng socket và reset state. |
| `acz` | Outbound packet queue worker | `Runnable` duyệt outbound `Vector`, chỉ flush khi XOR handshake đã bật, sleep 10 ms giữa vòng lặp. |
| `ka` | Incoming opcode dispatcher | Implements `acs`; `switch(acu.a)` định tuyến các opcode tới `km.s`, `mj` và các handler. |
| `uk` | Server-list refresh worker | GET `NQSH2.txt`, parse name/host/port/byte, lưu RMS `ipnqsh`, cập nhật màn hình `uj`. |
| `ku` | Central asset/game-data manager | Khởi tạo nhiều pack `.sh`, `.wp`, `/nation`, `/t.type`, sprite/skill/effect/NPC assets và cache ảnh/animation. |
| `mh` | Bitmap font manager/renderer | Chứa glyph table tiếng Việt, width từng ký tự, load font atlas qua `ba` và vẽ bằng `Graphics.drawRegion`. |
| `hf` | Map data loader và tile/NPC layer renderer | Parse map width/height, tile index, overlay/object records; nạp `/npc.sh`, quản lý tile/NPC layer và vẽ tile. |
| `xg` | Inventory/equipment/character-function screen | Kế thừa `tj`; string `Hành trang`, `Trang bị`, `Kỹ năng`, `Tiềm năng`, `Giao dịch`, `Luyện đồ`, `Kho đồ`. |
| `im` | Sword-skill sprite animation renderer | Kế thừa `aq`; tạo `bc` từ `/sword skill/kiem01.png`, load `/sword skill/all1.png`, render theo frame. |
| `jo` | Public-skill resource handler | Kế thừa `ib`; load `/skillpublic.sh`, thao tác với entity/effect object. |
| `w` | Boss entity renderer | Kế thừa `cd`; dùng `/m/bosshothanh.png`, frame animation và world entity coordinates. |
| `r` | Dragon entity renderer | Kế thừa `cd`; load `/rong/Big0.png`, `/rong/shadow.png`, parse `/rong/dragonData`, vẽ frame/offset. |
| `ad` | Sprite-part frame data decoder/renderer | Parse byte stream thành image và frame/offset tables; vẽ các region từ atlas bằng `drawRegion`. |
| `i` | Animation frame data parser/renderer | Parse binary animation records, frame offsets and multiple frame tables; render image regions. |
| `cg` | Boss data cache/loader and request model | Load `/boss/{id}` frame records, cache vectors, request remote boss data bằng opcode `-47`. |

## Ứng viên còn lại cần review

Role-ranker đầu tiên còn 112 ứng viên sau khi loại 17 class đã được CFR xác nhận khỏi nhóm giả thuyết. Danh sách đầy đủ có trong JSON/Markdown artifact CI. Ưu tiên review tiếp các nhóm screen phụ (`sc`, `so`, `sg`), widget input (`xf`, `wu`), entity/model (`z`, `un`) và data/packet helpers (`qk`, `qj`, `qh`, `tx`). Các tên vai trò này vẫn là giả thuyết cho đến khi đối chiếu source cụ thể.

## Cách đọc kết quả

- Bảng anchor là các tên/vai trò đã có bằng chứng độc lập; không thay bằng tên tự đặt.
- Bảng ứng viên là thứ tự ưu tiên review, không phải kết luận decompile. Một class có thể có nhiều vai trò phụ.
- Heuristic scoring cố ý không tự rename class. Tín hiệu `Graphics`/`DataInputStream` xuất hiện ở nhiều class nên điểm vai trò có thể trùng và có false positive.
- CFR 0.152 decompile thành công 782/782 class thành source `.java`; artifact CI chứa decompiled source, JSON/Markdown role report và bytecode index (giữ 14 ngày).
- Bước tiếp theo: dùng CFR source làm cơ sở lập opcode/payload catalog B4–B16; sau đó xác minh schema map/tile/part/skill asset C1–C7.

## Các giới hạn chưa được xác nhận

- Chưa giải mã hoặc mô tả đầy đủ các file `qs`, `boss`, `dragonData`, `nation` theo schema có kiểm chứng.
- Chưa xác nhận đầy đủ chiều nhận của XOR, key cursor, reset key và ngoại lệ opcode `-128`.
- Chưa có bảng opcode C2S/S2C hoàn chỉnh; call graph chỉ cho biết quan hệ gọi, không tự xác định semantics từng packet.
- CFR 0.152 đã decompile toàn bộ 782 class thành 782 file `.java`; chưa review thủ công toàn bộ source và chưa chạy Vineflower để so sánh decompiler.

