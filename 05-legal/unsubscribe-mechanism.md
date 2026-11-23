# Unsubscribe Mechanism — Technical & Legal Spec
**Implementazione one-click unsubscribe per OGNI email cold outreach. Conforme CAN-SPAM, GDPR Art. 21, ePrivacy.**

---

## 1. REQUISITI LEGALI

| Normativa | Requisito | Implementazione |
|-----------|-----------|-----------------|
| **CAN-SPAM Act** | Opt-out mechanism chiaro, funzionante, onorato entro 10 business days | One-click link, automazione ESP, suppression list real-time |
| **GDPR Art. 21** | Diritto opposizione in qualsiasi momento, gratuito, facile | Unsubscribe link in footer ogni email, no login, no motivi richiesti |
| **ePrivacy Directive** | Consenso per marketing elettronico / diritto opposizione | Legittimo interesse B2B + opt-out facile = compliant |
| **DLgs 70/2003** | Informazioni chiare su identità mittente + opt-out | Footer legale completo + unsubscribe link |

---

## 2. ARCHITETTURA TECNICA

### 2.1 Flusso Unsubscribe
```
User clicca "Unsubscribe" in email
    ↓
Landing page /unsubscribe?hash=UNIQUE_HASH (GET)
    ↓
Verifica hash valido → Identifica email + company + campaign
    ↓
Mostra conferma: "Sei sicuro? Riceverai zero email da noi." [Conferma]
    ↓
POST /api/unsubscribe {hash, confirm: true}
    ↓
1. ESP: Add email to suppression list (API)
2. CRM: Update contact status = "Unsubscribed" + tag source
3. Local DB: Insert suppression-list.csv row
4. Return success page: "Fatto. Non riceverai più email da ZAK Studio Web."
```

### 2.2 Hash Unsubscribe (Sicurezza)
```python
# Generazione hash per ogni email inviata
import hashlib, hmac, os

UNSUB_SECRET = os.environ["UNSUB_SECRET"]  # 32+ char random, rotate annualmente

def generate_unsubscribe_hash(email: str, company: str, campaign_id: str) -> str:
    """Hash univoco per email+company+campaign — non reversibile"""
    message = f"{email}|{company}|{campaign_id}".encode()
    return hmac.new(UNSUB_SECRET.encode(), message, hashlib.sha256).hexdigest()[:16]

def verify_unsubscribe_hash(hash: str, email: str, company: str, campaign_id: str) -> bool:
    expected = generate_unsubscribe_hash(email, company, campaign_id)
    return hmac.compare_digest(hash, expected)
```

**Proprietà:**
- ✅ Non reversibile (HMAC-SHA256)
- ✅ Univoco per email+company+campaign (prevent enumeration)
- ✅ Lungo 16 char (URL-friendly)
- ✅ Secret rotabile (invalidate old hash se compromesso)

---

## 3. IMPLEMENTAZIONE PER ESP COMUNI

### 3.1 Resend (API)
```javascript
// Resend suppression list API
await resend.contacts.create({
  email: "user@company.com",
  unsubscribed: true,
  audienceId: "aud_abc123"  // Cold outreach audience
});
```

### 3.2 SendGrid (API)
```javascript
// SendGrid suppression management
await sgClient.request({
  method: 'POST',
  url: '/v3/asm/suppressions/global',
  body: { recipient_emails: ["user@company.com"] }
});
```

### 3.3 Customer.io (API)
```javascript
// Customer.io suppress
await customerio.suppress({ email: "user@company.com" });
```

### 3.4 Generic SMTP / Self-hosted
```python
# Aggiungi a suppression list locale (CSV/DB) + ESP se supporta
def add_to_suppression(email, reason="unsubscribe", source="email_footer"):
    # 1. Local CSV
    with open("suppression-list.csv", "a") as f:
        f.write(f'"{email}","{reason}","{datetime.utcnow().isoformat()}","{source}"\n')
    # 2. ESP API (se disponibile)
    # 3. CRM update
```

---

## 4. LANDING PAGE UNSUBSCRIBE — SPEC

### 4.1 URL Structure
```
GET https://unsubscribe.zakstudio.com/?h=UNIQUE_HASH
# Oppure sottocartella dominio principale:
GET https://zakstudio.com/unsubscribe/?h=UNIQUE_HASH
```

