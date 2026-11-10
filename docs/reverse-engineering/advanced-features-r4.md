# KPAH 2.7.8 — nhóm tính năng nâng cao R4 (WBS B10)

> Nguồn chính: CFR 0.152 decompile từ JAR 2.7.8 trong CI artifact; đối chiếu `tb.java`, `dh.java`, `xg.java`, `ku.java`, `mj.java`, `bf.java`, `wm.java`, `wu.java`, `ka.java`, `jy.java` và các callback `nv/nw/nx/ny/nz/oa`, `xo/xp/xs/xv`. Đây là đánh giá theo bằng chứng client, không khẳng định server đã được khôi phục.

## Kết luận tổng quan

B10 đang gộp nhiều hệ thống độc lập. JAR có bằng chứng rõ cho luyện/nâng cấp trang bị, giao diện trang bị thú/hợp đồ thú, cây thần/trồng cây/thu hoạch, bảng xếp hạng và một tương tác NPC yêu cầu vé lên tàu. Ngược lại, chưa tìm thấy UI/handler đủ rõ cho ngựa/mount, đấu trường hoặc đấu giá trong bản client 2.7.8 được phân tích.

Không nên coi toàn bộ B10 là một hạng mục có thể triển khai ngay. Tách thành các lát riêng và giữ những mục thiếu bằng chứng ở trạng thái discovery/needs confirmation.

## Ma trận phù hợp với JAR và tài nguyên hiện có

| Nhánh tính năng | Bằng chứng client 2.7.8 | Protocol / dữ liệu đã xác định | Mức phù hợp | Việc còn thiếu |
|---|---|---|---|---|
| Luyện/nâng cấp trang bị | `dh` có màn hình `Luyện đồ`; `xg` có action `Thăng cấp thường`, `Thăng cấp giữ thuộc tính`, sửa thuộc tính kỹ năng/khác, đóng dấu, khóa, tách trang bị. `ku` có lời NPC về luyện đồ | Callback `xo/xp/xs/xv` gọi C2S opcode `-25`; payload 2 byte: action type và item ID dạng byte. Các action type quan sát được: 10, 11, 15, 13. Cần trace thêm response/error và các opcode hỗ trợ nguyên liệu | <badge color="success">Cao</badge> | Quy tắc tiêu hao, xác suất, cấp tối đa, bảo toàn thuộc tính, vật liệu và kết quả server-authoritative
| Trang bị thú / hợp đồ thú | `tb` có menu `Trang bị thú`; `dh` có tab `Trang bị thú` và `Hợp đồ thú` | Có UI path nhưng chưa cô lập đầy đủ request/response dành riêng cho pet; item model `bo` được tái sử dụng nhiều hệ thống | <badge color="warning">Trung bình</badge> | Pet model/schema, chỉ số, slot, cấp, fusion recipe, nguồn hình/animation và các packet riêng
| Cây thần / nông trại | `tb` mở `wm`; `mj` xử lý object loại 10 (`bf`) với `Xem thông tin`, `Nâng cấp đất`, `Trồng cây`, `Thu hoạch`, `Nhổ bỏ`, `Mua đất`. `bf` giữ plot ID, vị trí, trạng thái cây và timer | S2C `-66` nạp danh sách/chi tiết farm; `wm` gửi C2S `-66` với action 1/2/3 và index; plot action gửi C2S `109` với action 4/0/1/3/2 tương ứng nâng cấp đất/trồng/thu hoạch/nhổ/mua. Cần xác nhận mọi payload và error response qua trace server | <badge color="success">Cao</badge> | Công thức thời gian, giống cây, chi phí, yield/reward, giới hạn plot, timezone và quy tắc đồng bộ timer
| Bảng xếp hạng / top | `tb` có `Top cao thủ`, `Top đại gia`, `Bảng Top`; `ka` dispatch S2C `-19` theo ranking type | S2C `-19`: byte ranking type + UTF title; type 5 có record guild riêng; type 4, 7, 8 được chuyển sang parser bảng top chung. Guild ranking và các top khác đã có một phần trong B9 | <badge color="success">Cao</badge> | Gán tên nghiệp vụ chắc chắn cho từng type, request caller, sort key, paging/refresh và schema toàn bộ ranking rows
| Tàu / di chuyển bằng vé | `ku` có lời NPC: người chơi phải có vé mới được lên tàu; có nhóm NPC/transport dialogue | Chỉ xác nhận được thông điệp điều kiện vé. Chưa xác định packet chọn tuyến, trừ vé, map destination hoặc server transition riêng | <badge color="warning">Thấp–trung bình</badge> | NPC ID/type, ticket item ID, route list, transition packet và map destinations
| Ngựa / mount | Không tìm thấy chuỗi UI/nghiệp vụ ngựa trong Java decompile; có pet equipment nhưng không đủ để đồng nhất pet với mount | Chưa có opcode/schema nào được gán đáng tin cậy cho ngựa/mount | <badge color="danger">Chưa có bằng chứng</badge> | Cần nguồn client khác, packet capture, resource naming hoặc xác nhận đây là tính năng thuộc phiên bản khác
| Đấu trường | Không tìm thấy UI/handler có nhãn hoặc luồng đấu trường trong decompile. `so` là màn hình `Hộp may mắn`, không phải arena | Không gán opcode `-62/-63` cho đấu trường: các handler này mở trò chơi `Hộp may mắn` và bảng chọn ô/số | <badge color="danger">Chưa có bằng chứng</badge> | Cần xác nhận tên/tính năng trong bản 2.7.8; không tái sử dụng mini-game opcode làm arena
| Đấu giá | Không tìm thấy UI, label hay handler đấu giá đủ rõ trong source decompile | Các luồng shop/trade/guild không được xem là auction nếu chưa có bằng chứng order/list/bid/settlement | <badge color="danger">Chưa có bằng chứng</badge> | Cần protocol capture hoặc source/version khác; xác định listing, bid, expiry, settlement và phí

