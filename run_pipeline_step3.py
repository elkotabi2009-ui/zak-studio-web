#!/usr/bin/env python3
"""
STEP 3: Email Sequence Generation
Generates 6-step email sequences for each Tier A/B lead using copywriter-b2b framework
"""
import os, json, hmac, hashlib
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR = Path(__file__).parent
UNSUB_SECRET = os.getenv("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")

# Sender profile
SENDER = {
    "name": "Zakariae El Kotabi",
    "email": "zakariae@outreach.zakstudio.com",
    "legal_name": "Zakariae El Kotabi",
    "address": "Via Roma 123, 25121 Brescia",
    "vat": "01234567890",
    "rea": "BS-123456"
}

# Case study pool
CASE_STUDIES = [
    {
        "slug": "metalpress",
        "name": "Metalpress Vicenza",
        "sector": "Manifatturiero meccanico",
        "employees": 35,
        "result": "0 → 14 lead/mese, -40% CAC, 98/100 PageSpeed Mobile",
        "angles": ["performance_export", "tech_modernization"]
    },
    {
        "slug": "servicepro",
        "name": "ServicePro Roma",
        "sector": "B2B Services",
        "employees": 28,
        "result": "Da 2 a 22 lead/mese, CAC -55%, pipeline +180k€ in 6 mesi",
        "angles": ["lead_gen_conversion", "credibility_rebrand"]
    },
    {
        "slug": "ferrarimeccanica",
        "name": "Ferrari Meccanica Bologna",
        "sector": "Meccanica precisione",
        "employees": 65,
        "result": "Perceived value +40%, closing rate +25%, enterprise clients +3",
        "angles": ["credibility_rebrand", "performance_export"]
    },
    {
        "slug": "techcorp",
        "name": "TechCorp Milano",
        "sector": "Software B2B",
        "employees": 45,
        "result": "Da 2h deploy a 3 min, 99.99% uptime, -80% costi hosting",
        "angles": ["tech_modernization"]
    }
]

# Subject line templates per angle and step
SUBJECT_TEMPLATES = {
    "performance_export": {
        1: [
            lambda l: f"vostro sito {l.get('wp_year', '2019')}",
            lambda l: l.get('last_trigger', 'nuova linea').lower() if l.get('last_trigger') else "nuova linea prodotti",
            lambda _: "quick question"
        ],
        2: [
            lambda l: f"{l['case_study']['name']}: +{l['case_study']['result'].split('→')[1].split()[0]} lead/mese",
            lambda l: f"case study {l['sector'].lower()}",
            lambda _: "risultati sito web B2B"
        ],
        3: [
            lambda l: f"benchmark siti {l['sector'].lower()} 2024",
            lambda _: "quanto vale un lead qualificato?",
            lambda l: f"dati export {l['sector'].lower()}"
        ],
        4: [
            lambda _: "chi gestisce il sito?",
            lambda _: "decisione sito web",
            lambda _: "responsabile digital"
        ],
        5: [
            lambda _: "persona giusta per sito web?",
            lambda _: "chi decide il digital?",
            lambda _: "inoltro interno"
        ],
        6: [
            lambda _: "chiudo qui",
            lambda _: "ultima email",
            lambda _: "non vi disturbo più"
        ]
    },
    "tech_modernization": {
        1: [
            lambda l: f"stack tecnologico {l.get('wp_year', 'legacy')}",
            lambda l: "modernizzazione sito",
            lambda _: "quick question"
        ],
        2: [
            lambda l: f"{l['case_study']['name']}: -80% costi hosting",
            lambda l: f"case study modernizzazione {l['sector'].lower()}",
            lambda _: "migrazione legacy"
        ],
        3: [
            lambda l: f"benchmark tech stack {l['sector'].lower()}",
            lambda _: "quanto costa mantenere un sito legacy?",
            lambda l: f"dati performance {l['sector'].lower()}"
        ],
        4: [
            lambda _: "chi gestisce il sito?",
            lambda _: "decisione tech stack",
            lambda _: "responsabile tecnico"
        ],
        5: [
            lambda _: "persona giusta per tech?",
            lambda _: "chi decide l'architettura?",
            lambda _: "inoltro al CTO"
        ],
        6: [
            lambda _: "chiudo qui",
            lambda _: "ultima email",
            lambda _: "non vi disturbo più"
        ]
    },
    "lead_gen_conversion": {
        1: [
            lambda l: "sito vetrina vs macchina lead",
            lambda l: "form contatto generico",
            lambda _: "quick question"
        ],
        2: [
            lambda l: f"{l['case_study']['name']}: +20 lead/mese",
            lambda l: f"case study lead gen {l['sector'].lower()}",
            lambda _: "da vetrina a funnel"
        ],
        3: [
            lambda l: f"benchmark conversion {l['sector'].lower()}",
            lambda _: "quanto vale un lead?",
            lambda l: f"dati funnel {l['sector'].lower()}"
        ],
        4: [
            lambda _: "chi gestisce le lead?",
            lambda _: "responsabile commerciale",
            lambda _: "decisione marketing"
        ],
        5: [
            lambda _: "persona giusta per lead gen?",
            lambda _: "chi decide il funnel?",
            lambda _: "inoltro marketing"
        ],
        6: [
            lambda _: "chiudo qui",
            lambda _: "ultima email",
            lambda _: "non vi disturbo più"
        ]
    },
    "credibility_rebrand": {
        1: [
            lambda l: "sembra piccola, siete leader",
            lambda l: "sito web 2019",
            lambda _: "quick question"
        ],
        2: [
            lambda l: f"{l['case_study']['name']}: +40% perceived value",
            lambda l: f"case study rebrand {l['sector'].lower()}",
            lambda _: "credibilità online"
        ],
        3: [
            lambda l: f"benchmark brand {l['sector'].lower()}",
            lambda _: "quanto vale la credibilità?",
            lambda l: f"dati trust {l['sector'].lower()}"
        ],
        4: [
            lambda _: "chi decide il brand?",
            lambda _: "responsabile comunicazione",
            lambda _: "decisione rebrand"
        ],
        5: [
            lambda _: "persona giusta per brand?",
            lambda _: "chi decide l'immagine?",
            lambda _: "inoltro dir. marketing"
        ],
        6: [
            lambda _: "chiudo qui",
            lambda _: "ultima email",
            lambda _: "non vi disturbo più"
        ]
    }
}

