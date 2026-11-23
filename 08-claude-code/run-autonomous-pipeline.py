#!/usr/bin/env python3
# ============================================================
# PIPELINE AUTONOMO COMPLETO - ZAK Studio Web
# Esegue TUTTO: lead discovery -> analysis -> demo -> email -> dispatch -> follow-up
# Requisiti: credenziali in .env, MCP server configurati in Claude Code
# ============================================================

import os, json, subprocess, sys, time, schedule
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR = Path(__file__).parent.parent
SKILLS_DIR = Path.home() / ".claude" / "skills"

class AutonomousPipeline:
    def __init__(self):
        self.project_dir = PROJECT_DIR
        self.validate_environment()

    def validate_environment(self):
        """Verifica che tutto sia configurato"""
        # Solo OBBLIGATORIE per far girare il pipeline
        required_env = [
            "AGENTMAIL_API_KEY", "FIRECRAWL_API_KEY", "NETLIFY_AUTH_TOKEN", "UNSUB_SECRET"
        ]
        # Opzionali - warning ma non blocca
        optional_env = [
            "GOOGLE_SHEETS_CREDENTIALS", "VERCEL_TOKEN", "APIFY_API_TOKEN",
            "CALENDLY_USERNAME", "ZEROBOUNCE_API_KEY", "PAGESPEED_API_KEY", "COMPOSIO_API_KEY"
        ]
        missing = [v for v in required_env if not os.getenv(v)]
        if missing:
            print(f"ERROR: Variabili OBBLIGATORIE mancanti: {missing}")
            sys.exit(1)

        missing_opt = [v for v in optional_env if not os.getenv(v)]
        if missing_opt:
            print(f"WARNING: Variabili opzionali non impostate (funzionalita ridotte): {missing_opt}")

        # Verifica file critici
        critical_files = [
            "01-config/sender-profile.md",
            "01-config/icp-definition.md",
            "02-data/companies.csv",
            "03-sequences/sequence-master.json",
            "05-legal/legitimate-interest-assessment.md",
            "07-assets/case-studies/",
            "07-assets/cal-link.md"
        ]
        for f in critical_files:
            if not (self.project_dir / f).exists():
                print(f"ERROR: File critico mancante: {f}")
                sys.exit(1)

        # Verifica skill custom installate
        custom_skills = ["lead-analyzer", "web-demo-generator", "copywriter-b2b", "email-dispatcher"]
        for skill in custom_skills:
            if not (SKILLS_DIR / skill / "SKILL.md").exists():
                print(f"WARNING: Skill custom non installata: {skill}")
                print(f"   Copia da {self.project_dir}/08-claude-code/custom-skills/{skill} a {SKILLS_DIR}/{skill}")

        print("OK Environment validation passed")

    def run_claude_skill(self, skill_name, prompt, max_turns=10):
        """Esegue una skill via Claude Code CLI"""
        cmd = [
            "claude", "--skill", skill_name,
            "--prompt", prompt,
            "--max-turns", str(max_turns),
            "--output-format", "json"
        ]
        print(f"RUNNING {skill_name}...")
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_dir, timeout=600)
        if result.returncode != 0:
            print(f"ERROR {skill_name}: {result.stderr}")
            return None
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            print(f"WARNING: Output non-JSON da {skill_name}: {result.stdout[:500]}")
            return {"raw_output": result.stdout}

    # ============================================================
    # STEP 1: LEAD DISCOVERY & ENRICHMENT
    # ============================================================
    def step1_discover_leads(self):
        """Trova 200 aziende via Apify + analizza con Playwright/Firecrawl"""
        print("\n" + "="*60)
        print("STEP 1: LEAD DISCOVERY & ENRICHMENT")
        print("="*60)

        # 1a. Se companies.csv ha gia domini, salta discovery
        companies_csv = self.project_dir / "02-data" / "companies.csv"
        if companies_csv.exists():
            import csv
            with open(companies_csv) as f:
                reader = csv.DictReader(f)
                domains = [row["domain"] for row in reader if row["domain"]]
            if len(domains) >= 50:
                print(f"OK Trovati {len(domains)} domini in companies.csv, salto Apify discovery")
            else:
                print("INFO Pochi domini, lancio Apify Google Maps scraping...")
                domains = self.run_apify_discovery()

        # 1b. Analisi profonda ogni dominio con lead-analyzer
        print(f"INFO Analisi profonda {len(domains)} siti con lead-analyzer...")
        for i, domain in enumerate(domains):
            if i >= 200: break
            prompt = f"""
Analizza il sito web {domain} per cold outreach B2B web design.
Usa playwright per visitare il sito, fare screenshot, estrarre tech stack.
Usa firecrawl per scrape completo e tech detection.
Salva risultati in leads_enriched.json e Google Sheets tab 'Leads'.
Company domain: {domain}
"""
            result = self.run_claude_skill("lead-analyzer", prompt, max_turns=15)
            if result:
                print(f"  OK {domain} analizzato (pain_score: {result.get('pain_score', 'N/A')})")
            else:
                print(f"  ERROR {domain} fallito")
            time.sleep(5)  # Rate limiting

        print("OK STEP 1 COMPLETATO - leads_enriched.json pronto")
        return True

    def run_apify_discovery(self):
        """Usa Apify per trovare aziende su Google Maps"""
        print("INFO Apify Google Maps scraping...")
        queries = [
            "presse idrauliche Brescia", "macchine utensili Bergamo",
            "stampaggio metalli Milano", "automazione industriale Vicenza",
            "componentistica automotive Monza", "meccanica precisione Cremona",
            "presse piegatrici Verona", "torniture CNC Padova"
        ]

        prompt = f"""
Usa Apify actor 'google-maps-scraper' per cercare aziende con queste query:
{json.dumps(queries)}

Per ogni risultato: estrai company_name, domain, address, phone, website.
Filtra: solo con sito web, 10-50 dipendenti stimati, Nord Italia.
Salva in companies.csv (append) e Google Sheets tab 'Leads'.
Max 200 risultati totali.
"""
        result = self.run_claude_skill("lead-analyzer", prompt, max_turns=20)
        return []

    # ============================================================
    # STEP 2: DEMO GENERATION
    # ============================================================
    def step2_generate_demos(self):
        """Genera demo live per lead Tier A/B"""
        print("\n" + "="*60)
        print("STEP 2: DEMO GENERATION")
        print("="*60)

        prompt = """
Genera demo live per tutti i lead Tier A (pain_score >= 70) e Tier B (40-69).
USA web-demo-generator skill:
1. Legge leads_enriched.json
2. Per ogni lead: seleziona template per recommended_angle
3. Genera HTML/CSS/JS con calculator ROI, case study, before/after slider
3. playwrite screenshot demo per confronto
4. netlify deploy -> https://demo-zak-{slug}.netlify.app
5. Aggiorna leads_enriched.json con demo_url
5. Salva screenshot in demos/{slug}/assets/images/
"""
        result = self.run_claude_skill("web-demo-generator", prompt, max_turns=30)
        print("OK STEP 2 COMPLETATO - Demo deployate")
        return True

    # ============================================================
    # STEP 3: EMAIL WRITING
    # ============================================================
    def step3_write_emails(self):
        """Scrive 6 email personalizzate per ogni lead"""
        print("\n" + "="*60)
        print("STEP 3: EMAIL WRITING")
        print("="*60)

        prompt = """
Scrivi 6 email personalizzate per OGNI lead in leads_enriched.json.
USA copywriter-b2b skill:
1. Input: lead data + sequence-master.json + case studies + demo URLs
2. Per lead: genera email step 1-6 con framework Trigger->Pain->Proof->Ask
3. Subject lines: 3 varianti per email (anti-marketing style)
3. Personalizzazione: hook da lead-analyzer, pain framing settore, case study rilevante
4. CTA adattata a seniority (CEO=ultra-breve, Manager=pratica)
5. Unsubscribe hash HMAC univoco per email+step
6. Footer legale completo DLgs 70/2003
7. Analyzer score >= 80 required (usa email-sequence analyzer)
8. Output: outbox/batch_YYYYMMDD.json + outbox/{slug}/email_1-6.json
"""
        result = self.run_claude_skill("copywriter-b2b", prompt, max_turns=30)
        print("OK STEP 3 COMPLETATO - Email pronte in outbox/")
        return True

    # ============================================================
    # STEP 4: EMAIL DISPATCH (DAILY CRON)
    # ============================================================
    def step4_dispatch_daily(self):
        """Invia batch giornaliero (max 25) via AgentMail"""
        print("\n" + "="*60)
        print("STEP 4: DAILY EMAIL DISPATCH")
        print("="*60)

        prompt = """
Invia batch giornaliero email da outbox/batch_YYYYMMDD.json.
USA email-dispatcher skill:
1. Legge email da inviare oggi (step il cui send_day == oggi)
2. Pre-send checks: suppression list, domain limit, analyzer score >= 70
3. Invia via AgentMail API con rate limiting: max 25/giorno, delay 2-8 min random
4. Tracking: message_id, delivered, opened, clicked, replied
5. Webhook handler: bounce -> suppression + pause, complaint -> suppression + alert + pause
6. Reply classification automatica: interested/not_interested/referral/unsubscribe
7. Google Sheets sync: aggiorna EmailLog tab per ogni evento
8. Unsubscribe: vercel function one-click -> suppression list real-time
9. Output: daily report console + weekly report file
"""
        result = self.run_claude_skill("email-dispatcher", prompt, max_turns=15)
        return result

    # ============================================================
    # STEP 5: FOLLOW-UP AUTOMATION (CONTINUOUS)
    # ============================================================
    def step5_followup_automation(self):
        """Gestisce reply, bounce, schedule next steps"""
        print("\n" + "="*60)
        print("STEP 5: FOLLOW-UP AUTOMATION")
        print("="*60)

        prompt = """
Esegui follow-up automation continuo:
USA email-dispatcher skill:
1. Processa webhook events pendenti (bounce, complaint, reply, delivery)
2. Reply classification -> azioni:
   - interested: pause sequence, notify sales, create CRM deal, schedule call
   - not_interested: pause sequence, log lost reason
   - referral: pause sequence, add referred contact to lead-analyzer queue
   - unsubscribe: suppression list, pause sequence
3. Per lead senza reply: se today == send_day(next_step) -> invia next step
4. Se day > 35 (breakup sent) -> mark sequence complete
5. Weekly report: open rate, reply rate, meeting booked, unsubscribe, bounce
6. Pivot triggers: se open<30% -> new subject lines, se reply<5% -> rewrite angles
"""
        result = self.run_claude_skill("email-dispatcher", prompt, max_turns=15)
        return result

    # ============================================================
    # MAIN PIPELINE RUNNER
    # ============================================================
    def run_full_pipeline(self, mode="full"):
        """Esegue pipeline completa o step specifico"""
        print("""
============================================================
     ZAK STUDIO WEB - PIPELINE AUTONOMO COMPLETO
     Lead Discovery -> Analysis -> Demo -> Email -> Dispatch
============================================================
        """)

        if mode in ["full", "1"]:
            self.step1_discover_leads()

        if mode in ["full", "2"]:
            self.step2_generate_demos()

        if mode in ["full", "3"]:
            self.step3_write_emails()

        if mode in ["full", "4"]:
            # Step 4 e' giornaliero - qui fa solo primo invio
            self.step4_dispatch_daily()

        if mode in ["full", "5"]:
            self.step5_followup_automation()

        if mode == "daily":
            # Modalita cron giornaliero
            self.step4_dispatch_daily()
            self.step5_followup_automation()

        print("\n" + "="*60)
        print("PIPELINE COMPLETATO")
        print("="*60)
        print("Prossimi step automatici:")
        print("   - Configura cron daily: python run-autonomous-pipeline.py daily")
        print("   - Monitora Google Sheets tab 'EmailLog' per tracking real-time")
        print("   - Weekly review ogni venerdi per pivot decisions")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="ZAK Studio Web - Autonomous Pipeline")
    parser.add_argument("mode", nargs="?", default="full",
                       choices=["full", "1", "2", "3", "4", "5", "daily"],
                       help="Modalita esecuzione")
    args = parser.parse_args()

    pipeline = AutonomousPipeline()
    pipeline.run_full_pipeline(args.mode)

if __name__ == "__main__":
    main()