@echo off
setlocal
cd /d "%~dp0" || goto failed

echo ================================
echo Alhazmi - Upload all to main
echo ================================

git rev-parse --is-inside-work-tree >nul 2>&1 || goto not_repo
git fetch origin || goto failed
git switch main || goto failed
git add -A || goto failed

git diff --cached --quiet
if errorlevel 2 goto failed
if errorlevel 1 (
    git commit -m "Update complete Alhazmi project" || goto failed
) else (
    echo No new local changes to commit.
)

git pull --rebase origin main || goto failed
git push -u origin main || goto failed

echo.
echo SUCCESS: main is updated on GitHub.
git status
pause
exit /b 0

:not_repo
echo ERROR: Put this .bat file inside the alhazmi project folder (with .git).
goto failed

:failed
echo.
echo ERROR: Upload stopped. Check the message above.
echo Do not force push if there is a conflict.
pause
exit /b 1
