---
name: web-demo-generator
version: 1.0.0
description: Genera demo live (HTML/CSS/JS statico) del nuovo sito per il lead, basata su pain signals, settore, export keywords. Deploy automatico su Netlify/Vercel → link pubblico per email CTA.
author: ZAK Studio Web
tags: [demo-generation, static-sites, netlify, vercel, b2b-sales-asset]
tools:
  - read
  - write
  - edit
  - bash
  - mcp__netlify__deploy
  - mcp__vercel__deploy
  - mcp__github__create_repo
  - mcp__github__push_files
---

# web-demo-generator — Skill per Demo Live Personalizzate

## Obiettivo
Dato un `LeadAnalysisReport` (output `lead-analyzer`), genera una **demo funzionante** del sito che il lead *potrebbe avere*:
- Hero section con value prop specifica per settore/export
- Sezione "Problem → Solution" basata sui pain signals reali
- Case study rilevante (template + dati lead)
- Configuratore/lead magnet interattivo (es. calcolo ROI, scarica scheda tecnica)
- Deploy istantaneo su Netlify/Vercel → link `https://demo-zak-{slug}.netlify.app` da inserire in email

## Quando usarla
- **Per lead Tier A (pain_score ≥ 70)**: Demo completa 4-5 sezioni
- **Per lead Tier B (40-69)**: Demo "lite" 2-3 sezioni (hero + problem/solution)
- **Batch**: Genera 10-20 demo/gg per lead prioritari prima outreach

---

## Input (da `leads_enriched.json`)

```json
{
  "company": "Esempio Meccanica Srl",
  "domain": "esempromeccanica.it",
  "slug": "esempromeccanica-srl",
  "sector": "Manifatturiero meccanico",
  "employees": 28,
  "pain_signals": [
    { "signal": "WordPress version 5.8 (EOL 2022)", "severity": "high", "category": "security" },
    { "signal": "Mobile PageSpeed 34/100", "severity": "high", "category": "performance" },
    { "signal": "No schema.org markup", "severity": "medium", "category": "seo" },
    { "signal": "Last content update 2021", "severity": "high", "category": "freshness" }
  ],
  "content_signals": {
    "export_keywords": ["presse idrauliche", "export Germania", "certificazioni ISO"],
    "languages": ["it"]
  },
  "recommended_angle": "performance_export",
  "screenshot_path": "screenshots/esempromeccanica.it_20261121_103000.png"
}
```

## Output

```
demos/
└── esempromeccanica-srl/
    ├── index.html          # Demo completa
    ├── assets/
    │   ├── styles.css
    │   ├── app.js
    │   └── images/         # Hero bg, icons, screenshot confronto
    ├── netlify.toml        # Config deploy
    └── deploy.json         # { "url": "https://demo-zak-esempromeccanica-srl.netlify.app", "deploy_id": "...", "timestamp": "..." }
```

**Link demo per email:** `https://demo-zak-esempromeccanica-srl.netlify.app`

---

## Template System (per Angolo Raccomandato)

