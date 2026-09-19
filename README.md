<div align="center">

# 🎫 SMART QUEUE

**Hệ thống Quản lý Hàng đợi Thông minh — Đa ngành, Đa quy mô**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron)](https://www.electronjs.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-orange?logo=google)](https://ai.google.dev)

> Giải pháp quản lý hàng đợi hoàn chỉnh, linh hoạt cho mọi ngành — từ Kiosk cấp số tự động, màn hình TV sảnh, giao diện nhân viên, đến cổng tra cứu online và AI dự báo lưu lượng theo thời gian thực.

</div>

---

## 📋 Mục Lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Các giao diện chính](#-các-giao-diện-chính)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [Triển khai & Đóng gói](#-triển-khai--đóng-gói)
- [Thiết lập Link Public (QR cho Khách Hàng)](#-thiết-lập-link-public-qr-cho-khách-hàng)
- [API Reference](#-api-reference)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Phân quyền người dùng](#-phân-quyền-người-dùng)

---

## 🌟 Giới thiệu

**Smart Queue** là hệ thống quản lý hàng đợi thông minh, linh hoạt cho **mọi ngành, mọi quy mô** — từ phòng khám nhỏ đến trung tâm thương mại lớn:

- 🏛️ **Cơ quan hành chính công** — UBND phường/xã/huyện, trung tâm hành chính "một cửa"
- 🏥 **Y tế** — Bệnh viện, phòng khám, trung tâm tiêm chủng, xét nghiệm
- 🏦 **Tài chính & Ngân hàng** — Giao dịch viên, tư vấn tín dụng, dịch vụ khách hàng
- 🏫 **Giáo dục** — Phòng đào tạo, bộ phận tư vấn tuyển sinh, thư viện
- 🛒 **Bán lẻ & Dịch vụ** — Siêu thị, trung tâm bảo hành, showroom xe
- ✂️ **Làm đẹp & Spa** — Salon tóc, nail, phòng khám thẩm mỹ
- ✈️ **Giao thông & Logistics** — Sân bay, bến xe, trung tâm dịch vụ vận tải
- 🏢 **Doanh nghiệp** — Bộ phận lễ tân, phòng nhân sự, helpdesk nội bộ

Hệ thống vận hành **hoàn toàn offline** trên mạng LAN nội bộ, không cần Internet (trừ khi bật tính năng QR scan từ xa). Dữ liệu được lưu trữ trực tiếp bằng **SQLite WAL** — không cần cài đặt database server riêng.

---

## ✨ Tính Năng Nổi Bật

### 🖥️ Kiosk Cấp Số Tự Động
- Màn hình cảm ứng toàn màn hình, giao diện trực quan
- Hỗ trợ ưu tiên: **Người cao tuổi**, **Phụ nữ mang thai**, **Người khuyết tật**, **VIP**
- Nhập thông tin khách hàng với bàn phím ảo tiếng Việt đầy đủ (hỗ trợ **Telex / VNI / Unicode trực tiếp**)
- In phiếu số thực tế (kết nối máy in nhiệt)
- Tạo mã QR để khách hàng theo dõi lượt từ điện thoại

### 📺 Màn Hình TV Sảnh (Display)
- Hiển thị bảng gọi số theo thời gian thực (SSE)
- **Phát âm thanh gọi tên / số tự động** bằng giọng đọc tiếng Việt chuẩn (Google TTS)
- Cuộn banner thông báo, quảng bá, khuyến mãi, tin tức (đồng hồ cơ quan, lịch nghỉ, cập nhật văn phòng...)
- Hiển thị QR code để tra cứu lượt online

### 🧑‍💼 Giao Diện Nhân Viên (Staff Counter)
- Quản lý lượt theo quầy phụ trách
- Thao tác: **Gọi tiếp**, **Gọi lại**, **Bắt đầu phục vụ**, **Hoàn thành**, **Vắng mặt**, **Chuyển quầy**
- Xem toàn bộ hàng chờ của các dịch vụ được giao
- Nhật ký hành động chi tiết

### 👨‍💻 Cổng Quản Trị Admin (Admin Portal)
- **Quản lý Dịch vụ**: Tạo/sửa/xóa dịch vụ, cấu hình số tối đa/ngày, tiền tố, form nhập liệu tùy chỉnh
- **Quản lý Quầy**: Theo dõi trạng thái, nhân viên phụ trách, dịch vụ xử lý
- **Quản lý Tài khoản**: Phân quyền theo vai trò (ADMIN / COORDINATOR / STAFF)
- **Thống kê & Báo cáo**: Biểu đồ tổng quan, phân bổ theo giờ, hiệu suất từng quầy
- **Xuất CSV**: Tải toàn bộ dữ liệu ra file Excel-compatible
- **Mẫu dịch vụ nhanh**: Nạp bộ dịch vụ mẫu theo ngành (Hành chính, Y tế, Ngân hàng, Bán lẻ...) chỉ 1 click
- **Cài đặt Tổ chức**: Logo, tên đơn vị, khẩu hiệu, hotline, URL Public

### 🤖 AI Dự Báo Thông Minh (Powered by Gemini)
- Kết nối **Google Gemini Flash** để phân tích số liệu hàng đợi
- Dự báo lưu lượng khung giờ cao điểm trong ngày
- Khuyến nghị điều phối quầy theo tải thực tế
- Phát hiện bất thường (tỉ lệ vắng cao, thời gian chờ vượt ngưỡng...)
- **Tự động fallback** sang mô hình heuristic nếu không có API Key

### 📱 Cổng Tra Cứu Của Khách Hàng (Customer Portal)
- Lấy số online từ điện thoại (không cần đến Kiosk)
- Tra cứu lượt chờ theo mã token
- Nhận thông tin thời gian ước tính
- Đánh giá chất lượng phục vụ (1–5 sao + nhận xét)

### 📢 Banner Thông Báo & Truyền Thông
- Hiển thị nội dung quảng bá, thông báo nội bộ, khuyến mãi, lịch nghỉ tết...
- Tùy chỉnh hoàn toàn: tiêu đề, nội dung, màu gradient, biểu tượng, QR code liên kết

### ⚡ Cập Nhật Realtime (SSE)
- Tất cả giao diện (TV, Kiosk, Cán bộ, Admin) nhận update tức thời qua **Server-Sent Events**
- Không cần refresh trang

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────────────┐
│                         SMART QUEUE                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Kiosk   │  │ TV Sảnh  │  │ Nhân Viên │  │ Khách Hàng   │    │
│  │ (React)  │  │ (React)  │  │ (React)  │  │ (React PWA)  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
│       │             │             │                │            │
│       └─────────────┴──────SSE────┴────────────────┘            │
│                            │                                    │
│              ┌─────────────▼──────────────┐                     │
│              │   Express.js REST API       │                     │
│              │   server.ts  (Port 3000)    │                     │
│              └─────────────┬──────────────┘                     │
│                            │                                    │
│              ┌─────────────▼──────────────┐                     │
│              │   SQLite (WAL mode)         │                     │
│              │   server/db.ts              │                     │
│              └─────────────┬──────────────┘                     │
│                            │                                    │
│              ┌─────────────▼──────────────┐                     │
│              │   Google Gemini AI          │                     │
│              │   server/ai.ts              │                     │
│              └────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

**Chế độ triển khai:**
- **SERVER mode**: Chạy backend + frontend tích hợp trên 1 máy, các thiết bị khác kết nối qua LAN
- **CLIENT mode** (Electron): Chỉ hiển thị giao diện, kết nối đến server trung tâm

---

## 🖥️ Các Giao Diện Chính

| Đường dẫn | Giao diện | Dành cho |
|-----------|-----------|----------|
| `/` | Trang chủ / Lựa chọn chế độ | Tất cả |
| `/?mode=kiosk` | Kiosk cấp số tự động | Màn hình kiosk cảm ứng |
| `/?mode=staff` | Quầy phục vụ nhân viên | Nhân viên tiếp nhận |
| `/?mode=admin` | Cổng quản trị | Quản trị viên |
| `/?mode=tv` | Màn hình TV sảnh chờ | TV / Monitor công cộng |
| `/?mode=citizen` | Cổng khách hàng | Khách hàng (điện thoại) |
| `/ticket/:token` | Tra cứu lượt theo token | Khách hàng |

---

## 💻 Yêu Cầu Hệ Thống

| Thành phần | Yêu cầu tối thiểu |
|------------|-------------------|
| **Hệ điều hành** | Windows 10/11, macOS 12+, Ubuntu 20.04+ |
| **Node.js** | v18 LTS trở lên (khuyên dùng v20+) |
| **RAM** | 512 MB (khuyên dùng 1 GB+) |
| **Dung lượng** | ~500 MB (bao gồm node_modules) |
| **Mạng** | LAN nội bộ (không cần Internet, trừ AI + QR Public) |
| **Trình duyệt** | Chrome 110+ / Edge 110+ / Firefox 110+ |

---

## 🚀 Cài Đặt & Khởi Chạy

### Cách 1: Khởi chạy nhanh (Windows — Khuyên dùng)

```bash
# Nhấp đúp vào file:
Start-SmartQueue.bat
```

Script tự động:
1. Kiểm tra Node.js và npm
2. Cài đặt dependencies nếu chưa có (`npm install`)
3. Khởi động server tại `http://localhost:3000`
4. Mở trình duyệt

### Cách 2: Chạy thủ công (Tất cả hệ điều hành)

```bash
# 1. Clone dự án
git clone <repository-url>
cd smart-queue

# 2. Cài đặt dependencies
npm install

# 3. Cấu hình môi trường
cp .env.example .env.local
# Chỉnh sửa .env.local (xem phần Cấu hình bên dưới)

# 4. Khởi chạy development server
npm run dev
```

Truy cập: **http://localhost:3000**

### Cách 3: Chạy dưới dạng Desktop App (Electron)

```bash
# Chạy ở chế độ development
npm run electron:dev

# Đóng gói thành file .exe (Windows)
npm run electron:build
```

---

## ⚙️ Cấu Hình Môi Trường

Tạo file `.env.local` từ mẫu:

```bash
cp .env.example .env.local
```

Các biến môi trường:

```env
# API Key của Google Gemini AI (cho tính năng dự báo thông minh)
# Lấy miễn phí tại: https://aistudio.google.com/apikey
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# URL public của ứng dụng (dùng cho QR code trên phiếu số)
# Để trống nếu chỉ dùng nội bộ LAN
APP_URL=https://your-public-domain.com
```

> **Lưu ý:** Nếu không có `GEMINI_API_KEY`, tính năng AI dự báo sẽ tự động chuyển sang chế độ tính toán heuristic nội tuyến (không cần Internet).

---

## 📦 Triển Khai & Đóng Gói

### Build Production

```bash
# Build frontend + server thành bundle hoàn chỉnh
npm run build

# Chạy production server
npm start
```

### Đóng Gói Desktop App (.exe)

```bash
# Đóng gói thành file cài đặt Windows .exe
npm run electron:build

# Output: dist_electron/SmartQueue Setup x.x.x.exe
#         dist_electron/SmartQueue x.x.x.exe (portable)
```

### Cài Đặt PWA (Progressive Web App)

Smart Queue hỗ trợ cài đặt như ứng dụng desktop/mobile qua PWA:

1. Mở **Chrome** hoặc **Edge**, truy cập `http://localhost:3000`
2. Nhấn nút **"Cài App Độc Lập"** trên thanh menu
3. Hoặc nhấn biểu tượng ⊕ trên thanh địa chỉ URL
4. Chọn **"Cài đặt (Install)"**

**Trên Android/iPad:**
- Android: Menu 3 chấm → "Cài đặt ứng dụng"
- iPad/Safari: Share → "Thêm vào Màn hình chính"

---

## 🌐 Thiết Lập Link Public (QR cho Dân)

Để người dân quét QR phiếu số từ điện thoại (4G/5G), cần tạo đường truyền HTTPS public:

### Cách nhanh: Cloudflare Tunnel (Miễn phí — 1 phút)

```bash
# Chạy script tự động
scripts\setup-cloudflare-tunnel.bat
```

Script sẽ:
1. Tự tải `cloudflared.exe` về thư mục `tools\`
2. Tạo đường truyền HTTPS: `https://xxxx-xxxx.trycloudflare.com`

Sau đó vào **Admin → Cài đặt Hệ thống** → dán URL vào ô **"Tên miền / URL Public"**.

**Ưu điểm:**
- ✅ Hoàn toàn miễn phí
- ✅ Không cần mở cổng modem (No Port Forwarding)
- ✅ HTTPS hợp lệ, không cảnh báo nguy hiểm
- ✅ Vượt qua tường lửa Viettel / VNPT / FPT

### Tên Miền Riêng Cố Định (ví dụ: `xephang.ubnd.gov.vn`)

Xem hướng dẫn chi tiết tại: [`docs/HUONG_DAN_DONG_GOI_VA_PUBLIC_LINK.md`](docs/HUONG_DAN_DONG_GOI_VA_PUBLIC_LINK.md)

---

## 📡 API Reference

Server chạy trên cổng `3000`. Tất cả API đều trả về JSON.

### 🔐 Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/login` | Đăng nhập (username, password, role) |

### 🏢 Tổ Chức & Chi Nhánh
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/org` | Lấy thông tin tổ chức |
| `PUT` | `/api/org` | Cập nhật thông tin tổ chức |
| `GET` | `/api/branches` | Danh sách chi nhánh |

### 🛎️ Dịch Vụ
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/services` | Danh sách dịch vụ |
| `POST` | `/api/services` | Tạo dịch vụ mới |
| `PUT` | `/api/services/:id` | Cập nhật dịch vụ |
| `DELETE` | `/api/services/:id` | Xóa dịch vụ |
| `POST` | `/api/services/templates` | Nạp mẫu dịch vụ (GOVERNMENT/ENTERPRISE) |
| `DELETE` | `/api/services-all` | Xóa toàn bộ dịch vụ |

### 🎫 Phiếu Số (Tickets)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/tickets` | Danh sách phiếu số |
| `POST` | `/api/tickets` | Cấp phiếu số mới |
| `POST` | `/api/tickets/issue` | Cấp phiếu số mới (alias) |
| `GET` | `/api/tickets/token/:token` | Tra cứu phiếu theo token |
| `GET` | `/api/tickets/:id/events` | Lịch sử sự kiện phiếu |
| `POST` | `/api/tickets/:token/rating` | Đánh giá chất lượng phục vụ |

### 👨‍💼 Thao Tác Cán Bộ
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/staff/call-next` | Gọi số tiếp theo |
| `POST` | `/api/staff/recall` | Gọi lại số |
| `POST` | `/api/staff/start-serving` | Bắt đầu phục vụ |
| `POST` | `/api/staff/complete` | Hoàn thành phục vụ |
| `POST` | `/api/staff/no-show` | Đánh dấu vắng mặt |
| `POST` | `/api/staff/transfer` | Chuyển quầy |

### 🖥️ Quầy / Kiosk / Màn Hình
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/counters` | Danh sách quầy |
| `PUT` | `/api/counters/:id` | Cập nhật quầy |
| `GET` | `/api/kiosks` | Danh sách kiosk |
| `PUT` | `/api/kiosks/:id` | Cập nhật kiosk |
| `GET` | `/api/displays` | Danh sách màn hình TV |
| `PUT` | `/api/displays/:id` | Cập nhật màn hình TV |

### 👤 Quản Lý Nhân Viên
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/users` | Danh sách tài khoản |
| `POST` | `/api/users` | Tạo tài khoản mới |
| `PUT` | `/api/users/:id` | Cập nhật tài khoản |
| `DELETE` | `/api/users/:id` | Xóa tài khoản |

### 📊 Báo Cáo & Thống Kê
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/reports/stats` | Thống kê tổng quan |
| `GET` | `/api/reports/audit` | Nhật ký kiểm toán |
| `GET` | `/api/reports/export-csv` | Xuất dữ liệu CSV |

### 🤖 AI & Tiện Ích
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/ai/forecast` | Dự báo lưu lượng AI (Gemini) |
| `GET` | `/api/propaganda` | Lấy cấu hình banner tuyên truyền |
| `PUT` | `/api/propaganda` | Cập nhật banner tuyên truyền |
| `GET` | `/api/tts?text=...` | Text-to-Speech tiếng Việt |
| `GET` | `/api/events` | SSE stream realtime |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/database/info` | Thông tin SQLite engine |

---

## 📁 Cấu Trúc Dự Án

```
smart-queue/
│
├── 📄 server.ts                 # Entry point Express.js API server
├── 📄 index.html                # HTML gốc cho Vite SPA
├── 📄 vite.config.ts            # Cấu hình Vite bundler
├── 📄 tsconfig.json             # Cấu hình TypeScript
├── 📄 package.json              # Dependencies & scripts
├── 📄 Start-SmartQueue.bat      # Script khởi chạy 1-click (Windows)
├── 📄 SmartQueue.exe            # Launcher nhị phân (Windows)
│
├── 📁 src/                      # Frontend React source
│   ├── 📄 main.tsx              # React entry point
│   ├── 📄 App.tsx               # Root component & routing logic
│   ├── 📄 index.css             # Global styles + Tailwind
│   │
│   ├── 📁 components/           # Các giao diện chính
│   │   ├── AdminLoginModal.tsx   # Modal đăng nhập Admin
│   │   ├── AdminPortal.tsx       # Cổng quản trị (tabs đa năng)
│   │   ├── AdminPropagandaSettings.tsx  # Quản lý banner tuyên truyền
│   │   ├── AdminSettingsTab.tsx  # Cài đặt hệ thống & URL Public
│   │   ├── CitizenPortal.tsx     # Cổng công dân (lấy số / tra cứu)
│   │   ├── KioskMode.tsx         # Giao diện kiosk cảm ứng
│   │   ├── PortalGuideModal.tsx  # Hướng dẫn sử dụng hệ thống
│   │   ├── PwaInstallPrompt.tsx  # Popup cài đặt PWA
│   │   ├── StaffCounter.tsx      # Giao diện quầy cán bộ
│   │   ├── StatePropagandaBanner.tsx  # Banner tuyên truyền nhà nước
│   │   ├── TicketPrintModal.tsx  # In phiếu / hiển thị QR
│   │   ├── TicketTracker.tsx     # Tra cứu phiếu (modal)
│   │   ├── TvDisplay.tsx         # Màn hình TV sảnh chờ
│   │   └── VirtualKeyboard.tsx   # Bàn phím ảo tiếng Việt
│   │
│   ├── 📁 types/
│   │   └── queue.ts             # TypeScript types đầy đủ
│   │
│   └── 📁 utils/
│       ├── audio.ts             # Xử lý âm thanh TTS
│       ├── ticketImageGenerator.ts  # Tạo ảnh phiếu số để download
│       ├── url.ts               # Helpers URL public
│       └── vietnameseIME.ts     # Bộ gõ tiếng Việt (Telex/VNI)
│
├── 📁 server/                   # Backend logic
│   ├── db.ts                    # SQLite database layer (toàn bộ CRUD)
│   ├── ai.ts                    # Tích hợp Google Gemini AI
│   └── sse.ts                   # Server-Sent Events manager
│
├── 📁 electron/                 # Electron Desktop App
│   ├── main.cjs                 # Main process (window, tray, server)
│   ├── preload.cjs              # Preload script IPC
│   └── setup.html               # Màn hình thiết lập kết nối
│
├── 📁 scripts/                  # Công cụ hỗ trợ
│   ├── build-electron-exe.bat   # Script build .exe Windows
│   ├── setup-cloudflare-tunnel.bat  # Tạo đường truyền HTTPS public
│   └── setup-cloudflare-tunnel.sh   # (macOS/Linux)
│
├── 📁 docs/                     # Tài liệu
│   └── HUONG_DAN_DONG_GOI_VA_PUBLIC_LINK.md
│
├── 📁 public/                   # Static assets (icons, PWA manifest)
├── 📁 data/                     # Dữ liệu SQLite (.db file)
├── 📁 dist/                     # Build output (sau khi build)
└── 📁 dist_electron/            # Electron installer output
```

---

## 🔧 Công Nghệ Sử Dụng

| Lớp | Công nghệ | Mục đích |
|-----|-----------|----------|
| **Frontend** | React 19 + TypeScript | Giao diện người dùng |
| **Styling** | TailwindCSS 4 | Thiết kế responsive |
| **Animation** | Framer Motion (motion) | Hiệu ứng mượt mà |
| **Icons** | Lucide React | Bộ icon nhất quán |
| **Bundler** | Vite 6 | Build nhanh + HMR |
| **Backend** | Express.js 4 | REST API server |
| **Database** | SQLite (WAL mode) | Lưu trữ cục bộ, không cần server DB |
| **Realtime** | Server-Sent Events | Push update tức thời |
| **AI** | Google Gemini Flash | Dự báo hàng đợi thông minh |
| **TTS** | Google Translate TTS | Đọc số tiếng Việt chuẩn |
| **QR Code** | qrcode npm | Tạo mã QR phiếu số |
| **Desktop** | Electron 44 | Đóng gói app Windows/macOS |
| **PWA** | Service Worker | Cài đặt offline |
| **Tunnel** | Cloudflare Tunnel | HTTPS public miễn phí |
| **Language** | TypeScript 5.8 | Type-safe toàn stack |

---

## 👥 Phân Quyền Người Dùng

| Vai trò | Quyền truy cập |
|---------|----------------|
| `SUPER_ADMIN` | Toàn quyền hệ thống, xuyên chi nhánh |
| `ADMIN` | Quản lý dịch vụ, quầy, nhân viên, báo cáo |
| `COORDINATOR` | Điều phối hàng đợi, xem thống kê |
| `STAFF` | Thao tác quầy phục vụ |
| `KIOSK` | Chỉ được cấp số |
| `DISPLAY` | Chỉ được hiển thị màn hình TV |
| `CITIZEN` | Lấy số online, tra cứu lượt |

**Tài khoản mặc định (demo):**

| Username | Password | Vai trò |
|----------|----------|---------|
| `admin` | `admin123` | Admin |
| `staff01` | `staff123` | Cán bộ |

> ⚠️ **Lưu ý bảo mật:** Đổi mật khẩu mặc định ngay sau khi triển khai trên môi trường thực tế.

---

## 📜 Scripts Có Sẵn

```bash
npm run dev              # Khởi chạy development server (frontend + backend)
npm run build            # Build production bundle
npm start                # Chạy production server
npm run electron:dev     # Chạy Electron desktop app (dev mode)
npm run electron:build   # Đóng gói Electron thành .exe
npm run tunnel           # Khởi chạy Cloudflare Tunnel
npm run lint             # Kiểm tra TypeScript (tsc --noEmit)
```

---

<div align="center">

**Smart Queue — Hệ thống bốc số thông minh All-in-One cho mọi ngành**

*Smart Queue — Đưa sự thông minh vào hàng đợi*

</div>
