@echo off
REM ============================================================
REM SETUP NEMOTRON PC (Windows) — Progetto ZAK Studio Web
REM Esegui come Administrator: setup-nemotron.bat
REM ============================================================

set PROJECT_DIR=%USERPROFILE%\Desktop\progetto zak studio web
set SKILLS_DIR=%USERPROFILE%\.claude\skills

echo 🚀 SETUP NEMOTRON (Windows) — Progetto ZAK Studio Web
echo =====================================================

REM 1. Verifica struttura progetto
if not exist "%PROJECT_DIR%" (
    echo ❌ Cartella progetto non trovata: %PROJECT_DIR%
    echo    Copia la cartella 'progetto zak studio web' da questo PC (USB, cloud, git)
    pause
    exit /b 1
)
echo ✅ Progetto trovato: %PROJECT_DIR%

REM 2. Crea directory skills
if not exist "%SKILLS_DIR%" mkdir "%SKILLS_DIR%"

REM 3. Installa skill ufficiali Anthropic (skill-creator)
echo 📦 Installazione anthropics/skills (skill-creator)...
cd /d %USERPROFILE%
if not exist "anthropics-skills" (
    git clone https://github.com/anthropics/skills.git anthropics-skills
)
cd anthropics-skills
REM Nota: claude plugin install richiede Claude Code CLI installato

REM 4. Copia skill custom
echo 📋 Copia 4 skill custom...
for %%s in (lead-analyzer web-demo-generator copywriter-b2b email-dispatcher) do (
    set "SRC=%PROJECT_DIR%\08-claude-code\custom-skills\%%s"
    set "DST=%SKILLS_DIR%\%%s"
    if exist "!SRC!" (
        xcopy "!SRC!" "!DST!" /E /I /Y /Q >nul
        echo    ✅ %%s copiato
    ) else (
        echo    ⚠️ %%s non trovato in !SRC!
    )
)

REM 5. Installa dipendenze Python
echo 🐍 Installazione dipendenze Python...
cd /d "%PROJECT_DIR%"

REM Crea requirements.txt
(
echo # lead-analyzer
echo playwright==1.40.0
echo firecrawl-py==0.1.0
echo requests==2.31.0
echo lxml==4.9.3
echo cssselect==1.2.0
echo.
echo # web-demo-generator
echo jinja2==3.1.2
echo.
echo # copywriter-b2b
echo pyyaml==6.0.1
echo email-validator==2.1.0
echo.
echo # email-dispatcher
echo httpx==0.25.2
echo fastapi==0.109.0
echo uvicorn==0.27.0
echo google-api-python-client==2.100.0
echo google-auth==2.28.0
echo.
echo # Common
echo python-dotenv==1.0.0
echo pytest==7.4.0
) > requirements.txt

pip3 install -r requirements.txt

REM Installa Playwright browsers
playwright install chromium

REM 6. Installa CLI esterni (richiede Node.js/npm)
echo 🔧 Installazione CLI esterni...
npm install -g netlify-cli vercel @agentmail/cli 2>nul || echo ⚠️ Alcuni CLI richiedono installazione manuale

