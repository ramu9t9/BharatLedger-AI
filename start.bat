@echo off
REM BharatLedger AI - Start backend + frontend
REM Double-click to run, or: start.bat

cd /d "%~dp0"

REM Try py launcher first (Windows), then python
py start.py
if %ERRORLEVEL% neq 0 python start.py
if %ERRORLEVEL% neq 0 pause
