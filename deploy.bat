@echo off
setlocal enabledelayedexpansion
title Cannonball Relic - Deploy

REM ============================================================
REM  Cannonball Relic deploy script (Windows)
REM  Usage: double-click, or run `deploy.bat` from project root
REM  All output is teed to deploy.log so failures are debuggable
REM  after the window closes.
REM
REM  Flags:
REM    deploy.bat --skip-pull       skip git pull
REM    deploy.bat --skip-build      skip npm install + build
REM    deploy.bat --no-serve        build only, do not start server
REM ============================================================

set PORT=4173
set LOG=deploy.log
set SKIP_PULL=0
set SKIP_BUILD=0
set NO_SERVE=0

:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="--skip-pull"  set SKIP_PULL=1
if /I "%~1"=="--skip-build" set SKIP_BUILD=1
if /I "%~1"=="--no-serve"   set NO_SERVE=1
shift
goto parse_args
:args_done

REM Reset log
> "%LOG%" echo === Cannonball Relic deploy started %DATE% %TIME% ===
call :log "cwd:   %CD%"
call :log "port:  %PORT%"
call :log "flags: skip-pull=%SKIP_PULL% skip-build=%SKIP_BUILD% no-serve=%NO_SERVE%"
call :log ""

REM ---- 0. Environment snapshot ----
call :section "[0/5] Environment"
call :run "where node"  || goto :fail_env
call :run "node --version"
call :run "where npm"   || goto :fail_env
call :run "npm --version"
call :run "where git"   || goto :fail_env
call :run "git rev-parse --abbrev-ref HEAD"
call :run "git rev-parse --short HEAD"
call :run "git status --short"

REM ---- 1. Pull latest ----
if %SKIP_PULL%==1 (
  call :section "[1/5] git pull SKIPPED"
) else (
  call :section "[1/5] git pull"
  call :run "git pull" || goto :fail
)

REM ---- 2. Install deps ----
if %SKIP_BUILD%==1 (
  call :section "[2/5] npm install SKIPPED"
) else (
  call :section "[2/5] npm install"
  call :run "npm install --prefer-offline --no-audit --no-fund" || goto :fail
)

REM ---- 3. Build ----
if %SKIP_BUILD%==1 (
  call :section "[3/5] build SKIPPED"
) else (
  call :section "[3/5] build (tsc + vite build)"
  call :run "npm run build" || goto :fail
)

if not exist "dist\index.html" (
  call :log "[ERROR] dist\index.html missing after build - vite build produced no output."
  call :log "        Check the build section above for warnings about empty input or copy failures."
  goto :fail
)
call :run "dir /b dist"

REM ---- 4. Port check (auto-stop old server if port is busy) ----
call :section "[4/5] port %PORT% check"
netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul
if not errorlevel 1 (
  call :log "port %PORT% is in use. Treating this as a redeploy - stopping the old server."
  netstat -ano | findstr ":%PORT% " | findstr LISTENING >> "%LOG%" 2>&1
  netstat -ano | findstr ":%PORT% " | findstr LISTENING
  call :stop_old_server
  REM Re-check after kill
  netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul
  if not errorlevel 1 (
    call :log "[ERROR] port %PORT% still occupied after kill attempt. Giving up."
    call :log "        Check the listing above - it may be a non-vite process you do not want killed."
    goto :fail
  )
  call :log "[OK] old server stopped, port %PORT% is now free."
) else (
  call :log "port %PORT% is free."
)

if %NO_SERVE%==1 (
  call :log ""
  call :log "[OK] build finished, --no-serve set, exiting without starting server."
  goto :ok
)

REM ---- 5. Start server + verify ----
call :section "[5/5] start vite preview"

REM Find the most-preferred LAN IPv4. Prefer real adapters (Ethernet/Wi-Fi)
REM over virtual ones (WSL, Hyper-V, VirtualBox, VMware, vEthernet, Loopback).
set LAN_IP=
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -notmatch 'WSL|Loopback|Hyper-V|VirtualBox|VMware|vEthernet' } | Sort-Object -Property InterfaceMetric | Select-Object -First 1 -ExpandProperty IPAddress"`) do set "LAN_IP=%%i"

call :log "Local:   http://127.0.0.1:%PORT%"
if defined LAN_IP call :log "LAN:     http://%LAN_IP%:%PORT%"
call :log "Host:    http://%COMPUTERNAME%:%PORT%"
call :log ""
call :log "Probing local server (up to ~15s)..."

REM Start vite preview in a new window so we can probe from this script
if exist vite-preview.log del /q vite-preview.log
start "vite-preview" cmd /c "npx vite preview --host 0.0.0.0 --port %PORT% > vite-preview.log 2>&1"

REM Poll the local URL up to 15 times (~15s).
REM Probe must satisfy BOTH: HTTP 200 AND body contains the marker "stageShell"
REM (proves the served HTML is the built game, not a default vite landing page).
set PROBE_OK=0
for /L %%i in (1,1,15) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri 'http://127.0.0.1:%PORT%/'; if ($r.StatusCode -eq 200 -and $r.Content -match 'stageShell') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
  if !errorlevel! == 0 (
    set PROBE_OK=1
    goto :probe_done
  )
  timeout /t 1 /nobreak >nul
)
:probe_done

