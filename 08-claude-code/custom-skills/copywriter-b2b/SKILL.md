---
name: copywriter-b2b
version: 1.0.0
description: Scrive cold email B2B personalizzate per vendita servizi web design. Usa framework "Trigger → Pain → Proof → Ask", angle rotation per follow-up, genera 3 subject line variants, valida con analyzer (word count, spam triggers, CTA clarity).
author: ZAK Studio Web
tags: [copywriting, cold-email, b2b-sales, personalization, sequence]
tools:
  - read
  - write
  - edit
  - bash
  - python
---

# copywriter-b2b — Skill per Cold Email B2B Personalizzate

## Obiettivo
Dato un `LeadAnalysisReport` (da `lead-analyzer`) + `SequenceMaster` (da `sequence-master.json`), genera **email complete pronte per invio**:
- Email 1 (First touch) + 5 follow-up + breakup = 6 email per lead
- Ogni email: subject line (3 varianti), body plain text, CTA, unsubscribe hash, footer legale
- Personalizzazione profonda: hook da lead-analyzer, pain framing settore-specifico, case study rilevante
- Output: `outbox/{slug}/email_{step}.json` + `outbox/batch_{date}.json` per email-dispatcher

## Quando usarla
- **Batch mode**: Processa `leads_enriched.json` (200 lead) → `outbox/batch_YYYYMMDD.json`
- **Singola**: Rigenera email per lead specifico (es. dopo feedback call)
- **A/B test**: Genera varianti subject line per test automatico

---

## Input

```json
{
  "lead": {
    "company": "Esempio Meccanica Srl",
    "domain": "esempromeccanica.it",
    "slug": "esempromeccanica-srl",
    "decision_maker": "Mario Rossi",
    "title": "Titolare / CEO",
    "sector": "Manifatturiero meccanico",
    "employees": 28,
    "pain_score": 78,
    "priority_tier": "A",
    "personalization_hooks": [
      "Visto che il sito gira su WordPress 5.8 (non aggiornato dal 2022) e avete appena presentato la nuova linea presse a EMO Hannover...",
      "Il sito mobile fa 34/100 su PageSpeed — i vostri buyer tedeschi che cercano 'presse idrauliche' da telefono vedono solo un sito lento..."
    ],
    "pain_signals": [
      { "signal": "WordPress version 5.8 (EOL 2022)", "severity": "high", "category": "security" },
      { "signal": "Mobile PageSpeed 34/100", "severity": "high", "category": "performance" }
    ],
    "recommended_angle": "performance_export",
    "estimated_gap_leads_month": 14
  },
  "sequence": { ... da sequence-master.json ... },
  "sender": { ... da sender-profile.md ... },
  "case_studies": [
    { "slug": "metalpress", "name": "Metalpress Vicenza", "sector": "Manifatturiero", "employees": 35, "result": "0→14 lead/mese, -40% CAC, 98/100 PageSpeed" }
  ],
  "demo_links": {
    "esempromeccanica-srl": "https://demo-zak-esempromeccanica-srl.netlify.app"
  }
}
```

## Output per Email (`outbox/{slug}/email_{step}.json`)

