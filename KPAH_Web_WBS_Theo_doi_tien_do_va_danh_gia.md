# KPAH Web — WBS theo dõi tiến độ & đánh giá tài nguyên

> Nguồn: `KPAH_Web_WBS_v2.xlsx` (commit trên `main`, 10/11/2026). Bản Markdown này chuyển WBS thành checklist theo task để cập nhật trực tiếp. Trạng thái được đối chiếu với phần client đã triển khai trong repo; không coi mock/local demo là backend hoặc tính năng game hoàn chỉnh.

## 1. Tổng quan

| Chỉ số | Giá trị |
|---|---:|
| Số task | 118 |
| Tổng ước lượng | 737 ngày công |
| Dự phòng trong Excel | 15% |
| Tổng có dự phòng | 848 ngày công |
| Nhân sự giả định | 5 người (1 RE/tools, 2 server, 2 client; QA/PM/OPS kiêm nhiệm) |
| Lịch lý thuyết | khoảng 34 tuần / 7,8 tháng, nếu song song hoàn hảo |
| Độ phủ mục tiêu | 26/27 tính năng được liệt kê; chỉ là đếm đầu mục, không đại diện độ sâu |

### Ước lượng theo đợt

| Đợt | Số task | Ngày công | Tỷ trọng |
|---|---:|---:|---:|
| R1 | 50 | 291 | 39.5% |
| R2 | 27 | 167 | 22.7% |
| R3 | 19 | 108 | 14.7% |
| R4 | 14 | 127 | 17.2% |
| R5 | 8 | 44 | 6.0% |

### Ước lượng theo nhóm

| Nhóm | Phạm vi | Ngày công |
|---|---|---:|
| A – Quản lý, pháp lý, bàn giao | | 49 |
| B – Reverse engineering và đặc tả | | 69 |
| C – Tài nguyên và dữ liệu | | 86 |
| D – Server core | | 66 |
| E – Client core | | 82 |
| F – Gameplay 5 hệ và chiến đấu | | 148 |
| G – Kinh tế, xã hội, nâng cao | | 119 |
| H – QA, bảo mật, cân bằng | | 75 |
| I – Hạ tầng và vận hành | | 43 |

## 1.1. Bản chuẩn theo dõi tiến độ

**Đây là tài liệu WBS chuẩn của dự án.** Từ ngày 10/11/2026, mọi báo cáo tiến độ và thứ tự triển khai phải đối chiếu task ID trong file này; không dùng phần trăm của roadmap 41 mục cũ để thay thế.

| Trạng thái baseline | Số lượng |
|---|---:|
| Task đã nghiệm thu đầy đủ theo tiêu chí WBS | 0/118 |
| Task đã có một phần triển khai/prototype được xác minh | 19/118 |
| Task chưa có triển khai được ghi nhận | 99/118 |

> 0 task nghiệm thu không có nghĩa repo chưa có sản phẩm. Các phần demo/local/prototype đã được ghi trong cột **Tình trạng hiện tại**, nhưng chưa đạt toàn bộ tiêu chí WBS (đặc biệt là nguồn dữ liệu gốc, server-authoritative, persistence và kiểm thử).

**Quy ước trạng thái**
- `[ ]` + `Chưa triển khai`: chưa có bằng chứng triển khai.
- `[ ]` + `Một phần`: đã có prototype hoặc một số hạng mục con; chưa đạt Definition of Done.
- `[x]`: chỉ dùng khi toàn bộ phạm vi và tiêu chí nghiệm thu của task đã được kiểm chứng.
- Khi task thay đổi, cập nhật cùng lúc cột **Tình trạng hiện tại**, checkbox nếu đủ điều kiện, và nhật ký commit/bằng chứng ở cuối file.

**Nguyên tắc triển khai:** ưu tiên hoàn tất các phụ thuộc R1/P0 theo thứ tự có thể kiểm chứng; không giả định dữ liệu gameplay/asset chưa được xác minh. Client, reverse engineering và asset tooling được tiếp tục trước. Trước khi bắt đầu triển khai backend/gateway, sẽ có checkpoint riêng để chốt protocol, transport TCP/WebSocket, persistence và stack BE theo WBS.

## 2. Cách cập nhật

- Đổi `[ ]` thành `[x]` chỉ khi nghiệm thu đạt đúng cột sản phẩm/tiêu chí; task làm dở vẫn để `[ ]` và ghi rõ trạng thái.
- Cột **Tình trạng hiện tại** phản ánh code đã xác minh trong repo đến thời điểm tạo tài liệu, không phải phần trăm hoàn thành tự ước lượng.
- `Một phần` chỉ có nghĩa đã có prototype/đầu việc con; không đồng nghĩa task WBS đã hoàn tất.
- Cập nhật ngày, commit SHA, người phụ trách và bằng chứng nghiệm thu trong phần nhật ký cuối file.

## 3. WBS chi tiết

### Nhóm A — Quản lý, pháp lý, bàn giao

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | A1 | R1 | P0 | Kickoff, chốt scope, Definition of Done | Workshop 1 buổi: chốt backlog theo 5 đợt bàn giao; DoD = build chạy, test xanh, có tài liệu, có demo |  | PM | 2 | Chưa triển khai theo WBS |
| [ ] | A2 | R1 | P0 | Rà soát bản quyền, kế hoạch thay asset | Liệt kê asset/tên/nhân vật gốc, gắn cờ original hoặc replaced, quyết định mức thay thế trước khi công khai | A1 | PM | 3 | Chưa triển khai theo WBS |
| [ ] | A3 | R1 | P0 | Monorepo và quy trình làm việc | client/ (pnpm), server/ (Maven đa module), tools/ (Python), docs/; trunk-based, PR bắt buộc, pre-commit lint | A1 | OPS | 4 | Một phần – repo client hiện có, chưa phải monorepo client/server/tools như mô tả |
| [ ] | A4 | R1 | P0 | Quản lý dự án, họp, báo cáo tuần (trải đều) | Sprint 2 tuần, demo cuối sprint, theo dõi burn-down theo md |  | PM | 30 | Chưa triển khai theo WBS |
| [ ] | A5 | R1 | P0 | Gói bàn giao cho mỗi đợt R1-R5 | Mỗi đợt có release notes, tag bản build, migration DB, hướng dẫn chạy, video demo, checklist nghiệm thu | A1 | PM | 10 | Chưa triển khai theo WBS |

### Nhóm B — Reverse engineering và đặc tả

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | B1 | R1 | P0 | Toolchain phân tích bytecode | Mở rộng bộ đọc constant pool và disassembler Python đã có: xuất call-graph, tìm theo mã lệnh/chuỗi; đối chiếu bằng Vineflower hoặc CFR trên máy có mạng | A3 | RE | 3 | Một phần – đã có Python class-file parser, đọc constant pool/metadata, disassemble bytecode cơ bản, đếm opcode, tạo call graph và lọc chuỗi/opcode; class được trích riêng khỏi public assets; smoke test bằng class Java tổng hợp đạt, chưa scan 782 class gốc |
| [ ] | B2 | R1 | P0 | Khôi phục tên class theo vai trò | Đặt tên theo chuỗi UI, tài nguyên được nạp, kiểu tham chiếu; ghi bản đồ a->tên thật | B1 | RE | 5 | Một phần – đã có công cụ xếp hạng vai trò ứng viên theo constant strings, superclass/interface, method/field signature và call graph; giữ các anchor đã xác minh; chưa có role map hoàn chỉnh vì chưa chạy trên class gốc |
| [ ] | B3 | R1 | P0 | Đặc tả transport: khung gói, handshake, XOR | Xác nhận chiều ghi (acz), con trỏ khóa gửi, gói -128; viết test vector hai chiều | B1 | RE | 2 | Chưa triển khai theo WBS |
| [ ] | B4 | R1 | P0 | Trích lệnh: Auth, danh sách server, nhân vật | Lần theo handler ka.a cho cmd đăng nhập, chọn/tạo nhân vật; ghi field theo thứ tự đọc/ghi | B2,B3 | RE | 4 | Chưa triển khai theo WBS |
| [ ] | B5 | R1 | P0 | Trích lệnh: Map, di chuyển, đối tượng (người, mob, NPC, đồ rơi) | Như B4 cho các cmd vào map, thêm/xóa đối tượng, vị trí; xử lý các hàm phụ mà 88 lệnh đẩy sang | B4 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | B6 | R2 | P0 | Trích lệnh: Chiến đấu, kỹ năng, buff | Như B4 cho tấn công, sát thương, hiệu ứng, cooldown, buff/debuff | B5 | RE | 4 | Chưa triển khai theo WBS |
| [ ] | B7 | R2 | P0 | Trích lệnh: Túi đồ, trang bị, cửa hàng, giao dịch | Như B4 cho item, slot, mặc/tháo, mua/bán, giao dịch | B5 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | B8 | R2 | P1 | Trích lệnh: NPC, menu, nhiệm vụ | Như B4 cho menu/hội thoại NPC và trạng thái nhiệm vụ | B5 | RE | 3 | Chưa triển khai theo WBS |
| [ ] | B9 | R3 | P1 | Trích lệnh: Chat, bạn bè, nhóm, bang hội | Như B4 cho các cmd xã hội, mời/chấp nhận/từ chối | B5 | RE | 4 | Chưa triển khai theo WBS |
| [ ] | B10 | R4 | P2 | Trích lệnh: luyện đồ, linh thú, ngựa, đấu trường, đấu giá, top, trồng cây, tàu | Như B4 cho nhóm tính năng nâng cao; ưu tiên theo thứ tự đợt R4 | B5 | RE | 6 | Chưa triển khai theo WBS |
| [ ] | B11 | R2 | P1 | Trích toàn bộ lệnh client gửi lên (C2S) | Quét mọi nơi dựng gói gửi (new acu), kể cả cmd truyền bằng biến; đối chiếu với S2C | B5 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | B12 | R1 | P0 | Đặc tả máy trạng thái client | Vẽ luồng login -> chọn server -> chọn nhân vật -> vào map -> chơi và các trạng thái ngắt kết nối | B4 | RE | 4 | Chưa triển khai theo WBS |
| [ ] | B13 | R2 | P1 | Đặc tả công thức phía client | Ghi lại tốc độ, quãng nhảy, hiển thị sát thương, tính toán dự đoán phía client | B6 | RE | 4 | Chưa triển khai theo WBS |
| [ ] | B14 | R1 | P0 | Codegen Java/TS từ protocol.yaml | Sinh enum Cmd, lớp request/response, reader/writer cho cả hai ngôn ngữ; kiểm tra lệch bằng test vector | B3 | RE | 6 | Chưa triển khai theo WBS |
| [ ] | B15 | R1 | P0 | Replay harness: jar gốc chạy với server mock | Dựng server mock WS<->TCP đóng gói đúng khung, cho jar gốc trên emulator nói chuyện để kiểm chứng đặc tả | B14 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | B16 | R1 | P0 | Danh mục dữ liệu server phải gửi lúc đăng nhập | Phân tích các lệnh khởi tạo (1, 3, 5, 15, 16...): tile, part, item, skill, map; chốt server phải gửi gì và định dạng | B4 | RE | 4 | Chưa triển khai theo WBS |