if %PROBE_OK%==1 (
  call :log "[OK] server responded on http://127.0.0.1:%PORT%/  (HTML contains 'stageShell')"

  REM ---- Verify the bundled JS asset is also reachable ----
  call :verify_assets

  call :log ""
  call :print_ready
  goto :ok
) else (
  call :log "[ERROR] server did not respond on http://127.0.0.1:%PORT%/ within 15s."
  call :log "        vite-preview.log last lines:"
  if exist vite-preview.log (
    powershell -NoProfile -Command "Get-Content vite-preview.log -Tail 30" >> "%LOG%" 2>&1
    powershell -NoProfile -Command "Get-Content vite-preview.log -Tail 30"
  ) else (
    call :log "        (vite-preview.log not created - vite never started; check PATH / npm scripts)"
  )
  goto :fail
)

REM ---- Helpers ----
:section
call :log ""
call :log "------------------------------------------------------------"
call :log " %~1"
call :log "------------------------------------------------------------"
goto :eof

:run
call :log "[run] %~1"
call %~1 >> "%LOG%" 2>&1
set RC=%errorlevel%
REM Show last few lines on console so user sees progress
if /I not "%~1"=="git status --short" if /I not "%~1"=="dir /b dist" (
  powershell -NoProfile -Command "Get-Content '%LOG%' -Tail 6" 2>nul
)
exit /b %RC%

:log
setlocal enabledelayedexpansion
set "MSG=%~1"
echo(!MSG!
>> "%LOG%" echo(!MSG!
endlocal
goto :eof

:stop_old_server
REM Kill every PID listening on %PORT%. Logs each kill so we know what happened.
setlocal enabledelayedexpansion
set KILLED=0
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
  if not "%%p"=="0" (
    call :log "[run] taskkill /F /PID %%p"
    taskkill /F /PID %%p >> "%LOG%" 2>&1
    set /a KILLED+=1
  )
)
if !KILLED! == 0 call :log "[WARN] no PID found via netstat, port may free itself in a moment."
REM Give Windows a beat to release the socket from TIME_WAIT.
timeout /t 1 /nobreak >nul
endlocal
goto :eof

:verify_assets
REM Extract the bundled JS path from dist\index.html and probe it.
REM Proves the static asset pipeline (not just index.html) is reachable.
set JS_PATH=
for /f "usebackq delims=" %%j in (`powershell -NoProfile -Command "$h = Get-Content -Raw -LiteralPath 'dist\index.html'; if ($h -match '/assets/index-[A-Za-z0-9_-]+\.js') { $matches[0] } else { '' }"`) do set "JS_PATH=%%j"
if not defined JS_PATH (
  call :log "[WARN] could not find /assets/index-*.js in dist\index.html (asset reachability not verified)"
  goto :eof
)
call :log "[run] probe %JS_PATH%"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri 'http://127.0.0.1:%PORT%%JS_PATH%'; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  call :log "[WARN] JS asset %JS_PATH% did not return 200 (server up but assets may be broken)"
) else (
  call :log "[OK] JS asset reachable: %JS_PATH%"
)
goto :eof

:print_ready
setlocal enabledelayedexpansion
call :log "============================================================"
call :log " READY"
call :log "============================================================"
call :log "  Local:   http://127.0.0.1:%PORT%/"
if defined LAN_IP call :log "  LAN:     http://!LAN_IP!:%PORT%/    <-- share this with phones/laptops on the same Wi-Fi"
call :log "  Host:    http://%COMPUTERNAME%:%PORT%/"
call :log ""
REM Enumerate any other plausible LAN IPv4s (in case the primary one is wrong on this machine)
set ALT_COUNT=0
for /f "usebackq delims=" %%a in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -notmatch 'WSL|Loopback|Hyper-V|VirtualBox|VMware|vEthernet' } | Select-Object -ExpandProperty IPAddress"`) do (
  if /I not "%%a"=="!LAN_IP!" (
    if !ALT_COUNT! == 0 call :log "  Alt LAN IPs (try these if the primary one above does not work):"
    call :log "    http://%%a:%PORT%/"
    set /a ALT_COUNT+=1
  )
)
call :log ""
call :log "  If LAN URL fails from another device:"
call :log "    1. Both devices must be on the same Wi-Fi / subnet"
call :log "    2. Allow inbound TCP %PORT% in Windows Firewall (run once as admin):"
call :log "       netsh advfirewall firewall add rule name=vite-preview dir=in action=allow protocol=TCP localport=%PORT%"
call :log ""
call :log "  Stop server:  close the 'vite-preview' window."
call :log "                If it is gone but the port is still held, find PID with:"
call :log "                    netstat -ano | findstr :%PORT%"
call :log "                then:  taskkill /F /PID <pid>"
call :log "============================================================"
endlocal
goto :eof

:fail_env
call :log "[ERROR] required tool not found on PATH (node / npm / git)."
call :log "        See above. Install it or open a shell where it is available."
goto :fail

:fail
call :log ""
call :log "============================================================"
call :log "  DEPLOY FAILED - see %CD%\%LOG% for full details."
call :log "  Last 20 lines of log:"
call :log "============================================================"
powershell -NoProfile -Command "Get-Content '%LOG%' -Tail 20"
echo.
echo  If you closed this window before reading the log,
echo  open it later from: %CD%\%LOG%
echo.
pause
exit /b 1

:ok
call :log ""
call :log "Full log: %CD%\%LOG%"
echo.
echo  (window can be closed; vite-preview keeps running in its own window)
pause
exit /b 0
