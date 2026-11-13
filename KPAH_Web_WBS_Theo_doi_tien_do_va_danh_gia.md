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
| Task đã có một phần triển khai/prototype được xác minh | 33/118 |
| Task chưa có triển khai được ghi nhận | 85/118 |

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
| [ ] | A3 | R1 | P0 | Monorepo và quy trình làm việc | client/ (pnpm), server/ (Maven đa module), tools/ (Python), docs/; trunk-based, PR bắt buộc, pre-commit lint | A1 | OPS | 4 | Một phần – repo client hiện có và workflow GitHub Actions kiểm tra build + Python tooling; chưa phải monorepo client/server/tools như mô tả |
| [ ] | A4 | R1 | P0 | Quản lý dự án, họp, báo cáo tuần (trải đều) | Sprint 2 tuần, demo cuối sprint, theo dõi burn-down theo md |  | PM | 30 | Chưa triển khai theo WBS |
| [ ] | A5 | R1 | P0 | Gói bàn giao cho mỗi đợt R1-R5 | Mỗi đợt có release notes, tag bản build, migration DB, hướng dẫn chạy, video demo, checklist nghiệm thu | A1 | PM | 10 | Chưa triển khai theo WBS |

### Nhóm B — Reverse engineering và đặc tả

| Done | ID | Đợt | Ưu tiên | Công việc | Giải pháp / phạm vi | Phụ thuộc | Vai trò | md | Tình trạng hiện tại |
|---|---|---|---|---|---|---|---|---:|---|
| [ ] | B1 | R1 | P0 | Toolchain phân tích bytecode | Mở rộng bộ đọc constant pool và disassembler Python đã có: xuất call-graph, tìm theo mã lệnh/chuỗi; đối chiếu bằng Vineflower hoặc CFR trên máy có mạng | A3 | RE | 3 | Một phần – đã có Python class-file parser, đọc constant pool/metadata, disassemble bytecode cơ bản, đếm opcode, tạo call graph, field-reference graph, type-reference graph và lọc chuỗi/opcode; class được trích riêng khỏi public assets; smoke test bằng class Java tổng hợp đạt, đã scan JAR gốc: 782/782 class parse, 0 lỗi; 3.094 methods, 19.878 call edges, 38.448 field refs, 3.968 type refs; CFR 0.152 decompile 782/782 class thành 782 file Java; CI thành công; CFR source đã được dùng để xác nhận 33 class-role anchors |
| [ ] | B2 | R1 | P0 | Khôi phục tên class theo vai trò | Đặt tên theo chuỗi UI, tài nguyên được nạp, kiểu tham chiếu; ghi bản đồ a->tên thật | B1 | RE | 5 | Một phần – đã có công cụ xếp hạng vai trò ứng viên theo constant strings, superclass/interface, method/field signature, call graph, field-reference graph và type-reference graph; xuất string evidence cùng danh sách callers/callees và các class được tham chiếu; giữ các anchor đã xác minh; đã chạy role-ranker trên JAR gốc: 33 anchor đã xác minh, 112 class còn giả thuyết, 637 chưa đủ tín hiệu; CFR source xác nhận thêm 17 vai trò (transport workers, dispatcher, resource/map/font, inventory, skill, boss/dragon); 112 ứng viên còn lại cần review |
| [ ] | B3 | R1 | P0 | Đặc tả transport: khung gói, handshake, XOR | Xác nhận chiều ghi (acz), con trỏ khóa gửi, gói -128; viết test vector hai chiều | B1 | RE | 2 | Một phần – CFR xác nhận C2S opcode + uint16 BE + payload; S2C short frame và marker 0x80 + opcode + uint32 BE; handshake -40, key prefix-XOR, send/receive cursor riêng và wrap; có codec tham chiếu/test vectors; CI self-test PASS; đã ghi tài liệu login/registration/server list/character request-response |
| [ ] | B4 | R1 | P0 | Trích lệnh: Auth, danh sách server, nhân vật | Lần theo handler ka.a cho cmd đăng nhập, chọn/tạo nhân vật; ghi field theo thứ tự đọc/ghi | B2,B3 | RE | 4 | Một phần – đã có extractor đọc `jy.java` để lập catalog C2S opcode và thứ tự write fields, đọc `ka.java` để lập S2C dispatch/read fields; lần quét đầu: 125 writer declarations, 124 có send call, 106 opcode C2S được enqueue, 149 case S2C (142 opcode duy nhất); đã ghi payload Auth/login, registration, roster, select/delete/restore/create character; cần annotate sâu response opcode 1/3 và các opcode gameplay còn lại |
| [ ] | B5 | R1 | P0 | Trích lệnh: Map, di chuyển, đối tượng (người, mob, NPC, đồ rơi) | Như B4 cho các cmd vào map, thêm/xóa đối tượng, vị trí; xử lý các hàm phụ mà 88 lệnh đẩy sang | B4 | RE | 5 | Một phần – đã ghi source-backed schema C2S movement opcode 4/map request 12; S2C entity spawn/update 4, player snapshot 5, entity snapshot 7, despawn 8, map transition 12 và counter state opcode 82 (conditional read theo state hiện tại); xác định factory kind→class; drop/movement interpolation còn cần truy vết |
| [ ] | B6 | R2 | P0 | Trích lệnh: Chiến đấu, kỹ năng, buff | Như B4 cho tấn công, sát thương, hiệu ứng, cooldown, buff/debuff | B5 | RE | 4 | Một phần – đã trace C2S skill cast opcode 51; S2C damage/effect handlers 6/9/10/83/106 và timed effect/buff -74/-71/-73. Browser reducer hiện xử lý 6/9/10/83/106: opcode 10 giữ event trung tính, opcode 83 giữ guard source entity và target values, opcode 106 cập nhật HP nhiều mục tiêu + Phaser hiển thị damage nổi trên từng mục tiêu; effect bytes chưa gán semantics. Công thức damage, skill code mapping, cooldown/buff stacking còn mở |
| [ ] | B7 | R2 | P0 | Trích lệnh: Túi đồ, trang bị, cửa hàng, giao dịch | Như B4 cho item, slot, mặc/tháo, mua/bán, giao dịch | B5 | RE | 5 | Một phần – đã trace và bổ sung Java/JavaScript decoder cho material lists 73, equipment list 76, collection/catalog 62, trade variants/state 66/67, inventory↔storage request/response 68/69 and empty refresh request 70, refinement context 71/-34, trade/market panel 94, market listing request/response 92 và update/remove 95; C2S typed writer schemas 61/68/69/78/92/95/100 cùng 7 mode C2S opcode 62; có schema `bo/be/de` và `xg.E/ca.N/O/P`; client use/equip/drop/upgrade requests đã source-trace; purchase transaction, unequip-to-bag, warehouse sale server transaction/persistence và server-authoritative mutation còn mở |
| [ ] | B8 | R2 | P1 | Trích lệnh: NPC, menu, nhiệm vụ | Như B4 cho menu/hội thoại NPC và trạng thái nhiệm vụ | B5 | RE | 3 | Một phần – đã trace entity speech opcode 27, help -24, message -26, quest collection -64, objective/detail -30/-31 và confirmation -32; đã xác định `cy` quest model và generic menu `tb`; NPC action/dialogue tree và reward flows còn mở |
| [ ] | B9 | R3 | P1 | Trích lệnh: Chat, bạn bè, nhóm, bang hội | Như B4 cho các cmd xã hội, mời/chấp nhận/từ chối | B5 | RE | 4 | Một phần – đã trace chat C2S/S2C -5/-18, friend request/response 101, friend removal -6, roster 103, generic invite -11 và guild profile/kick/announcement/chat/ranking/reward -10/-12/-13/-17/-18/-19/-20; friend roster field labels và party/guild lifecycle còn mở |
| [ ] | B10 | R4 | P2 | Trích lệnh: luyện đồ, linh thú, ngựa, đấu trường, đấu giá, top, trồng cây, tàu | Như B4 cho nhóm tính năng nâng cao; ưu tiên theo thứ tự đợt R4 | B5 | RE | 6 | Một phần – đã xác minh luyện/nâng cấp trang bị (C2S -25), refinement option/cost matrix (S2C 80), pet equipment/fusion UI, cây thần/farm (C2S/S2C -66, C2S 109), cổ vật (S2C -67), top (S2C -19; đã ghi B9) và NPC yêu cầu vé tàu; chưa có bằng chứng đủ cho ngựa/mount, đấu trường, đấu giá; đề xuất tách thành B10.1–B10.8 |
| [ ] | B11 | R2 | P1 | Trích toàn bộ lệnh client gửi lên (C2S) | Quét mọi nơi dựng gói gửi (new acu), kể cả cmd truyền bằng biến; đối chiếu với S2C | B5 | RE | 5 | Một phần – catalog extractor đã mở rộng quét toàn bộ CFR `.java` thay vì chỉ `jy.java`, bắt `jy.b(opcode)` và `new acu(opcode)` kể cả opcode động; ghi source file/line, payload write order và send-call count; cần CI run xác nhận và trace caller cho toàn bộ wrapper |
| [ ] | B12 | R1 | P0 | Đặc tả máy trạng thái client | Vẽ luồng login -> chọn server -> chọn nhân vật -> vào map -> chơi và các trạng thái ngắt kết nối | B4 | RE | 4 | Một phần – đã trace MIDlet/bootstrap/server selector/login/transport handshake/roster/create/select/loading/world và các nhánh connect failure/20s timeout/reader disconnect/reset; xác định `km.q` screen owner và `mj` world state; opcode1/3 initialization và server session semantics còn mở |
| [ ] | B13 | R2 | P1 | Đặc tả công thức phía client | Ghi lại tốc độ, quãng nhảy, hiển thị sát thương, tính toán dự đoán phía client | B6 | RE | 4 | Một phần – đã trace actor step `cT` default 3 và tăng theo khoảng cách (>30/+1, >50/+2, >70/+3, >100/+4), trục X/Y tuần tự, click-to-move waypoint, C2S coordinate throttle 250ms và floating damage/MISS lifetime 30 ticks; jump physics và damage/crit formula chưa xác minh |
| [ ] | B14 | R1 | P0 | Codegen Java/TS từ protocol.yaml | Sinh enum Cmd, lớp request/response, reader/writer cho cả hai ngôn ngữ; kiểm tra lệch bằng test vector | B3 | RE | 6 | Một phần – đã tạo canonical `protocol/protocol.yaml` với 110 C2S + 142 S2C entries; generate Java/JS command enums, primitive readers/writers và typed payload codec cho 13 schema đã xác minh; 239 payload còn opaque; đã generate transport codec Java/JS (handshake, XOR cursor, C2S/S2C short và S2C long) từ transport spec; nested/conditional payloads và production capture còn mở |
| [ ] | B15 | R1 | P0 | Replay harness: jar gốc chạy với server mock | Dựng server mock WS<->TCP đóng gói đúng khung, cho jar gốc trên emulator nói chuyện để kiểm chứng đặc tả | B14 | RE | 5 | Một phần – đã có `tools/kpah_replay_harness.py` mock TCP loopback gửi S2C -40 key trước khi đọc các frame C2S đã XOR, giữ cursor qua nhiều packet và redacts payload login; self-test socketpair/handshake đã thêm vào CI; chưa chạy JAR trên emulator, chưa có auth/world responses hoặc WS↔TCP bridge |
| [ ] | B16 | R1 | P0 | Danh mục dữ liệu server phải gửi lúc đăng nhập | Phân tích các lệnh khởi tạo (1, 3, 5, 15, 16...): tile, part, item, skill, map; chốt server phải gửi gì và định dạng | B4 | RE | 4 | Một phần – đã trace global config opcode 1 (skill metadata, profession tables, tile blobs, part data), character snapshot 3, shop/catalog + pet-equipment image subtype 15, inventory/skill/auxiliary modes 16; đã xác định runtime destinations, optional sentinel-guarded records và opaque image branch; bổ sung reducer client thuần cho opcode 16: mode 0 merge currency/resource theo catalog index, mode 1 replace inventory, mode 2 replace nhóm k thứ hai, mode 3 replace counter array; unknown mode không làm đổi state. Chưa chốt server send order, toàn bộ field semantics và binary part/tile schema; opcode 1 reducer đã thêm global config, skill/profession catalogs, stat labels, quest objectives, tile và part blobs (binary copy); đã có test riêng và nối CI. opcode 3 extension reducer bổ sung theo character id; chỉ merge từng group parse hoàn chỉnh, không overwrite group lỗi/truncated. Opcode 15 reducer da them shopContext va petEquipmentImage theo targetCharacterId; them applyOpcode3Snapshot va applyInitializationEvent lam entry point route opcode 1/3 prefix/3 extension/15/16; character prefix va extension merge theo characterId. Da noi KpahProtocolSession vao state.serverWorld; them TCP-to-WebSocket bridge loopback va panel browser ket noi local bridge (khong gui login). Them reducer world-state opcode 4/5/6/8/9 va Phaser diagnostic binding: marker theo entityId/kind/templateId, toa do opcode 4/5, remove theo opcode 8. Chua map template sang sprite/atlas/animation, chua noi local player identity, chua noi combat event vao HP/UI, chua noi local-save. |

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
| [ ] | C9 | R1 | P0 | Pipeline build asset tự động, versioning | Một lệnh chạy toàn bộ converter, xuất manifest có hash để cache-busting | C2 | OPS | 3 | Một phần – extractor ghi SHA-256 cho JAR, từng entry và tài nguyên giải mã; tạo assetVersion fingerprint, loader tự thêm query version để cache-busting. đã có lệnh verify hash tài nguyên/assetVersion; đã thêm GitHub Actions kiểm tra client build, Python compile, smoke test, trích xuất/verify JAR gốc và xuất báo cáo bytecode/role map; atlas manifest còn thiếu |
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
| 2026-11-10 | B1 / B2 / C9 | Mở rộng CI thành job riêng trích `KPAH_278.jar`, xuất class vào thư mục private, verify hash tài nguyên, quét toàn bộ class, sinh role-candidate JSON/Markdown và upload artifact 14 ngày | `1ab98be` | Đã push workflow; chưa có kết quả run của job quét JAR tại thời điểm cập nhật; chỉ review role map sau khi artifact được tạo |
| 2026-11-10 | A3 / C9 | Thêm `.github/workflows/validate.yml`: CI trên push/PR/main chạy npm build, Python compileall, compile Java fixture rồi smoke-test bytecode analyzer + class-role mapper, tạo manifest tổng hợp và xác nhận verifier phát hiện file bị sửa | `b38a2f6`, `4b11a7d` | Workflow có concurrency group, tự hủy run cũ khi có commit mới; workflow đã push; chưa có kết quả run từ GitHub Actions tại thời điểm cập nhật; chưa tự động giải nén JAR gốc hoặc deploy staging |
| 2026-11-10 | C9 | Thêm verifier kiểm tra SHA-256 từng tài nguyên giải mã, tái tạo `assetVersion`, tùy chọn đối chiếu JAR nguồn; tách class output khỏi public assets | `02ea560`, `8999b31`, `7dcf7e9` | Verifier smoke test PASS với manifest tổng hợp; chấp nhận file nguyên vẹn và từ chối file bị sửa; chưa chạy trên bộ asset gốc do JAR không có trong môi trường thực thi |
| 2026-11-10 | B2 | Thêm `tools/suggest_class_roles.py`, xuất JSON/Markdown review queue cho 9 nhóm vai trò; giữ riêng 16 anchor đã biết; sửa phân tích owner của call graph để không cắt sai tên class có package | `484e59a`, `d4be9ea`, `c297663`, `63745d5`, `9b59f7b`, `886e494`, `b92489b` | Đã rà soát logic và tích hợp command/docs; chưa tạo role map thực tế do thiếu output phân tích từ JAR gốc; heuristic không tự rename class |
| 2026-11-10 | B15 | Tạo `tools/kpah_replay_harness.py` và `docs/reverse-engineering/local-tcp-replay-harness.md`; mock loopback gửi S2C -40 key trước, đọc encrypted C2S -40/-1/1, giữ XOR cursor và redacts login payload; thêm self-test socketpair vào CI | `cd2f4e6`, `bb1901a`, `072d9fd`, `81ca334`, `cbeedbe`, `af19afd` | Chưa chạy JAR thật trong emulator; chưa có auth/roster/map response hoặc WebSocket↔TCP bridge; harness chỉ capture handshake/login đầu tiên |
| 2026-11-10 | B14 | Tạo `protocol/protocol.yaml`, `tools/generate_protocol.py`, Java/JS generated command catalog + PacketReader/Writer + payload codec; thêm test vector cho refine, movement, farm, modified UTF-8 và Java compile smoke test | `9cd3d8d`, `3cbd8bd`, `b0a00ac`, `14e20f9`, `12f1fe5`, `bb8b67b`, `b7a92d9`, `155c717`, `8175fec`, `f89d0f2` | 252 direction-specific entries; 13 typed payloads, 239 opaque; CI xanh cho generated source consistency, JS codec vectors và Java 21 compile/smoke; request-response classes đầy đủ và frame/XOR codegen chưa xong |
| 2026-11-10 | B10 | Tạo `docs/reverse-engineering/advanced-features-r4.md`: trace luyện đồ -25, pet menu, farm -66/109, artifact -67, ranking -19 và NPC vé tàu; đánh giá horse/arena/auction chưa có bằng chứng; đề xuất tách 8 subtask, gộp ranking với B9 | `ca2e027`, `cc827ae` | Farm protocol cần trace sâu hơn; pet request/response và boat route còn mở; chưa triển khai nghiệp vụ BE; không gán `-62/-63` cho arena vì source xác nhận đây là Hộp may mắn |
| 2026-11-10 | B16 | Tạo `docs/reverse-engineering/protocol-initialization-data.md`: schema opcode 1 global configuration/skill/profession/tile/part data; opcode 3 selected character snapshot; opcode 15 shop/catalog; opcode 16 inventory/skill/auxiliary state | `00d95fd`, `2e2d5eb` | Trace runtime destinations `z/ca/mj/ku/hd/bo/bk`; field semantics của lookup tables và thứ tự packet init cần capture/review thêm |
| 2026-11-10 | B13 | Tạo `docs/reverse-engineering/client-motion-and-damage.md`: actor movement step/thresholds, X-then-Y movement, tile waypoint/collision checks, 250ms C2S position send, floating damage/MISS drift and expiry | `d61cfda`, `f570be5` | Trace `z/ca/mj/km/hf`; jump/fall physics, cT dynamic modifiers and damage/crit formula remain unverified |
| 2026-11-10 | B12 | Tạo `docs/reverse-engineering/client-state-machine.md`: MIDlet/resource bootstrap, server selector, login, TCP handshake, character roster/create/select, loading/map transition, world screen, connect failure, 20s timeout, reader disconnect và reset callbacks | `2f787ce`, `6abf17f` | Trace `GameMidlet/km/kv/uj/ro/rq/lj/ls/li/mj/acv/acy/acw/acx/ka/qb/qc`; chưa đặc tả đầy đủ init payload opcode 1/3 hoặc server session lifecycle |
| 2026-11-10 | B11 | Mở rộng `tools/extract_protocol_catalog.py` quét mọi CFR `.java`, nhận diện constant/dynamic opcode từ `jy.b(...)` và `new acu(...)`, ghi source file/line, write order, send-call count và phân biệt packet factory không gửi | `d876127` | Chưa có kết quả CI cho phiên bản all-source scanner; catalog hiện chưa nối toàn bộ call sites của wrapper method về opcode |
| 2026-11-10 | B9 | Tạo `docs/reverse-engineering/protocol-social-guild-chat.md`: chat -5/-18, friend request 101/response, friend remove -6, roster 103, invitation -11, guild profile/kick/notice/chat/ranking/reward -10/-12/-13/-17/-18/-19/-20 | `1b63c1e`, `10cb3bc` | Trace source `sj/mj/ka/jy`, callbacks `mn/mo/kh/ki`; friend roster UTF fields và đầy đủ party/guild lifecycle chưa xác nhận |
| 2026-11-10 | B8 | Tạo `docs/reverse-engineering/protocol-npc-quest-menu.md`: entity speech 27, help -24, message -26, quest records -64, objective/detail -30/-31, generic confirm -32; trace `cy`, `tb`, `mj`, `kk/kc` | `b94ca08`, `bf6d776` | Quest collection modes/field order đã trace; generic prompt chưa gán riêng cho quest; NPC action tree và reward schema chưa đóng |
| 2026-11-10 | B7 | Tạo `docs/reverse-engineering/protocol-inventory-trade.md`: schema material opcode 73, equipment 76, trade/market panel 94, market listing 92 và market item update/remove 95; trace models `bo/be/de` và collections `xg.E/ca.N/O/P` | `3e28cdc`, `e04d5f8` | CFR source `jy/ka/mj/xg/bo/be/de`; purchase/use/equip/unequip/upgrade/warehouse chưa đóng |
| 2026-11-10 | B6 | Tạo `docs/reverse-engineering/protocol-combat-skills.md`: C2S skill cast opcode 51; S2C damage 6/9/10/83/106; timed effect/buff lifecycle -74/-71 và extended effect -73; trace side effects lên HP, floating damage và entity effect lists | `6781dd6`, `25a60de` | Đã đối chiếu `jy/ka/mj/z/cd/bu/e`; chưa suy ra công thức damage/crit, toàn bộ skill ID hoặc stacking rules |
| 2026-11-10 | B5 | Tạo `docs/reverse-engineering/protocol-world-map.md`: trace `ca/z/cd/ce/mj/hf`, C2S movement/map request, S2C spawn/player/entity snapshot/despawn/map transition; lập entity kind factory map | `2429198`, `bd00870` | Đối chiếu trực tiếp CFR `jy/ka/mj/ca/cd`; chưa đóng schema optional fields opcode 5/12, ground drops và server movement interpolation |
| 2026-11-10 | B4 | Tạo `docs/reverse-engineering/protocol-auth-character.md`: ghi rõ HTTP server list, C2S login `1`, session init `-1`, registration `39`, character select/delete/restore `13`, create `14`; S2C roster `13` và registration response `39` theo thứ tự field | `5264171` | Đã đối chiếu caller `rq/lk/ln/lp/lv`, writer `jy` và dispatcher `ka`; chưa giải nghĩa đầy đủ các field phụ và response opcode 1/3 |
| 2026-11-10 | B2 | Cập nhật class-role map sau CFR: 33 anchor đã xác minh, 112 hypotheses, 637 unclassified; tài liệu liệt kê 33 vai trò và evidence source | `1c4a0da` | Artifact CI run `42782202670` xác nhận counts; không tự đổi tên symbol trong code |
| 2026-11-10 | B3 | Hoàn tất synthetic codec self-test trong CI cho key derivation, C2S/S2C short frame, S2C long-length marker và cursor wrap | `6f5d04d`, `7e74e98` | Job `validate` SUCCESS; chưa có live server capture |
| 2026-11-10 | B4 | Thêm `tools/extract_protocol_catalog.py`, command `npm run catalog:protocol`; đọc CFR `jy.java` và `ka.java` để xuất C2S writer payload order và S2C handler read/dispatch map; phân biệt declaration không thực sự enqueue | `29cda15`, `023ed85`, `abadffc`, `d49a0de`, `6a7e51f` | Scan đầu: 125 declarations, 124 có send call, 106 opcode C2S thực sự enqueue; 149 S2C case, 142 opcode duy nhất; artifact JSON/Markdown do CI tạo; payload semantics chưa annotate |
| 2026-11-10 | B3 | CI chạy `python tools/kpah_protocol_reference.py --self-test` thành công cho key derivation, C2S/S2C framing, long-length marker và cursor wrap | `6f5d04d` | Job `validate` SUCCESS; test vectors dùng key tổng hợp, không phải key production |
| 2026-11-10 | B2 | Role-ranker chạy trên JAR gốc sau CFR review: 33 verified anchors, 112 hypotheses, 637 unclassified | `6f5d04d` | Artifact `kpah-original-jar-analysis` đã upload; 17 class bổ sung được xác nhận từ CFR source |
| 2026-11-10 | B1 | CFR 0.152 decompile 782/782 class thành 782 `.java`; job `analyze-original-jar` và `validate` SUCCESS | `f23463f`, `6f5d04d` | Source CFR, role map, bytecode JSON nằm trong artifact CI; decompile không tự xác nhận business meaning cho mọi class |
| 2026-11-10 | B3 | Thêm `docs/reverse-engineering/protocol-transport.md` và `tools/kpah_protocol_reference.py`: key handshake `-40`, frame C2S/S2C, XOR stream, cursor độc lập/wrap, marker long-length `0x80`; thêm `npm run test:protocol` và CI step | `8c4d946`, `2bb85c6`, `e03a15d`, `e30061e`, `bbc3b89` | Test vectors tổng hợp được khai báo; chờ workflow chạy self-test; chưa có packet capture/server source để xác minh tương tác production |
| 2026-11-10 | B2 | Đối chiếu CFR source cho 17 class: `acx/acy/acw/acz/ka/uk/ku/mh/hf/xg/im/jo/w/r/ad/i/cg`; cập nhật anchor registry và class-role map, không tự rename symbol | `b15a962`, `343f92c` | Các vai trò được xác nhận từ source decompile, method signatures, constants và resource paths; role-ranker mới cần chạy lại để chốt số liệu hypotheses |
| 2026-11-10 | B1 / B2 | CFR 0.152 decompile thành công toàn bộ 782 class thành 782 file `.java`; artifact CI gồm source, bytecode index và role map | `f23463f` | Cả hai job `validate` và `analyze-original-jar` SUCCESS; source decompile không tự xác nhận tên class nếu chưa review method cụ thể |
| 2026-11-10 | B2 | Tạo `docs/reverse-engineering/class-role-map.md`: tài liệu hóa 16 anchor đã xác minh, 17 class ứng viên ưu tiên, fingerprint JAR và số liệu phân tích; tách rõ anchor với giả thuyết để tránh rename sai | `64b1f75` | Nội dung dựa trên JSON/manifest artifact của CI run `80b1df5`; candidate vẫn cần decompiler/manual review |
| 2026-11-10 | B1 / B2 / C1 / C9 | Quét JAR gốc trên GitHub Actions: 1.024 archive entries; 782/782 class parse, 0 lỗi; 3.094 methods, 19.878 call edges, 38.448 field refs, 3.968 type refs; 198/198 tài nguyên giải mã verify hash; role map sinh 16 anchors, 129 hypotheses, 637 unclassified | `80b1df5` | Job `analyze-original-jar` và job `validate` đều SUCCESS; artifact `kpah-original-jar-analysis` đã upload. CFR source review chưa có trong run này |
| 2026-11-10 | B1 | Thêm `tools/analyze_class_files.py` và lệnh `npm run analyze:classes`; xuất class/method index, opcode counts, call graph và method matches theo chuỗi/opcode | `8460780`, `f866a7b`, `02ea560`, `89657c0`, `8a0aab6`, `d2e1750`, `f4353eb` | `py_compile`, test class Java tổng hợp (`javac`), tìm `KPAH`, `invokevirtual` và `tableswitch` đều PASS; class output tách khỏi `public/`; chưa chạy trên JAR gốc do file JAR không có trong môi trường thực thi |
| 2026-11-10 | C9 | Thêm SHA-256 cho file JAR nguồn, từng entry và từng tài nguyên giải mã; tạo `assetVersion` từ fingerprint nội dung; asset loader thêm `?v=` vào URL để tránh cache ảnh cũ | `b7de9f6` | Đã kiểm tra nội dung commit trên GitHub; chưa chạy extractor trên JAR thật trong phiên này vì JAR không có trong môi trường thực thi |

