# Cẩm Nang: Đóng Gói App Độc Lập & Thiết Lập Link Public Cố Định

Tài liệu này hướng dẫn chi tiết cách vận hành Smart Queue dưới dạng **App độc lập** và cấu hình **Link Public cố định** để công dân dùng điện thoại (4G/5G/WiFi) quét mã QR ở bất kỳ đâu.

---

## PHẦN 1: ĐÓNG GÓI THÀNH APP ĐỘC LẬP (CHẠY KHÔNG CẦN TRÌNH DUYỆT)

Smart Queue cung cấp 2 giải pháp đóng gói để bạn sử dụng ngay:

### Cách 1: Chạy 1-Click Desktop App (Khuyên dùng - Nhanh nhất trên Windows)
1. Trong thư mục dự án, tìm file: `SmartQueue-Desktop.bat`.
2. **Nhấp đúp chuột vào file `SmartQueue-Desktop.bat`**:
   - Hệ thống sẽ tự khởi chạy máy chủ SQLite ngầm.
   - Ứng dụng tự động bật lên trong cửa sổ Desktop độc lập (sử dụng Edge/Chrome App Mode).
   - Không có thanh gõ địa chỉ URL, không có tab thừa, có biểu tượng riêng trên thanh Taskbar như một phần mềm Windows cài đặt (.exe).

### Cách 2: Cài Đặt PWA Đa Nền Tảng (Windows, macOS, iPad, Android TV, Kiosk)
Smart Queue đã tích hợp chuẩn **Progressive Web App (PWA)**:
- **Trên máy tính Windows / macOS**:
  1. Mở hệ thống trên trình duyệt Google Chrome hoặc Microsoft Edge.
  2. Bấm nút **"Cài App Độc Lập"** (nằm ở góc trên thanh menu) hoặc bấm vào biểu tượng cài đặt (máy tính có mũi tên ⊕) ở thanh địa chỉ URL.
  3. Bấm **"Cài đặt" (Install)**: Smart Queue sẽ xuất hiện trên màn hình Desktop và menu Start.
- **Trên máy tính bảng hoặc Kiosk cảm ứng (Android/iPad)**:
  - Trên iPad (Safari): Bấm nút Share ➔ "Thêm vào Màn hình chính" (Add to Home Screen).
  - Trên Android: Bấm menu 3 chấm ➔ "Cài đặt ứng dụng".

---

## PHẦN 2: THIẾT LẬP LINK PUBLIC CỐ ĐỊNH CHO NGƯỜI DÂN QUÉT QR

Khi app chạy trên máy tính cơ quan (`localhost:3000`), điện thoại người dân quét QR sẽ **không thể truy cập được** nếu không có Link Public.

Giải pháp tối ưu và an toàn nhất là sử dụng **Cloudflare Tunnel**:
- Miễn phí 100%.
- Không cần mở cổng modem (Không cần NAT port / Port forwarding).
- Có chứng chỉ bảo mật HTTPS hợp lệ (trình duyệt không cảnh báo nguy hiểm).
- Vượt qua mọi tường lửa mạng cơ quan / Viettel / VNPT / FPT.

### Cách thiết lập nhanh (Quick Tunnel - 1 phút là có link):
1. Chạy file: `scripts\setup-cloudflare-tunnel.bat`.
2. Script sẽ tự động tải công cụ chính thức từ Cloudflare về thư mục `tools\`.
3. Màn hình console sẽ xuất hiện một đường link có dạng:
   ```
   https://random-name-xxxx.trycloudflare.com
   ```
4. Đăng nhập tài khoản Admin trên Smart Queue ➔ Vào tab **"Cài Đặt Hệ Thống & Public Link"** (Settings).
5. Dán đường link vừa nhận được vào ô **"Tên miền / URL Public Cố định"** và bấm **"Lưu Cấu Hình"**.
6. **XONG!** Từ lúc này, mọi phiếu in ra giấy, mã QR trên Kiosk và TV sảnh đều tự động chứa đường link public này. Người dân đứng ở bất kỳ đâu quét QR đều xem được số thứ tự và đánh giá cán bộ realtime.

---

### Cách thiết lập Tên Miền Riêng Cố Định Vĩnh Viễn (Ví dụ: `xephang.phuong10.gov.vn`):
Nếu đơn vị bạn sở hữu tên miền riêng và muốn link cố định mãi mãi:
1. Đăng ký tài khoản miễn phí trên [Cloudflare.com](https://dash.cloudflare.com) và trỏ DNS tên miền về Cloudflare.
2. Vào mục **Zero Trust** ➔ **Networks** ➔ **Tunnels** ➔ Chọn **Create a Tunnel**.
3. Đặt tên Tunnel (ví dụ: `smartqueue-ubnd`).
4. Chọn hệ điều hành **Windows** và copy lệnh cài đặt Service do Cloudflare cung cấp để chạy trên máy tính.
5. Trong phần **Public Hostname**:
   - Subdomain: `xephang`
   - Domain: `ten-mien-cua-ban.vn`
   - Type: `HTTP`
   - URL: `localhost:3000`
6. Nhập `https://xephang.ten-mien-cua-ban.vn` vào ô Public URL trong trang Quản trị Smart Queue.
Link này sẽ cố định vĩnh viễn dù máy tính đổi mạng WiFi hay khởi động lại.

---

## PHẦN 3: ĐÓNG GÓI BỘ CÀI ĐẶT ELECTRON (.EXE)

Nếu bạn muốn đóng gói thành file `.exe` cài đặt hoặc file nén zip phân phối cho các máy tính khác:

1. Chạy lệnh cài đặt Electron builder:
   ```bash
   npm install --save-dev electron electron-builder
   ```
2. Chạy thử nghiệm trong chế độ Desktop Dev:
   ```bash
   npm run electron:dev
   ```
3. Đóng gói ra file cài đặt Windows `.exe`:
   ```bash
   npm run electron:build
   ```
File cài đặt hoàn chỉnh sẽ nằm trong thư mục `dist_electron/`.
