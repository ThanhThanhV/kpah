# Khí Phách Anh Hùng — Web recreation

Bản tái hiện client giao diện KPAH từ tài liệu tham chiếu `KPAH_278.jar` (MIDlet 1.5.9, MIDP 2.0 / CLDC 1.0).

## Chạy local

Yêu cầu Node.js và Python 3.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal. Build production bằng `npm run build`.

## Trích xuất tài nguyên gốc

Đặt `KPAH_278.jar` tại thư mục gốc repo (repo đã giữ file JAR tham chiếu), sau đó chạy:

```bash
npm run extract:assets
```

Hoặc chạy trực tiếp:

```bash
python tools/extract_kpah_jar.py KPAH_278.jar
```

Công cụ giữ nguyên các gói gốc và tạo:
- `public/assets/kpah-original/archive-manifest.json`: danh mục các entry và tài nguyên đã giải mã.
- `public/assets/kpah-original/decoded-sh/`: nội dung các gói giao diện, NPC, hiệu ứng.
- `public/assets/kpah-original/decoded-packed/`: nội dung các gói splash/preview `.wp`, `.wps`.

Sau khi trích xuất, chạy lại Vite và mở **Tài nguyên gốc** ở thanh bên để tìm kiếm, lọc theo gói và xem trước ảnh PNG. Nếu deploy lên hosting, phải đưa cả thư mục `public/assets/kpah-original/` vào bản build.

## Kiến trúc hiện tại

- Vite + JavaScript modules
- Phaser 3 cho vùng thế giới 2D và tương tác bản đồ
- HTML/CSS cho HUD, cửa sổ chức năng, chat và các màn hình UI
- Trình duyệt tài nguyên đọc manifest do extractor tạo; ảnh được hiển thị với nearest-neighbor/pixelated scaling
- Dữ liệu gameplay hiện tại vẫn là mock UI; chưa kết nối backend

## Trạng thái và giới hạn

Đây là nền tảng tái hiện client. Resource Viewer hiện chỉ duyệt và xem trước PNG đã giải mã; chưa tự suy luận animation, tilemap, collision hay mapping sprite. Các dữ liệu đó cần được phân tích và xác minh riêng từ bytecode/tài nguyên gốc. Giao thức và backend sẽ được thiết kế riêng sau khi thống nhất.


## Character preview

The character creation form loads the five verified `.wps` profession-preview packs from `archive-manifest.json`: `kiem` (Kiếm Khách), `daidao` (Chiến Binh), `phapsu` (Pháp Sư), `bua` (Đấu Sĩ), and `cung` (Cung Thủ). It displays the five original PNG entries per pack with nearest-neighbor scaling. These are profession preview images only; gender/hair composition and animation mapping remain unverified.


## Sprite inspection

Open **Tài nguyên gốc** and use the Sprite Sheet Inspector below the PNG browser. Select an extracted PNG, enter the number of rows and columns, set preview FPS, then step through or play the resulting frame grid. The grid is manually configured for inspection; it does not claim to know the original animation frame order or timing.