### 4.2 Page Flow (2 Step — Best Practice)

**STEP 1 — Confirmation Page (GET)**
```
┌─────────────────────────────────────────────┐
│  ZAK Studio Web                             │
│                                             │
│  Vuoi davvero disiscriverti?               │
│                                             │
│  Email: mario.rossi@esempromeccanica.it    │
│  Azienda: Esempio Meccanica Srl             │
│                                             │
│  Non riceverai più email commerciali da    │
│  parte nostra. Potrai sempre riscriverti   │
│  contattandoci a privacy@zakstudio.com     │
│                                             │
│  [  SÌ, DISISCRIVIMI  ]  [  ANNULLA  ]     │
│                                             │
│  —                                          │
│  ZAK Studio Web di [Nome]                  │
│  Via [Indirizzo], [CAP] [Città]            │
│  P.IVA [XXXXXXXXXX] — REA [XX]-[XXXXXX]    │
│  Privacy: https://zakstudio.com/privacy     │
└─────────────────────────────────────────────┘
```

**STEP 2 — Success Page (POST conferma)**
```
┌─────────────────────────────────────────────┐
│  ZAK Studio Web                             │
│                                             │
│  ✅ Disiscrizione confermata               │
│                                             │
│  mario.rossi@esempromeccanica.it è stata   │
│  rimossa dalle nostre liste di contatto.   │
│                                             │
│  Non riceverai più email commerciali da    │
│  ZAK Studio Web.                           │
│                                             │
│  Se hai cambiato idea, contattaci:         │
│  privacy@zakstudio.com                     │
│                                             │
│  —                                          │
│  ZAK Studio Web di [Nome]                  │
│  Via [Indirizzo], [CAP] [Città]            │
│  P.IVA [XXXXXXXXXX] — REA [XX]-[XXXXXX]    │
│  Privacy: https://zakstudio.com/privacy     │
└─────────────────────────────────────────────┘
```

### 4.3 Requisiti UX/UI
- [ ] **Mobile-first** — funziona perfettamente su telefono
- [ ] **No JavaScript required** — form HTML standard, funziona senza JS
- [ ] **Loading state** — disabilita bottone durante POST, mostra spinner
- [ ] **Error handling** — hash invalido/scaduto → pagina errore chiara + contatto supporto
- [ ] **Accessibilità** — WCAG 2.1 AA (contrasto, focus visibile, label form, ARIA)
- [ ] **Velocità** — < 200ms response, static hosting (Vercel/Netlify/Cloudflare Pages)
- [ ] **No tracking** — nessun pixel, nessun cookie, nessun analytics su questa pagina
- [ ] **HTTPS only** — HSTS, certificato valido

---

## 5. FOOTER EMAIL — TEMPLATE OBBLIGATORIO

### 5.1 Testo Footer (Plain Text — in OGNI email)
```text
—
[Tuo Nome] — ZAK Studio Web
[tuonome]@outreach.zakstudio.com

Se non vuoi più ricevere queste email: https://unsubscribe.zakstudio.com/?h={{unsubscribe_hash}}

ZAK Studio Web di [Tuo Nome Cognome] — Via [Indirizzo], [CAP] [Città] — P.IVA [XXXXXXXXXX] — REA [XX]-[XXXXXX] — Privacy: https://zakstudio.com/privacy
```

### 5.2 Variabili da Sostituire per Email
| Variabile | Esempio | Fonte |
|-----------|---------|-------|
| `{{unsubscribe_hash}}` | `a1b2c3d4e5f6g7h8` | Generato per ogni email (HMAC) |
| `[Tuo Nome]` | Mario Rossi | `sender-profile.md` |
| `[tuonome]@outreach.zakstudio.com` | mario.rossi@outreach.zakstudio.com | Config email |
| `Via [Indirizzo], [CAP] [Città]` | Via Roma 123, 25121 Brescia | Sede legale |
| `P.IVA [XXXXXXXXXX]` | 01234567890 | Partita IVA |
| `REA [XX]-[XXXXXX]` | BS-123456 | REA Camera Commercio |

---

## 6. SUPPRESSION LIST — GESTIONE OPERATIVA

