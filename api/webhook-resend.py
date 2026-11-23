import json
import hmac
import hashlib
import os
from datetime import datetime, timezone

RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET")
GOOGLE_SHEETS_CREDS = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
TRACKING_SHEET_ID = os.environ.get("TRACKING_SHEET_ID", "1hD75vPwnT0SYpF-2rvZqbDfVu5kpe8onoZcM_Q06BRA")

KEYWORDS = {
    "interested": ["interessato", "call", "incontro", "parliamo", "disponibile", "come funziona", "costo", "prezzo", "demo", "vediamo", "info", "dettagli"],
    "not_interested": ["non interessa", "non serve", "già sito", "fatto interno", "no grazie", "rimuovimi", "cancellami", "non voglio"],
    "referral": ["inoltro", "collega", "persona giusta", "responsabile", "passo al", "contattate", "girato"],
    "unsubscribe": ["disiscrivi", "rimuovi", "cancella", "unsubscribe", "opt out", "non voglio più"]
}

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

def handler(request):
    """Vercel serverless function handler"""
    try:
        body = request.get_data(as_text=True)
        signature = request.headers.get("x-resend-signature", "")

        if not verify_resend_signature(body.encode(), signature):
            return {"statusCode": 401, "body": json.dumps({"error": "Invalid signature"})}

        event = json.loads(body)
        event_type = event.get("type", "unknown")

        # Resend webhook format
        if event_type == "email.delivered":
            log_to_sheets({
                "lead_slug": event.get("tags", {}).get("lead_slug", ""),
                "status_delivered": "true"
            })
        elif event_type == "email.bounced":
            bounce_type = event.get("bounce_type", "unknown")
            lead_slug = event.get("tags", {}).get("lead_slug", "")
            log_to_sheets({
                "lead_slug": lead_slug,
                "step": event.get("tags", {}).get("step", ""),
                "status_bounced": "true",
                "reply_classification": bounce_type,
                "notes": f"resend_webhook bounce"
            })
        elif event_type == "email.complained":
            lead_slug = event.get("tags", {}).get("lead_slug", "")
            log_to_sheets({
                "lead_slug": lead_slug,
                "step": event.get("tags", {}).get("step", ""),
                "status_complained": "true",
                "reply_classification": "spam_complaint",
                "notes": f"resend_webhook complaint"
            })
        elif event_type == "email.opened":
            log_to_sheets({
                "lead_slug": event.get("tags", {}).get("lead_slug", ""),
                "status_opened": "true"
            })
        elif event_type == "email.clicked":
            log_to_sheets({
                "lead_slug": event.get("tags", {}).get("lead_slug", ""),
                "status_clicked": "true"
            })
        elif event_type == "email.replied":
            # Resend reply webhook would contain the reply content
            # This depends on Resend Inbound setup
            pass

        return {"statusCode": 200, "body": json.dumps({"status": "OK"})}
    except Exception as e:
        print(f"Error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def main(request):
    return handler(request)