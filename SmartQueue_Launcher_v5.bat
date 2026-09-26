@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: ==============================================================
:: SMARTQUEUE LAUNCHER v5.0
:: Local + Cloudflare Quick Tunnel
:: ==============================================================

:: Child process modes - must be before normal launcher
if /i "%~1"=="--backend" goto BACKEND_MODE
if /i "%~1"=="--cloudflare" goto CLOUDFLARE_MODE

chcp 65001 >nul 2>&1
title SmartQueue - Launcher
color 0A
mode con cols=96 lines=46 >nul 2>&1
cd /d "%~dp0"

cls
call :BANNER

:: --------------------------------------------------------------
:: 1. NODE.JS
:: --------------------------------------------------------------

call :STEP "Kiem tra Node.js"

where node >nul 2>&1
if errorlevel 1 (
    call :FAIL "Khong tim thay Node.js"
    echo.
    echo   Cai Node.js tai: https://nodejs.org/
    call :PAUSE_EXIT
    exit /b 1
)

for /f "delims=" %%A in ('node -v 2^>nul') do set "NODE_VER=%%A"
call :OK "Node.js !NODE_VER! san sang"

:: --------------------------------------------------------------
:: 2. NPM
:: --------------------------------------------------------------

call :STEP "Kiem tra npm"

where npm >nul 2>&1
if errorlevel 1 (
    call :FAIL "Khong tim thay npm"
    call :PAUSE_EXIT
    exit /b 1
)

for /f "delims=" %%A in ('npm -v 2^>nul') do set "NPM_VER=%%A"
call :OK "npm v!NPM_VER! san sang"

:: --------------------------------------------------------------
:: 3. NODE_MODULES
:: --------------------------------------------------------------

call :STEP "Kiem tra thu vien"

if not exist "node_modules" (
    call :WARN "Chua co node_modules - dang npm install"
    call npm install

    if errorlevel 1 (
        call :FAIL "npm install that bai"
        call :PAUSE_EXIT
        exit /b 1
    )

    call :OK "Cai dat thu vien thanh cong"
) else (
    call :OK "node_modules da san sang"
)

:: --------------------------------------------------------------
:: 4. ENV
:: --------------------------------------------------------------

call :STEP "Kiem tra .env.local"

if not exist ".env.local" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env.local" >nul
        call :WARN ".env.local vua duoc tao tu .env.example"
        echo.
        echo   Hay kiem tra thong tin Supabase trong .env.local.
        echo.
    ) else (
        call :WARN "Khong tim thay .env.local va .env.example"
    )
) else (
    call :OK ".env.local da san sang"
)

:: --------------------------------------------------------------
:: 5. PORT 3000
:: --------------------------------------------------------------

echo.
call :HEADER "KHOI DONG SMARTQUEUE"

call :STEP "Kiem tra port 3000"

set "FOUND_PID="

for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr /R /C:":3000 .*LISTENING"') do (
    set "FOUND_PID=%%P"
)

if defined FOUND_PID (
    call :WARN "Port 3000 dang duoc su dung - PID !FOUND_PID!"
    taskkill /PID !FOUND_PID! /F >nul 2>&1
    ping 127.0.0.1 -n 2 >nul
    call :OK "Da giai phong port 3000"
) else (
    call :OK "Port 3000 dang trong"
)

:: --------------------------------------------------------------
:: 6. BACKEND
:: --------------------------------------------------------------

call :STEP "Khoi dong Backend / Vite"

start "SmartQueue Backend" /min "%ComSpec%" /c ""%~f0" --backend"
ping 127.0.0.1 -n 2 >nul

call :OK "Backend dang chay o cua so rieng"

:: --------------------------------------------------------------
:: 7. CHO SERVER READY
:: --------------------------------------------------------------

call :STEP "Cho server san sang"

set /a WAIT=0
set /a WAIT_MAX=35
set "SERVER_READY=0"

:WAIT_LOOP

set /a WAIT+=1
set /a MOD=WAIT %% 4

if !MOD! EQU 0 set "ANIM=[    ]"
if !MOD! EQU 1 set "ANIM=[=   ]"
if !MOD! EQU 2 set "ANIM=[==  ]"
if !MOD! EQU 3 set "ANIM=[=== ]"

<nul set /p "=    !ANIM! Dang cho server... !WAIT!/!WAIT_MAX!   "

curl -s -m 1 -o nul http://127.0.0.1:3000 >nul 2>&1

if not errorlevel 1 (
    echo.
    call :OK "Server san sang tai http://localhost:3000"
    goto CLOUDFLARE_START
)

echo.

if !WAIT! GEQ !WAIT_MAX! goto SERVER_TIMEOUT

ping 127.0.0.1 -n 2 >nul
goto WAIT_LOOP

:SERVER_TIMEOUT

call :WARN "Server chua phan hoi sau !WAIT_MAX! giay"
echo   Tiep tuc thu khoi dong Cloudflare...
echo.

:: --------------------------------------------------------------
:: 8. TIM CLOUDFLARED
:: --------------------------------------------------------------

:CLOUDFLARE_START

call :STEP "Tim Cloudflared"

