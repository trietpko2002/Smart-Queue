@echo off
chcp 65001 >nul
title Cloudflare Tunnel - Smart Queue Public Link
color 0a

echo =====================================================================
echo    CLOUDFLARE TUNNEL - TẠO ĐƯỜNG DẪN PUBLIC HTTPS CHO SMART QUEUE
echo =====================================================================
echo.
echo Công cụ này sẽ tạo 1 đường truyền HTTPS bảo mật ra ngoài Internet để
echo người dân dùng 4G/5G có thể quét mã QR phiếu số hoặc bốc số từ xa.
echo.
echo - KHÔNG cần mở cổng modem (No Port Forwarding)
echo - KHÔNG lo bị thay đổi địa chỉ IP
echo - Có sẵn chứng chỉ bảo mật HTTPS hợp lệ
echo.

cd /d "%~dp0\.."

if not exist "tools" mkdir "tools"

set CLOUDFLARED=tools\cloudflared.exe

where cloudflared >nul 2>nul
if %errorlevel% equ 0 (
    set CLOUDFLARED=cloudflared
    goto :RUN_TUNNEL
)

if exist "tools\cloudflared.exe" (
    goto :RUN_TUNNEL
)

echo [1/2] Chưa tìm thấy cloudflared.exe. Đang tự động tải về từ Cloudflare...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'tools\cloudflared.exe'"

if not exist "tools\cloudflared.exe" (
    echo [LỖI] Tải cloudflared.exe thất bại. Vui lòng kiểm tra kết nối mạng hoặc tải thủ công từ:
    echo https://github.com/cloudflare/cloudflared/releases
    pause
    exit /b 1
)

echo [Thành công] Đã tải công cụ Cloudflare Tunnel.

:RUN_TUNNEL
echo.
echo [2/2] Đang kích hoạt đường truyền công khai cho SmartQueue (Cổng 3000)...
echo.
echo >>> QUAN TRỌNG: Khi màn hình hiển thị dòng:
echo >>> https://xxxx-xxxx.trycloudflare.com
echo >>> Hãy COPY đường link đó và dán vào mục "Cài đặt Tên miền công khai" trong Quản trị Admin!
echo =====================================================================
echo.

%CLOUDFLARED% tunnel --url http://localhost:3000

pause