### Angle: `performance_export` (Manifatturiero Export)
```html
<!-- Hero -->
<header class="hero">
  <div class="hero-badge">Per esportatori che perdono lead dal sito lento</div>
  <h1>Il vostro sito fa 34/100 mobile. I buyer tedeschi non aspettano.</h1>
  <p>Trasformiamo il sito da "vetrina 2019" a canale lead: +14 richieste qualificate/mese in 90 giorni per Metalpress Vicenza (stesso settore, 35 dip).</p>
  <a href="#calculator" class="cta-primary">Calcola quanti lead perdi →</a>
  <a href="https://calendly.com/tuo-username/discovery-call-15min" class="cta-secondary">Call 15 min</a>
</header>

<!-- Problem → Solution -->
<section class="problem-solution">
  <div class="problem">
    <h2>Cosa succede oggi</h2>
    <ul>
      <li>⚠️ WordPress 5.8 (EOL 2022) — rischio sicurezza + plugin rotti</li>
      <li>⚠️ Mobile 34/100 — 3 secondi caricamento = 53% abbandono</li>
      <li>⚠️ No schema.org — Google non vede "produttore presse ISO 9001"</li>
      <li>⚠️ Contenuti 2021 — nuovi modelli 2023-24 invisibili</li>
    </ul>
  </div>
  <div class="solution">
    <h2>Cosa costruiamo</h2>
    <ul>
      <li>✅ Astro/Next.js statico — 95+ PageSpeed mobile, zero CMS da aggiornare</li>
      <li>✅ Schema.org Product/Organization — rich snippet per "presse idrauliche export"</li>
      <li>✅ CMS headless (Sanity/Contentful) — aggiorni schede tecniche in 2 min</li>
      <li>✅ Lead magnet: configuratore pressione/portata → PDF tecnico + email vendite</li>
    </ul>
  </div>
</section>

<!-- Interactive Calculator (Lead Magnet) -->
<section id="calculator" class="calculator">
  <h2>Quanto vi costa il sito attuale?</h2>
  <form id="roi-form">
    <input type="number" name="monthly_traffic" placeholder="Visite/mese sito attuale" value="800" required>
    <input type="number" name="conversion_rate" placeholder="Conversione attuale %" value="0.5" step="0.1" required>
    <input type="number" name="avg_deal_value" placeholder="Valore medio commessa (€)" value="25000" required>
    <button type="submit">Calcola lead persi</button>
  </form>
  <div id="roi-result" class="hidden">
    <p class="big-number" id="lost-leads">—</p>
    <p>lead qualificati persi / anno = <strong id="lost-revenue">€—</strong> fatturato potenziale</p>
    <button class="cta-primary" onclick="scrollToCalendly()">Vuoi recuperarli? Call 15 min</button>
  </div>
</section>

<!-- Case Study Embed -->
<section class="case-study">
  <h2>Metalpress Vicenza: stesso settore, +14 lead/mese</h2>
  <div class="metrics-grid">
    <div><span class="num">0 → 14</span><span class="label">Lead qualif./mese</span></div>
    <div><span class="num">-40%</span><span class="label">CAC Google Ads</span></div>
    <div><span class="num">98/100</span><span class="label">PageSpeed Mobile</span></div>
    <div><span class="num">3 settimane</span><span class="label">Time-to-first-lead</span></div>
  </div>
  <a href="https://zakstudio.com/case-studies/metalpress.pdf" target="_blank">Leggi case study completo →</a>
</section>

<!-- Screenshot Confronto -->
<section class="comparison">
  <h2>Prima / Dopo (simulazione)</h2>
  <div class="slider-container">
    <img src="assets/images/screenshot-before.png" alt="Sito attuale" class="before">
    <img src="assets/images/screenshot-after.png" alt="Demo nuovo sito" class="after">
    <div class="slider-handle"></div>
  </div>
</section>
```

### Angle: `credibility_rebrand` (Aziende familiari/tradizionali)
- Focus: "Sembra piccola, siete leader" → Hero con credenziali, certificazioni, storia
- Lead magnet: "Brand audit gratuito" (PDF 2 pagine)

### Angle: `lead_gen_conversion` (B2B Services)
- Focus: "Sito vetrina → macchina lead" → Hero con funnel visuale
- Lead magnet: "Benchmark settore 2024" (PDF)

### Angle: `tech_modernization` (Tech/Startup)
- Focus: "Stack legacy → scalabile, veloce, dev-friendly"
- Lead magnet: "Audit tecnico gratuito" (report PDF)

---

## Generazione Assets (CSS/JS/Images)