set "CF_EXE="

if exist "%~dp0tools\cloudflared.exe" set "CF_EXE=%~dp0tools\cloudflared.exe"
if not defined CF_EXE if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "C:\Program Files\cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CF_EXE=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CF_EXE=%ProgramFiles%\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%LOCALAPPDATA%\cloudflared\cloudflared.exe" set "CF_EXE=%LOCALAPPDATA%\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%~dp0cloudflared.exe" set "CF_EXE=%~dp0cloudflared.exe"

if not defined CF_EXE (
    for /f "delims=" %%A in ('where cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    for /f "delims=" %%A in ('where /R "%LOCALAPPDATA%\Microsoft\WinGet\Packages" cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    for /f "delims=" %%A in ('where /R "%ProgramFiles(x86)%" cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    for /f "delims=" %%A in ('where /R "%ProgramFiles%" cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    call :WARN "Chua cai cloudflared.exe - Dang thu tai tu dong..."
    if not exist "%~dp0tools" mkdir "%~dp0tools" >nul 2>&1
    powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0tools\cloudflared.exe'" >nul 2>&1
    if exist "%~dp0tools\cloudflared.exe" (
        set "CF_EXE=%~dp0tools\cloudflared.exe"
        call :OK "Da tu dong tai cloudflared vao tools\cloudflared.exe"
    )
)

if not defined CF_EXE (
    call :WARN "Khong tim thay cloudflared.exe"
    echo.
    echo   SmartQueue van chay LOCAL binh thuong tai http://localhost:3000.
    echo.
    goto OPEN_BROWSER
)

call :OK "Tim thay Cloudflared: !CF_EXE!"

:: --------------------------------------------------------------
:: 9. CLOUDFLARE
:: --------------------------------------------------------------

call :STEP "Khoi dong Cloudflare Quick Tunnel"

set "CF_LOG=%TEMP%\smartqueue-cloudflare.log"
set "CF_URL_FILE=%TEMP%\smartqueue-cf-url.txt"
set "CF_URL="

del /f /q "%CF_LOG%" >nul 2>&1
del /f /q "%CF_URL_FILE%" >nul 2>&1

:: Child mode chay tunnel
start "SmartQueue Cloudflare" /min "%ComSpec%" /c ""%~f0" --cloudflare "!CF_EXE!""

call :OK "Cloudflare dang khoi dong"
echo.

:: --------------------------------------------------------------
:: 10. CHO URL CLOUDFLARE
:: --------------------------------------------------------------

set /a CF_WAIT=0
set /a CF_WAIT_MAX=30

:WAIT_CLOUDFLARE

set /a CF_WAIT+=1

if exist "%CF_LOG%" (
    findstr /i "trycloudflare.com" "%CF_LOG%" >nul 2>&1
    if not errorlevel 1 (
        powershell -NoProfile -Command "$m = Select-String -Path '%CF_LOG%' -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | Select-Object -First 1; if ($m) { [System.IO.File]::WriteAllText('%CF_URL_FILE%', $m.Matches[0].Value.Trim()) }" >nul 2>&1
        if exist "%CF_URL_FILE%" (
            set /p CF_URL=<"%CF_URL_FILE%"
            del /f /q "%CF_URL_FILE%" >nul 2>&1
        )
    )
)

if defined CF_URL goto CLOUDFLARE_OK

if !CF_WAIT! GEQ !CF_WAIT_MAX! goto CLOUDFLARE_TIMEOUT

<nul set /p "=    [....] Dang lay link Cloudflare... !CF_WAIT!/!CF_WAIT_MAX!   "
ping 127.0.0.1 -n 2 >nul
echo.
goto WAIT_CLOUDFLARE

:CLOUDFLARE_OK

echo.
call :OK "Cloudflare Tunnel da san sang"

<nul set /p "=!CF_URL!" | clip

echo.
echo   ========================================================================
echo                           SMARTQUEUE DA SAN SANG
echo   ========================================================================
echo.
echo     [+] LOCAL:      http://localhost:3000
echo     [+] INTERNET:   !CF_URL!
echo.
echo     [*] LINK INTERNET DA DUOC TU DONG COPY VAO CLIPBOARD
echo   ========================================================================
echo.

goto OPEN_BROWSER

:CLOUDFLARE_TIMEOUT

echo.
call :WARN "Khong nhan duoc URL Cloudflare sau !CF_WAIT_MAX! giay"
echo.
echo   Log: %CF_LOG%
echo.

if exist "%CF_LOG%" (
    echo   ---------------- CLOUDFLARE LOG ----------------
    type "%CF_LOG%"
    echo   ------------------------------------------------
    echo.
)

echo   SmartQueue van co the truy cap LOCAL:
echo   http://localhost:3000
echo.
goto OPEN_BROWSER

:: --------------------------------------------------------------
:: 11. MO LOCAL
:: --------------------------------------------------------------

:OPEN_BROWSER

call :STEP "Mo giao dien SmartQueue Local"

where msedge >nul 2>&1
if not errorlevel 1 (
    start "" msedge --app=http://localhost:3000 --window-size=1280,800
    call :OK "Da mo Microsoft Edge"
    goto FINISH
)

where chrome >nul 2>&1
if not errorlevel 1 (
    start "" chrome --app=http://localhost:3000 --window-size=1280,800
    call :OK "Da mo Google Chrome"
    goto FINISH
)

start "" http://localhost:3000
call :OK "Da mo trinh duyet mac dinh"

:: --------------------------------------------------------------
:: 12. GIU LAI GIAO DIEN LAUNCHER
:: --------------------------------------------------------------

:FINISH

echo.
echo   ========================================================================
echo                              SMARTQUEUE STATUS
echo   ========================================================================
echo.
echo     [+] LOCAL:       http://localhost:3000
if defined CF_URL echo     [+] INTERNET:    !CF_URL!
echo.
echo     [*] Backend:     RUNNING (Port 3000)
if defined CF_URL echo     [*] Cloudflare:  RUNNING (Public Tunnel Online)
if not defined CF_URL echo     [*] Cloudflare:  NOT AVAILABLE
echo.
echo   ========================================================================
echo.
echo   Nhan phim bat ky de dong giao dien Launcher nay.
echo   Luu y: Backend va Cloudflare van tiep tuc chay ngam.
echo.
pause >nul
exit /b 0

:: ==============================================================
:: CHILD MODE: BACKEND
:: ==============================================================

:BACKEND_MODE

chcp 65001 >nul 2>&1
title SmartQueue Backend Server
color 0B
cd /d "%~dp0"

echo.
echo ==========================================
echo       SMARTQUEUE BACKEND SERVER
echo ==========================================
echo.
echo Thu muc: %CD%
echo.

call npm run dev

echo.
echo ==========================================
echo Backend da dung.
echo Nhan phim de dong cua so nay.
echo ==========================================
pause
exit /b 0

:: ==============================================================
:: CHILD MODE: CLOUDFLARE
:: ==============================================================

:CLOUDFLARE_MODE

chcp 65001 >nul 2>&1
title SmartQueue Cloudflare Tunnel
color 0E
cd /d "%~dp0"

set "CF_EXE=%~2"
if defined CF_EXE if exist "!CF_EXE!" goto RUN_CF

set "CF_EXE="

if exist "%~dp0tools\cloudflared.exe" set "CF_EXE=%~dp0tools\cloudflared.exe"
if not defined CF_EXE if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "C:\Program Files\cloudflared\cloudflared.exe" set "CF_EXE=C:\Program Files\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CF_EXE=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CF_EXE=%ProgramFiles%\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%LOCALAPPDATA%\cloudflared\cloudflared.exe" set "CF_EXE=%LOCALAPPDATA%\cloudflared\cloudflared.exe"
if not defined CF_EXE if exist "%~dp0cloudflared.exe" set "CF_EXE=%~dp0cloudflared.exe"

if not defined CF_EXE (
    for /f "delims=" %%A in ('where cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    for /f "delims=" %%A in ('where /R "%LOCALAPPDATA%\Microsoft\WinGet\Packages" cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    for /f "delims=" %%A in ('where /R "%ProgramFiles(x86)%" cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    for /f "delims=" %%A in ('where /R "%ProgramFiles%" cloudflared.exe 2^>nul') do (
        if not defined CF_EXE set "CF_EXE=%%A"
    )
)

if not defined CF_EXE (
    echo Khong tim thay cloudflared.exe > "%TEMP%\smartqueue-cloudflare.log"
    exit /b 1
)

:RUN_CF
echo.
echo ==========================================
echo       SMARTQUEUE CLOUDFLARE TUNNEL
echo ==========================================
echo.
echo Cloudflared:
echo %CF_EXE%
echo.
echo Dang ket noi localhost:3000...
echo.

"%CF_EXE%" tunnel --url http://127.0.0.1:3000 --http-host-header localhost:3000 > "%TEMP%\smartqueue-cloudflare.log" 2>&1

exit /b 0

:: ==============================================================
:: GIAO DIEN
:: ==============================================================

:BANNER

echo.
echo   ========================================================================
echo.
echo          SSSSS  M   M   AAAAA  RRRR   TTTTT
echo          S      MM MM   A     A R   R    T
echo          SSSSS  M M M   AAAAAAA RRRR     T
echo              S  M   M   A     A R R      T
echo          SSSSS  M   M   A     A R  RR    T
echo.
echo                       SMARTQUEUE SYSTEM
echo                  He thong Boc So va Hang Doi
echo                         Launcher v5.0
echo.
echo   ========================================================================
echo.
goto :eof

:HEADER
echo.
echo   ========================================================================
echo      %~1
echo   ========================================================================
echo.
goto :eof

:STEP
echo   [ .. ]  %~1
goto :eof

:OK
echo   [  OK]  %~1
goto :eof

:WARN
echo   [WARN]  %~1
goto :eof

:FAIL
color 0C
echo   [FAIL]  %~1
goto :eof

:PAUSE_EXIT
echo.
echo   ------------------------------------------------------------------------
echo      Nhan phim bat ky de thoat...
echo   ------------------------------------------------------------------------
pause >nul
goto :eof
