@echo off
title Gestor ESA - IPTV Control
cd /d "%~dp0"

echo ============================================
echo   INICIANDO GESTOR ESA (IPTV CONTROL)
echo ============================================
echo.

:: Se nao existir node_modules, instala
if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)

echo Iniciando servidor (DEV)...
start "" http://localhost:3000
npm run dev

pause