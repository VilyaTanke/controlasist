@echo off
title Sistema de Control - Iglesia Nueva Vida Soto del Real
chcp 65001 > nul
echo ===================================================================
echo   IGLESIA NUEVA VIDA DE SOTO DEL REAL
echo   Sistema de Control de Asistencia y Registro de Miembros / Nuevos
echo ===================================================================
echo.
echo Iniciando servidor local...
echo.

:: Abre el navegador automáticamente después de 2 segundos
start "" cmd /c "timeout /t 2 /nobreak > nul && start http://localhost:3005"

:: Inicia el servidor Node.js
node server/index.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Hubo un problema al iniciar el servidor.
    echo Asegúrate de tener Node.js instalado en tu equipo.
    pause
)

