# ICP Definition — 200 Aziende Target
**Compila OGNI riga per OGNI azienda. Usa CSV in `02-data/companies.csv` per bulk, questo file per strategia.**

---

## 🎯 Ideal Customer Profile (Strategia)

| Dimensione | Criterio | Il tuo Target |
|------------|----------|---------------|
| **Settore primario** | [es. Manifatturiero meccanico, B2B services, Logistica, Chimica] | |
| **Settori secondari** | [Max 2-3, per non diluire messaging] | |
| **Geografia** | [es. Nord Italia: Lombardia, Veneto, Emilia-Romagna, Piemonte] | |
| **Dimensione azienda** | Dipendenti: [es. 10-50] / Fatturato: [es. 1-20M€] | |
| **Decision Maker** | Titolo: [es. Titolare, CEO, Marketing Manager, Direttore Commerciale] | |
| **Tech stack attuale** | [es. Sito WordPress vecchio / Wix / Nessun sito / Solo social] | |
| **Dolore primario (Pain)** | [es. "Il sito non porta clienti", "Sembriamo piccoli", "Competitori ci rubano lead"] | |
| **Trigger outreach** | [es. Assumono marketing, nuovo funding, sito >3 anni, lancio prodotto, espansione] | |
| **Budget stimato** | [es. 3-15k€ per sito professionale] | |
| **Ciclo vendita** | [es. 2-6 settimane da prima call a firma] | |

---

## 📋 Lista 200 Aziende (Template CSV → `02-data/companies.csv`)

| company_name | domain | decision_maker_name | decision_maker_title | linkedin_url | trigger_signal | pain_point_hypothesis | personalization_hook | sector | employees | revenue_est | location |
|--------------|--------|---------------------|----------------------|--------------|----------------|----------------------|---------------------|--------|-----------|-------------|----------|
| Esempio Srl | esempio.it | Mario Rossi | Titolare | linkedin.com/in/mariorossi | Nuovo sito 2021, >3 anni | "Sito vetrina, zero lead" | "Visto che avete lanciato linea X nel 2023..." | Meccanica | 25 | 5M€ | Brescia |
| | | | | | | | | | | | |
| | | | | | | | | | | | |
| | | | | | | | | | | | |

> **Istruzioni:** Compila il CSV con 200 righe. Colonne chiave per personalizzazione:
> - `trigger_signal`: Cosa hai visto (news, hiring, tech stack, sito vecchio, espansione)
> - `pain_point_hypothesis`: Il problema che *immagini* abbiano (userai nell'email)
> - `personalization_hook`: La frase specifica "Visto che..." / "Notato che..." per email 1

---

## 🔍 Fonti Dati per Trovare le 200 Aziende
| Fonte | Come usare | Costo |
|-------|------------|-------|
| **LinkedIn Sales Navigator** | Filtro: settore, geo, size, keyword "site:wordpress.com" / "site:wixsite.com" | €€/mese |
| **Apollo.io / Hunter.io / Lusha** | Export contatti decision maker + email verificate | €€/mese |
| **Registro Imprese / Atoka / Cerved** | Liste aziende per settore/geo/size + P.IVA per verifica | €/€€ |
| **Google Maps / PagineBianche** | Ricerca locale "meccanica Brescia" + verifica sito web | Gratis |
| **Associazioni di categoria** | Elenco associati (es. Confindustria territoriale, Confartigianato) | Spesso gratis per soci |
| **Fiere / Eventi settore** | Elenco espositori MECSPE, BI-MU, ecc. | Gratis / biglietto |
| **Tecnografia (BuiltWith / Wappalyzer)** | Trova siti WordPress vecchi, Wix, Squarespace per settore/geo | Freemium |

---

## ✅ Checklist Qualità Lista (Prima di inviare)
- [ ] 200 righe complete (no campi vuoti critici)
- [ ] Email verificate (bounce < 2% — usa ZeroBounce, MillionVerifier, NeverBounce)
- [ ] Decision maker corretto (non info@, amministrazione@, generic@)
- [ ] Trigger reale per ognuna (non "voglio vendere siti")
- [ ] Pain point ipotizzabile e credibile per quel settore/size
- [ ] Personalization hook univoco per riga (no copia-incolla generico)
- [ ] Nessuna in `suppression-list.csv` (opt-out, bounce hard, complaint)
- [ ] Nessuna PEC (uso solo email standard)
- [ ] Dominio azienda risolvibile (no typo, no domini parcheggiati)

---

## 🎯 Segmentazione per Sequenze Diverse (Opzionale)
Se hai >3 segmenti distinti, crea sequenze separate:

| Segmento | # Aziende | Pain Point Unico | Angle Email 1 | Case Study Rilevante |
|----------|-----------|------------------|---------------|---------------------|
| Manifatturiero export | 80 | "Sito solo italiano, perdono lead estero" | Internazionalizzazione | Case study export |
| B2B services lead gen | 60 | "Sito vetrina, zero inbound" | Lead generation | Case study lead gen |
| Famiglia/tradizionale | 40 | "Sito fatto dal cugino 2015" | Credibilità/professionalità | Case study rebrand |
| Tech/Startup | 20 | "Serve sito scalabile, veloce" | Performance/tech stack | Case study tech |

> **Regola:** Meglio 1 sequenza ben fatta per 200 simili, che 4 sequenze mediocri per 50 ciascuna. Segmenta SOLO se pain point *radicalmente* diverso.