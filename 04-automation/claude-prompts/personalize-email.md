# Personalization Prompt — Generazione Email per Singola Azienda
**Usa questo prompt per ogni riga del CSV (200 volte) — automatizza via script o batch Claude**

---

## 📥 INPUT (da CSV row — `02-data/companies.csv`)

```json
{
  "company_name": "Esempio Meccanica Srl",
  "domain": "esempromeccanica.it",
  "decision_maker_name": "Mario Rossi",
  "decision_maker_title": "Titolare / CEO",
  "linkedin_url": "https://linkedin.com/in/mariorossi-esempio",
  "trigger_signal": "Sito WordPress 2019, non aggiornato da 2+ anni",
  "pain_point_hypothesis": "Sito vetrina obsoleto, zero lead inbound, competitor con siti moderni",
  "personalization_hook": "Visto che il sito non viene aggiornato dal 2019 e avete lanciato la nuova linea presse idrauliche...",
  "sector": "Manifatturiero meccanico",
  "employees": 28,
  "revenue_est": "5M€",
  "location": "Brescia (BS)",
  "email_verified": "pending"
}
```

---

## 🎯 TEMPLATE BASE (da `03-sequences/sequence-master.json` — Email 1)

```text
Subject: [subject line da sequence-master.json, es. "vostro sito 2019"]

[personalization_hook] — il sito attuale comunica ancora il catalogo 2019 mentre avete appena presentato la nuova gamma presse a EMO Hannover.

Costruiamo siti per aziende come la vostra (manifatturiero 20-50 dip, export-focused) che trasformano il sito da "vetrina" a canale lead: l'ultimo cliente simile, Metalpress Vicenza, passa da 0 a 14 richieste qualificate/mese in 90 giorni.

Vale la pena una call 15 min giovedì per vedere se ha senso per voi?

—
[Tuo Nome] — ZAK Studio Web
[tuonome]@outreach.zakstudio.com

Unsubscribe: https://unsubscribe.zakstudio.com/?id={{unsubscribe_hash}}
ZAK Studio Web di [Tuo Nome Cognome] — Via [Indirizzo], [CAP] [Città] — P.IVA [XXXXXXXXXX] — REA [XX]-[XXXXXX] — Privacy: https://zakstudio.com/privacy
```

---

## 🤖 PROMPT PER CLAUDE (esegui per ogni riga)

> **Sistema:** Sei un copywriter B2B che scrive cold email che sembrano scritte da un peer, non da un venditore. Usi il framework "Trigger → Pain → Proof → Ask" dal cold-email skill.
>
> **Input:** JSON azienda sopra + template base sopra.
>
> **Task:** Genera email personalizzata per QUESTA specifica azienda.
>
> **Regole:**
> 1. **Subject line:** Scegli tra 3 varianti (anti-marketing style: breve, vago, crea curiosità). Es: "vostro sito 2019" / "nuova linea presse" / "quick question"
> 2. **Opener:** USA ESATTAMENTE `personalization_hook` come prima frase. Non cambiarlo.
> 3. **Pain framing:** Adatta `pain_point_hypothesis` al linguaggio naturale del settore (es. manifatturiero = "catalogo", "schede tecniche", "agenti commerciali", "export")
> 4. **Proof:** Seleziona case study da `07-assets/case-studies/` rilevante per `sector` + `employees` range. Se none, usa "clienti simili nel vostro settore" generico ma onesto.
> 5. **CTA:** UNA domanda diretta. Adatta a `decision_maker_title`:
>    - CEO/Titolare: "Vale la pena una call 15 min giovedì?"
>    - Marketing Manager: "Ha 15 min per vedere un benchmark settore?"
>    - Direttore Commerciale: "Vuole vedere quanti lead perde il sito attuale?"
> 6. **Lunghezza:** Max 150 parole totale (subject + body).
> 7. **Footer:** SEMPRE identico (unsubscribe hash unique per azienda + footer legale completo).
> 8. **Tono:** Peer-to-peer. Niente "gentile", "cordiali saluti", "spero bene". Diretto, umano.
>
> **Output JSON:**
> ```json
> {
>   "subject": "subject line scelta",
>   "body": "plain text email completa con footer legale",
>   "cta": "domanda diretta usata",
>   "personalization_used": ["hook", "pain_point", "case_study", "sector_insight"],
>   "word_count": 142,
>   "unsubscribe_hash": "unique_hash_per_azienda"
> }
> ```

