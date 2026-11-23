# RIEPILOGO COMPLETO — Progetto ZAK Studio Web
**Creato il: 2026-11-21 | Tutto pronto per esecuzione**

---

## 📁 STRUTTURA CARTELLA CREATA (`~/Desktop/progetto zak studio web/`)

```
progetto zak studio web/
├── 01-config/
│   ├── sender-profile.md                    ✅ Template da compilare (chi sei, offer, proof, KPI, email setup)
│   ├── icp-definition.md                    ✅ Template da compilare (200 aziende, trigger, pain, hook)
│   ├── legal-compliance.md                  ✅ Checklist GDPR/CAN-SPAM/DLgs 70/2003 completa
│   └── dns-setup-guide.md                   ✅ Guida DNS passo-passo (SPF/DKIM/DMARC + Warmup 5 settimane)
├── 02-data/
│   ├── companies.csv                        ✅ Template 200 righe (1 esempio + 9 vuote)
│   └── suppression-list.csv                 ✅ Opt-out, bounce, complaint (da mantenere)
├── 03-sequences/
│   └── sequence-master.json                 ✅ 6 email draft + config KPI + pivot triggers + compliance flags
├── 04-automation/
│   └── claude-prompts/
│       └── personalize-email.md             ✅ Prompt per batch 200 + script Python automazione
├── 05-legal/                                ✅ TUTTI TEMPLATE LEGALI PRONTI
│   ├── legitimate-interest-assessment.md    ✅ LIA Art. 6.1.f (3-part test WP217/EDPB)
│   ├── gdpr-ropa.md                         ✅ RoPA Art. 30 completo
│   ├── dsar-workflow.md                     ✅ DSAR Art. 15-22 (30gg SLA, step-by-step)
│   ├── breach-log.md                        ✅ Breach register Art. 33.5 (72h process, RCA, CAPA)
│   ├── processor-agreements.md              ✅ DPA Art. 28 tracker + template SCCs 2021
│   ├── unsubscribe-mechanism.md             ✅ One-click spec + codice HMAC + landing page
│   └── transfer-impact-assessment.md        ✅ TIA Schrems II per HubSpot, Apollo, Calendly, ZeroBounce
├── 06-operations/                           📁 Cartella vuota (popolata da handoff/weekly review)
├── 07-assets/
│   ├── case-studies/                        📁 DA CREARE: 3-5 PDF case study
│   ├── portfolio/                           📁 Link siti live
│   └── cal-link.md                          ✅ Calendly/Cal.com setup + UTM + CRM sync
└── 08-claude-code/
    ├── skills-manifest.md                   ✅ 7 skill core + facoltative + comandi batch
    ├── master-prompt.md                     ✅ COPIA-INCOLLA su Nemotron (STEP 1-7)
    ├── handoff.md                           ✅ Stato, prossimi step, credenziali, weekly review, pivot triggers
    ├── custom-skills/                       ✅ 4 SKILL.MD PERSONALIZZATE
    │   ├── lead-analyzer/SKILL.md           ✅ Analisi sito + pain score + hook + screenshot
    │   ├── web-demo-generator/SKILL.md      ✅ Demo live + deploy Netlify/Vercel + calculator
    │   ├── copywriter-b2b/SKILL.md          ✅ Email personalizzate + analyzer + angle rotation
    │   └── email-dispatcher/SKILL.md        ✅ Invio AgentMail/Resend + webhook + Sheets + classification
    ├── setup-nemotron.sh                    ✅ Script setup Linux/Mac per altro PC
    └── setup-nemotron.bat                   ✅ Script setup Windows per altro PC
```

---

## 🛠️ SKILL DA CARICARE SU NEMOTRON (In ordine)

### CORE (7 skill ufficiali Anthropic — carica PRIMA)
```bash
/skill cold-email
/skill email-sequence
/skill gdpr-audit-prep
/skill founder-marketing
/skill copywriting
/skill analytics-tracking
/skill content-strategy
```

### CUSTOM (4 skill create per te — carica DOPO le core)
```bash
/skill lead-analyzer
/skill web-demo-generator
/skill copywriter-b2b
/skill email-dispatcher
```

### FACOLTATIVE (se serve dopo)
```bash
/skill marketing-strategy-pmm
/skill competitive-teardown
/skill pricing-strategy
/skill sales-engineer
```

---

## ⚖️ LEGAL: CHECKLIST PRE-LANCIO (Tutto coperto)

