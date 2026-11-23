@echo off
REM ============================================================
REM INSTALLAZIONE MCP SERVER PER AUTOMAZIONE TOTALE
REM Esegui come Administrator su Nemotron PC
REM ============================================================

echo 🚀 INSTALLAZIONE MCP SERVER - ZAK Studio Web
echo ============================================================

REM Verifica prerequisiti
echo 📋 Verifica prerequisiti...
node --version >nul 2>&1 && echo ✅ Node.js installato || (echo ❌ Node.js MANCANTE - installa da nodejs.org & pause & exit /b 1)
npm --version >nul 2>&1 && echo ✅ npm installato || (echo ❌ npm MANCANTE & pause & exit /b 1)
python --version >nul 2>&1 && echo ✅ Python installato || (echo ❌ Python MANCANTE - installa da python.org & pause & exit /b 1)
pip --version >nul 2>&1 && echo ✅ pip installato || (echo ❌ pip MANCANTE & pause & exit /b 1)

echo.
echo 📦 INSTALLAZIONE MCP SERVER...
echo.

REM ============================================================
REM 1. PLAYWRIGHT MCP - Browser automation (analisi siti, screenshot)
REM ============================================================
echo [1/8] Playwright MCP...
npm install -g @playwright/mcp@latest
playwright install chromium
echo ✅ Playwright MCP installato
echo.

REM ============================================================
REM 2. FIRECRAWL MCP - Web scraping affidabile (lead generation)
REM ============================================================
echo [2/8] Firecrawl MCP...
npm install -g firecrawl-mcp
echo ✅ Firecrawl MCP installato
echo.

REM ============================================================
REM 3. AGENTMAIL MCP - Email sending/receiving/webhooks
REM ============================================================
echo [3/8] AgentMail MCP...
npm install -g @agentmail/mcp
echo ✅ AgentMail MCP installato
echo.

REM ============================================================
REM 4. GOOGLE SHEETS MCP - Tracking automatico lead
REM ============================================================
echo [4/8] Google Sheets MCP...
npm install -g @googleapis/mcp-sheets
echo ✅ Google Sheets MCP installato
echo.

REM ============================================================
REM 5. NETLIFY MCP - Deploy demo automatico
REM ============================================================
echo [5/8] Netlify MCP...
npm install -g netlify-cli
echo ✅ Netlify CLI installato (MCP via CLI)
echo.

REM ============================================================
REM 6. VERCEL MCP - Deploy alternativo / unsubscribe page
REM ============================================================
echo [6/8] Vercel MCP...
npm install -g vercel
echo ✅ Vercel CLI installato
echo.

REM ============================================================
REM 7. COMPOSIO MCP - Gateway 1000+ app (backup se altri falliscono)
REM ============================================================
echo [7/8] Composio MCP...
npm install -g @composio/mcp
echo ✅ Composio MCP installato
echo.

REM ============================================================
REM 8. APIFY MCP - Scraping enterprise (Google Maps, LinkedIn, fiere)
REM ============================================================
echo [8/8] Apify MCP...
npm install -g apify-cli
echo ✅ Apify CLI installato
echo.

echo.
echo ============================================================
echo ✅ TUTTI MCP SERVER INSTALLATI
echo ============================================================
echo.
echo 🔧 ORA CONFIGURA CLAUDE CODE PER USARE GLI MCP:
echo.
echo "1. Apri Claude Code:"
echo "   claude"
echo.
echo "2. Aggiungi gli MCP server (copia-incolla uno per volta):"
echo.
echo "   claude mcp add playwright -- npx @playwright/mcp@latest"
echo "   claude mcp add firecrawl -- npx firecrawl-mcp"
echo "   claude mcp add agentmail -- npx @agentmail/mcp"
echo "   claude mcp add sheets -- npx @googleapis/mcp-sheets"
echo "   claude mcp add netlify -- npx netlify-cli mcp"
echo "   claude mcp add vercel -- npx vercel mcp"
echo "   claude mcp add composio -- npx @composio/mcp"
echo "   claude mcp add apify -- npx apify-cli mcp"
echo.
echo "3. Verifica che siano connessi:"
echo "   claude mcp list"
echo.
echo "📋 DOPO - CONFIGURA CREDENZIALI (vedi file .env):"
echo "   - AGENTMAIL_API_KEY (da agentmail.to)"
echo "   - FIRECRAWL_API_KEY (da firecrawl.dev)"
echo "   - GOOGLE_SHEETS_CREDENTIALS (Service Account JSON)"
echo "   - NETLIFY_AUTH_TOKEN (da netlify.com)"
echo "   - VERCEL_TOKEN (da vercel.com)"
echo "   - APIFY_API_TOKEN (da apify.com)"
echo "   - COMPOSIO_API_KEY (da composio.dev)"
echo.
echo "🎯 POI - USA LE SKILL CUSTOM CHE GIÀ HAI:"
echo "   /skill lead-analyzer     (usa Playwright + Firecrawl)"
echo "   /skill web-demo-generator (usa Netlify/Vercel)"
echo "   /skill copywriter-b2b    (usa dati lead-analyzer)"
echo "   /skill email-dispatcher  (usa AgentMail + Sheets)"
echo.
pause