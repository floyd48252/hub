@echo off
cd /d "%~dp0"
echo Starting Industrial, Commercial ^& Domestic Cleaning Solutions server...
echo.
echo Server will be available at: http://localhost:8080/
echo.
echo Opening your browser now...
echo.
start "" python -m http.server 8080
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/"
echo Server launched. If the browser does not open, visit http://localhost:8080/ manually.
echo To stop the server, close the Python server window.