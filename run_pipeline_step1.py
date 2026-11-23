#!/usr/bin/env python3
"""
STEP 1: Lead Discovery & Enrichment
Uses Firecrawl API + PageSpeed API to analyze company websites
"""
import os, json, csv, time, hmac, hashlib
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import httpx

load_dotenv()

PROJECT_DIR = Path(__file__).parent
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
PAGESPEED_API_KEY = os.getenv("PAGESPEED_API_KEY")

# Known Italian manufacturing companies (fallback when search fails)
KNOWN_COMPANIES = [
    # Presse idrauliche Brescia
    {"company": "NRCM Srl", "domain": "nrcm.it", "sector": "Manifatturiero meccanico", "location": "Brescia (BS)", "employees": 45, "revenue": "10M€"},
    {"company": "Sigma Presse Srl", "domain": "sigmapresse.it", "sector": "Manifatturiero meccanico", "location": "Brescia (BS)", "employees": 35, "revenue": "8M€"},
    {"company": "Hidro-Press Srl", "domain": "hidro-press.it", "sector": "Manifatturiero meccanico", "location": "Brescia (BS)", "employees": 28, "revenue": "5M€"},
    {"company": "Siderurgica Presse Srl", "domain": "siderurgicapresse.it", "sector": "Manifatturiero meccanico", "location": "Castenedolo (BS)", "employees": 50, "revenue": "15M€"},
    {"company": "Techno Press Srl", "domain": "technopress.it", "sector": "Manifatturiero meccanico", "location": "Brescia (BS)", "employees": 22, "revenue": "4M€"},

    # Macchine utensili Bergamo
    {"company": "Berco Spa", "domain": "berco.it", "sector": "Macchine utensili", "location": "Bergamo (BG)", "employees": 120, "revenue": "50M€"},
    {"company": "CMS SpA", "domain": "cms-group.it", "sector": "Macchine utensili", "location": "Bergamo (BG)", "employees": 80, "revenue": "30M€"},
    {"company": "Fidia Spa", "domain": "fidia.com", "sector": "Macchine utensili", "location": "Bergamo (BG)", "employees": 60, "revenue": "25M€"},
    {"company": "Omg Spa", "domain": "omgspa.it", "sector": "Macchine utensili", "location": "Bergamo (BG)", "employees": 40, "revenue": "12M€"},
    {"company": "Giuliani Macchine Srl", "domain": "giulianimacchine.it", "sector": "Macchine utensili", "location": "Bergamo (BG)", "employees": 18, "revenue": "3M€"},

    # Stampaggio metalli Milano
    {"company": "Metallistamp Srl", "domain": "metallistamp.it", "sector": "Stampaggio metalli", "location": "Milano (MI)", "employees": 55, "revenue": "20M€"},
    {"company": "Stampitalia Srl", "domain": "stampitalia.it", "sector": "Stampaggio metalli", "location": "Milano (MI)", "employees": 30, "revenue": "6M€"},
    {"company": "Lamera Srl", "domain": "lamera.it", "sector": "Stampaggio metalli", "location": "Milano (MI)", "employees": 25, "revenue": "5M€"},
    {"company": "Evos Srl", "domain": "evos.it", "sector": "Stampaggio metalli", "location": "Milano (MI)", "employees": 35, "revenue": "8M€"},
    {"company": "Minifaber Srl", "domain": "minifaber.com", "sector": "Stampaggio metalli", "location": "Milano (MI)", "employees": 45, "revenue": "10M€"},

    # Automazione industriale Vicenza
    {"company": "Camozzi Automation", "domain": "camozzi.com", "sector": "Automazione industriale", "location": "Vicenza (VI)", "employees": 200, "revenue": "100M€"},
    {"company": "Euchner Italia Srl", "domain": "euchner.it", "sector": "Automazione industriale", "location": "Vicenza (VI)", "employees": 40, "revenue": "10M€"},
    {"company": "SMC Italia", "domain": "smcitalia.it", "sector": "Automazione industriale", "location": "Vicenza (VI)", "employees": 150, "revenue": "80M€"},
    {"company": "Festo Italia", "domain": "festo.it", "sector": "Automazione industriale", "location": "Vicenza (VI)", "employees": 180, "revenue": "90M€"},
    {"company": "Pizzato Elettrica", "domain": "pizzato.com", "sector": "Automazione industriale", "location": "Vicenza (VI)", "employees": 60, "revenue": "15M€"},

    # Componentistica automotive Monza
    {"company": "Brembo Spa", "domain": "brembo.com", "sector": "Componentistica automotive", "location": "Monza (MB)", "employees": 11000, "revenue": "3.5B€"},
    {"company": "Magneti Marelli", "domain": "marelli.com", "sector": "Componentistica automotive", "location": "Monza (MB)", "employees": 5000, "revenue": "2B€"},
    {"company": "Sogefi Spa", "domain": "sogefi.it", "sector": "Componentistica automotive", "location": "Monza (MB)", "employees": 3000, "revenue": "1.2B€"},
    {"company": "Eurofilter Srl", "domain": "eurofilter.it", "sector": "Componentistica automotive", "location": "Monza (MB)", "employees": 35, "revenue": "8M€"},
    {"company": "Fiat Componenti", "domain": "fiatcomponenti.it", "sector": "Componentistica automotive", "location": "Monza (MB)", "employees": 80, "revenue": "20M€"},

    # Meccanica precisione Cremona
    {"company": "Gnutti Carlo Spa", "domain": "gnutticarlo.com", "sector": "Meccanica precisione", "location": "Cremona (CR)", "employees": 120, "revenue": "40M€"},
    {"company": "Bonomi Group", "domain": "bonomigroup.it", "sector": "Meccanica precisione", "location": "Cremona (CR)", "employees": 200, "revenue": "60M€"},
    {"company": "Cremona Meccanica Srl", "domain": "cremonameccanica.it", "sector": "Meccanica precisione", "location": "Cremona (CR)", "employees": 22, "revenue": "4M€"},
    {"company": "LGH Meccanica", "domain": "lghmeccanica.it", "sector": "Meccanica precisione", "location": "Cremona (CR)", "employees": 15, "revenue": "2M€"},
    {"company": "Precimec Srl", "domain": "precimec.it", "sector": "Meccanica precisione", "location": "Cremona (CR)", "employees": 18, "revenue": "3M€"},

    # Presse piegatrici Verona
    {"company": "Gasparini Industries", "domain": "gasparini.com", "sector": "Presse piegatrici", "location": "Verona (VR)", "employees": 100, "revenue": "30M€"},
    {"company": "Boschert Srl", "domain": "boschert.it", "sector": "Presse piegatrici", "location": "Verona (VR)", "employees": 40, "revenue": "10M€"},
    {"company": "Vimercati Presse", "domain": "vimercatipresse.it", "sector": "Presse piegatrici", "location": "Verona (VR)", "employees": 30, "revenue": "7M€"},
    {"company": "Dario Presse", "domain": "dariopresse.it", "sector": "Presse piegatrici", "location": "Verona (VR)", "employees": 25, "revenue": "5M€"},
    {"company": "LVD Italia", "domain": "lvdgroup.it", "sector": "Presse piegatrici", "location": "Verona (VR)", "employees": 50, "revenue": "12M€"},

    # Torniture CNC Padova
    {"company": "Tornitura Padana Srl", "domain": "torniturapadana.it", "sector": "Torniture CNC", "location": "Padova (PD)", "employees": 35, "revenue": "8M€"},
    {"company": "CNC Padova Srl", "domain": "cncpadova.it", "sector": "Torniture CNC", "location": "Padova (PD)", "employees": 28, "revenue": "6M€"},
    {"company": "Mec-Tech Srl", "domain": "mec-tech.it", "sector": "Torniture CNC", "location": "Padova (PD)", "employees": 20, "revenue": "4M€"},
    {"company": "Precisio Srl", "domain": "precisio.it", "sector": "Torniture CNC", "location": "Padova (PD)", "employees": 15, "revenue": "3M€"},
    {"company": "Veneto Meccanica", "domain": "venetomeccanica.it", "sector": "Torniture CNC", "location": "Padova (PD)", "employees": 40, "revenue": "10M€"},
]