## 14. Hướng dẫn đọc sheet `Đọc trước`

- Lọc WBS theo đợt R1–R5 hoặc ưu tiên P0–P3; cập nhật ngày công ở nguồn Excel nếu muốn bảng tính tự tổng hợp.
- Trong Markdown, cập nhật checkbox và nhật ký commit/bằng chứng nghiệm thu.
- Độ phủ 80% là phép đếm feature, không phải tỷ lệ nội dung/độ sâu được tái hiện.
- C15 (art/âm thanh thay thế) chưa tính vào 737 ngày công; chỉ kích hoạt khi quyết định phát hành công khai/kinh doanh.

### B14 — transport codec Java/JavaScript (2026-11-10)

- Mở rộng codegen transport từ `protocol/protocol.yaml`: prefix-XOR handshake -40, XOR stream, C2S short frame, S2C short frame và S2C encrypted long frame marker 0x80/u32.
- Hai ngôn ngữ expose cursor tường minh; send/receive cursor do caller quản lý riêng, không reset tại packet boundary.
- Thêm test vectors handshake, key derivation, encrypted C2S, S2C short/long, cursor wrap; CI compile/smoke-test Java 21 và test JavaScript.
- B14 vẫn **Một phần**: 239 payload opaque, chưa có complete conditional/nested schemas, production capture và server/gateway.

