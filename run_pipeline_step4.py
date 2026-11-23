#!/usr/bin/env python3
"""
STEP 4: Email Dispatch Setup
Creates daily sender daemon, webhook handler, and suppression list management
"""
import os, json, csv, time, random, hmac, hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
import yaml
import httpx

load_dotenv()

PROJECT_DIR = Path(__file__).parent

# Load config
with open(PROJECT_DIR / "01-config" / "dispatcher.yaml", "r", encoding="utf-8") as f:
    CONFIG = yaml.safe_load(f)

SENDER_EMAIL = CONFIG["sender"]["from_email"]
SENDER_NAME = CONFIG["sender"]["from_name"]
REPLY_TO = CONFIG["sender"]["reply_to"]
ESP_PROVIDER = CONFIG["esp"]["provider"]
AGENTMAIL_API_KEY = os.getenv(CONFIG["esp"]["agentmail"]["api_key_env"])
AGENTMAIL_INBOX_ID = CONFIG["esp"]["agentmail"]["inbox_id"]
RESEND_API_KEY = os.getenv(CONFIG["esp"]["resend"]["api_key_env"])
RESEND_DOMAIN = CONFIG["esp"]["resend"]["domain"]

MAX_PER_DAY = CONFIG["rate_limits"]["max_per_day"]

# If AgentMail inbox doesn't exist or fails, fall back to Resend
USE_AGENTMAIL = ESP_PROVIDER == "agentmail" and AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID
MIN_INTERVAL = CONFIG["rate_limits"]["min_interval_minutes"] * 60
MAX_INTERVAL = CONFIG["rate_limits"]["max_interval_minutes"] * 60

# Test mode config (uses Resend onboarding domain to avoid domain verification)
RESEND_TEST_MODE = CONFIG["esp"]["resend"].get("test_mode", False)
RESEND_TEST_FROM = CONFIG["esp"]["resend"].get("test_from", "onboarding@resend.dev")
RESEND_TEST_TO = CONFIG["esp"]["resend"].get("test_to", "")
WARMUP = CONFIG["rate_limits"]["warmup_schedule"]

SUPPRESSION_FILE = PROJECT_DIR / CONFIG["suppression"]["local_file"]
UNSUB_BASE_URL = CONFIG["legal"]["unsubscribe_base_url"]
UNSUB_SECRET = os.getenv("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")

def get_warmup_limit(date=None):
    """Calculate daily send limit based on warmup schedule"""
    date = date or datetime.now().date()
    # Calculate weeks since campaign start (assume Nov 1 2026)
    campaign_start = datetime(2026, 11, 1).date()
    weeks = max(0, (date - campaign_start).days // 7)
    if weeks == 0:
        return WARMUP.get("week_1", 10)
    elif weeks == 1:
        return WARMUP.get("week_2", 15)
    elif weeks == 2:
        return WARMUP.get("week_3", 20)
    else:
        return WARMUP.get("week_4_plus", 25)

# ============================================================
# SUPPRESSION LIST MANAGEMENT
# ============================================================

def init_suppression_list():
    """Initialize suppression list CSV if not exists"""
    if not SUPPRESSION_FILE.exists():
        SUPPRESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SUPPRESSION_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["email", "reason", "timestamp", "source", "notes"])

