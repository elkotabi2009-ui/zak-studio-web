---
name: email-dispatcher
version: 1.0.0
description: Invia email cold outreach via AgentMail/Resend API con rate limiting, tracking, webhook handling (bounce/complaint/reply), suppression list sync, Google Sheets logging, reply classification automatica.
author: ZAK Studio Web
tags: [email-sending, automation, agentmail, resend, tracking, compliance]
tools:
  - read
  - write
  - edit
  - bash
  - mcp__agentmail__send
  - mcp__agentmail__inbox
  - mcp__agentmail__webhooks
  - mcp__sheets__append
  - mcp__sheets__read
  - python
---

# email-dispatcher — Skill per Invio & Tracking Cold Email Automatizzato

## Obiettivo
Prende `outbox/batch_YYYYMMDD.json` (da `copywriter-b2b`) e:
1. **Invia** email via AgentMail/Resend API con rate limiting (max 25/gg, pause casuali 2-8 min)
2. **Traccia**: delivery, open, click, bounce, complaint, reply
3. **Sync** suppression list real-time (locale + ESP + Google Sheets)
4. **Logga** tutto su Google Sheets (tracking sheet per lead)
5. **Classifica** reply automatiche → aggiorna stato lead + trigger followup-manager
6. **Rispetta** limiti legali: unsubscribe one-click, footer legale, volume max, warmup schedule

## Quando usarla
- **Daily cron** (ogni mattina 8:00): invia email del giorno per step 1-6
- **Webhook handler** (real-time): bounce, complaint, reply, delivery events
- **Weekly**: report metriche + pivot analysis

---

## Architettura Componenti

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  outbox/        │────▶│  email-dispatcher │────▶│  AgentMail/     │
│  batch_*.json   │     │  (sender daemon)  │     │  Resend API     │
└─────────────────┘     └────────┬─────────┘     └────────┬────────┘
                                 │                       │
                    ┌────────────┼────────────┐          │
                    ▼            ▼            ▼          ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
             │Suppression│ │  Google  │ │  Reply   │ │  Webhook │
             │  List    │ │  Sheets  │ │Classifier│ │ Handler  │
             └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Configurazione (`config/dispatcher.yaml`)

```yaml
# 08-claude-code/custom-skills/email-dispatcher/config/dispatcher.yaml
sender:
  from_email: "mario.rossi@outreach.zakstudio.com"
  from_name: "Mario Rossi — ZAK Studio Web"
  reply_to: "mario.rossi@outreach.zakstudio.com"
  
esp:
  provider: "agentmail"  # o "resend"
  agentmail:
    api_key_env: "AGENTMAIL_API_KEY"
    inbox_id: "outreach-zakstudio"
  resend:
    api_key_env: "RESEND_API_KEY"
    domain: "outreach.zakstudio.com"

rate_limits:
  max_per_day: 25
  min_interval_minutes: 2
  max_interval_minutes: 8
  warmup_schedule:
    week_1: 10
    week_2: 15
    week_3: 20
    week_4+: 25

tracking:
  open_tracking: false      # GDPR: tracking pixel = legittimo interesse, ma disabilitato per sicurezza
  click_tracking: true      # Link rewriting per CTA tracking
  utm_params:
    source: "cold_email"
    medium: "email"
    campaign: "zak_web_outreach_2026"

suppression:
  local_file: "02-data/suppression-list.csv"
  esp_sync: true
  sheets_sync: true
  sheets_id: "1AbCdEfGhIjKlMnOpQrStUvWxYz"  # Google Sheet ID
  sheets_tab: "Suppression"

google_sheets:
  credentials_env: "GOOGLE_SHEETS_CREDENTIALS"
  tracking_sheet_id: "1AbCdEfGhIjKlMnOpQrStUvWxYz"
  tracking_tab: "Tracking"
  columns:
    - timestamp
    - lead_slug
    - company
    - step
    - subject
    - message_id
    - status_sent
    - status_delivered
    - status_opened
    - status_clicked
    - status_replied
    - status_bounced
    - status_complained
    - status_unsubscribed
    - reply_classification
    - notes

reply_classification:
  keywords:
    interested: ["interessato", "call", "incontro", "parliamo", "disponibile", "come funziona", "costo", "prezzo", "demo", "vediamo"]
    not_interested: ["non interessa", "non serve", "già sito", "fatto interno", "no grazie", "rimuovimi", "cancellami"]
    referral: ["inoltro", "collega", "persona giusta", "responsabile", "passo al", "contattate"]
    unsubscribe: ["disiscrivi", "rimuovi", "cancella", "unsubscribe", "opt out", "non voglio"]
  default: "unknown"
  webhook_url: "https://api.zakstudio.com/webhooks/email/reply"

legal:
  unsubscribe_base_url: "https://unsubscribe.zakstudio.com/"
  footer_template: "01-config/legal-compliance.md"
  max_per_domain_per_day: 50  # Safety cap
```

