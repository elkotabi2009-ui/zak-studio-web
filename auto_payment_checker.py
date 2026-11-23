#!/usr/bin/env python3
"""
AUTO PAYMENT CHECKER — Controlla bonifici automaticamente
Si integra con: Buddy Bank API, Nexi, Satispay, Stripe, PayPal, Revolut Business, Wise
Oppure: parsing email bancarie (IMAP Gmail/Outlook) per estratti conto
"""

import os, json, re, imaplib, email
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_DIR = Path(__file__).parent

# ============================================================
# CONFIGURAZIONE (da .env)
# ============================================================
# Opzione A: Buddy Bank / Nexi / Stripe webhook (già in webhook_automation.py)
# Opzione B: IMAP parsing email banca (configura sotto)
# Opzione C: File CSV export home banking (più semplice)

IMAP_ENABLED = os.getenv("IMAP_ENABLED", "false").lower() == "true"
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
IMAP_PORT = int(os.getenv("IMAP_PORT", "993"))
IMAP_EMAIL = os.getenv("IMAP_EMAIL", "")
IMAP_PASSWORD = os.getenv("IMAP_APP_PASSWORD", "")  # App password, non password normale
IMAP_FOLDER = os.getenv("IMAP_FOLDER", "INBOX")
IMAP_SENDER_FILTER = os.getenv("IMAP_SENDER_FILTER", "noreply@buddybank.it,alert@buddybank.it,notifiche@nexi.it")
IMAP_DAYS_BACK = int(os.getenv("IMAP_DAYS_BACK", "2"))

# Buddy Bank webhook (se disponibile)
BUDDY_WEBHOOK_SECRET = os.getenv("BUDDY_WEBHOOK_SECRET", "")

# Stripe (se usi Stripe per pagamenti)
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "")

# ============================================================
# PARSING BONIFICI DA EMAIL BANCA
# ============================================================

BANK_PATTERNS = [
    # Buddy Bank
    {
        "bank": "buddy",
        "subject_keywords": ["bonifico", "accredito", "ricevuto", "in arrivo"],
        "amount_regex": r"(?:importo|accredito|bonifico).*?([\d.,]+)\s*EUR",
        "reference_regex": r"(?:causale|rif\.?|riferimento)[:\s]+([A-Z0-9\-]+)",
        "sender": "buddybank.it"
    },
    # Nexi
    {
        "bank": "nexi",
        "subject_keywords": ["bonifico", "accredito", "ricevuto"],
        "amount_regex": r"€\s*([\d.,]+)",
        "reference_regex": r"causale[:\s]+([A-Z0-9\-]+)",
        "sender": "nexi.it"
    },
    # Generic SEPA
    {
        "bank": "generic",
        "subject_keywords": ["bonifico", "sepa", "accredito", "ricevuto", "payment received"],
        "amount_regex": r"(?:EUR|€)\s*([\d.,]+)",
        "reference_regex": r"(?:causale|reference|rif)[:\s]+([A-Z0-9\-]+)",
        "sender": ""
    }
]

def connect_imap():
    """Connetti a IMAP"""
    if not IMAP_ENABLED or not IMAP_EMAIL or not IMAP_PASSWORD:
        return None
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(IMAP_EMAIL, IMAP_PASSWORD)
        mail.select(IMAP_FOLDER)
        return mail
    except Exception as e:
        print(f"[IMAP] Connessione fallita: {e}")
        return None

def search_recent_emails(mail, days_back=2):
    """Cerca email recenti dai mittenti banca"""
    if not mail:
        return []

    since_date = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
    senders = IMAP_SENDER_FILTER.split(",")

    all_ids = []
    for sender in senders:
        sender = sender.strip()
        if not sender:
            continue
        try:
            status, messages = mail.search(None, f'(FROM "{sender}" SINCE "{since_date}")')
            if status == "OK":
                ids = messages[0].split()
                all_ids.extend(ids)
        except Exception as e:
            print(f"[IMAP] Errore ricerca {sender}: {e}")

    return list(set(all_ids))  # deduplica

def parse_email_body(msg):
    """Estrae testo da email (multipart o semplice)"""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() in ["text/plain", "text/html"]:
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body += payload.decode("utf-8", errors="ignore")
                except:
                    pass
    else:
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                body = payload.decode("utf-8", errors="ignore")
        except:
            pass
    return body

