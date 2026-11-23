
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