---

## Invio Email (Sender Daemon)

### Algoritmo Invio Giornaliero

```python
# sender_daemon.py
import json, time, random, subprocess
from datetime import datetime, timedelta
from pathlib import Path

def send_daily_batch(batch_date=None):
    batch_date = batch_date or datetime.now().date()
    batch_file = Path(f"outbox/batch_{batch_date.strftime('%Y%m%d')}.json")
    
    if not batch_file.exists():
        print(f"❌ Batch file not found: {batch_file}")
        return
    
    batch = json.loads(batch_file.read_text())
    sent_today = 0
    max_today = get_warmup_limit(batch_date)  # Da config
    
    # Filtra email da inviare oggi (step il cui send_day == oggi rispetto a lead created)
    emails_to_send = filter_emails_for_today(batch['emails'], batch_date)
    
    # Ordina per priorità (Tier A prima)
    emails_to_send.sort(key=lambda e: 0 if e['priority'] == 'high' else 1)
    
    for email_spec in emails_to_send[:max_today]:
        if sent_today >= max_today:
            print(f"⏸️ Daily limit reached ({max_today})")
            break
        
        email_file = Path(email_spec['file'])
        if not email_file.exists():
            print(f"⚠️ Email file missing: {email_file}")
            continue
        
        email_data = json.loads(email_file.read_text())
        
        # Pre-send checks
        if not pre_send_checks(email_data):
            continue
        
        # Invia
        result = send_email(email_data)
        
        if result['success']:
            sent_today += 1
            log_sent(email_data, result)
            print(f"✅ Sent to {email_data['lead_slug']} step {email_data['step']} (message_id: {result['message_id']})")
        else:
            print(f"❌ Failed to send to {email_data['lead_slug']}: {result['error']}")
            log_failed(email_data, result)
        
        # Random delay 2-8 min
        delay = random.uniform(120, 480)
        print(f"⏳ Waiting {delay:.0f}s...")
        time.sleep(delay)
    
    print(f"📊 Daily summary: {sent_today}/{max_today} sent")

def pre_send_checks(email_data):
    """Controlli obbligatori pre-invio"""
    checks = {
        "suppression_list": check_suppression(email_data['to_email']),
        "domain_limit": check_domain_daily_limit(email_data['to_domain']),
        "unsubscribe_hash": validate_unsubscribe_hash(email_data),
        "legal_footer": validate_legal_footer(email_data),
        "analyzer_score": email_data.get('analyzer_score', 0) >= 70
    }
    
    if not all(checks.values()):
        failed = [k for k, v in checks.items() if not v]
        print(f"🚫 Pre-send checks failed: {failed}")
        return False
    return True

def send_email(email_data):
    """Invia via AgentMail o Resend"""
    provider = config['esp']['provider']
    
    if provider == 'agentmail':
        return send_via_agentmail(email_data)
    elif provider == 'resend':
        return send_via_resend(email_data)
    else:
        return {'success': False, 'error': f'Unknown provider: {provider}'}
```

### AgentMail Send (Consigliato - gestisce inbox/reply nativamente)