| 2026-11-10 | B14 | Generate transport codec Java/JS từ transport spec: handshake prefix-XOR, XOR stream, C2S/S2C short và S2C encrypted long header; thêm synthetic vectors và CI Java 21 | `4dcdc4d`, `2a7e24b`, `3f3bbd3`, `914a163`, `37239f6`, `c69dfd3`, `509e06a`, `9cdd202`, `e62e5fa`, `f11019e`, `01e41fc`, `b74b4d6` | CI run `42797122962` SUCCESS; generated-source consistency, JS transport vectors, Java 21 compile/smoke test và client Vite build PASS. Run trước đó `42796977585` phát hiện stale generated outputs, đã đồng bộ trực tiếp từ template canonical và chạy lại xanh. |

| 2026-11-11 | B16 | Tạo schema prefix có giới hạn cho S2C opcode 3; codegen decoder Java/JS giữ opaque tail, không đánh dấu full schema | `833cece`, `d83e4ba`, `ca6c8d5`, `008773a`, `a08e25f` | Chờ CI xác minh; B16 vẫn Một phần vì opcode 1/15/16 và extension opcode 3 chưa được giải mã đầy đủ. |


| 2026-11-11 | B16 | Hoàn tất decoder prefix opcode 3 và bổ sung decoder có giới hạn cho opcode 16 mode 0; giữ mode 1–3 và extension bytes opaque; codegen Java/JS và test vectors | `a767c96`, `e648867`, `1f812f7`, `19de36b`, `48a324e`, `a5f1633`, `8de824d`, `5e30d13` | Opcode 3 prefix JavaScript/Java đã qua CI run `42973442687`; opcode 16 mode 0 đang chờ CI cho commit mới. B16 vẫn Một phần; CI run `42974108581` PASS (Vite build, mode-schema codegen consistency, JS vectors, Java 21 compile/smoke); chưa nâng số task nghiệm thu hoặc % tổng thể. |


| 2026-11-11 | B16 | Hiệu chỉnh decoder opcode 16 mode 0 theo CFR `ka.java`: parse thêm hai trường int chung `aY/aZ`, giữ nguyên ý nghĩa nghiệp vụ chưa xác minh | `4aee2a7`, `eb83ada`, `b74737f`, `b323a4a`, `fa2084c`, `72b4129` | Đã bổ sung test JS/Java và cập nhật docs; chờ CI xác nhận. |


| 2026-11-11 | B16 | Mở rộng decoder opcode 16: bổ sung mode 3 (aY, signed-byte count, short array ca.T, aZ); xác minh UI tiêu thụ qua catalog bq.d/e; mode 1–2 vẫn opaque | `da017e2`, `42399fa`, `8a07f0c`, `46d990d`, `dc4d58e`, `1f12ef5`, `1fdf1f5` | CI run `42974710824` PASS cho mode 3 (build, codegen, JS tests, Java 21 smoke); mode 1 tiếp tục được bổ sung và có run riêng. |


| 2026-11-11 | B16 | Bổ sung decoder opcode 16 mode 1: parse item list bo, các trường thuộc tính, UTF description, value u16, nested stat pairs và aY/aZ; mode 2 vẫn opaque | `49fd952`, `4694018`, `3c69b12`, `20a7085`, `01a9003`, `fe344af`, `f9c3b1a` | CI run `42981049834` PASS: Vite build, generated-code consistency, JS tests, Java 21 compile/smoke; mode 0/1/3 decoder vectors đều đạt. |


| 2026-11-11 | B16 | Hoàn thiện nhánh opcode 16 mode 2: hai collection signed-byte count, record `k` theo đúng thứ tự đọc CFR, common `aY/aZ`, ánh xạ collection thứ hai vào `z.by`; unknown mode giữ opaque | `4321de4`, `ae41c97`, `96a6b98`, `16660d5`, `873226b`, `249e8b8`, `e2896f4` | CI run `42981960004` PASS: build FE, generator consistency, JS tests, local TCP replay harness, Java 21 compile/smoke; bốn mode 0–3 đã có vector kiểm chứng. |

| 2026-11-11 | B16 | Bổ sung decoder opcode 15 subtype 0 và non-zero: item record khác nhau ở trường w; parse aS, 5 short, optional UTF/context sentinel; nhánh non-zero giữ image atlas opaque và frame metadata | `473533b`, `b0acc02`, `e558d6b`, `183d2fe`, `4ddac3b`, `5ab53d1` | Đã thêm YAML wire layout, generator JS/Java, test vector và CI run `42985722022` PASS: build FE, generated-code consistency, JS vectors, Java 21 compile/smoke và CFR analysis. B16 vẫn Một phần vì opcode 1 full decoder, opcode 3 extension và dữ liệu tile/part chưa hoàn tất. |

| 2026-11-11 | B16 | Truy vết consumer opcode 1: cv skill metadata/points/cooldown, z.bw skill slots theo profession, mj.A skill catalogs, mj.aS vé tàu, ku.ad item-stat labels, bq.e/d quest objective catalog, GameMidlet.g URL, tile t_hang/t_thanh, hd.a part data | CFR ka/cv/ia/xg/dh/dd/ge/bq/hd/tb | Bổ sung source-backed semantics và đánh dấu các lookup arrays chưa tìm được consumer; chưa tạo full decoder opcode 1, B16 vẫn Một phần. |

| 2026-11-11 | B16 | Truy vết phần sau prefix opcode 3: nhóm character extension, ba nhóm số optional, counted short/byte mapping + UTF, bf và hai nhóm state cuối; ghi rõ fallback và cursor không rollback khi catch | CFR ka.java case 3, ca.java, xg.java | Bổ sung tài liệu source-backed; chưa đưa vào decoder vì cần test riêng từng nhóm và lỗi truncated giữa record. |

| 2026-11-11 | B16 | Tạo decoder opcode 1 global config Java/JS: skill definitions, profession catalogs/slot counts, optional matrices, stat/quest catalogs, paired lookups, hotline/URL, tile blobs và best-effort part data | `f1f0471`, `5ea102a`, `1c8aaa3`, `bd0b6ff`, `90172a7`, `15ed168` | Có YAML section contract, codegen, test vector và CI run `42987425414` PASS: build FE, generated-code checks, JS tests, Java 21 compile/smoke và CFR analysis. B16 vẫn Một phần vì semantics các lookup arrays và live packet confirmation còn mở. |

| 2026-11-11 | B16 | Bổ sung decoder extension opcode 3 riêng sau prefix 33 field: main character extension, pair/triple groups, counted mapping, bf và hai state groups; giữ nguyên fallback và cursor không rollback | `15b2ca1`, `3251aab`, `a9e6148`, `d084972`, `ccb6e59`, `e42796a` | Có generator, test JS full/truncated và Java smoke; CI run `42987425414` PASS. B16 vẫn Một phần vì ý nghĩa mapping và các field extension còn chưa rõ. |

