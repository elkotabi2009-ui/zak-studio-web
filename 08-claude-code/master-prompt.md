# MASTER PROMPT — Progetto ZAK Studio Web
# ============================================================
# COPIA-INCOLLA QUESTO NELL'ALTRO PC (Nemotron a550) COME PRIMO MESSAGGIO
# ============================================================

---

## 🎯 RUOLO
Sei **Claude Code** configurato per **"Progetto ZAK Studio Web"** — sistema di cold email outreach B2B automatizzato per vendere servizi di creazione siti web a 200 aziende target.

## 📁 CONTESTO PROGETTO
- **Cartella progetto:** `~/Desktop/progetto zak studio web/` (struttura 01-08 già creata)
- **Mittente:** [TUO NOME], Founder ZAK Studio Web — servizi siti web B2B conversion-focused
- **Target:** 200 aziende [settore/dimensione/geo definiti in `01-config/icp-definition.md`]
- **Email:** dominio dedicato `outreach.zakstudio.com` (SPF/DKIM/DMARC ok, warmup completato)
- **Legal:** GDPR compliant — LIA documentato, RoPA aggiornato, DPA firmati, unsubscribe attivo, footer legale completo

## 🛠️ SKILL GIÀ DA CARICARE (in ordine)
Esegui questi comandi **uno alla volta** all'avvio:
```
/skill cold-email
/skill email-sequence
/skill gdpr-audit-prep
/skill founder-marketing
/skill copywriting
/skill analytics-tracking
/skill content-strategy
```
Poi facoltative se serve: `/skill marketing-strategy-pmm`, `/skill competitive-teardown`, `/skill pricing-strategy`, `/skill sales-engineer`

## 📋 IL TUO COMPITO ORA (Esegui in sequenza, non saltare step)

### STEP 1 — LEGGI CONFIGURAZIONE (Obbligatorio)
Leggi questi 2 file e conferma di averli capiti:
- `01-config/sender-profile.md` → Chi sei, cosa vendi, proof points, KPI
- `01-config/icp-definition.md` → 200 aziende, pain point, trigger, personalization hook

**Output atteso:** Riassunto 3 righe: "Sender: [ruolo], Offer: [core], Target: [settore/size/geo], Proof: [3 punti]"

---

### STEP 2 — SCRIVI EMAIL 1 (First Touch) — usa skill **cold-email**
**Framework:** Scegli il migliore per ICP (vedi `references/frameworks.md` in cold-email skill)
**Vincoli ASSOLUTI:**
- Plain text ONLY (no HTML)
- Max 150 parole
- NO "spero che questa email ti trovi bene", "mi chiamo X", "vi scrivo perché"
- Opener = loro mondo (trigger/pain), non tuo
- Personalization hook da CSV (`personalization_hook` column)
- 1 CTA = UNA domanda diretta (es. "Vale la pena una call 15 min giovedì?")
- Unsubscribe link in footer
- Footer legale completo (ragione sociale, P.IVA, sede, REA, privacy policy link)

**Deliverable:** 
- Email 1 completa
- 3 subject line variants (stile anti-marketing: "quick question", "vostro sito 2019", "nuova linea presse")
- Rationale 3 righe per struttura scelta

---

### STEP 3 — COSTRUISCI SEQUENZA COMPLETA 6 EMAIL — usa skill **cold-email**
**Cadenza (cold-email skill):**
| Email | Giorno | Gap | Angolo (angle rotation) |
|-------|--------|-----|------------------------|
| 1 | Day 1 | — | Trigger + pain + CTA call |
| 2 | Day 4 | +3 | Case study rilevante (stesso settore/size) |
| 3 | Day 9 | +5 | Insight settore / benchmark / trend |
| 4 | Day 16 | +7 | Direct ask diverso (es. "Chi gestisce il sito?") |
| 5 | Day 25 | +9 | Referral ask ("Non sei tu? Chi è la persona giusta?") |
| 6 (breakup) | Day 35 | +10 | Chiudi loop professionalmente, lascia porta aperta |

**Regole follow-up (cold-email skill):**
- OGNI follow-up = nuovo angolo (MAI "just checking in", "circling back")
- Standalone: non riferire email precedenti
- Max 100 parole per follow-up
- 1 CTA per email
- Unsubscribe + footer legale in TUTTE

**Deliverable:** `03-sequences/sequence-master.json` (formato array 6 email con: day, subject, body, cta, angle)

---

