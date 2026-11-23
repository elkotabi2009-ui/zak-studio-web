#!/usr/bin/env bash
# ============================================================
# SETUP NEMOTRON PC — Progetto ZAK Studio Web
# Esegui su quel PC:  chmod +x setup-nemotron.sh && ./setup-nemotron.sh
# ============================================================

set -euo pipefail

PROJECT_DIR="$HOME/Desktop/progetto zak studio web"
SKILLS_DIR="$HOME/.claude/skills"

echo "🚀 SETUP NEMOTRON — Progetto ZAK Studio Web"
echo "============================================="

# 1. Verifica struttura progetto
if [[ ! -d "$PROJECT_DIR" ]]; then
    echo "❌ Cartella progetto non trovata: $PROJECT_DIR"
    echo "   Copia la cartella 'progetto zak studio web' da questo PC (USB, cloud, git)"
    exit 1
fi
echo "✅ Progetto trovato: $PROJECT_DIR"

# 2. Crea directory skills se non esiste
mkdir -p "$SKILLS_DIR"

# 3. Installa skill ufficiali Anthropic (per skill-creator)
echo "📦 Installazione anthropics/skills (skill-creator)..."
cd "$HOME"
if [[ ! -d "anthropics-skills" ]]; then
    git clone https://github.com/anthropics/skills.git anthropics-skills
fi
cd anthropics-skills
# Installa skill-creator (ti permette di generare skill custom)
if command -v claude &> /dev/null; then
    claude plugin install ./skill-creator 2>/dev/null || echo "⚠️ Skill-creator install manuale richiesto"
fi

# 4. Copia skill custom nel .claude/skills
echo "📋 Copia 4 skill custom..."
CUSTOM_SKILLS=("lead-analyzer" "web-demo-generator" "copywriter-b2b" "email-dispatcher")
for skill in "${CUSTOM_SKILLS[@]}"; do
    src="$PROJECT_DIR/08-claude-code/custom-skills/$skill"
    dst="$SKILLS_DIR/$skill"
    if [[ -d "$src" ]]; then
        cp -r "$src" "$dst"
        echo "   ✅ $skill copiato"
    else
        echo "   ⚠️ $skill non trovato in $src"
    fi
done

# 5. Installa dipendenze Python per skill
echo "🐍 Installazione dipendenze Python..."
cd "$PROJECT_DIR"

# Crea requirements.txt aggregato
cat > requirements.txt << 'EOF'
# lead-analyzer
playwright==1.40.0
firecrawl-py==0.1.0
requests==2.31.0
lxml==4.9.3
cssselect==1.2.0

# web-demo-generator
jinja2==3.1.2
netlify-cli==17.0.0
vercel==32.0.0

# copywriter-b2b
pyyaml==6.0.1
email-validator==2.1.0

# email-dispatcher
httpx==0.25.2
fastapi==0.109.0
uvicorn==0.27.0
google-api-python-client==2.100.0
google-auth==2.28.0
pyyaml==6.0.1

# Common
python-dotenv==1.0.0
pytest==7.4.0
EOF

pip3 install -r requirements.txt

# Installa Playwright browsers
playwright install chromium

# 6. Installa CLI esterni (Netlify, Vercel, AgentMail)
echo "🔧 Installazione CLI esterni..."
npm install -g netlify-cli vercel @agentmail/cli 2>/dev/null || echo "⚠️ Alcuni CLI richiedono installazione manuale"

# 7. Configura variabili ambiente (template)
echo "🔐 Creazione file .env.template..."
cat > "$PROJECT_DIR/.env.template" << 'EOF'
# ============================================================
# COPIA QUESTO FILE IN .env E COMPILA TUTTI I VALORI
# ============================================================

# --- ESP (AgentMail consigliato) ---
AGENTMAIL_API_KEY=your_agentmail_api_key_here
AGENTMAIL_WEBHOOK_SECRET=your_webhook_secret_here
AGENTMAIL_INBOX_ID=outreach-zakstudio

# --- Alternativa Resend ---
RESEND_API_KEY=re_xxxxxxxxxxxxx