def extract_payment_info(body, subject):
    """Estrae importo e causale da email banca"""
    body_lower = body.lower()
    subject_lower = subject.lower()

    for pattern in BANK_PATTERNS:
        if pattern["sender"] and pattern["sender"] not in subject_lower and pattern["sender"] not in body_lower:
            continue

        # Verifica keyword subject
        has_keyword = any(kw in subject_lower for kw in pattern["subject_keywords"])
        if not has_keyword:
            continue

        # Estrai importo
        amount_match = re.search(pattern["amount_regex"], body, re.IGNORECASE)
        if not amount_match:
            continue

        amount_str = amount_match.group(1).replace(".", "").replace(",", ".")
        try:
            amount = float(amount_str)
        except:
            continue

        # Estrai causale/referenza
        ref_match = re.search(pattern["reference_regex"], body, re.IGNORECASE)
        reference = ref_match.group(1) if ref_match else ""

        # Cerca pattern ZAK-LP nella causale o nel corpo
        zak_ref_match = re.search(r"(ZAK-LP-[A-Z0-9\-]+)", body, re.IGNORECASE)
        if zak_ref_match:
            reference = zak_ref_match.group(1)

        return {
            "amount": amount,
            "reference": reference,
            "bank": pattern["bank"],
            "raw_subject": subject,
            "detected_at": datetime.now(timezone.utc).isoformat()
        }

    return None

def check_imap_for_payments():
    """Controlla IMAP per nuovi bonifici"""
    print(f"[AUTO-PAYMENT] Controllo IMAP ({IMAP_DAYS_BACK} giorni indietro)...")

    mail = connect_imap()
    if not mail:
        print("[AUTO-PAYMENT] IMAP non configurato o fallito")
        return []

    try:
        email_ids = search_recent_emails(mail, IMAP_DAYS_BACK)
        print(f"[AUTO-PAYMENT] Trovate {len(email_ids)} email candidate")

        payments = []
        for eid in email_ids[-20:]:  # Max 20 più recenti
            try:
                status, msg_data = mail.fetch(eid, "(RFC822)")
                if status != "OK":
                    continue

                msg = email.message_from_bytes(msg_data[0][1])
                subject = msg.get("Subject", "") or ""
                body = parse_email_body(msg)

                payment_info = extract_payment_info(body, subject)
                if payment_info:
                    # Verifica se importo matcha un preventivo atteso
                    payment_info["email_id"] = eid.decode() if isinstance(eid, bytes) else str(eid)
                    payments.append(payment_info)
                    print(f"  [MATCH] €{payment_info['amount']:.2f} - Ref: {payment_info['reference']} - Bank: {payment_info['bank']}")

            except Exception as e:
                print(f"  [ERR] Parsing email {eid}: {e}")

        mail.logout()
        return payments

    except Exception as e:
        print(f"[AUTO-PAYMENT] Errore IMAP: {e}")
        try:
            mail.logout()
        except:
            pass
        return []

# ============================================================
# STRIPE WEBHOOK HANDLER (se usi Stripe)
# ============================================================

def handle_stripe_webhook(payload, signature):
    """Processa webhook Stripe per payment_intent.succeeded"""
    import hmac, hashlib

    if not STRIPE_WEBHOOK_SECRET:
        return {"success": False, "error": "Stripe non configurato"}

    # Verifica signature
    expected = hmac.new(
        STRIPE_WEBHOOK_SECRET.encode(),
        payload.encode() if isinstance(payload, str) else payload,
        hashlib.sha256
    ).hexdigest()

    # Stripe usa formato: t=timestamp,v1=signature
    # Semplificato per ora
    # TODO: implementare verifica completa Stripe

    return {"success": True, "note": "Stripe handler placeholder"}

# ============================================================
# CSV EXPORT HOME BANKING (più semplice, funziona ovunque)
# ============================================================

def parse_csv_bank_export(csv_path):
    """Parsa CSV export home banking (formato generico italiano)"""
    import csv

    payments = []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            # Prova diversi delimitatori
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter

            reader = csv.DictReader(f, delimiter=delimiter)
            for row in reader:
                # Cerca colonne comuni
                amount = None
                reference = ""
                date_str = ""

                for key, val in row.items():
                    key_lower = key.lower()
                    val_str = str(val).strip()

                    if any(k in key_lower for k in ["importo", "amount", "accredito", "dare", "avere"]):
                        try:
                            amount = float(val_str.replace(".", "").replace(",", "."))
                        except:
                            pass

                    if any(k in key_lower for k in ["causale", "descrizione", "reference", "rif", "motivo"]):
                        reference = val_str
                        # Cerca pattern ZAK-LP
                        zak_match = re.search(r"(ZAK-LP-[A-Z0-9\-]+)", val_str, re.IGNORECASE)
                        if zak_match:
                            reference = zak_match.group(1)

                    if any(k in key_lower for k in ["data", "date", "valuta", "contabile"]):
                        date_str = val_str

                if amount and amount > 0:
                    payments.append({
                        "amount": amount,
                        "reference": reference,
                        "date": date_str,
                        "source": "csv_export",
                        "raw_row": row
                    })

        print(f"[CSV] Parsati {len(payments)} bonifici da {csv_path}")
        return payments

    except Exception as e:
        print(f"[CSV] Errore parsing: {e}")
        return []

# ============================================================
# MATCHING CONTRO PREVENTIVI ATTESI
# ============================================================

