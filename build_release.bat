@echo off
echo ============================================================
echo   Lumina IDE v9.0 — Master Release Pipeline
echo ============================================================
echo.

python scripts\build_pipeline.py

echo.
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pipeline failed. Check logs above.
) else (
    echo [SUCCESS] Lumina-IDE-Setup.exe is ready in release/
)
echo.
pause
