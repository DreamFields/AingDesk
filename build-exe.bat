@echo off
setlocal enabledelayedexpansion

REM ======================================================
REM AingDesk Windows EXE Build Script
REM Usage:
REM   build-exe.bat            -> build NSIS installer (.exe)
REM   build-exe.bat portable   -> build portable (.exe)
REM ======================================================

cd /d "%~dp0"

echo [1/5] Checking Node.js environment...
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js first.
  exit /b 1
)

echo [2/5] Checking package manager...
where yarn >nul 2>nul
if %errorlevel%==0 (
  set PKG_MGR=yarn
  set INSTALL_CMD=yarn install
  set BUILD_INSTALLER_CMD=yarn build-w
  set BUILD_PORTABLE_CMD=yarn build-we
) else (
  set PKG_MGR=npm
  set INSTALL_CMD=npm install
  set BUILD_INSTALLER_CMD=npm run build-w
  set BUILD_PORTABLE_CMD=npm run build-we
)

echo [INFO] Using package manager: %PKG_MGR%

echo [3/5] Installing dependencies...
call %INSTALL_CMD%
if errorlevel 1 (
  echo [ERROR] Dependency installation failed.
  exit /b 1
)

echo [4/5] Building EXE package...
if /i "%~1"=="portable" (
  echo [INFO] Mode: portable
  call %BUILD_PORTABLE_CMD%
) else (
  echo [INFO] Mode: installer ^(nsis^)
  call %BUILD_INSTALLER_CMD%
)

if errorlevel 1 (
  echo [ERROR] Build failed.
  exit /b 1
)

echo [5/5] Verifying output artifacts...
set FOUND_EXE=
for %%F in ("out\*.exe") do (
  set FOUND_EXE=1
)
if not defined FOUND_EXE (
  echo [ERROR] No EXE artifact found in out\
  exit /b 1
)

echo [OK] Build completed successfully.
echo [INFO] Output directory: out\
dir /b out

echo.
echo Done.
if /i not "%~2"=="nopause" (
  echo Press any key to exit.
  pause >nul
)
endlocal