| 2026-11-11 | B14/B16 | Đồng bộ PacketReader JavaScript với DataInputStream về việc tiêu thụ byte khi short/int/long/modified UTF bị truncated; cần thiết để các try/catch độc lập của opcode 3 có cùng cursor semantics giữa Java và JS | `b77c4df`, `b8eafba`, `0c1f60a` | Bổ sung test kiểm tra bytes consumed sau lỗi; CI run `42988161515` PASS cho generated-code checks, protocol/initialization tests và Java 21 compile/smoke. |

| 2026-11-11 | B5 | Tạo decoder Java/JS S2C opcode 4 entity spawn/update, opcode 8 despawn list và opcode 12 map transition/map bytes; giữ default của các optional read, đánh dấu opcode 7 chưa typed do mâu thuẫn CFR ce.a | `8557ee8`, `11fc781`, `92acc18`, `94d9142`, `0b3c9a4`, `190648e` | Có YAML, generator, test vector và Java smoke; CI run `42988786876` PASS. Opcode 7 chờ bytecode verification, không suy diễn entityId. |

| 2026-11-11 | B5 | Bổ sung decoder S2C opcode 5 player/entity snapshot: fixed arrays 7 part bytes + 7 part shorts + 5 appearance shorts, HP/MP, trạng thái, trade flag và các optional groups | `765a6e9`, `263ff57`, `eb633d3`, `37da513`, `0a04715` | Đã hợp nhất vào dedicated opcode5-codec (có entityExists guard), bổ sung counted short/byte mapping bị thiếu, sửa vector aS/ca; CI run `42990823939` PASS cho codegen, JS vectors và Java 21 smoke. |

| 2026-11-11 | B16 | Decoder opcode 5 world entity snapshot Java/JS; kiểm soát entity đã tồn tại, trường vị trí/combat/appearance/state, điều kiện af và các nhóm tail optional | 64294c3, 79e6b47, a370fb1, 39e7c4c, 2244f30, 4ad4bc4, a7c5485, 7e39316, 2472ab0 | Có source contract, generator, test vector full/unknown entity và Java smoke; chờ CI. Không tự tạo entity khi ID chưa có trong world. |

| 2026-11-11 | B5 | Bổ sung decoder combat event S2C opcode 6 và 9 (2 short + byte + 2 int + 4 byte), giữ field trung tính theo đúng wire order | `70dddb0`, `2980989`, `024ce11`, `5b99517`, `a802c0b`, `b7a17ef` | Có generator Java/JS, vector và Java smoke; chờ CI. |


### B5 — S2C opcode 17 entity action/effect event

- **Trạng thái: Một phần (decoder + kiểm thử tổng hợp + CI PASS).** CFR trace: `ka.java:case17`, `kl.java`, `jz.java`, `mj.a(kl)`.
- Java/JS codec parse first short (neutral), target entity ID, event byte, int value, display byte, signed-byte effect count, repeated effect records (byte + four shorts), và tối đa ba byte trailer có điều kiện.
- First short chưa chốt mapping: CFR thể hiện gán vào temporary `new kl()`, nhưng consumer lại đọc `kl.a`. Không tự sửa lỗi decompiler; cần bytecode gốc/packet capture để xác minh. Target ID được xác nhận từ consumer lookup `mj.n(kl.b)`.
- Negative count được reject; các trường effect giữ neutral. Decoder không áp damage hay render VFX.
- CI run `42992393021` PASS: Vite build, toàn bộ generator consistency, JS protocol tests, Java 21 compile/smoke và original-JAR analysis.
- Không tăng % tổng dự án ở increment này vì chưa tính lại trọng số WBS; BE chưa bắt đầu.


### B5 — Opcode 7 entity update and opcode 17 actor/target bytecode verification

- **Trạng thái: Một phần (wire decoder + bytecode verification + synthetic tests + CI PASS).**
- Opcode 7: bytecode `ka.class` xác nhận short đầu tiên gán vào `ce.a` của object được giữ lại; không phải temporary object như CFR hiển thị. Đã parse entity ID, template ID, tọa độ, current/max HP, hai state byte và một int chưa rõ ý nghĩa. `mj.a(ce)` chỉ cập nhật entity đã tồn tại.
- Opcode 17: bytecode xác nhận short đầu tiên gán vào `kl.a`, là actor/source entity ID; short thứ hai `kl.b` là target entity ID. Decoder đổi tên thành `actorEntityId` và `targetEntityId`.
- CI run `42993047244` PASS: Vite build, generator checks, JS protocol tests, Java 21 compile/smoke và original-JAR analysis.
- Các decoder chỉ parse dữ liệu; chưa áp dụng server-authoritative HP/damage hoặc tạo/render effect. Không tăng % tổng dự án vì chưa tính lại trọng số WBS.


### B5 — S2C opcodes 18–21: ground-item and inventory events

- **Trạng thái: Một phần (wire decoder + consumer trace + synthetic tests + CI PASS).**
- Opcode 18: partial `bo` ground-item pickup context; owner character ID, shared type byte (`bo.m` và `bo.D`), drop ID/item ID and remaining properties. Consumer `mj.a(short,bo)` removes the matching ground item and adds it to local inventory for the owner.
- Opcode 19: character ID, ground-item ID, unsigned-byte currency/item index, signed-short amount. Consumer updates currency or item counter and closes the pickup visual.
- Opcode 20: typed removal (signed-byte kind + signed-short ID), matching `j.g/j.h`.
- Opcode 21: inventory item update with unsigned-short value, signed-byte stat count and pairs, optional final byte defaulting to constructor value zero. Consumer merges item state into active lists/panels.
- CI run `42993708570` PASS: Vite build, generator consistency, JavaScript tests, Java 21 compile/smoke and original-JAR analysis.
- Các gói chỉ được decode; chưa có BE/session authoritative để apply reward/inventory. Không tăng % tổng dự án vì chưa tính lại trọng số WBS.


### B5 — S2C opcodes 27, 28, 30, 32 and 33: character feedback/progression

- **Trạng thái: Một phần (wire decoder + consumer trace + synthetic tests + CI PASS).**
- Opcode 27: entity ID + UTF text; consumer displays overhead message and appends player chat log.
- Opcode 28: item ID; consumer removes sold inventory item and credits proceeds.
- Opcode 30: character ID, experience short and gain int; consumer updates XP field and floating feedback.
- Opcode 32: character ID + signed-byte-counted UTF/int resource records; local character has extra byte+short trailer. Consumer recognizes hp/mp/bp/sp. Decoder takes explicit local-character condition and rejects negative count.
- Opcode 33: character ID, level byte and two ints; consumer updates level and HP/MP values and triggers level-up effects.
- CI run `42994113670` PASS: Vite build, generator checks, JS protocol tests, Java 21 compile/smoke and original-JAR analysis.
- Chưa áp dụng authoritative character progression/state; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B5 — S2C opcodes 61 and 78: inventory drop / warehouse sale

- **Trạng thái: Một phần (wire decoder + bytecode/consumer trace + synthetic tests + CI PASS).**
- Opcode 61: character ID, inventory item ID, hai byte và ba short effect data. Bytecode xác nhận byte đầu vào được ghi vào `jz.a` trên instance thực; consumer xóa item tương ứng và tạo ground-effect visual.
- Opcode 78: warehouse item ID; consumer giảm số lượng trong storage và cộng tiền khi stack hết.
- CI run `42994477192` PASS: Vite build, generator checks, JS protocol tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa áp dụng authoritative inventory/economy; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B5 — S2C opcode 23: inventory/equipment context variants

- **Trạng thái: Một phần (5 nhánh decode + consumer trace + synthetic tests + CI PASS).**
- Subtype 0: byte list; subtype 1: category byte + list item ID + optional mode default 2; subtype 2: partial item records; subtype 3: không có payload, lấy catalog tĩnh; subtype 4: byte list + hai trailer bytes để mở shop tabs.
- Giữ đúng signed count/short, unsigned item bytes, quy tắc cộng 256 cho raw short âm ở subtype 2; không tự suy diễn các trường catalog.
- CI run `42994967419` PASS: Vite build, generator consistency, JS protocol tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa apply inventory/UI state và chưa có BE; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B16 — S2C opcode 25: static item/shop catalog

- **Trạng thái: Một phần (cấu trúc catalog decode + bytecode verification + synthetic tests + CI PASS).**
- Parse lookup `ck`, coordinate `cw`, 5 config bytes, indexed `br` definitions (five bytes + short + 10 shorts + int + 2 bytes + 2 shorts), signed `bd` list và unsigned `bd` list.
- Bytecode xác nhận `bd.o` của cả hai danh sách được gán trên instance giữ lại; per-definition exception boundary được giữ trong decoder. Các trường chưa có semantic rõ ràng vẫn dùng tên trung tính.
- CI run `42995767130` PASS: Vite build, generator consistency, JS tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa kết nối catalog với UI giao dịch/BE; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B5/B16 — S2C opcode 26: world resource bundle

- **Trạng thái: Một phần (decoder + fallback semantics + tests + CI PASS).**
- Giải mã template count, primary blob, effect blob list, indexed image/graphics blobs, cặp mảng cấu hình 4 byte và ba cặp byte-array có độ dài động.
- Các nhóm optional giữ đúng catch boundary và fallback array của client gốc; blob chính vẫn strict. Payload/ID giữ opaque, chưa diễn giải format ảnh/ý nghĩa gameplay.
- CI run `43173158542` PASS: Vite build, generator consistency, JS protocol tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa áp dụng dữ liệu tài nguyên vào runtime Phaser; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes 2 and 22: server metadata / entity auxiliary update

- **Trạng thái: Một phần (3 nhánh opcode 2 + opcode 22 + Java/JS tests + CI PASS).**
- Opcode 2: prefix `2` → danh sách lựa chọn có label/value/description; prefix `3` → provider/agent; còn lại là thông báo server.
- Opcode 22: hai short, một byte, một short, một int và byte optional mặc định 0.
- CI run `43173158542` PASS; cùng run xác nhận generator consistency, Vite build, JS tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa triển khai điều hướng UI hoặc mutate world state; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -5, 35, 37, 38, 39 and 64

- **Trạng thái: Một phần (skill grid + chat/dialog/notice/SMS + skill-record decoders + CI PASS).**
- Opcode 35: giải mã đầy đủ các bảng `ic` theo kích thước cố định 15×11 và 5 mảng byte bổ sung; giữ đúng signed/unsigned và phép nhân 100 của bảng thứ hai.
- Opcode 64: danh sách record gồm 2 byte + 3 short. Opcode -5: danh sách sender/message. Opcode 37/38/39: dialog, world notice và kết quả đăng ký SMS.
- CI run `43173647371` PASS: Vite build, generator consistency, JS tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa áp dụng skill progression/chat/UI side effects; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B16 — S2C opcodes -8, -9, -10, -11, -12, -17, -18, -19 and -20

- **Trạng thái: Một phần (resource/social/ranking result decoders + Java/JS tests + CI PASS).**
- -8: blob tài nguyên theo subtype, gồm nested groups; -9: list short + message; -10: ID + message; -11: confirmation có nhánh conditional; -12: social/guild record có 3 long; -17: announcement list; -18: guild chat; -19: ranking type 5 có record typed, loại khác giữ opaque; -20: currency reward int.
- CI run `43174297049` PASS: Vite build, generator consistency, JS tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa thực thi UI prompt/chat/ranking/economy side effects; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B16/B10 — S2C opcode -22: pet equipment context

- **Trạng thái: Một phần (2 packet variants + full/compact item records + CI PASS).**
- Nhánh subtype 0: pet header, full item list, 5 short pet stats và UTF tùy chọn. Nhánh khác: compact item list, frame count và raw image bytes; count âm trả nhánh "chưa có thông tin".
- Bytecode/class `bo` xác nhận appearance arrays dài 10/3/15; compact item có thêm 2 short. CI run `43174961636` PASS.
- Chưa mutate pet/inventory state hoặc render ảnh; không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B16 — S2C opcode 105: multi-level lookup tables

