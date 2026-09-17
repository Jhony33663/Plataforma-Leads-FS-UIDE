@echo off
title UIDE FS-Platform - Asesor Educativo
echo ========================================================
echo   UIDE FS-Platform - Asesor Educativo (Fuera de Sede)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Iniciando con Node.js en http://localhost:8080 ...
    start http://localhost:8080
    node server.js
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Iniciando con Python en http://localhost:8080 ...
    start http://localhost:8080
    python -m http.server 8080
    goto end
)

echo Abriendo directamente en tu navegador predeterminado...
start "" "%~dp0index.html"

:end
pause
