@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo   CoachAI - AI Customer Support Coaching Assistant
echo ============================================================
echo.

if exist ".venv\Scripts\activate.bat" (
    call ".venv\Scripts\activate.bat"
) else (
    echo [!] No .venv found - using system Python instead.
    echo     Run: python -m venv .venv  &&  pip install -r requirements.txt
    echo.
)

if not exist ".env" (
    echo [!] No .env file found - the app will run in fallback mode without a Groq API key.
    echo     Copy .env.example to .env and add GROQ_API_KEY to enable live LLM responses.
    echo.
)

python run.py

endlocal
pause