SECTOR_PAIN = {
    "manifatturiero meccanico": {
        "performance": "I buyer tecnici scaricano schede PDF da mobile in fiera — 3 secondi caricamento = persa la commessa",
        "seo": "Chi cerca 'presse idrauliche certificazioni ISO' su Google non vi trova — schema.org manca",
        "conversion": "Avete solo form generico — niente configuratore pressione/portata, niente calcolo ROI per l'ufficio tecnico"
    },
    "macchine utensili": {
        "performance": "I decision maker valutano macchine da telefono tra un meeting e l'altro — sito lento = esclusione immediata",
        "seo": "Ricerca 'centro lavoro 5 assi' — senza schema.org Product non apparite nei risultati tecnici",
        "conversion": "Nessun configuratore tecnico online — i buyer vogliono specifiche sofort, non 'contattateci'"
    },
    "stampaggio metalli": {
        "performance": "Request for quote da mobile: se il sito non carica in 2 secondi, il buyer passa al competitor",
        "seo": "Certificazioni ISO, tolleranze, materiali — senza structured data Google non li indicizza",
        "conversion": "Catalogo PDF statico — niente preventivatore online per pezzi stampati"
    },
    "automazione industriale": {
        "performance": "Ingegneri cercano componenti da mobile in produzione — velocità = credibilità tecnica",
        "seo": "Componenti specifici (cilindri, sensori, valve) — schema.org Product serve per ricerche tecniche",
        "conversion": "Solo schede tecniche PDF — niente selettore prodotto per applicazione, niente BOM export"
    },
    "componentistica automotive": {
        "performance": "Procurement OEM valuta fornitori da mobile — sito lento = segnale processo non lean",
        "seo": "Certificazioni IATF, PPAP, IMDS — structured data obbligatorio per apparire nelle shortlist",
        "conversion": "Nessun portale fornitori — zero self-service per schede tecniche, certificati, campioni"
    },
    "meccanica precisione": {
        "performance": "Tolleranze al micron richiedono fiducia — sito lento comunica 'processi non controllati'",
        "seo": "Lavorazioni CNC, metrologia, certificazioni — senza schema.org invisibili per search tecnico",
        "conversion": "Solo form generico — niente configuratore tolleranze/materiali, niente RFQ strutturato"
    },
    "presse piegatrici": {
        "performance": "Buyer valutano macchine da mobile in officina — caricamento >3s = persa opportunità",
        "seo": "Tonnellaggio, corsa, CNC — structured data per far comparire modelli specifici in ricerca",
        "conversion": "Catalogo statico — niente preventivatore per configurazione presse"
    },
    "torniture CNC": {
        "performance": "Officine cercano tornitura conto terzi da mobile — velocità = capacità produttiva percepita",
        "seo": "Materiali, tolleranze, lotti — Product schema per apparire in ricerche 'tornitura acciaio inox Milano'",
        "conversion": "Solo email/PEC — niente upload drawing per preventivo rapido, niente tracking commessa"
    }
}