```json
{
  "lead_slug": "esempromeccanica-srl",
  "step": 1,
  "day": 1,
  "angle": "trigger_pain_ask",
  "subject_lines": [
    "vostro sito 2019",
    "nuova linea presse",
    "quick question"
  ],
  "subject_selected": "vostro sito 2019",
  "body": "Visto che il sito gira su WordPress 5.8 (non aggiornato dal 2022) e avete appena presentato la nuova linea presse a EMO Hannover — il sito attuale comunica ancora il catalogo 2019 mentre avete appena presentato la nuova gamma presse a EMO Hannover.\n\nCostruiamo siti per aziende come la vostra (manifatturiero 20-50 dip, export-focused) che trasformano il sito da \"vetrina\" a canale lead: l'ultimo cliente simile, Metalpress Vicenza, passa da 0 a 14 richieste qualificate/mese in 90 giorni.\n\nVale la pena una call 15 min giovedì per vedere se ha senso per voi?\n\n—\nMario Rossi — ZAK Studio Web\nmario.rossi@outreach.zakstudio.com\n\nSe non vuoi più ricevere queste email: https://unsubscribe.zakstudio.com/?h=a1b2c3d4e5f6g7h8\n\nZAK Studio Web di Mario Rossi — Via Roma 123, 25121 Brescia — P.IVA 01234567890 — REA BS-123456 — Privacy: https://zakstudio.com/privacy",
  "cta": "Vale la pena una call 15 min giovedì per vedere se ha senso per voi?",
  "cta_type": "direct_question_meeting",
  "calendly_link": "https://calendly.com/tuo-username/discovery-call-15min?utm_source=cold_email&utm_medium=email&utm_campaign=zak_web_outreach_2026&utm_content=step_1_cta&utm_term=esempromeccanica-srl",
  "demo_link": "https://demo-zak-esempromeccanica-srl.netlify.app",
  "unsubscribe_hash": "a1b2c3d4e5f6g7h8",
  "word_count": 142,
  "personalization_used": ["hook_wp_outdated", "pain_mobile_speed", "case_study_metalpress", "angle_performance_export"],
  "analyzer_score": 87,
  "status": "ready_to_send"
}
```

---

## Framework: "Trigger → Pain → Proof → Ask"

### Struttura Email 1 (First Touch)
```
[HOOK - Trigger specifico da lead-analyzer] → [PAIN - Framing settore] → [PROOF - Case study rilevante] → [ASK - UNA domanda diretta]
```

### Angle Rotation per Follow-up (da sequence-master.json)

| Step | Angle | Focus | Template Base |
|------|-------|-------|---------------|
| 1 | `trigger_pain_ask` | Trigger + Pain immediato + Call CTA | Hook + Pain + Proof + Ask |
| 2 | `case_study_social_proof` | Case study dettagliato stesso settore | "Visto che operate in {sector}..." + Case study + Ask |
| 3 | `industry_insight_benchmark` | Dato settore + Gap stimato | Benchmark Unioncamere/ISTAT + "Vuoi il report?" |
| 4 | `direct_ask_decision_maker` | Chi decide? Referral ask | "Domanda diretta: chi decide sul sito?" |
| 5 | `referral_reverse_ask` | Non sei tu? Dammi nome giusto | "Sarò breve: non sono sicuro di aver raggiunto la persona giusta..." |
| 6 | `breakup_close_loop` | Chiudi professionalmente | "Chiudo qui. Se diventa priorità, rispondi qui." |

---

## Generazione Subject Line (3 Varianti per Email)

### Regole Anti-Marketing (da cold-email skill)
- ✅ Breve (2-4 parole)
- ✅ Vago ma specifico al trigger
- ✅ Sembra email interna/collega
- ❌ Niente MAIUSCOLE, emoji, numeri "5 modi", "Re:" fake, nome azienda

### Generatore per Angle

```python
SUBJECT_TEMPLATES = {
    "trigger_pain_ask": [
        lambda l: f"vostro sito {l['tech_stack'].get('wp_year', '2019')}",
        lambda l: l['content_signals'].get('last_trigger', 'nuova linea').lower(),
        lambda _: "quick question"
    ],
    "case_study_social_proof": [
        lambda l: f"{l['case_study']['name']}: +{l['case_study']['result'].split('→')[1].split()[0]} lead/mese",
        lambda l: f"case study {l['sector'].lower()}",
        lambda _: "risultati sito web B2B"
    ],
    "industry_insight_benchmark": [
        lambda l: f"benchmark siti {l['sector'].lower()} 2024",
        lambda _: "quanto vale un lead qualificato?",
        lambda l: f"dati export {l['sector'].lower()}"
    ],
    "direct_ask_decision_maker": [
        lambda _: "chi gestisce il sito?",
        lambda _: "decisione sito web",
        lambda _: "responsabile digital"
    ],
    "referral_reverse_ask": [
        lambda _: "persona giusta per sito web?",
        lambda _: "chi decide il digital?",
        lambda _: "inoltro interno"
    ],
    "breakup_close_loop": [
        lambda _: "chiudo qui",
        lambda _: "ultima email",
        lambda _: "non vi disturbo più"
    ]
}
```

