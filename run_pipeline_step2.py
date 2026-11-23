#!/usr/bin/env python3
"""
STEP 2: Demo Generation
Generates personalized demo sites for Tier A/B leads and deploys to Netlify
"""
import os, json, subprocess, shutil
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader

load_dotenv()

PROJECT_DIR = Path(__file__).parent
NETLIFY_AUTH_TOKEN = os.getenv("NETLIFY_AUTH_TOKEN")

# Demo templates per angle
TEMPLATES = {
    "performance_export": {
        "name": "Performance Export",
        "hero_badge": "Per esportatori che perdono lead dal sito lento",
        "hero_title": "Il vostro sito fa {{pain_mobile}}/100 mobile. I buyer esteri non aspettano.",
        "hero_subtitle": "Trasformiamo il sito da \"vetrina {{cms_year}}\" a canale lead: +{{gap_leads}} richieste qualificate/mese in 90 giorni per aziende simili nel {{sector_lower}}.",
        "problem_items": [
            "⚠️ {{cms_info}} — rischio sicurezza + plugin rotti",
            "⚠️ Mobile {{pain_mobile}}/100 — 3 secondi caricamento = 53% abbandono",
            "⚠️ No schema.org — Google non vede \"produttore {{export_keywords}}\"",
            "⚠️ Contenuti fermi al {{last_year}} — nuovi prodotti invisibili"
        ],
        "solution_items": [
            "✅ Astro/Next.js statico — 95+ PageSpeed mobile, zero CMS da aggiornare",
            "✅ Schema.org Product/Organization — rich snippet per \"{{export_keywords}}\"",
            "✅ CMS headless (Sanity/Contentful) — aggiorni schede tecniche in 2 min",
            "✅ Lead magnet: configuratore tecnico → PDF + email vendite automatica"
        ],
        "case_study": {
            "name": "Metalpress Vicenza",
            "sector": "Manifatturiero meccanico",
            "employees": 35,
            "result": "0 → 14 lead/mese, -40% CAC, 98/100 PageSpeed Mobile"
        },
        "calculator_title": "Quanto vi costa il sito attuale?",
        "calculator_fields": [
            {"name": "monthly_traffic", "label": "Visite/mese sito attuale", "value": "800", "type": "number"},
            {"name": "conversion_rate", "label": "Conversione attuale %", "value": "0.5", "type": "number", "step": "0.1"},
            {"name": "avg_deal_value", "label": "Valore medio commessa (€)", "value": "25000", "type": "number"}
        ]
    },
    "tech_modernization": {
        "name": "Tech Modernization",
        "hero_badge": "Per aziende con stack legacy che frena la crescita",
        "hero_title": "Il vostro sito gira su tecnologia {{cms_year}}. È ora di modernizzare.",
        "hero_subtitle": "Stack moderno, zero manutenzione, deploy automatico: il sito che scala con la vostra azienda {{sector_lower}}.",
        "problem_items": [
            "⚠️ {{cms_info}} — EOL, vulnerabilità, plugin non mantenuti",
            "⚠️ Nessun CI/CD — deploy manuali, rischio errori, niente rollback",
            "⚠️ Hosting shared — risorse limitate, niente scaling, downtime frequenti",
            "⚠️ Zero observability — non sapete se il sito funziona o è giù"
        ],
        "solution_items": [
            "✅ Astro/Next.js + Netlify/Vercel — deploy automatico da Git, preview deployments",
            "✅ Edge functions — API veloci globalmente, zero server da gestire",
            "✅ Headless CMS — content team autonomo, dev team felice",
            "✅ Monitoring integrato — uptime, performance, error tracking out-of-the-box"
        ],
        "case_study": {
            "name": "TechCorp Milano",
            "sector": "Software B2B",
            "employees": 45,
            "result": "Da 2h deploy a 3 min, 99.99% uptime, -80% costi hosting"
        },
        "calculator_title": "Quanto tempo sprecia il vostro team sul sito?",
        "calculator_fields": [
            {"name": "deploy_time", "label": "Tempo per deploy manuale (minuti)", "value": "120", "type": "number"},
            {"name": "deploy_freq", "label": "Deploy al mese", "value": "8", "type": "number"},
            {"name": "hourly_cost", "label": "Costo orario dev (€)", "value": "60", "type": "number"}
        ]
    },
    "lead_gen_conversion": {
        "name": "Lead Gen Conversion",
        "hero_badge": "Per siti vetrina che non convertono",
        "hero_title": "Il vostro sito è una vetrina. I competitor hanno macchine lead.",
        "hero_subtitle": "Da 0 a {{gap_leads}} lead qualificati/mese: landing per campagna, magneti, nurturing automatico per il {{sector_lower}}.",
        "problem_items": [
            "⚠️ Solo form contatto generico — tasso conversione < 0.5%",
            "⚠️ Niente landing per Google Ads — CAC alto, quality score basso",
            "⚠️ Niente lead magnet — zero nurturing, lead freddi persi",
            "⚠️ Nessun tracking conversioni — volate ciechi su ROI marketing"
        ],
        "solution_items": [
            "✅ Landing page per campagna — message match, quality score 8+",
            "✅ Lead magnet: calcolatore ROI, schede tecniche, benchmark settore",
            "✅ Email nurturing automatico — da freddo a caldo in 14 giorni",
            "✅ Dashboard conversioni — vedete esattamente da dove arrivano i lead"
        ],
        "case_study": {
            "name": "ServicePro Roma",
            "sector": "B2B Services",
            "employees": 28,
            "result": "Da 2 a 22 lead/mese, CAC -55%, pipeline +180k€ in 6 mesi"
        },
        "calculator_title": "Quanti lead perdete col form generico?",
        "calculator_fields": [
            {"name": "monthly_traffic", "label": "Visite/mese", "value": "1000", "type": "number"},
            {"name": "current_conv", "label": "Conversione attuale %", "value": "0.3", "type": "number", "step": "0.1"},
            {"name": "target_conv", "label": "Conversione target % (con landing)", "value": "3.0", "type": "number", "step": "0.1"},
            {"name": "deal_value", "label": "Valore medio cliente (€)", "value": "15000", "type": "number"}
        ]
    },
    "credibility_rebrand": {
        "name": "Credibility Rebrand",
        "hero_badge": "Per aziende solide che sembrano piccole online",
        "hero_title": "Siete leader nel {{sector_lower}}. Il vostro sito lo comunica?",
        "hero_subtitle": "Rebrand completo: autorità, fiducia, professionalità. Il sito che i vostri clienti si aspettano da un'azienda da {{revenue_est}}.",
        "problem_items": [
            "⚠️ Design datato — \"sembra fatta dal cugino nel 2015\"",
            "⚠️ Niente case study — zero proof, zero autorità percepita",
            "⚠️ Certificazioni nascoste — ISO, qualità, export non visibili",
            "⚠️ Mobile broken — 60% traffico da telefono, esperienza rotta"
        ],
        "solution_items": [
            "✅ Design system professionale — coerenza, fiducia, differenziazione",
            "✅ Case study library — proof concreto, objection handling automatico",
            "✅ Trust badges & certificates — visibili above-fold, schema.org",
            "✅ Mobile-first — 95+ PageSpeed, esperienza fluida su ogni device"
        ],
        "case_study": {
            "name": "Ferrari Meccanica Bologna",
            "sector": "Meccanica precisione",
            "employees": 65,
            "result": "Perceived value +40%, closing rate +25%, enterprise clients +3"
        },
        "calculator_title": "Quanto vale la credibilità per un cliente enterprise?",
        "calculator_fields": [
            {"name": "enterprise_deals", "label": "Trattative enterprise/anno", "value": "5", "type": "number"},
            {"name": "win_rate", "label": "Win rate attuale %", "value": "15", "type": "number"},
            {"name": "deal_value", "label": "Valore medio deal (€)", "value": "100000", "type": "number"},
            {"name": "improvement", "label": "Miglioramento win rate stimato %", "value": "10", "type": "number"}
        ]
    }
}

