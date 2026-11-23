---
name: lead-analyzer
version: 1.0.0
description: Analizza sito web azienda target, estrae segnali (tech stack, età sito, mobile, SEO, contenuti), calcola pain-point score e genera hook personalizzati per cold email B2B web design.
author: ZAK Studio Web
tags: [lead-gen, web-analysis, b2b-sales, personalization]
tools:
  - mcp__playwright__navigate
  - mcp__playwright__evaluate
  - mcp__playwright__screenshot
  - mcp__playwright__get_text
  - mcp__firecrawl__scrape
  - mcp__firecrawl__search
  - read
  - write
  - edit
  - bash
---

# lead-analyzer — Skill per Analisi Lead B2B Web Design

## Obiettivo
Dato un dominio azienda (es. `esempromeccanica.it`), visita il sito, analizza tecnologicamente e contenutisticamente, e produce un **Lead Analysis Report** JSON con:
- Tech stack rilevato (CMS, framework, hosting, analytics)
- Segnali "sito vecchio/da rifare" (età stimata, mobile broken, no HTTPS, no schema.org, lento)
- Pain-point score (0-100) per priorità outreach
- 3-5 hook personalizzati pronti per email (trigger + pain framing)
- Screenshot above-the-fold per riferimento visivo

## Quando usarla
- **Batch mode**: Processi CSV 200 righe → `leads_enriched.json`
- **Singola**: Analisi approfondita prima call discovery
- **Re-analisi**: Dopo 30gg per lead non rispondenti (cambiamenti sito?)

---

## Input

```json
{
  "company": "Esempio Meccanica Srl",
  "domain": "esempromeccanica.it",
  "decision_maker": "Mario Rossi",
  "title": "Titolare / CEO",
  "sector": "Manifatturiero meccanico",
  "employees": 28,
  "location": "Brescia (BS)"
}
```

## Output (`leads_enriched.json` per riga)

```json
{
  "company": "Esempio Meccanica Srl",
  "domain": "esempromeccanica.it",
  "analysis_timestamp": "2026-11-21T10:30:00Z",
  "tech_stack": {
    "cms": "WordPress 5.8",
    "theme": "Avada (purchased 2019)",
    "plugins": ["Contact Form 7", "Yoast SEO", "WPML"],
    "hosting": "Aruba Shared Linux",
    "analytics": "GA4 (G-XXXXXXXX)",
    "ssl": "Let's Encrypt (valid)",
    "cdn": "none",
    "page_speed_mobile": 34,
    "page_speed_desktop": 67
  },
  "content_signals": {
    "last_blog_post": "2021-03-15",
    "last_case_study": "2020-11-02",
    "languages": ["it"],
    "has_schema_org": false,
    "has_sitemap_xml": true,
    "has_robots_txt": true,
    "contact_forms": 1,
    "phone_visible": true,
    "email_visible": false,
    "pec_visible": true,
    "social_links": ["linkedin", "facebook"],
    "export_keywords": ["presse idrauliche", "export Germania", "certificazioni ISO"]
  },
  "pain_signals": [
    { "signal": "WordPress version 5.8 (EOL 2022)", "severity": "high", "category": "security" },
    { "signal": "Mobile PageSpeed 34/100", "severity": "high", "category": "performance" },
    { "signal": "No schema.org markup", "severity": "medium", "category": "seo" },
    { "signal": "Last content update 2021", "severity": "high", "category": "freshness" },
    { "signal": "No HTTPS security headers (CSP, HSTS)", "severity": "medium", "category": "security" },
    { "signal": "Contact form only - no lead magnets", "severity": "medium", "category": "conversion" }
  ],
  "pain_score": 78,
  "priority_tier": "A",  // A: 70-100, B: 40-69, C: <40
  "personalization_hooks": [
    "Visto che il sito gira su WordPress 5.8 (non aggiornato dal 2022) e avete appena presentato la nuova linea presse a EMO Hannover...",
    "Il sito mobile fa 34/100 su PageSpeed — i vostri buyer tedeschi che cercano 'presse idrauliche' da telefono vedono solo un sito lento...",
    "Mancano dati strutturati schema.org: Google non capisce che siete produttori di presse certificate ISO 9001, perdete traffico qualificato...",
    "L'ultimo case study è del 2020 — i vostri nuovi modelli 2023-24 non hanno una pagina dedicata con schede tecniche scaricabili..."
  ],
  "screenshot_path": "screenshots/esempromeccanica.it_20261121_103000.png",
  "recommended_angle": "performance_export",  // performance_export | credibility_rebrand | lead_gen_conversion | tech_modernization
  "estimated_gap_leads_month": 14
}
```