### CSS: Design System Minimale (No framework, <15KB gzipped)
```css
/* demos/{slug}/assets/styles.css */
:root {
  --zak-primary: #1a3c5e;      /* Blu industriale */
  --zak-accent: #e86c00;       /* Arancio acciaio */
  --zak-bg: #f8fafc;
  --zak-text: #1e293b;
  --zak-muted: #64748b;
  --font-sans: system-ui, -apple-system, sans-serif;
  --container: 1200px;
  --space: clamp(1rem, 3vw, 2rem);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--font-sans); color: var(--zak-text); background: var(--zak-bg); line-height: 1.6; }
.container { max-width: var(--container); margin: 0 auto; padding: 0 var(--space); }

/* Hero */
.hero { padding: 6rem 0; text-align: center; background: linear-gradient(180deg, var(--zak-bg) 0%, #fff 100%); }
.hero-badge { display: inline-block; padding: 0.5rem 1rem; background: var(--zak-accent); color: #fff; font-size: 0.875rem; font-weight: 600; border-radius: 9999px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; margin-bottom: 1.5rem; color: var(--zak-primary); }
.hero p { font-size: clamp(1rem, 2.5vw, 1.25rem); color: var(--zak-muted); max-width: 70ch; margin: 0 auto 2rem; }
.cta-primary, .cta-secondary { display: inline-block; padding: 1rem 2rem; border-radius: 8px; font-weight: 600; text-decoration: none; transition: transform .15s, box-shadow .15s; }
.cta-primary { background: var(--zak-primary); color: #fff; margin-right: 1rem; }
.cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,60,94,0.3); }
.cta-secondary { background: #fff; color: var(--zak-primary); border: 2px solid var(--zak-primary); }
.cta-secondary:hover { background: var(--zak-primary); color: #fff; }

/* Problem/Solution */
.problem-solution { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; padding: 6rem 0; }
.problem h2, .solution h2 { font-size: 1.5rem; margin-bottom: 1.5rem; }
.problem ul, .solution ul { list-style: none; }
.problem li, .solution li { padding: 1rem; margin-bottom: 0.75rem; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.problem li { border-left: 4px solid #ef4444; }
.solution li { border-left: 4px solid #22c55e; }

/* Calculator */
.calculator { padding: 6rem 0; background: var(--zak-primary); color: #fff; text-align: center; }
.calculator h2 { font-size: 2rem; margin-bottom: 2rem; }
#roi-form { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 600px; margin: 0 auto 2rem; }
#roi-form input { flex: 1 1 180px; padding: 1rem; border: none; border-radius: 8px; font-size: 1rem; }
#roi-form button { background: var(--zak-accent); color: #fff; border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
#roi-result { margin-top: 2rem; }
.big-number { font-size: 4rem; font-weight: 800; color: var(--zak-accent); }

/* Case Study */
.case-study { padding: 6rem 0; text-align: center; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin: 3rem 0; }
.metrics-grid .num { display: block; font-size: 3rem; font-weight: 800; color: var(--zak-primary); }
.metrics-grid .label { font-size: 1rem; color: var(--zak-muted); }

/* Comparison Slider */
.comparison { padding: 6rem 0; }
.slider-container { position: relative; max-width: 800px; margin: 0 auto; overflow: hidden; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
.slider-container img { width: 100%; display: block; }
.slider-container .before { position: absolute; top: 0; left: 0; clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }
.slider-handle { position: absolute; top: 0; left: 50%; width: 4px; height: 100%; background: var(--zak-accent); cursor: ew-resize; z-index: 10; }

/* Mobile */
@media (max-width: 768px) {
  .problem-solution { grid-template-columns: 1fr; gap: 2rem; }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
```

### JS: Calculator + Slider + Analytics
```javascript
// demos/{slug}/assets/app.js
(function() {
  'use strict';
  
  // ROI Calculator
  const form = document.getElementById('roi-form');
  const result = document.getElementById('roi-result');
  const lostLeadsEl = document.getElementById('lost-leads');
  const lostRevenueEl = document.getElementById('lost-revenue');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const traffic = parseFloat(form.monthly_traffic.value) || 800;
      const convRate = parseFloat(form.conversion_rate.value) / 100 || 0.005;
      const dealValue = parseFloat(form.avg_deal_value.value) || 25000;
      
      const currentLeads = traffic * convRate * 12;
      const improvedConv = 0.025; // 2.5% target con sito ottimizzato
      const potentialLeads = traffic * improvedConv * 12;
      const lost = Math.round(potentialLeads - currentLeads);
      const lostRev = lost * dealValue;
      
      lostLeadsEl.textContent = lost.toLocaleString('it-IT');
      lostRevenueEl.textContent = '€' + lostRev.toLocaleString('it-IT');
      result.classList.remove('hidden');
      
      // Track event
      if (window.gtag) gtag('event', 'demo_calculator_used', { lost_leads: lost, lost_revenue: lostRev });
    });
  }
  
  // Comparison Slider
  const slider = document.querySelector('.slider-container');
  const before = document.querySelector('.slider-container .before');
  const handle = document.querySelector('.slider-handle');
  
  if (slider && before && handle) {
    let isDragging = false;
    const move = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      const pct = (x / rect.width) * 100;
      before.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
      handle.style.left = `${pct}%`;
    };
    
    handle.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mousemove', e => isDragging && move(e.clientX));
    window.addEventListener('mouseup', () => isDragging = false);
    handle.addEventListener('touchstart', () => isDragging = true, { passive: true });
    window.addEventListener('touchmove', e => isDragging && move(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchend', () => isDragging = false);
  }
  
  // Smooth scroll to Calendly
  window.scrollToCalendly = () => {
    const calendlyLink = document.querySelector('a[href*="calendly"]');
    if (calendlyLink) calendlyLink.scrollIntoView({ behavior: 'smooth' });
  };
})();
```

