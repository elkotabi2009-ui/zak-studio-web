
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
    "interested": ["interessato", "call", "incontro", "parliamo", "disponibile", "come funziona", "costo", "prezzo", "demo", "vediamo", "info", "dettagli", "preventivo", "quanto costa", "quando", "dove"],
    "not_interested": ["non interessa", "non serve", "non ci serve", "già sito", "fatto interno", "no grazie", "rimuovimi", "cancellami", "lassatemi", "lasciatemi"],
    "referral": ["inoltro", "collega", "persona giusta", "responsabile", "passo al", "contattate", "girato", "inoltra", "giro a"],
    "unsubscribe": ["disiscrivi", "rimuovi", "cancella", "unsubscribe", "opt out", "non voglio più", "non voglio piu", "non voglio più email", "toglietemi"]
}

def verify_agentmail_signature(body, signature):
    expected = hmac.new(AGENTMAIL_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)

def verify_resend_signature(body, signature):
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
