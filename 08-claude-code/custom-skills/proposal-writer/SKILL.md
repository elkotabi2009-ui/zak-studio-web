# Proposal Writer Skill

Genera proposte commerciali formali PDF/Markdown per clienti B2B manufacturing.

## Input

- `company_data`: Oggetto Company completo (da companies.csv + lead-analyzer)
- `pain_analysis`: Output lead-analyzer (pain_score, hooks, screenshot)
- `demo_url`: URL demo live generata da web-demo-generator
- `selected_plan`: "business" | "enterprise"
- `proposal_number`: Numero sequenziale (es. ZAK/2024/0001)

## Output

- `proposal_md`: Markdown completo (template formal-proposal-template.md)
- `proposal_pdf`: PDF generato via puppeteer/pandoc
- `contract_md`: Contratto precompilato (template contract-template.md)
- `contract_pdf`: PDF contratto firmabile

## Dipendenze

- `01-config/formal-proposal-template.md` (template Handlebars)
- `07-assets/contract-template.md` (template contratto)
- `config/master-config.json` (dati sender, offer, payment, iban)
- `ghost-typescript-generator` per tipi Ghost CMS

## Flusso

1. Carica template proposta e contratto
2. Interpola variabili: company_data, pain_analysis, demo_url, offer details, payment info
3. Calcola importi: prezzo, acconto 40%, saldo 60%, rateizzazione opzionale
4. Genera proposal_md e contract_md
5. Converte in PDF (puppeteer -> print to PDF)
6. Salva su Google Sheets tab "Deals" con link PDF
7. Restituisce percorsi file e metadata

## Variabili Template Proposta

```handlebars
{{company_name}}
{{company_legal_form}}
{{company_address}}
{{company_vat}}
{{company_rea}}
{{decision_maker_name}}
{{decision_maker_title}}
{{domain}}
{{cms_info}}
{{mobile_score}}
{{lcp}}
{{schema_status}}
{{lead_capture_status}}
{{catalog_status}}
{{a11y_status}}
{{lost_leads_month}}
{{sector}}
{{selected_plan_name}}
{{price}}
{{currency}}
{{deposit_percent}}
{{deposit_amount}}
{{balance_amount}}
{{includes}} (array)
{{demo_url}}
{{preview_url}}
{{iban}}
{{bic}}
{{bank}}
{{stripe_payment_link}}
{{timeline_days}}
{{calendly_link}}
{{expiry_days}}
{{expiry_date}}
{{year}}
{{sequential_number}}
{{cal_link}}
{{case_study_url}}
```

## Variabili Template Contratto

```handlebars
{{company_name}}
{{company_legal_form}}
{{company_address}}
{{company_vat}}
{{company_rea}}
{{decision_maker_name}}
{{decision_maker_title}}
{{price}}
{{deposit_amount}}
{{balance_amount}}
{{iban}}
{{bic}}
{{bank}}
{{max_products}}
{{custom_domain}}
{{timeline_days}}
```

## Esempio Uso

```python
from proposal_writer import generate_proposal

result = generate_proposal({
    "company_data": {...},
    "pain_analysis": {"pain_score": 87, "hooks": [...], "screenshot": "..."},
    "demo_url": "https://demo-zak-abc123.netlify.app",
    "selected_plan": "enterprise",
    "proposal_number": "ZAK/2024/0042"
})
# result: {"proposal_md": "...", "proposal_pdf": "path", "contract_md": "...", "contract_pdf": "path"}
```

## Validazione

- Pain score ≥ 70 per procedere (altrimenti warning)
- Demo URL deve essere raggiungibile (HEAD 200)
- IBAN valido (checksum)
- Proposal number unico (check Google Sheets)
- PDF generati < 5MB ciascuno