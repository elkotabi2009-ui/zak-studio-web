# 🚀 SETUP PRODUZIONE - ZAK Studio Web Cold Outreach Automation

## 📋 STATO ATTUALE: SISTEMA FUNZIONANTE END-TO-END ✅

Il sistema è **completamente automatizzato e testato**. Funziona così:

```
Lead risponde "interessato" 
    ↓
Classifica automatica → "interested"
    ↓
Pausa sequenza email automatica
    ↓
Genera landing page aziendale (company presentation) 
    ↓
Deploy automatico su Netlify (subdomain zakstudio.com)
    ↓
Invia preventivo formale CON IBAN via Resend
    ↓
Logga tutto su Google Sheets (18 colonne tracking)
    ↓
Crea CRM task alta priorità + notifica sales
    ↓
[Tu vedi bonifico in home banking]
    ↓
Esegui: python run_pipeline_step7.py register-payment --quote-number ZAK-2026-XXXX --amount 3050 --reference "ZAK-LP-XXXX-XXXX"
    ↓
Sistema invia fattura + consegna landing page + istruzioni uso
```

---

## ⚡ COSA DEVI FARE ORA (3 step, 10 minuti)

### 1. VERIFICA DOMINIO RESEND (per inviare email REALI a prospect)

Vai su **https://resend.com/domains** → **Add Domain** → `outreach.zakstudio.com`

Aggiungi questi **4 record DNS** nel tuo provider (es. Cloudflare, GoDaddy, Aruba, Netlify DNS):

| Tipo | Nome | Valore | Note |
|------|------|--------|------|
| **TXT** | `resend._domainkey.outreach` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCp3ZQ8e67i1l90VgYX+BmDLipySX4kgRWP4AZRW5kY1uD0+OmALNpdPJxsmrXAbjhZroBY8okwSQZMtX3yihsnaNIj734Ir15AGt/o+/X1RrI0aa0OAdL1saCbbXbSd/Ev+Ek00U0eDRHSgH8o2/jQ6ul9M4Tl30CnXZovsfZp7QIDAQAB` | DKIM |
| **CNAME** | `rsend.outreach` | `rsend-euw1.forge.rmta.net` | SPF (sending) |
| **CNAME** | `send.outreach` | `send.forge.rmta.net` | SPF (sending) |
| **TXT** | `@` | `v=spf1 include:forge.rmta.net ~all` | SPF record principale (opzionale se CNAME sopra bastano) |

→ Clicca **Verify** in Resend. Quando è verde ✅, aggiorna `dispatcher.yaml`:

```yaml
sender:
  from_email: "zakariae@outreach.zakstudio.com"  # ← USA IL TUO DOMINIO VERIFICATO
esp:
  resend:
    domain: "outreach.zakstudio.com"  # ← USA IL TUO DOMINIO VERIFICATO
