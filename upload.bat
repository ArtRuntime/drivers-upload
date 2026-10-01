@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   ArtRuntime Drivers Upload Tool
echo ===================================================

cd /d "%~dp0"

echo [1/3] Updating files-data.js index...
node update-index.js
if errorlevel 1 (
    echo [ERROR] Failed to run update-index.js
    pause
    exit /b 1
)

set COMMIT_MSG=%*
if "%COMMIT_MSG%"=="" set /p COMMIT_MSG="Enter commit message (or press enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update drivers and binaries

echo [2/3] Staging and committing changes...
git add .
git commit -m "%COMMIT_MSG%"

echo [3/3] Pushing to GitHub (origin main)...
git push origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. If GitHub asks for login, authenticate with your ArtRuntime account or Personal Access Token (PAT).
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Upload complete! Drivers synced with GitHub.
pause
