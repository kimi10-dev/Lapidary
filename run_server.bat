@echo off
setlocal

cd /d "%~dp0"

echo Starting Lapidary on http://0.0.0.0:3000
echo Tailscale clients can connect with: http://%COMPUTERNAME%:3000
echo.

call npm run predev
if errorlevel 1 exit /b %errorlevel%

if exist "%~dp0node_modules\.bin\next.cmd" (
  call "%~dp0node_modules\.bin\next.cmd" build --webpack
  if errorlevel 1 exit /b %errorlevel%
  call "%~dp0node_modules\.bin\next.cmd" start -H 0.0.0.0 -p 3000
) else (
  call npx next build --webpack
  if errorlevel 1 exit /b %errorlevel%
  call npx next start -H 0.0.0.0 -p 3000
)
