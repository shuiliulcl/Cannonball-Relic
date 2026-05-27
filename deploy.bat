@echo off
chcp 65001 >nul
title Cannonball Relic — Deploy

:: ============================================================
::  Cannonball Relic 一键部署脚本
::  用法：双击运行，或在项目根目录执行 deploy.bat
::  修改下方 PORT 可更换监听端口
:: ============================================================

set PORT=4173

echo.
echo  =========================================
echo   Cannonball Relic  ^|  Deploy
echo  =========================================
echo.

:: ── 1. 拉取最新代码 ──────────────────────────────────────────
echo [1/4] 拉取最新代码...
git pull
if errorlevel 1 (
    echo.
    echo  [ERROR] git pull 失败，请检查网络或仓库状态。
    pause
    exit /b 1
)
echo  完成。
echo.

:: ── 2. 安装 / 更新依赖 ──────────────────────────────────────
echo [2/4] 安装依赖...
npm install --prefer-offline
if errorlevel 1 (
    echo.
    echo  [ERROR] npm install 失败。
    pause
    exit /b 1
)
echo  完成。
echo.

:: ── 3. 构建项目 ─────────────────────────────────────────────
echo [3/4] 构建项目 (tsc + vite build)...
npm run build
if errorlevel 1 (
    echo.
    echo  [ERROR] 构建失败，请查看上方错误信息。
    pause
    exit /b 1
)
echo  完成。
echo.

:: ── 4. 启动静态预览服务 ───────────────────────────────────────
echo [4/4] 启动服务，端口 %PORT%...
echo.
echo  本机访问:  http://localhost:%PORT%
echo  局域网访问: http://%COMPUTERNAME%:%PORT%
echo  (Ctrl+C 停止服务)
echo.

npx vite preview --host 0.0.0.0 --port %PORT%

:: 如果 vite 意外退出则停在这里，方便查看报错
echo.
echo  服务已停止。
pause