def select_case_study(lead, case_studies_pool):
    """Select most relevant case study"""
    sector = lead["sector"].lower()
    scored = []
    for cs in case_studies_pool:
        score = 0
        if cs["sector"].lower() == sector: score += 50
        if abs(cs["employees"] - lead["employees"]) <= 15: score += 20
        if lead["recommended_angle"] in cs.get("angles", []): score += 15
        scored.append((score, cs))
    scored.sort(reverse=True, key=lambda x: x[0])
    return scored[0][1] if scored[0][0] > 0 else case_studies_pool[0]

def generate_unsubscribe_hash(email, company_slug, step):
    """Generate HMAC unsubscribe hash (no date - must be stable across send attempts)"""
    msg = f"{email}|{company_slug}|step{step}".encode()
    return hmac.new(UNSUB_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:16]

def get_wp_year(tech_stack):
    """Extract WP version year from tech stack"""
    cms = tech_stack.get("cms", "")
    import re
    match = re.search(r'(\d+\.\d+)', cms)
    if match:
        ver = float(match.group(1))
        if ver < 5: return "2018"
        elif ver < 5.5: return "2019"
        elif ver < 6: return "2020"
        else: return "2022"
    return "2019"

def get_last_trigger(content_signals):
    """Get last business trigger from content"""
    export_kw = content_signals.get("export_keywords", [])
    if export_kw:
        return export_kw[0].capitalize()
    return "nuova linea"

def build_step1_body(lead, case_study, sector_pain, angle):
    """Build Step 1: Trigger → Pain → Value First (Free Draft) → Soft Ask"""
    company = lead["company"]
    sector = lead["sector"]
    hooks = lead.get("personalization_hooks", [])
    hook = hooks[0] if hooks else f"Operate nel {sector.lower()} con un sito che non comunica il vostro valore..."

    pain_text = sector_pain.get("performance", sector_pain.get("seo", "Il sito non converte i visitatori in lead qualificati"))

    wp_year = get_wp_year(lead.get("tech_stack", {}))
    last_trigger = get_last_trigger(lead.get("content_signals", {}))

    body = f"""{hook}

{pain_text}

Lavoriamo con aziende come la vostra ({sector}, {lead['employees']} dipendenti, export-oriented) per trasformare il sito da "vetrina statica" a vero biglietto da visita digitale che genera contatti qualificati.

L'ultimo cliente nel vostro settore, {case_study['name']}, ha ottenuto: {case_study['result'].lower()}.

💡 Proposta concreta: vi preparo una **bozza gratuita della vostra landing page** (struttura, contenuti, mockup visuale) — senza impegno. La vedete, se vi piace ne parliamo, altrimenti nessun obbligo.

Vale la pena che ve la invii questa settimana?"""
    return body.strip()

