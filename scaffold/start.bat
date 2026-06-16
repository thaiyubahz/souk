@echo off
REM ── Zaryah+ frontend launcher (Windows) ───────────────────────
REM Double-click this file (or run `start.bat`) to launch the dev server.
cd /d "%~dp0"

echo Installing dependencies (first run only)...
if not exist "node_modules" (
  call npm install
)

echo.
echo Starting Zaryah+ dev server...
echo Open the URL it prints (usually http://localhost:5173) and go to /ai-assistant
echo Press Ctrl+C to stop.
echo.

call npm run dev
pause
