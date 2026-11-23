#!/usr/bin/env python3
"""
STEP 7: Quote, Payment & Delivery Automation
- Sends formal quote email with IBAN when prospect shows interest
- Tracks payment confirmation (manual or webhook)
- Delivers landing page + usage instructions upon payment
- All communications in ultra-formal Italian business register
"""
import os, json, csv, hmac, hashlib
from datetime import datetime, timezone, timedelta
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
UNSUB_SECRET = os.getenv("UNSUB_SECRET", "zak-studio-web-unsubscribe-secret-2026-change-in-production")

# ============================================================
# USER CONFIGURATION - DA PERSONALIZZARE (tutto da .env)
# ============================================================
# IBAN per ricevere pagamenti
USER_IBAN = os.getenv("USER_IBAN", "IT22Q0200832974001860517875")
BANK_NAME = os.getenv("BANK_NAME", "Buddy Bank")
ACCOUNT_HOLDER = os.getenv("ACCOUNT_HOLDER", "Zakariae El Kotabi")
COMPANY_LEGAL_NAME = os.getenv("COMPANY_LEGAL_NAME", "Zakariae El Kotabi")
COMPANY_ADDRESS = os.getenv("COMPANY_ADDRESS", "Via Roma 123, 25121 Brescia")
COMPANY_VAT = os.getenv("COMPANY_VAT", "01234567890")
COMPANY_REA = os.getenv("COMPANY_REA", "BS-123456")
PRIVACY_URL = os.getenv("PRIVACY_URL", "https://zakstudio.com/privacy")

# Pricing
LANDING_PAGE_PRICE_EUR = int(os.getenv("LANDING_PAGE_PRICE_EUR", "2500"))
VAT_RATE = float(os.getenv("VAT_RATE", "0.22"))
TOTAL_PRICE_EUR = round(LANDING_PAGE_PRICE_EUR * (1 + VAT_RATE), 2)

# Payment terms
PAYMENT_TERMS_DAYS = int(os.getenv("PAYMENT_TERMS_DAYS", "15"))
PAYMENT_REFERENCE_PREFIX = "ZAK-LP"

# ============================================================
# EMAIL TEMPLATES - ULTRA FORMAL ITALIAN BUSINESS
# ============================================================

QUOTE_EMAIL_TEMPLATE = """Oggetto: La vostra landing page è pronta — {company_name}

Ciao {decision_maker_name},

la bozza della landing page per {company_name} è online qui:
🔗 https://{slug}.zakstudio.com

Guarda con calma. È il "biglietto da visita digitale" che ti dicevo:
- Una pagina sola, velocissima (95+ PageSpeed), zero manutenzione
- Chi siete, cosa fate, certificazioni, export, referenze, contatti
- Form che manda email dirette a info@{domain}
- La usi come link diretto, iframe nel sito, QR su biglietti, o CNAME sul vostro dominio

---

Se ti piace e la vuoi attivare per la vostra azienda:

💰 **€ 2.500 + IVA = € 3.050 totali**
🏦 **IBAN: IT22Q0200832974001860517875** (Buddy Bank — Zakariae El Kotabi)
📝 **Causale: {payment_ref} - {company_name}**

Fatto il bonifico? Rispondi a questa email con la contabile (o aspetta che la vedo io) e la rendo ufficiale: tolgo l'etichetta "bozza", attivo tutto, ti mando istruzioni complete per usarla.

Niente fatture, niente SRL, niente burocrazia. Funziona così: ti piace → paghi → è tua.

Validità 30 giorni. Se non ti convince, nessun problema — cancello la bozza e buon lavoro.

Ciao,

Zakariae El Kotabi
ZAK Studio Web
zakariae@outreach.zakstudio.com

---
Se non vuoi più ricevere queste email: https://unsubscribe.zakstudio.com/?h={unsub_hash}
"""

