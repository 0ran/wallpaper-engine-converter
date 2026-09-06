@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Wallpaper Engine Converter
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js and try again.
  pause
  exit /b 1
)
node server.js --open
if errorlevel 1 pause