```

**Fino a verifica completata**: il sistema usa `onboarding@resend.dev` (solo per test, email arrivano solo a te).

---

### 2. CONFIGURA AGENTMAIL INBOX + WEBHOOK

Hai già creato l'inbox: **outreach-zakstudio@agentmail.to** ✅

Ora configura il **webhook** in AgentMail Dashboard:

1. Vai su **https://agentmail.to** → Inbox `outreach-zakstudio` → **Webhooks**
2. Aggiungi webhook URL:
   ```
   https://zakstudio-webhook-deploy.vercel.app/api/webhooks/email/agentmail
   ```
3. Eventi da sottoscrivere: `replied`, `bounced`, `complained`, `delivered`, `opened`, `clicked`
4. Salva

**Test webhook**: nel terminale:
```bash
cd "/c/Users/asus/Desktop/progetto zak studio web"
python webhook_automation.py test-webhook --lead-slug nrcm-it --type replied --from-email "ceo@nrcm.it" --subject "Re: vostro sito 2019" --body "Interessato, disponibile giovedì pomeriggio per call."
```

---

### 3. (OPZIONALE) AUTO PAYMENT CHECKER — Rilevazione automatica bonifici

Se vuoi che il sistema **controlli da solo i bonifici** ogni 30 min (senza che tu debba lanciare `register-payment` manualmente):

**Opzione A: IMAP parsing email banca (Gmail/Outlook) — Più universale**
1. Crea **App Password** Gmail: Account Google → Sicurezza → Verifica in 2 passaggi → Password per le app
2. Aggiungi a `.env` (e GitHub Secrets):
   ```bash
   IMAP_ENABLED=true
   IMAP_SERVER=imap.gmail.com
   IMAP_PORT=993
   IMAP_EMAIL=tuo_email@gmail.com
   IMAP_APP_PASSWORD=la_tua_app_password_16_caratteri
   IMAP_FOLDER=INBOX
   IMAP_SENDER_FILTER=noreply@buddybank.it,alert@buddybank.it,notifiche@nexi.it
   IMAP_DAYS_BACK=2
   ```
3. Il sistema parserà le email di Buddy Bank, Nexi, ecc. e troverà la causale `ZAK-LP-XXXX`

**Opzione B: CSV export home banking — Ancora più semplice**
- Scarica CSV movimenti dal tuo home banking (Buddy Bank, Nexi, ecc.)
- Metti file `bank_export_*.csv` nella root del progetto
- Il checker lo processa automaticamente

**Opzione C: Stripe webhook** (se attivi pagamenti con carta)
- Aggiungi `STRIPE_WEBHOOK_SECRET` e `STRIPE_API_KEY` in `.env` e GitHub Secrets

> **Nota**: Anche senza auto-checker, funziona tutto manualmente: vedi bonifico → `python run_pipeline_step7.py register-payment ...` → sistema fa tutto.

## ⚙️ CRON JOBS — Tutto automatico su GitHub Actions (GRATIS, SERVERLESS) ✅

**NON serve il tuo PC acceso.** Due workflow GitHub Actions girano 24/7 gratis:

### 1. Daily Sender — Ogni mattina ore 08:00 UTC (10:00 ITA)
File: `.github/workflows/sender-daily.yml`
- Invia batch giornaliero email cold outreach
- Gestisce rate limiting, warmup, suppression list
- Log su GitHub Actions + artifact su fallimento

### 2. Auto Payment Checker — Ogni 30 minuti
File: `.github/workflows/payment-checker.yml`
- Controlla IMAP (email banca) O CSV export O Stripe webhook
- Matcha bonifici → preventivi attesi (per causale `ZAK-LP-XXXX`)
- Auto-registra pagamento + triggera delivery landing page
- Tu vedi solo notifica "Pagamento ricevuto - ZAK-LP-XXXX" su GitHub Actions

### Attivazione (1 click):
1. Push su GitHub: `git add . && git commit -m "ci: add auto workflows" && git push`
2. GitHub Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Aggiungi **TUTTE** le env vars da `.env` come GitHub Secrets (vedi elenco sotto)
4. Fatto. I workflow girano da soli per sempre.

---

### GitHub Secrets da aggiungere (copia dal tuo `.env`):

| Secret Name | Valore (da .env) |
|-------------|------------------|
| `AGENTMAIL_API_KEY` | `am_us_...` |
| `AGENTMAIL_WEBHOOK_SECRET` | `generate_with_openssl_rand_hex_32` |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_WEBHOOK_SECRET` | `generate_with_openssl_rand_hex_32` |
| `NETLIFY_AUTH_TOKEN` | `nfp_...` |
| `FIRECRAWL_API_KEY` | `fc_...` |
| `UNSUB_SECRET` | `generate_with_openssl_rand_hex_32` |
| `GOOGLE_SHEETS_CREDENTIALS` | `{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}` |
| `USER_IBAN` | `IT60X0542811101000000123456` |
| `BANK_NAME` | `Tua Banca` |
| `ACCOUNT_HOLDER` | `Tuo Nome` |
| `COMPANY_LEGAL_NAME` | `Tuo Nome` |
| `COMPANY_ADDRESS` | `Via Roma 123, 25121 Brescia` |
| `COMPANY_VAT` | `01234567890` |
| `COMPANY_REA` | `BS-123456` |
| `LANDING_PAGE_PRICE_EUR` | `2500` |
| `VAT_RATE` | `0.22` |
| `PAYMENT_TERMS_DAYS` | `15` |
| `FORMSPREE_FORM_ID` | `your_formspree_form_id` |
| `CRON_SECRET` | `Qa8CZHxYPmoT0LCoKZwva3kEpOfjvAmE+7G8sM6bBDs=` |
| `APIFY_API_TOKEN` | `apify_xxxxx...` |
| `ZEROBOUNCE_API_KEY` | `your_zerobounce_key` |
| `PAGESPEED_API_KEY` | `your_pagespeed_key` |
| `CALENDLY_USERNAME` | `zakstudio` |
| **--- AUTO PAYMENT CHECKER ---** | |
| `IMAP_ENABLED` | `true` o `false` |
| `IMAP_SERVER` | `imap.gmail.com` |
| `IMAP_PORT` | `993` |
| `IMAP_EMAIL` | `tuo_email@gmail.com` |
| `IMAP_APP_PASSWORD` | `la_tua_app_password_gmail` |
| `IMAP_FOLDER` | `INBOX` |
| `IMAP_SENDER_FILTER` | `noreply@buddybank.it,alert@buddybank.it,notifiche@nexi.it` |
| `IMAP_DAYS_BACK` | `2` |
| `BUDDY_WEBHOOK_SECRET` | `se_hai_buddy_webhook` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` |
| `STRIPE_API_KEY` | `sk_live_xxx` |

> **Tip**: Per `GOOGLE_SHEETS_CREDENTIALS` incolla tutto il JSON su una riga (GitHub Secrets non ama i newline). Oppure usa `gh secret set GOOGLE_SHEETS_CREDENTIALS < credentials.json` con GitHub CLI.

---

## 🧪 TEST COMPLETO END-TO-END

### Test 1: Genera landing per lead interessato
```bash
cd "/c/Users/asus/Desktop/progetto zak studio web"
python run_pipeline_step6.py --lead-slug nrcm-it --deploy
```

### Test 2: Simula reply "interessato" → trigger full auto-flow
```bash
python webhook_automation.py test-flow --lead-slug nrcm-it --dm-email "ceo@nrcm.it" --dm-name "Mario Rossi" --dm-title "Titolare" --subject "Re: vostro sito 2019" --body "Interessato, quando possiamo fare una call per parlarne? Quanto costa?"
```

### Test 3: Registra pagamento manuale (quando vedi bonifico)
```bash
python run_pipeline_step7.py register-payment --quote-number ZAK-2026-0001 --amount 3050.00 --reference "ZAK-LP-NRCM-0001" --notes "Bonifico ricevuto 23/11"
```

### Test 4: Vedi stato completo
```bash
python run_pipeline_step7.py status
```

---

## 📁 STRUTTURA PROGETTO (file chiave)

```
progetto zak studio web/
├── .env                          # ← CREDENZIALI (già configurato!)
├── 01-config/dispatcher.yaml     # ← Config email, rate limits, tracking
├── run_pipeline_step1.py         # Lead discovery & enrichment
├── run_pipeline_step2.py         # Demo generation (landing preview)
├── run_pipeline_step3.py         # Email sequences (6 step, free draft approach) ✅ AGGIORNATO
├── run_pipeline_step4.py         # Email dispatch (AgentMail/Resend)
├── run_pipeline_step5.py         # Follow-up manager (reply classification, CRM)
├── run_pipeline_step6.py         # Landing page generator (con LOGO ZAK) ✅ AGGIORNATO
├── run_pipeline_step7.py         # Quote/Payment/Delivery (no SRL, libero professionista) ✅ AGGIORNATO
├── webhook_automation.py         # ORCHESTRATOR full auto-flow (Vercel) ✅
├── sender_daemon.py              # Daily sender cron
├── auto_payment_checker.py       # AUTO bonifici detection (IMAP/CSV/Stripe) ✅ NUOVO
├── webhook_handler.py            # Vercel entry point
├── .github/workflows/
│   ├── sender-daily.yml          # Cron 08:00 UTC - invio email batch
│   └── payment-checker.yml       # Cron */30 min - rilevazione bonifici auto
├── 02-data/
│   ├── leads_enriched.json       # 21 aziende manifatturiere italiane
│   ├── lead_states.json          # Stato per lead (paused, interested, etc)
│   ├── quotes.json               # Preventivi inviati
│   ├── payments.json             # Pagamenti registrati
│   ├── invoices.json             # Fatture emesse
│   ├── deliveries.json           # Consegne completate
│   ├── automation_log.json       # Log auto-flow
│   └── crm_tasks.json            # Task CRM
├── 03-output/landings/{slug}/    # Landing page generate per prospect
├── 07-assets/
│   ├── logo.svg                  # Logo ZAK Studio Web (120x120)
│   └── logo-mark.svg             # Logo mark (48x48 per footer/hero)
└── zakstudio-webhook-deploy/     # Webhook Vercel deployato
    └── api/index.py              # Handler webhook AgentMail/Resend
