@echo off
echo Starting CSIS backend (FastAPI on port 8000)...
start "CSIS Backend" cmd /k "cd /d %~dp0 && uvicorn app_fastapi:app --host 127.0.0.1 --port 8000"

echo Starting CSIS frontend (port 5173)...
start "CSIS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting.
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:5173
echo.
pause