### Screenshot Generation (Before/After)
```bash
# Usa Playwright per generare screenshots
# Before: screenshot sito reale (da lead-analyzer)
# After:  usa demo generata + Playwright screenshot

# Script generazione after-screenshot:
npx playwright install chromium
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file:///abs/path/demos/esempromeccanica-srl/index.html', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'demos/esempromeccanica-srl/assets/images/screenshot-after.png', fullPage: false });
  await browser.close();
})();
"
```

---

## Deploy Automatico (Netlify / Vercel)

### Netlify (Consigliato - più semplice per static)
```toml
# demos/{slug}/netlify.toml
[build]
  publish = "."
  command = "echo 'Static site - no build'"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Cache-Control = "public, max-age=3600"

[[redirects]]
  from = "/calculator"
  to = "#calculator"
  status = 200
```

```bash
# Deploy via Netlify CLI (auth token in NETLIFY_AUTH_TOKEN)
netlify deploy --dir demos/esempromeccanica-srl --site demo-zak-esempromeccanica-srl --prod

# Output: https://demo-zak-esempromeccanica-srl.netlify.app
```

### Vercel (Alternativa)
```json
// demos/{slug}/vercel.json
{
  "name": "demo-zak-esempromeccanica-srl",
  "framework": null,
  "buildCommand": "echo 'static'",
  "outputDirectory": ".",
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Cache-Control", "value": "public, max-age=3600" }
    ]}
  ]
}
```

```bash
vercel deploy demos/esempromeccanica-srl --prod --token $VERCEL_TOKEN
```

---

## Integrazione con Pipeline

```python
# pipeline_generate_demos.py
import json, subprocess, os
from pathlib import Path

def generate_demo_for_lead(lead_report, output_dir):
    slug = lead_report['domain'].replace('.', '-')
    demo_dir = Path(output_dir) / slug
    demo_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Seleziona template per angle
    template = load_template(lead_report['recommended_angle'])
    
    # 2. Render HTML con dati lead
    html = render_template(template, lead_report)
    (demo_dir / 'index.html').write_text(html)
    
    # 3. Copia CSS/JS comuni + genera screenshot after
    copy_assets(demo_dir)
    generate_after_screenshot(demo_dir)
    
    # 4. Scrivi netlify.toml
    (demo_dir / 'netlify.toml').write_text(NETLIFY_TOML_TEMPLATE)
    
    # 5. Deploy Netlify
    result = subprocess.run([
        'netlify', 'deploy', '--dir', str(demo_dir),
        '--site', f'demo-zak-{slug}', '--prod', '--json'
    ], capture_output=True, text=True, env={**os.environ, 'NETLIFY_AUTH_TOKEN': os.getenv('NETLIFY_AUTH_TOKEN')})
    
    deploy_data = json.loads(result.stdout)
    (demo_dir / 'deploy.json').write_text(json.dumps({
        'url': deploy_data['url'],
        'deploy_id': deploy_data['id'],
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }, indent=2))
    
    return deploy_data['url']
```

---

## Comandi CLI

```bash
# Singola demo
python -m web_demo_generator --lead leads_enriched.json --company "Esempio Meccanica Srl" --output demos/

# Batch per tutti i Tier A
python -m web_demo_generator --batch leads_enriched.json --tier A --output demos/ --max 15 --deploy

# Re-deploy demo aggiornata (dopo feedback lead)
python -m web_demo_generator --redeploy --slug esempromeccanica-srl --output demos/
```

---

## Dipendenze

| Libreria | Versione | Uso |
|----------|----------|-----|
| `jinja2` | ≥3.1 | Template rendering HTML |
| `netlify-cli` | ≥17.0 | Deploy (npm global) |
| `vercel` | ≥32.0 | Deploy alternativo (npm global) |
| `playwright` | ≥1.40 | Screenshot generation |
| `lighthouse` | ≥11.0 | (Opzionale) Verifica PageSpeed demo |

---

## Testing

```bash
# Test template rendering per tutti gli angle
python -m pytest tests/web_demo_generator/ -v

# Test deploy dry-run (no prod)
python -m web_demo_generator --test-deploy --lead test_lead.json
```