---

## Procedura Operativa (Step-by-step)

### 1. NAVIGAZIONE E RACCOLTA DATI (Playwright)
```javascript
// Naviga homepage + pagine chiave
await mcp.playwright.navigate({ url: `https://${domain}` });
await mcp.playwright.wait_for_load_state({ state: "networkidle" });

// Screenshot above-fold
await mcp.playwright.screenshot({ 
  path: `screenshots/${domain}_${timestamp}.png`, 
  full_page: false 
});

// Estrai HTML per analisi
const html = await mcp.playwright.evaluate({ 
  script: "document.documentElement.outerHTML" 
});

// Estrai meta tag, script, link per tech detection
const meta = await mcp.playwright.evaluate({ 
  script: `
    const data = {};
    data.generator = document.querySelector('meta[name="generator"]')?.content;
    data.wp_version = document.querySelector('meta[name="generator"]')?.content?.match(/WordPress ([\d.]+)/)?.[1];
    data.scripts = Array.from(document.scripts).map(s => s.src).filter(Boolean);
    data.stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
    data.forms = document.querySelectorAll('form').length;
    data.has_schema = !!document.querySelector('[itemtype*="schema.org"]');
    return data;
  `
});
```

### 2. PAGE SPEED + TECH DETECTION (Firecrawl / PageSpeed API)
```bash
# PageSpeed Insights (mobile + desktop)
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}&strategy=mobile&key=${PAGESPEED_API_KEY}"
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${domain}&strategy=desktop&key=${PAGESPEED_API_KEY}"

# Wappalyzer-style detection via Firecrawl
firecrawl scrape --url "https://${domain}" --only-main-content false --extract '{
  tech_stack: "cms, framework, hosting, analytics, cdn, ssl_issuer",
  meta_tags: "all meta tags content",
  headers: "response headers"
}'
```

### 3. CONTENT ANALYSIS (Playwright evaluate)
```javascript
const content = await mcp.playwright.evaluate({ 
  script: `
    // Blog/News date
    const dates = Array.from(document.querySelectorAll('time, .date, .post-date, [datetime]'))
      .map(el => el.dateTime || el.textContent)
      .filter(d => d && /\d{4}/.test(d));
    
    // Export keywords from content
    const text = document.body.innerText.toLowerCase();
    const exportTerms = ['export', 'internazionale', 'estero', 'germania', 'france', 'usa', 'certificaz', 'iso', 'ce'];
    const found = exportTerms.filter(t => text.includes(t));
    
    // Contact info
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || [];
    const phones = text.match(/(\+39|0039)?[\s-]?\d{2,4}[\s-]?\d{6,7}/g) || [];
    const pecs = emails.filter(e => e.endsWith('@pec.it') || e.includes('pec.'));

    return { dates, found_export_terms: found, emails, phones, pecs };
  `
});
```

### 4. SCORING ALGORITMO (Pain Score 0-100)

| Segnale | Peso | Soglia | Note |
|---------|------|--------|------|
| WP version < 6.0 / EOL | +25 | High | Security + performance |
| Mobile PageSpeed < 40 | +20 | High | Core Web Vitals fail |
| Desktop PageSpeed < 60 | +10 | Medium | |
| No schema.org | +15 | Medium | SEO local/export |
| Last content > 2 anni | +20 | High | Freshness signal |
| No HTTPS / mixed content | +15 | High | Trust |
| No lead capture (solo form generico) | +10 | Medium | Conversion |
| No mobile responsive (viewport issues) | +20 | High | UX |
| PEC only / no email contatto | +5 | Low | Accessibilità |
| Competitor ha sito moderno (benchmark) | +10 | Medium | Comparative |

**Tier:**
- **A (70-100)**: Outreach priorità 1 — hook strong, case study pronto
- **B (40-69)**: Outreach priorità 2 — hook standard
- **C (<40)**: Outreach priorità 3 / nurture — sito già decente

### 5. HOOK GENERATION (Template-based)

```python
HOOK_TEMPLATES = {
    "wp_outdated": "Visto che il sito gira su WordPress {version} (non aggiornato dal {year}) e avete appena {trigger}...",
    "mobile_slow": "Il sito mobile fa {score}/100 su PageSpeed — i vostri buyer {geo} che cercano '{keyword}' da telefono vedono solo un sito lento...",
    "no_schema": "Mancano dati strutturati schema.org: Google non capisce che siete {certification}, perdete traffico qualificato...",
    "stale_content": "L'ultimo {content_type} è del {year} — i vostri nuovi {product_line} {years} non hanno pagina dedicata...",
    "no_lead_magnet": "Avete solo un form contatto generico — niente schede tecniche scaricabili, niente configuratore, niente calcolo ROI per i buyer tecnici...",
    "competitor_gap": "Il competitor {competitor} ha lanciato sito nuovo con {feature} — voi che avete {advantage} non lo comunicate online..."
}
```

### 6. SCREENSHOT + ARCHIVIAZIONE
- Screenshot: `screenshots/{domain}_{timestamp}.png` (above-fold, 1280px width)
- Report JSON: `leads_enriched.json` (append per riga)
- Log: `analysis_log.csv` (domain, timestamp, pain_score, tier, errors)

---

## Comandi CLI (per batch)

```bash
# Singola analisi
python -m lead_analyzer --domain esempromeccanica.it --company "Esempio Meccanica Srl" --output leads_enriched.json