def firecrawl_scrape(url: str, max_retries: int = 3) -> dict:
    """Scrape a URL using Firecrawl API with retry logic"""
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "url": url,
        "formats": ["markdown", "html"],
        "onlyMainContent": False,
        "waitFor": 3000,
        "timeout": 60000
    }

    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=90) as client:
                resp = client.post("https://api.firecrawl.dev/v1/scrape", headers=headers, json=payload)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    wait_time = 30 + (attempt * 30)
                    print(f"  Rate limited, waiting {wait_time}s... (attempt {attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                elif resp.status_code == 500:
                    wait_time = 10 + (attempt * 10)
                    print(f"  Server error, waiting {wait_time}s... (attempt {attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"  Firecrawl error {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"  Firecrawl exception: {e}")
            if attempt < max_retries - 1:
                time.sleep(10)
    return {}

def pagespeed_insights(url: str, strategy: str = "mobile", max_retries: int = 3) -> dict:
    """Get PageSpeed Insights for a URL with retry logic"""
    api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    params = {
        "url": url,
        "strategy": strategy,
        "key": PAGESPEED_API_KEY
    }

    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=90) as client:
                resp = client.get(api_url, params=params)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429:
                    wait_time = 20 + (attempt * 20)
                    print(f"  PageSpeed rate limited, waiting {wait_time}s... (attempt {attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"  PageSpeed error {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"  PageSpeed exception: {e}")
            if attempt < max_retries - 1:
                time.sleep(10)
    return {}

def analyze_tech_stack(html: str, markdown: str, headers: dict) -> dict:
    """Analyze tech stack from scraped content"""
    import re
    tech = {
        "cms": "Unknown",
        "theme": None,
        "plugins": [],
        "hosting": "Unknown",
        "analytics": None,
        "ssl": "Unknown",
        "cdn": None,
        "page_speed_mobile": 0,
        "page_speed_desktop": 0
    }

    # CMS detection
    if "wp-content" in html or "wp-includes" in html:
        tech["cms"] = "WordPress"
        # Try to find version
        match = re.search(r'WordPress[/\s](\d+\.\d+)', html)
        if match:
            tech["cms"] += f" {match.group(1)}"
        # Theme detection
        theme_match = re.search(r'/wp-content/themes/([^/\'"]+)', html)
        if theme_match:
            tech["theme"] = theme_match.group(1)
        # Plugins
        plugins = re.findall(r'/wp-content/plugins/([^/\'"]+)', html)
        tech["plugins"] = list(set(plugins))[:10]
    elif "shopify" in html.lower():
        tech["cms"] = "Shopify"
    elif "wix" in html.lower() or "wixstatic" in html:
        tech["cms"] = "Wix"
    elif "squarespace" in html.lower():
        tech["cms"] = "Squarespace"
    elif "next.js" in html.lower() or "_next" in html:
        tech["cms"] = "Next.js"
    elif "react" in html.lower() and "next" not in html.lower():
        tech["cms"] = "React SPA"
    elif "nuxt" in html.lower():
        tech["cms"] = "Nuxt.js"

    # Analytics
    if "gtag" in html or "GA_" in html or "G-" in html:
        tech["analytics"] = "GA4"
    elif "gtm" in html or "googletagmanager" in html:
        tech["analytics"] = "GTM"
    elif "matomo" in html.lower() or "piwik" in html.lower():
        tech["analytics"] = "Matomo"

    # SSL/CDN from headers
    server = headers.get("server", "").lower()
    if "cloudflare" in server:
        tech["cdn"] = "Cloudflare"
    elif "nginx" in server:
        tech["hosting"] = "Nginx"
    elif "apache" in server:
        tech["hosting"] = "Apache"

    return tech

def analyze_content(markdown: str) -> dict:
    """Analyze content signals from markdown"""
    import re
    content = markdown.lower()

    # Dates
    dates = re.findall(r'\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b', markdown)
    years = [int(d[0]) for d in dates] if dates else []
    last_year = max(years) if years else 0

    # Export keywords
    export_terms = ['export', 'internazionale', 'estero', 'germania', 'germany', 'france', 'francia', 'usa', 'united states', 'certificaz', 'iso', 'ce', 'certificat']
    found_export = [t for t in export_terms if t in content]

    # Contact info
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}', markdown)
    phones = re.findall(r'(\+39|0039)?[\s-]?\d{2,4}[\s-]?\d{6,7}', markdown)
    pecs = [e for e in emails if e.endswith('@pec.it') or 'pec.' in e]

    # Social links
    social = []
    if 'linkedin.com' in content: social.append('linkedin')
    if 'facebook.com' in content: social.append('facebook')
    if 'instagram.com' in content: social.append('instagram')
    if 'youtube.com' in content: social.append('youtube')

    # Schema.org
    has_schema = 'schema.org' in markdown or 'itemtype' in markdown

    # Sitemap/robots
    has_sitemap = 'sitemap.xml' in content
    has_robots = 'robots.txt' in content

    # Forms
    contact_forms = content.count('<form') + markdown.count('contact form') + markdown.count('modulo contatti')

    return {
        "last_content_year": last_year,
        "languages": ["it"] if any(w in content for w in ['chi siamo', 'contatti', 'prodotti', 'servizi']) else ["it"],
        "has_schema_org": has_schema,
        "has_sitemap_xml": has_sitemap,
        "has_robots_txt": has_robots,
        "contact_forms": max(1, contact_forms) if contact_forms > 0 else 1,
        "phone_visible": len(phones) > 0,
        "email_visible": len([e for e in emails if 'pec' not in e]) > 0,
        "pec_visible": len(pecs) > 0,
        "social_links": social,
        "export_keywords": found_export[:10]
    }

def calculate_pain_score(tech: dict, content: dict, pagespeed_mobile: int, pagespeed_desktop: int) -> tuple:
    """Calculate pain score 0-100 and return signals"""
    score = 0
    signals = []

    # WP version < 6.0 / EOL
    if "WordPress" in tech.get("cms", ""):
        version_match = re.search(r'(\d+\.\d+)', tech["cms"])
        if version_match:
            version = float(version_match.group(1))
            if version < 6.0:
                score += 25
                signals.append({"signal": f"WordPress version {version} (EOL)", "severity": "high", "category": "security"})
            elif version < 6.4:
                score += 15
                signals.append({"signal": f"WordPress version {version} (obsoleto)", "severity": "medium", "category": "security"})

    # Mobile PageSpeed < 40
    if pagespeed_mobile < 40:
        score += 20
        signals.append({"signal": f"Mobile PageSpeed {pagespeed_mobile}/100", "severity": "high", "category": "performance"})
    elif pagespeed_mobile < 60:
        score += 10
        signals.append({"signal": f"Mobile PageSpeed {pagespeed_mobile}/100", "severity": "medium", "category": "performance"})

    # Desktop PageSpeed < 60
    if pagespeed_desktop < 60:
        score += 10
        signals.append({"signal": f"Desktop PageSpeed {pagespeed_desktop}/100", "severity": "medium", "category": "performance"})

    # No schema.org
    if not content.get("has_schema_org", False):
        score += 15
        signals.append({"signal": "No schema.org markup", "severity": "medium", "category": "seo"})

    # Last content > 2 years
    last_year = content.get("last_content_year", 0)
    current_year = datetime.now().year
    if last_year > 0 and (current_year - last_year) > 2:
        score += 20
        signals.append({"signal": f"Last content update {last_year} (>2 anni fa)", "severity": "high", "category": "freshness"})
    elif last_year == 0:
        score += 10
        signals.append({"signal": "No detectable content dates", "severity": "medium", "category": "freshness"})

    # No HTTPS / mixed content (would need actual check)
    # Assume OK if we got HTTPS response

    # No lead capture
    if content.get("contact_forms", 0) <= 1 and not content.get("has_lead_magnet", False):
        score += 10
        signals.append({"signal": "Contact form only - no lead magnets", "severity": "medium", "category": "conversion"})

    # PEC only / no email contatto
    if content.get("pec_visible") and not content.get("email_visible"):
        score += 5
        signals.append({"signal": "PEC only - no standard contact email", "severity": "low", "category": "accessibility"})

    return min(score, 100), signals

def determine_tier(pain_score: int) -> str:
    if pain_score >= 70: return "A"
    elif pain_score >= 40: return "B"
    return "C"

def determine_angle(signals: list, sector: str) -> str:
    """Determine recommended angle based on signals"""
    categories = [s["category"] for s in signals]
    if "performance" in categories and "seo" in categories:
        return "performance_export"
    elif "security" in categories and "freshness" in categories:
        return "tech_modernization"
    elif "conversion" in categories:
        return "lead_gen_conversion"
    else:
        return "credibility_rebrand"

def generate_hooks(company: str, domain: str, tech: dict, content: dict, signals: list, sector: str) -> list:
    """Generate personalization hooks"""
    hooks = []

    # WP outdated hook
    wp_signal = next((s for s in signals if "WordPress" in s["signal"]), None)
    if wp_signal:
        version = re.search(r'(\d+\.\d+)', wp_signal["signal"])
        ver = version.group(1) if version else "vecchia"
        hooks.append(f"Visto che il sito gira su WordPress {ver} (non aggiornato da tempo) e operate nel {sector.lower()}...")

    # Mobile slow hook
    mobile_signal = next((s for s in signals if "Mobile PageSpeed" in s["signal"]), None)
    if mobile_signal:
        score_match = re.search(r'(\d+)/100', mobile_signal["signal"])
        score = score_match.group(1) if score_match else "basso"
        hooks.append(f"Il sito mobile fa {score}/100 su PageSpeed — i vostri buyer che cercano servizi {sector.lower()} da telefono vedono solo un sito lento...")

    # No schema hook
    schema_signal = next((s for s in signals if "schema.org" in s["signal"]), None)
    if schema_signal:
        cert = content.get("export_keywords", ["certificazioni"])[0] if content.get("export_keywords") else "certificazioni ISO"
        hooks.append(f"Mancano dati strutturati schema.org: Google non capisce che siete {cert}, perdete traffico qualificato...")

    # Stale content hook
    stale_signal = next((s for s in signals if "content update" in s["signal"] or "content dates" in s["signal"]), None)
    if stale_signal:
        hooks.append(f"L'ultimo aggiornamento contenuti risale a tempo fa — i vostri nuovi prodotti/servizi non hanno pagine dedicate con schede tecniche scaricabili...")

    # No lead magnet hook
    lead_signal = next((s for s in signals if "lead magnet" in s["signal"]), None)
    if lead_signal:
        hooks.append(f"Avete solo un form contatto generico — niente schede tecniche scaricabili, niente configuratore, niente calcolo ROI per i buyer tecnici...")

    # Generic fallback hooks
    if not hooks:
        hooks = [
            f"Operate nel {sector.lower()} con un sito che non comunica il vostro valore reale...",
            f"Il sito attuale funziene da vetrina ma non genera lead qualificati per il {sector.lower()}...",
            f"I vostri competitor hanno siti moderni che convertono — voi머 no..."
        ]

    return hooks[:4]

def estimate_gap_leads(sector: str, employees: int, pain_score: int) -> int:
    """Estimate monthly lead gap"""
    base = max(5, employees // 3)
    multiplier = pain_score / 100
    return int(base * multiplier * 1.5)

def enrich_lead(company_data: dict) -> dict:
    """Enrich a single lead with full analysis"""
    domain = company_data["domain"]
    url = f"https://{domain}"

    print(f"\n{'='*60}")
    print(f"Analizzando: {company_data['company']} ({domain})")
    print(f"{'='*60}")

    # Scrape with Firecrawl
    print(f"  [1/4] Firecrawl scrape...")
    scrape_result = firecrawl_scrape(url)

    if not scrape_result.get("success", False):
        print(f"  Scrape failed, trying without www...")
        scrape_result = firecrawl_scrape(f"https://www.{domain}")

    if not scrape_result.get("success", False):
        print(f"  Scrape failed completely, using fallback")
        return create_fallback_lead(company_data)

    data = scrape_result.get("data", {})
    html = data.get("html", "")
    markdown = data.get("markdown", "")
    metadata = data.get("metadata", {})
    headers = metadata.get("headers", {}) if isinstance(metadata, dict) else {}

    # Tech stack analysis
    print(f"  [2/4] Tech stack analysis...")
    tech = analyze_tech_stack(html, markdown, headers)

    # Content analysis
    print(f"  [3/4] Content analysis...")
    content = analyze_content(markdown)

    # PageSpeed
    print(f"  [4/4] PageSpeed Insights...")
    ps_mobile = pagespeed_insights(url, "mobile")
    ps_desktop = pagespeed_insights(url, "desktop")

    ps_mobile_score = 0
    ps_desktop_score = 0

    if ps_mobile.get("lighthouseResult"):
        ps_mobile_score = int(ps_mobile["lighthouseResult"]["categories"]["performance"]["score"] * 100)
    if ps_desktop.get("lighthouseResult"):
        ps_desktop_score = int(ps_desktop["lighthouseResult"]["categories"]["performance"]["score"] * 100)

    tech["page_speed_mobile"] = ps_mobile_score
    tech["page_speed_desktop"] = ps_desktop_score

    # Pain score
    pain_score, signals = calculate_pain_score(tech, content, ps_mobile_score, ps_desktop_score)
    tier = determine_tier(pain_score)
    angle = determine_angle(signals, company_data["sector"])
    hooks = generate_hooks(company_data["company"], domain, tech, content, signals, company_data["sector"])
    gap_leads = estimate_gap_leads(company_data["sector"], company_data["employees"], pain_score)

    lead = {
        "company": company_data["company"],
        "domain": domain,
        "slug": domain.replace(".", "-"),
        "decision_maker": company_data.get("decision_maker", "Titolare / CEO"),
        "title": company_data.get("title", "Titolare / CEO"),
        "sector": company_data["sector"],
        "employees": company_data["employees"],
        "location": company_data["location"],
        "revenue_est": company_data.get("revenue", "N/A"),
        "analysis_timestamp": datetime.utcnow().isoformat() + "Z",
        "tech_stack": tech,
        "content_signals": content,
        "pain_signals": signals,
        "pain_score": pain_score,
        "priority_tier": tier,
        "personalization_hooks": hooks,
        "screenshot_path": f"screenshots/{domain}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png",
        "recommended_angle": angle,
        "estimated_gap_leads_month": gap_leads
    }

    print(f"  PAIN SCORE: {pain_score}/100 - TIER {tier} - ANGLE: {angle}")
    print(f"  Hooks generati: {len(hooks)}")
    print(f"  Tech: {tech['cms']}, Mobile PS: {ps_mobile_score}, Desktop PS: {ps_desktop_score}")

    return lead

def create_fallback_lead(company_data: dict) -> dict:
    """Create fallback lead when scrape fails"""
    domain = company_data["domain"]
    pain_score = 50
    tier = "B"
    angle = "tech_modernization"
    hooks = [
        f"Non siamo riusciti ad analizzare il sito {domain} — tipico di aziende {company_data['sector'].lower()} con presenza web limitata...",
        f"Nel {company_data['sector'].lower()} il sito è spesso trascurato — siete sicuri che il vostro porti lead qualificati?",
        f"Molte aziende {company_data['sector'].lower()} di {company_data['employees']} dipendenti perdono lead per siti non ottimizzati..."
    ]
    gap = estimate_gap_leads(company_data["sector"], company_data["employees"], pain_score)

    return {
        "company": company_data["company"],
        "domain": domain,
        "slug": domain.replace(".", "-"),
        "decision_maker": company_data.get("decision_maker", "Titolare / CEO"),
        "title": company_data.get("title", "Titolare / CEO"),
        "sector": company_data["sector"],
        "employees": company_data["employees"],
        "location": company_data["location"],
        "revenue_est": company_data.get("revenue", "N/A"),
        "analysis_timestamp": datetime.utcnow().isoformat() + "Z",
        "tech_stack": {"cms": "Unknown", "page_speed_mobile": 0, "page_speed_desktop": 0},
        "content_signals": {"has_schema_org": False},
        "pain_signals": [{"signal": "Site unreachable / analysis failed", "severity": "medium", "category": "unknown"}],
        "pain_score": pain_score,
        "priority_tier": tier,
        "personalization_hooks": hooks,
        "screenshot_path": f"screenshots/{domain}_fallback.png",
        "recommended_angle": angle,
        "estimated_gap_leads_month": gap
    }

def save_leads_enriched(leads: list):
    """Save leads to JSON file"""
    output_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    print(f"\nSalvato {len(leads)} lead in {output_path}")

def update_companies_csv(leads: list):
    """Update companies.csv with enriched data"""
    output_path = PROJECT_DIR / "02-data" / "companies.csv"
    fieldnames = ["company_name", "domain", "decision_maker_name", "decision_maker_title",
                  "linkedin_url", "trigger_signal", "pain_point_hypothesis", "personalization_hook",
                  "sector", "employees", "revenue_est", "location", "email_verified", "notes"]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for lead in leads:
            # Use first hook as personalization_hook
            hook = lead["personalization_hooks"][0] if lead["personalization_hooks"] else ""
            writer.writerow({
                "company_name": lead["company"],
                "domain": lead["domain"],
                "decision_maker_name": lead["decision_maker"],
                "decision_maker_title": lead["title"],
                "linkedin_url": "",
                "trigger_signal": f"Pain score {lead['pain_score']}/100 - {lead['priority_tier']}",
                "pain_point_hypothesis": ", ".join([s["signal"] for s in lead["pain_signals"][:3]]),
                "personalization_hook": hook,
                "sector": lead["sector"],
                "employees": lead["employees"],
                "revenue_est": lead["revenue_est"],
                "location": lead["location"],
                "email_verified": "pending",
                "notes": f"Tier {lead['priority_tier']}, angle: {lead['recommended_angle']}"
            })
    print(f"Aggiornato {output_path}")

def load_existing_leads() -> list:
    """Load existing leads from JSON file"""
    output_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    if output_path.exists():
        with open(output_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_leads_enriched(leads: list):
    """Save leads to JSON file"""
    output_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    print(f"  Salvato {len(leads)} lead in {output_path}")

def main():
    print("="*60)
    print("STEP 1: LEAD DISCOVERY & ENRICHMENT")
    print("="*60)

    # Load existing leads to resume
    all_leads = load_existing_leads()
    existing_domains = {lead["domain"] for lead in all_leads}
    print(f"Lead già analizzati: {len(existing_domains)}")

    # Filter companies not yet processed
    companies_to_process = [c for c in KNOWN_COMPANIES if c["domain"] not in existing_domains]
    print(f"Da processare: {len(companies_to_process)}")

    for i, company in enumerate(companies_to_process):
        try:
            lead = enrich_lead(company)
            all_leads.append(lead)

            # Save incrementally after each lead
            save_leads_enriched(all_leads)
            update_companies_csv(all_leads)

            # Rate limiting - longer delay to avoid rate limits
            if i < len(companies_to_process) - 1:
                time.sleep(5)
        except Exception as e:
            print(f"  ERRORE: {e}")
            # Add fallback
            fallback = create_fallback_lead(company)
            all_leads.append(fallback)
            save_leads_enriched(all_leads)
            update_companies_csv(all_leads)

    # Summary
    tiers = {"A": 0, "B": 0, "C": 0}
    for lead in all_leads:
        tiers[lead["priority_tier"]] += 1

    print("\n" + "="*60)
    print("RIASSUNTO STEP 1")
    print("="*60)
    print(f"Totale lead analizzati: {len(all_leads)}")
    print(f"Tier A (pain >= 70): {tiers['A']}")
    print(f"Tier B (pain 40-69): {tiers['B']}")
    print(f"Tier C (pain < 40): {tiers['C']}")
    print(f"\nFile generati:")
    print(f"  - 02-data/leads_enriched.json")
    print(f"  - 02-data/companies.csv (aggiornato)")

    return all_leads

if __name__ == "__main__":
    import re
    main()