### Nhóm C — Tài nguyên và dữ liệu

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | C1 | R1 | P0 | Giải mã định dạng .sh, .wp, .wps, qs, boss, dragonData, nation | Đọc code parse trong client, viết lại bộ giải mã (nhiều file bị XOR); kiểm tra bằng render lại ảnh | B2 | RE | 8 | Một phần – đã giải mã .sh/.wp/.wps; các định dạng qs/boss/dragonData/nation chưa xác minh đầy đủ |
| [ ] | C2 | R1 | P0 | Convert part nhân vật (body, leg, head, coat, hat) | Tách metadata + PNG, gộp atlas theo bộ part, xuất JSON frame/offset | C1 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | C3 | R1 | P0 | Convert vũ khí và hiệu ứng chém của 5 hệ | Xử lý wpsplash/* (kiem, daidao, cung, bua, phapsu) thành atlas + animation JSON | C1 | RE | 6 | Một phần – đã giải mã 5 nhóm ảnh giới thiệu môn phái; chưa chứng minh đây là bộ vũ khí/animation chiến đấu |
| [ ] | C4 | R2 | P1 | Convert hiệu ứng skill và icon | eff.sh, sword skill/*, skillpublic.sh thành atlas và bảng animation | C1 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | C5 | R2 | P1 | Convert NPC, mob, boss, rồng | npc.sh, boss/*, rong/* thành sprite sheet và bảng frame | C1 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | C6 | R1 | P0 | Convert tile, .type, dữ liệu map | t.png (16x3712) thành tileset; .type thành bảng va chạm/loại ô; map thành JSON | C1 | RE | 5 | Chưa triển khai theo WBS |
| [ ] | C7 | R1 | P0 | Bitmap font và tiếng Việt | Chuyển arial11/fbv sang bitmap font; kiểm tra bộ dấu tiếng Việt, fallback web font | C1 | CL | 3 | Chưa triển khai theo WBS |
| [ ] | C8 | R3 | P2 | Chọn hoặc mua âm thanh mới (jar không có) | Chọn nhạc nền, SFX đánh/nhặt/UI từ nguồn có giấy phép; nén OGG | A2 | PM | 3 | Chưa triển khai theo WBS |
| [ ] | C9 | R1 | P0 | Pipeline build asset tự động, versioning | Một lệnh chạy toàn bộ converter, xuất manifest có hash để cache-busting | C2 | OPS | 3 | Một phần – extractor ghi SHA-256 cho JAR, từng entry và tài nguyên giải mã; tạo assetVersion fingerprint, loader tự thêm query version để cache-busting. đã có lệnh verify hash tài nguyên/assetVersion; CI/build pipeline và atlas manifest còn thiếu |
| [ ] | C10 | R1 | P0 | Thiết kế game tối thiểu (GDD) | Công thức sát thương, phòng thủ, EXP, đường cong level, drop, thông số cơ bản cho 5 hệ; viết dưới dạng bảng tham số | B13 | SV | 10 | Chưa triển khai theo WBS |
| [ ] | C11 | R1 | P0 | Soạn dữ liệu tĩnh bộ 1: lõi chơi | 5 hệ, skill cơ bản, ~30 item, ~10 mob, 3 map, NPC/shop khởi đầu | C10 | SV | 8 | Chưa triển khai theo WBS |
| [ ] | C12 | R3 | P1 | Soạn dữ liệu tĩnh bộ 2: nội dung chính | Thêm item/mob/map, chuỗi nhiệm vụ, boss, tàu/vé, ngựa | C11 | SV | 12 | Chưa triển khai theo WBS |
| [ ] | C13 | R4 | P2 | Soạn dữ liệu tĩnh bộ 3: hệ thống nâng cao | Công thức luyện đồ, linh thú, kỹ năng/nhiệm vụ bang, đấu trường, cây trồng, thương nhân | C12 | SV | 8 | Chưa triển khai theo WBS |
| [ ] | C14 | R1 | P0 | Trình nạp dữ liệu tĩnh YAML sang MySQL | Loader idempotent theo checksum, validate bằng JSON Schema, hot-reload cho môi trường dev | D6 | SV | 5 | Chưa triển khai theo WBS |
| [ ] | C15 | R5 | P3 | Art và âm thanh thay thế để công khai (tùy chọn) | Chỉ làm khi công khai hoặc thu tiền; ước lượng tạm 40-80 md hoặc thuê ngoài, chốt sau A2; KHÔNG tính vào tổng | A2 | PM | 0 | Chưa triển khai theo WBS |

### Nhóm D — Server core

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | D1 | R1 | P0 | Gateway WebSocket | Netty 4.1 WebSocket server, binary frame, giới hạn kích thước, idle timeout, backpressure; mỗi kết nối một Session | A3 | SV | 6 | Chưa triển khai theo WBS |
| [ ] | D2 | R1 | P0 | Codec Message và cipher XOR (cờ bật/tắt) | Lớp Message tương thích DataInput/Output (big-endian, UTF 2 byte); cipher đọc/ghi hai con trỏ; xử lý gói -128 | B3 | SV | 3 | Chưa triển khai theo WBS |
| [ ] | D3 | R1 | P0 | Dispatcher và registry handler | Annotation @Handler(cmd) + dispatcher; handler chạy trong luồng của map/session để tránh race | B14,D1 | SV | 4 | Chưa triển khai theo WBS |
| [ ] | D4 | R1 | P0 | Auth: đăng ký, đăng nhập | Băm Argon2id, chuẩn hóa username, giới hạn thử sai theo IP+tài khoản, thông điệp lỗi gốc | D3,D6 | SV | 5 | Chưa triển khai theo WBS |
| [ ] | D5 | R1 | P0 | Phiên và token | Token phiên ngẫu nhiên lưu hash, đá phiên trùng, tự đăng nhập lại ngắn hạn, hết hạn | D4 | SV | 3 | Chưa triển khai theo WBS |
| [ ] | D6 | R1 | P0 | DAO, Flyway migration, HikariCP | JDBC thuần có lớp Repository mỏng; migration có version; connection pool; mọi ghi quan trọng trong transaction | A3 | SV | 5 | Chưa triển khai theo WBS |
| [ ] | D7 | R1 | P0 | Nhân vật: tạo, chọn, xóa, 5 hệ, ngoại hình | Validate tên, chọn hệ vũ khí và part khởi đầu, giới hạn nhân vật/tài khoản, xóa mềm | D4,C11 | SV | 5 | Chưa triển khai theo WBS |
| [ ] | D8 | R1 | P0 | World, Map, Zone, AOI, tick loop | World giữ Map; mỗi Map một luồng tick 20/s; Zone/kênh; AOI lưới ô; hàng đợi lệnh theo map | D3 | SV | 10 | Chưa triển khai theo WBS |
| [ ] | D9 | R1 | P0 | Di chuyển và đồng bộ vị trí | Server kiểm tra tốc độ/va chạm theo tile, chống speed-hack, gửi delta cho AOI | D8,C6 | SV | 6 | Chưa triển khai theo WBS |
| [ ] | D10 | R2 | P1 | Lưu bền write-behind | Cờ dirty, lưu định kỳ và khi logout, hàng đợi ghi bất đồng bộ, cơ chế flush khi tắt máy | D6,D8 | SV | 4 | Chưa triển khai theo WBS |
| [ ] | D11 | R3 | P1 | Công cụ GM và CLI quản trị | Lệnh GM (cấp item/xu, dịch chuyển, ban, kick, thông báo) qua WS có quyền; CLI để reload dữ liệu | D4 | SV | 5 | Chưa triển khai theo WBS |
| [ ] | D12 | R1 | P1 | Log, metrics, tắt máy an toàn | Logback JSON, Micrometer + Prometheus, health endpoint, shutdown hook lưu hết người chơi | D1 | SV | 4 | Chưa triển khai theo WBS |
| [ ] | D13 | R1 | P0 | Cache dữ liệu tĩnh | Nạp bảng template vào bộ nhớ khi khởi động, truy cập O(1), không truy DB khi chơi | C14 | SV | 3 | Chưa triển khai theo WBS |
| [ ] | D14 | R2 | P1 | Rate limit và validate đầu vào | Token bucket theo session/cmd, kiểm tra độ dài, miền giá trị, trạng thái hợp lệ trước khi xử lý | D3 | SV | 3 | Chưa triển khai theo WBS |

### Nhóm E — Client core

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | E1 | R1 | P0 | Scaffold client và scale pixel-perfect | Vite + TS + Phaser 3, scene manager, canvas độ phân giải logic của jar, scale số nguyên, pixelated | A3 | CL | 4 | Một phần – Vite + Phaser đang chạy bằng JavaScript; WBS yêu cầu TypeScript và chuẩn hóa scene/scale |
| [ ] | E2 | R1 | P0 | Tầng mạng client | Message reader/writer bằng DataView; Cipher XOR; auto-reconnect; hàng đợi gửi; ping | B14 | CL | 5 | Chưa triển khai theo WBS |
| [ ] | E3 | R1 | P0 | Asset loader và atlas manager | Nạp manifest có hash, atlas, nạp lười theo map, bộ nhớ đệm | C9 | CL | 4 | Một phần – có manifest loader/resource viewer; atlas manager và lazy loading theo map chưa hoàn tất |
| [ ] | E4 | R1 | P0 | Render nhân vật ghép part | Container sprite theo layer (thân, chân, đầu, áo, mũ, vũ khí), animation theo trạng thái và hướng | C2,C3 | CL | 8 | Chưa triển khai theo WBS |
| [ ] | E5 | R1 | P0 | Tilemap, camera, va chạm | Dựng tilemap từ JSON, camera theo nhân vật, va chạm theo bảng .type | C6 | CL | 6 | Một phần – có camera, va chạm và bản đồ demo; chưa render tilemap/va chạm từ dữ liệu gốc |
| [ ] | E6 | R1 | P0 | Input: bàn phím, touch, soft-key | Ánh xạ phím J2ME (số, soft key) sang bàn phím, D-pad ảo cho mobile | E1 | CL | 5 | Một phần – đã có keyboard/touch controls; chưa port đầy đủ soft-key J2ME |
| [ ] | E7 | R1 | P0 | UI framework | Port Form/List/Dialog/Tab từ jar bằng bitmap font; focus/điều hướng bằng phím | E1,C7 | CL | 12 | Một phần – có UI web/panel; chưa port Form/List/Dialog/Tab và bitmap font như JAR |
| [ ] | E8 | R1 | P0 | Màn hình loading, chọn server, login, chọn/tạo nhân vật | Ghép UI + tầng mạng theo máy trạng thái B12 | E2,E7,B12 | CL | 8 | Một phần – có login/roster local; chưa có auth/network/server thực |
| [ ] | E9 | R2 | P1 | HUD | HP/MP/EXP, quick slot, minimap, khung chat | E7 | CL | 6 | Một phần – có HUD local; chưa đồng bộ từ server |
| [ ] | E10 | R2 | P1 | Hiệu ứng và particle | Bộ phát hiệu ứng theo bảng animation, ghim theo đối tượng, giới hạn số lượng | C4 | CL | 6 | Một phần – có feedback/combat visuals demo; chưa có skill effect catalog xác minh từ JAR |
| [ ] | E11 | R3 | P2 | Audio manager | Nhạc nền theo map, SFX, mute, mở khóa audio trên iOS | C8 | CL | 2 | Chưa triển khai theo WBS |
| [ ] | E12 | R1 | P0 | Port logic lõi các class màn hình chính (mj, xg, z, dh) | Đối chiếu và port logic game loop, quản lý đối tượng, vẽ, trạng thái; không port rác phụ thuộc J2ME | B2,E1 | CL | 10 | Một phần – có world runtime; chưa port logic các class lõi theo hành vi JAR |
| [ ] | E13 | R3 | P2 | Responsive, PWA, toàn màn hình | Layout theo tỉ lệ, cài như app, khóa xoay, tối ưu pin | E9 | CL | 3 | Chưa triển khai theo WBS |
| [ ] | E14 | R1 | P1 | Công cụ debug | Overlay log gói tin, inspector đối tượng, bật/tắt cipher | E2 | CL | 3 | Chưa triển khai theo WBS |

### Nhóm F — Gameplay 5 hệ và chiến đấu

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | F1 | R1 | P0 | Vào map và thấy người chơi khác (lát cắt đầu tiên) | Zone theo map, AOI broadcast vào/ra/di chuyển; client nội suy vị trí | D9,E5,E8 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | F2 | R2 | P1 | NPC và hội thoại | NPC nạp từ npc_template; menu/hội thoại theo cây dữ liệu do server điều khiển; client dựng form | F1,B8,E7 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | F3 | R2 | P0 | Quái: spawn, AI, respawn, rơi đồ | MobSpawner theo bảng; AI máy trạng thái idle/patrol/chase/attack/return tick 5Hz; drop table có trọng số | F1,C11 | ALL | 12 | Một phần – có quái demo, chase/attack/leash/respawn phía client; chưa phải mob engine server-authoritative |
| [ ] | F4 | R2 | P0 | Chiến đấu lõi (data-driven) | Pipeline: kiểm tra tầm/CD/MP -> tính sát thương theo GDD -> buff -> trừ HP -> broadcast; skill khai báo bằng dữ liệu (tầm, hình dạng, CD, MP, hệ số, hiệu ứng) | F3,B6,C10 | ALL | 14 | Chưa triển khai theo WBS |
| [ ] | F5 | R2 | P0 | Hệ 1: Kiếm (cận chiến đơn mục tiêu) | Bộ skill kiếm, combo ngắn, buff tốc độ; làm trọn trước để làm mẫu cho 4 hệ còn lại | F4,E10 | ALL | 6 | Chưa triển khai theo WBS |
| [ ] | F6 | R2 | P0 | Hệ 2: Đại đao (sát thương diện rộng, HP cao) | Skill hình quạt/tròn nhiều mục tiêu, giáp/giảm sát thương | F5 | ALL | 4 | Chưa triển khai theo WBS |
| [ ] | F7 | R2 | P0 | Hệ 3: Cung (tầm xa, đạn bay) | Projectile là thực thể có tick riêng, va chạm theo tile/mục tiêu, xóa khi hết tầm | F5 | ALL | 5 | Chưa triển khai theo WBS |
| [ ] | F8 | R2 | P0 | Hệ 4: Búa (choáng, diện rộng nền) | Skill choáng/đẩy lùi, trạng thái crowd-control có thời hạn | F5 | ALL | 4 | Chưa triển khai theo WBS |
| [ ] | F9 | R2 | P0 | Hệ 5: Pháp sư (phép, hồi máu, hỗ trợ) | Phép tầm xa, hồi máu/buff đồng đội, tiêu MP lớn, hồi MP | F5 | ALL | 5 | Chưa triển khai theo WBS |
| [ ] | F10 | R2 | P0 | Cấp độ, EXP, thuộc tính | Đường cong EXP từ GDD, điểm tiềm năng, chỉ số dẫn xuất tính ở server, gói stat cho client | F4,C10 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | F11 | R2 | P1 | Học kỹ năng | Cây kỹ năng theo hệ, điều kiện level/tiền, NPC dạy, reset | F10,F2 | ALL | 4 | Chưa triển khai theo WBS |
| [ ] | F12 | R2 | P0 | Túi đồ, trang bị, hiển thị trang bị | Slot cố định; item instance = template + extra JSON; mặc đồ đổi part hiển thị; mọi thay đổi trong DB transaction, khóa lạc quan theo version | F3,B7 | ALL | 14 | Một phần – inventory/equipment local hoạt động; chưa persistence/transaction server |
| [ ] | F13 | R2 | P1 | Kho đồ và khóa trang bị | Rương kho riêng, cờ khóa item, mã bảo vệ cấp 2 tùy chọn | F12 | ALL | 4 | Chưa triển khai theo WBS |
| [ ] | F14 | R2 | P1 | Hồi sinh | Hồi sinh tại làng/tại chỗ (tốn vật phẩm), hồi sinh người khác; phạt chết theo cấu hình | F4 | ALL | 3 | Chưa triển khai theo WBS |
| [ ] | F15 | R2 | P1 | Cửa hàng NPC, vàng và xu | shop_template; mua/bán giá từ bảng; ví gold/xu cập nhật trong transaction, log mọi giao dịch | F12,F2 | ALL | 8 | Một phần – shop demo local có mua số lượng; chưa server economy/transaction |
| [ ] | F16 | R2 | P1 | Nhiệm vụ: engine cơ bản | Quest = danh sách objective (giết/nhặt/nói chuyện/đến nơi) + phần thưởng; trạng thái JSON trong player_quest; bus sự kiện nội bộ | F3,F2,B8 | ALL | 10 | Chưa triển khai theo WBS |
| [ ] | F17 | R3 | P1 | Chuỗi nhiệm vụ và tự động làm nhiệm vụ | Tiền điều kiện nối chuỗi; chế độ tự động theo objective như jar (server điều hướng, client hiển thị) | F16,C12 | ALL | 6 | Chưa triển khai theo WBS |
| [ ] | F18 | R3 | P1 | Boss | Spawn theo lịch/khu riêng, bảng đóng góp sát thương, drop chia theo đóng góp, thông báo thế giới | F4,C5 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | F19 | R3 | P2 | Rồng và điều ước | Sự kiện triệu hồi theo dữ liệu dragonData, phần thưởng theo cấu hình | F18 | ALL | 6 | Chưa triển khai theo WBS |
| [ ] | F20 | R3 | P1 | Tàu, vé, dịch chuyển | Bảng tuyến, vé là item, trừ vé và chuyển map; dịch chuyển về làng | F12 | ALL | 5 | Chưa triển khai theo WBS |
| [ ] | F21 | R3 | P2 | Ngựa | Mount gắn vào nhân vật, tăng tốc, quy tắc mất ngựa khi rương đầy theo chuỗi gốc | F12,C12 | ALL | 6 | Chưa triển khai theo WBS |

### Nhóm G — Kinh tế, xã hội, nâng cao

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | G1 | R3 | P1 | Chat: thế giới, map, riêng, nhóm | Kênh theo loại, lọc từ cấm, giới hạn tần suất, mute; lưu lịch sử ngắn trong RAM | D14,E9,B9 | ALL | 6 | Chưa triển khai theo WBS |
| [ ] | G2 | R3 | P1 | Bạn bè | Gửi/nhận/từ chối kết bạn, danh sách online, nhắn riêng | G1 | ALL | 4 | Chưa triển khai theo WBS |
| [ ] | G3 | R3 | P1 | Nhóm (party) | Party tối đa theo cấu hình, chia EXP/loot, mời/đuổi/rời/giải tán, hiển thị vị trí đồng đội | G1,F10 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | G4 | R3 | P1 | Giao dịch 1-1 | Phiên giao dịch hai bước xác nhận, khóa hai phía, commit trong một DB transaction, log chống lừa | F12,G2 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | G5 | R4 | P2 | Bang hội: lõi | guild, guild_member, vai trò; tạo/mời/duyệt/đuổi/rời; chat bang; kho bang tùy chọn | G3,B9 | ALL | 12 | Chưa triển khai theo WBS |
| [ ] | G6 | R4 | P2 | Kỹ năng bang hội | Kỹ năng bang theo cấp bang, đóng góp để mở khóa, buff cho thành viên | G5,C13 | ALL | 5 | Chưa triển khai theo WBS |
| [ ] | G7 | R4 | P2 | Nhiệm vụ bang hội | Nhiệm vụ chung của bang, tiến độ chung, thưởng bang | G5,F16 | ALL | 6 | Chưa triển khai theo WBS |
| [ ] | G8 | R4 | P2 | Chợ và đấu giá | market_listing, đấu giá có thời hạn, phí/hoa hồng, ký quỹ vật phẩm, job kết thúc phiên, thông báo kết quả | F12,G4 | ALL | 12 | Chưa triển khai theo WBS |
| [ ] | G9 | R4 | P2 | Luyện đồ: nghiền bột, nguyên tố, luyện | recipe_template; tỉ lệ thành công RNG phía server có log seed; tiêu hao nguyên liệu trong transaction | F12,C13 | ALL | 14 | Chưa triển khai theo WBS |
| [ ] | G10 | R4 | P2 | Linh thú | pet entity theo chủ, trang bị riêng (giáp, nón), cho ăn, cấp độ, hiển thị part riêng, mang theo/thu hồi | F12,C13 | ALL | 14 | Chưa triển khai theo WBS |
| [ ] | G11 | R4 | P3 | Đấu trường | Hàng đợi ghép cặp, bản sao map riêng, điểm đấu trường, mùa và phần thưởng | F4,G3 | ALL | 12 | Chưa triển khai theo WBS |
| [ ] | G12 | R4 | P2 | Bảng xếp hạng | Top cao thủ, top đại gia, top bang tính định kỳ bằng job SQL, cache | G5 | ALL | 5 | Chưa triển khai theo WBS |
| [ ] | G13 | R4 | P3 | Trồng cây và thương nhân | Cây trồng theo thời gian thực lưu DB, thu hoạch; thương nhân bán/mua theo lịch | F12,C13 | ALL | 8 | Chưa triển khai theo WBS |
| [ ] | G14 | R4 | P3 | Bộ lập lịch sự kiện hệ thống | Cron cấu hình YAML cho sự kiện, boss thế giới, thông báo | F18 | SV | 5 | Chưa triển khai theo WBS |

### Nhóm H — QA, bảo mật, cân bằng

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | H1 | R1 | P0 | Unit và integration test server | Testcontainers MySQL, test handler bằng client giả, test công thức bằng property-based | D3 | QA | 10 | Chưa triển khai theo WBS |
| [ ] | H2 | R1 | P0 | Test giao thức hai chiều (replay) | Bộ gói mẫu từ jar gốc chạy qua cả Java và TS để phát hiện lệch | B15 | QA | 4 | Chưa triển khai theo WBS |
| [ ] | H3 | R2 | P1 | E2E client | Playwright điều khiển 2 trình duyệt: login, vào map, đánh, mua đồ | E8 | QA | 8 | Chưa triển khai theo WBS |
| [ ] | H4 | R3 | P1 | Bot tải | Bot WebSocket headless mô phỏng người chơi (đi, đánh, chat) | H1 | QA | 5 | Chưa triển khai theo WBS |
| [ ] | H5 | R3 | P0 | Bảo mật | WSS, rate limit, validate, chống nhân đồ (idempotency/transaction), review SQL injection, giới hạn gói, xem xét anti-cheat cơ bản | D14 | SV | 10 | Chưa triển khai theo WBS |
| [ ] | H6 | R5 | P0 | Load test 500-1000 CCU và tối ưu | Kịch bản bot, đo tick time/GC/DB, tối ưu AOI và ghi DB | H4 | QA | 6 | Chưa triển khai theo WBS |
| [ ] | H7 | R5 | P1 | Test trình duyệt và thiết bị | Ma trận Chrome, Safari iOS, Android; hiệu năng thiết bị yếu | E13 | QA | 4 | Chưa triển khai theo WBS |
| [ ] | H8 | R5 | P1 | Cân bằng 5 hệ | Mô phỏng DPS/sống sót, chỉnh hệ số trong dữ liệu, thử với người chơi thật | F9 | ALL | 10 | Chưa triển khai theo WBS |
| [ ] | H9 | R5 | P1 | Cân bằng kinh tế | Cân đối nguồn thu/chi vàng-xu, giá shop/chợ, tỉ lệ luyện đồ | G8,G9 | ALL | 6 | Chưa triển khai theo WBS |
| [ ] | H10 | R4 | P1 | Hồi quy theo đợt R2-R4 | Chạy lại toàn bộ E2E và kiểm thử tay trước mỗi bàn giao | H3 | QA | 12 | Chưa triển khai theo WBS |

### Nhóm I — Hạ tầng và vận hành

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | I1 | R1 | P0 | Môi trường dev bằng Docker Compose | Compose: MySQL, server, client dev; script seed | A3 | OPS | 3 | Chưa triển khai theo WBS |
| [ ] | I2 | R1 | P0 | CI/CD | Build, test, đóng gói image, deploy staging tự động | A3 | OPS | 4 | Chưa triển khai theo WBS |
| [ ] | I3 | R1 | P0 | VPS, Caddy reverse proxy WSS, TLS tự động | Caddy terminate TLS, proxy WebSocket tới server; tường lửa tối thiểu | I1 | OPS | 3 | Chưa triển khai theo WBS |
| [ ] | I4 | R3 | P1 | Backup và phục hồi MySQL | mysqldump định kỳ + binlog, đẩy ra kho ngoài, diễn tập khôi phục | I3 | OPS | 3 | Chưa triển khai theo WBS |
| [ ] | I5 | R3 | P1 | Giám sát và cảnh báo | Prometheus + Grafana, cảnh báo CCU/lỗi/độ trễ tick | D12 | OPS | 4 | Chưa triển khai theo WBS |
| [ ] | I6 | R5 | P1 | Trang landing và quản lý tài khoản | Trang tĩnh, đăng ký, đổi mật khẩu, hướng dẫn | I3 | CL | 5 | Chưa triển khai theo WBS |
| [ ] | I7 | R4 | P2 | Web admin tối giản | Xem người chơi, cấp xu/item, ban, xem audit_log; thay cho nạp xu thật | D11 | SV | 8 | Chưa triển khai theo WBS |
| [ ] | I8 | R5 | P0 | Closed beta | Mời nhóm nhỏ, thu phản hồi, hotfix theo tuần | H6 | ALL | 10 | Chưa triển khai theo WBS |
| [ ] | I9 | R5 | P1 | Runbook và tài liệu vận hành | Quy trình deploy, rollback, backup, sự cố | I5 | OPS | 3 | Chưa triển khai theo WBS |

## 4. Độ phủ tính năng

| Mã | Tính năng | Bằng chứng ghi trong WBS | Đợt | Task | Đánh giá nguồn |
|---|---|---|---|---|---|
| F01 | Tài khoản, đăng nhập, danh sách server | dang nhap, uk (server list) | R1 | B3, B4, B12, B16, D1, D4, D5, E2, E8, I6 | Đã xác minh được luồng màn hình/chuỗi khởi tạo ở mức client |
| F02 | Tạo/chọn nhân vật, 5 hệ vũ khí | Chọn nhân vật:, wpsplash/* 5 nhóm | R1 | B4, C2, C3, C11, D7, E4, E8 | Đã xác minh được luồng màn hình/chuỗi khởi tạo ở mức client |
| F03 | Bản đồ, di chuyển, nhiều người chơi | hf (npc.sh/tile), t.png, .type | R1 | B5, C6, D8, D9, E5, F1 | Có dấu vết tài nguyên/UI; dữ liệu map/công thức/server cần xác minh riêng |
| F04 | NPC và hội thoại | npc.sh, nhiều chuỗi hội thoại | R2 | B8, C5, F2 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F05 | Quái, AI, rơi đồ | boss/*, drop, nhặt xu | R2 | C5, C11, F3 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F06 | Chiến đấu và kỹ năng (5 hệ) | Kỹ năng, sword skill/*, eff.sh | R2 | B6, B13, C3, C4, C10, E10, F4, F5, F6, F7, F8, F9, H8 | Có dấu vết tài nguyên/UI; dữ liệu map/công thức/server cần xác minh riêng |
| F07 | Cấp độ, EXP, thuộc tính | Bạn vừa lên cấp | R2 | C10, F10 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F08 | Học kỹ năng | Học kỹ năng, Kỹ năng bang hội | R2 | F11 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F09 | Túi đồ, kho, trang bị, khóa trang bị | Kho đồ, Khóa trang bị | R2 | B7, F12, F13 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F10 | Cửa hàng NPC, vàng/xu | Mua bán, Đã bán thành công | R2 | B7, F15 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F11 | Nhiệm vụ (chuỗi, tự động làm nhiệm vụ) | tự động làm nhiệm vụ | R2-R3 | B8, C12, F16, F17 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F12 | Boss và rồng | boss/0-6, rong/dragonData | R3 | C5, C12, F18, F19 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F13 | Hồi sinh | đã được hồi sinh | R2 | F14 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F14 | Tàu, vé, dịch chuyển | Lên tàu, Bạn phải có vé | R3 | B10, C12, F20 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F15 | Ngựa (cưỡi) | Xuống ngựa | R3 | B10, C12, F21 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F16 | Chat: thế giới, map, riêng, bang | Kênh thế giới, Chat toàn bang | R3 | B9, G1 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F17 | Bạn bè | muốn kết bạn với bạn | R3 | B9, G2 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F18 | Nhóm (party) | mời bạn tham gia nhóm | R3 | B9, G3 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F19 | Giao dịch 1-1 | đề nghị giao dịch với bạn | R3 | B7, G4 | Có dấu vết trong JAR; cần xác minh luồng xử lý/payload |
| F20 | Bang hội (mời, kỹ năng, nhiệm vụ, chat bang) | Mời vào bang hội, Kỹ năng bang hội, Nhiệm vụ Bang hội | R4 | B9, C13, G5, G6, G7 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F21 | Chợ/đấu giá | Bán đấu giá | R4 | B10, G8, C13 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F22 | Luyện đồ, nghiền bột, nguyên tố | Nghiền bột, Ngươi muốn luyện đồ? | R4 | G9, B10, C13 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F23 | Linh thú (giáp, nón, trang bị thú) | Giáp linh thú, Nón linh thú | R4 | G10, B10, C13 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F24 | Đấu trường | Đấu trường, Điểm đấu trường | R4 | G11, B10, C13 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F25 | Bảng xếp hạng (cao thủ, đại gia, bang) | Top cao thủ, Top đại gia, Top bang hội | R4 | G12, B10, C13 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F26 | Trồng cây và thương nhân | Trồng cây, Nhật thương nhân | R4 | B10, C13, G13 | Chủ yếu dựa trên chuỗi UI/tên tính năng; cần truy handler và payload |
| F27 | Nạp xu qua SMS/thanh toán | Nạp xu, sms:// | Thay bằng web admin cấp xu (I7); thanh toán thật ngoài phạm vi |  | Ngoài phạm vi theo quyết định WBS |

## 5. Đánh giá độ phù hợp với JAR và tài nguyên hiện có

### 5.1. Phần phù hợp, có cơ sở

- **Client 2D bằng Phaser/Vite:** phù hợp với game J2ME 2D, sprite/tilemap và input đa thiết bị. Repo hiện đã dùng Phaser 3 + Vite; WBS yêu cầu TypeScript là một bước chuẩn hóa thêm, không phải điều kiện bắt buộc để render.
- **Tài nguyên đóng gói:** đã xác minh trong JAR có các pack `.sh`, `.wp`, `.wps`; script hiện có giải mã được các pack này. Thống kê đã ghi nhận: 18 packed files, 198 resource entries, trong đó 161 PNG. Đây là cơ sở tốt cho pipeline asset.
- **5 nhóm nghề:** các pack `wpsplash` cho `kiem`, `daidao`, `cung`, `bua`, `phapsu` đã xác minh là nhóm ảnh giới thiệu môn phái. Chúng hỗ trợ màn hình chọn nghề/preview, nhưng chưa đủ chứng minh có sprite chiến đấu ghép part và animation đầy đủ.
- **UI/login/character flow:** JAR có màn hình chọn server, login, chọn/tạo nhân vật; WBS đã đưa các luồng này vào R1 đúng thứ tự.
- **Mạng:** JAR dùng socket TCP và framing nhị phân; giữ cấu trúc packet/codec/XOR là hướng hợp lý để tái hiện tương thích.

### 5.2. Các giả định cần sửa hoặc gắn nhãn chưa xác minh

| Hạng mục WBS | Đánh giá | Điều chỉnh đề xuất |
|---|---|---|
| C1: giải mã `.sh`, `.wp`, `.wps`, `qs`, `boss`, `dragonData`, `nation` | Chỉ ba họ pack `.sh/.wp/.wps` đã được xác minh đầy đủ trong pipeline hiện tại. Các loại còn lại chưa có bằng chứng giải mã tương đương. | Chia C1 thành C1a (3 định dạng đã xác minh) và C1b (từng định dạng chưa xác minh); không ghi “8 loại” là đã biết. |
| C2: body/leg/head/coat/hat và atlas ghép part | Có thể là hướng đúng nhưng chưa có bằng chứng đã lập được bảng part, offset, frame và hướng từ JAR. | Trước khi estimate conversion, làm inventory resource + truy hàm loader/draw; nghiệm thu một nhân vật hoàn chỉnh ở đủ hướng/trạng thái. |
| C3: `wpsplash/*` thành vũ khí + hiệu ứng chém/animation | `wpsplash` hiện xác minh là ảnh preview 5 nghề; không được mặc định là bộ vũ khí chiến đấu. | Tách preview nghề (đã có) khỏi weapon sprite, attack animation và slash VFX (cần tìm nguồn riêng). |
| C4: `eff.sh`, `sword skill/*`, `skillpublic.sh` | `eff.sh` và `skillpublic.sh` có trong pack; đường dẫn `sword skill/*` và mapping từng effect chưa chứng minh đủ. | Thêm bước lập catalog effect ID → resource → frame/timing → điểm neo; đánh dấu unknown thay vì đoán. |
| C5: NPC/mob/boss/rồng | `npc.sh` đã xác minh; các nhóm boss/rồng có dấu vết trong mô tả archive nhưng cần truy chính xác tên/loader/metadata. | Chốt danh mục file và mapping spawn/animation trước khi cam kết đủ boss/rồng. |
| C6: `t.png` 16×3712, `.type`, map JSON | `.type` có dấu vết trong tài nguyên, nhưng cần xác minh schema, tile index, map data và collision semantics. | Tách tileset, tile metadata, map layout, collision; kiểm thử render map gốc thay vì chỉ tạo JSON. |
| B1/B2: 782 class, call graph, đặt tên >90% class lớn | JAR có 782 class; nhưng 90% class “lớn” là mục tiêu tham vọng và cần định nghĩa thế nào là class lớn/được hiểu. | Ưu tiên class theo luồng startup, network, render, input, resource loader; theo dõi coverage theo luồng chứ không theo tỷ lệ tên class. |
| B4–B11: protocol toàn bộ lệnh | Có nhiều lệnh và helper dispatch; tuyến tính hóa payload có nguy cơ sai khi có nhánh/vòng lặp. Sheet S2C ghi rõ nhiều command mới ở mức nháp. | Mỗi command cần bytecode path, read/write order, điều kiện nhánh, test vector và packet capture/replay; chưa được dùng nháp làm schema production. |
| B15: JAR chạy với server mock qua WS↔TCP | JAR dùng `socket://` TCP; browser dùng WebSocket. Không thể để JAR kết nối trực tiếp WebSocket. | Thiết kế rõ TCP compatibility endpoint cho JAR và WebSocket endpoint cho web client; cùng codec/domain protocol, hoặc bridge TCP↔WS có framing chính xác. |
| D8: tick map 20/s; F3 AI 5Hz | Đây là thông số thiết kế mới, không phải thông số đã xác minh từ JAR. | Đặt là giả định ban đầu; benchmark và so sánh hành vi rồi chốt. Tách tick simulation, AI cadence và broadcast cadence. |
| C10: công thức damage/EXP/drop | Client có thể bộc lộ animation, UI và một phần prediction; công thức authoritative có thể nằm ở server gốc, không có trong JAR. | Phân loại từng công thức: trích được từ client / suy ra qua thử nghiệm / thiết kế mới. Không tuyên bố “đúng game gốc” nếu chưa có oracle. |
| Q10: logic resolution mặc định 240×320 | WBS tự ghi “đọc ở E1”; hiện chưa có xác minh con số này. | Đọc kích thước Canvas thực từ bytecode/thiết bị emulator trước khi chốt; hỗ trợ scale theo aspect ratio gốc. |
| Q5: giữ nguyên packet và XOR qua WSS | Hợp lý cho client web, nhưng JAR cũ là TCP socket; WebSocket thêm handshake/frame/TLS ngoài packet game. | Đặc tả rõ transport adapter; không trộn WebSocket frame với packet game frame. Xác nhận XOR direction/key/state bằng test vector. |
| C14: YAML loader + Flyway | Kỹ thuật hợp lý, nhưng migration tool và seed strategy là quyết định kiến trúc, chưa được kiểm chứng với data thật. | Tách schema migration khỏi static content loader; content loader idempotent/checksum, migration không dùng để nạp toàn bộ game content. |
| 500–1000 CCU trên VPS 4GB | Mục tiêu chưa có benchmark hoặc profile tải. | Chỉ là target kiểm thử; xác định concurrency, map density, packet rate, DB write rate và p95 latency trước khi sizing VPS. |

### 5.3. Mức phù hợp tổng thể

- **Kiến trúc client Phaser/Vite:** phù hợp cao.
- **Asset pipeline:** phù hợp cao cho các pack đã xác minh; trung bình/thấp cho part/animation/map cho tới khi có mapping nguồn.
- **Reverse engineering protocol:** cần thiết và đúng trọng tâm; effort hiện có rủi ro thiếu do 88 lệnh/helper và payload phân nhánh.
- **Backend Java/Netty/MySQL:** lựa chọn hợp lý cho server authoritative, nhưng đây là thiết kế mới; không thể suy ra backend gốc từ JAR client. Chỉ chốt module/DB schema sau khi protocol và gameplay contracts đủ rõ.
- **Phạm vi 26/27 tính năng:** có thể dùng làm mục tiêu sản phẩm, không được diễn giải thành “tái hiện 80% độ sâu”. Danh sách tính năng dựa nhiều vào chuỗi UI, chưa chứng minh mọi tính năng có thể khôi phục đầy đủ.

## 6. Những điều chỉnh WBS nên làm trước khi bước vào BE

1. **Chốt evidence ledger:** mỗi feature/asset/packet có trạng thái `VERIFIED`, `PARTIAL`, `INFERRED`, `UNKNOWN`, kèm class/resource/offset và commit.
2. **Hoàn thành vertical slice client thật:** startup → server list → login mock → roster → map render từ asset gốc → di chuyển/va chạm; tránh mở rộng thêm panel demo.
3. **Hoàn thành protocol minimum cho R1:** handshake, auth, character, map enter, entity spawn/remove/move, disconnect/reconnect; có packet fixtures hai chiều.
4. **Làm rõ dual transport:** browser WSS và JAR TCP; một protocol domain nhưng hai transport adapter. R1 nghiệm thu JAR qua TCP endpoint và web client qua WSS.
5. **Chia lại resource conversion:** preview nghề, character parts, weapon, NPC/mob, effect, tile/map, font là các pipeline riêng; không gom thành “convert asset” chung.
6. **Đánh dấu công thức server là thiết kế mới nếu không có bằng chứng:** tạo bảng rule có nguồn và confidence, sau đó mới implement combat.
7. **Đưa test/QA vào từ đầu:** Vitest/Playwright là công cụ đề xuất; hiện trạng repo chưa được xem là đã có CI/E2E đạt chuẩn WBS.

## 7. Các rủi ro / quyết định cần theo dõi

- **Số lệnh và độ phức tạp payload vượt dự kiến (B4-B11)** (mức Cao): Làm R1 trước để đo tốc độ thật, chỉnh WBS sau; 88 lệnh đẩy việc đọc sang hàm phụ nên cần lần theo
- **Định dạng tài nguyên riêng bị mã hóa (C1)** (mức Trung bình): Đọc code parse trong client, script lặp lại được
- **Không có công thức server, phải tự thiết kế và cân bằng** (mức Cao): GDD sớm (C10), dữ liệu cấu hình được, cân bằng ở H8/H9
- **Bản quyền: jar là sản phẩm thương mại của TeaM** (mức Cao): Dùng nội bộ để học/nghiên cứu; thay art/tên/nội dung (C15) trước khi công khai hoặc thu tiền
- **Độ phủ 80% chỉ tính theo số tính năng, độ sâu có thể lớn hơn dự kiến** (mức Cao): Ước lượng lại sau B4-B10; P2/P3 là vùng co giãn
- **Hiệu năng web (nhiều sprite, mobile yếu)** (mức Trung bình): Atlas, culling, tách tick khỏi render
- **Gian lận (speed, bot, nhân đồ)** (mức Trung bình): Server authoritative, transaction DB, audit_log, H5
- **Kinh tế lạm phát khi không có nạp xu** (mức Trung bình): H9, web admin I7, theo dõi log giao dịch
- **Lịch trễ do phụ thuộc chuỗi RE -> client/server** (mức Cao): Làm RE đi trước 1 đợt, chia lát cắt dọc, bàn giao từng đợt

### Quyết định kiến trúc trong Excel — cần xác nhận lại khi vào BE

- **Q1 – Đủ 5 hệ dùng chung một khung chiến đấu theo dữ liệu:** Mỗi hệ khác nhau ở dữ liệu skill, hiệu ứng, hệ số; không code riêng
- **Q2 – Làm trọn hệ kiếm trước làm mẫu, rồi 4 hệ còn lại:** F5 làm mẫu, F6-F9 nhân bằng dữ liệu
- **Q3 – Client: Phaser 3 + TypeScript + Vite:** 
- **Q4 – Server: Java 21 + Netty + Maven; MySQL 8, HikariCP, JDBC thuần, Flyway:** Không dùng ORM
- **Q5 – Giữ khung gói gốc và XOR (cờ bật/tắt), chạy trong WSS qua Caddy:** Không thiết kế lại giao thức
- **Q6 – Dữ liệu tĩnh tự soạn YAML/JSON, nạp vào MySQL khi khởi động:** Chia 3 bộ theo đợt: C11, C12, C13
- **Q7 – Phạm vi: ≥80% tính năng (26/27), chỉ bỏ nạp xu/SMS:** Thay bằng web admin cấp xu (I7)
- **Q8 – Bàn giao theo 5 đợt R1-R5, ưu tiên P0-P3 trong từng đợt:** Mỗi đợt chạy được và nghiệm thu độc lập
- **Q9 – Một máy chủ game, một VPS 4 GB lúc đầu:** 
- **Q10 – Độ phân giải logic theo canvas thật của jar (đọc ở E1):** Mặc định 240x320, scale số nguyên

## 8. Nhật ký tiến độ

| Ngày | Task / nhóm | Thay đổi | Bằng chứng / commit | Người cập nhật |
|---|---|---|---|---|
| 2026-11-10 | Baseline | Chuyển WBS Excel thành checklist Markdown; đánh giá nguồn và các giả định | KPAH_Web_WBS_v2.xlsx | ChatGPT |

## 9. Nguồn và giới hạn đánh giá

- WBS nguồn: `KPAH_Web_WBS_v2.xlsx`, 9 sheet.
- Đối chiếu tài nguyên dựa trên những gì đã xác minh từ JAR và pipeline hiện có trong repo: 782 class; 18 packed files; 198 resource entries; 161 PNG; các pack `.sh/.wp/.wps`.
- Đánh giá này không khẳng định đã decompile/hiểu toàn bộ 782 class hoặc đã giải mã mọi định dạng được liệt kê trong WBS.
- Chưa có backend thực tế để xác nhận schema DB, protocol server hoàn chỉnh, công thức authoritative, CCU hoặc tiêu chí performance.


---

## 10. Đợt bàn giao (sheet `Đợt bàn giao`)

| Đợt | Tên | Nội dung bàn giao / tiêu chí nghiệm thu | md | Số task | P0 | P1 | P2 | P3 |
|---|---|---|---:|---:|---:|---:|---:|---:|
| R1 | Lát cắt dọc chạy được | 2 trình duyệt đăng nhập, tạo nhân vật đủ 5 hệ (hiển thị đúng), vào map, thấy nhau di chuyển; server lưu vị trí; JAR gốc kết nối được server mock | 291 | 50 | 284 | 7 | 0 | 0 |
| R2 | Vòng lặp chơi cốt lõi | Đánh quái bằng cả 5 hệ, EXP/level, nhặt đồ, mặc trang bị, mua bán NPC, kho, hồi sinh, nhiệm vụ cơ bản | 167 | 27 | 81 | 86 | 0 | 0 |
| R3 | Nội dung và xã hội cơ bản | Chuỗi nhiệm vụ, boss, rồng, tàu, ngựa, chat, bạn bè, nhóm, giao dịch 1-1, âm thanh, PWA, bảo mật cơ bản, bot tải | 108 | 19 | 10 | 78 | 20 | 0 |
| R4 | Kinh tế và hệ thống nâng cao | Bang hội (kỹ năng, nhiệm vụ), chợ/đấu giá, luyện đồ, linh thú, đấu trường, bảng xếp hạng, trồng cây, sự kiện, web admin | 127 | 14 | 0 | 12 | 90 | 25 |
| R5 | Hoàn thiện và beta | Cân bằng 5 hệ và kinh tế, load test, test thiết bị, closed beta, runbook | 44 | 8 | 16 | 28 | 0 | 0 |

Ghi chú: WBS yêu cầu mỗi đợt có bản chạy được; P0/P1 của đợt phải hoàn tất trước nghiệm thu, P2/P3 có thể lùi nếu trễ. R1 đang gánh 291/737 ngày công (~39,5%), nên cần xem lại tiêu chí R1 để tránh biến lát cắt đầu tiên thành một mini-project quá lớn.

## 11. Tổng hợp theo ưu tiên (sheet `Tổng hợp`)

| Ưu tiên | Ý nghĩa | Số task | Ngày công | Tỷ trọng ngày công |
|---|---|---:|---:|---:|
| P0 | Đường găng, bắt buộc để chạy | 62 | 391 | 53.1% |
| P1 | Lõi gameplay | 37 | 211 | 28.6% |
| P2 | Mở rộng | 15 | 110 | 14.9% |
| P3 | Trau chuốt, làm sau cùng | 4 | 25 | 3.4% |

Các giả định trong workbook: dự phòng 15%; 5 người làm song song; 5 ngày làm việc/tuần; ước lượng ±30% cho đến khi hoàn thành B4–B11; chưa gồm C15 (art thay thế 40–80 ngày công). Lịch 34 tuần là phép chia lý thuyết, chưa tính độ trễ do phụ thuộc, onboarding, review và tích hợp.

## 12. Stack & BE (sheet `Stack & BE`)

| Tầng | Công nghệ | Lý do / ghi chú |
|---|---|---|
| Client | TypeScript 5, Vite, Phaser 3, Vitest, Playwright, vite-plugin-pwa | 2D sprite/tilemap, build nhanh, test E2E |
| Transport | WebSocket binary (wss), khung gói gốc, XOR có cờ | Port logic mạng gần như nguyên bản; TLS do Caddy |
| Server | Java 21, Netty 4.1, Maven đa module | Nhiều kết nối nhỏ, tick đều, virtual threads cho I/O DB |
| Dữ liệu | MySQL 8, HikariCP, JDBC thuần, Flyway | Không dùng ORM cho game realtime |
| Cache/state | State runtime trong RAM; Caffeine cho bảng tĩnh | Chỉ ghi DB theo chu kỳ và khi logout |
| Dữ liệu tĩnh | YAML/JSON + JSON Schema, nạp vào MySQL khi khởi động | Thêm skill/item/mob bằng dữ liệu, không sửa code |
| Bảo mật | Argon2id, token phiên, rate limit, validate, audit_log | Server authoritative |
| Quan sát | Logback JSON, Micrometer, Prometheus, Grafana | CCU, tick time, lỗi |
| Hạ tầng | Docker Compose, Caddy 2, GitHub Actions, VPS 4GB | Một lệnh dựng môi trường |
| Công cụ RE | Python 3, Pillow, rectpack, Jinja2, Vineflower/CFR, J2ME Loader | Bộ đọc bytecode đã có trong tools/ |

### Module server dự kiến

| Module | Trách nhiệm | Bảng DB chính | Task |
|---|---|---|---|
| net | WebSocket, Session, codec, cipher, rate limit | - | D1,D2,D14 |
| auth | Đăng ký/đăng nhập, phiên, token | account, session_token | D4,D5 |
| character | Tạo/chọn/xóa nhân vật, 5 hệ, ngoại hình | player, player_skill | D7,F10,F11 |
| world | Map, Zone, AOI, tick, di chuyển | map_template | D8,D9 |
| mob/npc/boss | Spawn, AI, drop, hội thoại, boss | mob_template, npc_template, boss_template | F2,F3,F18 |
| combat | Skill, sát thương, buff, 5 hệ | skill_template | F4-F9 |
| item | Túi đồ, trang bị, kho, shop, giao dịch | item_template, player_item, player_storage, shop_template, trade_log | F12,F13,F15,G4 |
| quest | Engine nhiệm vụ, chuỗi, nhiệm vụ bang | quest_template, player_quest | F16,F17,G7 |
| social | Chat, bạn bè, nhóm | friend | G1,G2,G3 |
| guild | Bang hội, kỹ năng bang, kho bang | guild, guild_member, guild_skill | G5,G6 |
| economy | Chợ/đấu giá, luyện đồ, thương nhân | market_listing, recipe_template | G8,G9,G13 |
| pet/mount | Linh thú, ngựa | pet, mount | G10,F21 |
| arena/rank | Đấu trường, bảng xếp hạng | arena_season, ranking_cache | G11,G12 |
| persist | Ghi DB write-behind, flush | - | D10 |
| admin | GM, audit_log, web admin | audit_log | D11,I7 |

### Nhận xét về stack

- Stack Java 21 + Netty + MySQL là phương án hợp lý cho server authoritative và realtime; tuy nhiên đây là kiến trúc mới đề xuất, chưa phải kiến trúc được chứng minh từ JAR.
- Client hiện tại là JavaScript ES Modules + Vite + Phaser; đổi sang TypeScript có lợi cho protocol/schema nhưng cần tính effort chuyển đổi, không nên coi là đã hoàn tất.
- Browser client cần WSS; JAR gốc dùng TCP socket. Phải có hai adapter hoặc bridge được kiểm thử, không thể coi hai transport là tương đương.
- Dùng Flyway là lựa chọn của WBS; nên tách migration schema DB khỏi loader YAML/JSON cho static game data.

## 13. Lệnh S2C (nháp) — sheet `Lệnh S2C (nháp)`

> Giữ nguyên trạng thái nháp của workbook. Các dòng có payload đọc tuyến tính hoặc helper call không đồng nghĩa đã xác minh protocol; command có vòng lặp/rẽ nhánh cần lần theo bytecode và test vector trước khi dùng.

| cmd | hex | bytecode len | payload reads (nháp) | fields | strings gợi ý | helper calls | trạng thái |
|---:|---|---:|---|---:|---|---|---|
| -76 | 0xB4 | 8 |  | 0 |  | mj.q | rỗng/không đọc payload |
| -75 | 0xB5 | 8 |  | 0 |  | mj.r | rỗng/không đọc payload |
| -74 | 0xB6 | 8 |  | 0 |  | mj.C | rỗng/không đọc payload |
| -73 | 0xB7 | 9 |  | 0 |  | mj.A | rỗng/không đọc payload |
| -72 | 0xB8 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -71 | 0xB9 | 8 |  | 0 |  | mj.B | rỗng/không đọc payload |
| -70 | 0xBA | 8 |  | 0 |  | mj.v | rỗng/không đọc payload |
| -69 | 0xBB | 8 |  | 0 |  | mj.w | rỗng/không đọc payload |
| -68 | 0xBC | 8 |  | 0 |  | mj.x | rỗng/không đọc payload |
| -67 | 0xBD | 9 |  | 0 |  | mj.u | rỗng/không đọc payload |
| -66 | 0xBE | 9 |  | 0 |  | mj.t | rỗng/không đọc payload |
| -65 | 0xBF | 42 | short short byte | 3 |  | acu.b mj.b | ứng viên đơn giản |
| -64 | 0xC0 | 8 |  | 0 |  | mj.s | rỗng/không đọc payload |
| -63 | 0xC1 | 14 |  | 0 |  | sc.a sc.b | rỗng/không đọc payload |
| -62 | 0xC2 | 135 | byte byte UTF byte UTF | 5 | 'Bạn đã hết lượt chơi' | so.a acu.b so.b km.a so.f | ứng viên đơn giản |
| -61 | 0xC3 | 83 | byte byte byte short byte byte | 6 |  | acu.b mj.a | ứng viên đơn giản |
| -60 | 0xC4 | 15 | UTF | 1 |  | acu.b mj.a | ứng viên đơn giản |
| -59 | 0xC5 | 228 | byte byte byte UTF byte int byte byte bool byte byte | 11 |  | acu.b ka.a mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -58 | 0xC6 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -57 | 0xC7 | 798 | byte bool short byte byte short bytes[] byte byte byte byte byte byte byte byte byte byte byte byte byte byte byte byte byte byte | 25 |  | acu.b mj.b jy.m ku.b | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -56 | 0xC8 | 217 | byte short byte UTF byte byte short byte UTF byte | 10 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -55 | 0xC9 | 8 |  | 0 |  | mj.o | rỗng/không đọc payload |
| -54 | 0xCA |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -53 | 0xCB | 25 | UTF | 1 |  | acu.b mj.a | ứng viên đơn giản |
| -52 | 0xCC | 145 | UTF short byte UTF short byte byte byte | 8 |  | acu.b mj.a | ứng viên đơn giản |
| -51 | 0xCD | 66 | short bytes[] | 2 |  | acu.b | ứng viên đơn giản |
| -50 | 0xCE | 70 | UTF short short short short short short byte byte | 9 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -49 | 0xCF | 304 | byte byte byte byte short byte short byte short short short short short | 13 |  | acu.b av.a jy.a jy.i mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -48 | 0xD0 | 131 | byte short bytes[] byte byte byte | 6 |  | acu.b ku.h hi.a mj.a | ứng viên đơn giản |
| -47 | 0xD1 | 62 | short bool short bytes[] | 4 |  | acu.b cg.a | ứng viên đơn giản |
| -46 | 0xD2 | 82 | byte UTF byte byte byte bytes[] | 6 |  | acu.b ha.a ha.b | ứng viên đơn giản |
| -45 | 0xD3 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -44 | 0xD4 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -43 | 0xD5 | 238 | byte int bytes[] byte byte byte byte byte byte byte | 10 |  | acu.b ao.a mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -42 | 0xD6 | 88 | short byte byte | 3 |  | acu.b mj.a | ứng viên đơn giản |
| -41 | 0xD7 | 40 | short byte short | 3 |  | acu.b mj.a | ứng viên đơn giản |
| -40 | 0xD8 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -39 | 0xD9 | 37 | byte short int | 3 |  | acu.b mj.a | ứng viên đơn giản |
| -38 | 0xDA | 210 | bool byte short short UTF UTF | 6 |  | acu.b mj.b | ứng viên đơn giản |
| -37 | 0xDB | 408 | byte UTF byte byte short short byte short short byte UTF UTF UTF UTF | 14 | '`' \| '\nHoàn thành: ' \| '/' \| 'Con' | acu.b wz.a xg.a mj.e wz.b | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -36 | 0xDC | 41 | byte short UTF | 3 |  | acu.b mj.m mj.d | ứng viên đơn giản |
| -35 | 0xDD | 15 | UTF | 1 |  | acu.b mj.d | ứng viên đơn giản |
| -34 | 0xDE | 31 | short byte | 2 |  | acu.b mj.c | ứng viên đơn giản |
| -33 | 0xDF | 120 | byte byte short | 3 |  | acu.b | ứng viên đơn giản |
| -32 | 0xE0 | 60 | short byte UTF | 3 |  | acu.b km.a | ứng viên đơn giản |
| -31 | 0xE1 | 51 | short byte UTF byte | 4 |  | acu.b mj.a | ứng viên đơn giản |
| -30 | 0xE2 | 74 | short byte byte UTF | 4 |  | acu.b mj.a | ứng viên đơn giản |
| -29 | 0xE3 | 1 |  | 0 |  |  | rỗng/không đọc payload |
| -28 | 0xE4 | 33 | short bytes[] | 2 |  | acu.b mj.c | ứng viên đơn giản |
| -27 | 0xE5 | 280 | byte byte short byte short byte byte byte | 8 |  | acu.b ls.a ku.a xg.f xg.a | ứng viên đơn giản |
| -26 | 0xE6 | 14 | UTF | 1 |  | acu.b mj.f | ứng viên đơn giản |
| -25 | 0xE7 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -24 | 0xE8 | 40 | byte UTF | 2 |  | acu.b qu.a | ứng viên đơn giản |
| -23 | 0xE9 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -22 | 0xEA | 1136 | byte UTF byte byte byte byte short byte byte short byte short byte byte byte byte byte UTF byte byte byte short byte short byte UTF byte byte short short byte byte short short byte short byte byte byte byte byte UTF byte byte byte byte bytes[] | 47 | 'Chưa có thông tin linh thú' | acu.b ku.b jy.a km.h z.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -21 | 0xEB |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -20 | 0xEC | 45 | int | 1 | 'Bạn nhận được ' \| 'xu từ bang hội.' | acu.b km.a | ứng viên đơn giản |
| -19 | 0xED | 238 | byte UTF short short UTF UTF byte short long byte | 10 | 'TOP BANG HỘI' \| 'TOP CAO THỦ' \| 'TOP ĐẠI GIA' | acu.b ra.a mj.a ra.b km.g | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -18 | 0xEE | 20 | UTF | 1 | 'Bang hội' | sj.a acu.b | ứng viên đơn giản |
| -17 | 0xEF | 106 | short int UTF UTF | 4 | 'THÔNG BÁO' | acu.b ra.a ra.b km.g | ứng viên đơn giản |
| -16 | 0xF0 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -15 | 0xF1 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -14 | 0xF2 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -13 | 0xF3 | 16 |  | 0 | 'Bạn bị mời khỏi bang hội.' | km.a | rỗng/không đọc payload |
| -12 | 0xF4 | 182 | short UTF UTF byte short long long long UTF UTF bool byte UTF | 13 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -11 | 0xF5 | 155 | byte short UTF UTF bool short short | 7 |  | acu.b km.a tb.a tb.f mj.b | ứng viên đơn giản |
| -10 | 0xF6 | 51 | short UTF | 2 |  | acu.b tb.a tb.f km.a | ứng viên đơn giản |
| -9 | 0xF7 | 89 | short short UTF | 3 | '' | acu.b mj.a km.b | ứng viên đơn giản |
| -8 | 0xF8 | 278 | byte byte short bytes[] short bytes[] byte short bytes[] byte short bytes[] | 12 |  | acu.b mi.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| -7 | 0xF9 | 24 | UTF | 1 |  | acu.b mj.a | ứng viên đơn giản |
| -6 | 0xFA |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -5 | 0xFB | 77 | byte UTF UTF | 3 | ': ' | acu.b sj.a | ứng viên đơn giản |
| -4 | 0xFC |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -3 | 0xFD |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -2 | 0xFE |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| -1 | 0xFF |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 0 | 0x00 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 1 | 0x01 | 987 | byte short ubyte ubyte UTF UTF short bool byte byte byte UTF UTF int short ubyte ubyte byte byte byte byte byte byte byte byte byte UTF byte UTF byte byte int byte int byte byte UTF UTF byte short byte byte byte short bytes[] | 45 | 'numbersupport' \| 'tong so tile' | acu.b a.a xg.a hd.a mj.l | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 2 | 0x02 | 166 | UTF byte UTF short UTF UTF UTF | 7 | '2' \| '3' \| 'provider' \| 'agent' | acu.b a.a mj.a mj.b | ứng viên đơn giản |
| 3 | 0x03 | 1096 | short UTF int int int int byte byte int int int short short short byte byte short short short short short short short short int short byte byte short byte byte byte byte byte short byte bool bool byte byte byte short int short int UTF bool short byte short byte short short short short byte short byte UTF short byte short byte byte byte short byte | 67 | '' \| '@' | acu.b z.a mh.a kw.a mj.j | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 4 | 0x04 | 161 | byte ubyte short short short byte int byte byte bool | 10 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 5 | 0x05 | 878 | short UTF short short int int int int byte byte bytes[] short short byte short short byte byte byte byte byte byte short byte byte byte short bool bool byte byte bool short byte short byte short short short short byte short byte short byte short byte byte byte short byte | 51 |  | acu.b z.a mj.b z.L mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 6 | 0x06 | 102 | short short byte int int byte byte byte byte | 9 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 7 | 0x07 | 126 | short ubyte short short int byte byte int int | 9 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 8 | 0x08 | 31 | short | 1 |  | acu.b mj.d | ứng viên đơn giản |
| 9 | 0x09 | 102 | short short byte int int byte byte byte byte | 9 |  | acu.b mj.b | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 10 | 0x0A | 47 | short short int int | 4 |  | acu.b mj.a | ứng viên đơn giản |
| 11 | 0x0B | 7 |  | 0 |  | mj.k | rỗng/không đọc payload |
| 12 | 0x0C | 165 | short short short byte short UTF bool bytes[] | 8 |  | acu.b mj.a | ứng viên đơn giản |
| 13 | 0x0D | 714 | byte UTF int UTF byte byte byte byte short byte byte short byte short byte short byte byte byte int short byte byte short byte byte short byte byte | 29 |  | acu.b lj.a km.a ku.a tj.b | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 14 | 0x0E | 6 |  | 0 | 'Xin chọn tên nhân vật khác' | km.a | rỗng/không đọc payload |
| 15 | 0x0F | 1053 | byte short byte byte short short byte byte short short byte byte byte byte byte byte byte UTF ushort byte ubyte short byte short byte UTF byte byte byte short byte UTF int short byte byte short short byte byte short short byte byte byte byte byte byte byte UTF byte ubyte short byte bytes[] | 55 | '' | acu.b mj.a ku.b xg.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 16 | 0x10 | 862 | byte long ubyte ubyte int short byte short short byte byte short short byte byte byte byte byte byte byte byte byte UTF ushort byte ubyte short byte int byte short byte byte byte UTF UTF byte byte short byte byte UTF byte UTF int byte byte short int | 49 | 'LOI CHARINVENTORY ' | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 17 | 0x11 | 435 | short short byte int byte byte byte short short short short byte byte byte | 14 | '_' \| '_' \| '_' \| '_' | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 18 | 0x12 | 130 | short byte short short short byte byte short short | 9 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 19 | 0x13 | 52 | short short ubyte short | 4 |  | acu.b mj.a | ứng viên đơn giản |
| 20 | 0x14 | 29 | byte short | 2 |  | acu.b mj.a | ứng viên đơn giản |
| 21 | 0x15 | 164 | short short byte ushort byte ubyte short byte byte | 9 |  | acu.b mj.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 22 | 0x16 | 69 | short byte short int byte | 5 |  | acu.b mj.a | ứng viên đơn giản |
| 23 | 0x17 | 555 | byte byte byte byte short short byte byte byte short short byte byte short short byte byte byte byte | 19 |  | acu.b mj.a ka.a mj.b xg.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 24 | 0x18 | 4 |  | 0 |  | km.g | rỗng/không đọc payload |
| 25 | 0x19 | 833 | ubyte ubyte UTF byte byte byte short short byte short short UTF byte byte byte byte byte short short int byte byte short short short short byte int UTF UTF byte bool byte byte ubyte ubyte ubyte int UTF UTF byte byte bool short | 44 |  | acu.b | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 26 | 0x1A | 747 | ubyte short bytes[] ubyte short bytes[] ubyte short short bytes[] short short short bytes[] byte byte byte byte byte byte byte byte byte | 23 |  | acu.b ku.a e.a | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 27 | 0x1B | 29 | short UTF | 2 |  | acu.b mj.a | ứng viên đơn giản |
| 28 | 0x1C | 18 | short | 1 |  | acu.b mj.g | ứng viên đơn giản |
| 29 | 0x1D |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 30 | 0x1E | 40 | short short int | 3 |  | acu.b mj.a | ứng viên đơn giản |
| 31 | 0x1F |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 32 | 0x20 | 139 | short byte UTF int byte short | 6 |  | acu.b mj.a | ứng viên đơn giản |
| 33 | 0x21 | 43 | short byte int int | 4 |  | acu.b mj.a | ứng viên đơn giản |
| 34 | 0x22 | 4 |  | 0 |  | km.g | rỗng/không đọc payload |
| 35 | 0x23 | 424 | short short short ubyte short byte byte byte | 8 |  | acu.b | ứng viên đơn giản |
| 36 | 0x24 | 4 |  | 0 |  | km.g | rỗng/không đọc payload |
| 37 | 0x25 | 113 | UTF UTF | 2 | '' \| 'OK' \| '' \| 'Đóng' | acu.b km.a sx.a | ứng viên đơn giản |
| 38 | 0x26 | 18 | UTF | 1 |  | acu.b | ứng viên đơn giản |
| 39 | 0x27 | 106 | UTF bool UTF UTF | 4 | 'Xin chọn nick khác' \| 'sms://' | acu.b km.a | ứng viên đơn giản |
| 40 | 0x28 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 41 | 0x29 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 42 | 0x2A |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 43 | 0x2B |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 44 | 0x2C |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 45 | 0x2D |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 46 | 0x2E |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 47 | 0x2F |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 48 | 0x30 | 14 | short | 1 |  | acu.b mj.i | ứng viên đơn giản |
| 49 | 0x31 | 8 |  | 0 |  | mj.c | rỗng/không đọc payload |
| 50 | 0x32 | 8 |  | 0 |  | mj.d | rỗng/không đọc payload |
| 51 | 0x33 | 8 |  | 0 |  | mj.e | rỗng/không đọc payload |
| 52 | 0x34 | 8 |  | 0 |  | mj.s | rỗng/không đọc payload |
| 53 | 0x35 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 54 | 0x36 | 8 |  | 0 |  | mj.t | rỗng/không đọc payload |
| 55 | 0x37 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 56 | 0x38 | 8 |  | 0 |  | mj.r | rỗng/không đọc payload |
| 57 | 0x39 | 1 |  | 0 |  |  | rỗng/không đọc payload |
| 58 | 0x3A | 43 | byte short | 2 |  | acu.b | ứng viên đơn giản |
| 59 | 0x3B | 14 | UTF | 1 |  | acu.b mj.c | ứng viên đơn giản |
| 60 | 0x3C | 8 |  | 0 |  | mj.f | rỗng/không đọc payload |
| 61 | 0x3D | 99 | short short byte byte short short short | 7 |  | acu.b mj.a | ứng viên đơn giản |
| 62 | 0x3E | 9 |  | 0 |  | mj.y | rỗng/không đọc payload |
| 63 | 0x3F |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 64 | 0x40 | 101 | byte byte byte short short short | 6 |  | acu.b | ứng viên đơn giản |
| 65 | 0x41 | 28 | short byte byte | 3 |  | acu.b mj.a | ứng viên đơn giản |
| 66 | 0x42 | 141 | byte short short short byte short | 6 | 'Người bạn mời đang trao đổi với người khác' | acu.b mj.j km.a mj.k mj.l | ứng viên đơn giản |
| 67 | 0x43 | 28 | short byte short | 3 |  | acu.b mj.a | ứng viên đơn giản |
| 68 | 0x44 | 17 | short | 1 |  | acu.b mj.e km.g | ứng viên đơn giản |
| 69 | 0x45 | 17 | short | 1 |  | acu.b mj.f km.g | ứng viên đơn giản |
| 70 | 0x46 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 71 | 0x47 | 41 | byte short byte | 3 |  | acu.b mj.b | ứng viên đơn giản |
| 72 | 0x48 | 6 |  | 0 | 'Đã sửa xong.' | km.a | rỗng/không đọc payload |
| 73 | 0x49 | 9 |  | 0 |  | mj.h | rỗng/không đọc payload |
| 74 | 0x4A |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 75 | 0x4B |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 76 | 0x4C | 9 |  | 0 |  | mj.g | rỗng/không đọc payload |
| 77 | 0x4D | 15 | UTF | 1 |  | acu.b mj.d | ứng viên đơn giản |
| 78 | 0x4E | 18 | short | 1 |  | acu.b mj.h | ứng viên đơn giản |
| 79 | 0x4F |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 80 | 0x50 | 258 | byte byte byte short short short | 6 |  | acu.b | ứng viên đơn giản |
| 81 | 0x51 | 6 |  | 0 | 'Đã mua được vé' | km.a | rỗng/không đọc payload |
| 82 | 0x52 | 63 | byte | 1 |  | acu.b | ứng viên đơn giản |
| 83 | 0x53 | 8 |  | 0 |  | mj.b | rỗng/không đọc payload |
| 84 | 0x54 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 85 | 0x55 | 6 |  | 0 | 'Đã mua, món đồ đang ở trong hành trang.' | km.a | rỗng/không đọc payload |
| 86 | 0x56 | 128 | byte byte UTF byte int UTF | 6 | '' | acu.b | ứng viên đơn giản |
| 87 | 0x57 | 8 |  | 0 |  | mj.p | rỗng/không đọc payload |
| 88 | 0x58 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 89 | 0x59 | 8 |  | 0 |  | mj.j | rỗng/không đọc payload |
| 90 | 0x5A | 8 |  | 0 |  | mj.i | rỗng/không đọc payload |
| 91 | 0x5B | 1 |  | 0 |  |  | rỗng/không đọc payload |
| 92 | 0x5C | 8 |  | 0 |  | mj.l | rỗng/không đọc payload |
| 93 | 0x5D |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 94 | 0x5E | 8 |  | 0 |  | mj.k | rỗng/không đọc payload |
| 95 | 0x5F | 36 | short short byte | 3 |  | acu.b mj.c | ứng viên đơn giản |
| 96 | 0x60 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 97 | 0x61 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 98 | 0x62 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 99 | 0x63 |  |  | 0 | ' tai cmd nay' \| ' tai cmd nay' |  | rỗng/không đọc payload |
| 100 | 0x64 | 9 |  | 0 |  | mj.z | rỗng/không đọc payload |
| 101 | 0x65 | 8 |  | 0 |  | mj.m | rỗng/không đọc payload |
| 102 | 0x66 | 12 |  | 0 | 'BẠN BÈ' | mj.a | rỗng/không đọc payload |
| 103 | 0x67 | 8 |  | 0 |  | mj.n | rỗng/không đọc payload |
| 104 | 0x68 | 38 | byte byte | 2 | 'LOI CHO NAY NE ' | acu.b mj.d | ứng viên đơn giản |
| 105 | 0x69 | 392 | byte byte byte short UTF byte short short byte short UTF | 11 |  | acu.b | cần xác nhận (có vòng lặp/rẽ nhánh) |
| 106 | 0x6A | 8 |  | 0 |  | mj.a | rỗng/không đọc payload |

## 15. Nhật ký cập nhật WBS

| Ngày | Task | Thay đổi | Commit | Bằng chứng / giới hạn |
|---|---|---|---|---|
| 2026-11-10 | A3 / theo dõi dự án | Đưa WBS Markdown thành nguồn tiến độ chuẩn; README và PROJECT_PROGRESS dẫn về file này | `84242be` | Đã xác minh file và các liên kết trên `main` |
| 2026-11-10 | C9 | Thêm verifier kiểm tra SHA-256 từng tài nguyên giải mã, tái tạo `assetVersion`, tùy chọn đối chiếu JAR nguồn; tách class output khỏi public assets | `02ea560`, `8999b31`, `7dcf7e9` | Verifier smoke test PASS với manifest tổng hợp; chấp nhận file nguyên vẹn và từ chối file bị sửa; chưa chạy trên bộ asset gốc do JAR không có trong môi trường thực thi |
| 2026-11-10 | B2 | Thêm `tools/suggest_class_roles.py`, xuất JSON/Markdown review queue cho 9 nhóm vai trò; giữ riêng 16 anchor đã biết; sửa phân tích owner của call graph để không cắt sai tên class có package | `484e59a`, `d4be9ea`, `c297663`, `63745d5` | Đã rà soát logic và tích hợp command/docs; chưa tạo role map thực tế do thiếu output phân tích từ JAR gốc; heuristic không tự rename class |
| 2026-11-10 | B1 | Thêm `tools/analyze_class_files.py` và lệnh `npm run analyze:classes`; xuất class/method index, opcode counts, call graph và method matches theo chuỗi/opcode | `8460780`, `f866a7b`, `02ea560`, `89657c0`, `8a0aab6`, `d2e1750` | `py_compile`, test class Java tổng hợp (`javac`), tìm `KPAH`, `invokevirtual` và `tableswitch` đều PASS; class output tách khỏi `public/`; chưa chạy trên JAR gốc do file JAR không có trong môi trường thực thi |
| 2026-11-10 | C9 | Thêm SHA-256 cho file JAR nguồn, từng entry và từng tài nguyên giải mã; tạo `assetVersion` từ fingerprint nội dung; asset loader thêm `?v=` vào URL để tránh cache ảnh cũ | `b7de9f6` | Đã kiểm tra nội dung commit trên GitHub; chưa chạy extractor trên JAR thật trong phiên này vì JAR không có trong môi trường thực thi |

## 14. Hướng dẫn đọc sheet `Đọc trước`

- Lọc WBS theo đợt R1–R5 hoặc ưu tiên P0–P3; cập nhật ngày công ở nguồn Excel nếu muốn bảng tính tự tổng hợp.
- Trong Markdown, cập nhật checkbox và nhật ký commit/bằng chứng nghiệm thu.
- Độ phủ 80% là phép đếm feature, không phải tỷ lệ nội dung/độ sâu được tái hiện.
- C15 (art/âm thanh thay thế) chưa tính vào 737 ngày công; chỉ kích hoạt khi quyết định phát hành công khai/kinh doanh.