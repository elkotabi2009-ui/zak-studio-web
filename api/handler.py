#!/usr/bin/env python3
"""
Vercel Serverless Function - Webhook Handler
Handles AgentMail/Resend webhooks for bounce, complaint, reply, delivery, open, click
Deploy to: https://zakstudio-webhook-deploy.vercel.app
"""

import json, hmac, hashlib, os
from datetime import datetime, timezone

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

AGENTMAIL_WEBHOOK_SECRET = os.environ.get("AGENTMAIL_WEBHOOK_SECRET")
RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET")
UNSUB_SECRET = os.environ.get("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")
GOOGLE_SHEETS_CREDS = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
TRACKING_SHEET_ID = os.environ.get("TRACKING_SHEET_ID", "1hD75vPwnT0SYpF-2rvZqbDfVu5kpe8onoZcM_Q06BRA")

KEYWORDS = {
    "interested": ["interessato", "call", "incontro", "parliamo", "disponibile", "come funziona", "costo", "prezzo", "demo", "vediamo", "info", "dettagli", "preventivo", "quanto costa", "quando", "dove"],
    "not_interested": ["non interessa", "non serve", "non ci serve", "già sito", "fatto interno", "no grazie", "rimuovimi", "cancellami", "lassatemi", "lasciatemi"],
    "referral": ["inoltro", "collega", "persona giusta", "responsabile", "passo al", "contattate", "girato", "inoltra", "giro a"],
    "unsubscribe": ["disiscrivi", "rimuovi", "cancella", "unsubscribe", "opt out", "non voglio più", "non voglio piu", "non voglio più email", "toglietemi"]
}

def verify_agentmail_signature(body, signature):
    if not AGENTMAIL_WEBHOOK_SECRET:
        return False
    expected = hmac.new(AGENTMAIL_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def verify_resend_signature(body, signature):
    if not RESEND_WEBHOOK_SECRET:
        return False
    expected = hmac.new(RESEND_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def classify_reply(subject, body):
    text = f"{subject} {body}".lower()
    # Check negative/opt-out FIRST to avoid "interessato" matching in "non interessa"
    for cat in ["unsubscribe", "not_interested", "referral", "interested"]:
        for kw in KEYWORDS[cat]:
            if kw in text:
                return cat
    if len(text) > 200 or any(w in text for w in ["?", "come", "quanto", "quando", "dove", "info", "preventivo"]):
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

    if bounce_type == "hard":
        pass  # suppression handled elsewhere

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

    log_to_sheets({
        "lead_slug": lead_slug,
        "step": event.get("step", ""),
        "status_complained": "true",
        "reply_classification": "spam_complaint",
        "notes": f"{provider}_webhook complaint"
    })
    print(f"SPAM COMPLAINT: {email}")

def handle_reply(event, provider):
    from_email = event.get("from_email", "").lower()
    subject = event.get("subject", "")
    body = event.get("text") or event.get("html", "")
    lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
    step = event.get("step", event.get("tags", {}).get("step", ""))

    classification = classify_reply(subject, body)

    log_to_sheets({
        "lead_slug": lead_slug,
        "step": step,
        "status_replied": "true",
        "reply_classification": classification,
        "notes": f"{provider}_webhook reply: {body[:200]}"
    })

    if classification == "interested":
        print(f"[INTERESTED] REPLY from {from_email}: {subject}")
    elif classification == "not_interested":
        print(f"[NOT INTERESTED] from {from_email}")
    elif classification == "referral":
        print(f"[REFERRAL] from {from_email}: {subject}")
    elif classification == "unsubscribe":
        print(f"[UNSUBSCRIBE] from {from_email}")

def handler(request):
    """Vercel/Cloudflare handler - Python function signature for Vercel"""
    import sys

    # Real Vercel request object has: method, path, headers, body, query
    # Simulate from WSGI/ASGI or direct call
    if hasattr(request, 'method'):
        method = request.method
        path = request.path
        headers = dict(request.headers) if hasattr(request, 'headers') else {}
        body = request.get_data(as_text=True) if hasattr(request, 'get_data') else str(request.body)
    elif isinstance(request, dict):
        # Direct dict payload
        method = request.get('method', 'POST')
        path = request.get('path', request.get('url', '/'))
        headers = request.get('headers', {})
        body = request.get('body', '')
    else:
        # Fallback
        return {"statusCode": 400, "body": "Invalid request format"}

    # Accept both POST and GET (for testing)
    if method not in ["POST", "GET"]:
        return {"statusCode": 405, "body": "Method not allowed"}

    provider = "unknown"

    if path.startswith("/webhooks/email/agentmail") or path.startswith("/api/webhooks/email/agentmail"):
        provider = "agentmail"
        signature = headers.get("x-agentmail-signature", headers.get("X-Agentmail-Signature", ""))
        if not verify_agentmail_signature(body.encode() if isinstance(body, str) else body, signature):
            return {"statusCode": 401, "body": "Invalid AgentMail signature"}
        try:
            event = json.loads(body)
        except:
            return {"statusCode": 400, "body": "Invalid JSON"}

    elif path.startswith("/webhooks/email/resend") or path.startswith("/api/webhooks/email/resend"):
        provider = "resend"
        signature = headers.get("x-resend-signature", headers.get("X-Resend-Signature", ""))
        if not verify_resend_signature(body.encode() if isinstance(body, str) else body, signature):
            return {"statusCode": 401, "body": "Invalid Resend signature"}
        try:
            event = json.loads(body)
        except:
            return {"statusCode": 400, "body": "Invalid JSON"}

    elif path == "/health" or path == "/api/health":
        return {"statusCode": 200, "body": "OK"}

    else:
        return {"statusCode": 404, "body": "Not found"}

    event_type = event.get("type", event.get("event", "unknown"))

    try:
        if event_type in ["delivered", "delivery"]:
            log_to_sheets({"lead_slug": event.get("lead_slug", event.get("tags", {}).get("lead_slug", "")), "status_delivered": "true"})
        elif event_type == "bounced":
            handle_bounce(event, provider)
        elif event_type == "complained":
            handle_complaint(event, provider)
        elif event_type in ["replied", "reply"]:
            handle_reply(event, provider)
        elif event_type == "opened":
            log_to_sheets({"lead_slug": event.get("lead_slug", event.get("tags", {}).get("lead_slug", "")), "status_opened": "true"})
        elif event_type == "clicked":
            log_to_sheets({"lead_slug": event.get("lead_slug", event.get("tags", {}).get("lead_slug", "")), "status_clicked": "true"})
        else:
            print(f"Unhandled event type: {event_type}")

    except Exception as e:
        print(f"Webhook processing error: {e}")

    return {"statusCode": 200, "body": "OK"}

# For Vercel Python serverless function
def main(request):
    """Entry point for Vercel Python runtime"""
    return handler(request)

# For local testing
if __name__ == "__main__":
    test_cases = [
        ("Re: vostro sito 2019", "Interessato, quando possiamo fare call?"),
        ("Re: vostro sito 2019", "Non ci serve, abbiamo sito interno"),
        ("Re: vostro sito 2019", "Inoltro al mio responsabile marketing"),
        ("Re: vostro sito 2019", "Cancellatemi dalla lista"),
    ]
    for subj, body in test_cases:
        print(f"'{subj}' + '{body[:30]}...' -> {classify_reply(subj, body)}")