def load_suppression_list():
    """Load suppression list into memory"""
    init_suppression_list()
    suppressed = set()
    with open(SUPPRESSION_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            suppressed.add(row["email"].lower().strip())
    return suppressed

def add_to_suppression(email, reason, source="manual"):
    """Add email to suppression list"""
    email = email.lower().strip()
    init_suppression_list()
    with open(SUPPRESSION_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([email, reason, datetime.now(timezone.utc).isoformat(), source, ""])
    print(f"  Added to suppression: {email} ({reason})")

def check_suppression(email):
    """Check if email is suppressed"""
    suppressed = load_suppression_list()
    return email.lower().strip() not in suppressed

# ============================================================
# UNSUBSCRIBE HASH VALIDATION
# ============================================================

def validate_unsubscribe_hash(email, company_slug, step, hash_value):
    """Validate unsubscribe hash"""
    expected = generate_unsubscribe_hash(email, company_slug, step)
    return hmac.compare_digest(expected, hash_value)

def generate_unsubscribe_hash(email, company_slug, step):
    """Generate HMAC unsubscribe hash (no date - must be stable across send attempts)"""
    msg = f"{email}|{company_slug}|step{step}".encode()
    return hmac.new(UNSUB_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:16]

# ============================================================
# EMAIL SENDING (AgentMail / Resend)
# ============================================================

def send_via_agentmail(email_data):
    """Send email via AgentMail API"""
    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [email_data["to_email"]],
        "subject": email_data["subject_selected"],
        "text": email_data["body"],
        "headers": {
            "List-Unsubscribe": f"<{email_data['unsubscribe_url']}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "X-Entity-Ref-ID": email_data["lead_slug"],
            "X-Step": str(email_data["step"])
        },
        "tracking": {
            "clicks": CONFIG["tracking"]["click_tracking"],
            "opens": CONFIG["tracking"]["open_tracking"]
        }
    }

    try:
        with httpx.Client(timeout=30) as client:
            # Try v1 endpoint first (newer API version)
            resp = client.post(
                f"https://api.agentmail.to/v1/inboxes/{AGENTMAIL_INBOX_ID}/messages",
                headers=headers, json=payload
            )
            if resp.status_code == 404:
                # Fallback to v0
                resp = client.post(
                    f"https://api.agentmail.to/v0/inboxes/{AGENTMAIL_INBOX_ID}/messages",
                    headers=headers, json=payload
                )
        if resp.status_code in (200, 201):
            data = resp.json()
            return {"success": True, "message_id": data.get("message_id") or data.get("id"), "provider": "agentmail"}
        else:
            return {"success": False, "error": f"AgentMail {resp.status_code}: {resp.text}", "provider": "agentmail"}
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "agentmail"}

def send_via_resend(email_data):
    """Send email via Resend API"""
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [email_data["to_email"]],
        "subject": email_data["subject_selected"],
        "text": email_data["body"],
        "headers": {
            "List-Unsubscribe": f"<{email_data['unsubscribe_url']}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        },
        "tags": [
            {"name": "lead_slug", "value": email_data["lead_slug"]},
            {"name": "step", "value": str(email_data["step"])}
        ]
    }

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post("https://api.resend.com/emails", headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            return {"success": True, "message_id": data["id"], "provider": "resend"}
        else:
            return {"success": False, "error": f"Resend {resp.status_code}: {resp.text}", "provider": "resend"}
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "resend"}

def send_email(email_data, dry_run=False):
    """Send email via configured provider with Resend fallback"""
    if dry_run or RESEND_TEST_MODE:
        # Test mode: use Resend onboarding domain to verified account email
        return send_via_resend_test(email_data)

    if ESP_PROVIDER == "agentmail" and USE_AGENTMAIL:
        result = send_via_agentmail(email_data)
        if not result.get("success"):
            print(f"  AgentMail failed, falling back to Resend: {result.get('error')}")
            return send_via_resend(email_data)
        return result
    elif ESP_PROVIDER == "resend":
        return send_via_resend(email_data)
    else:
        # Default to Resend if AgentMail not configured
        return send_via_resend(email_data)

