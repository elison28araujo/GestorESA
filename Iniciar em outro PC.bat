@echo off
title GestorESA - Iniciando...
cd /d "%~dp0"

echo =====================================
echo   INICIANDO GESTOR ESA
echo =====================================
echo.

if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)

echo Iniciando servidor...
npm run dev

pause