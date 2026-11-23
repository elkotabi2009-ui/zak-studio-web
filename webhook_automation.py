#!/usr/bin/env python3
"""
WEBHOOK AUTOMATION — Full Auto-Flow
Connects: Reply Webhook → Classification → Landing Page Gen → Quote → Payment Tracking → Delivery

Deploy to Vercel/Cloudflare Workers as /webhooks/email/agentmail and /webhooks/email/resend
This is the ORCHESTRATOR that makes the pipeline fully automated.
"""
import os, json, hmac, hashlib
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import subprocess
import sys

load_dotenv()

PROJECT_DIR = Path(__file__).parent

# Add project to path for imports
sys.path.insert(0, str(PROJECT_DIR))

# Import from existing modules
from run_pipeline_step4 import (
    classify_reply, load_suppression_list, add_to_suppression,
    log_to_sheets, handle_bounce, handle_complaint, handle_reply as original_handle_reply
)
from run_pipeline_step5 import (
    process_reply, pause_sequence, load_lead_states, save_lead_states
)

# Import new automation
from run_pipeline_step6 import main as generate_landing_main
from run_pipeline_step7 import (
    create_and_send_quote, register_payment, check_payment_and_deliver,
    send_payment_reminders, load_json, save_json, QUOTES_FILE
)

# Load config
import yaml
with open(PROJECT_DIR / "01-config" / "dispatcher.yaml", "r", encoding="utf-8") as f:
    CONFIG = yaml.safe_load(f)

AGENTMAIL_WEBHOOK_SECRET = os.environ.get("AGENTMAIL_WEBHOOK_SECRET")
RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET")
UNSUB_SECRET = os.environ.get("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")
GOOGLE_SHEETS_CREDS = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
TRACKING_SHEET_ID = os.environ.get("TRACKING_SHEET_ID", "1AbCdEfGhIjKlMnOpQrStUvWxYz")

# Load leads for reference
LEADS_PATH = PROJECT_DIR / "02-data" / "leads_enriched.json"
with open(LEADS_PATH, "r", encoding="utf-8") as f:
    LEADS = {l["slug"]: l for l in json.load(f)}

# ============================================================
# SIGNATURE VERIFICATION
# ============================================================