```python
def send_via_agentmail(email_data):
    import httpx
    
    api_key = os.environ['AGENTMAIL_API_KEY']
    inbox_id = config['esp']['agentmail']['inbox_id']
    
    payload = {
        "from": f"{config['sender']['from_name']} <{config['sender']['from_email']}>",
        "to": [email_data['to_email']],
        "subject": email_data['subject_selected'],
        "text": email_data['body'],
        "headers": {
            "List-Unsubscribe": f"<{email_data['unsubscribe_url']}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "X-Entity-Ref-ID": email_data['lead_slug'],
            "X-Step": str(email_data['step'])
        },
        "tracking": {
            "clicks": config['tracking']['click_tracking'],
            "opens": config['tracking']['open_tracking']
        }
    }
    
    response = httpx.post(
        f"https://api.agentmail.to/v0/inboxes/{inbox_id}/messages",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload,
        timeout=30
    )
    
    if response.status_code == 201:
        data = response.json()
        return {
            'success': True,
            'message_id': data['message_id'],
            'provider': 'agentmail'
        }
    else:
        return {
            'success': False,
            'error': f"AgentMail {response.status_code}: {response.text}",
            'provider': 'agentmail'
        }
```

### Resend Send (Alternativa)

```python
def send_via_resend(email_data):
    import httpx
    
    api_key = os.environ['RESEND_API_KEY']
    
    payload = {
        "from": f"{config['sender']['from_name']} <{config['sender']['from_email']}>",
        "to": [email_data['to_email']],
        "subject": email_data['subject_selected'],
        "text": email_data['body'],
        "headers": {
            "List-Unsubscribe": f"<{email_data['unsubscribe_url']}>",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        },
        "tags": [
            {"name": "lead_slug", "value": email_data['lead_slug']},
            {"name": "step", "value": str(email_data['step'])}
        ]
    }
    
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload,
        timeout=30
    )
    
    if response.status_code == 200:
        data = response.json()
        return {
            'success': True,
            'message_id': data['id'],
            'provider': 'resend'
        }
    else:
        return {
            'success': False,
            'error': f"Resend {response.status_code}: {response.text}",
            'provider': 'resend'
        }
```

---

## Webhook Handler (Real-time Events)

### Endpoint Unico (es. Cloudflare Workers / Vercel / FastAPI)

```python
# webhook_handler.py (FastAPI example)
from fastapi import FastAPI, Request, Header, HTTPException
import hmac, hashlib, json, os

app = FastAPI()

AGENTMAIL_WEBHOOK_SECRET = os.environ['AGENTMAIL_WEBHOOK_SECRET']
RESEND_WEBHOOK_SECRET = os.environ['RESEND_WEBHOOK_SECRET']

@app.post("/webhooks/email/agentmail")
async def agentmail_webhook(request: Request, x_agentmail_signature: str = Header(None)):
    body = await request.body()
    verify_agentmail_signature(body, x_agentmail_signature)
    event = json.loads(body)
    process_event(event, 'agentmail')
    return {"status": "ok"}

@app.post("/webhooks/email/resend")
async def resend_webhook(request: Request, x_resend_signature: str = Header(None)):
    body = await request.body()
    verify_resend_signature(body, x_resend_signature)
    event = json.loads(body)
    process_event(event, 'resend')
    return {"status": "ok"}

def process_event(event, provider):
    event_type = event['type']  # delivered, bounced, complained, opened, clicked, replied
    
    if event_type == 'delivered':
        update_tracking(event, 'delivered')
    elif event_type == 'bounced':
        handle_bounce(event)
    elif event_type == 'complained':
        handle_complaint(event)
    elif event_type == 'opened':
        update_tracking(event, 'opened')
    elif event_type == 'clicked':
        update_tracking(event, 'clicked')
    elif event_type == 'replied':
        handle_reply(event)

def handle_bounce(event):
    email = event['email']
    bounce_type = event.get('bounce_type', 'unknown')  # hard, soft, block
    
    # Hard bounce → suppression immediata
    if bounce_type == 'hard':
        add_to_suppression(email, 'hard_bounce', f"{provider}_webhook")
        pause_lead_sequence(email, reason='hard_bounce')
    
    update_tracking(event, 'bounced', bounce_type)

def handle_complaint(event):
    email = event['email']
    # Spam complaint → suppression immediata + alert
    add_to_suppression(email, 'spam_complaint', f"{provider}_webhook")
    pause_lead_sequence(email, reason='spam_complaint')
    alert_team(f"⚠️ SPAM COMPLAINT: {email} - Review list/offer immediately!")
    
    update_tracking(event, 'complained')

def handle_reply(event):
    email = event['from_email']
    subject = event['subject']
    body_text = event.get('text') or event.get('html', '')
    
    # Classificazione automatica
    classification = classify_reply(subject, body_text)
    
    # Aggiorna tracking
    update_tracking(event, 'replied', classification=classification)
    
    # Azioni per classificazione
    if classification == 'interested':
        pause_lead_sequence(email, reason='interested_reply')
        notify_sales(f"🎯 INTERESTED REPLY from {email}: {subject}\n\n{body_text[:500]}")
        create_crm_task(email, 'interested')
    elif classification == 'not_interested':
        pause_lead_sequence(email, reason='not_interested')
        log_lost_reason(email, 'not_interested')
    elif classification == 'referral':
        pause_lead_sequence(email, reason='referral')
        notify_sales(f"🔀 REFERRAL from {email}: {subject}\n\n{body_text[:500]}")
    elif classification == 'unsubscribe':
        add_to_suppression(email, 'unsubscribe', 'reply')
        pause_lead_sequence(email, reason='unsubscribe_reply')
```