# Batch da CSV
python -m lead_analyzer --batch 02-data/companies.csv --output 02-data/leads_enriched.json --concurrency 3 --rate-limit 10/min

# Solo re-analisi lead tier A non rispondenti (dopo 30gg)
python -m lead_analyzer --reanalyze --tier A --since 30d --input 02-data/leads_enriched.json
```

---

## Integrazione con Altre Skill

| Skill | Cosa riceve da lead-analyzer | Cosa passa a lead-analyzer |
|-------|------------------------------|----------------------------|
| **copywriter-b2b** | `personalization_hooks`, `pain_signals`, `tech_stack`, `recommended_angle` | — |
| **web-demo-generator** | `tech_stack`, `pain_signals`, `content_signals.export_keywords`, `screenshot_path` | — |
| **email-dispatcher** | `priority_tier` (per ordinamento invio), `recommended_angle` (per subject line) | `sent_timestamp`, `open/click/reply` (per re-prioritizzazione) |

---

## Dipendenze Esterne (API Keys necessarie)

| Servizio | Variabile Ambiente | Piano Gratis | Note |
|----------|-------------------|--------------|------|
| **Google PageSpeed Insights** | `PAGESPEED_API_KEY` | 25.000 req/giorno | Attiva in Google Cloud Console |
| **Firecrawl** | `FIRECRAWL_API_KEY` | 500 crediti/mese | Per scrape affidabile |
| **Playwright MCP** | N/A (local) | — | `npx @playwright/mcp@latest` |
| **Wappalyzer (opzionale)** | `WAPPALYZER_API_KEY` | 100 req/mese | Tech detection più accurato |

---

## Error Handling & Fallback

| Errore | Fallback |
|--------|----------|
| Timeout navigazione (>30s) | Usa solo Firecrawl scrape + PageSpeed API |
| Sito down / 404 / redirect loop | Segnala `site_unreachable`, pain_score = 50 (unknown), hook generico settore |
| PageSpeed API quota exceeded | Stima da Lighthouse locale (Playwright + `lighthouse` npm) |
| Nessun CMS rilevabile | Assume static site / custom — hook "sito custom legacy" |
| Screenshot failed | Salta screenshot, continua analisi |

---

## Testing

```bash
# Test suite
python -m pytest tests/lead_analyzer/ -v

# Casi test:
# 1. WordPress vecchio + mobile lento → tier A, hook wp_outdated + mobile_slow
# 2. Sito moderno React + veloce → tier C, hook competitor_gap
# 3. Sito down → fallback generico settore
# 4. Solo PEC, no email → hook accessibilità
# 5. Multi-lingua (WPML) → hook export/internazionale
```