- **Trạng thái: Một phần (3 nhóm bảng lồng nhau + Java/JS tests + CI PASS).**
- Giải mã row width signed byte, nhóm 1 gồm group/entry counts và mỗi entry có width×3 short cùng UTF label mỗi 3 short; nhóm 2 có width short + short cuối; nhóm 3 lặp lại cấu trúc width×3 + label.
- Map dữ liệu theo đích nguồn `ku.ab/aa`, `mj.aM/aL`, `ku.Y/Z`, không suy đoán ý nghĩa gameplay. CI run `43175388107` PASS.
- Không tăng % tổng dự án do chưa tính lại trọng số WBS.


### B16 — S2C opcodes -27 and -43: portrait / world sprite resources

- **Trạng thái: Một phần (portrait image pair + sprite image bundle + CI PASS).**
- -27: target selector, image subtype, 2 blob có length short và 2 metadata byte; subtype -1 không có image payload.
- -43: image count signed byte, các blob length int có catch riêng, tiếp theo là object descriptors; tọa độ raw signed byte và tọa độ nhân 16.
- CI run `43175923692` PASS: Vite build, generator consistency, JS tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa render ảnh hoặc cập nhật character/world state; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -38, -39 and -42

- **Trạng thái: Một phần (world entity marker/counter/pair-map decoders + CI PASS).**
- -38: boolean + signed-byte count + record hai short/hai UTF; -39: byte + short entity ID + int; -42: context short + các cặp signed byte, kiểm tra payload lẻ.
- CI run `43176262933` PASS: Vite build, generator consistency, JS tests, Java 21 compile/smoke và original-JAR analysis.
- Chưa mutate world entity state; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -33, -37, -50, -52 and -59

- **Trạng thái: Một phần (world marker, quest result, world context/NPC payload decoders + CI PASS).**
- -33: tọa độ marker và map ID; giữ raw byte và đổi pixel ×16.
- -37: ba subtype kết quả nhiệm vụ và hai dạng thông báo.
- -50: nhãn world, sáu short và hai byte.
- -52: context + danh sách lựa chọn + selected index + mode tùy chọn.
- -59: batch NPC/world records, gồm tên, dữ liệu số, flags và tọa độ ×16.
- CI run `43178823238` PASS. Chưa mutate world/quest/UI state; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -46, -47 and -48: resource transfer variants

- **Trạng thái: Một phần (3 nhánh resource transfer + tests + CI PASS).**
- -46: hai nhánh panel/resource payload.
- -47: resource slot + flag + blob length + blob.
- -48: targeted blob hoặc broadcast payload.
- CI run `43178993630` PASS. Chưa decode ảnh hoặc cập nhật runtime resource; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -49 and -51: animation/image asset variants

- **Trạng thái: Một phần (animation asset variants + image refresh decoder + tests + CI PASS).**
- -49: animation timing/offset branch hoặc image + descriptor/frame data branch.
- -51: resource ID + opaque image bytes.
- CI run `43179606039` PASS. Chưa apply runtime animation/image assets; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -56 and -57: companion state and sprite data

- **Trạng thái: Một phần (companion record/state/sprite decoders + CI PASS).**
- -56: hai danh sách record ID/label/flags.
- -57: trạng thái companion hoặc image + ba nhóm frame tuple 4 byte.
- CI run `43179931960` PASS. Chưa apply companion/world state và chưa render sprite; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -55, -60 and -61: world object and notice packets

- **Trạng thái: Một phần (world object batch, notice and event marker decoders + CI PASS).**
- -55: danh sách world object records; -60: UTF notice; -61: event marker scalar fields và optional byte.
- CI run `43180272168` PASS. Chưa mutate world state/UI; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -62 and -63: lucky-box / grid-selection data

- **Trạng thái: Một phần (lucky-box result variants + grid-selection value list + CI PASS).**
- -62: 3 nhánh kết quả; -63: danh sách byte values của grid 10×10.
- CI run `43180593196` PASS. Chưa thực hiện giao dịch/reward hoặc chọn ô; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes -65, -41 and 58: world event tuples

- **Trạng thái: Một phần (world event tuple decoders + signed-short ID list + CI PASS).**
- -65 và -41: các tuple short/byte; 58: danh sách short ID.
- CI run `43180797637` PASS. Chưa áp dụng vào world state; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcode 13: server character-selection roster

- **Trạng thái: Một phần (roster decoder + optional resource payload + supplemental data + CI PASS).**
- Giải mã danh sách nhân vật server và nhánh thông báo lỗi; giữ opaque resources, không thay thế local roster.
- CI run `43181035721` PASS. Chưa tích hợp server/BE; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcode 15: shop catalog variants

- **Trạng thái: Một phần (2 shop catalog layouts + item/subrecord decode + CI PASS).**
- Mode 0: full items + subrecords + optional text/auxiliary object; mode khác 0: compact items + image/frame payload.
- CI run `43181452453` PASS. Chưa xử lý giao dịch/stock/tiền hoặc UI; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcode 100: resource slot metadata

- **Trạng thái: Một phần (resource image/metadata decoder + optional blob + CI PASS).**
- Subtype 0: image bytes, label, scalar metadata và blob tùy mode; subtype khác giữ phần còn lại.
- CI run `43181677911` PASS. Chưa cập nhật resource runtime; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes 106 and 83: multi-target combat / target group

- **Trạng thái: Một phần (multi-target combat decoder + entity-existence guarded group update + CI PASS).**
- -106: damage/effect header + target ID/value list; 83: source ID/action và chỉ parse phần target khi entity còn tồn tại.
- CI run `43182096267` PASS. Chưa apply HP/damage/effect; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B16 — S2C opcodes 10 and 87: world scalar/activity panel

- **Trạng thái: Một phần (world scalar tuple + activity panel variants + CI PASS).**
- -10: hai short + hai int; 87: mode 0 danh sách record và options, mode 1 danh sách byte.
- CI run `43182301153` PASS. Chưa apply world/activity UI; không tăng % tổng dự án khi chưa tính lại trọng số WBS.


### B5 — S2C opcodes 86 and 95: temporary status / inventory context event

- **Trạng thái: Một phần (wire decoder + consumer trace + synthetic tests + CI PASS).**
- Opcode 86: mode 0 clear; mode 1 status index = signed byte - 1, duration cố định 1440, UTF text; mode 2 status index = signed byte - 1, duration i32, UTF text. Timestamp do client gán khi nhận packet, không nằm trên wire.
- Opcode 95: hai short + một byte; consumer trong `mj.java` đối chiếu inventory, type 0 tìm/xóa item `bo`, các type còn lại tìm/xóa item `de`; có nhánh cảnh báo item đã ở trong inventory. Decoder không thực hiện mutation.
- CI run `43186990152` PASS: Vite build, generated-code consistency, JS protocol tests, Java 21 compile/smoke và original-JAR analysis.
- Không tăng % tổng dự án khi chưa tính lại trọng số toàn WBS; BE vẫn chưa bắt đầu.


### B5 — S2C opcodes 65–71 and -34: entity state / trade / storage / refinement

- **Trạng thái: Một phần (wire decoders + consumer trace + synthetic tests + CI PASS).**
- Opcode 65: cập nhật cờ trạng thái entity.
- Opcode 66: các mode giao dịch: request, busy, nhánh có player ID, mode 2 có phần payload opaque và các callback không payload.
- Opcode 67: cập nhật trade flag và short state cho nhân vật/entity.
- Opcode 68: C2S deposit itemId i16; S2C result itemId i16 moves `z.bx` → `z.bA`. Opcode 69: C2S withdraw itemId i16; S2C result itemId i16 moves `z.bA` → `z.bx`. C2S 70 is empty storage refresh request; no S2C 70 handler identified.
- Opcode 71/-34: payload mở hai nhánh context luyện đồ; giữ nguyên optional byte default 0.
- CI run `43187383635` PASS: Vite build, generated consistency, JS protocol suites, Java 21 compile/smoke và original-JAR analysis.
- Decoder chưa thực thi side effect hoặc transaction authoritative; không tăng % tổng dự án khi chưa tái tính trọng số WBS. BE vẫn deferred.


### B7 — S2C opcodes 73 and 76: material / equipment list decoders

- **Trạng thái: Một phần (source-backed Java/JavaScript decoders + schema + synthetic tests + CI PASS).**
- Opcode 73: signed-short count; mỗi record gồm item ID, material/category, quantity (3 short); selector cuối packet chọn `ca.N` hoặc `ca.O`.
- Opcode 76: signed-byte count; mỗi record gồm item ID (short), equipment slot/category (byte), value/count (short); consumer thay `ca.P`.
- Đã cập nhật `protocol/protocol.yaml`, generator expectation, Java/JavaScript templates, JS test vectors và tài liệu `protocol-inventory-trade.md`.
- CI run `43188123419` PASS cho material/equipment decoder; run `43188530604` PASS cho combined world-state validation.
- Decoder chỉ parse payload, không tự mutation inventory/equipment hoặc refresh UI. Không đánh dấu B7 hoàn thành vì purchase/use/equip/unequip/upgrade/warehouse và transaction semantics còn mở.


### B7/B10 — S2C opcodes 62, 73, 76 and 80: catalog / materials / equipment / refinement matrix

- **Trạng thái: Một phần (Java/JavaScript decoder + source trace + tests + CI validate PASS).**
- Opcode 62: collection/catalog records, nested item pairs, mode-3 long field và pagination; mode -1 đóng panel.
- Opcode 73: danh sách material recipe/list; opcode 76: danh sách gear/equipment.
- Opcode 80: bốn mảng cấu hình song song. `oy.java` xác nhận mảng đầu là option IDs hiển thị menu luyện đồ; `oz.java` dùng mảng thứ tư để kiểm tra tiền trước khi đi tiếp. Hai cột còn lại chưa gán nghĩa.
- CI run `43188530604` validate PASS; original-JAR analysis PASS. CI run `43188123419` cũng xác nhận material/equipment decoder.
- Không thực thi mutation kinh tế/inventory hoặc refinement server-side; không tăng % tổng dự án khi chưa tính lại trọng số WBS. BE vẫn deferred.


### B5/B7/B10 — S2C opcodes 62, 73, 76, 80 and 82

- **Trạng thái: Một phần (wire decoders + source consumer trace + JS/Java tests + CI validate PASS).**
- Opcode 62: collection/catalog group, nested item records and pagination; mode -1 closes the panel.
- Opcode 73/76: material list and equipment/gear list.
- Opcode 80: refinement option/cost matrix; first column maps menu option IDs, fourth is checked against character currency.
- Opcode 82: conditional counter update; parser takes explicit caller-state guard and does not consume payload when the source handler would skip its read.
- CI `43188123419` passed material/equipment tests; CI `43188530604` passed the combined world-state codec and Java 21 smoke suite.
- These remain protocol parsers, not server-authoritative game systems. Do not increase weighted project percentage without recalculating all 118 WBS tasks.


### B7 — C2S opcode 62 collection action variants

- **Trạng thái: Một phần (schema nguồn đã thêm; Java/JS codegen và CI đang triển khai).**
- Đã xác định 7 mode được writer trong `jy.java` thực sự gửi: 0, 2, 3, 4, 5, 6, 7; field order/type được giữ đúng source. Mode 1 không có writer branch trong phần đã kiểm tra nên không tự tạo.
- Các field giữ tên trung tính, không gán ý nghĩa nghiệp vụ khi chưa truy được callsite/handler đầy đủ.


### B7 — C2S opcode 62 collection action variants

- **Trạng thái: Một phần (source-backed schema + Java/JS codegen + round-trip tests + CI PASS).**
- Bảy mode đã xác minh trong `jy.java`: 0, 2, 3, 4, 5, 6, 7; generator sinh encoder/decoder, giữ nguyên field order và signed widths.
- Mode 1 không có writer branch được xác minh, vì vậy decoder bảo toàn payload chưa đọc cho mode không hỗ trợ và encoder từ chối mode lạ.
- CI run `43189624674` PASS: Vite build, generated checks, protocol/transport/prefix/initialization/world-state tests, Java 21 compile/smoke và original-JAR analysis.
- Không suy diễn semantics giao dịch hay gọi server; không tăng % tổng dự án trước khi tái tính WBS.


### B7 — C2S inventory / market command payloads