def build_step2_body(lead, case_study, sector_pain, angle):
    """Build Step 2: Case Study + What the Landing Page Actually IS"""
    sector = lead["sector"]
    body = f"""Visto che operate nel {sector.lower()}, vi condivido un caso concreto — ma prima: **cos'è davvero questa landing page?**

Non è un "sito web" classico con CMS, manutenzione, plugin, aggiornamenti sicurezza. È un **biglietto da visita digitale single-page** — statico, velocissimo (95+ PageSpeed), zero manutenzione — che fa una cosa sola: presenta la vostra azienda in modo professionale a chi vi cerca online (buyer OEM, procurement, uffici tecnici, fiere).

{case_study['name']} ({case_study['sector']}, {case_study['employees']} dipendenti) aveva lo stesso problema: sito vecchio, zero lead inbound, competitor con presenza digitale moderna.

In 90 giorni: {case_study['result'].lower()}.

Come? Landing page statica (Astro), Schema.org per prodotti tecnici, form contatti funzionante, deploy su CDN globale.

La bozza gratuita per {lead['company']} includerebbe: Hero con metriche chiave (dipendenti, export, certificazioni), "Chi Siamo", 3-4 prodotti/servizi principali con CTA "Richiedi scheda tecnica", Certificazioni & Export, Referenze settore, Form contatti -> vostra email.

Ve la mando?"""
    return body.strip()

def build_step3_body(lead, case_study, sector_pain, angle):
    """Build Step 3: Industry Insight + Why Landing Page (Not Full Site)"""
    sector = lead["sector"]
    gap = lead.get("estimated_gap_leads_month", 10)
    sector_lower = sector.lower()

    body = f"""Dati Unioncamere 2024: le aziende {sector_lower} con presenza digitale performante (PageSpeed 90+, Schema.org, lead magnet) generano in media {gap*2}-{gap*3} lead qualificati/mese in più rispetto a chi ha sito "vetrina".

Il gap stimato per {lead['company']}: ~{gap} lead/mese persi = ~€{gap * 15000 * 12:,} fatturato potenziale/anno.

Molte aziende vostre competitor pensano: "ci vuole un sito nuovo, costoso, mesi di lavoro, manutenzione continua". Falso.

Una **landing page di presentazione aziendale** è diversa:
• **Non è un sito completo** — è una pagina singola (single-page) che fa da biglietto da visita digitale
• **Zero manutenzione** — statica, no CMS, no database, no plugin, no aggiornamenti sicurezza
• **Deploy in giorni, non mesi** — contenuti vostri, struttura nostra, online in 10 giorni
• **Costa una frazione** — un decimo di un sito corporate tradizionale
• **Misurabile** — form contatti tracciabile, Analytics, sapete esattamente chi vi contatta

Abbiamo preparato un benchmark settore {sector_lower} (gratuito, 8 pagine) con:
- PageSpeed median per competitor top 10
- Schema.org adoption rate
- Lead magnet types che convertono
- CAC medio per canale

Ve lo mando insieme alla bozza della vostra landing?"""
    return body.strip()

def build_step4_body(lead, case_study, sector_pain, angle):
    """Build Step 4: Direct Ask — Zero Risk, Free Draft"""
    body = f"""Domanda diretta: chi in {lead['company']} valuta la presenza digitale / lead generation?

Nessun impegno, nessun contratto, nessun pagamento anticipato.

Vi mando la bozza (struttura + contenuti + mockup visuale) → la guardate con calma → se vi piace e volete metterla online, ne parliamo. Altrimenti: grazie comunque, buon lavoro.

Se non siete la persona giusta: girate al responsabile digital / marketing / export / commerciale. Grazie per il tempo."""
    return body.strip()

def build_step5_body(lead, case_study, sector_pain, angle):
    """Build Step 5: Referral — Who Should See The Free Draft"""
    body = f"""Sarò breve: non sono sicuro di aver raggiunto la persona giusta in {lead['company']} per valutare una landing page di presentazione aziendale.

Se non siete voi: chi si occupa di sito web / digital / export / commerciale / comunicazione? Inoltro volentieri la bozza gratuita.

Se lo siete ma non è priorità ora: nessun problema, chiudo qui. La bozza resta valida se in futuro serve."""
    return body.strip()

def build_step6_body(lead, case_study, sector_pain, angle):
    """Build Step 6: Breakup / Close Loop"""
    body = f"""Chiudo qui la conversazione su {lead['company']}.

Se in futuro il sito diventa priorità (nuovi prodotti, export, rebrand, lead gen): rispondete a questa email, ci siamo.

Nel frattempo: il benchmark settore {lead['sector'].lower()} è già pronto se vi serve.

Buon lavoro."""
    return body.strip()

STEP_BUILDERS = {
    1: build_step1_body,
    2: build_step2_body,
    3: build_step3_body,
    4: build_step4_body,
    5: build_step5_body,
    6: build_step6_body
}