def verify_agentmail_signature(body: bytes, signature: str) -> bool:
    expected = hmac.new(AGENTMAIL_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def verify_resend_signature(body: bytes, signature: str) -> bool:
    expected = hmac.new(RESEND_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

# ============================================================
# AUTOMATED FLOW: INTERESTED REPLY → LANDING PAGE → QUOTE
# ============================================================

def trigger_interested_flow(lead_slug: str, company: str, decision_maker_email: str,
                            decision_maker_name: str, decision_maker_title: str,
                            step: int, reply_subject: str, reply_body: str):
    """
    FULL AUTOMATION when prospect replies "interested":
    1. Pause email sequence
    2. Generate company presentation landing page (Step 6)
    3. Send formal quote with IBAN (Step 7)
    4. Log everything to Google Sheets
    5. Create CRM task for sales follow-up
    """
    print(f"\n{'='*60}")
    print(f"[TARGET] AUTOMATED FLOW TRIGGERED: {lead_slug} ({company})")
    print(f"{'='*60}")

    lead = LEADS.get(lead_slug)
    if not lead:
        print(f"[ERROR] Lead not found in LEADS: {lead_slug}")
        return {"success": False, "error": "Lead not found"}

    results = {"lead_slug": lead_slug, "company": company, "steps": {}}

    # 1. PAUSE SEQUENCE
    print(f"  [1] Pausing email sequence...")
    pause_result = pause_sequence(lead_slug, "interested_reply_auto")
    results["steps"]["pause_sequence"] = {"success": True, "reason": "interested_reply_auto"}

    # 2. GENERATE LANDING PAGE (Step 6)
    print(f"  [2] Generating company presentation landing page...")
    try:
        # Run step 6 generator for this lead
        landing_dir = PROJECT_DIR / "03-output" / "landings" / lead_slug

        # Import and call the generation function directly
        from run_pipeline_step6 import (
            create_landing_directory, write_landing_files,
            deploy_to_netlify, generate_landing_page
        )

        # Create directory and files
        landing_dir = create_landing_directory(lead)
        write_landing_files(lead, landing_dir, formspree_id="your-form-id")

        # Try to deploy to Netlify
        deploy_result = deploy_to_netlify(landing_dir, lead_slug)

        results["steps"]["landing_page"] = {
            "success": True,
            "directory": str(landing_dir),
            "deploy": deploy_result,
            "landing_url": deploy_result.get("url", f"https://{lead_slug}.zakstudio.com")
        }
        print(f"     [OK] Landing page generated: {landing_dir}")
        if deploy_result.get("success"):
            print(f"     [DEPLOY] Deployed to: {deploy_result['url']}")
        else:
            print(f"     [WARN] Deploy failed (manual later): {deploy_result.get('error')}")

    except Exception as e:
        print(f"     [ERROR] Landing page generation failed: {e}")
        results["steps"]["landing_page"] = {"success": False, "error": str(e)}

    # 3. SEND QUOTE EMAIL (Step 7)
    print(f"  [3] Sending formal quote email with IBAN...")
    try:
        quote_record, send_result = create_and_send_quote(
            lead, decision_maker_email, decision_maker_name, decision_maker_title
        )
        results["steps"]["quote_email"] = {
            "success": send_result["success"],
            "quote_number": quote_record["quote_number"],
            "price_total": quote_record["price_total"],
            "payment_ref": quote_record["payment_ref"],
            "message_id": send_result.get("message_id")
        }
        if send_result["success"]:
            print(f"     [OK] Quote sent: {quote_record['quote_number']} — €{quote_record['price_total']:,.2f}")
        else:
            print(f"     [ERROR] Quote send failed: {send_result.get('error')}")
    except Exception as e:
        print(f"     [ERROR] Quote generation failed: {e}")
        results["steps"]["quote_email"] = {"success": False, "error": str(e)}

    # 4. LOG TO GOOGLE SHEETS
    print(f"  [4] Logging to Google Sheets...")
    try:
        log_to_sheets({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "lead_slug": lead_slug,
            "company": company,
            "step": step,
            "subject": reply_subject,
            "message_id": "",
            "status_sent": "",
            "status_delivered": "",
            "status_opened": "",
            "status_clicked": "",
            "status_replied": "true",
            "status_bounced": "",
            "status_complained": "",
            "status_unsubscribed": "",
            "reply_classification": "interested_auto_flow",
            "notes": f"AUTO-FLOW: Landing generated + Quote sent. Quote: {results['steps'].get('quote_email', {}).get('quote_number', 'N/A')}"
        })
        results["steps"]["sheets_log"] = {"success": True}
        print(f"     [OK] Logged to Sheets")
    except Exception as e:
        print(f"     [WARN] Sheets logging failed: {e}")
        results["steps"]["sheets_log"] = {"success": False, "error": str(e)}

    # 5. CREATE CRM TASK
    print(f"  [5] Creating CRM task...")
    try:
        from run_pipeline_step5 import create_crm_task, notify_sales

        create_crm_task(lead_slug, company, "interested", reply_subject,
                       f"AUTO-FLOW TRIGGERED:\n- Landing page generated: {results['steps'].get('landing_page', {}).get('landing_url', 'N/A')}\n- Quote sent: {results['steps'].get('quote_email', {}).get('quote_number', 'N/A')}\n- Amount: €{results['steps'].get('quote_email', {}).get('price_total', 'N/A')}\n\nOriginal reply:\n{reply_body[:500]}")

        notify_sales(lead_slug, company, "interested_auto_flow", reply_subject,
                    f"Automated flow completed. Landing page ready, quote sent.\nReply: {reply_body[:300]}")

        results["steps"]["crm_task"] = {"success": True}
        print(f"     [OK] CRM task created + Sales notified")
    except Exception as e:
        print(f"     [WARN] CRM task failed: {e}")
        results["steps"]["crm_task"] = {"success": False, "error": str(e)}

    # 6. SAVE AUTOMATION LOG
    automation_log_path = PROJECT_DIR / "02-data" / "automation_log.json"
    automation_logs = load_json(automation_log_path, [])
    automation_logs.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "lead_slug": lead_slug,
        "company": company,
        "trigger": "interested_reply",
        "step": step,
        "results": results
    })
    save_json(automation_log_path, automation_logs)

    print(f"\n{'='*60}")
    print(f"[OK] AUTO-FLOW COMPLETED for {company}")
    print(f"{'='*60}")

    return {"success": True, "results": results}