| Requisito | File | Stato |
|-----------|------|-------|
| **Lawful Basis: Legitimate Interest (Art. 6.1.f)** | `05-legal/legitimate-interest-assessment.md` | ✅ Template 3-part test pronto |
| **LIA Documentato & Firmato** | `05-legal/legitimate-interest-assessment.md` | ✅ Da firmare |
| **RoPA Art. 30 Aggiornato** | `05-legal/gdpr-ropa.md` | ✅ Completo, aggiorna ≤90gg |
| **DPA Art. 28 Tutti Processori** | `05-legal/processor-agreements.md` | ✅ Tracker + template SCCs 2021 |
| **TIA Schrems II (HubSpot, Apollo, Calendly, ZeroBounce)** | `05-legal/transfer-impact-assessment.md` | ✅ Completati con supplementary measures |
| **Unsubscribe One-Click ≤24h** | `05-legal/unsubscribe-mechanism.md` | ✅ Spec + codice HMAC + landing page |
| **Footer Legale DLgs 70/2003** | `01-config/legal-compliance.md` + email template | ✅ In ogni email |
| **DSAR Workflow 30gg** | `05-legal/dsar-workflow.md` | ✅ Step-by-step + template log |
| **Breach Log + 72h Notification** | `05-legal/breach-log.md` | ✅ Processo completo + RCA + CAPA |
| **Suppression List Real-time** | `02-data/suppression-list.csv` + sync code | ✅ CSV + ESP + Sheets |
| **Email Verification (bounce <2%)** | `04-automation/claude-prompts/personalize-email.md` | ✅ ZeroBounce integrato |
| **Dominio Dedicato + Warmup** | `01-config/sender-profile.md` + `dns-setup-guide.md` | ✅ Da configurare |
| **SPF/DKIM/DMARC (p=reject finale)** | `01-config/dns-setup-guide.md` | ✅ Guida passo-passo |

**Legal Sign-off OBBLIGATORIO prima di inviare:**
```bash
# Su Nemotron, dopo aver caricato skill:
/skill gdpr-audit-prep
# Rispondi alle 6 DPO questions → deve uscire 🟢 DPA-READY
```

---

## 🚀 PIANO ESECUZIONE (30 Giorni)

### SETTIMANA 1 — Foundation + Legal (QUESTA SETTIMANA)
| Giorno | Azione | Output |
|--------|--------|--------|
| Oggi | Compila `sender-profile.md` + `icp-definition.md` + `companies.csv` (200 righe) | Config completa |
| Oggi | Compra `outreach.zakstudio.com` → Cloudflare DNS | Zona DNS attiva |
| Oggi | Crea record MX, SPF, DKIM, DMARC (`p=none`) | DNS propagato |
| Oggi | Setup AgentMail/Resend → verifica dominio | ESP "Verified" |
| Oggi | Deploy unsubscribe page (Vercel/Netlify) + test | `unsubscribe.zakstudio.com` funziona |
| Giorno 2 | mail-tester.com + mxtoolbox → fix errori | Score ≥ 9, tutti green |
| Giorno 3-7 | **WARMUP SETTIMANA 1** — 10 email/gg a contatti fidati che rispondono | Reply rate > 20% |

### SETTIMANA 2 — Sequenza + Assets
| Giorno | Azione |
|--------|--------|
| 8-14 | **WARMUP SETTIMANA 2** — 15 email/gg + primi cold Tier A |
| 8-10 | Crea 3-5 case study PDF in `07-assets/case-studies/` |
| 10-12 | Configura Calendly → link in `07-assets/cal-link.md` |
| 12-14 | Firme LIA, RoPA, DPA, TIA → Legal sign-off 🟢 |

### SETTIMANA 3 — Automazione
| Giorno | Azione |
|--------|--------|
| 15-21 | **WARMUP SETTIMANA 3** — 20 email/gg |
| 15-17 | Su Nemotron: esegui `setup-nemotron.bat` → carica skill → incolla `master-prompt.md` |
| 17-19 | STEP 1-3: Lead analysis → Demo generation → Email writing (batch 200) |
| 19-21 | STEP 4-5: Analyzer validation → Legal sign-off 🟢 |

### SETTIMANA 4 — Lancio + Iterazione
| Giorno | Azione |
|--------|--------|
| 22-28 | **WARMUP SETTIMANA 4** — 25 email/gg = LANCIO UFFICIALE |
| 22-24 | STEP 6-7: Dispatcher invio batch 20-30/gg → Daily monitoring → Weekly review |
| 25-28 | Pivot se metriche basse (subject line, angle, offer) |

---

## 🎯 KPI TARGET (Monitora Weekly)