REM 7. Crea .env.template
echo 🔐 Creazione file .env.template...
(
echo # ============================================================
echo # COPIA QUESTO FILE IN .env E COMPILA TUTTI I VALORI
echo # ============================================================
echo.
echo # --- ESP (AgentMail consigliato) ---
echo AGENTMAIL_API_KEY=your_agentmail_api_key_here
echo AGENTMAIL_WEBHOOK_SECRET=your_webhook_secret_here
echo AGENTMAIL_INBOX_ID=outreach-zakstudio
echo.
echo # --- Alternativa Resend ---
echo RESEND_API_KEY=re_xxxxxxxxxxxxx
echo.
echo # --- DNS / Dominio ---
echo OUTREACH_DOMAIN=outreach.zakstudio.com
echo SENDER_EMAIL=mario.rossi@outreach.zakstudio.com
echo SENDER_NAME="Mario Rossi - ZAK Studio Web"
echo.
echo # --- Unsubscribe ---
echo UNSUB_SECRET=GENERA_CON_OPENSSL_RAND_HEX_32
echo UNSUB_BASE_URL=https://unsubscribe.zakstudio.com
echo.
echo # --- Google Sheets (Service Account JSON in una riga) ---
echo GOOGLE_SHEETS_CREDENTIALS=INCOLLA_JSON_SERVICE_ACCOUNT_QUI
echo GOOGLE_SHEETS_TRACKING_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
echo GOOGLE_SHEETS_SUPPRESSION_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
echo.
echo # --- API Esterne ---
echo PAGESPEED_API_KEY=your_google_pagespeed_api_key
echo FIRECRAWL_API_KEY=your_firecrawl_api_key
echo ZEROBOUNCE_API_KEY=your_zerobounce_api_key
echo.
echo # --- Calendly/Cal.com ---
echo CALENDLY_USERNAME=tuo-username
echo.
echo # --- Webhook URLs (dopo deploy) ---
echo WEBHOOK_BASE_URL=https://api.tuodominio.com/webhooks
) > "%PROJECT_DIR%\.env.template"

REM 8. Verifica file critici
echo.
echo =====================================================
echo ✅ SETUP COMPLETATO
echo =====================================================
echo.
echo FILE CRITICI DA COMPILARE PRIMA DI LANCIARE:
echo    1. %PROJECT_DIR%\01-config\sender-profile.md
echo    2. %PROJECT_DIR%\01-config\icp-definition.md
echo    3. %PROJECT_DIR%\02-data\companies.csv (200 righe!)
echo    4. %PROJECT_DIR%\.env (copia da .env.template e compila)
echo    5. %PROJECT_DIR%\05-legal\legitimate-interest-assessment.md (firma)
echo    6. %PROJECT_DIR%\05-legal\gdpr-ropa.md (aggiorna)
echo    7. %PROJECT_DIR%\07-assets\case-studies\ (3-5 PDF)
echo    8. %PROJECT_DIR%\07-assets\cal-link.md (configura Calendly)
echo.
echo PROSSIMI PASSI:
echo.
echo 1. COMPILA I FILE CRITICI (vedi sopra)
echo.
echo 2. CONFIGURA DNS + WARMUP (5 settimane!):
echo    Segui: %PROJECT_DIR%\01-config\dns-setup-guide.md
echo.
echo 3. AVVIA CLAUDE CODE E CARICA SKILL:
echo    cd %PROJECT_DIR%
echo    claude
echo    # Poi incolla questi comandi uno per volta:
echo    /skill cold-email
echo    /skill email-sequence
echo    /skill gdpr-audit-prep
echo    /skill founder-marketing
echo    /skill copywriting
echo    /skill analytics-tracking
echo    /skill content-strategy
echo    /skill lead-analyzer
echo    /skill web-demo-generator
echo    /skill copywriter-b2b
echo    /skill email-dispatcher
echo.
echo 4. INCOLLA MASTER PROMPT:
echo    type %PROJECT_DIR%\08-claude-code\master-prompt.md
echo    # Copia tutto e incolla come primo messaggio in Claude Code
echo.
echo 5. ESEGUI STEP 1-7 DEL MASTER PROMPT IN SEQUENZA
echo.
echo 📚 DOCUMENTAZIONE CHIAVE:
echo    - Master Prompt: %PROJECT_DIR%\08-claude-code\master-prompt.md
echo    - Handoff: %PROJECT_DIR%\08-claude-code\handoff.md
echo    - DNS Guide: %PROJECT_DIR%\01-config\dns-setup-guide.md
echo    - Skills Manifest: %PROJECT_DIR%\08-claude-code\skills-manifest.md
echo.
echo 🎯 TARGET: 200 email, ≥4 meeting, ≥8% reply, <1% unsubscribe
echo.
echo Buon lavoro! Il mercato premia chi esegue. 🚀
echo.
pause