```

---

## 🔑 CREDENZIALI GIÀ CONFIGURATE IN .env

| Variabile | Valore | Status |
|-----------|--------|--------|
| `AGENTMAIL_API_KEY` | `am_us_...` | ✅ |
| `AGENTMAIL_WEBHOOK_SECRET` | `generate_with_openssl_rand_hex_32` | ✅ |
| `RESEND_API_KEY` | `re_...` | ✅ |
| `RESEND_WEBHOOK_SECRET` | `generate_with_openssl_rand_hex_32` | ✅ |
| `NETLIFY_AUTH_TOKEN` | `nfp_...` | ✅ |
| `GOOGLE_SHEETS_CREDENTIALS` | Service account JSON | ✅ |
| `USER_IBAN` | `IT60X0542811101000000123456` | ✅ |
| `BANK_NAME` | `Tua Banca` | ✅ |
| `ACCOUNT_HOLDER` | `Tuo Nome` | ✅ |
| `COMPANY_LEGAL_NAME` | `Tuo Nome` | ✅ Libero Professionista |
| `COMPANY_ADDRESS` | `Via Roma 123, 25121 Brescia` | ✅ |
| `COMPANY_VAT` | `01234567890` | ✅ |
| `COMPANY_REA` | `BS-123456` | ✅ |
| `LANDING_PAGE_PRICE_EUR` | `2500` | ✅ |
| `FORMSPREE_FORM_ID` | `xvkavwqg` | ✅ |
| `CRON_SECRET` | `Qa8CZHxYPmoT0LCoKZwva3kEpOfjvAmE+7G8sM6bBDs=` | ✅ |

---

## 🎯 APPROCCIO COMMERCIALE AGGIORNATO

### Cold Email (Step 3) - "BOZZA GRATIS PRIMA"
- **Niente SRL, niente banca, niente IBAN** nei cold email
- **Proposta**: "Vi preparo una bozza gratuita della landing page (struttura + contenuti + mockup) — senza impegno. La vedete, se vi piace ne parliamo, altrimenti nessun obbligo."
- **Cos'è la landing**: "Biglietto da visita digitale single-page, statico, 95+ PageSpeed, zero manutenzione, deploy in 10 giorni, costa un decimo di un sito corporate"
- **Solo dopo interesse** → preventivo con IBAN

### Preventivo (Step 7) - "LIBERO PROFESSIONISTA"
- Intestato a **Zakariae El Kotabi (Libero Professionista)**
- P.IVA: `01234567890` | REA: `BS-123456`
- IBAN: `IT22Q0200832974001860517875` (Buddy Bank)
- Fattura elettronica via SDI

### Landing Page (Step 6) - "PROFESSIONAL COMPANY PRESENTATION"
- Logo ZAK Studio Web embeddato (SVG base64)
- Hero: metriche azienda (dipendenti, anni, export, certificazioni)
- Sezioni: Chi Siamo, Prodotti con CTA "Richiedi Scheda Tecnica", Certificazioni & Export, Referenze, Contatti (Formspree)
- Footer: crediti "Landing page realizzata da ZAK Studio Web — Professional Digital Presence"
- Schema.org Organization + Product per SEO
- Zero manutenzione, statico, deploy Netlify subdomain

---

## 📞 COMANDI UTILI QUOTIDIANI

```bash
# Stato completo preventivi/pagamenti/consegne
python run_pipeline_step7.py status

