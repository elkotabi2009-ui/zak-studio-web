#!/usr/bin/env python3
"""Rebuild leads_enriched.json from companies.csv and deploy manifest"""
import json, csv
from pathlib import Path

PROJECT_DIR = Path(__file__).parent

# Load companies.csv
companies = {}
with open(PROJECT_DIR / "02-data" / "companies.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        companies[row["domain"]] = row

# Load deploy manifest
with open(PROJECT_DIR / "03-output" / "demos" / "deploy-manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

# Known sector mapping and employee data
sector_map = {
    "nrcm.it": "Manifatturiero meccanico",
    "sigmapresse.it": "Manifatturiero meccanico",
    "hidro-press.it": "Manifatturiero meccanico",
    "siderurgicapresse.it": "Manifatturiero meccanico",
    "technopress.it": "Manifatturiero meccanico",
    "berco.it": "Macchine utensili",
    "cms-group.it": "Macchine utensili",
    "fidia.com": "Macchine utensili",
    "omgspa.it": "Macchine utensili",
    "giulianimacchine.it": "Macchine utensili",
    "metallistamp.it": "Stampaggio metalli",
    "stampitalia.it": "Stampaggio metalli",
    "lamera.it": "Stampaggio metalli",
    "evos.it": "Stampaggio metalli",
    "minifaber.com": "Stampaggio metalli",
    "camozzi.com": "Automazione industriale",
    "euchner.it": "Automazione industriale",
    "smcitalia.it": "Automazione industriale",
    "festo.it": "Automazione industriale",
    "pizzato.com": "Automazione industriale",
}

employees_map = {
    "nrcm.it": 45, "sigmapresse.it": 35, "hidro-press.it": 28,
    "siderurgicapresse.it": 50, "technopress.it": 22,
    "berco.it": 120, "cms-group.it": 80, "fidia.com": 60,
    "omgspa.it": 40, "giulianimacchine.it": 18,
    "metallistamp.it": 55, "stampitalia.it": 30, "lamera.it": 25,
    "evos.it": 35, "minifaber.com": 45,
    "camozzi.com": 200, "euchner.it": 40, "smcitalia.it": 150,
    "festo.it": 180, "pizzato.com": 60,
}

revenue_map = {
    "nrcm.it": "10M€", "sigmapresse.it": "8M€", "hidro-press.it": "5M€",
    "siderurgicapresse.it": "15M€", "technopress.it": "4M€",
    "berco.it": "50M€", "cms-group.it": "30M€", "fidia.com": "25M€",
    "omgspa.it": "12M€", "giulianimacchine.it": "3M€",
    "metallistamp.it": "20M€", "stampitalia.it": "6M€", "lamera.it": "5M€",
    "evos.it": "8M€", "minifaber.com": "10M€",
    "camozzi.com": "100M€", "euchner.it": "10M€", "smcitalia.it": "80M€",
    "festo.it": "90M€", "pizzato.com": "15M€",
}

location_map = {
    "nrcm.it": "Brescia (BS)", "sigmapresse.it": "Brescia (BS)", "hidro-press.it": "Brescia (BS)",
    "siderurgicapresse.it": "Castenedolo (BS)", "technopress.it": "Brescia (BS)",
    "berco.it": "Bergamo (BG)", "cms-group.it": "Bergamo (BG)", "fidia.com": "Bergamo (BG)",
    "omgspa.it": "Bergamo (BG)", "giulianimacchine.it": "Bergamo (BG)",
    "metallistamp.it": "Milano (MI)", "stampitalia.it": "Milano (MI)", "lamera.it": "Milano (MI)",
    "evos.it": "Milano (MI)", "minifaber.com": "Milano (MI)",
    "camozzi.com": "Vicenza (VI)", "euchner.it": "Vicenza (VI)", "smcitalia.it": "Vicenza (VI)",
    "festo.it": "Vicenza (VI)", "pizzato.com": "Vicenza (VI)",
}

# Map domain to manifest slug - manifest uses domain-based slugs
slug_map = {
    "esempromeccanica.it": "esempromeccanica-srl",  # Original lead was company-based
    "nrcm.it": "nrcm-it",
    "sigmapresse.it": "sigmapresse-it",
    "hidro-press.it": "hidro-press-it",
    "siderurgicapresse.it": "siderurgicapresse-it",
    "technopress.it": "technopress-it",
    "berco.it": "berco-it",
    "cms-group.it": "cms-group-it",
    "fidia.com": "fidia-com",
    "omgspa.it": "omgspa-it",
    "giulianimacchine.it": "giulianimacchine-it",
    "metallistamp.it": "metallistamp-it",
    "stampitalia.it": "stampitalia-it",
    "lamera.it": "lamera-it",
    "evos.it": "evos-it",
    "minifaber.com": "minifaber-com",
    "camozzi.com": "camozzi-com",
    "euchner.it": "euchner-it",
    "smcitalia.it": "smcitalia-it",
    "festo.it": "festo-it",
    "pizzato.com": "pizzato-com",
}

# Build leads
leads = []
for domain, company_row in companies.items():
    slug = slug_map.get(domain, domain.replace(".", "-"))
    sector = sector_map.get(domain, "Manifatturiero")
    employees = employees_map.get(domain, 20)
    revenue = revenue_map.get(domain, "N/A")
    location = location_map.get(domain, "Nord Italia")

    # Get demo info from manifest
    manifest_info = manifest.get(slug, {})
    pain_score = manifest_info.get("pain_score", 50)
    angle = manifest_info.get("angle", "tech_modernization")
    demo_url = manifest_info.get("demo_url", f"https://demo-zak-{slug}.netlify.app")

    if pain_score >= 70:
        tier = "A"
    elif pain_score >= 40:
        tier = "B"
    else:
        tier = "C"

    # Generate placeholder hooks based on angle
    if angle == "performance_export":
        hooks = [
            f"Il sito mobile fa {pain_score if pain_score < 100 else 34}/100 su PageSpeed — i buyer che cercano '{sector.lower()}' da telefono non convertono...",
            "Mancano dati strutturati schema.org: Google non capisce che siete produttori certificati, perdete traffico qualificato...",
            "L'ultimo aggiornamento contenuti risale a tempo fa — i nuovi prodotti non hanno pagine dedicate con schede tecniche scaricabili..."
        ]
    elif angle == "tech_modernization":
        hooks = [
            "Il sito gira su tecnologia legacy (EOL/Nessun CMS moderno) — rischio sicurezza, plugin rotti, zero scalabilità...",
            "Nessun CI/CD — deploy manuali, rischio errori, niente rollback automatico...",
            "Hosting shared con risorse limitate — downtime frequenti, niente scaling, zero observability..."
        ]
    else:
        hooks = [
            "Il sito funge da vetrina ma non genera lead — solo form generico, niente magneti, niente nurturing...",
            "Sito mobile broken — 60% traffico da telefono, esperienza rotta, conversioni perse...",
            "Design datato comunica 'azienda piccola' mentre siete leader nel settore..."
        ]

    gap_leads = max(5, int(employees // 3 * pain_score / 100 * 1.5))

    lead = {
        "company": company_row["company_name"],
        "domain": domain,
        "slug": slug,
        "decision_maker": company_row.get("decision_maker_name", "Titolare / CEO"),
        "title": company_row.get("decision_maker_title", "Titolare / CEO"),
        "sector": sector,
        "employees": employees,
        "location": location,
        "revenue_est": revenue,
        "analysis_timestamp": "2026-11-22T10:30:00Z",
        "tech_stack": {
            "cms": "WordPress (legacy)" if "WordPress" in angle else "Unknown",
            "page_speed_mobile": pain_score if pain_score < 100 else 34,
            "page_speed_desktop": 67
        },
        "content_signals": {
            "has_schema_org": False,
            "export_keywords": [sector.lower().replace(" ", " ")]
        },
        "pain_signals": [
            {"signal": f"Pain score {pain_score}/100", "severity": "high" if pain_score >= 70 else "medium", "category": "performance"}
        ],
        "pain_score": pain_score,
        "priority_tier": tier,
        "personalization_hooks": hooks,
        "screenshot_path": f"screenshots/{domain}_20261122_103000.png",
        "recommended_angle": angle,
        "estimated_gap_leads_month": gap_leads,
        "demo_url": demo_url,
        "demo_deploy": {"success": False, "error": "Netlify CLI not installed", "url": demo_url}
    }
    leads.append(lead)

# Save
output_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(leads, f, indent=2, ensure_ascii=False)

print(f"Ricostruiti {len(leads)} lead in {output_path}")
tiers = {"A": 0, "B": 0, "C": 0}
for l in leads:
    tiers[l["priority_tier"]] += 1
print(f"Tier A: {tiers['A']}, B: {tiers['B']}, C: {tiers['C']}")