# ============================================================
# WEBHOOK HANDLERS
# ============================================================

def handle_agentmail_webhook(event: dict, body: bytes):
    """Process AgentMail webhook event"""
    event_type = event.get("type", event.get("event", "unknown"))
    print(f"\n[WEBHOOK] AgentMail webhook: {event_type}")

    # Verify signature
    signature = event.get("_signature")  # passed separately
    if signature and not verify_agentmail_signature(body, signature):
        print("[ERROR] Invalid AgentMail signature")
        return {"statusCode": 401, "error": "Invalid signature"}

    if event_type in ["delivered", "delivery"]:
        log_to_sheets({"lead_slug": event.get("lead_slug", ""), "status_delivered": "true"})
        return {"statusCode": 200, "body": "OK"}

    elif event_type == "bounced":
        handle_bounce(event, "agentmail")
        return {"statusCode": 200, "body": "OK"}

    elif event_type == "complained":
        handle_complaint(event, "agentmail")
        return {"statusCode": 200, "body": "OK"}

    elif event_type in ["replied", "reply"]:
        # Extract reply data
        from_email = event.get("from_email", "").lower()
        subject = event.get("subject", "")
        text_body = event.get("text") or event.get("html", "")
        lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
        step = event.get("step", event.get("tags", {}).get("step", 1))

        if not lead_slug:
            print("[WARN] No lead_slug in reply event")
            return {"statusCode": 200, "body": "OK (no lead_slug)"}

        lead = LEADS.get(lead_slug)
        company = lead["company"] if lead else "Unknown"

        # Classify reply
        classification = classify_reply(subject, text_body)
        print(f"  Classification: {classification}")

        # Log reply
        log_to_sheets({
            "lead_slug": lead_slug,
            "step": step,
            "status_replied": "true",
            "reply_classification": classification,
            "notes": f"AgentMail webhook reply: {text_body[:200]}"
        })

        # Process with step 5 logic
        process_reply(lead_slug, company, from_email, subject, text_body, step)

        # TRIGGER AUTO-FLOW IF INTERESTED
        if classification == "interested":
            # Get decision maker info from lead or use reply email
            dm_email = lead.get("decision_maker_email", from_email) if lead else from_email
            dm_name = lead.get("decision_maker", "Titolare") if lead else "Titolare"
            dm_title = lead.get("title", "Titolare") if lead else "Titolare"

            trigger_interested_flow(lead_slug, company, dm_email, dm_name, dm_title, step, subject, text_body)

        return {"statusCode": 200, "body": "OK"}

    elif event_type == "opened":
        log_to_sheets({"lead_slug": event.get("lead_slug", ""), "status_opened": "true"})
        return {"statusCode": 200, "body": "OK"}

    elif event_type == "clicked":
        log_to_sheets({"lead_slug": event.get("lead_slug", ""), "status_clicked": "true"})
        return {"statusCode": 200, "body": "OK"}

    return {"statusCode": 200, "body": "OK"}