STEP_ANGLES = {
    1: "trigger_pain_ask",
    2: "case_study_social_proof",
    3: "industry_insight_benchmark",
    4: "direct_ask_decision_maker",
    5: "referral_reverse_ask",
    6: "breakup_close_loop"
}

CTA_TEXTS = {
    1: "Vale la pena una call 15 min questa settimana per vedere se ha senso per voi?",
    2: "Vale 15 min per vedere se lo stesso approccio funziona per voi?",
    3: "Ve lo mando se utile?",
    4: "Fissiamo 15 min giovedì?",
    5: "Chi è la persona giusta? Inoltro volentieri.",
    6: "Se diventa priorità, rispondete a questa email."
}

CTA_TYPES = {
    1: "direct_question_meeting",
    2: "direct_question_meeting",
    3: "direct_question_resource",
    4: "direct_question_meeting",
    5: "referral_ask",
    6: "breakup_close"
}

def get_calendly_link(lead_slug, step):
    return f"https://calendly.com/zakstudio/discovery-call-15min?utm_source=cold_email&utm_medium=email&utm_campaign=zak_web_outreach_2026&utm_content=step_{step}_cta&utm_term={lead_slug}"

def build_legal_footer(unsub_hash):
    return f"""

—
{SENDER['name']} — ZAK Studio Web
{SENDER['email']}

Se non vuoi più ricevere queste email: https://unsubscribe.zakstudio.com/?h={unsub_hash}

ZAK Studio Web di {SENDER['legal_name']} — {SENDER['address']} — P.IVA {SENDER['vat']} — REA {SENDER['rea']} — Privacy: https://zakstudio.com/privacy"""

def generate_subject_lines(lead, step, angle, case_study):
    """Generate 3 subject line variants for step/angle"""
    templates = SUBJECT_TEMPLATES.get(angle, SUBJECT_TEMPLATES["performance_export"])
    step_templates = templates.get(step, templates[1])

    # Prepare context for lambdas
    ctx = {
        'wp_year': get_wp_year(lead.get("tech_stack", {})),
        'last_trigger': get_last_trigger(lead.get("content_signals", {})),
        'sector': lead["sector"],
        'case_study': case_study,
        'content_signals': lead.get("content_signals", {})
    }

    subjects = []
    for tpl in step_templates:
        try:
            subj = tpl(ctx)
            if subj and len(subj) <= 50:
                subjects.append(subj)
        except:
            pass

    # Ensure 3 subjects
    fallbacks = {
        1: ["vostro sito", "quick question", "nuova linea"],
        2: ["case study", "risultati B2B", "stesso settore"],
        3: ["benchmark settore", "quanto vale un lead", "dati export"],
        4: ["chi gestisce il sito", "decisione sito", "responsabile digital"],
        5: ["persona giusta", "inoltro interno", "chi decide"],
        6: ["chiudo qui", "ultima email", "non vi disturbo più"]
    }

    for fb in fallbacks.get(step, ["follow up"]):
        if len(subjects) >= 3: break
        if fb not in subjects:
            subjects.append(fb)

    return subjects[:3]

def generate_email(lead, step, case_study, sector_pain, demo_url):
    """Generate single email JSON"""
    angle = lead["recommended_angle"]
    slug = lead["slug"]

    # Generate subject lines
    subjects = generate_subject_lines(lead, step, angle, case_study)
    subject_selected = subjects[0]

    # Build body
    body = STEP_BUILDERS[step](lead, case_study, sector_pain, angle)

    # CTA
    cta = CTA_TEXTS[step]
    cta_type = CTA_TYPES[step]
    calendly = get_calendly_link(slug, step)

    # Unsubscribe hash
    unsub_hash = generate_unsubscribe_hash(lead.get("decision_maker_email", f"info@{lead['domain']}"), slug, step)
    unsub_url = f"https://unsubscribe.zakstudio.com/?h={unsub_hash}"

    # Footer
    footer = build_legal_footer(unsub_hash)

    # Full body with CTA and footer
    full_body = f"{body}\n\n{cta}\n{footer}"

    # Word count
    word_count = len(full_body.split())

    # Analyzer score simulation
    analyzer_score = 85 if word_count < 150 else (80 if word_count < 180 else 75)
    if "!!!" in full_body or full_body.count("!") > 2:
        analyzer_score -= 20

    email_data = {
        "lead_slug": slug,
        "step": step,
        "day": [1, 4, 8, 14, 21, 28][step-1],
        "angle": STEP_ANGLES[step],
        "subject_lines": subjects,
        "subject_selected": subject_selected,
        "body": full_body,
        "cta": cta,
        "cta_type": cta_type,
        "calendly_link": calendly,
        "demo_link": demo_url,
        "unsubscribe_hash": unsub_hash,
        "unsubscribe_url": unsub_url,
        "word_count": word_count,
        "personalization_used": [f"hook_{i}" for i in range(min(3, len(lead.get('personalization_hooks', []))))] + [f"case_study_{case_study['slug']}", f"angle_{angle}"],
        "analyzer_score": analyzer_score,
        "status": "ready_to_send"
    }

    return email_data