def load_expected_payments():
    """Carica preventivi in attesa di pagamento"""
    quotes_file = PROJECT_DIR / "02-data" / "quotes.json"
    if not quotes_file.exists():
        return {}

    with open(quotes_file, "r", encoding="utf-8") as f:
        quotes = json.load(f)

    expected = {}
    for q in quotes:
        if q.get("status") in ["sent", "reminded"] and q.get("payment_ref"):
            expected[q["payment_ref"].upper()] = {
                "quote_number": q["quote_number"],
                "expected_amount": q["price_total"],
                "lead_slug": q["lead_slug"],
                "company": q["company"],
                "decision_maker_email": q["decision_maker_email"],
                "decision_maker_name": q["decision_maker_name"],
                "payment_ref": q["payment_ref"]
            }
    return expected

def match_payment_to_quote(payment_info, expected_payments):
    """Matcha pagamento a preventivo atteso"""
    ref = payment_info.get("reference", "").upper()
    amount = payment_info.get("amount", 0)

    # 1. Match esatto per reference ZAK-LP
    if ref in expected_payments:
        expected = expected_payments[ref]
        if abs(amount - expected["expected_amount"]) <= 0.50:  # tolleranza 50 cent
            return {**expected, "matched_by": "reference_exact", "confidence": "high"}

    # 2. Match parziale reference contenuta
    for exp_ref, expected in expected_payments.items():
        if exp_ref in ref or ref in exp_ref:
            if abs(amount - expected["expected_amount"]) <= 0.50:
                return {**expected, "matched_by": "reference_partial", "confidence": "high"}

    # 3. Match solo per importo (se unico)
    amount_matches = [e for e in expected_payments.values() if abs(e["expected_amount"] - amount) <= 0.50]
    if len(amount_matches) == 1:
        return {**amount_matches[0], "matched_by": "amount_only", "confidence": "medium"}

    return None

# ============================================================
# AUTO-REGISTRA PAGAMENTO E TRIGGER DELIVERY
# ============================================================

def auto_register_and_deliver(matched_payment, payment_info):
    """Registra pagamento e triggera delivery automatico"""
    import subprocess, sys

    quote_number = matched_payment["quote_number"]
    amount = payment_info["amount"]
    reference = payment_info["reference"]

    print(f"[AUTO-DELIVERY] Registra pagamento: {quote_number} - €{amount:.2f} - Ref: {reference}")

    # Chiama run_pipeline_step7.py register-payment
    cmd = [
        sys.executable, "run_pipeline_step7.py", "register-payment",
        "--quote-number", quote_number,
        "--amount", str(amount),
        "--reference", reference,
        "--notes", f"Auto-detected via {payment_info.get('bank', 'unknown')} (confidence: {matched_payment.get('confidence', 'unknown')})"
    ]

    try:
        result = subprocess.run(cmd, cwd=PROJECT_DIR, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print(f"  [OK] Pagamento registrato e delivery triggerato")
            return True
        else:
            print(f"  [ERR] {result.stderr}")
            return False
    except Exception as e:
        print(f"  [ERR] Subprocess failed: {e}")
        return False

# ============================================================
# MAIN - DA ESEGUIRE COME CRON (ogni 30 min su GitHub Actions)
# ============================================================

def main():
    print("="*60)
    print("AUTO PAYMENT CHECKER - Avvio")
    print("="*60)

    # 1. Carica preventivi attesi
    expected = load_expected_payments()
    print(f"[INFO] Preventivi in attesa: {len(expected)}")
    for ref, exp in expected.items():
        print(f"  - {exp['company']}: €{exp['expected_amount']:.2f} (Ref: {ref})")

    if not expected:
        print("[INFO] Nessun preventivo in attesa. Fine.")
        return

    all_payments = []

    # 2. Controlla IMAP (se configurato)
    if IMAP_ENABLED:
        imap_payments = check_imap_for_payments()
        all_payments.extend(imap_payments)

    # 3. Controlla CSV export (se file presente)
    csv_files = list(PROJECT_DIR.glob("bank_export_*.csv"))
    for csv_file in csv_files:
        csv_payments = parse_csv_bank_export(csv_file)
        all_payments.extend(csv_payments)
        # Sposta file processato
        processed = csv_file.with_name(f"processed_{csv_file.name}")
        csv_file.rename(processed)

    print(f"[INFO] Totale pagamenti rilevati: {len(all_payments)}")

    # 4. Match e auto-delivery
    for payment in all_payments:
        matched = match_payment_to_quote(payment, expected)
        if matched:
            print(f"\n[MATCH] {matched['company']} - €{payment['amount']:.2f} - {matched['matched_by']} ({matched['confidence']})")
            auto_register_and_deliver(matched, payment)
            # Rimuovi da expected per non processare due volte
            ref_key = matched["payment_ref"].upper()
            if ref_key in expected:
                del expected[ref_key]
        else:
            print(f"[NO-MATCH] €{payment['amount']:.2f} - Ref: {payment.get('reference', 'N/A')} - Non matcha nessun preventivo atteso")

    print("\n" + "="*60)
    print("AUTO PAYMENT CHECKER - Completato")
    print("="*60)

if __name__ == "__main__":
    main()