DELIVERY_EMAIL_TEMPLATE = """Oggetto: Pagamento ricevuto — La vostra landing page è ufficiale 🎉

Ciao {decision_maker_name},

ricevuto il bonifico di € {price_total:,.2f} (rif: {payment_ref}). Grazie!

La landing page per {company_name} è ora **ufficiale e tua**:
🔗 **https://{slug}.zakstudio.com** (etichetta "bozza" rimossa)

---

**COME USARLA (copia-incolla):**

**1. Link diretto** (più semplice)
Condividi ovunque: LinkedIn, email signature, WhatsApp, biglietti da visita
→ https://{slug}.zakstudio.com

**2. Iframe nel vostro sito** (WordPress, Wix, HTML, qualsiasi CMS)
```html
<iframe src="https://{slug}.zakstudio.com" width="100%" height="900" frameborder="0" style="border:none; min-height:900px;"></iframe>
```
- Altezza 900px consigliata (la pagina è lunga, scroll interno)
- Responsive automatico mobile/tablet/desktop

**3. Sottodominio vostro** (es. presentazione.{domain}) — *consigliato per brand*
Chiedi al tuo IT/fornitore hosting di creare un CNAME:
- Nome: `presentazione` (o `landing`, `azienda`, `chi-siamo`)
- Tipo: `CNAME`
- Valore: `{slug}.zakstudio.com`
- TTL: 3600 (o default)
Risultato: `https://presentazione.{domain}` → mostra la landing col VOSTRO URL

**4. QR Code** per materiale cartaceo
Genera gratis su qr-code-generator.com / qrcode.it punta a: https://{slug}.zakstudio.com
Stampa su: biglietti da visita, brochure, schede prodotto, stand fiere, packaging

**5. Form contatti** → arriva a info@{domain}
Funziona via Formspree (zero server da gestire)
Campi: Nome, Azienda, Email, Telefono, Messaggio, Prodotto di interesse
GDPR ok: privacy policy in footer

---

**MANUTENZIONE: ZERO**
- Sito statico: no CMS, no database, no plugin, no aggiornamenti sicurezza
- Modifiche future: scrivimi e faccio preventivo a parte
- Hosting incluso 12 mesi (poi € 50/anno se tieni subdomain zakstudio.com)

---

Tutto qui. La pagina è tua, usala come vuoi.

Per qualsiasi cosa rispondi pure a questa email.

Ciao,

Zakariae El Kotabi
ZAK Studio Web

---
Se non vuoi più ricevere queste email: https://unsubscribe.zakstudio.com/?h={unsub_hash}
"""

PAYMENT_REMINDER_TEMPLATE = """Oggetto: La bozza scade tra {days_left} giorni — {company_name}

Ciao {decision_maker_name},

veloce promemoria: la bozza landing page per {company_name} (https://{slug}.zakstudio.com) scade tra {days_left} giorni.

Se ti piaceva e la vuoi: € 3.050 (IVA inclusa)
IBAN: IT22Q0200832974001860517875 (Buddy Bank — Zakariae El Kotabi)
Causale: {payment_ref} - {company_name}

Fatto bonifico? Rispondi qui. Altrimenti scade e cancello la bozza, nessun problema.

Ciao,
Zak
"""

# ============================================================
# STATE MANAGEMENT
# ============================================================

QUOTES_FILE = PROJECT_DIR / "02-data" / "quotes.json"
PAYMENTS_FILE = PROJECT_DIR / "02-data" / "payments.json"
INVOICES_FILE = PROJECT_DIR / "02-data" / "invoices.json"
DELIVERIES_FILE = PROJECT_DIR / "02-data" / "deliveries.json"

def load_json(path: Path, default=None):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default if default is not None else []

def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def generate_quote_number():
    quotes = load_json(QUOTES_FILE, [])
    year = datetime.now().year
    count = len([q for q in quotes if q.get("quote_number", "").startswith(f"ZAK-{year}")]) + 1
    return f"ZAK-{year}-{count:04d}"

def generate_invoice_number():
    invoices = load_json(INVOICES_FILE, [])
    year = datetime.now().year
    count = len([i for i in invoices if i.get("invoice_number", "").startswith(f"FATT-{year}")]) + 1
    return f"FATT-{year}-{count:04d}"

def generate_payment_ref(company_name: str, quote_number: str):
    clean = "".join(c for c in company_name.upper() if c.isalnum())[:10]
    return f"{PAYMENT_REFERENCE_PREFIX}-{clean}-{quote_number.split('-')[-1]}"

