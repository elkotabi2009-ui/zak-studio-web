# HANDOFF — Progetto ZAK Studio Web
**Per passaggio sessione / altro PC / team member. Stato al: 2026-11-21**

---

## 📍 STATO ATTUALE

| Area | Status | Dettaglio |
|------|--------|-----------|
| **Struttura cartelle** | ✅ Creato | `~/Desktop/progetto zak studio web/` con 01-08 |
| **Sender Profile** | 📝 Template pronto | `01-config/sender-profile.md` — DA COMPILARE 100% |
| **ICP Definition** | 📝 Template pronto | `01-config/icp-definition.md` + `02-data/companies.csv` — DA COMPILARE 200 righe |
| **Legal Compliance** | 📝 Template pronti | `01-config/legal-compliance.md` + `05-legal/*` (LIA, RoPA, DSAR, Breach, DPA, Unsubscribe) — DA COMPLETARE PRIMA LANCIO |
| **Sequenza Email** | 📝 Template JSON | `03-sequences/sequence-master.json` — 6 email draft, DA PERSONALIZZARE E SCOrare |
| **Automation Prompts** | ✅ Pronto | `04-automation/claude-prompts/personalize-email.md` — Per batch 200 |
| **Assets** | 📁 Cartelle vuote | `07-assets/case-studies/`, `portfolio/` — DA CREARE 3-5 case study PDF |
| **Calendly/Cal.com** | 📝 Template | `07-assets/cal-link.md` — DA CONFIGURARE |
| **Skill Manifest** | ✅ Pronto | `08-claude-code/skills-manifest.md` — Per altro PC |
| **Master Prompt** | ✅ Pronto | `08-claude-code/master-prompt.md` — Copia-incolla su altro PC |

---

## ✅ PROSSIME AZIONI (In ordine prioritario)

### PRIMA DI TUTTO (Bloccanti per lancio)
1. **Compila `sender-profile.md`** — Chi sei, offer, 3 proof points VERI, KPI, email setup
2. **Compila `icp-definition.md` + `companies.csv`** — 200 aziende con trigger, pain, hook univoci
3. **Setup dominio `outreach.zakstudio.com`** — SPF/DKIM/DMARC + warmup 4-6 settimane
4. **Completa `05-legal/*`** — LIA, RoPA, DPA firmati, DSAR workflow, breach log, unsubscribe mechanism
5. **Crea 3 case study PDF** — In `07-assets/case-studies/` (reali o onesti "basati su best practice")
6. **Configura Calendly/Cal.com** — Link in `07-assets/cal-link.md`
7. **Legal Sign-off** — Run `gdpr-audit-prep` 6 DPO questions → 🟢 DPA-READY

### DOPO (Esecuzione su altro PC Nemotron)
8. **Copia cartella progetto** su altro PC (USB, cloud, git)
9. **Carica skill** via `skills-manifest.md` (7 comandi core)
10. **Incolla `master-prompt.md`** come primo messaggio su altro PC
11. **Esegui STEP 1-7** del master prompt in sequenza
12. **Lancia batch 20-30/giorno** via ESP API
13. **Monitora daily** → **Weekly review** → **Pivot se metriche basse**

---

## 🔑 CREDENZIALI / ACCESSI NECESSARI (Da preparare)

| Servizio | Cosa serve | Dove salvare credenziali |
|----------|------------|--------------------------|
| **ESP** (Resend/SendGrid/Customer.io) | API Key, Domain verified, Suppression list API | Password manager / `.env` su altro PC |
| **CRM** (HubSpot/Pipedrive/Attio) | API Key, Pipeline configurata, Custom fields | Password manager |
| **Email Verification** (ZeroBounce/MillionVerifier) | API Key, Crediti sufficienti (200+ verifiche) | Password manager |
| **Enrichment** (Apollo/Hunter/Lusha) | API Key, Crediti per 200 contatti | Password manager |
| **Calendar** (Calendly/Cal.com) | Link booking, Event type 15 min discovery | `07-assets/cal-link.md` |
| **Domain/DNS** | Accesso pannello DNS per SPF/DKIM/DMARC | Registrar (Cloudflare/Namecheap/GoDaddy) |
| **Hosting Unsubscribe** (Vercel/Netlify/CF Pages) | Deploy static page, env vars (UNSUB_SECRET) | Git repo + deploy platform |
| **Analytics** (GA4/Plausible/Matomo) | Measurement ID, UTM tracking | `analytics-tracking` skill output |

---

## 📊 MONITORAGGIO GIORNALIERO (Checklist 10 min/mattina)

| Azione | Tool | Soglia Alert |
|--------|------|--------------|
| Controlla invii andati (ESP dashboard) | ESP | Bounce > 2% → pausa, verifica lista |
| Controlla unsubscribe (suppression list) | CSV + ESP | Unsub rate > 2% → pausa, review |
| Controlla spam complaints (FBL) | ESP | > 0.1% → STOP IMMEDIATO |
| Controlla reply (inbox + CRM) | Email client / CRM | Classifica: interested / not / referral / unsub |
| Rispondi a interested/referral | Email | < 2h per massimizzare conversione |
| Log meeting booked | CRM / Calendly | Target: 4/200 (2%) |
| Aggiorna `dsar-log.csv` se richieste | `05-legal/dsar-workflow.md` | SLA 30gg |

---

## 📅 WEEKLY REVIEW (Venerdì 30 min)