def main():
    print("="*60)
    print("STEP 3: EMAIL SEQUENCE GENERATION")
    print("="*60)

    # Load leads
    leads_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    with open(leads_path, "r", encoding="utf-8") as f:
        leads = json.load(f)

    # Filter Tier A/B
    tier_ab = [l for l in leads if l["priority_tier"] in ["A", "B"]]
    print(f"Generating 6-email sequences for {len(tier_ab)} Tier A/B leads...")

    outbox_dir = PROJECT_DIR / "outbox"
    outbox_dir.mkdir(exist_ok=True)

    all_emails = []
    batch_emails = []

    for lead in tier_ab:
        slug = lead["slug"]
        sector = lead["sector"].lower()
        sector_pain = SECTOR_PAIN.get(sector, SECTOR_PAIN["manifatturiero meccanico"])
        case_study = select_case_study(lead, CASE_STUDIES)
        demo_url = lead.get("demo_url", f"https://demo-zak-{slug}.netlify.app")

        # Create lead outbox dir
        lead_dir = outbox_dir / slug
        lead_dir.mkdir(parents=True, exist_ok=True)

        # Save lead context for reference
        (lead_dir / "lead.json").write_text(json.dumps(lead, indent=2, ensure_ascii=False), encoding="utf-8")

        # Generate 6 emails
        for step in range(1, 7):
            email = generate_email(lead, step, case_study, sector_pain, demo_url)

            # Save individual email
            email_file = lead_dir / f"email_{step}.json"
            email_file.write_text(json.dumps(email, indent=2, ensure_ascii=False), encoding="utf-8")

            # Add to batch manifest
            batch_emails.append({
                "lead_slug": slug,
                "step": step,
                "file": str(email_file.relative_to(PROJECT_DIR)),
                "send_day": email["day"],
                "priority": "high" if lead["priority_tier"] == "A" else "normal"
            })

            print(f"  {lead['company']} - Step {step}: '{email['subject_selected']}' ({email['word_count']} words, score {email['analyzer_score']})")

        all_emails.append({
            "lead_slug": slug,
            "company": lead["company"],
            "tier": lead["priority_tier"],
            "angle": lead["recommended_angle"],
            "emails": 6
        })

    # Save batch manifest
    batch_manifest = {
        "batch_id": f"batch_{datetime.utcnow().strftime('%Y%m%d')}",
        "created": datetime.utcnow().isoformat() + "Z",
        "total_leads": len(tier_ab),
        "total_emails": len(batch_emails),
        "by_step": {str(s): len([e for e in batch_emails if e["step"] == s]) for s in range(1, 7)},
        "by_tier": {
            "A": len([e for e in batch_emails if any(a["lead_slug"] == e["lead_slug"] and a["tier"] == "A" for a in all_emails)]),
            "B": len([e for e in batch_emails if any(a["lead_slug"] == e["lead_slug"] and a["tier"] == "B" for a in all_emails)])
        },
        "emails": batch_emails
    }

    batch_file = outbox_dir / f"batch_{datetime.utcnow().strftime('%Y%m%d')}.json"
    batch_file.write_text(json.dumps(batch_manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print("\n" + "="*60)
    print("RIASSUNTO STEP 3")
    print("="*60)
    print(f"Lead processati: {len(tier_ab)}")
    print(f"Email generate: {len(batch_emails)} (6 per lead)")
    print(f"Batch manifest: {batch_file}")
    print(f"Outbox: {outbox_dir}")

if __name__ == "__main__":
    main()