def generate_unsubscribe_hash(email, company_slug, context="quote"):
    msg = f"{email}|{company_slug}|{context}|{datetime.now(timezone.utc).date().isoformat()}".encode()
    return hmac.new(UNSUB_SECRET.encode(), msg, hashlib.sha256).hexdigest()[:16]

# ============================================================
# EMAIL SENDING
# ============================================================

def send_via_agentmail(to_email, subject, text):
    headers = {
        "Authorization": f"Bearer {AGENTMAIL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "text": text,
        "headers": {
            "List-Unsubscribe": f"<https://unsubscribe.zakstudio.com/?h=manual>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "Reply-To": REPLY_TO
        },
        "tracking": {"clicks": True, "opens": False}
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
            return {"success": True, "message_id": data.get("message_id") or data.get("id")}
        return {"success": False, "error": f"AgentMail {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_via_resend(to_email, subject, text):
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "text": text,
        "headers": {
            "List-Unsubscribe": f"<https://unsubscribe.zakstudio.com/?h=manual>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "Reply-To": REPLY_TO
        },
        "tags": [{"name": "type", "value": "quote_delivery"}]
    }
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post("https://api.resend.com/emails", headers=headers, json=payload)
        if resp.status_code == 200:
            return {"success": True, "message_id": resp.json()["id"]}
        return {"success": False, "error": f"Resend {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_email(to_email, subject, text):
    """Send email with Resend fallback"""
    if ESP_PROVIDER == "agentmail" and AGENTMAIL_API_KEY and AGENTMAIL_INBOX_ID:
        result = send_via_agentmail(to_email, subject, text)
        if not result.get("success"):
            print(f"  AgentMail failed, falling back to Resend: {result.get('error')}")
            return send_via_resend(to_email, subject, text)
        return result
    elif ESP_PROVIDER == "resend":
        return send_via_resend(to_email, subject, text)
    else:
        return send_via_resend(to_email, subject, text)

# ============================================================
# CORE FUNCTIONS
# ============================================================

def create_and_send_quote(lead: dict, decision_maker_email: str, decision_maker_name: str, decision_maker_title: str):
    """Create quote record and send quote email"""
    quote_number = generate_quote_number()
    payment_ref = generate_payment_ref(lead["company"], quote_number)
    unsub_hash = generate_unsubscribe_hash(decision_maker_email, lead["slug"], "quote")

    price_net = LANDING_PAGE_PRICE_EUR
    price_vat = round(price_net * VAT_RATE, 2)
    price_total = round(price_net + price_vat, 2)

    # Build quote email
    subject = f"Preventivo Landing Page Presentazione Aziendale — {lead['company']}"

    body = QUOTE_EMAIL_TEMPLATE.format(
        company_name=lead["company"],
        decision_maker_name=decision_maker_name,
        decision_maker_title=decision_maker_title,
        sector_lower=lead["sector"].lower(),
        domain=lead["domain"],
        slug=lead["slug"],
        price_net=price_net,
        price_vat=price_vat,
        price_total=price_total,
        vat_rate=int(VAT_RATE * 100),
        iban=USER_IBAN,
        bank_name=BANK_NAME,
        account_holder=ACCOUNT_HOLDER,
        payment_ref=payment_ref,
        quote_number=quote_number,
        SENDER_NAME=SENDER_NAME,
        SENDER_EMAIL=SENDER_EMAIL,
        COMPANY_LEGAL_NAME=COMPANY_LEGAL_NAME,
        COMPANY_ADDRESS=COMPANY_ADDRESS,
        COMPANY_VAT=COMPANY_VAT,
        COMPANY_REA=COMPANY_REA,
        PRIVACY_URL=PRIVACY_URL,
        company_address_placeholder="[Indirizzo da completare per fattura]",
        company_vat_placeholder="[P.IVA da completare per fattura]",
        sdi_code_placeholder="[Codice SDI da completare per fattura]",
        pec_placeholder="[PEC da completare per fattura]",
        unsub_hash=unsub_hash
    )

    # Send
    result = send_email(decision_maker_email, subject, body)

    # Save quote record
    quote_record = {
        "quote_number": quote_number,
        "lead_slug": lead["slug"],
        "company": lead["company"],
        "domain": lead["domain"],
        "decision_maker_email": decision_maker_email,
        "decision_maker_name": decision_maker_name,
        "decision_maker_title": decision_maker_title,
        "price_net": price_net,
        "price_vat": price_vat,
        "price_total": price_total,
        "vat_rate": VAT_RATE,
        "iban": USER_IBAN,
        "payment_ref": payment_ref,
        "status": "sent" if result["success"] else "failed",
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "message_id": result.get("message_id"),
        "expires_at": (datetime.now() + timedelta(days=30)).date().isoformat(),
        "unsub_hash": unsub_hash
    }

    quotes = load_json(QUOTES_FILE, [])
    quotes.append(quote_record)
    save_json(QUOTES_FILE, quotes)

    print(f"  Quote {quote_number} -> {decision_maker_email}: {'[OK] SENT' if result['success'] else '[FAIL] FAILED'}")

    return quote_record, result

def check_payment_and_deliver():
    """Check for confirmed payments and trigger delivery"""
    quotes = load_json(QUOTES_FILE, [])
    payments = load_json(PAYMENTS_FILE, [])
    deliveries = load_json(DELIVERIES_FILE, [])

    # Find quotes with confirmed payment but not yet delivered
    for quote in quotes:
        if quote["status"] not in ["paid", "delivered"]:
            # Check if payment exists for this quote
            payment = next((p for p in payments if p.get("quote_number") == quote["quote_number"] and p.get("status") == "confirmed"), None)

            if payment and quote["status"] != "delivered":
                print(f"\n[PAYMENT] Pagamento confermato per {quote['company']} (Quote: {quote['quote_number']})")
                deliver_landing_page(quote, payment)
                quote["status"] = "delivered"

    save_json(QUOTES_FILE, quotes)

def deliver_landing_page(quote: dict, payment: dict):
    """Send delivery email with landing page URL and instructions"""
    lead_slug = quote["lead_slug"]

    # Find landing page
    landing_dir = PROJECT_DIR / "03-output" / "landings" / lead_slug
    deploy_manifest_path = landing_dir / "deploy.json"

    if not deploy_manifest_path.exists():
        print(f"  [FAIL] Landing page non trovata per {lead_slug}")
        return

    with open(deploy_manifest_path, "r", encoding="utf-8") as f:
        deploy_manifest = json.load(f)

    landing_url = deploy_manifest.get("landing_url", f"https://{lead_slug}.zakstudio.com")

    # Generate invoice
    invoice_number = generate_invoice_number()
    invoice_record = {
        "invoice_number": invoice_number,
        "quote_number": quote["quote_number"],
        "lead_slug": lead_slug,
        "company": quote["company"],
        "amount_net": quote["price_net"],
        "amount_vat": quote["price_vat"],
        "amount_total": quote["price_total"],
        "vat_rate": VAT_RATE,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "payment_received_at": payment.get("received_at"),
        "payment_method": "bank_transfer",
        "payment_reference": payment.get("reference"),
        "status": "issued"
    }

    invoices = load_json(INVOICES_FILE, [])
    invoices.append(invoice_record)
    save_json(INVOICES_FILE, invoices)

    # Build delivery email
    unsub_hash = generate_unsubscribe_hash(quote["decision_maker_email"], lead_slug, "delivery")
    hosting_expiry = (datetime.now() + timedelta(days=365)).strftime("%d/%m/%Y")

    subject = f"Consegna Landing Page {quote['company']} — URL Live e Istruzioni Uso"

    body = DELIVERY_EMAIL_TEMPLATE.format(
        company_name=quote["company"],
        decision_maker_name=quote["decision_maker_name"],
        decision_maker_title=quote["decision_maker_title"],
        domain=quote["domain"],
        slug=lead_slug,
        landing_url=landing_url,
        price_total=quote["price_total"],
        payment_ref=quote["payment_ref"],
        invoice_number=invoice_number,
        hosting_expiry=hosting_expiry,
        SENDER_NAME=SENDER_NAME,
        SENDER_EMAIL=SENDER_EMAIL,
        COMPANY_LEGAL_NAME=COMPANY_LEGAL_NAME,
        COMPANY_ADDRESS=COMPANY_ADDRESS,
        COMPANY_VAT=COMPANY_VAT,
        COMPANY_REA=COMPANY_REA,
        PRIVACY_URL=PRIVACY_URL,
        unsub_hash=unsub_hash
    )

    result = send_email(quote["decision_maker_email"], subject, body)

    # Save delivery record
    delivery_record = {
        "lead_slug": lead_slug,
        "company": quote["company"],
        "quote_number": quote["quote_number"],
        "invoice_number": invoice_number,
        "landing_url": landing_url,
        "delivered_at": datetime.now(timezone.utc).isoformat(),
        "email_sent": result["success"],
        "message_id": result.get("message_id"),
        "unsub_hash": unsub_hash
    }

    deliveries = load_json(DELIVERIES_FILE, [])
    deliveries.append(delivery_record)
    save_json(DELIVERIES_FILE, deliveries)

    print(f"  [DELIVERY] Email sent: {'[OK]' if result['success'] else '[FAIL]'}")
    print(f"  [INVOICE] {invoice_number}")
    print(f"  [URL] Landing URL: {landing_url}")

def register_payment(quote_number: str, amount_eur: float, reference: str, received_at: str = None, notes: str = ""):
    """Manually register a payment (called when you see bonifico in home banking)"""
    quotes = load_json(QUOTES_FILE, [])
    quote = next((q for q in quotes if q["quote_number"] == quote_number), None)

    if not quote:
        print(f"[FAIL] Quote not found: {quote_number}")
        return

    if abs(amount_eur - quote["price_total"]) > 0.01:
        print(f"[WARN] Amount mismatch: expected €{quote['price_total']:.2f}, got €{amount_eur:.2f}")

    payment_record = {
        "quote_number": quote_number,
        "lead_slug": quote["lead_slug"],
        "company": quote["company"],
        "amount_eur": amount_eur,
        "reference": reference,
        "received_at": received_at or datetime.now(timezone.utc).isoformat(),
        "status": "confirmed",
        "notes": notes,
        "verified_by": "manual_home_banking"
    }

    payments = load_json(PAYMENTS_FILE, [])
    payments.append(payment_record)
    save_json(PAYMENTS_FILE, payments)

    quote["status"] = "paid"
    quote["paid_at"] = payment_record["received_at"]
    save_json(QUOTES_FILE, quotes)

    print(f"[OK] Pagamento registrato: {quote['company']} — €{amount_eur:.2f} — Rif: {reference}")

    # Auto-deliver
    deliver_landing_page(quote, payment_record)

def send_payment_reminders():
    """Send reminders for unpaid quotes nearing expiry"""
    quotes = load_json(QUOTES_FILE, [])
    today = datetime.now().date()

    for quote in quotes:
        if quote["status"] in ["sent", "reminded"]:
            expires = datetime.fromisoformat(quote["expires_at"]).date()
            days_left = (expires - today).days

            if days_left in [7, 3, 1]:  # Remind at 7, 3, 1 days
                unsub_hash = generate_unsubscribe_hash(quote["decision_maker_email"], quote["lead_slug"], "reminder")

                subject = f"Promemoria pagamento — Preventivo Landing Page {quote['company']} (scadenza {days_left} giorni)"
                body = PAYMENT_REMINDER_TEMPLATE.format(
                    company_name=quote["company"],
                    decision_maker_name=quote["decision_maker_name"],
                    decision_maker_title=quote["decision_maker_title"],
                    days_left=days_left,
                    quote_number=quote["quote_number"],
                    price_total=quote["price_total"],
                    iban=USER_IBAN,
                    payment_ref=quote["payment_ref"],
                    SENDER_NAME=SENDER_NAME,
                    unsub_hash=unsub_hash
                )

                result = send_email(quote["decision_maker_email"], subject, body)

                if result["success"]:
                    quote["status"] = "reminded"
                    quote["last_reminder_at"] = datetime.now(timezone.utc).isoformat()
                    print(f"  📧 Reminder sent to {quote['company']} ({days_left} days left)")

    save_json(QUOTES_FILE, quotes)

def show_status():
    """Show overview of all quotes/payments/deliveries"""
    quotes = load_json(QUOTES_FILE, [])
    payments = load_json(PAYMENTS_FILE, [])
    deliveries = load_json(DELIVERIES_FILE, [])
    invoices = load_json(INVOICES_FILE, [])

    print("\n" + "="*80)
    print("QUOTE / PAYMENT / DELIVERY STATUS")
    print("="*80)

    for q in quotes:
        status_map = {"sent": "[SENT]", "reminded": "[REMIND]", "paid": "[PAID]", "delivered": "[DELIVERED]", "failed": "[FAIL]", "expired": "[EXPIRED]"}
        status_tag = status_map.get(q["status"], "[UNKNOWN]")
        days_left = (datetime.fromisoformat(q["expires_at"]).date() - datetime.now().date()).days
        print(f"\n{status_tag} {q['quote_number']} | {q['company']} | €{q['price_total']:,.2f} | {q['status'].upper()} | scade tra {days_left}gg")
        print(f"    Lead: {q['lead_slug']} | DM: {q['decision_maker_name']} <{q['decision_maker_email']}>")
        print(f"    Ref pagamento: {q['payment_ref']} | IBAN: {USER_IBAN}")

        # Payment info
        payment = next((p for p in payments if p["quote_number"] == q["quote_number"]), None)
        if payment:
            print(f"    [PAYMENT] €{payment['amount_eur']:,.2f} | Rif: {payment['reference']} | {payment['received_at'][:10]} | {payment['status']}")

        # Delivery info
        delivery = next((d for d in deliveries if d["quote_number"] == q["quote_number"]), None)
        if delivery:
            print(f"    [DELIVERED] {delivery['delivered_at'][:10]} | URL: {delivery['landing_url']}")

        # Invoice
        invoice = next((i for i in invoices if i["quote_number"] == q["quote_number"]), None)
        if invoice:
            print(f"    [INVOICE] {invoice['invoice_number']} | Emessa: {invoice['issued_at'][:10]}")

    print(f"\nTotale: {len(quotes)} preventivi | {len(payments)} pagamenti | {len(deliveries)} consegne | {len(invoices)} fatture")

# ============================================================
# CLI
# ============================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Quote, Payment & Delivery Automation")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create quote
    p_quote = subparsers.add_parser("create-quote", help="Create and send quote for interested lead")
    p_quote.add_argument("--lead-slug", required=True, help="Lead slug")
    p_quote.add_argument("--dm-email", required=True, help="Decision maker email")
    p_quote.add_argument("--dm-name", required=True, help="Decision maker name")
    p_quote.add_argument("--dm-title", default="Titolare", help="Decision maker title")

    # Register payment (manual)
    p_pay = subparsers.add_parser("register-payment", help="Register payment received (manual)")
    p_pay.add_argument("--quote-number", required=True, help="Quote number")
    p_pay.add_argument("--amount", type=float, required=True, help="Amount EUR")
    p_pay.add_argument("--reference", required=True, help="Bank transfer reference")
    p_pay.add_argument("--date", help="Date received (YYYY-MM-DD, default today)")
    p_pay.add_argument("--notes", default="", help="Notes")

    # Check and auto-deliver
    subparsers.add_parser("check-deliver", help="Check for paid quotes and auto-deliver")

    # Send reminders
    subparsers.add_parser("send-reminders", help="Send payment reminders for expiring quotes")

    # Show status
    subparsers.add_parser("status", help="Show all quotes/payments/deliveries status")

    args = parser.parse_args()

    # Load leads for reference
    leads_path = PROJECT_DIR / "02-data" / "leads_enriched.json"
    with open(leads_path, "r", encoding="utf-8") as f:
        leads = {l["slug"]: l for l in json.load(f)}

    if args.command == "create-quote":
        lead = leads.get(args.lead_slug)
        if not lead:
            print(f"❌ Lead not found: {args.lead_slug}")
            return
        print(f"Creating quote for {lead['company']}...")
        create_and_send_quote(lead, args.dm_email, args.dm_name, args.dm_title)

    elif args.command == "register-payment":
        received_at = args.date
        if received_at:
            received_at = f"{received_at}T12:00:00+00:00"
        register_payment(args.quote_number, args.amount, args.reference, received_at, args.notes)

    elif args.command == "check-deliver":
        print("Checking for confirmed payments...")
        check_payment_and_deliver()
        print("Done.")

    elif args.command == "send-reminders":
        print("Sending payment reminders...")
        send_payment_reminders()
        print("Done.")

    elif args.command == "status":
        show_status()

    else:
        parser.print_help()

if __name__ == "__main__":
    main()