### 6.1 File `suppression-list.csv` (Fonte verità)
```csv
email,reason,date_added,source,notes
"mario.rossi@esempromeccanica.it","unsubscribe","2026-11-21T10:30:00Z","email_footer","Clicked unsubscribe in email #1"
"admin@altraazienda.it","hard_bounce","2026-11-20T14:22:00Z","esp_webhook","550 5.1.1 User unknown"
"info@terzaazienda.it","spam_complaint","2026-11-19T09:15:00Z","esp_feedback_loop","FBL report from Gmail"
```

### 6.2 Sync Process (Ogni invio batch)
```python
def pre_send_check(emails_to_send):
    """Filter out suppressed emails prima di inviare"""
    suppressed = set()
    with open("suppression-list.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            suppressed.add(row["email"].lower())
    
    clean_list = [e for e in emails_to_send if e.lower() not in suppressed]
    blocked = [e for e in emails_to_send if e.lower() in suppressed]
    
    if blocked:
        log.warning(f"Blocked {len(blocked)} suppressed emails: {blocked}")
    
    return clean_list
```

### 6.3 ESP Suppression Sync (Bidirezionale)
| Direzione | Frequenza | Metodo |
|-----------|-----------|--------|
| **Locale → ESP** | Prima di ogni batch invio | API bulk add suppression |
| **ESP → Locale** | Giornaliera (cron 03:00) | Webhook ESP → append CSV / DB |
| **Feedback Loop (FBL)** | Real-time | Webhook ESP → reason="spam_complaint" |

---

## 7. TEST CHECKLIST (Pre-lancio + Mensile)

| Test | Metodo | Pass Criteria |
|------|--------|---------------|
| **Link unsubscribe funziona** | Click test email → conferma → success page | Hash valido → email in suppression list → ESP suppressed |
| **Hash invalido/scaduto** | Modifica hash manualmente → GET | Pagina errore chiara, no crash, link supporto |
| **Doppio click** | Click 2x veloce | Idempotente — una sola entry suppression |
| **Mobile** | Test iOS Safari / Android Chrome | Layout corretto, bottoni touch-friendly |
| **No JS** | Disabilita JS browser → submit form | Funziona (form HTML standard) |
| **Accessibilità** | Screen reader (NVDA/VoiceOver) + keyboard only | Navigabile, label chiare, focus visibile |
| **ESP sync** | Verifica suppression list ESP dopo test | Email presente in suppression list ESP |
| **CRM sync** | Verifica contact status CRM dopo test | Status="Unsubscribed", tag source |
| **Footer legale presente** | Invia test email → controlla raw | Tutte variabili sostituite, P.IVA/REA corretti |
| **Response time** | curl -w "%{time_total}" unsubscribe page | < 500ms (static hosting) |

---

## 8. MONITORAGGIO E ALERT

| Metrica | Soglia Alert | Azione |
|---------|--------------|--------|
| **Unsubscribe rate giornaliero** | > 2% | Pausa invio, review lista/offer/angle |
| **Unsubscribe rate campagna** | > 5% | Stop campagna, analisi root cause |
| **Spam complaint rate** | > 0.1% | STOP immediato, review tutto |
| **Suppression list growth** | Anomalo (es. +100/giorno) | Indaga fonte (scraping? test? breach?) |
| **Hash validation failures** | > 10/ora | Possibile enumeration attack → rate limit / WAF |

---

## 9. RIAVVIO / RE-OP IN (Se utente cambia idea)

> **Processo manuale, non automatizzato — GDPR richiede azione positiva interessato**

1. Utente scrive a `privacy@zakstudio.com` chiedendo riattivazione
2. Verifica identità (email + conferma)
3. Rimuovi da suppression list locale + ESP + CRM
4. Log: `re_opt_in,date,email,verified_by,method`
5. Conferma a utente: "Riattivato. Riceverai nuovamente nostre comunicazioni."
6. **Non** riaggiungere a campagne attive automaticamente — solo future campagne se re-qualificato

---

## 10. FIRMA E APPROVAZIONE

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare / Tech Lead** | [Tuo Nome] | | |
| **DPO / Referente Privacy** | [Nome] | | |

**Prossima revisione:** [DATA ODIERNA + 6 MESI] o post-cambiamento ESP/architettura