def get_template_data(lead: dict) -> dict:
    """Prepare template data from lead"""
    tech = lead.get("tech_stack", {})
    content = lead.get("content_signals", {})
    signals = lead.get("pain_signals", [])

    # Extract CMS info
    cms = tech.get("cms", "Unknown")
    cms_year = "2019"
    cms_info = cms
    if "WordPress" in cms:
        import re
        match = re.search(r'(\d+\.\d+)', cms)
        if match:
            ver = float(match.group(1))
            if ver < 5: cms_year = "2018"
            elif ver < 5.5: cms_year = "2019"
            elif ver < 6: cms_year = "2020"
            else: cms_year = "2022"
            cms_info = f"WordPress {match.group(1)} (EOL)" if ver < 6 else f"WordPress {match.group(1)}"

    # Mobile PageSpeed
    pain_mobile = tech.get("page_speed_mobile", 0)
    if pain_mobile == 0:
        pain_mobile = "—"

    # Export keywords
    export_kw = content.get("export_keywords", [])
    export_str = ", ".join(export_kw[:3]) if export_kw else "vostri prodotti"

    # Last content year
    last_year = content.get("last_content_year", 0)
    if last_year == 0:
        last_year = "2020"

    return {
        "company": lead["company"],
        "domain": lead["domain"],
        "slug": lead["slug"],
        "sector": lead["sector"],
        "sector_lower": lead["sector"].lower(),
        "employees": lead["employees"],
        "location": lead["location"],
        "revenue_est": lead.get("revenue_est", "N/A"),
        "pain_score": lead["pain_score"],
        "priority_tier": lead["priority_tier"],
        "recommended_angle": lead["recommended_angle"],
        "gap_leads": lead.get("estimated_gap_leads_month", 10),
        "cms": cms,
        "cms_year": cms_year,
        "cms_info": cms_info,
        "pain_mobile": pain_mobile,
        "export_keywords": export_str,
        "last_year": str(last_year),
        "calendly_url": "https://calendly.com/zakstudio/discovery-call-15min",
        "case_study_url": "https://zakstudio.com/case-studies/metalpress.pdf",
        "demo_url": f"https://demo-zak-{lead['slug']}.netlify.app"
    }