## Trace chi tiết đã xác nhận

### 1. Luyện trang bị

- `dh.java` chứa tab `Luyện đồ`; `xg.java` dựng context menu cho trang bị và kiểm tra điều kiện trước khi cho phép action.
- `xo.java` gửi `jy.a().a(10, itemId)` — thăng cấp thường.
- `xp.java` gửi `jy.a().a(11, itemId)` — thăng cấp giữ thuộc tính.
- `xs.java` gửi `jy.a().a(15, itemId)` — sửa thuộc tính kỹ năng.
- `xv.java` gửi `jy.a().a(13, itemId)` — sửa thuộc tính khác.
- Các action khác dùng type 12 (khóa/khóa lại) và 14 (đóng dấu/đóng dấu lại). Không suy diễn xác suất hoặc vật liệu từ UI.

### 2. Cây thần

- `bf extends j` là world object loại 10; có plot ID `h`, tọa độ, tên/trạng thái và timer cây.
- `mj` tạo action menu theo trạng thái plot: plot đã mua cho phép xem, nâng cấp đất, trồng, thu hoạch, nhổ; plot chưa mua cho phép mua đất.
- `nv/nw/nx/ny/nz/oa` là callbacks trực tiếp cho từng action. C2S opcode `109` mang hai byte action + plot ID.
- `wm` là panel cây thần; server gửi list qua S2C `-66` subtype 0 và text/detail qua subtype 1. Các thao tác trong panel gọi C2S `-66` với action/index.
- Cần giữ farm timer ở server khi triển khai BE; client timer `bf` chỉ là hiển thị đếm ngược, không phải nguồn sự thật.

### 3. Pet và cổ vật

- Menu `tb` phân nhóm `Trang bị thú`, `Cây thần`, `Cổ vật`; pet tab có cả `Trang bị thú` và `Hợp đồ thú` trong `dh`.
- `wu` là panel có title `Cổ vật`; S2C `-67` được chuyển vào `mj.u(acu)` rồi `wu.a(acu)` để dựng tab và danh sách record. Đây là bằng chứng protocol cho dữ liệu cổ vật, không phải đấu giá.
- Cần trace request mở panel và callback từng pet action trước khi đóng schema API.

### 4. Ranking và các mục không xác minh

- Top ranking S2C `-19` đã được ghi ở B9; B10 chỉ cần tham chiếu, không tạo hệ thống ranking trùng lặp.
- NPC boat dialogue chỉ chứng minh có kiểm tra vé; chưa đủ để mô tả tuyến tàu.
- Không thấy bằng chứng đủ mạnh cho horse/mount, arena hoặc auction. Các mục này phải được giữ là unknown/confirm version, không dựng mock gameplay rồi đánh dấu hoàn thành.

## Đề xuất tách WBS

| WBS đề xuất | Nội dung | Ưu tiên | Trạng thái discovery |
|---|---|---|---|
| B10.1 | Luyện/nâng cấp trang bị và sửa thuộc tính | P1 | Có thể tiếp tục trace protocol và data rules
| B10.2 | Trang bị thú và hợp đồ thú | P2 | Cần hoàn thiện packet map
| B10.3 | Cây thần: mua đất, nâng cấp, trồng, tăng tốc, thu hoạch, nhổ | P2 | Client flow và packet nền đã có
| B10.4 | Ranking/top | P1 | Gộp với B9, không làm trùng
| B10.5 | Vé tàu và chuyển tuyến | P2 | Cần xác định NPC/route/map transition
| B10.6 | Ngựa/mount | P3 | Chờ bằng chứng
| B10.7 | Đấu trường | P3 | Chờ bằng chứng
| B10.8 | Đấu giá | P3 | Chờ bằng chứng

## Rủi ro khi phát triển web

1. Không đưa xác suất luyện đồ, giá, nguyên liệu, reward hoặc timer thành luật cứng nếu chưa tìm được server source/config.
2. Không dùng client countdown để quyết định thu hoạch; BE phải lưu thời điểm bắt đầu/kết thúc theo server clock.
3. Pet/gear/artifact dùng chung item model không có nghĩa là cùng lifecycle hoặc cùng API.
4. Ranking đã có ở B9; tránh đếm lại tiến độ.
5. Nếu arena/auction/horse không thuộc JAR 2.7.8, cần xác nhận WBS đang trộn version trước khi triển khai.

## Nguồn code đã truy vết

- `tb.java`: menu nhóm nhân vật, pet, cây thần, cổ vật, top.
- `dh.java`, `xg.java`, `xo.java`, `xp.java`, `xs.java`, `xv.java`: luyện và thao tác trang bị.
- `mj.java`, `bf.java`, `nv.java`, `nw.java`, `nx.java`, `ny.java`, `nz.java`, `oa.java`: world plot/farm action.
- `wm.java`, `wt.java`: panel cây thần và lựa chọn plot/seed.
- `wu.java`: cổ vật; `ka.java`: inbound dispatch; `jy.java`: outbound packet builders.
- `ku.java`: NPC dialogue strings, gồm điều kiện vé lên tàu.