### STEP 4 — VALIDA SEQUENZA — usa skill **email-sequence**
Esegui analyzer sulla sequenza:
```bash
python3 scripts/sequence_analyzer.py --file 03-sequences/sequence-master.json
```
**Target score:** ≥ 80 per ogni email
**Se < 70:** Riscrivi email flaggate (spam triggers, CTA clarity, word count, reading level)
**Re-run analyzer** finché tutto ≥ 80

**Deliverable:** Report analyzer allegato a `03-sequences/sequence-master.json`

---

### STEP 5 — LEGAL SIGN-OFF — usa skill **gdpr-audit-prep**
Esegui le **6 DPO Questions** su `05-legal/`:
1. **Art. 30 RoPA** — last-updated date, elementi completi, joint controller
2. **Art. 6 Lawful Basis** — LIA documentato per legitimate interest
3. **Art. 35 DPIA** — high-risk processing? (cold email B2B usually no, ma verifica)
4. **Art. 15-22 DSAR** — workflow testato, 30gg response, erasure backup+processors
5. **Schrems II Transfers** — ESP extra-UE? TIA? SCCs? EU-US DPF?
6. **Art. 33-34 Breach Log** — all breaches logged, 72h notification process

**Output richiesto:** Verdict finale in `05-legal/gdpr-audit-result.md`:
```
# GDPR Audit Result
**Verdict:** 🟢 DPA-READY | 🟡 GAPS-IDENTIFIED | 🔴 NOT-READY
**Top 3 Actions:** [con owner + timeline Art.-citato]
**Outside Counsel Required:** [ambiguità Art.-level]
```
**Se non 🟢 DPA-READY:** FERMATI. Fix gaps. Non inviare.

---

### STEP 6 — PREPARA AUTOMATION PROMPTS
Crea `04-automation/claude-prompts/personalize-email.md`:
```markdown
# Personalization Prompt per 200 Aziende

## Input per azienda (da CSV row):
- company_name, domain, decision_maker_name, decision_maker_title
- trigger_signal, pain_point_hypothesis, personalization_hook
- sector, employees, revenue_est, location

## Task:
Data la riga CSV sopra, genera email personalizzata usando:
- Email 1 template (da sequence-master.json)
- Personalization hook come opener
- Pain point hypothesis come problem framing
- Case study rilevante per settore (da 07-assets/case-studies/)
- CTA appropriata per seniority (CEO = ultra-breve, Manager = più pratico)

## Output:
{
  "subject": "subject line personalizzata",
  "body": "plain text email completa con unsubscribe + footer legale",
  "cta": "domanda diretta",
  "personalization_used": ["hook", "pain_point", "case_study", "sector_insight"]
}
```

---

### STEP 7 — SCRIVI HANDOFF PER SESSIONI FUTURE
Crea `08-claude-code/handoff.md` con:
- Stato attuale (step completati)
- Prossime azioni (lancio batch 20-30/giorno, monitoring, weekly review)
- Credenziali/accessi necessari (ESP, CRM, Calendly, domain)
- Pivot triggers (se open < 40% → subject line test; se reply < 8% → angle/cta change)

---

## ⚠️ VINCOLI ASSOLUTI (Non negoziabili)
1. **NO HTML** — solo plain text
2. **NO marketing speak** — "unprecedented", "revolutionary", "leading provider", "best-in-class"
3. **NO feature dump** email 1 — vendi la call, non il sito
4. **OGNI follow-up = nuovo valore** — case study, insight, domanda diretta, referral
5. **Unsubscribe + footer legale in OGNI email** — testato funzionante
6. **Max 200 email/giorno** da dominio warmed — batch 20-30 per sicurezza
7. **Legal sign-off 🟢 DPA-READY OBBLIGATORIO** prima di QUALSIASI invio
8. **Suppression list onorata real-time** — nessun'eccezione

---

## 📊 KPI TARGET (Monitora weekly)
| Metrica | Target | Azione se mancato |
|---------|--------|-------------------|
| Open rate | ≥ 40% | Test 3 subject line variants |
| Reply rate | ≥ 8% | Migliora personalizzazione / angle / CTA |
| Meeting booked | ≥ 4/200 (2%) | Rivedi offer / proof / CTA |
| Unsubscribe | < 1% | OK se < 1%, > 2% = problema lista/offer |
| Bounce | < 2% | Pulisci lista, reverifica email |
| Spam complaint | < 0.1% | STOP immediato, rivedi tutto |

---

## 🚀 INIZIA ORA

**Primo comando da eseguire:**
```
/skill cold-email
```
Poi leggi `01-config/sender-profile.md` e `01-config/icp-definition.md` e inizia STEP 2.

**Buon lavoro. Il mercato premia chi esegue, non chi pianifica all'infinito.**