---

## Reply Classification (Keyword-based, estensibile a LLM)

```python
def classify_reply(subject, body):
    text = f"{subject} {body}".lower()
    
    for category, keywords in CLASSIFICATION_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return category
    
    # Heuristiche aggiuntive
    if len(text) > 200:  # Risposta lunga = probabile interested
        return 'interested'
    if any(w in text for w in ['?', 'come', 'quanto', 'quando', 'dove']):
        return 'interested'
    
    return 'unknown'
```

---

## Google Sheets Logging (Tracking Sheet)

```python
def log_to_sheets(row_data):
    """Append row to tracking sheet"""
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
    
    creds = Credentials.from_service_account_info(
        json.loads(os.environ['GOOGLE_SHEETS_CREDENTIALS']),
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    service = build('sheets', 'v4', credentials=creds)
    
    sheet_id = config['google_sheets']['tracking_sheet_id']
    tab = config['google_sheets']['tracking_tab']
    
    values = [[
        row_data.get('timestamp', datetime.utcnow().isoformat()),
        row_data['lead_slug'],
        row_data['company'],
        row_data['step'],
        row_data['subject'],
        row_data.get('message_id', ''),
        row_data.get('status_sent', ''),
        row_data.get('status_delivered', ''),
        row_data.get('status_opened', ''),
        row_data.get('status_clicked', ''),
        row_data.get('status_replied', ''),
        row_data.get('status_bounced', ''),
        row_data.get('status_complained', ''),
        row_data.get('status_unsubscribed', ''),
        row_data.get('reply_classification', ''),
        row_data.get('notes', '')
    ]]
    
    service.spreadsheets().values().append(
        spreadsheetId=sheet_id,
        range=f"{tab}!A:Z",
        valueInputOption='RAW',
        body={'values': values}
    ).execute()
```

---

## Suppression List Management

```python
def add_to_suppression(email, reason, source):
    """Aggiunge a suppression list locale + ESP + Sheets"""
    email = email.lower().strip()
    
    # 1. Locale CSV
    with open(config['suppression']['local_file'], 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([email, reason, datetime.utcnow().isoformat(), source, ''])
    
    # 2. ESP (AgentMail/Resend suppression list API)
    if config['suppression']['esp_sync']:
        sync_suppression_to_esp(email)
    
    # 3. Google Sheets
    if config['suppression']['sheets_sync']:
        log_suppression_to_sheets(email, reason, source)

def check_suppression(email):
    """Controlla se email in suppression list"""
    email = email.lower().strip()
    suppressed = set()
    
    # Carica da CSV (cache in memoria per performance)
    if not hasattr(check_suppression, '_cache'):
        with open(config['suppression']['local_file']) as f:
            reader = csv.DictReader(f)
            for row in reader:
                suppressed.add(row['email'].lower())
        check_suppression._cache = suppressed
    
    return email not in check_suppression._cache
```

---

## Comandi CLI