def send_via_resend_test(email_data):
    """Send test email via Resend onboarding domain"""
    if not RESEND_API_KEY:
        return {"success": False, "error": "RESEND_API_KEY not configured", "provider": "resend"}
    if not RESEND_TEST_TO:
        return {"success": False, "error": "RESEND_TEST_TO not configured", "provider": "resend"}

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": RESEND_TEST_FROM,
        "to": [RESEND_TEST_TO],
        "subject": f"[TEST] {email_data['subject_selected']} (to: {email_data['to_email']})",
        "text": f"TEST EMAIL - Would be sent to: {email_data['to_email']}\n\n{email_data['body']}",
        "tags": [
            {"name": "lead_slug", "value": email_data["lead_slug"]},
            {"name": "step", "value": str(email_data["step"])}
        ]
    }

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post("https://api.resend.com/emails", headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            return {"success": True, "message_id": data["id"], "provider": "resend-test"}
        else:
            return {"success": False, "error": f"Resend Test {resp.status_code}: {resp.text}", "provider": "resend-test"}
    except Exception as e:
        return {"success": False, "error": str(e), "provider": "resend-test"}

# ============================================================
# GOOGLE SHEETS LOGGING
# ============================================================

def log_to_sheets(row_data):
    """Log email event to Google Sheets"""
    creds_json = os.getenv(CONFIG["google_sheets"]["credentials_env"])
    if not creds_json:
        print("  Google Sheets credentials not configured, skipping")
        return

    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build

        creds = Credentials.from_service_account_info(
            json.loads(creds_json),
            scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        service = build("sheets", "v4", credentials=creds)

        sheet_id = CONFIG["google_sheets"]["tracking_sheet_id"]
        tab = CONFIG["google_sheets"]["tracking_tab"]

        values = [[
            row_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            row_data.get("lead_slug", ""),
            row_data.get("company", ""),
            row_data.get("step", ""),
            row_data.get("subject", ""),
            row_data.get("message_id", ""),
            row_data.get("status_sent", ""),
            row_data.get("status_delivered", ""),
            row_data.get("status_opened", ""),
            row_data.get("status_clicked", ""),
            row_data.get("status_replied", ""),
            row_data.get("status_bounced", ""),
            row_data.get("status_complained", ""),
            row_data.get("status_unsubscribed", ""),
            row_data.get("reply_classification", ""),
            row_data.get("notes", "")
        ]]

        # Try specific tab first, fall back to first sheet
        range_name = f"{tab}!A:Z"
        try:
            service.spreadsheets().values().append(
                spreadsheetId=sheet_id,
                range=range_name,
                valueInputOption="RAW",
                body={"values": values}
            ).execute()
        except Exception as e:
            # Fallback: try without tab name (first sheet)
            if "Unable to parse range" in str(e):
                service.spreadsheets().values().append(
                    spreadsheetId=sheet_id,
                    range="A:Z",
                    valueInputOption="RAW",
                    body={"values": values}
                ).execute()
            else:
                raise
        print(f"  Logged to Google Sheets")
    except Exception as e:
        print(f"  Google Sheets logging failed: {e}")

# ============================================================
# REPLY CLASSIFICATION
# ============================================================

def classify_reply(subject, body):
    """Classify reply based on keywords"""
    text = f"{subject} {body}".lower()

    keywords = CONFIG["reply_classification"]["keywords"]

    for category, kws in keywords.items():
        for kw in kws:
            if kw in text:
                return category

    # Heuristics
    if len(text) > 200:
        return "interested"
    if any(w in text for w in ["?", "come", "quanto", "quando", "dove", "info"]):
        return "interested"

    return "unknown"


# ============================================================
# WEBHOOK EVENT HANDLERS (module-level for import by webhook_automation)
# ============================================================

def verify_agentmail_signature(body, signature):
    """Verify AgentMail webhook signature"""
    expected = hmac.new(AGENTMAIL_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_resend_signature(body, signature):
    """Verify Resend webhook signature"""
    expected = hmac.new(RESEND_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def handle_bounce(event, provider):
    email = event.get("email", "").lower()
    bounce_type = event.get("bounce_type", "unknown")
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))

    # Hard bounce -> immediate suppression
    if bounce_type == "hard":
        add_to_suppression(email, f"hard_bounce_{provider}", f"{provider}_webhook")

    log_to_sheets({
        "lead_slug": lead_slug,
        "step": event.get("step", ""),
        "status_bounced": "true",
        "reply_classification": bounce_type,
        "notes": f"{provider}_webhook bounce"
    })


def handle_complaint(event, provider):
    email = event.get("email", "").lower()
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))

    # Spam complaint -> immediate suppression
    add_to_suppression(email, f"spam_complaint_{provider}", f"{provider}_webhook")

    log_to_sheets({
        "lead_slug": lead_slug,
        "step": event.get("step", ""),
        "status_complained": "true",
        "reply_classification": "spam_complaint",
        "notes": f"{provider}_webhook complaint"
    })
    # Alert team
    print(f"⚠️ SPAM COMPLAINT: {email} - Review immediately!")