# --- DNS / Dominio ---
OUTREACH_DOMAIN=outreach.zakstudio.com
SENDER_EMAIL=mario.rossi@outreach.zakstudio.com
SENDER_NAME="Mario Rossi — ZAK Studio Web"

# --- Unsubscribe ---
UNSUB_SECRET=$(openssl rand -hex 32)  # Genera e incolla qui
UNSUB_BASE_URL=https://unsubscribe.zakstudio.com

# --- Google Sheets (Service Account JSON in una riga) ---
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/...%40...iam.gserviceaccount.com"}
GOOGLE_SHEETS_TRACKING_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_SHEETS_SUPPRESSION_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz

# --- API Esterne ---
PAGESPEED_API_KEY=your_google_pagespeed_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
ZEROBOUNCE_API_KEY=your_zerobounce_api_key

# --- Calendly/Cal.com ---
CALENDLY_USERNAME=tuo-username
# o CALCOM_URL=https://cal.com/tuo-username

# --- Webhook URLs (dopo deploy) ---
WEBHOOK_BASE_URL=https://api.tuodominio.com/webhooks
EOF

# 8. Verifica file critici da compilare
echo ""
echo "📋 FILE CRITICI DA COMPILARE PRIMA DI LANCIARE:"
echo "   1. $PROJECT_DIR/01-config/sender-profile.md"
echo "   2. $PROJECT_DIR/01-config/icp-definition.md"
echo "   3. $PROJECT_DIR/02-data/companies.csv (200 righe!)"
echo "   4. $PROJECT_DIR/.env (copia da .env.template e compila)"
echo "   5. $PROJECT_DIR/05-legal/legitimate-interest-assessment.md (firma)"
echo "   6. $PROJECT_DIR/05-legal/gdpr-ropa.md (aggiorna)"
echo "   7. $PROJECT_DIR/07-assets/case-studies/ (3-5 PDF)"
echo "   8. $PROJECT_DIR/07-assets/cal-link.md (configura Calendly)"

# 9. Istruzioni finali
echo ""
echo "============================================="
echo "✅ SETUP COMPLETATO"
echo "============================================="
echo ""
echo "PROSSIMI PASSI SU NEMOTRON:"
echo ""
echo "1. COMPILA I FILE CRITICI (vedi sopra)"
echo ""
echo "2. CONFIGURA DNS + WARMUP (5 settimane!):"
echo "   Segui: $PROJECT_DIR/01-config/dns-setup-guide.md"
echo ""
echo "3. AVVIA CLAUDE CODE E CARICA SKILL:"
echo "   cd $PROJECT_DIR"
echo "   claude"
echo "   # Poi incolla questi comandi uno per volta:"
echo "   /skill cold-email"
echo "   /skill email-sequence"
echo "   /skill gdpr-audit-prep"
echo "   /skill founder-marketing"
echo "   /skill copywriting"
echo "   /skill analytics-tracking"
echo "   /skill content-strategy"
echo "   /skill lead-analyzer"
echo "   /skill web-demo-generator"
echo "   /skill copywriter-b2b"
echo "   /skill email-dispatcher"
echo ""
echo "4. INCOLLA MASTER PROMPT:"
echo "   cat $PROJECT_DIR/08-claude-code/master-prompt.md"
echo "   # Copia tutto e incolla come primo messaggio in Claude Code"
echo ""
echo "5. ESEGUI STEP 1-7 DEL MASTER PROMPT IN SEQUENZA"
echo ""
echo "📚 DOCUMENTAZIONE CHIAVE:"
echo "   - Master Prompt: $PROJECT_DIR/08-claude-code/master-prompt.md"
echo "   - Handoff: $PROJECT_DIR/08-claude-code/handoff.md"
echo "   - DNS Guide: $PROJECT_DIR/01-config/dns-setup-guide.md"
echo "   - Skills Manifest: $PROJECT_DIR/08-claude-code/skills-manifest.md"
echo ""
echo "🎯 TARGET: 200 email, ≥4 meeting, ≥8% reply, <1% unsubscribe"
echo ""
echo "Buon lavoro! Il mercato premia chi esegue. 🚀"