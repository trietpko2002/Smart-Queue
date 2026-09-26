@echo off
chcp 65001 >nul
title Smart Queue - Đóng Gói Bộ Cài Đặt Electron (.exe)
color 0b

echo =====================================================================
echo       SMART QUEUE - ĐÓNG GÓI BỘ CÀI ĐẶT DESKTOP (.EXE)
echo =====================================================================
echo.
echo Quá trình này sẽ đóng gói toàn bộ Backend SQLite và Frontend React
echo thành 1 file cài đặt Windows duy nhất (.exe) trong thư mục dist_electron\
echo.

cd /d "%~dp0\.."

:: 1. Kiểm tra Electron & electron-builder
if not exist "node_modules\electron-builder\" (
    echo [1/3] Đang tải công cụ electron và electron-builder, vui lòng đợi...
    call npm install --save-dev electron electron-builder
)

:: 2. Build Production Bundle
echo [2/3] Đang đóng gói Frontend và Backend...
call npm run build

:: 3. Build Windows Executable
echo [3/3] Đang xuất file .exe cài đặt (NSIS + Portable)...
call npx electron-builder --win

echo.
echo =====================================================================
echo [HOÀN TẤT] File cài đặt .exe đã được tạo thành công trong thư mục:
echo %cd%\dist_electron\
echo.
echo Các file tạo ra gồm có:
echo  1. SmartQueue-Setup.exe (Bộ cài đặt Windows có tạo Shortcut Desktop)
echo  2. SmartQueue-Portable.exe (Chạy ngay không cần cài đặt)
echo =====================================================================
pause