def handle_resend_webhook(event: dict, body: bytes):
    """Process Resend webhook event"""
    event_type = event.get("type", "unknown")
    print(f"\n[WEBHOOK] Resend webhook: {event_type}")

    # Verify signature if provided
    # Resend uses different signature format

    if event_type == "email.delivered":
        log_to_sheets({"lead_slug": event.get("tags", {}).get("lead_slug", ""), "status_delivered": "true"})
    elif event_type == "email.bounced":
        handle_bounce(event, "resend")
    elif event_type == "email.complained":
        handle_complaint(event, "resend")
    elif event_type == "email.replied":
        # Similar to AgentMail reply handling
        pass

    return {"statusCode": 200, "body": "OK"}

# ============================================================
# UNSUBSCRIBE HANDLER (for List-Unsubscribe header)
# ============================================================

def handle_unsubscribe(request_query: dict):
    """Handle one-click unsubscribe via List-Unsubscribe header"""
    hash_val = request_query.get("h", [""])[0]
    email = request_query.get("e", [""])[0].lower()
    slug = request_query.get("s", [""])[0]
    step = int(request_query.get("step", ["1"])[0])

    # Verify hash
    msg = f"{email}|{slug}|step{step}|{datetime.now(timezone.utc).date().isoformat()}".encode()
    expected = hmac.new(UNSUB_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:16]

    if not hmac.compare_digest(expected, hash_val):
        return {
            "statusCode": 400,
            "body": "Invalid or expired unsubscribe link"
        }

    # Add to suppression
    add_to_suppression(email, "unsubscribe_link", "unsubscribe_handler")

    # Pause sequence
    pause_sequence(slug, "unsubscribe_link")

    # Log
    log_to_sheets({
        "lead_slug": slug,
        "step": step,
        "status_unsubscribed": "true",
        "reply_classification": "unsubscribe_link",
        "notes": "One-click unsubscribe via List-Unsubscribe header"
    })

    # Return HTML confirmation page
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/html; charset=utf-8"},
        "body": f"""
        <!DOCTYPE html>
        <html lang="it"><head><meta charset="UTF-8"><title>Disiscritto</title>
        <style>body{{font-family:system-ui;max-width:600px;margin:2rem auto;padding:1rem;text-align:center}}</style></head>
        <body>
            <h1>Disiscritto con successo</h1>
            <p>Non riceverai più email da ZAK Studio Web per <strong>{slug}</strong>.</p>
            <p>Se è stato un errore, rispondi a questa email o scrivi a {CONFIG['sender']['reply_to']}</p>
            <hr><p style="color:#666;font-size:0.875rem;">ZAK Studio Web di {CONFIG['sender']['from_name']} — P.IVA 01234567890</p>
        </body></html>
        """
    }

# ============================================================
# SCHEDULED TASKS (called by cron)
# ============================================================

def run_scheduled_tasks():
    """Run all scheduled automation tasks"""
    print(f"\n{'='*60}")
    print(f"[CRON] SCHEDULED TASKS - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}")

    # 1. Check for payments and auto-deliver
    print("  [1] Checking for confirmed payments...")
    check_payment_and_deliver()

    # 2. Send payment reminders
    print("  [2] Sending payment reminders...")
    send_payment_reminders()

    # 3. Daily sender daemon (if it's send time)
    # This is handled by separate sender_daemon.py cron

    print("  [OK] Scheduled tasks completed")

# ============================================================
# VERCEL / CLOUDFLARE WORKER ENTRY POINT
# ============================================================