- **Trạng thái: Một phần (typed source-backed command schema + JS/Java tests; CI đang chạy).**
- Typed thêm C2S opcode 61, 68, 69, 78, 92, 95 và 100. Payload order/width theo writer trong jy.java; giữ tên field trung tính.
- Chưa thực hiện giao dịch, cập nhật inventory hay kiểm tra authoritative ở server.


### B7 — C2S inventory and market writer schemas

- **Trạng thái: Một phần (typed C2S command schemas + JS/Java round-trip/smoke tests + CI PASS).**
- C2S opcode 61, 68, 69, 78, 92, 95, 100 đã có payload schemas theo writer gốc; opcode 62 có 7 mode được generate riêng.
- CI run `43190442561` PASS. Đây là request serialization; server-authoritative purchase/sale/storage/persistence vẫn chưa triển khai.


### B7 — C2S opcode 94 market-panel modes

- **Trạng thái: Một phần (two-mode source-backed command codec + tests; CI PASS, xem mục validation bên dưới).**
- Mode 0: hai signed byte; mode 1: hai signed byte và một signed short, theo hai writer branch trong jy.java.
- Không gán nghĩa nghiệp vụ cho các positional args khi chưa truy đủ callsite/handler.


### B7 — C2S opcode 94 market-panel modes

- **Trạng thái: Một phần (source-backed command schema + generated Java/JS codec + tests + CI PASS).**
- Mode 0: hai signed byte; mode 1: hai signed byte và một signed short. Generator validate cả opcode 62 và 94, giữ unknown-mode payload chưa đọc và từ chối encode mode chưa xác minh.
- CI run `43191399012` PASS. Chưa có server-side transaction hoặc authoritative market state.


### B7 — C2S opcodes 48 and -25: use-item / equipment-upgrade request codecs

- **Trạng thái: Một phần (typed schema đã có; tăng cường JS vectors + Java 21 smoke assertions).**
- Opcode 48 `USE_ITEM`: signed 32-bit item ID; test thêm positive multi-byte value, negative value và missing-field validation.
- Opcode -25 `EQUIPMENT_UPGRADE_ACTION`: hai byte action + item ID; caller `xo` gửi action 10 (thăng cấp thường), `xp` gửi action 11 (giữ thuộc tính).
- Opcode 48 caller `xj → xg.a(bo)` xác minh action Sử dụng và điều kiện nghề/lớp/cấp ở client; opcode -25 caller `xo/xp` xác minh hai lựa chọn thăng cấp 10/11. Opcode -68 mới là họ request luyện đồ, có mode 1/2/3 và biến thể 5; payload chưa typed. Chỉ xác minh client writer/callsite, chưa suy diễn server acceptance, tiêu hao nguyên liệu/tiền hay mutation inventory.


### B7 — C2S opcodes 48 and -25: use-item / equipment-upgrade request codecs

- **Trạng thái: Một phần (typed schema đã có; bổ sung JS vectors + Java 21 smoke assertions; CI chờ kết quả cho commit mới).**
- Opcode 48 `USE_ITEM`: signed 32-bit item ID; test positive multi-byte value, negative value và missing-field validation.
- Opcode -25 `EQUIPMENT_UPGRADE_ACTION`: hai byte action + item ID; caller `xo` gửi action 10 (thăng cấp thường), `xp` gửi action 11 (giữ thuộc tính).
- Opcode 48 caller `xj → xg.a(bo)` xác minh action Sử dụng và điều kiện nghề/lớp/cấp ở client; opcode -25 caller `xo/xp` xác minh hai lựa chọn thăng cấp 10/11. Opcode -68 mới là họ request luyện đồ, có mode 1/2/3 và biến thể 5; payload chưa typed. Chỉ xác minh client writer/callsite, chưa suy diễn server acceptance, tiêu hao nguyên liệu/tiền hay mutation inventory.


### B7 — Corrected C2S item action mapping from CFR callers

- Artifact nguồn: `kpah-original-jar-analysis` của CI run 43195783681, CFR 0.152.
- Opcode 48: caller inventory `xj → xg.a(bo)`; nhãn “Sử dụng”, writer `jy.g(int)` ghi item ID i32.
- Opcode -25: caller `xo`/`xp` từ hai menu “Thăng cấp thường”/“Thăng cấp giữ thuộc tính”; writer `jy.a(int,int)` ghi action 10/11 và item ID byte. Sửa command name từ `REFINE_ITEM` thành `EQUIPMENT_UPGRADE_ACTION`.
- Opcode -68: writer `jy.a(short,int,int,int)` và caller `tx` thuộc luồng luyện đồ; có các mode 1/2/3 và nhánh 5 dài hơn. Đặt tên C2S `REFINEMENT_ACTION`, giữ payload opaque cho tới khi trace hết mode và response.
- Bổ sung JS/Java vectors cho action 11 và lookup opcode -68. Đã bổ sung typed codecs cho equip/drop và shop purchase item. CI run `43201997578` SUCCESS cho đợt đó; shop batch codecs được xác nhận riêng tại CI run `43403732922`. Không đánh dấu B7 hoàn thành hoặc tăng phần trăm WBS.


### B7/B10 — S2C refinement response dispatch

- CFR `ka.java:case-68` chuyển packet tới `mj.x(acu)`. Handler đọc result byte; result 0 reset luồng panel luyện đồ; result 4 đọc short + hai byte và chuyển cho callback của màn hình hiện tại.
- Đặt tên S2C opcode -68 là `REFINEMENT_RESULT`; giữ payload opaque vì nhánh result 4 phụ thuộc callback/UI contract. C2S -68 là `REFINEMENT_ACTION`, không nhầm với C2S -25 `EQUIPMENT_UPGRADE_ACTION`.
- Thêm assertion Java/JS tra cứu enum theo direction để tránh nhầm cùng opcode số âm giữa hai chiều. Chưa decode đầy đủ response hoặc xác minh mutation server.


### B7 — C2S equip and drop-equipped requests

- Opcode 86 `EQUIP_ITEM`: equipment panel `ca.P` gear list → `acm.a()` → `jy.b(int)`; payload one signed-short item ID.
- Opcode -21 `DROP_EQUIPPED_ITEM`: equipped-slot menu “Bỏ ra đất” → confirmation `yf.a()` → `jy.p(int)`; payload one signed-short equipment slot index. Đây là drop-to-ground, không phải unequip-to-bag.
- Bổ sung typed schema, JS round-trip và Java 21 smoke vectors. Unequip-to-bag, response handling và server-authoritative inventory/equipment mutation vẫn chưa xác minh.


### B7 — C2S shop purchase request families

- Opcode 85 `SHOP_PURCHASE_ITEM`: `abv`/`gt` sau xác nhận mua gọi `jy.c(itemId)`; payload một byte. S2C 85 `SHOP_PURCHASE_SUCCESS` hiển thị thông báo mua thành công.
- Opcode 74 `SHOP_PURCHASE_BATCH`: tab 10, `xg.p()` → `jy.a(Vector)`; signed-short total expanded quantity + lặp item ID signed short theo từng đơn vị. Đã có typed variable-list codec.
- Opcode 24 `SHOP_BATCH_ACTION`: `jy.b(Vector)` (`catalog`) và `jy.c(Vector)` (`category4_fixed`) có hai layout; đã có caller-selected codec, count u8; catalog có option byte khi category 3, layout còn lại ghi category 4 cố định. Không có discriminator trên wire.
- Chưa coi optimistic local updates là server-authoritative; transaction validation/persistence còn mở.


### B7 — CI PASS cho đợt source-trace item/equipment/shop

- CI run `43201997578` trên commit `515fb0d05a7686fecbf6e29d61495c60e03a5459` SUCCESS.
- Generated protocol checks, JavaScript protocol suites, Java 21 compile/smoke và original-JAR analysis đều PASS.
- Các request client-side đã source-trace: use item 48, equipment upgrade -25 (action 10/11), refinement action/result -68, equip 86, drop-equipped -21, shop purchase item 85, purchase batch 74 và batch action 24.
- Payload opcode 24/74 đã có typed codecs; response callback luyện đồ vẫn opaque. Unequip-to-bag, server transaction, authoritative inventory mutation và warehouse completion còn mở. Không tăng % tổng dự án.


### B7 — shop batch variable-list codecs (CI PASS)

- Opcode 24 `SHOP_BATCH_ACTION`: caller-selected variants `catalog`/`category4_fixed`; count unsigned byte; catalog record category/templateId/quantity=1/conditional optionByte for category 3; fixed category-4 record category=4/itemId/quantity.
- Opcode 74 `SHOP_PURCHASE_BATCH`: signed-short expanded total count and repeated signed-short item IDs; list representation expands each selected row by its quantity.
- Added generated JavaScript and Java codecs, explicit unknown-variant rejection, count bounds, JS round-trip tests and Java 21 smoke assertions. Source evidence: `jy.java:756-780`, `816-865`; `xg.java:3257-3265`.
- CI run `43403732922` trên commit `306ccd0e6c992a107c8ae3c7e80ed4fb70ef8223` SUCCESS: generated command-variant check, JS codec tests, Java 21 compile/smoke, Vite build và original-JAR analysis đều PASS. B7 chưa hoàn tất toàn bộ; weighted project progress giữ nguyên.


