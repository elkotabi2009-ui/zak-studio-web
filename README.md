# ZAK Studio Web - Autonomous B2B Cold Email Outreach System

A fully autonomous system for selling web design services to Italian manufacturing companies. Provide only email credentials and payment - everything else runs automatically.

## 🎯 What It Does

1. **Lead Discovery** → Finds 200+ Italian manufacturing companies via Apify/Firecrawl
2. **Site Analysis** → Analyzes each company's website (Playwright) → pain_score + 4 hooks + screenshot
3. **Demo Generation** → Creates personalized Next.js demo sites (4 angles) → deploys to Netlify/Vercel
4. **Email Sequences** → Writes 6-email sequences per lead (Trigger→Pain→Proof→Ask) → validates via lead-analyzer
5. **Email Dispatch** → Sends via AgentMail with rate limiting, warmup, tracking, suppression
6. **Payment Processing** → Stripe webhooks + bank transfer matching (IBAN) → auto-generates contracts
7. **Site Delivery** → Payment → Build → Deploy → Credentials handoff → fully automated
8. **Post-Delivery** → Training, health checks, upsells, referrals, renewals → perpetual loop

## 🏗 Architecture

```
progetto zak studio web/
├── 01-config/                 # Configuration templates
│   ├── sender-profile.md      # Your identity, offer, proof points
│   ├── icp-definition.md      # Ideal Customer Profile strategy
│   ├── dns-setup-guide.md     # DNS records for outreach domain
│   └── formal-proposal-template.md
├── 02-data/
│   └── companies.csv          # 200 target companies (fill this)
├── 03-sequences/
│   └── sequence-master.json   # 6-email sequence template
├── 05-legal/                  # GDPR/Italian compliance templates (7 docs)
├── 07-assets/                 # Calendly setup, contract template
├── 08-claude-code/            # Core engine (TypeScript)
│   ├── custom-skills/         # 5 custom Claude Code skills
│   │   ├── lead-analyzer/     # Site analysis → pain_score + hooks
│   │   ├── web-demo-generator/ # Demo site generation + deploy
│   │   ├── copywriter-b2b/    # 6-email sequences per lead
│   │   ├── email-dispatcher/  # AgentMail send + webhooks
│   │   └── proposal-writer/   # Formal proposals + contracts
│   ├── dispatch-engine/       # Email queue, tracking, warmup
│   ├── payment-engine/        # Stripe, bank matching, PDFs, emails
│   ├── delivery-pipeline/     # Site build, deploy, credentials
│   ├── vercel-webhooks/       # AgentMail webhook endpoints
│   ├── master-orchestrator/   # Perpetual loop coordinator
│   ├── mcp-config.json        # MCP server mapping
│   ├── run-autonomous-pipeline.py # Python orchestrator
│   ├── godmode.ps1            # Original launcher
│   └── ZAK_LAUNCH.ps1         # Complete launch script
├── 09-site-builder/           # Next.js 14 + Ghost CMS template
│   └── manufacturing-nextjs/  # Complete manufacturing site template
└── config/
    └── master-config.json     # Complete system configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git
- Claude Code CLI (`npm i -g @anthropic-ai/claude-code`)

### 1. Clone & Configure
```bash
cd progetto-zak-studio-web
cp .env.example .env
# Edit .env with YOUR credentials (see Required Vars below)
```

### 2. Required Environment Variables
Edit `.env` with these **minimum** values:
```bash
AGENTMAIL_API_KEY=your_agentmail_key
FIRECRAWL_API_KEY=your_firecrawl_key
NETLIFY_AUTH_TOKEN=your_netlify_token
UNSUB_SECRET=openssl rand -hex 32
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEETS_TRACKING_ID=your_sheet_id
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Fill Your Data
```bash
# Edit these files with your info:
01-config/sender-profile.md      # Your company, offer, proof points
01-config/icp-definition.md      # Your targeting criteria
02-data/companies.csv            # Your 200 target companies
03-sequences/sequence-master.json # Your email sequence
```

### 4. Launch Everything
```powershell
# Windows PowerShell (run as Administrator recommended)
powershell -ExecutionPolicy Bypass -File 08-claude-code/ZAK_LAUNCH.ps1
```

That's it! The script will:
1. ✅ Check prerequisites
2. ✅ Install all dependencies (npm + Python)
3. ✅ Install & register 10 MCP servers with Claude Code
4. ✅ Copy 5 custom skills to `~/.claude/skills/`
5. ✅ Build the Next.js site template
5. ✅ Deploy Vercel webhooks
6. ✅ Validate configuration
7. 🚀 **Launch the Master Orchestrator** (perpetual autonomous loop)

## 🔧 Manual Component Usage