| Metrica | Target | Se SOTTO target → Azione |
|---------|--------|-------------------------|
| **Open Rate** | ≥ 40% | Test 3 nuovi subject line per email sottoperformanti |
| **Reply Rate** | ≥ 8% | Rewrite angle/personalizzazione/CTA email con reply < 5% |
| **Meeting Booked** | ≥ 4/200 (2%) | Review offer/proof/CTA — considera `sales-engineer` skill |
| **Unsubscribe Rate** | < 1% | OK. > 2% → pausa, audit lista/offer/frequenza |
| **Bounce Rate** | < 2% | Re-verifica lista (ZeroBounce), rimuovi catch-all |
| **Pipeline Value** | €[TARGET] | Se basso → più volume o better qualification |

**Template Weekly Review** (salva in `06-operations/weekly-review-YYYY-MM-DD.md`):
```markdown
# Weekly Review — Week of YYYY-MM-DD

## Metriche
| Metrica | Questa Settimana | Target | Delta |
|---------|------------------|--------|-------|
| Inviate | | 200 (totale) | |
| Open Rate | | ≥ 40% | |
| Reply Rate | | ≥ 8% | |
| Meeting Booked | | ≥ 4 | |
| Unsubscribe | | < 1% | |
| Bounce | | < 2% | |

## Top 3 Insights
1. [Es. "Subject line 'vostro sito 2019' 52% open vs 'quick question' 38%"]
2. [Es. "Reply rate email 3 (insight) 12% vs email 2 (case study) 6%"]
3. [Es. "3 meeting booked da referral ask (email 5) — angle funziona"]

## Azioni Prossima Settimana
- [ ] Test nuovi subject line per email 1, 4
- [ ] Rewrite email 2 case study — angle troppo generico
- [ ] Aumenta personalizzazione hook per settore chimica
- [ ] Verifica 50 contatti bounce con ZeroBounce

## Blocker / Aiuto Serve
- [ ] Legal: DPA HubSpot non ancora firmato
- [ ] Tech: Unsubscribe page deploy su Vercel pending
- [ ] Assets: Case study Metalpress PDF non pronto
```

---

## 🔄 PIVOT TRIGGERS (Decisioni automatiche)

| Condizione | Azione Automatica | Chi Decide |
|------------|-------------------|------------|
| **Open rate < 30% per 2 settimane** | Pause invii → Test 3 subject line variants/email → Resume con vincitore | Tu / Founder |
| **Reply rate < 5% per 2 settimane** | Rewrite email 1 + 2 con nuovi angle (pain diverso, proof diverso) | Tu + `cold-email` skill |
| **Meeting rate < 1% (2/200)** | Review offer: pricing, packaging, proof points → `pricing-strategy` + `sales-engineer` | Tu + Advisor |
| **Unsubscribe > 2%** | STOP invii → Audit lista (fonte, verifica, ICP fit) → Re-qualifica o cambia ICP | Tu + Legal |
| **Spam complaint > 0.1%** | STOP IMMEDIATO → Full audit: dominio, lista, contenuto, footer, unsubscribe | Tu + Legal + ESP Support |
| **Bounce > 5%** | STOP invii → Full re-verifica lista ZeroBounce → Rimuovi tutti catch-all/risky | Tu + Tech |

---

## 🛠️ SKILL DA RICARICARE SU NUOVA SESSIONE

```
/skill cold-email
/skill email-sequence
/skill gdpr-audit-prep
/skill founder-marketing
/skill copywriting
/skill analytics-tracking
/skill content-strategy
```

Poi facoltative se serve:
```
/skill marketing-strategy-pmm
/skill competitive-teardown
/skill pricing-strategy
/skill sales-engineer
```

---

## 📞 CONTATTI CHIAVE

| Ruolo | Nome | Contatto | Note |
|-------|------|----------|------|
| **Founder / Titolare** | [Tuo Nome] | [Email] / [Tel] | Decision maker finale |
| **DPO / Privacy** | [Nome / Esterno] | [Email] / [Tel] | GDPR, DSAR, Breach |
| **Legale Esterno** | [Studio / Avvocato] | [Email] / [Tel] | DPAs, LIA review, compliance |
| **Tech Lead / Dev** | [Nome / Fornitore] | [Email] / [Tel] | ESP API, Unsubscribe page, CRM sync |
| **ESP Support** | [Resend/SendGrid/...] | Support portal | Deliverability, suppression, FBL |

---

## 🎯 OBIETTIVO 30 GIORNI (Da master prompt)

| Settimana | Focus | Deliverable |
|-----------|-------|-------------|
| **Settimana 1** (Ora) | Foundation + Legal | Sender profile, ICP 200, Legal sign-off 🟢, Case study, Cal link |
| **Settimana 2** | Sequenza | 6 email scritte, scorate ≥ 80, Legal sign-off |
| **Settimana 3** | Automazione | Personalization prompt 200, Tracking UTM, Send schedule, Reply classifier |
| **Settimana 4** | Lancio + Iterazione | Batch 20-30/giorno, Daily monitoring, Weekly review, Pivot se serve |

**Target finale 30gg:** 200 email inviate, ≥ 4 meeting booked, ≥ 8% reply rate, < 1% unsubscribe

---

## 📝 NOTE PERSONALI / CONTESTO NON NELLE CARTELLE

> [Aggiungi qui: insight non documentati, conversazioni chiave, decisioni verbali, contesti relazionali, "tribal knowledge"]

- 
- 
- 

---

## 🚀 SE RI PRENDI IN MANO IL PROGETTO...

1. Leggi questo file `handoff.md` per intero
2. Controlla stato cartelle `01-config/` → `08-claude-code/`
3. Identifica **prossimo passo bloccante** (solitamente: compilazione sender-profile + ICP + legal)
4. Se su **nuovo PC**: copia cartella, carica skill, incolla master-prompt
5. Se **stesso PC**: continua da dove eri (check weekly review per priorità)

**Il mercato premia chi esegue. Non chi pianifica all'infinito.**