def generate_demo_html(lead: dict) -> str:
    """Generate demo HTML from template"""
    t_data = get_template_data(lead)
    angle = lead["recommended_angle"]
    template = TEMPLATES.get(angle, TEMPLATES["lead_gen_conversion"])

    # Calculate calculator result placeholder
    calc_js = ""
    if angle == "performance_export":
        calc_js = """
        const traffic = parseFloat(form.monthly_traffic.value) || 800;
        const conv = (parseFloat(form.conversion_rate.value) || 0.5) / 100;
        const deal = parseFloat(form.avg_deal_value.value) || 25000;
        const current = traffic * conv * 12;
        const improved = traffic * 0.025 * 12;
        const lost = Math.round(improved - current);
        const lostRev = lost * deal;
        document.getElementById('lost-leads').textContent = lost.toLocaleString('it-IT');
        document.getElementById('lost-revenue').textContent = '€' + lostRev.toLocaleString('it-IT');
        """
    elif angle == "tech_modernization":
        calc_js = """
        const deployTime = parseFloat(form.deploy_time.value) || 120;
        const freq = parseFloat(form.deploy_freq.value) || 8;
        const cost = parseFloat(form.hourly_cost.value) || 60;
        const monthly = (deployTime / 60) * freq * cost;
        const yearly = monthly * 12;
        const saved = yearly * 0.8; // 80% time saved with automation
        document.getElementById('lost-leads').textContent = Math.round(saved).toLocaleString('it-IT');
        document.getElementById('lost-revenue').textContent = '€/anno risparmiati';
        """
    elif angle == "lead_gen_conversion":
        calc_js = """
        const traffic = parseFloat(form.monthly_traffic.value) || 1000;
        const current = (parseFloat(form.current_conv.value) || 0.3) / 100;
        const target = (parseFloat(form.target_conv.value) || 3.0) / 100;
        const deal = parseFloat(form.deal_value.value) || 15000;
        const currentLeads = traffic * current * 12;
        const targetLeads = traffic * target * 12;
        const gained = Math.round(targetLeads - currentLeads);
        const revenue = gained * deal;
        document.getElementById('lost-leads').textContent = '+' + gained.toLocaleString('it-IT');
        document.getElementById('lost-revenue').textContent = '€' + revenue.toLocaleString('it-IT') + ' fatturato aggiuntivo/anno';
        """
    else:
        calc_js = """
        const deals = parseFloat(form.enterprise_deals.value) || 5;
        const wr = (parseFloat(form.win_rate.value) || 15) / 100;
        const dealVal = parseFloat(form.deal_value.value) || 100000;
        const imp = (parseFloat(form.improvement.value) || 10) / 100;
        const currentWins = deals * wr;
        const newWins = deals * (wr + imp);
        const gained = Math.round(newWins - currentWins);
        const revenue = gained * dealVal;
        document.getElementById('lost-leads').textContent = '+' + gained.toLocaleString('it-IT');
        document.getElementById('lost-revenue').textContent = '€' + revenue.toLocaleString('it-IT') + ' fatturato aggiuntivo/anno';
        """

    # Build problem/solution items with template data
    problem_items = [item.format(**t_data) for item in template["problem_items"]]
    solution_items = [item.format(**t_data) for item in template["solution_items"]]

    html = f"""<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo - {t_data['company']} | ZAK Studio Web</title>
    <meta name="description" content="Demo personalizzata per {t_data['company']} - Trasformiamo il sito da vetrina a canale lead">
    <style>
        {get_css()}
    </style>
</head>
<body>
    <!-- Hero -->
    <header class="hero">
        <div class="container">
            <div class="hero-badge">{template['hero_badge'].format(**t_data)}</div>
            <h1>{template['hero_title'].format(**t_data)}</h1>
            <p>{template['hero_subtitle'].format(**t_data)}</p>
            <div class="hero-cta">
                <a href="#calculator" class="cta-primary">Calcola l'impatto →</a>
                <a href="{t_data['calendly_url']}" class="cta-secondary" target="_blank">Call 15 min</a>
            </div>
        </div>
    </header>

    <!-- Problem / Solution -->
    <section class="problem-solution">
        <div class="container">
            <div class="problem">
                <h2>Cosa succede oggi</h2>
                <ul>
                    {''.join(f'<li>{item}</li>' for item in problem_items)}
                </ul>
            </div>
            <div class="solution">
                <h2>Cosa costruiamo</h2>
                <ul>
                    {''.join(f'<li>{item}</li>' for item in solution_items)}
                </ul>
            </div>
        </div>
    </section>

    <!-- Interactive Calculator -->
    <section id="calculator" class="calculator">
        <div class="container">
            <h2>{template['calculator_title'].format(**t_data)}</h2>
            <form id="roi-form" onsubmit="event.preventDefault(); calculateROI();">
                {''.join(f'''
                <div class="form-group">
                    <label for="{f['name']}">{f['label']}</label>
                    <input type="{f['type']}" id="{f['name']}" name="{f['name']}" value="{f['value']}" {f.get('step', '')} required>
                </div>''' for f in template['calculator_fields'])}
                <button type="submit" class="cta-primary">Calcola</button>
            </form>
            <div id="roi-result" class="roi-result hidden">
                <p class="big-number" id="lost-leads">—</p>
                <p id="lost-revenue"></p>
                <a href="{t_data['calendly_url']}" class="cta-primary" target="_blank">Vuoi recuperarli? Call 15 min</a>
            </div>
        </div>
    </section>

    <!-- Case Study -->
    <section class="case-study">
        <div class="container">
            <h2>{template['case_study']['name']}: stesso settore, risultati reali</h2>
            <p class="case-study-meta">{template['case_study']['sector']} · {template['case_study']['employees']} dipendenti</p>
            <div class="metrics-grid">
                <div class="metric">
                    <span class="metric-value">0 → 14</span>
                    <span class="metric-label">Lead qualif./mese</span>
                </div>
                <div class="metric">
                    <span class="metric-value">-40%</span>
                    <span class="metric-label">CAC Google Ads</span>
                </div>
                <div class="metric">
                    <span class="metric-value">98/100</span>
                    <span class="metric-label">PageSpeed Mobile</span>
                </div>
                <div class="metric">
                    <span class="metric-value">3 settimane</span>
                    <span class="metric-label">Time-to-first-lead</span>
                </div>
            </div>
            <a href="{t_data['case_study_url']}" target="_blank" class="case-study-link">Leggi case study completo →</a>
        </div>
    </section>

    <!-- Demo Footer -->
    <footer class="demo-footer">
        <div class="container">
            <p>Demo personalizzata per <strong>{t_data['company']}</strong> generata da ZAK Studio Web</p>
            <p><a href="{t_data['calendly_url']}" target="_blank">Prenota call scoperta 15 min</a> · <a href="https://zakstudio.com">zakstudio.com</a></p>
        </div>
    </footer>

    <script>
        function calculateROI() {{
            const form = document.getElementById('roi-form');
            const result = document.getElementById('roi-result');
            {calc_js}
            result.classList.remove('hidden');
        }}
    </script>
</body>
</html>"""
    return html

