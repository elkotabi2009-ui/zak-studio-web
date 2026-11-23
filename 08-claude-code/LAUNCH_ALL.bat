@echo off
REM ============================================================
REM LAUNCH ALL - ZAK Studio Web (UN SOLO COMANDO)
REM Copia cartella su Nemotron → Doppio click questo file
REM ============================================================

cd /d "%~dp0..\.."
set PROJECT_DIR=%CD%

title ZAK Studio Web - LAUNCH ALL

echo ╔══════════════════════════════════════════════════════════════╗
echo ║     ZAK STUDIO WEB - LAUNCH ALL (AUTOMAZIONE TOTALE)        ║
echo ║     Copia cartella su Nemotron → Doppio click questo file   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 1. Verifica Node/Python
node --version >nul 2>&1 || (echo ❌ Installa Node.js da nodejs.org & pause & exit /b 1)
python --version >nul 2>&1 || (echo ❌ Installa Python da python.org & pause & exit /b 1)
pip --version >nul 2>&1 || (echo ❌ Installa pip (python -m ensurepip) & pause & exit /b 1)

echo ✅ Prerequisiti OK
echo.

REM 2. Installa MCP server (una volta sola)
if not exist "%USERPROFILE%\.mcp_installed" (
    echo 📦 Installazione MCP server (2-3 min)...
    call 08-claude-code\install-mcp-servers.bat
    echo. > "%USERPROFILE%\.mcp_installed"
) else (
    echo ✅ MCP già installati
)

REM 3. Configura .env se manca
if not exist ".env" (
    echo.
    echo ═══════════════════════════════════════════════════════════════
    echo ⚠️  CONFIGURAZIONE INIZIALE - INCOLLA QUESTE 4 CHIAVI OBBLIGATORIE:
    echo ═══════════════════════════════════════════════════════════════
    echo.
    echo 1. AGENTMAIL_API_KEY     → Registrati GRATIS: https://agentmail.to
    echo 2. FIRECRAWL_API_KEY     → Registrati GRATIS (500 crediti): https://firecrawl.dev
    echo 3. NETLIFY_AUTH_TOKEN    → https://app.netlify.com/user/applications/personal → New access token
    echo 4. AGENTMAIL_WEBHOOK_SECRET → Genera: openssl rand -hex 32 (o premi INVIO per auto)
    echo.
    echo Premi INVIO per aprire i link nel browser...
    pause

    start "" https://agentmail.to
    start "" https://firecrawl.dev
    start "" https://app.netlify.com/user/applications/personal

    echo.
    echo Incolla i valori quando chiesto (nessun carattere speciale, solo la chiave):
    echo.

    set /p AGENTMAIL_API_KEY="AGENTMAIL_API_KEY: "
    if "%AGENTMAIL_API_KEY%"=="" echo ❌ Obbligatorio & pause & exit /b 1

    set /p FIRECRAWL_API_KEY="FIRECRAWL_API_KEY: "
    if "%FIRECRAWL_API_KEY%"=="" echo ❌ Obbligatorio & pause & exit /b 1

    set /p NETLIFY_AUTH_TOKEN="NETLIFY_AUTH_TOKEN: "
    if "%NETLIFY_AUTH_TOKEN%"=="" echo ❌ Obbligatorio & pause & exit /b 1

    set /p AGENTMAIL_WEBHOOK_SECRET="AGENTMAIL_WEBHOOK_SECRET (INVIO=auto): "
    if "%AGENTMAIL_WEBHOOK_SECRET%"=="" (
        powershell -Command "[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(32) | ForEach-Object { $hex += '{0:x2}' -f $_ } ; $hex" > .tmp_secret 2>nul
        set /p AGENTMAIL_WEBHOOK_SECRET= < .tmp_secret
        del .tmp_secret 2>nul
    )

    echo.
    echo ═══════════════════════════════════════════════════════════════
    echo ⚠️  OPZIONALI (premi INVIO per saltare):
    echo ═══════════════════════════════════════════════════════════════
    echo.

    set /p VERCEL_TOKEN="VERCEL_TOKEN: "
    set /p APIFY_API_TOKEN="APIFY_API_TOKEN: "
    set /p GOOGLE_SHEETS_CREDENTIALS="GOOGLE_SHEETS_CREDENTIALS (JSON 1 riga): "
    set /p CALENDLY_USERNAME="CALENDLY_USERNAME: "
    set /p ZEROBOUNCE_API_KEY="ZEROBOUNCE_API_KEY: "
    set /p PAGESPEED_API_KEY="PAGESPEED_API_KEY: "
    set /p COMPOSIO_API_KEY="COMPOSIO_API_KEY: "

    set /p UNSUB_SECRET="UNSUB_SECRET (INVIO=auto): "
    if "%UNSUB_SECRET%"=="" (
        powershell -Command "[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(32) | ForEach-Object { $hex += '{0:x2}' -f $_ } ; $hex" > .tmp_secret 2>nul
        set /p UNSUB_SECRET= < .tmp_secret
        del .tmp_secret 2>nul
    )

    REM Crea .env
    (
        echo AGENTMAIL_API_KEY=%AGENTMAIL_API_KEY%
        echo FIRECRAWL_API_KEY=%FIRECRAWL_API_KEY%
        echo NETLIFY_AUTH_TOKEN=%NETLIFY_AUTH_TOKEN%
        echo AGENTMAIL_WEBHOOK_SECRET=%AGENTMAIL_WEBHOOK_SECRET%
        echo UNSUB_SECRET=%UNSUB_SECRET%
        if not "%VERCEL_TOKEN%"=="" echo VERCEL_TOKEN=%VERCEL_TOKEN%
        if not "%APIFY_API_TOKEN%"=="" echo APIFY_API_TOKEN=%APIFY_API_TOKEN%
        if not "%GOOGLE_SHEETS_CREDENTIALS%"=="" echo GOOGLE_SHEETS_CREDENTIALS=%GOOGLE_SHEETS_CREDENTIALS%
        if not "%CALENDLY_USERNAME%"=="" echo CALENDLY_USERNAME=%CALENDLY_USERNAME%
        if not "%ZEROBOUNCE_API_KEY%"=="" echo ZEROBOUNCE_API_KEY=%ZEROBOUNCE_API_KEY%
        if not "%PAGESPEED_API_KEY%"=="" echo PAGESPEED_API_KEY=%PAGESPEED_API_KEY%
        if not "%COMPOSIO_API_KEY%"=="" echo COMPOSIO_API_KEY=%COMPOSIO_API_KEY%
    ) > .env

    echo ✅ .env creato
) else (
    echo ✅ .env già configurato
)