---

## Personalizzazione Profonda (Pain Framing per Settore)

### Mappa Settore → Linguaggio Pain

```python
SECTOR_PAIN_LANGUAGE = {
    "manifatturiero meccanico": {
        "keywords": ["schede tecniche", "catalogo", "agenti commerciali", "export", "certificazioni ISO", "presse", "macchine utensili"],
        "pain_frames": {
            "performance": "I buyer tecnici scaricano schede PDF da mobile in fiera — 3 secondi caricamento = persa la commessa",
            "seo": "Chi cerca 'presse idrauliche certificazioni ISO' su Google non vi trova — schema.org manca",
            "conversion": "Avete solo form generico — niente configuratore pressione/portata, niente calcolo ROI per l'ufficio tecnico"
        }
    },
    "b2b services": {
        "keywords": ["lead generation", "pipeline", "proposte", "credibilità", "case study", "testimonianze"],
        "pain_frames": {
            "performance": "Il sito lento fa sembrare l'agenzia poco tecnica — paradosso per chi vende digital",
            "credibility": "Sito 2019 = 'non investono su sé stessi, perché dovrei fidarmi?'",
            "conversion": "Zero lead magnet — niente benchmark settore, niente calcolatore ROI, niente whitepaper"
        }
    },
    "chimica/farmaceutico": {
        "keywords": ["schede sicurezza", "certificazioni GMP", "export regolamentato", "conformità", "audit"],
        "pain_frames": {
            "compliance": "Schede sicurezza PDF non indicizzate = rischio audit + buyer non le trova",
            "trust": "Sito non sicuro (mixed content) = bandierina rossa per procurement farmaceutico",
            "conversion": "Nessun portale clienti per scaricare certificati = tempo perso per commerciali"
        }
    }
}
```

---

## Case Study Selection Logic

```python
def select_case_study(lead, case_studies_pool):
    """Seleziona case study più rilevante per lead"""
    # Priorità: 1. Stesso settore + size simile  2. Stesso settore  3. Angle match  4. Generico onesto
    scored = []
    for cs in case_studies_pool:
        score = 0
        if cs['sector'].lower() == lead['sector'].lower(): score += 50
        if abs(cs['employees'] - lead['employees']) <= 15: score += 20
        if lead['recommended_angle'] in cs.get('angles', []): score += 15
        scored.append((score, cs))
    
    scored.sort(reverse=True, key=lambda x: x[0])
    return scored[0][1] if scored[0][0] > 0 else None  # None = usa "clienti simili nel vostro settore"
```

---

## Unsubscribe Hash Generation

```python
import hmac, hashlib, os

UNSUB_SECRET = os.environ["UNSUB_SECRET"]  # 32+ char, rotate annualmente

def generate_unsubscribe_hash(email, company_slug, step):
    """Univoco per email+company+step — non reversibile"""
    msg = f"{email}|{company_slug}|step{step}|{datetime.utcnow().date().isoformat()}".encode()
    return hmac.new(UNSUB_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:16]
```

---

## Footer Legale Obbligatorio (DLgs 70/2003 + GDPR Art. 13)

```python
def build_legal_footer(sender_profile):
    return f"""

—
{sender_profile['name']} — ZAK Studio Web
{sender_profile['email']}

Se non vuoi più ricevere queste email: https://unsubscribe.zakstudio.com/?h={{unsubscribe_hash}}

ZAK Studio Web di {sender_profile['legal_name']} — {sender_profile['address']} — P.IVA {sender_profile['vat']} — REA {sender_profile['rea']} — Privacy: https://zakstudio.com/privacy"""
```