| Metrica | Target | Se SOTTO → Azione |
|---------|--------|-------------------|
| **Open Rate** | ≥ 40% | Test 3 nuovi subject line per email sottoperformanti |
| **Reply Rate** | ≥ 8% | Rewrite angle/personalizzazione/CTA email con reply < 5% |
| **Meeting Booked** | ≥ 4/200 (2%) | Review offer/proof/CTA — considera `sales-engineer` skill |
| **Unsubscribe Rate** | < 1% | OK. > 2% → pausa, audit lista/offer/frequenza |
| **Bounce Rate** | < 2% | Re-verifica lista (ZeroBounce), rimuovi catch-all |
| **Spam Complaint** | < 0.1% | STOP IMMEDIATO, review tutto |

---

## 🔑 CREDENZIALI DA PREPARARE (Password Manager)

| Servizio | Cosa serve | Dove salvare |
|----------|------------|--------------|
| **AgentMail/Resend** | API Key, Webhook Secret, Inbox ID | `.env` + Password Manager |
| **Google Cloud** | PageSpeed API Key, Service Account JSON | `.env` + Password Manager |
| **Firecrawl** | API Key | `.env` |
| **ZeroBounce/MillionVerifier** | API Key + crediti | `.env` + Password Manager |
| **Netlify/Vercel** | Auth Token, Project ID | `.env` + Password Manager |
| **Cloudflare** | API Token (per DNS auto) | `.env` + Password Manager |
| **Google Sheets** | Service Account JSON (1 riga) | `.env` |
| **Calendly/Cal.com** | Username / URL + Webhook secret | `.env` |
| **UNSUB_SECRET** | `openssl rand -hex 32` | `.env` (non condividere!) |

---

## 📋 COSA DEVI FARE ORA (Su QUESTO PC)

### PRIORITÀ 1 — OGGI (Bloccanti)
```bash
# 1. Apri e compila AL 100%:
notepad "C:\Users\asus\Desktop\progetto zak studio web\01-config\sender-profile.md"
notepad "C:\Users\asus\Desktop\progetto zak studio web\01-config\icp-definition.md"

# 2. Popola il CSV con 200 aziende reali:
excel "C:\Users\asus\Desktop\progetto zak studio web\02-data\companies.csv"
# Colonne chiave: company_name, domain, decision_maker_name, decision_maker_title, 
# trigger_signal, pain_point_hypothesis, personalization_hook, sector, employees, revenue_est, location

# 3. Compra/configura dominio outreach.zakstudio.com → Cloudflare
# 4. Segui dns-setup-guide.md per SPF/DKIM/DMARC + warmup
```

### PRIORITÀ 2 — QUESTA SETTIMANA
- Deploy unsubscribe page (Vercel/Netlify) → test one-click
- Setup AgentMail/Resend → verifica dominio → test invio/ricezione
- Warmup settimane 1-2 (10-15 email/gg a contatti fidati che RISPONDONO)
- Crea 3 case study PDF + configura Calendly

### PRIORITÀ 3 — SU NEMOTRON (Quando pronto)
```bash
# Copia cartella progetto su Nemotron (USB/Cloud/Git)
# Su Nemotron:
cd "Desktop/progetto zak studio web"
./setup-nemotron.sh          # Linux/Mac
# OPPURE
setup-nemotron.bat           # Windows

# Poi in Claude Code su Nemotron:
# 1. Incolla comandi skill da skills-manifest.md
# 2. Incolla master-prompt.md come primo messaggio
# 3. Esegui STEP 1-7 in sequenza
```

---

## ⚠️ REALITY CHECK FINALE (Andreessen)

> **Market > Product > Team.** Hai 200 aziende — *chi sono ESATTAMENTE?* Se non sai dire "queste 200 hanno **questo problema specifico** che risolvo **meglio di chiunque** perché **X**", il cold email è l'ultimo dei problemi.

> **Product/Market Fit è l'unico milestone che conta.** Prima di automatizzare 200 email: **hai già chiuso 1-3 clienti a referenza/manuale?** Se no, fai quello. Il cold email scala *dopo* che sai vendere, non *per* imparare a vendere.

> **Bias to build, ma build the right thing.** Le skill e l'automazione sono leve. Se l'offer non converte, le leve amplificano lo zero.

---

## 📞 PROSSIMO PASSO CONCRETO

**Apri ORA `sender-profile.md` e `icp-definition.md` e compilali.**
Tutto il resto (skill, automazione, legal, DNS) è pronto — aspetta solo i TUOI DATI.

```bash
start notepad "C:\Users\asus\Desktop\progetto zak studio web\01-config\sender-profile.md"
start notepad "C:\Users\asus\Desktop\progetto zak studio web\01-config\icp-definition.md"
start excel "C:\Users\asus\Desktop\progetto zak studio web\02-data\companies.csv"
```

**Il mercato premia chi esegue. Non chi pianifica all'infinito. 🚀**