def get_css() -> str:
    return """
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; background: #f8fafc; line-height: 1.6; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

/* Hero */
.hero { padding: 5rem 0; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #fff 100%); border-bottom: 1px solid #e2e8f0; }
.hero-badge { display: inline-block; padding: 0.5rem 1rem; background: #e86c00; color: #fff; font-size: 0.875rem; font-weight: 600; border-radius: 9999px; margin-bottom: 1rem; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; margin-bottom: 1.5rem; color: #1a3c5e; }
.hero p { font-size: clamp(1rem, 2.5vw, 1.25rem); color: #64748b; max-width: 70ch; margin: 0 auto 2rem; }
.hero-cta { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.cta-primary, .cta-secondary { display: inline-block; padding: 1rem 2rem; border-radius: 8px; font-weight: 600; text-decoration: none; transition: transform .15s, box-shadow .15s; }
.cta-primary { background: #1a3c5e; color: #fff; }
.cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,60,94,0.3); }
.cta-secondary { background: #fff; color: #1a3c5e; border: 2px solid #1a3c5e; }
.cta-secondary:hover { background: #1a3c5e; color: #fff; }

/* Problem/Solution */
.problem-solution { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; padding: 5rem 0; }
.problem h2, .solution h2 { font-size: 1.5rem; margin-bottom: 1.5rem; }
.problem ul, .solution ul { list-style: none; }
.problem li, .solution li { padding: 1rem; margin-bottom: 0.75rem; border-radius: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.problem li { border-left: 4px solid #ef4444; }
.solution li { border-left: 4px solid #22c55e; }

/* Calculator */
.calculator { padding: 5rem 0; background: #1a3c5e; color: #fff; text-align: center; }
.calculator h2 { font-size: 2rem; margin-bottom: 2rem; }
#roi-form { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 800px; margin: 0 auto 2rem; }
.form-group { flex: 1 1 200px; text-align: left; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-group input { width: 100%; padding: 0.75rem; border: none; border-radius: 8px; font-size: 1rem; }
#roi-form button { background: #e86c00; color: #fff; border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer; align-self: flex-end; }
.roi-result { margin-top: 2rem; }
.big-number { font-size: 4rem; font-weight: 800; color: #e86c00; }
.roi-result p:last-of-type { font-size: 1.25rem; margin: 1rem 0 2rem; }
.hidden { display: none; }

/* Case Study */
.case-study { padding: 5rem 0; text-align: center; background: #fff; border-top: 1px solid #e2e8f0; }
.case-study h2 { font-size: 2rem; margin-bottom: 0.5rem; color: #1a3c5e; }
.case-study-meta { color: #64748b; margin-bottom: 2rem; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin: 3rem 0; }
.metric-value { display: block; font-size: 3rem; font-weight: 800; color: #1a3c5e; }
.metric-label { font-size: 1rem; color: #64748b; }
.case-study-link { display: inline-block; margin-top: 1rem; color: #1a3c5e; font-weight: 600; text-decoration: none; }
.case-study-link:hover { text-decoration: underline; }

/* Footer */
.demo-footer { padding: 3rem 0; text-align: center; color: #64748b; font-size: 0.875rem; border-top: 1px solid #e2e8f0; }
.demo-footer a { color: #1a3c5e; text-decoration: none; margin: 0 0.5rem; }
.demo-footer a:hover { text-decoration: underline; }

/* Mobile */
@media (max-width: 768px) {
    .problem-solution { grid-template-columns: 1fr; gap: 2rem; }
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
    .form-group { flex: 1 1 100%; }
}
"""