---

## Email Analyzer Integration (Valida prima di inviare)

```python
def analyze_email(email_json):
    """Run analyzer, return score 0-100 + flags"""
    # Chiama script analyzer da email-sequence skill
    result = subprocess.run([
        'python3', 'scripts/email_sequence_analyzer.py', 
        '--email', json.dumps(email_json)
    ], capture_output=True, text=True)
    
    return json.loads(result.stdout)
    # { "score": 87, "flags": [], "warnings": ["word_count: 142 (target <150)"], "recommendations": [] }
```

**Soglie:**
- **Score ≥ 80**: ✅ Ready to send
- **Score 70-79**: ⚠️ Warning — fix minor issues
- **Score < 70**: ❌ Block — rewrite required (spam triggers, CTA unclear, too long)

---

## Comandi CLI

```bash
# Batch generazione 200 email (tutti i 6 step)
python -m copywriter_b2b --batch leads_enriched.json --sequence sequence-master.json --sender sender-profile.md --output outbox/ --case-studies case-studies/index.json --demos demos/deploy-manifest.json

# Singola email per lead specifico (step 1)
python -m copywriter_b2b --single --lead outbox/esempromeccanica-srl/lead.json --step 1

# Rigenera solo follow-up step 3-6 per lead non rispondenti
python -m copywriter_b2b --followup-only --lead outbox/esempromeccanica-srl/lead.json --from-step 3

# A/B test subject lines: genera 3 varianti per step 1 per tutti i lead
python -m copywriter_b2b --ab-test-subjects --step 1 --output outbox/ab_test_step1.json
```

---

## Output Batch Manifest (`outbox/batch_20261121.json`)

```json
{
  "batch_id": "batch_20261121",
  "created": "2026-11-21T06:00:00Z",
  "total_leads": 200,
  "total_emails": 1200,
  "by_step": { "1": 200, "2": 200, "3": 200, "4": 200, "5": 200, "6": 200 },
  "by_tier": { "A": 45, "B": 95, "C": 60 },
  "emails": [
    { "lead_slug": "esempromeccanica-srl", "step": 1, "file": "outbox/esempromeccanica-srl/email_1.json", "send_day": 1, "priority": "high" },
    { "lead_slug": "esempromeccanica-srl", "step": 2, "file": "outbox/esempromeccanica-srl/email_2.json", "send_day": 4, "priority": "high" }
  ],
  "analyzer_summary": { "avg_score": 84, "min_score": 78, "max_score": 92, "blocked": 0 }
}
```

---

## Integrazione Pipeline

| Skill | Riceve | Passa |
|-------|--------|-------|
| **lead-analyzer** | `personalization_hooks`, `pain_signals`, `recommended_angle`, `case_study_match` | — |
| **web-demo-generator** | `demo_link` per CTA secondario | — |
| **email-dispatcher** | `outbox/batch_YYYYMMDD.json` + singoli `email_N.json` | `sent_timestamp`, `message_id`, `delivery_status` |
| **followup-manager** (futuro) | `reply_classification` | `pause_sequence`, `rewrite_angle` |

---

## Testing

```bash
# Test template rendering per tutti angle + settori
python -m pytest tests/copywriter_b2b/ -v

# Casistiche:
# 1. Lead Tier A manifatturiero → email 1 con hook wp_outdated + case study metalpress
# 2. Lead Tier B servizi B2B → email 2 case study generico settore
# 3. Lead CEO → CTA "call 15 min giovedì"
# 4. Lead Marketing Manager → CTA "benchmark settore"
# 5. Analyzer score < 70 → blocca e logga motivo
# 6. Unsubscribe hash univoco per email
# 7. Footer legale completo in tutte
```