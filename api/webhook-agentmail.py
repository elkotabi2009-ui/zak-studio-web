import json
import hmac
import hashlib
import os
from datetime import datetime, timezone

AGENTMAIL_WEBHOOK_SECRET = os.environ.get("AGENTMAIL_WEBHOOK_SECRET")
RESEND_WEBHOOK_SECRET = os.environ.get("RESEND_WEBHOOK_SECRET")
UNSUB_SECRET = os.environ.get("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")
GOOGLE_SHEETS_CREDS = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
TRACKING_SHEET_ID = os.environ.get("TRACKING_SHEET_ID", "1hD75vPwnT0SYpF-2rvZqbDfVu5kpe8onoZcM_Q06BRA")

KEYWORDS = {
    "interested": ["interessato", "call", "incontro", "parliamo", "disponibile", "come funziona", "costo", "prezzo", "demo", "vediamo", "info", "dettagli"],
    "not_interested": ["non interessa", "non serve", "già sito", "fatto interno", "no grazie", "rimuovimi", "cancellami", "non voglio"],
    "referral": ["inoltro", "collega", "persona giusta", "responsabile", "passo al", "contattate", "girato"],
    "unsubscribe": ["disiscrivi", "rimuovi", "cancella", "unsubscribe", "opt out", "non voglio più"]
}

def verify_agentmail_signature(body, signature):
    expected = hmac.new(AGENTMAIL_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
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
        signature = request.headers.get("x-agentmail-signature", "")

        if not verify_agentmail_signature(body.encode(), signature):
            return {"statusCode": 401, "body": json.dumps({"error": "Invalid signature"})}

        event = json.loads(body)
        event_type = event.get("type", event.get("event", "unknown"))

        if event_type in ["delivered", "delivery"]:
            log_to_sheets({
                "lead_slug": event.get("lead_slug", event.get("tags", {}).get("lead_slug", "")),
                "status_delivered": "true"
            })
        elif event_type == "bounced":
            email = event.get("email", "").lower()
            bounce_type = event.get("bounce_type", "unknown")
            lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
            log_to_sheets({
                "lead_slug": lead_slug,
                "step": event.get("step", event.get("tags", {}).get("step", "")),
                "status_bounced": "true",
                "reply_classification": bounce_type,
                "notes": f"agentmail_webhook bounce"
            })
        elif event_type == "complained":
            email = event.get("email", "").lower()
            lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
            log_to_sheets({
                "lead_slug": lead_slug,
                "step": event.get("step", event.get("tags", {}).get("step", "")),
                "status_complained": "true",
                "reply_classification": "spam_complaint",
                "notes": f"agentmail_webhook complaint"
            })
        elif event_type in ["replied", "reply"]:
            from_email = event.get("from_email", "").lower()
            subject = event.get("subject", "")
            body_text = event.get("text") or event.get("html", "")
            lead_slug = event.get("lead_slug", event.get("tags", {}).get("lead_slug", ""))
            step = event.get("step", event.get("tags", {}).get("step", ""))

            classification = classify_reply(subject, body_text)

            log_to_sheets({
                "lead_slug": lead_slug,
                "step": step,
                "status_replied": "true",
                "reply_classification": classification,
                "notes": f"agentmail_webhook reply: {body_text[:200]}"
            })

            if classification == "interested":
                print(f"INTERESTED REPLY from {from_email}: {subject}")
                # Trigger webhook_automation flow here
        elif event_type == "opened":
            log_to_sheets({
                "lead_slug": event.get("lead_slug", event.get("tags", {}).get("lead_slug", "")),
                "status_opened": "true"
            })
        elif event_type == "clicked":
            log_to_sheets({
                "lead_slug": event.get("lead_slug", event.get("tags", {}).get("lead_slug", "")),
                "status_clicked": "true"
            })

        return {"statusCode": 200, "body": json.dumps({"status": "OK"})}
    except Exception as e:
        print(f"Error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

# Vercel entry point
def main(request):
    return handler(request)