def create_demo_directory(lead: dict) -> Path:
    """Create demo directory structure"""
    slug = lead["slug"]
    demo_dir = PROJECT_DIR / "03-output" / "demos" / slug
    assets_dir = demo_dir / "assets"
    images_dir = assets_dir / "images"

    demo_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(exist_ok=True)
    images_dir.mkdir(exist_ok=True)

    return demo_dir

def write_demo_files(lead: dict, demo_dir: Path):
    """Write demo HTML and assets"""
    html = generate_demo_html(lead)
    (demo_dir / "index.html").write_text(html, encoding="utf-8")

    # Netlify config
    netlify_toml = f"""[build]
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
"""
    (demo_dir / "netlify.toml").write_text(netlify_toml)

    # Deploy manifest
    deploy_manifest = {
        "company": lead["company"],
        "domain": lead["domain"],
        "slug": lead["slug"],
        "angle": lead["recommended_angle"],
        "pain_score": lead["pain_score"],
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "demo_url": f"https://demo-zak-{lead['slug']}.netlify.app"
    }
    (demo_dir / "deploy.json").write_text(json.dumps(deploy_manifest, indent=2, ensure_ascii=False), encoding="utf-8")

def deploy_to_netlify(demo_dir: Path, slug: str) -> dict:
    """Deploy demo to Netlify"""
    site_name = f"demo-zak-{slug}"

    # Check if netlify CLI is available
    try:
        result = subprocess.run(
            ["netlify", "deploy", "--dir", str(demo_dir), "--site", site_name, "--prod", "--json"],
            capture_output=True, text=True, timeout=120,
            env={**os.environ, "NETLIFY_AUTH_TOKEN": NETLIFY_AUTH_TOKEN}
        )

        if result.returncode == 0:
            deploy_data = json.loads(result.stdout)
            return {
                "success": True,
                "url": deploy_data.get("url", f"https://{site_name}.netlify.app"),
                "deploy_id": deploy_data.get("id", ""),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            print(f"  Netlify deploy failed: {result.stderr[:200]}")
            return {
                "success": False,
                "error": result.stderr[:500],
                "url": f"https://{site_name}.netlify.app"  # Expected URL
            }
    except FileNotFoundError:
        print("  Netlify CLI not found, skipping deploy")
        return {
            "success": False,
            "error": "Netlify CLI not installed",
            "url": f"https://demo-zak-{slug}.netlify.app"
        }
    except Exception as e:
        print(f"  Deploy error: {e}")
        return {
            "success": False,
            "error": str(e),
            "url": f"https://demo-zak-{slug}.netlify.app"
        }

def update_leads_with_demo_url(leads: list) -> list:
    """Update leads with demo URLs"""
    for lead in leads:
        if lead["priority_tier"] in ["A", "B"]:
            slug = lead["slug"]
            lead["demo_url"] = f"https://demo-zak-{slug}.netlify.app"
    return leads

def save_demo_manifest(leads: list):
    """Save demo manifest for email writing step"""
    manifest = {}
    for lead in leads:
        if lead["priority_tier"] in ["A", "B"]:
            manifest[lead["slug"]] = {
                "demo_url": lead.get("demo_url", f"https://demo-zak-{lead['slug']}.netlify.app"),
                "angle": lead["recommended_angle"],
                "pain_score": lead["pain_score"]
            }

    manifest_path = PROJECT_DIR / "03-output" / "demos" / "deploy-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Demo manifest salvato: {manifest_path}")