REM 4. Verifica file critici
echo.
echo 🔍 Verifica file critici...
set MISSING=0
for %%f in (
    "01-config\sender-profile.md"
    "01-config\icp-definition.md"
    "02-data\companies.csv"
    "03-sequences\sequence-master.json"
    "05-legal\legitimate-interest-assessment.md"
    "07-assets\cal-link.md"
) do (
    if not exist "%%f" (
        echo ⚠️ MANCANTE: %%f
        set MISSING=1
    )
)
if not exist "07-assets\case-studies\" (
    echo ⚠️ MANCANTE CARTELLA: 07-assets\case-studies\ (serve per proof nelle email)
    set MISSING=1
)
if %MISSING%==1 (
    echo.
    echo ❌ FILE CRITICI MANCANTI - Compilali PRIMA di continuare
    echo.
    echo Apri e compila ORA:
    echo   notepad 01-config\sender-profile.md
    echo   notepad 01-config\icp-definition.md
    echo   excel 02-data\companies.csv
    echo   notepad 07-assets\cal-link.md
    echo.
    echo Metti 3-5 PDF case study in 07-assets\case-studies\
    echo.
    pause
    exit /b 1
)

echo ✅ File critici OK

REM 5. Configura MCP in Claude Code
echo.
echo 🔧 Configurazione MCP in Claude Code...
claude mcp add playwright -- npx @playwright/mcp@latest 2>nul
claude mcp add firecrawl -- npx firecrawl-mcp 2>nul
claude mcp add agentmail -- npx @agentmail/mcp 2>nul
claude mcp add sheets -- npx @googleapis/mcp-sheets 2>nul
claude mcp add netlify -- npx netlify-cli mcp 2>nul
claude mcp add vercel -- npx vercel mcp 2>nul
claude mcp add composio -- npx @composio/mcp 2>nul
claude mcp add apify -- npx apify-cli mcp 2>nul
echo ✅ MCP registrati in Claude Code

REM 6. AVVIA PIPELINE AUTONOMO
echo.
echo ═══════════════════════════════════════════════════════════════
echo 🚀 AVVIO PIPELINE AUTONOMO - NON TOCCARE NULLA
echo ═══════════════════════════════════════════════════════════════
echo.
echo Il sistema ora esegue AUTONOMAMENTE:
echo   1. Apify → trova 200 aziende manifatturiere BS/BG/MI/VI/CR/MN/PD/VR
echo   2. Playwright + Firecrawl → analizza OGNI sito → pain_score + 4 hook + screenshot
echo   3. Genera demo live (Tier A/B) → deploy Netlify → URL demo univoco per lead
echo   4. Scrive 6 email personalizzate/lead (1200 totali) → analyzer score ≥80
echo   5. Invia batch 25/gg via AgentMail → tracking delivery/open/click/reply reale
echo   6. Webhook auto: bounce→suppression, reply→classificazione (interested/not/referral)
echo   7. Follow-up auto step 2-6 per chi non risponde (Day 4,9,16,25,35)
echo   8. Se reply=interested → pausa sequenza + notifica + crea deal + link Calendly
echo.
echo 📊 MONITORAGGIO: Apri Google Sheets "ZAK Tracking" tab "EmailLog" per metriche real-time
echo 📅 MEETING BOOKED: Controlla Calendly (link in 07-assets\cal-link.md)
echo.
echo ⚠️  PER FERMARE: Chiudi questa finestra (Ctrl+C)
echo.
echo Premi INVIO per INIZIARE ORA...
pause

REM Lancia pipeline Python (gira continuamente - modalità daily via cron)
python 08-claude-code\run-autonomous-pipeline.py full

echo.
echo Pipeline terminato. Controlla Google Sheets "EmailLog" e Calendly per meeting.
echo.
echo ═══════════════════════════════════════════════════════════════
echo 🎯 RISULTATO ATTESO: Meeting booked in Calendly
echo ═══════════════════════════════════════════════════════════════
pause