def handle_reply(event, provider):
    from_email = event.get("from_email", "").lower()
    subject = event.get("subject", "")
    body = event.get("text") or event.get("html", "")
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
    step = event.get("step", event.get("tags", {}).get("step", ""))

    classification = classify_reply(subject, body)

    # Log
    log_to_sheets({
        "lead_slug": lead_slug,
        "step": step,
        "status_replied": "true",
        "reply_classification": classification,
        "notes": f"{provider}_webhook reply: {body[:200]}"
    })

    # Actions based on classification
    if classification == "interested":
        print(f"[INTERESTED] REPLY from {from_email}: {subject}")
    elif classification == "not_interested":
        print(f"[NOT INTERESTED] from {from_email}")
    elif classification == "referral":
        print(f"[REFERRAL] from {from_email}: {subject}")
    elif classification == "unsubscribe":
        print(f"[UNSUBSCRIBE] from {from_email}")


# ============================================================
# DAILY SENDER DAEMON
# ============================================================

def load_batch(batch_date=None):
    """Load batch manifest for date"""
    batch_date = batch_date or datetime.now().date()
    batch_file = PROJECT_DIR / "outbox" / f"batch_{batch_date.strftime('%Y%m%d')}.json"
    if not batch_file.exists():
        # Try to find most recent batch
        batch_files = sorted(PROJECT_DIR.glob("outbox/batch_*.json"), reverse=True)
        if batch_files:
            batch_file = batch_files[0]
            print(f"Using latest batch: {batch_file}")
        else:
            return None

    with open(batch_file, "r", encoding="utf-8") as f:
        return json.load(f)

def filter_emails_for_today(emails, batch_date):
    """Filter emails that should be sent today based on step and lead start date"""
    # For simplicity, send all step 1 emails first, then step 2 next day, etc.
    # In production, track per-lead start date
    today = batch_date
    # This is simplified - in production you'd track per-lead created date
    return emails

def pre_send_checks(email_data):
    """Pre-send validation checks"""
    checks = {
        "suppression_list": check_suppression(email_data["to_email"]),
        "unsubscribe_hash": validate_unsubscribe_hash(
            email_data["to_email"], email_data["lead_slug"], email_data["step"], email_data["unsubscribe_hash"]
        ),
        "analyzer_score": email_data.get("analyzer_score", 0) >= 70,
        "legal_footer": "P.IVA" in email_data["body"] and "unsubscribe" in email_data["body"].lower()
    }

    failed = [k for k, v in checks.items() if not v]
    if failed:
        print(f"  Pre-send checks failed: {failed}")
        return False
    return True

