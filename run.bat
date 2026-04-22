@echo off
echo ========================================
echo   Starting PawGuide Project
echo ========================================
echo.

REM Check if Python virtual environment exists
if not exist "backend\venv\Scripts\activate.bat" (
    echo Error: Python virtual environment not found!
    echo Please run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "frontend\node_modules" (
    echo Node modules not found. Installing dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo Starting Backend Server (Port 8000)...
start "PawGuide Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "PawGuide Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting...
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window (servers will continue running)...
pause >nul

