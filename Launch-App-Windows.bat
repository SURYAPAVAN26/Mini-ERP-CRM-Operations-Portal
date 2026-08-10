@echo off
title NEXUS OPERA - 1-Click Server Launcher
echo ========================================================
echo NEXUS OPERA | Wholesale ERP & CRM Operations Portal
echo Launching server and opening portal in browser...
echo ========================================================

cd /d "%~dp0backend"
start http://localhost:5000/
npm start