def handler(request):
    """
    Main entry point for Vercel/Cloudflare Workers.
    Routes based on path:
    - /webhooks/email/agentmail → AgentMail webhook
    - /webhooks/email/resend → Resend webhook
    - /unsubscribe → One-click unsubscribe
    - /cron/scheduled → Scheduled tasks (protect with secret)
    """
    path = request.get("path", request.get("url", ""))
    method = request.get("method", "POST")
    headers = request.get("headers", {})
    body = request.get("body", b"")
    query = request.get("query", {})

    # Parse JSON body if needed
    if isinstance(body, str):
        body = body.encode()

    try:
        if path.startswith("/webhooks/email/agentmail"):
            # Verify AgentMail signature
            signature = headers.get("x-agentmail-signature", headers.get("X-Agentmail-Signature", ""))
            if not verify_agentmail_signature(body, signature):
                return {"statusCode": 401, "body": "Invalid AgentMail signature"}

            event = json.loads(body.decode() if isinstance(body, bytes) else body)
            return handle_agentmail_webhook(event, body)

        elif path.startswith("/webhooks/email/resend"):
            # Verify Resend signature
            signature = headers.get("x-resend-signature", headers.get("X-Resend-Signature", ""))
            if signature and not verify_resend_signature(body, signature):
                return {"statusCode": 401, "body": "Invalid Resend signature"}

            event = json.loads(body.decode() if isinstance(body, bytes) else body)
            return handle_resend_webhook(event, body)

        elif path.startswith("/unsubscribe"):
            return handle_unsubscribe(query)

        elif path.startswith("/cron/scheduled"):
            # Protect with secret header
            cron_secret = headers.get("x-cron-secret", headers.get("X-Cron-Secret", ""))
            expected_secret = os.environ.get("CRON_SECRET", "zak-cron-secret-2026")
            if cron_secret != expected_secret:
                return {"statusCode": 401, "body": "Unauthorized"}

            run_scheduled_tasks()
            return {"statusCode": 200, "body": "Scheduled tasks completed"}

        else:
            return {"statusCode": 404, "body": "Not found"}

    except Exception as e:
        print(f"[ERROR] Webhook handler error: {e}")
        import traceback
        traceback.print_exc()
        return {"statusCode": 500, "body": f"Internal error: {str(e)}"}

# ============================================================
# LOCAL TESTING
# ============================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Webhook Automation - Local Testing")
    subparsers = parser.add_subparsers(dest="command")

    # Test interested flow
    p_flow = subparsers.add_parser("test-flow", help="Test full interested flow for a lead")
    p_flow.add_argument("--lead-slug", required=True)
    p_flow.add_argument("--dm-email", required=True)
    p_flow.add_argument("--dm-name", default="Titolare")
    p_flow.add_argument("--dm-title", default="Titolare")
    p_flow.add_argument("--step", type=int, default=1)
    p_flow.add_argument("--subject", default="Re: vostro sito 2019")
    p_flow.add_argument("--body", default="Interessato, quando possiamo fare una call per parlarne?")

    # Test webhook locally
    p_webhook = subparsers.add_parser("test-webhook", help="Simulate AgentMail webhook")
    p_webhook.add_argument("--lead-slug", required=True)
    p_webhook.add_argument("--type", choices=["replied", "bounced", "complained", "delivered"], default="replied")
    p_webhook.add_argument("--from-email", default="ceo@testcompany.it")
    p_webhook.add_argument("--subject", default="Re: vostro sito 2019")
    p_webhook.add_argument("--body", default="Interessato, disponibile giovedì pomeriggio per call.")

    # Run scheduled tasks
    subparsers.add_parser("run-scheduled", help="Run scheduled tasks manually")

    args = parser.parse_args()

    if args.command == "test-flow":
        lead = LEADS.get(args.lead_slug)
        if not lead:
            print(f"[FAIL] Lead not found: {args.lead_slug}")
        else:
            trigger_interested_flow(
                args.lead_slug, lead["company"], args.dm_email,
                args.dm_name, args.dm_title, args.step, args.subject, args.body
            )

    elif args.command == "test-webhook":
        lead = LEADS.get(args.lead_slug)
        if not lead:
            print(f"[FAIL] Lead not found: {args.lead_slug}")
        else:
            event = {
                "type": args.type,
                "from_email": args.from_email,
                "subject": args.subject,
                "text": args.body,
                "lead_slug": args.lead_slug,
                "step": 1,
                "tags": {"lead_slug": args.lead_slug, "step": "1"}
            }
            handle_agentmail_webhook(event, json.dumps(event).encode())

    elif args.command == "run-scheduled":
        run_scheduled_tasks()

    else:
        parser.print_help()