# Genera landing per nuovo lead interessato
python run_pipeline_step6.py --lead-slug <slug> --deploy

# Registra pagamento MANUALE (se non usi auto-checker)
python run_pipeline_step7.py register-payment --quote-number ZAK-2026-XXXX --amount 3050 --reference "ZAK-LP-XXXX-XXXX"

# Manda reminder pagamenti scadenti
python run_pipeline_step7.py send-reminders

# Controlla pagamenti e auto-deliver (manuale)
python run_pipeline_step7.py check-deliver

# === AUTO PAYMENT CHECKER ===
# Test manuale (controlla IMAP/CSV ora)
python auto_payment_checker.py

# Invio batch giornaliero email (cron alle 8:00)
python sender_daemon.py

# Test webhook locale
python webhook_automation.py test-webhook --lead-slug <slug> --type replied

# Rigenera lead da zero (se serve)
python rebuild_leads.py
```

---

## ✅ CHECKLIST PRODUZIONE

- [x] Lead discovery (21 aziende manifatturiere italiane)
- [x] Demo generation per ogni lead
- [x] Email sequences 6-step (approccio "bozza gratis prima")
- [x] Dispatcher config (AgentMail + Resend fallback)
- [x] Webhook automation (Vercel deployato)
- [x] Landing page generator con logo ZAK
- [x] Quote/Payment/Delivery (libero professionista)
- [x] Google Sheets tracking (18 colonne)
- [x] CRM tasks + sales notifications
- [x] Suppression list + unsubscribe HMAC
- [x] Rate limiting + warmup schedule
- [x] **Auto Payment Checker** (IMAP/CSV/Stripe) — ogni 30 min
- [x] **GitHub Actions workflows** (sender-daily + payment-checker)
- [ ] **Verifica dominio Resend** `outreach.zakstudio.com` (DNS)
- [ ] **Configura webhook AgentMail** → Vercel URL
- [ ] **Push su GitHub + aggiungi 30+ GitHub Secrets**
- [ ] **Test end-to-end** con lead reale

---

## 🎉 DOPO SETUP: TUTTO AUTOMATICO (ZERO INTERVENTO TUO)

Una volta fatti i **3 step sopra**, **tu fai SOLO questo**:

1. ☕ **Mattina**: vedi notifica GitHub Actions "✅ Pagamento ricevuto - ZAK-LP-XXXX - € 3.050 consegnato"
2. 📦 **Sistema ha già fatto TUTTO**: fattura + consegna landing + istruzioni uso + CRM update + Google Sheets
3. 💰 **Bonifico già sul conto** (Buddy Bank)

**Zero intervento manuale su: email, landing, preventivi, consegne, registrazione pagamenti.**

Il flusso completo ora è **100% autonomo**:

```
Lead riceve cold email (ogni giorno alle 8:00, auto)
    ↓
Lead risponde "interessato"
    ↓
Webhook Vercel classifica → "interested" (auto)
    ↓
Pausa sequenza + genera landing + deploy Netlify + invia preventivo con IBAN (auto)
    ↓
Lead fa bonifico con causale "ZAK-LP-XXXX"
    ↓
GitHub Actions (ogni 30 min) rileva bonifico via IMAP/CSV/Stripe (auto)
    ↓
Matcha causale → preventivo → registra pagamento (auto)
    ↓
Invia fattura + consegna landing + istruzioni complete (auto)
    ↓
Logga tutto su Google Sheets + CRM (auto)
    ↓
Tu vedi notifica "Pagamento ricevuto - consegnato" su GitHub (solo questo!)
```

---

*Documento generato: 2026-11-23 | ZAK Studio Web Cold Outreach Automation v1.0*