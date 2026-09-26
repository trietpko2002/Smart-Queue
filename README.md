<div align="center">

<img src="public/icon.svg" width="128" height="128" alt="Smart Queue Logo" />

# 🎫 SMART QUEUE SYSTEM
### Hệ Thống Bốc Số & Quản Lý Hàng Đợi Thông Minh Đa Ngành

**Giải pháp chuyển đổi số toàn diện cho Hành chính công, Y tế, Ngân hàng, Bán lẻ và Dịch vụ**

<br/>

[![GitHub Stars](https://img.shields.io/badge/Stars-Give%20a%20⭐-yellow?style=for-the-badge&logo=github)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20PWA-informational?style=for-the-badge)](https://github.com)
[![Offline First](https://img.shields.io/badge/Operation-100%25%20Offline%20LAN-success?style=for-the-badge)](https://github.com)

<p align="center">
  <b>🇻🇳 Tiếng Việt</b> &nbsp;|&nbsp; <a href="./README_EN.md"><b>🇬🇧 English</b></a>
</p>

<p align="center">
  <a href="#-tổng-quan-dự-án">Tổng Quan</a> •
  <a href="#-các-phân-hệ-chính">Phân Hệ Cốt Lõi</a> •
  <a href="#-khởi-chạy-1-click-launcher-v50">Launcher v5.0</a> •
  <a href="#-kiến-trúc-hệ-thống">Kiến Trúc</a> •
  <a href="#-hướng-dẫn-cài-đặt">Cài Đặt</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-faq--troubleshooting">Hỗ Trợ</a>
</p>

---

</div>

<br/>

## 🎯 So Sánh: Hệ Thống Truyền Thống vs Smart Queue

| Tiêu chí | Hệ thống phần cứng truyền thống | 🎫 Smart Queue System |
| :--- | :--- | :--- |
| **Chi phí triển khai** | Hàng chục đến hàng trăm triệu (mua phần cứng chuyên dụng, bảng LED riêng) | **0 đồng phí bản quyền** — tận dụng máy tính, tablet, Smart TV có sẵn |
| **Cài đặt & Vận hành** | Phức tạp, cần kỹ sư cấu hình SQL Server, mạng dây RS485 | **1-Click khởi chạy** qua Launcher v5.0, SQLite WAL tự động không cần cài DB |
| **Âm thanh gọi số** | Giọng nhân tạo thô sơ hoặc bắt buộc thu âm từng số cố định | **Google TTS tiếng Việt chuẩn**, phát âm tự nhiên tên dịch vụ & số quầy |
| **Khách hàng theo dõi** | Phải ngồi cố định tại sảnh chờ nhìn bảng LED | **Quét QR bằng điện thoại (4G/5G)**, theo dõi số lượt chờ từ xa |
| **Ưu tiên phục vụ** | Bốc chung 1 luồng hoặc chia phím cơ cứng nhắc | **Tự động phân luồng Ưu tiên**: Người cao tuổi, Thai phụ, Khuyết tật, VIP |
| **Trí tuệ nhân tạo** | Không có | **Google Gemini AI Flash** phân tích tải, cảnh báo quá tải & điều phối quầy |
| **Khả năng mở rộng** | Giới hạn số cổng vật lý | Không giới hạn số quầy, số Kiosk, số màn hình TV trong mạng LAN/Cloud |

---

## 🌟 Tổng Quan Dự Án

**Smart Queue** là nền tảng quản trị hàng đợi thế hệ mới được thiết kế theo triết lý **"Zero-Config & All-in-One"**:

- 🏛️ **Cơ quan Hành chính công (Một cửa)**: UBND các cấp, Trung tâm Phục vụ Hành chính công, Công an giải quyết thủ tục CCCD/Hộ chiếu, Bộ phận Thuế, BHXH.
- 🏥 **Bệnh viện, Phòng khám & Y tế**: Tiếp đón phân luồng bệnh nhân, phòng khám chuyên khoa, xét nghiệm, chẩn đoán hình ảnh, cấp phát thuốc.
- 🏦 **Ngân hàng & Tổ chức Tài chính**: Giao dịch gửi/rút, tư vấn mở thẻ, dịch vụ tín dụng, quầy khách hàng doanh nghiệp & VIP.
- 🛒 **Bán lẻ, Dịch vụ & Trung tâm Bảo hành**: Siêu thị điện máy, cửa hàng viễn thông, showroom ô tô, trạm bảo dưỡng bảo hành.
- ✂️ **Thẩm mỹ, Spa & Salon**: Tiếp đón khách hàng theo lịch hẹn, tự động sắp xếp thứ tự ưu tiên chuyên viên.
- 🏫 **Trường Đại học & Giáo dục**: Phòng đào tạo, nộp hồ sơ xét tuyển, thư viện, bộ phận tài vụ sinh viên.

---

## ✨ Các Phân Hệ Chính

<div align="center">

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             6 PHÂN HỆ CỐT LÕI                                    │
├───────────────────┬───────────────────┬───────────────────┬──────────────────────┤
│ 🖥️ Kiosk Cảm Ứng   │ 📺 TV Display     │ 🧑‍💼 Staff Counter │ 👨‍💻 Admin Portal      │
│ Bốc số cảm ứng    │ Gọi số TV + TTS   │ Tiếp nhận & gọi   │ Quản trị & thống kê  │
├───────────────────┴───────────────────┼───────────────────┴──────────────────────┤
│ 📱 Citizen Portal (Web & 4G/5G)        │ 🤖 Gemini AI Smart Forecast              │
│ Tra cứu lượt & Đánh giá sao           │ Dự báo lưu lượng & Cảnh báo quá tải      │
└───────────────────────────────────────┴──────────────────────────────────────────┘
```

</div>

### 1. 🖥️ Kiosk Bốc Số Cảm Ứng (`/?mode=kiosk`)
- **Màn hình cảm ứng hiện đại**: Giao diện thẻ dịch vụ lớn, trực quan, độ trễ phản hồi tức thời.
- **Phân loại đối tượng Ưu tiên (Priority Matrix)**:
  - 👵 **Người cao tuổi** (tự động ưu tiên gọi trước)
  - 🤰 **Phụ nữ mang thai / có con nhỏ**
  - ♿ **Người khuyết tật**
  - ⭐ **Khách hàng VIP / Doanh nghiệp**
- **Bàn phím ảo tiếng Việt thông minh**: Tích hợp bộ gõ **Telex & VNI** ngay trên màn hình cảm ứng, người dân nhập Họ tên / CCCD / SĐT mà không cần bàn phím ngoài.
- **In phiếu số & Tải ảnh kỹ thuật số**: Kết nối máy in nhiệt POS khổ 80mm/58mm hoặc xuất mã QR điện tử lưu về điện thoại.

### 2. 📺 Màn Hình TV Sảnh Gọi Số (`/?mode=tv`)
- **Cập nhật tức thời qua Server-Sent Events (SSE)**: Không tải lại trang, không độ trễ.
- **Giọng đọc tiếng Việt tự nhiên (TTS)**: Đọc thông báo chuẩn:  
  *🔊 "Xin mời số phiếu [A105] đến quầy số [03] phục vụ..."*
- **Danh sách số đang phục vụ & Lượt chờ kế tiếp**: Phân màu tương phản cao, dễ quan sát từ khoảng cách 10m–20m.
- **Dải băng truyền thông & Banner thông báo**: Chạy thông điệp tuyên truyền của Đảng/Nhà nước, tin tức cơ quan, lịch nghỉ lễ, video giới thiệu đơn vị.

### 3. 🧑‍💼 Bàn Làm Việc Nhân Viên Quầy (`/?mode=staff`)
- **Thao tác 1-Click**:
  - `Gọi tiếp` (Call Next): Tự động tính toán điểm ưu tiên + thời gian xếp hàng để gọi lượt tối ưu.
  - `Gọi lại` (Recall): Phát lại âm thanh hiệu triệu trên TV sảnh.
  - `Phục vụ` (Serving): Bấm giờ thời gian tiếp nhận thực tế để đánh giá KPI cán bộ.
  - `Hoàn thành` (Complete): Kết thúc lượt, lưu trữ dữ liệu lịch sử và chuyển sang lượt mới.
  - `Vắng mặt` (No Show): Tự động chuyển trạng thái khách bỏ lượt sau số lần gọi quy định.
  - `Chuyển quầy` (Transfer): Chuyển tiếp phiếu sang quầy/dịch vụ liên đới mà không bắt khách bốc số lại từ đầu.
- **Linh hoạt cấu hình**: Cán bộ tự đổi quầy ngồi hoặc chọn các nhóm dịch vụ mình phụ trách.

### 4. 👨‍💻 Cổng Quản Trị Hệ Thống (`/?mode=admin`)
- **Quản lý Dịch vụ**: Thêm/sửa/xóa dịch vụ, cài đặt tiền tố mã số (`A`, `B`, `C`...), giới hạn số phiếu tối đa trong ngày, thời lượng phục vụ chuẩn.
- **Nạp mẫu dịch vụ 1-Click (Templates)**: Nạp ngay cây dịch vụ mẫu UBND cấp xã/phường, ngân hàng, hoặc phòng khám đa khoa.
- **Quản lý Quầy & Thiết bị**: Kiểm soát trạng thái mở/đóng của từng quầy, Kiosk và TV.
- **Báo cáo, Biểu đồ & Xuất CSV**: Biểu đồ phân bổ lượng khách theo khung giờ trong ngày, tỷ lệ hoàn thành/vắng mặt, xuất file báo cáo tương thích Excel (.csv).
- **Cài đặt Tên miền Public**: Dán URL Cloudflare Tunnel để tự động sinh mã QR 4G/5G.

### 5. 📱 Cổng Công Dân / Khách Hàng (`/?mode=citizen`)
- **Lấy số từ xa**: Khách hàng mở link trên điện thoại để lấy số trước khi tới điểm giao dịch.
- **Theo dõi tiến trình trực tiếp**: Biết chính xác còn bao nhiêu người phía trước và thời gian ước tính đến lượt mình.
- **Đánh giá chất lượng phục vụ**: Khách hàng chấm điểm 1–5 sao và gửi nhận xét góp ý ngay sau khi hoàn tất thủ tục.

### 6. 🤖 Trí Tuệ Nhân Tạo Dự Báo Lưu Lượng (`Google Gemini AI`)
- **Phân tích số liệu lịch sử**: Ứng dụng Gemini AI Flash dự báo nguy cơ quá tải theo từng khung giờ trong ngày.
- **Khuyến nghị điều phối**: Đưa ra gợi ý mở thêm quầy hoặc điều động nhân lực dự phòng.
- **Heuristic Engine Fallback**: Tự động chuyển sang mô hình thuật toán nội bộ nếu không có mạng Internet.

---

## 🚀 Khởi Chạy 1-Click: Launcher v5.0

> [!TIP]
> **Khuyên dùng cho Windows:** Chỉ cần nhấp đúp file **`SmartQueue_Launcher_v5.bat`** tại thư mục gốc. Hệ thống tự động làm mọi việc từ A đến Z!

```text
  ========================================================================
                          SMARTQUEUE DA SAN SANG
  ========================================================================

    [+] LOCAL:      http://localhost:3000
    [+] INTERNET:   https://lines-beef-mystery-headline.trycloudflare.com

    [*] LINK INTERNET DA DUOC TU DONG COPY VAO CLIPBOARD
  ========================================================================
```

### ⚙️ Cơ Chế Tự Động Hóa Của Launcher v5.0:
1. **Kiểm tra môi trường**: Tự động kiểm tra `Node.js`, `npm`, tự chạy `npm install` nếu chưa cài dependencies.
2. **Khởi tạo môi trường**: Tự động tạo `.env.local` nếu thiếu.
3. **Giải phóng cổng 3000**: Nếu có tiến trình chiếm giữ cổng `3000`, script tự động giải phóng PID để tránh xung đột.
4. **Khởi động Backend**: Chạy ngầm máy chủ Express + Vite trong một tiến trình con ổn định.
5. **Kích hoạt Cloudflare Quick Tunnel**:
   - Tự dò tìm `cloudflared.exe` (trong `tools\`, `Program Files`, `Program Files (x86)`, WinGet, LocalAppData).
   - Nếu máy chưa có, tự động tải bản chính thức từ Cloudflare về thư mục `tools\`.
   - Tạo đường truyền HTTPS công khai bảo mật hoàn toàn miễn phí (không cần mở cổng Modem).
6. **Bắt URL & Copy Clipboard**: Tự động nhận diện URL `https://*.trycloudflare.com` và nạp sẵn vào bộ nhớ tạm (Clipboard) của bạn.
7. **Khởi chạy trình duyệt**: Tự động mở Microsoft Edge / Google Chrome ở chế độ cửa sổ độc lập.

---

## 🏗️ Kiến Trúc Hệ Thống

```mermaid
flowchart TB
    subgraph Clients ["GIAO DIỆN NGƯỜI DÙNG (React 19 + Tailwind v4)"]
        Kiosk["🖥️ Kiosk Bốc Số\n(Touch + Telex IME)"]
        TV["📺 TV Display Sảnh\n(TTS Audio + Realtime)"]
        Staff["🧑‍💼 Quầy Nhân Viên\n(Call / Recall / Finish)"]
        Citizen["📱 Cổng Khách Hàng\n(Tra cứu QR 4G/5G)"]
        Admin["👨‍💻 Cổng Quản Trị\n(Config, Stats, Reports)"]
    end

    subgraph Server ["MÁY CHỦ TRUNG TÂM (Express.js — Port 3000)"]
        Router["REST API Router & Vite Middleware"]
        SSE["Server-Sent Events (SSE Manager)"]
        AIEngine["AI Forecast Engine (Gemini / Heuristic)"]
    end

    subgraph Storage ["LƯU TRỮ NỘI BỘ"]
        SQLite[("💾 SQLite WAL Engine\n(smart_queue.db)")]
    end

    subgraph Gateway ["KẾT NỐI TỪ XA"]
        CF["🌐 Cloudflare Quick Tunnel\n(HTTPS Public Link)"]
    end

    Kiosk -->|HTTP POST| Router
    Staff -->|HTTP REST| Router
    Admin -->|HTTP REST| Router
    Citizen -->|HTTP REST| Router
    Router --> SQLite
    Router --> AIEngine
    Router --> SSE
    SSE -.->|Push Realtime Event| TV
    SSE -.->|Push Realtime Event| Staff
    SSE -.->|Push Realtime Event| Kiosk
    SSE -.->|Push Realtime Event| Citizen
    CF <---> Router
    Citizen -.->|Truy cập qua 4G/5G| CF
```

---

## 💻 Hướng Dẫn Cài Đặt

### Cách 1: Chạy Bằng Command Line (Cross-Platform)

```bash
# 1. Clone mã nguồn dự án
git clone https://github.com/your-username/smart-queue.git
cd smart-queue

# 2. Cài đặt thư viện dependencies
npm install

# 3. Tạo file cấu hình môi trường
copy .env.example .env.local   # Trên Windows
cp .env.example .env.local     # Trên macOS / Linux

# 4. Khởi chạy môi trường phát triển (Development)
npm run dev
```
Truy cập: **`http://localhost:3000`**

---

### Cách 2: Chạy Môi Trường Production Tối Ưu

```bash
# Build đóng gói bundle frontend & server
npm run build

# Khởi chạy production server (tối ưu RAM & tốc độ)
npm start
```

---

### Cách 3: Đóng Gói Thành Phần Mềm Desktop Windows (.exe)

Dự án hỗ trợ đóng gói hoàn chỉnh bằng **Electron**:

```bash
# Kiểm tra chạy thử app desktop
npm run electron:dev

# Đóng gói tạo file cài đặt Windows (.exe installer & portable)
npm run electron:build
```
*Tệp cài đặt đầu ra sẽ nằm tại thư mục `dist_electron/`.*

---

## ⚙️ Cấu Hình Môi Trường (`.env.local`)

Tệp `.env.local` nằm tại thư mục gốc của dự án:

```env
# Cổng chạy ứng dụng (Mặc định: 3000)
PORT=3000

# Khóa API Google Gemini để kích hoạt trí tuệ nhân tạo dự báo
# Đăng ký miễn phí tại: https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# Đường dẫn công khai cố định (Tùy chọn, để trống nếu dùng Cloudflare Tunnel tự động)
APP_URL=

# Cấu hình Supabase (Tùy chọn nếu cần tích hợp đồng bộ đám mây)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

> [!NOTE]
> Nếu bạn không cung cấp `GEMINI_API_KEY`, hệ thống sẽ **tự động chuyển sang mô hình Heuristic toán học nội bộ**, toàn bộ tính năng dự báo vẫn hoạt động bình thường mà không cần Internet.

---

## 📡 API Reference

Toàn bộ dịch vụ Backend REST API hoạt động tại cổng `3000`:

<details>
<summary><b>🔐 Xác thực & Người dùng (Authentication & Users)</b></summary>

| Method | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Đăng nhập hệ thống (username, password, role) |
| `GET` | `/api/users` | Lấy danh sách tài khoản nhân viên |
| `POST` | `/api/users` | Tạo tài khoản nhân sự mới |
| `PUT` | `/api/users/:id` | Cập nhật thông tin / mật khẩu tài khoản |
| `DELETE`| `/api/users/:id` | Xóa tài khoản nhân sự |

</details>

<details>
<summary><b>🛎️ Quản lý Dịch vụ & Quầy (Services & Counters)</b></summary>

| Method | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/api/services` | Danh sách dịch vụ đang mở |
| `POST` | `/api/services` | Tạo dịch vụ mới (tiền tố, tên, giới hạn số, thời lượng) |
| `PUT` | `/api/services/:id` | Chỉnh sửa dịch vụ |
| `DELETE`| `/api/services/:id` | Xóa dịch vụ |
| `POST` | `/api/services/templates`| Nạp bộ mẫu dịch vụ nhanh (`GOVERNMENT` / `ENTERPRISE`) |
| `GET` | `/api/counters` | Danh sách quầy giao dịch |
| `PUT` | `/api/counters/:id` | Cập nhật trạng thái / cấu hình quầy |

</details>

<details>
<summary><b>🎫 Nghiệp vụ Phiếu số & Cán bộ (Tickets & Staff Operations)</b></summary>

| Method | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/api/tickets` | Danh sách phiếu số trong ngày |
| `POST` | `/api/tickets/issue` | Bốc số phiếu mới (chọn dịch vụ, thông tin, đối tượng ưu tiên) |
| `GET` | `/api/tickets/token/:token`| Tra cứu tiến độ lượt theo token bảo mật |
| `POST` | `/api/tickets/:token/rating`| Đánh giá số sao (1–5 sao) và gửi góp ý |
| `POST` | `/api/staff/call-next` | Gọi số tiếp theo (ưu tiên thuật toán điểm số) |
| `POST` | `/api/staff/recall` | Gọi lại số đang phục vụ |
| `POST` | `/api/staff/start-serving`| Bắt đầu tính giờ phục vụ thực tế |
| `POST` | `/api/staff/complete` | Hoàn thành lượt tiếp nhận |
| `POST` | `/api/staff/no-show` | Báo vắng mặt khách hàng |
| `POST` | `/api/staff/transfer` | Chuyển phiếu sang quầy/dịch vụ khác |

</details>

<details>
<summary><b>🤖 AI, Realtime & Báo cáo (AI, Realtime & Analytics)</b></summary>

| Method | Endpoint | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/api/events` | Luồng **Server-Sent Events (SSE)** nhận cập nhật tức thời |
| `GET` | `/api/ai/forecast` | Dự báo lưu lượng cao điểm & khuyến nghị điều phối |
| `GET` | `/api/tts?text=...` | API Text-To-Speech giọng đọc tiếng Việt |
| `GET` | `/api/reports/stats` | Thống kê số lượng bốc, đã phục vụ, đang chờ, vắng |
| `GET` | `/api/reports/export-csv` | Xuất toàn bộ dữ liệu lịch sử ra file CSV Excel |

</details>

---

## 👥 Phân Quyền & Tài Khoản Mặc Định

Hệ thống có sẵn dữ liệu mẫu để bạn thử nghiệm ngay lập tức:

| Tên Đăng Nhập | Mật Khẩu Mặc Định | Vai Trò | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **ADMIN** | Quản trị toàn hệ thống, cấu hình dịch vụ, quầy, nhân sự và xem báo cáo |
| **`staff01`** | `staff123` | **STAFF** | Thao tác tiếp nhận, gọi số tại quầy được phân công |

> [!WARNING]
> Vui lòng đổi mật khẩu tài khoản `admin` trong mục **Quản trị ➔ Quản lý nhân viên** ngay khi đưa vào sử dụng thực tế.

---

## 📁 Cấu Trúc Mã Nguồn

```text
smart-queue/
├── 📄 SmartQueue_Launcher_v5.bat  # Trình khởi động 1-Click thông minh (Local + Cloudflare)
├── 📄 server.ts                   # Entry point máy chủ Express API & Vite Middleware
├── 📄 vite.config.ts              # Cấu hình Vite bundler, Tailwind v4 và allowedHosts
├── 📄 package.json                # Danh mục dependencies và scripts
├── 📄 tsconfig.json               # Cấu hình trình biên dịch TypeScript
│
├── 📁 server/                     # Backend Server Engine
│   ├── 📄 db.ts                   # CSDL SQLite (Schema, CRUD Services, Tickets, Counters)
│   ├── 📄 ai.ts                   # Tích hợp Google Gemini AI và mô hình dự báo Heuristic
│   └── 📄 sse.ts                  # Bộ điều phối sự kiện thời gian thực Server-Sent Events
│
├── 📁 src/                        # Ứng dụng Frontend React 19
│   ├── 📄 main.tsx                # Khởi tạo React Virtual DOM
│   ├── 📄 App.tsx                 # Router phân luồng giao diện (?mode=)
│   ├── 📄 index.css               # Styling hệ thống chuẩn TailwindCSS v4
│   │
│   ├── 📁 components/             # Các phân hệ giao diện chính
│   │   ├── 📄 KioskMode.tsx       # Màn hình Kiosk cấp số cảm ứng
│   │   ├── 📄 TvDisplay.tsx       # Màn hình TV sảnh chờ gọi số
│   │   ├── 📄 StaffCounter.tsx    # Giao diện cán bộ tiếp nhận tại quầy
│   │   ├── 📄 AdminPortal.tsx     # Cổng quản trị trung tâm đa chức năng
│   │   ├── 📄 CitizenPortal.tsx   # Cổng trực tuyến cho công dân lấy số từ xa
│   │   ├── 📄 VirtualKeyboard.tsx # Bàn phím ảo hỗ trợ gõ tiếng Việt Telex/VNI
│   │   ├── 📄 TicketPrintModal.tsx# Giao diện in phiếu số & hiển thị mã QR
│   │   └── 📄 PwaInstallPrompt.tsx# Trợ lý cài đặt PWA App độc lập
│   │
│   ├── 📁 types/                  # Định nghĩa kiểu dữ liệu TypeScript
│   │   └── 📄 queue.ts            # Data models (Ticket, Service, Counter, User, Org)
│   │
│   └── 📁 utils/                  # Tiện ích bổ trợ
│       ├── 📄 audio.ts            # Bộ phát âm thanh Google TTS tiếng Việt
│       ├── 📄 ticketImageGenerator.ts # Trình xuất ảnh phiếu số để khách tải về
│       └── 📄 vietnameseIME.ts    # Bộ engine xử lý dấu tiếng Việt
│
├── 📁 electron/                   # Đóng gói Desktop App
│   ├── 📄 main.cjs                # Tiến trình chính Electron
│   └── 📄 preload.cjs             # Cầu nối IPC bảo mật
│
├── 📁 scripts/                    # Scripts tự động hóa tiện ích
│   └── 📄 setup-cloudflare-tunnel.bat # Script chạy độc lập Cloudflare Tunnel
│
├── 📁 data/                       # Thư mục lưu trữ database SQLite (smart_queue.db)
└── 📁 tools/                      # Thư mục chứa binary cloudflared.exe
```

---

## 🛠️ FAQ & Troubleshooting

<details>
<summary><b>1. Cổng 3000 bị báo lỗi "Port 3000 is already in use"?</b></summary>
<br/>

Khởi động lại bằng file `SmartQueue_Launcher_v5.bat`. Launcher v5 đã được tích hợp bộ dò tìm PID tự động, phát hiện và tắt ngay các ứng dụng đang chiếm giữ cổng 3000 để nhường quyền cho Smart Queue.
</details>

<details>
<summary><b>2. Màn hình TV Display không phát âm thanh gọi số?</b></summary>
<br/>

Do chính sách **Autoplay Policy** trên các trình duyệt hiện đại (Chrome, Edge), âm thanh bị tạm khóa cho đến khi người dùng có tương tác đầu tiên. Khi mở màn hình TV (`/?mode=tv`), bạn chỉ cần click chuột một lần vào bất kỳ đâu trên màn hình TV để mở khóa âm thanh.
</details>

<details>
<summary><b>3. Khách hàng dùng 4G quét mã QR trên phiếu bị báo lỗi không tải được trang?</b></summary>
<br/>

Nguyên nhân do URL Public trong hệ thống đang để mặc định `localhost` (chỉ máy chủ xem được).  
**Cách xử lý:** Chạy `SmartQueue_Launcher_v5.bat` để nhận link Cloudflare Tunnel (ví dụ: `https://xxxx.trycloudflare.com`), sau đó đăng nhập Admin (`/?mode=admin`) ➔ Tab **Cài đặt Hệ thống** ➔ Dán link vào ô **Tên miền / URL Public** ➔ Bấm **Lưu cấu hình**. Tất cả phiếu in ra sau đó sẽ quét được bằng 4G/5G bình thường.
</details>

<details>
<summary><b>4. Các máy tính khác trong mạng Wi-Fi/LAN không truy cập được vào máy chủ?</b></summary>
<br/>

Nguyên nhân do tường lửa Windows (Windows Defender Firewall) chặn kết nối vào.  
**Cách xử lý:** Vào **Windows Defender Firewall** ➔ **Advanced Settings** ➔ **Inbound Rules** ➔ Tạo New Rule cho phép cổng **TCP 3000** đi qua. Sau đó các máy khác có thể truy cập qua địa chỉ IP của máy chủ: `http://192.168.x.x:3000`.
</details>

---

<div align="center">

## ⭐ Ủng Hộ Dự Án

Nếu bạn thấy **Smart Queue** hữu ích cho cơ quan hoặc doanh nghiệp của mình, hãy tặng dự án một **Star** trên GitHub để ủng hộ đội ngũ phát triển!

<br/>

**Smart Queue — Đưa Sự Thông Minh Vào Hàng Đợi**  
*Phát triển với ❤️ vì một nền hành chính và dịch vụ hiện đại*

</div>