---

## 🔧 AUTOMATION SCRIPT (Python — opzionale, per batch 200)

```python
#!/usr/bin/env python3
# batch_personalize.py — Esegui da 04-automation/
# Genera 200 email personalizzate da CSV + template

import csv, json, hashlib, uuid
from pathlib import Path

CSV_PATH = Path("../02-data/companies.csv")
TEMPLATE_PATH = Path("personalize-email.md")  # Questo file
OUTPUT_DIR = Path("../03-sequences/personalized/")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def load_template():
    # Estrai template base dal markdown (tra ```text ... ```)
    content = TEMPLATE_PATH.read_text(encoding="utf-8")
    import re
    match = re.search(r'```text\n(.*?)\n```', content, re.DOTALL)
    return match.group(1) if match else ""

def generate_unsubscribe_hash(email, company):
    return hashlib.sha256(f"{email}{company}{uuid.uuid4()}".encode()).hexdigest()[:16]

def main():
    template = load_template()
    results = []
    
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if not row["company_name"] or row["company_name"].startswith("#"):
                continue
            
            # Qui inserisci chiamata a Claude API o subagent per personalizzare
            # Per ora: placeholder structure
            unsubscribe_hash = generate_unsubscribe_hash(row.get("email", ""), row["company_name"])
            
            result = {
                "row": i + 1,
                "company": row["company_name"],
                "email_to": f"{row['decision_maker_name'].lower().replace(' ', '.')}@{row['domain']}",
                "subject": f"{{subject_per_{row['company_name']}}}",
                "body": template.replace("{{unsubscribe_hash}}", unsubscribe_hash),
                "unsubscribe_hash": unsubscribe_hash,
                "status": "pending_personalization"
            }
            results.append(result)
    
    # Salva batch
    output_file = OUTPUT_DIR / f"batch_{len(results)}_emails.json"
    output_file.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"Generated {len(results)} email structures → {output_file}")
    print("Ora esegui personalizzazione via Claude per ogni entry.")

if __name__ == "__main__":
    main()
```

---

## ✅ CHECKLIST PERSONALIZZAZIONE (per ogni email generata)
- [ ] Subject line: 3 varianti testate, scelta la migliore per settore
- [ ] Opener = `personalization_hook` ESATTO dal CSV
- [ ] Pain point: linguaggio settore-specifico (non generico)
- [ ] Proof: case study rilevante per sector/size O onesto "clienti simili"
- [ ] CTA: adattata a seniority decision maker
- [ ] Word count ≤ 150
- [ ] Unsubscribe hash univoco
- [ ] Footer legale IDENTICO per tutte
- [ ] Nessun "gentile", "cordiali", "spero bene"
- [ ] Plain text, no HTML, no markdown rendering

---

## 📤 OUTPUT FINALE
Salva in `03-sequences/personalized/email_{row}_{company_slug}.json`:
```json
{
  "company": "Esempio Meccanica Srl",
  "to_email": "mario.rossi@esempromeccanica.it",
  "subject": "vostro sito 2019",
  "body": "Visto che il sito non viene aggiornato dal 2019 e avete lanciato la nuova linea presse idrauliche... [resto email]",
  "send_day": 1,
  "sequence_step": 1,
  "unsubscribe_hash": "a1b2c3d4e5f6g7h8",
  "status": "ready_to_send"
}
```
Poi tool di invio (ESP API) legge questa folder e manda batch 20-30/giorno.