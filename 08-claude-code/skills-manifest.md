# Skill Manifest — Progetto ZAK Studio Web
**Carica queste skill nell'altro PC (Nemotron) IN ORDINE prima di iniziare**

---

## 🎯 SKILL OBBLIGATORIE (Core — Carica TUTTE)

| Ordine | Skill | Comando | Perché serve |
|--------|-------|---------|--------------|
| 1 | **cold-email** | `/skill cold-email` | Scrivere email 1 + sequenza 6-step che convertono, framework, subject line, follow-up angles |
| 2 | **email-sequence** | `/skill email-sequence` | Architettura sequenza: timing, exit conditions, branching, metrics, analyzer |
| 3 | **gdpr-audit-prep** | `/skill gdpr-audit-prep` | **LEGAL FIRST** — 6 DPO questions, LIA, RoPA, DPIA, DSAR, breach log, TIA, Art. 28 DPA |
| 4 | **founder-marketing** | `/skill founder-marketing` | Posizionamento, offer, canali, 30-day campaign, hooks da panel objections |
| 5 | **copywriting** | `/skill copywriting` | Asset linkati: landing page, case study, pricing page, proposal deck |
| 6 | **analytics-tracking** | `/skill analytics-tracking` | UTM parameters, click tracking, attribution email → call → revenue |
| 7 | **content-strategy** | `/skill content-strategy` | Value-add follow-up content (case study, guide, benchmark) per angle rotation |

**Comando batch da copiare-incollare:**
```
/skill cold-email
/skill email-sequence
/skill gdpr-audit-prep
/skill founder-marketing
/skill copywriting
/skill analytics-tracking
/skill content-strategy
```

---

## 🎯 SKILL FACOLTATIVE (Carica SOLO se serve dopo core)

| Skill | Comando | Quando caricarla |
|-------|---------|------------------|
| marketing-strategy-pmm | `/skill marketing-strategy-pmm` | ICP raffinato, positioning competitivo, battlecards vs competitor |
| competitive-teardown | `/skill competitive-teardown` | Analisi come vendono web gli altri → differenziazione reale |
| pricing-strategy | `/skill pricing-strategy` | Pacchetti, anchor pricing, value-based per chiudere call |
| sales-engineer | `/skill sales-engineer` | Demo call script, objection handling, technical discovery |
| onboarding-cro | `/skill onboarding-cro` | Post-vendita: onboarding clienti smooth → referral |
| referral-program | `/skill referral-program` | Trasforma clienti in fonte lead (più economico di cold) |
| brand-guidelines | `/skill brand-guidelines` | Visual identity coerente per portfolio/proposte |
| web-design-guidelines | `/skill web-design-guidelines` | Standard qualità consegna siti (se fai anche delivery) |
| stripe-integration-expert | `/skill stripe-integration-expert` | Fatturazione automatica post-call |

---

## 📋 FILE DI CONFIGURAZIONE DA LEGGERE (Ordine)

1. `01-config/sender-profile.md` — Chi sei, offer, proof points, KPI, email setup
2. `01-config/icp-definition.md` — 200 aziende, pain point, trigger, personalization hook
3. `01-config/legal-compliance.md` — Checklist GDPR/CAN-SPAM/DLgs 70/2003 completa
4. `02-data/companies.csv` — 200 righe dati aziende (da completare)
5. `02-data/suppression-list.csv` — Opt-out, bounce, complaint (da mantenere)
6. `03-sequences/sequence-master.json` — Sequenza 6 email (da generare)
7. `04-automation/claude-prompts/personalize-email.md` — Prompt per 200 email
8. `05-legal/*` — LIA, RoPA, DPA, DSAR, breach log (da completare PRIMA lancio)
9. `07-assets/case-studies/` — 3-5 PDF case study (da creare)
10. `07-assets/cal-link.md` — Calendly/Cal.com link booking

---

## ⚡ WORKFLOW ESECUZIONE (Sull'altro PC)

```bash
# 1. Carica skill core (7 comandi)
/skill cold-email
/skill email-sequence
/skill gdpr-audit-prep
/skill founder-marketing
/skill copywriting
/skill analytics-tracking
/skill content-strategy

# 2. Leggi config
cat 01-config/sender-profile.md
cat 01-config/icp-definition.md

# 3. Esegui MASTER PROMPT (vedi 08-claude-code/master-prompt.md)
#    Step 1-7 in sequenza

# 4. Legal sign-off OBBLIGATORIO prima di inviare
#    gdpr-audit-prep → 6 DPO questions → 🟢 DPA-READY

# 5. Lancia batch 20-30/giorno via ESP API
#    Monitora daily → Weekly review → Pivot se metriche basse
```

---

## 🔗 RIFERIMENTI VELOCI (File chiave skill)

| Skill | File riferimento chiave | Cosa contiene |
|-------|------------------------|---------------|
| cold-email | `references/frameworks.md` | 5 framework: PAS, AIDA, BAB, 4U, Problem-Solution |
| cold-email | `references/follow-up-playbook.md` | Angle rotation, cadence, breakup templates |
| cold-email | `references/deliverability-guide.md` | Warmup, SPF/DKIM/DMARC, spam triggers |
| email-sequence | `references/email-sequence-playbook.md` | Architecture, branching, metrics benchmarks |
| gdpr-audit-prep | `../gdpr-dsgvo-expert/references/gdpr_audit_playbook.md` | Deep dive Art. 6, 30, 35, 28, 33, 15-22 |
| founder-marketing | `founder/panel/results.md` | Buy signals, objections, positioning evidence |
| analytics-tracking | `references/utm-guide.md` | UTM naming convention, attribution models |

---

## ⚠️ REGOLA D'ORO

> **Legal FIRST, Code SECOND, Send THIRD.**
>
> Nessuna email parte senza: 🟢 DPA-READY da gdpr-audit-prep + sequence score ≥ 80 da email-sequence + suppression list clean.

---

## 📞 SUPPORTO
Se skill non si carica: verifica percorso `.claude/skills/` sull'altro PC.
Se analyzer fallisce: `python3 -m pip install -r requirements.txt` nella cartella skill.
Se legal blocca: consulta legale esterno GDPR (costo ~€500-1000 per review completa).