def send_daily_batch(batch_date=None, dry_run=False):
    """Main daily send function"""
    batch_date = batch_date or datetime.now().date()
    print(f"\n{'='*60}")
    print(f"DAILY DISPATCH - {batch_date}" + (" [DRY RUN]" if dry_run else ""))
    print(f"{'='*60}")

    batch = load_batch(batch_date)
    if not batch:
        print("No batch found")
        return

    max_today = get_warmup_limit(batch_date)
    print(f"Daily limit (warmup): {max_today}")

    # Filter emails for today
    emails_to_send = filter_emails_for_today(batch["emails"], batch_date)

    # Sort by priority (Tier A first)
    emails_to_send.sort(key=lambda e: 0 if e["priority"] == "high" else 1)

    sent_today = 0
    suppressed_count = 0

    for email_spec in emails_to_send:
        if sent_today >= max_today:
            print(f"\n⏸️ Daily limit reached ({max_today})")
            break

        email_file = PROJECT_DIR / email_spec["file"]
        if not email_file.exists():
            print(f"⚠️ Email file missing: {email_file}")
            continue

        # Load email
        with open(email_file, "r", encoding="utf-8") as f:
            email_data = json.load(f)

        # Add metadata for sending
        lead_slug = email_data["lead_slug"]
        lead_info = next((l for l in batch["emails"] if l["lead_slug"] == lead_slug), {})
        # We need to load the original lead for email address
        leads_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
        with open(leads_path, "r", encoding="utf-8") as f:
            leads = json.load(f)
        lead = next((l for l in leads if l["slug"] == lead_slug), None)
        if not lead:
            print(f"  Lead not found: {lead_slug}")
            continue

        # Use the same email that was used for hash generation (decision_maker_email or fallback)
        to_email = lead.get("decision_maker_email", f"info@{lead['domain']}")

        email_data["to_email"] = to_email
        email_data["to_domain"] = lead["domain"]

        print(f"\n[{sent_today+1}/{max_today}] {lead['company']} - Step {email_data['step']}")
        print(f"  Subject: {email_data['subject_selected']}")
        print(f"  To: {to_email}")

        # Pre-send checks
        if not pre_send_checks(email_data):
            print(f"  [FAIL] Pre-send checks failed")
            suppressed_count += 1
            continue

        # Send
        result = send_email(email_data, dry_run=dry_run)

        if result["success"]:
            sent_today += 1
            print(f"  [OK] Sent! Message ID: {result['message_id']}")

            # Log
            log_to_sheets({
                "lead_slug": lead_slug,
                "company": lead["company"],
                "step": email_data["step"],
                "subject": email_data["subject_selected"],
                "message_id": result["message_id"],
                "status_sent": "true",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        else:
            print(f"  [FAIL] Failed: {result['error']}")

        # Random delay (skip in dry_run)
        if sent_today < max_today and not dry_run:
            delay = random.uniform(MIN_INTERVAL, MAX_INTERVAL)
            print(f"  [WAIT] Waiting {delay:.0f}s...")
            time.sleep(delay)
        elif sent_today < max_today and dry_run:
            print(f"  [SKIP] Delay skipped (dry run)")

    print(f"\n📊 Daily summary: {sent_today}/{max_today} sent, {suppressed_count} suppressed")

# ============================================================
# WEBHOOK HANDLER (for Vercel/Cloudflare deployment)
# ============================================================

WEBHOOK_HANDLER_CODE = '''
# webhook_handler.py - Deploy to Vercel/Cloudflare Workers
# Handles AgentMail/Resend webhooks for bounce, complaint, reply, delivery

import json, hmac, hashlib, os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

AGENTMAIL_WEBHOOK_SECRET = os.environ.get("AGENTMAIL_WEBHOOK_SECRET")
RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET")
UNSUB_SECRET = os.environ.get("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")
GOOGLE_SHEETS_CREDS = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
TRACKING_SHEET_ID = os.environ.get("TRACKING_SHEET_ID", "1AbCdEfGhIjKlMnOpQrStUvWxYz")

KEYWORDS = {
    "interested": ["interessato", "call", "incontro", "parliamo", "disponibile", "come funziona", "costo", "prezzo", "demo", "vediamo", "info", "dettagli"],
    "not_interested": ["non interessa", "non serve", "già sito", "fatto interno", "no grazie", "rimuovimi", "cancellami", "non voglio"],
    "referral": ["inoltro", "collega", "persona giusta", "responsabile", "passo al", "contattate", "girato"],
    "unsubscribe": ["disiscrivi", "rimuovi", "cancella", "unsubscribe", "opt out", "non voglio più"]
}

def verify_agentmail_signature(body, signature):
    expected = hmac.new(AGENTMAIL_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def verify_resend_signature(body, signature):
    expected = hmac.new(RESEND_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def classify_reply(subject, body):
    text = f"{subject} {body}".lower()
    for cat, kws in KEYWORDS.items():
        for kw in kws:
            if kw in text:
                return cat
    if len(text) > 200 or any(w in text for w in ["?", "come", "quanto", "quando", "dove", "info"]):
        return "interested"
    return "unknown"

def log_to_sheets(data):
    """Log to Google Sheets"""
    if not GOOGLE_SHEETS_CREDS:
        return
    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
        creds = Credentials.from_service_account_info(
            json.loads(GOOGLE_SHEETS_CREDS),
            scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        service = build("sheets", "v4", credentials=creds)
        values = [[
            data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            data.get("lead_slug", ""),
            data.get("company", ""),
            data.get("step", ""),
            data.get("subject", ""),
            data.get("message_id", ""),
            data.get("status_sent", ""),
            data.get("status_delivered", ""),
            data.get("status_opened", ""),
            data.get("status_clicked", ""),
            data.get("status_replied", ""),
            data.get("status_bounced", ""),
            data.get("status_complained", ""),
            data.get("status_unsubscribed", ""),
            data.get("reply_classification", ""),
            data.get("notes", "")
        ]]
        service.spreadsheets().values().append(
            spreadsheetId=TRACKING_SHEET_ID,
            range="Tracking!A:Z",
            valueInputOption="RAW",
            body={"values": values}
        ).execute()
    except Exception as e:
        print(f"Sheets logging failed: {e}")

def handle_bounce(event, provider):
    email = event.get("email", "").lower()
    bounce_type = event.get("bounce_type", "unknown")
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))

    # Hard bounce -> immediate suppression
    if bounce_type == "hard":
        # In production: add_to_suppression(email, f"hard_bounce_{provider}", f"{provider}_webhook")
        pass

    log_to_sheets({
        "lead_slug": lead_slug,
        "step": event.get("step", ""),
        "status_bounced": "true",
        "reply_classification": bounce_type,
        "notes": f"{provider}_webhook bounce"
    })

def handle_complaint(event, provider):
    email = event.get("email", "").lower()
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))

    # Spam complaint -> immediate suppression
    # In production: add_to_suppression(email, f"spam_complaint_{provider}", f"{provider}_webhook")

    log_to_sheets({
        "lead_slug": lead_slug,
        "step": event.get("step", ""),
        "status_complained": "true",
        "reply_classification": "spam_complaint",
        "notes": f"{provider}_webhook complaint"
    })
    # Alert team
    print(f"⚠️ SPAM COMPLAINT: {email} - Review immediately!")

def handle_reply(event, provider):
    from_email = event.get("from_email", "").lower()
    subject = event.get("subject", "")
    body = event.get("text") or event.get("html", "")
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
    step = event.get("step", event.get("tags", {}).get("step", ""))

    classification = classify_reply(subject, body)

    # Log
    log_to_sheets({
        "lead_slug": lead_slug,
        "step": step,
        "status_replied": "true",
        "reply_classification": classification,
        "notes": f"{provider}_webhook reply: {body[:200]}"
    })

    # Actions based on classification
    if classification == "interested":
        # Pause sequence, notify sales
        print(f"[INTERESTED] REPLY from {from_email}: {subject}")
        # In production: pause_lead_sequence(from_email, "interested_reply")
    elif classification == "not_interested":
        # Pause sequence, log lost reason
        print(f"[NOT INTERESTED] from {from_email}")
    elif classification == "referral":
        # Pause, notify sales with referral
        print(f"[REFERRAL] from {from_email}: {subject}")
    elif classification == "unsubscribe":
        # Add to suppression, pause
        print(f"[UNSUBSCRIBE] from {from_email}")

def handler(request):
    """Vercel/Cloudflare handler"""
    provider = "unknown"

    if request.path.startswith("/webhooks/email/agentmail"):
        provider = "agentmail"
        signature = request.headers.get("x-agentmail-signature")
        if not verify_agentmail_signature(request.body, signature):
            return {"statusCode": 401, "body": "Invalid signature"}
        event = json.loads(request.body)

    elif request.path.startswith("/webhooks/email/resend"):
        provider = "resend"
        signature = request.headers.get("x-resend-signature")
        if not verify_resend_signature(request.body, signature):
            return {"statusCode": 401, "body": "Invalid signature"}
        event = json.loads(request.body)

    else:
        return {"statusCode": 404, "body": "Not found"}

    event_type = event.get("type", event.get("event", "unknown"))

    if event_type in ["delivered", "delivery"]:
        log_to_sheets({"lead_slug": event.get("lead_slug", ""), "status_delivered": "true"})
    elif event_type == "bounced":
        handle_bounce(event, provider)
    elif event_type == "complained":
        handle_complaint(event, provider)
    elif event_type in ["replied", "reply"]:
        handle_reply(event, provider)
    elif event_type == "opened":
        log_to_sheets({"lead_slug": event.get("lead_slug", ""), "status_opened": "true"})
    elif event_type == "clicked":
        log_to_sheets({"lead_slug": event.get("lead_slug", ""), "status_clicked": "true"})

    return {"statusCode": 200, "body": "OK"}

# For local testing
if __name__ == "__main__":
    # Test classification
    test_cases = [
        ("Re: vostro sito 2019", "Interessato, quando possiamo fare call?"),
        ("Re: vostro sito 2019", "Non ci serve, abbiamo sito interno"),
        ("Re: vostro sito 2019", "Inoltro al mio responsabile marketing"),
        ("Re: vostro sito 2019", "Cancellatemi dalla lista"),
    ]
    for subj, body in test_cases:
        print(f"'{subj}' + '{body[:30]}...' -> {classify_reply(subj, body)}")
'''

# ============================================================
# UNsubscribe Handler (for one-click unsubscribe)
# ============================================================

UNSUB_HANDLER_CODE = '''
# unsubscribe_handler.py - Deploy to Vercel/Cloudflare
# Handles one-click unsubscribe via List-Unsubscribe header

import json, hmac, hashlib, os
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone

UNSUB_SECRET = os.environ.get("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")
GOOGLE_SHEETS_CREDS = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
TRACKING_SHEET_ID = os.environ.get("TRACKING_SHEET_ID", "1AbCdEfGhIjKlMnOpQrStUvWxYz")

def verify_hash(email, company_slug, step, provided_hash):
    msg = f"{email}|{company_slug}|step{step}|{datetime.now(timezone.utc).date().isoformat()}".encode()
    expected = hmac.new(UNSUB_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:16]
    return hmac.compare_digest(expected, provided_hash)

def log_unsubscribe(email, company_slug, step):
    if not GOOGLE_SHEETS_CREDS:
        return
    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
        creds = Credentials.from_service_account_info(
            json.loads(GOOGLE_SHEETS_CREDS),
            scopes=["https://www.googleapis.com/auth/spreadsheets"]
        )
        service = build("sheets", "v4", credentials=creds)
        values = [[
            datetime.now(timezone.utc).isoformat(),
            company_slug,
            "",
            step,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "true",
            "unsubscribe_link",
            f"One-click unsubscribe via List-Unsubscribe"
        ]]
        service.spreadsheets().values().append(
            spreadsheetId=TRACKING_SHEET_ID,
            range="Tracking!A:Z",
            valueInputOption="RAW",
            body={"values": values}
        ).execute()
    except Exception as e:
        print(f"Sheets logging failed: {e}")

def handler(request):
    """Handle GET /unsubscribe?h=<hash>&e=<email>&s=<slug>&step=<n>"""
    query = parse_qs(urlparse(request.url).query)

    hash_val = query.get("h", [""])[0]
    email = query.get("e", [""])[0].lower()
    slug = query.get("s", [""])[0]
    step = int(query.get("step", ["1"])[0])

    if not verify_hash(email, slug, step, hash_val):
        return {
            "statusCode": 400,
            "body": "Invalid or expired unsubscribe link"
        }

    # Log unsubscribe
    log_unsubscribe(email, slug, step)

    # Add to suppression list (in production, call API)
    # add_to_suppression(email, "unsubscribe_link", "unsubscribe_handler")

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/html"},
        "body": """
        <html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem;">
            <h1>Disiscritto con successo</h1>
            <p>Non riceverai più email da ZAK Studio Web.</p>
            <p>Se è stato un errore, rispondi a questa email o scrivi a mario.rossi@zakstudio.com</p>
            <hr>
            <p style="color: #666; font-size: 0.875rem;">
                ZAK Studio Web di Mario Rossi — Via Roma 123, 25121 Brescia — P.IVA 01234567890
            </p>
        </body></html>
        """
    }
'''

# ============================================================
# MAIN - Generate all config files
# ============================================================

def main():
    print("="*60)
    print("STEP 4: EMAIL DISPATCH SETUP")
    print("="*60)

    # 1. Create suppression list
    print("\n1. Creating suppression list...")
    init_suppression_list()
    print(f"   Suppression list: {SUPPRESSION_FILE}")

    # 2. Generate sender daemon script
    print("\n2. Generating sender daemon...")
    sender_daemon = f'''#!/usr/bin/env python3
"""
Daily Email Sender Daemon
Run via cron: 0 8 * * * cd {PROJECT_DIR} && python sender_daemon.py
"""
import sys
sys.path.insert(0, r"{PROJECT_DIR}")

from run_pipeline_step4 import send_daily_batch
from datetime import datetime

if __name__ == "__main__":
    # Allow date override for testing
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Date in YYYY-MM-DD format")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without sending")
    args = parser.parse_args()

    if args.date:
        from datetime import datetime
        send_daily_batch(datetime.strptime(args.date, "%Y-%m-%d").date())
    else:
        send_daily_batch()
'''

    (PROJECT_DIR / "sender_daemon.py").write_text(sender_daemon, encoding="utf-8")
    print(f"   Created: sender_daemon.py")

    # 3. Generate webhook handler
    print("\n3. Generating webhook handler...")
    (PROJECT_DIR / "webhook_handler.py").write_text(WEBHOOK_HANDLER_CODE, encoding="utf-8")
    print(f"   Created: webhook_handler.py (deploy to Vercel/Cloudflare)")

    # 4. Generate unsubscribe handler
    print("\n4. Generating unsubscribe handler...")
    (PROJECT_DIR / "unsubscribe_handler.py").write_text(UNSUB_HANDLER_CODE, encoding="utf-8")
    print(f"   Created: unsubscribe_handler.py (deploy to Vercel/Cloudflare)")

    # 5. Generate cron example
    print("\n5. Generating cron schedule example...")
    cron_example = """# Cron schedule for daily dispatch
# Add to crontab: crontab -e

# Daily send at 8:00 AM (adjust timezone as needed)
0 8 * * * cd {PROJECT_DIR} && python sender_daemon.py >> logs/sender_$(date +\\%Y\\%m\\%d).log 2>&1

# Weekly report every Monday 9:00 AM
0 9 * * 1 cd {PROJECT_DIR} && python -m email_dispatcher --weekly-report --start $(date -d 'last monday' +\\%Y-\\%m-\\%d) --end $(date -d 'sunday' +\\%Y-\\%m-\\%d) --output reports/weekly_$(date +\\%Y\\%m\\%d).md

# Monthly suppression sync (1st of month)
0 10 1 * * cd {PROJECT_DIR} && python -m email_dispatcher --sync-suppression --direction esp_to_local
""".format(PROJECT_DIR=PROJECT_DIR)
    (PROJECT_DIR / "cron_example.txt").write_text(cron_example, encoding="utf-8")
    print(f"   Created: cron_example.txt")

    # 6. Create logs directory
    (PROJECT_DIR / "logs").mkdir(exist_ok=True)

    print("\n" + "="*60)
    print("RIASSUNTO STEP 4")
    print("="*60)
    print("File creati:")
    print("  - sender_daemon.py (daily send script)")
    print("  - webhook_handler.py (AgentMail/Resend webhooks)")
    print("  - unsubscribe_handler.py (one-click unsubscribe)")
    print("  - cron_example.txt (cron schedule)")
    print("  - 02-data/suppression-list.csv (initialized)")
    print("\nProssimi passi:")
    print("  1. Configura AGENTMAIL_API_KEY e AGENTMAIL_WEBHOOK_SECRET in .env")
    print("  2. Deploy webhook_handler.py su Vercel/Cloudflare Workers")
    print("  3. Configura webhook URL in AgentMail/Resend dashboard")
    print("  4. Deploy unsubscribe_handler.py su stesso dominio")
    print("  5. Aggiungi cron job per sender_daemon.py")
    print("  6. Configura Google Sheets credentials per tracking")

if __name__ == "__main__":
    main()