- CI xác nhận shop batch codecs: [run 43403732922](https://github.com/ThanhThanhV/kpah/actions/runs/43403732922), commit `306ccd0e6c992a107c8ae3c7e80ed4fb70ef8223`. Generated check, JS codec tests, Java 21 smoke và original-JAR analysis đều PASS.


### B7 — storage request/response trace (CI PASS)

- C2S 68 `STORAGE_DEPOSIT_ITEM` and S2C 68 `STORAGE_DEPOSIT_RESULT`: signed-short item ID; original-client handler moves the matching item from inventory `z.bx` into storage `z.bA`.
- C2S 69 `STORAGE_WITHDRAW_ITEM` and S2C 69 `STORAGE_WITHDRAW_RESULT`: signed-short item ID; original-client handler moves the matching item from storage `z.bA` back into inventory `z.bx`.
- C2S 70 `STORAGE_REFRESH`: empty payload, sent when closing tab 22. No S2C 70 handler was found; no response semantics inferred.
- Source: `aaa.java:15-20,35-40`; `jy.java:880-915`; `ka.java:252-260`; `mj.java:4562-4584`; `xg.java:3291-3293`; `dh.java:2097-2100`.
- CI run `43404517017` on commit `42637282a5489416aa41bb6377d96ce38a7305a4` SUCCESS: protocol codegen consistency, JS tests, Java 21 smoke, Vite build and original-JAR analysis. This validates codecs and mappings, not server persistence.


### B7 — item sale request/result (CI PASS)

- C2S 78 `SELL_ITEM`: `itemId` signed short + `sourceSelector` signed byte. Original UI confirmation sends 1 for `ca.O` and 0 for `ca.N` (`xg.java:3070-3101`, `acn.java:16-20`, `acp.java:16-20`; writer `jy.java:931-942`).
- S2C 78 `SELL_ITEM_RESULT`: signed-short item ID. Original handler `ka.java:1771-1774` calls `mj.h`, decrements the matching `ca.N` stack, removes it when quantity reaches zero, credits local template price `/5`, and displays sale success (`be.java:30-40`, `mj.java:4678-4688`).
- CI run `43404903857` on commit `62f6672cbc4e80b5934b06ad92d8434fe6cecf80` SUCCESS: generated protocol checks, JS payload tests, Java 21 smoke, Vite build and original-JAR analysis. Server-side validation/persistence remains unverified.

### B7 — NPC shop purchase + item drop trace (source verified; CI pending)

- C2S 85 `SHOP_PURCHASE_ITEM`: one-byte item/catalog value written by `jy.c(int)`; shop UI callers `abv` and `gt` send `bd.o` after purchase confirmation (`jy.java:207-214`; `abv.java:12-15`; `gt.java:12-15`).
- S2C 85 `SHOP_PURCHASE_SUCCESS`: empty payload. Dispatcher only displays a success notice and reads no response fields (`ka.java:195-197`). The protocol schema and generated JS/Java codecs now represent an empty payload.
- S2C 18 adds a picked-up ground item to inventory through `mj.a(characterId, item)` (`ka.java:1343-1355`; `mj.java:4311-4344`). This is a ground-pickup path; no source evidence connects it to NPC purchase.
- Inventory/currency update packet after NPC purchase remains unresolved. Do not infer from success notice, ground pickup, or the large S2C 3 character snapshot. No gameplay/WBS completion percentage awarded for source trace alone.
- C2S -21 drop-equipped-item is distinct from C2S 61 drop-inventory-item. Generic unequip-to-bag remains unverified.
- CI: latest run [43407904828](https://github.com/ThanhThanhV/kpah/actions/runs/43407904828) is queued/pending at the time of this update; do not mark PASS until completed.


### B16 — Opcode 16 initialization state reducer

- Thêm `src/protocol/initialization-state.js` tách việc parse packet khỏi việc áp dụng state; giữ currency kiểu bigint để không mất chính xác signed 64-bit.
- Mode 0 cập nhật currency và chỉ merge các resource index có trong packet; mode 1 thay thế inventory snapshot; mode 2 chỉ giữ collection thứ hai theo shared-state callback (`z.by`); mode 3 thay thế counter array. Các trường `aY/aZ` giữ tên trung tính; mode chưa biết được bỏ qua.
- Thêm `tools/test_initialization_state.mjs` và nối vào npm script + GitHub Actions. Test kiểm tra merge/replace, giữ nguyên state không liên quan, unknown mode no-op và reducer không mutate state cũ.
- Tài liệu ranh giới: reducer hiện chưa nối với socket transport, Phaser demo hoặc local-save; không tính đây là backend/server-authoritative state.
- Commits triển khai: `bb5a0af` (reducer), `8b7ef22` (test), `04dd482` (tài liệu), `db26818` (npm script), `5b6303c` (CI).


### B16 — Opcode 1 global initialization state

- Bổ sung `applyOpcode1` vào initialization state reducer. Lưu global config, skill catalog, profession slot counts/catalogs, stat labels, paired lookup rows, quest objectives, hai tile blobs theo runtime keys đã xác minh và part-data blobs.
- Binary payload được copy sang Uint8Array mới để state không bị thay đổi nếu decoder buffer bị tái sử dụng. Part-data parse error được giữ rõ ràng; không coi dữ liệu lỗi là hoàn chỉnh.
- Bổ sung `tools/test_opcode1_state.mjs`, npm script `test:opcode1-state` và bước GitHub Actions tương ứng.
- Giới hạn: chưa giải mã ngữ nghĩa binary tile/part, chưa gắn asset renderer và chưa tích hợp Phaser/socket. Không tăng trạng thái WBS lên Done.


### B16 — Opcode 3 character extension reducer

- Bổ sung parse-success flags vào generator template và generated JS decoder cho pairA, tripleB, tripleC, bf, groupD và groupE; giữ nguyên try/catch độc lập của wire parser.
- Thêm `applyOpcode3Extension`: lưu extension theo character id khi main header hoàn chỉnh; mỗi group chỉ cập nhật khi parse thành công; mapping chỉ cập nhật khi toàn bộ count/pairs/text hợp lệ; trailing bytes được copy.
- Thêm `tools/test_opcode3_extension_state.mjs`, npm script và GitHub Actions step.
- Giới hạn: đây chỉ là extension snapshot, không thay thế primary opcode 3 character snapshot; chưa gán nghĩa gameplay cho field trung tính, chưa nối socket/Phaser/local-save.


### B16 — Opcode 15 state reducer

- Thêm `applyOpcode15` để lưu theo `targetCharacterId`.
- Subtype 0 cập nhật riêng `shopContext`, giữ item records, năm short values, optional sentinel fields và trailing bytes.
- Nonzero subtype cập nhật riêng `petEquipmentImage`, giữ item records, frame count, atlas layout code và binary image bytes nguyên trạng.
- Hai variant merge độc lập, không ghi đè lẫn nhau; reducer bỏ qua packet bị từ chối.
- Bổ sung test reducer, npm script, GitHub Actions và tài liệu.
- Giới hạn: chưa giải mã định dạng atlas, chưa diễn giải business fields và chưa nối reducer vào socket/Phaser.


### B16 — Unified initialization event reducer

- Thêm `applyOpcode3Snapshot` lưu fixed prefix của character snapshot theo characterId; copy actionMapping và trailing bytes.
- Gộp snapshot prefix và extension vào `charactersById[characterId]`, đồng thời giữ index chuyên biệt.
- Thêm `applyInitializationEvent` định tuyến tường minh cho opcode 1, opcode 3 snapshot, opcode 3 extension, opcode 15 và opcode 16.
- Event type phân biệt hai nhánh opcode 3; không tự suy đoán decoder từ payload. Unknown event là no-op.
- Bổ sung test routing và merge nhân vật; nối npm script và GitHub Actions.
- Giới hạn: đây là reducer event phía client, chưa phải packet dispatcher của transport; chưa nối socket, Phaser hoặc local-save.


### B16 — Inbound initialization frame adapter

- Thêm `applyInboundInitializationFrame`: giải mã một S2C frame hoàn chỉnh bằng transport codec hiện có, sau đó dispatch các opcode initialization đã có cả payload decoder và reducer (1, 3, 15, 16).
- Opcode 3: tách fixed prefix, chuyển phần trailing bytes sang extension decoder độc lập rồi merge hai event theo characterId.
- Trả về receive cursor tiếp theo; test encrypted stream liên tiếp chứng minh cursor tiếp tục qua ranh giới packet, không reset theo từng frame.
- Opcode chưa hỗ trợ được trả về `handled=false`, không đổi state; frame lỗi/strict payload lỗi được ném ra.
- Thêm test adapter, npm script và GitHub Actions.
- Giới hạn: chưa có TCP socket reader, partial-frame buffer, handshake production, Phaser bridge hoặc local-save. Caller phải cung cấp từng frame đầy đủ và tự duy trì key/cursor.


### B16 — Incremental S2C TCP frame stream decoder

- Thêm `ServerFrameStreamDecoder` nhận TCP chunks bất kỳ, buffer header/body chưa đủ và tách nhiều frame ghép trong cùng một lần đọc.
- Hỗ trợ short header và encrypted long header theo framing đã reverse-engineer; giữ receive XOR cursor liên tục qua các packet.
- Có `maxFrames` để dừng sau frame handshake cleartext `-40`, cho phép caller cài key rồi mới parse phần encrypted đang buffer.
- Thêm test split chunks, coalesced frames, long header, cursor continuity, handshake key switch và frame size guard; nối npm + CI.
- Giới hạn: chưa mở TCP socket, chưa có connection lifecycle/send queue/timeout, chưa nối stream decoder với initialization adapter/Phaser trong app.


### B16 — Compose stream frames with initialization state

- Bổ sung `applyInboundInitializationPacket` nhận frame đã decode trực tiếp từ `ServerFrameStreamDecoder`, tránh decode/re-encode frame lần hai.
- Giữ `applyInboundInitializationFrame` làm wrapper cho một frame hoàn chỉnh.
- Thêm integration test stream chunk → decoded frame → opcode 16 reducer; cập nhật tài liệu pipeline.
- Vẫn chưa kết nối TCP socket thực, Phaser runtime hoặc local-save.


### B16 — Protocol session and handshake over binary transport

- Thêm `KpahProtocolSession`: nhận WebSocket-compatible binary transport (hoặc adapter tương đương), quản lý connection callbacks và message ordering.
- Nhận S2C `-40` cleartext, decode prefix-XOR key, cài receive key và gửi C2S `-40` ACK rỗng đã mã hóa.
- Xử lý trường hợp handshake và encrypted frame cùng nằm trong một message; duy trì send/receive XOR cursor độc lập.
- Cung cấp `sendPacket(opcode, payload)`, không tự gửi login hoặc tự tạo credential; route opcode 1/3/15/16 vào state reducers, opcode khác được chuyển cho callback thô.
- Thêm fake-transport test, npm script, CI và tài liệu.
- Giới hạn: browser cần TCP-to-WebSocket bridge riêng; chưa triển khai bridge, endpoint production, auth flow, reconnect/heartbeat hay Phaser binding.


### B16 — Local TCP ↔ WebSocket bridge

- Thêm `tools/kpah-tcp-ws-bridge.mjs`: WebSocket endpoint `/kpah` bind loopback, mở raw TCP outbound tới upstream host/port do người chạy chỉ định.
- Chuyển tiếp binary bytes nguyên trạng hai chiều; không giải mã/re-encode packet, không can thiệp XOR handshake để giữ `KpahProtocolSession` làm chủ protocol.
- Kiểm soát exact Origin allowlist, binary-only, payload cap, max connections, TCP timeout/keepalive và backpressure; có health endpoint không chứa thông tin nhạy cảm.
- Thêm integration test bằng TCP echo fixture + WebSocket client; bổ sung npm dependency `ws`, script và CI.
- Giới hạn: bridge chỉ bind loopback; không cấu hình production endpoint, không giả lập server, không có authentication proxy hoặc triển khai gateway internet-facing.


### B16 — Browser UI kết nối local protocol bridge

- Thêm nút **Kết nối protocol** trên topbar và panel quản lý WebSocket session.
- URL bị giới hạn `ws://` + loopback + path `/kpah`; không cho nhập host Internet hoặc nhúng username/password.
- Panel hiển thị trạng thái WebSocket/handshake, số packet nhận và tóm tắt state initialization; không gửi login packet.
- Session tiếp tục chạy khi đóng panel; người dùng phải chủ động nhấn Ngắt kết nối để đóng.
- Thêm URL guard test, npm script và GitHub Actions; cập nhật README hướng dẫn chạy bridge/client.
- Giới hạn: chưa có TCP endpoint production; không xác nhận login/gameplay. UI hiện chỉ là công cụ kết nối transport và quan sát packet/state đã hỗ trợ.


### B16 — Nhận world-state S2C vào client protocol state

- Thêm `src/protocol/world-state.js`: reducer cho S2C opcode 4 (spawn/update), 5 (snapshot có guard entity tồn tại), 8 (remove), 6/9 (combat event trung tính).
- Entity được lưu theo wire entity ID; giữ nguyên kind/template/state và các trường chưa rõ nghĩa, không tự gán thành monster/player nếu chưa có mapping.
- Opcode 5 chỉ decode body đầy đủ khi opcode 4 đã tạo entity tương ứng; nếu chưa có thì giữ phần payload còn lại dưới dạng opaque bytes, đúng guard của original handler.
- Kết nối `KpahProtocolSession` để route các packet world-state vào `state.serverWorld`; thêm test reducer và CI.
- Giới hạn: chưa map template ID sang sprite/animation, chưa nội suy movement, chưa xác định local player hoặc áp dụng combat event lên HP/UI Phaser.


### B16 — Phaser diagnostic projection of inbound server entities

- Browser connection panel emits the latest reduced protocol state to the game scene.
- Phaser maintains diagnostic markers keyed by wire entity ID and updates/removes them as opcode 4/5/8 state changes.
- Projection uses source-backed entity kind/template identifiers and latest known X/Y; it does not assign an original sprite or animation.
- A dedicated projection test and CI step verify entity ordering, inactive/invalid-coordinate filtering and opcode 5 coordinate precedence.
- Remaining: verified template-to-asset catalog, original frame/animation definitions, template-specific interpolation speed, local-player identity, combat event presentation and local-save integration.


### B16 — Original entity template catalog and asset request pipeline

- Traced the mj entity factory: verified class branches for kinds 0/1/3/4/6/7/14 and template-specific special cases for kind 1.
- Traced ku.T / cg: template metadata fields, 9-byte config mapping, movement step, frame dimensions, offsets, request type and resource ID.
- Added S2C opcode 100 decoder and reducer for template catalog metadata.
- Added exact C2S opcode -47 asset-request encoder (request type, resource ID, template ID).
- Browser panel requests each referenced template asset once; S2C opcode -47 payloads are retained only for catalog entries already known, matching the original dispatcher guard.
- Phaser diagnostic labels now show template name and frame dimensions when available.
- Added test coverage and CI step for opcode 100 metadata, signed offsets, C2S -47 request bytes, S2C -47 response payload and template-aware projection.
- Remaining: decode the ba packed resource archive in browser, handle special bj payload variants, compose <resourceId>_h + data PNG bytes, implement vertical frame slicing and the original cd.c[templateType][direction][state] mapping, then replace diagnostic markers with original sprite animations.


### B16 — Decode common template image and render original idle sprites

- Ported original ba packed-resource archive parsing: indexed names, signed name length, unsigned-short resource lengths, per-name XOR reset and continuous payload XOR with NguyenVanMinh.
- Ported cg common image branch: resolve <resourceId>_h and data, concatenate and recognize PNG payloads; keep special bj branches opaque.
- Ported the exact cd.c[templateType][direction][animationState] frame-index table.
- Phaser now converts common template image responses into vertical spritesheets and renders the original idle frame for generic cd entities; uses opcode 100 frame dimensions and frame offsets.
- Render fallback remains diagnostic marker for specialized entity classes and special asset formats.
- Remaining: facing/direction source mapping, moving/attack/death frame state mapping, tick-accurate frame timing, template-specific interpolation, shadow assets, and renderers for specialized classes.


### B16 — Source-based generic cd movement interpolation

- Corrected opcode 5: original handler resolves through mj.b(short), which only returns kind-0 z player actors; kind-1 monster snapshots are retained opaque instead of overwriting monster coordinates.
- For existing kind-1 entities, opcode 4 now preserves current coordinates and records target M/N only when original cd.L (spawn extra int) is non-negative.
- Added a pure cd.y() movement tick: source template step, X-first then Y, original snap thresholds, facing direction and 0/1 walk frame-state cycle.
- Phaser advances these server targets on a 40 ms accumulator and updates position/depth plus directional sprite frame.
- Added reducer and movement unit tests to CI.
- Remaining: Q() pauses from effects/status flags, random vertical target jitter for non-type-4 templates, kind-0 remote-player interpolation, special entity class renderers and action/death animation states.


### B16 — Server combat feedback projection (opcode 6/9)

- Preserve the separate opcode 6 and opcode 9 branches while adding verified aliases for attacker ID, target ID, damage and target HP-after-event.
- Apply target current HP immutably when the entity is already present in serverWorld.
- Add monotonic event sequence numbers so Phaser consumes each event once even when the rolling history is capped at 100.
- Phaser now renders the raw server damage number above the target entity and fades it upward; no crit/miss/element semantics are inferred from the other bytes.
- Extend existing world-state and projection tests; document the source-backed field mapping.
- Remaining: use verified max HP to render server HP bars, trace opcode 10/83/106 branches, map combat animation/effect resources, and implement specialized entity renderers. This is feedback presentation, not server-side battle simulation.

| 2026-11-13 | B6 | Bổ sung decoder và reducer browser cho S2C opcode 10/83/106; giữ opcode 10 neutral, tôn trọng source-entity guard opcode 83, cập nhật HP từng mục tiêu và phát multi-target combat event opcode 106; bổ sung test hồi quy | `9611dd6`, `d0892e2`, `318da2b`, `4f9c745`, `084b21c` | CI chờ xác nhận; chưa suy diễn semantics cho effect bytes hoặc hai integer của opcode 83 |
| 2026-11-13 | B6 | Nối multi-target combat event vào WorldScene: opcode 106 hiển thị damage nổi trên từng target record thay vì chỉ tìm một targetEntityId | `89764b7` | Chỉ dùng target IDs/damage/HP đã decode; effect bytes vẫn opaque |
| 2026-11-13 | B6 | Thêm schema/decoder và reducer S2C opcode -74; attach timed effect theo đúng entity ID + kind, giữ duration/flags thô và subcommand chưa hỗ trợ dạng opaque; bổ sung regression tests | `0568c54`, `e3e842b`, `632caf0`, `c6d82bb`, `d6bc631` | Chưa triển khai đồng hồ expiry, phân loại buff/debuff hoặc hiệu ứng hình ảnh; opcode -71/-73 còn discovery |
| 2026-11-13 | B6 | Thêm schema/decoder/reducer S2C opcode -71; action 1 + mode 0 thêm/refresh effect, mode 1 đặt expiry về 0; giữ BigInt expiry và kiểm tra entity ID + kind; bổ sung regression tests | `eb3faea`, `55d03fe`, `f348d5b`, `dcd74d8`, `76d53fa` | Các action/mode khác giữ neutral; chưa triển khai effect sprite, stat modifier hay client expiry scheduling |

| 2026-11-13 | B6 | Trace và triển khai S2C opcode -73 theo hai nhánh source-backed: branch 0 liên kết effect object kind 12 với danh sách target; branch 1 thêm/refresh visual overlay theo entity ID + effect ID, giữ BigInt expiry; thêm decoder, reducer, schema, docs và regression tests | `43446885047` SUCCESS; commit `2deb521` bổ sung tên field chính xác | Branch 0 chưa mô phỏng chuyển động actor loại 12; branch 1 đã render overlay. Các branch khác vẫn opaque |

| 2026-11-13 | B6/C4 | Trace và nối resource pipeline visual effect: opcode 26 giữ effect definition bytes; C2S -51 request ảnh theo signed-short resource ID; S2C -51 lưu image bytes; connection panel tự request một lần cho overlay đang active khi definition đã có; thêm regression tests | `43446885047` SUCCESS | Đã có parser frame/atlas và Phaser renderer ở các mục dưới; chưa mô phỏng actor loại 12 branch-0 |

| 2026-11-13 | B6/C4 | Port parser cho effect definition theo d.a(byte[]): region atlas, frame parts, frame sequence và auxiliary arrays; giữ riêng hai nhóm part theo group flag, validate length/count và lưu parsed definitions song song bytes gốc; thêm regression fixture | `43446885047` SUCCESS | Renderer đã nối; auxiliary flip flag và thứ tự depth chưa được xác minh đầy đủ |

| 2026-11-13 | B6/C4 | Port playback cursor của class d: mode loop (-1), once (0), until absolute expiry (long); advance tương ứng từng lần d.a(); resolve frame parts sang atlas crop rectangles, giữ tick cadence cho scene caller | `43446885047` SUCCESS | Tick 40 ms được nối ở Phaser; auxiliary flip flag và thứ tự depth chưa được xác minh đầy đủ |

| 2026-11-13 | B6/C4 | Nối effect playback vào Phaser: decode image bytes theo MIME header, compose texture cho từng frame từ atlas crop, render tại tọa độ entity; advance playback theo tick 40 ms được trace từ km.run → world update → bu.R → d.a; cleanup view/texture khi effect/entity kết thúc | `43446885047` SUCCESS | Chưa xác minh auxiliary flip flag/thứ tự depth với mọi effect; branch-0 target-linked actor renderer chưa triển khai |
| 2026-11-13 | B6 | Trace sâu opcode -73 branch 0 qua `mj.A` → `hz.a(Vector,...)` → `hz.b()`; xác định source entity ID trỏ tới actor kind 12 riêng trong `mj.o`, hai int target record lần lượt là số sát thương hiển thị và HP hiện tại được gán qua `bu.f(int)`; tách target-linked event khỏi entity map và đổi field thành `damageValue` + `targetCurrentHp` | `2deb521`; CI `43446885047` SUCCESS | Chưa giải mã catalog `i`/ảnh resource của actor kind 12, chưa có actor registry riêng; source actor di chuyển tới target đầu tiên rồi mới áp dụng toàn bộ target records sau 7 update ticks |

| 2026-11-13 | B6/C4 | Phân biệt hai indexed catalog opcode 26 theo `ka.case 26`: `indexedImages` → class `i`/actor `hz.dj`; `indexedGraphics` → class `d`/overlay `d.i`; thêm parser riêng cho actor regions/parts/frame offsets/8 animation sequences/optional arrays, bảng 3x14 frame-sequence selector và reducer lưu raw + parsed actor definitions; thêm regression fixture | Đang chờ CI | Chưa triển khai actor registry, state machine/movement, target impact timing hoặc renderer; auxiliary part fields giữ nguyên vì chưa có consumer xác minh |

| 2026-11-13 | B6/C4 | Nối request ảnh cho target-linked actor: derive resource ID theo đúng nhánh animation ID < 301 ? +8700 : +14100 từ hz.a(Graphics); tái sử dụng C2S -51 và dedupe resource ID; thêm test boundary signed-short | `43451924370` SUCCESS | Chưa render actor hoặc mô phỏng state machine; chỉ request ảnh khi actor catalog đã có |

| 2026-11-13 | B6/C4 | Port helper playback cho class `i/hz`: chọn animation sequence theo bảng 3×14 + state/direction, advance cursor từng actor update, chuyển state animation; resolve atlas crop/x/y và transform mirror 2 + vertical bob threshold -40 theo renderer gốc; bổ sung regression tests | `43452700053` SUCCESS | Chưa nối actor sprite vào Phaser; chưa mô phỏng state movement/impact hoặc source entity lifecycle |

| 2026-11-13 | B6 | Port subset state machine branch-0 class `hz`: source actor position + movement step `source.t()-1`, Manhattan threshold 30, move toward first target, wait 7 update ticks then emit one impact record containing all resolved target damage/HP values; sequence state 2/3 follows actor update cursor; regression test multi-target timing | `43454269664` SUCCESS | Phaser view/HP copy-on-write/post-impact state 4 → idle/return đã được nối ở các mục dưới; idle random roaming còn mở |

| 2026-11-13 | B6/C4 | Nối branch-0 actor `hz` vào Phaser: tải actor image riêng, compose texture từ atlas parts theo frame/direction/vertical offset; tạo playback theo event sequence, advance movement/impact 40ms, hiển thị floating damage cho toàn bộ target khi impact, áp targetCurrentHp vào local world projection theo `bu.f(int)` và cleanup actor view; thêm sequence ID ổn định cho event | `43455346658`, `43456282653` SUCCESS | Chưa render shadow `mj.V`, depth heuristic `y+2` chưa xác minh; post-impact lifecycle đã port một phần |

| 2026-11-13 | B6 | Thêm `applyTargetLinkedActorImpactToWorld`: copy-on-write cập nhật `currentHp` của các target từ `targetCurrentHp` đúng thời điểm actor impact, không mutate snapshot trước đó; Phaser gọi helper sau tick impact; thêm regression test | `43456282653` SUCCESS | Chưa cập nhật HP bar/animation UI riêng; server packet mới sẽ thay thế local projection |

| 2026-11-13 | B6/C4 | Đối chiếu lại `hz.V()` và `hz.c()`: chỉ đổi direction group khi actor di chuyển theo trục Y; horizontal movement giữ group hiện tại; transform 2 chỉ cho hướng X dương, vertical movement reset transform 0; sửa bob dD tăng 1 rồi giảm 3 mỗi tick di chuyển; bổ sung regression test hướng đi lên | `43457265309` SUCCESS | Post-impact state 4 → idle/return đã port; idle random roaming, shadow `mj.V` và depth chưa xác minh |

| 2026-11-13 | B6/C4 | Port tiếp lifecycle sau impact của actor `hz`: state 4 → idle khi source state 0; state 4 → return khi source state 1 và Manhattan distance > 40; giữ actor view đến khi source bị remove hoặc event mới cùng source thay thế theo `mj.o(sourceId)`; bổ sung regression test | `43458143886` SUCCESS | Idle random roaming chưa port; shadow `mj.V` và depth layering chưa xác minh |

| 2026-11-13 | B6/C4 | Trace opcode 15 mode 0 → `mj.a(l,z)` → `hz(z,l.S)`; tách actor animation ID (`auxiliary.fieldS`) khỏi target effect ID trong opcode -73; thêm registry actor theo source entity ID, liên kết event -73 đúng animation ID và request ảnh từ actor spawn; thêm regression test | Đang chờ CI | Chưa port chính xác offset khởi tạo theo `z.cO`, target overlay effect khi impact và kiểm tra actor spawn/remove theo chuỗi packet live |