```bash
# Invio batch giornaliero (cron 08:00)
python -m email_dispatcher --send-daily --date 2026-11-21

# Invio singolo lead (step specifico)
python -m email_dispatcher --send-single --lead outbox/esempromeccanica-srl/email_1.json

# Processa webhook events manualmente (da file JSON)
python -m email_dispatcher --process-webhooks --file webhook_events_20261121.json

# Report metriche settimanale
python -m email_dispatcher --weekly-report --start 2026-11-15 --end 2026-11-21 --output reports/weekly_20261121.md

# Sync suppression list ESP → locale
python -m email_dispatcher --sync-suppression --direction esp_to_local

# Pausa sequenza per lead (motivo: interested/not_interested/referral/unsubscribe/bounce)
python -m email_dispatcher --pause-lead --lead esempromeccanica-srl --reason interested_reply

# Riprendi sequenza lead (es. dopo errore classificazione)
python -m email_dispatcher --resume-lead --lead esempromeccanica-srl --from-step 3
```

---

## Weekly Report Template (`reports/weekly_YYYYMMDD.md`)

```markdown
# Weekly Email Report — Week of 2026-11-15 to 2026-11-21

## Volume
| Metrica | Valore |
|---------|--------|
| Email inviate | 142 |
| Lead contattati (unici) | 89 |
| Step 1 (first touch) | 35 |
| Step 2-5 (follow-up) | 82 |
| Step 6 (breakup) | 25 |

## Delivery & Engagement
| Metrica | Count | Rate | Target | Status |
|---------|-------|------|--------|--------|
| Delivered | 138 | 97.2% | > 95% | ✅ |
| Opened | 62 | 44.9% | ≥ 40% | ✅ |
| Clicked | 18 | 13.0% | ≥ 10% | ✅ |
| Replied | 11 | 8.0% | ≥ 8% | ✅ |
| Bounced | 4 | 2.8% | < 2% | ⚠️ |
| Complained | 0 | 0.0% | < 0.1% | ✅ |
| Unsubscribed | 2 | 1.4% | < 1% | ⚠️ |

## Reply Classification
| Categoria | Count | Azione |
|-----------|-------|--------|
| Interested | 5 | Sales handoff → call booked 3 |
| Not Interested | 3 | Logged lost reason |
| Referral | 2 | Contattato referito |
| Unsubscribe | 1 | Suppression added |

## Top Performing
| Elemento | Metrica |
|----------|---------|
| Best Subject (Step 1) | "vostro sito 2019" — 52% open |
| Best Angle (Step 3) | Industry insight — 12% reply |
| Best CTA | "Call 15 min giovedì" — 8% meeting booked |

## Azioni Prossima Settimana
- [ ] Re-verify 50 bounced emails con ZeroBounce
- [ ] Test nuovi subject line per Step 4 (open rate 31%)
- [ ] Aumenta personalizzazione hook per settore chimica
- [ ] Review unsubscribe rate > 1% — audit lista Tier C
```

---

## Dipendenze

| Libreria | Versione | Uso |
|----------|----------|-----|
| `httpx` | ≥0.25 | HTTP client async per AgentMail/Resend |
| `fastapi` | ≥0.109 | Webhook server (opzionale, per Vercel/CF Workers) |
| `google-api-python-client` | ≥2.100 | Google Sheets API |
| `google-auth` | ≥2.28 | Service account auth |
| `pyyaml` | ≥6.0 | Config YAML |
| `agentmail-python` | ≥0.1 | SDK ufficiale (se disponibile) |

---

## Testing

```bash
# Test invio dry-run (no API call)
python -m email_dispatcher --send-daily --dry-run --date 2026-11-21

# Test webhook handling con payload sample
python -m email_dispatcher --test-webhook --provider agentmail --event delivered

# Test classificazione reply
python -m pytest tests/email_dispatcher/test_classification.py -v

# Casistiche:
# 1. Reply "Interessato, quando possiamo fare call?" → interested
# 2. Reply "Non ci serve, abbiamo sito interno" → not_interested
# 3. Reply "Inoltro al mio responsabile marketing" → referral
# 4. Reply "Cancellatemi dalla lista" → unsubscribe
# 5. Hard bounce webhook → suppression + pause sequence
# 6. Spam complaint webhook → suppression + alert + pause
# 7. Rate limit rispettato (max 25/gg, delay 2-8 min)
# 8. Suppression list sync funziona bidirezionale
```