### Run Individual Phases
```bash
# In Claude Code (after loading skills with /skill)
> import { masterOrchestrator } from './08-claude-code/master-orchestrator/master-orchestrator';
> await masterOrchestrator.triggerPhase('lead_discovery');
> await masterOrchestrator.triggerPhase('analysis');
> await masterOrchestrator.triggerPhase('demo_generation');
> await masterOrchestrator.triggerPhase('email_dispatch');
> await masterOrchestrator.triggerPhase('payment_processing');
> await masterOrchestrator.triggerPhase('delivery');
> await masterOrchestrator.triggerPhase('post_delivery');
```

### Run Python Pipeline (Alternative)
```bash
cd 08-claude-code
python run-autonomous-pipeline.py --step analyze
python run-autonomous-pipeline.py --step demo
python run-autonomous-pipeline.py --step write
python run-autonomous-pipeline.py --step dispatch
```

### Check System Health
```bash
# In orchestrator
> const health = await masterOrchestrator.checkSystemHealth();
> console.log(health);
```

## 📊 Tracking (Google Sheets)

The system uses a Google Sheet with 8 tabs:
- **Leads** - Company data + pain_score + hooks
- **EmailLog** - Every email sent/opened/clicked/replied
- **Suppression** - Unsubscribes, bounces, complaints
- **Demos** - Demo generation status + URLs
- **Deals** - Pipeline status (8-column Kanban)
- **Payments** - Stripe + bank transfer records
- **Deliveries** - Site deployment + credentials
- **OrchestratorLog** - System events + errors

## ⚖️ Legal Compliance (GDPR + Italian Law)

All templates in `05-legal/`:
- **LIA Template** - Legitimate Interest Assessment (WP217/EDPB 3-part test)
- **RoPA Template** - Register of Processing Activities (Art. 30)
- **DSAR Template** - Data Subject Access Request workflow
- **Breach Template** - 72hr notification procedure
- **DPA Tracker** - Data Processing Agreement register
- **Unsubscribe Template** - HMAC one-click landing page
- **TIA Template** - Transfer Impact Assessment (Schrems II)

## 🔐 Security

- **HMAC-signed unsubscribe links** (timestamp + email + trackingId)
- **AgentMail webhook verification** (x-webhook-signature)
- **Stripe webhook signature verification**
- **Rate limiting** per domain (warmup schedule: 5 weeks)
- **Suppression list** auto-sync (bounces, complaints, unsubscribes)
- **SPF/DKIM/DMARC** progressive policy (none → quarantine → reject)

## 📈 Scaling

The system is designed to scale to **billions** of emails:
- Horizontal dispatch workers (queue-based)
- Database-backed state (Google Sheets → PostgreSQL migration ready)
- Kubernetes-ready deployment configs
- Multi-region Netlify/Vercel deployments
- Redis caching layer for queue/rate-limiting

## 🛠 Customization

### Add New Email Angles
Edit `03-sequences/sequence-master.json` - add angles to sequence steps

### Add New Demo Templates
Edit `08-claude-code/custom-skills/web-demo-generator/templates/`

### Modify Legal Templates
Edit `05-legal/*.md` - all GDPR/Italian law compliant

### Change Target Sector
Update `01-config/icp-definition.md` + `02-data/companies.csv`

## 📁 Key Files to Customize

| File | Purpose |
|------|---------|
| `01-config/sender-profile.md` | Your identity, offer, proof points |
| `02-data/companies.csv` | Your 200 target companies |
| `03-sequences/sequence-master.json` | 6-email sequence template |
| `.env` | All API credentials |
| `config/master-config.json` | System-wide configuration |

## 🆘 Troubleshooting

### "Claude Code skills not loading"
```bash
# In Claude Code terminal:
/skill lead-analyzer
/skill web-demo-generator
/skill copywriter-b2b
/skill email-dispatcher
/skill proposal-writer
```

### "MCP servers not connecting"
```bash
# Re-register:
claude mcp remove playwright
claude mcp add playwright npx @modelcontextprotocol/server-playwright
```

### "Emails not sending"
- Check AgentMail dashboard for quota
- Verify domain warmup status (5 weeks)
- Check suppression list in Google Sheets

### "Deployments failing"
- Verify Netlify/Vercel tokens in `.env`
- Check build logs in deployment dashboard
- Ensure site template builds locally: `cd 09-site-builder/manufacturing-nextjs && npm run build`

## 📝 License

Proprietary - ZAK Studio Web

---

**Built with**: Next.js 14, TypeScript, AgentMail, Firecrawl, Playwright, Netlify, Vercel, Ghost CMS, Stripe, Google Sheets, Node.js, Python

**One command to rule them all**: `powershell -ExecutionPolicy Bypass -File 08-claude-code/ZAK_LAUNCH.ps1`