def main():
    print("="*60)
    print("STEP 2: DEMO GENERATION")
    print("="*60)

    # Load leads
    leads_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    with open(leads_path, encoding="utf-8") as f:
        leads = json.load(f)

    # Filter Tier A/B
    tier_ab = [l for l in leads if l["priority_tier"] in ["A", "B"]]
    print(f"Generando demo per {len(tier_ab)} lead (Tier A/B)...")

    for i, lead in enumerate(tier_ab):
        print(f"\n[{i+1}/{len(tier_ab)}] {lead['company']} ({lead['domain']}) - Angle: {lead['recommended_angle']}")

        try:
            # Create demo directory
            demo_dir = create_demo_directory(lead)

            # Write demo files
            write_demo_files(lead, demo_dir)
            print(f"  File generati in {demo_dir}")

            # Deploy to Netlify
            print(f"  Deploy su Netlify...")
            deploy_result = deploy_to_netlify(demo_dir, lead["slug"])

            if deploy_result["success"]:
                print(f"  [OK] Deployato: {deploy_result['url']}")
            else:
                print(f"  [WARN] Deploy fallito: {deploy_result.get('error', 'unknown')}")
                print(f"  URL atteso: {deploy_result['url']}")

            # Update lead with demo URL
            lead["demo_url"] = deploy_result["url"]
            lead["demo_deploy"] = deploy_result

        except Exception as e:
            print(f"  ERRORE: {e}")
            lead["demo_url"] = f"https://demo-zak-{lead['slug']}.netlify.app"
            lead["demo_deploy"] = {"success": False, "error": str(e)}

    # Update leads with demo URLs
    leads = update_leads_with_demo_url(leads)

    # Save updated leads
    with open(leads_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)

    # Save demo manifest
    save_demo_manifest(leads)

    print("\n" + "="*60)
    print("RIASSUNTO STEP 2")
    print("="*60)
    print(f"Demo generate: {len(tier_ab)}")
    print(f"File in: 03-output/demos/")
    print(f"Manifest: 03-output/demos/deploy-manifest.json")
    print(f"Leads aggiornati con demo_url in 02-data/leads_enriched.json")

if __name__ == "__main__":
    main()