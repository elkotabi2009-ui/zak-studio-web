# DNS Setup Guide — SPF / DKIM / DMARC + Warmup
**Per dominio dedicato `outreach.zakstudio.com` — Configura PRIMA di qualsiasi invio.**

---

## 1️⃣ SCELTA DOMINIO E SOTTODOMINIO

| Opzione | Esempio | Pro | Contro |
|---------|---------|-----|--------|
| **Sottodominio (CONSIGLIATO)** | `outreach.zakstudio.com` | Isola reputazione da dominio principale (`zakstudio.com`), nessuna interferenza con email aziendali | Nessuno |
| Dominio separato | `zakstudio-outreach.com` | Totale isolamento | Costo dominio extra, brand meno riconoscibile |
| Dominio principale | `zakstudio.com` | ❌ **MAI** — Rischio blacklist email aziendali, fatture, clienti | Alto rischio |

**Decidi ora:** `outreach.zakstudio.com` (o `mail.zakstudio.com`, `send.zakstudio.com`)

---

## 2️⃣ PROVIDER DNS CONSIGLIATI

| Provider | Perché | Costo |
|----------|--------|-------|
| **Cloudflare** (CONSIGLIATO) | Gratis, DNSSEC, proxy opzionale, API per automazione, veloce | Gratis |
| **Namecheap / Porkbun** | Economici, interfaccia semplice | ~€10/anno |
| **GoDaddy / Aruba** | Se dominio già lì | Variabile |
| **AWS Route 53** | Se su AWS | $0.50/mese/zone |

**Usa Cloudflare** — Cambia nameserver al registrar → punta a Cloudflare → gestisci tutto lì.

---

## 3️⃣ RECORD DNS DA CREARE (Copia-incolla in Cloudflare)

### 3.1 MX Record (Ricezione email — per bounce, reply, DSAR)
```
Tipo: MX
Nome: @ (o outreach se sottodominio delegato)
Valore: 10 inbound.agentmail.to.   (se AgentMail)
        10 inbound-smtp.us-west-2.amazonaws.com  (se AWS SES)
        mx.resend.com  (se Resend)
TTL: Auto (300)
Priorità: 10
```
> **Nota:** Se usi solo invio (no inbox), puoi omettere MX ma **AgentMail/Resend richiedono MX per verifica dominio**.

### 3.2 SPF Record (Sender Policy Framework)
```
Tipo: TXT
Nome: @
Valore: v=spf1 include:_spf.agentmail.to ~all
        # O per Resend:
        v=spf1 include:_spf.resend.com ~all
        # O per SendGrid:
        v=spf1 include:sendgrid.net ~all
        # O per AWS SES:
        v=spf1 include:amazonses.com ~all
TTL: Auto
```
**Spiegazione:**
- `v=spf1` = versione SPF
- `include:_spf.agentmail.to` = autorizza AgentMail a inviare per tuo dominio
- `~all` = **SoftFail** (accetta ma marca come sospetto) — **usa `~all` all'inizio**, passa a `-all` (HardFail) dopo warmup + test

### 3.3 DKIM Record (DomainKeys Identified Mail) — **Forse fornito da ESP**

#### AgentMail (Automatico dopo verifica dominio)
1. Vai in AgentMail Dashboard → Domains → `outreach.zakstudio.com` → Verify
2. Ti darà 2 record CNAME da aggiungere:
```
Tipo: CNAME
Nome: agentmail1._domainkey.outreach
Valore: dkim1.agentmail.to.
TTL: Auto

Tipo: CNAME
Nome: agentmail2._domainkey.outreach
Valore: dkim2.agentmail.to.
TTL: Auto
```

#### Resend (Dashboard → Domains → `outreach.zakstudio.com` → DNS Records)
```
Tipo: CNAME
Nome: resend._domainkey.outreach
Valore: dkim.resend.com.
TTL: Auto
```

#### SendGrid (Settings → Sender Authentication → Authenticate Your Domain)
Ti darà 3 record CNAME (dkim1, dkim2, dkim3) + 1 TXT per SPF.

#### Generazione Manuale (se ESP non fornisce — RARO)
```bash
# Genera chiavi DKIM (2048 bit)
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# Estrai public key per record DNS
cat dkim_public.pem | grep -v "^--" | tr -d '\n'
# Risultato: MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```
Record TXT:
```
Tipo: TXT
Nome: default._domainkey.outreach
Valore: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
TTL: Auto
```

### 3.4 DMARC Record (Domain-based Message Authentication, Reporting, Conformance)
```
Tipo: TXT
Nome: _dmarc.outreach
Valore: v=DMARC1; p=none; rua=mailto:dmarc@zakstudio.com; ruf=mailto:dmarc@zakstudio.com; fo=1; adkim=r; aspf=r; pct=100
TTL: Auto
```

**Parametri DMARC:**
| Tag | Valore | Significato |
|-----|--------|-------------|
| `v=DMARC1` | Obbligatorio | Versione |
| `p=none` | **INIZIA CON NONE** | Policy: none=monitora, quarantine=spam, reject=rifiuta |
| `rua=mailto:dmarc@zakstudio.com` | Aggregate reports | Report giornalieri XML (usa `dmarc@` o servizio esterno) |
| `ruf=mailto:dmarc@zakstudio.com` | Forensic reports | Report per singolo fail (opzionale, molto verbose) |
| `fo=1` | Failure options | Report se SPF **O** DKIM fail |
| `adkim=r` | DKIM alignment | Relaxed (sottodominio ok) |
| `aspf=r` | SPF alignment | Relaxed |
| `pct=100` | Percentage | Applica a 100% email |

**Evoluzione Policy (dopo warmup + analisi report):**
1. **Settimane 1-2**: `p=none` (solo monitoraggio)
2. **Settimane 3-4**: `p=quarantine; pct=50` (50% in spam se fail)
3. **Settimane 5-6**: `p=quarantine; pct=100`
4. **Post-warmup**: `p=reject; pct=100` (gold standard)

### 3.5 Record Aggiuntivi (Opzionali ma Consigliati)

#### BIMI (Brand Indicators for Message Identification) — Logo in inbox
```
Tipo: TXT
Nome: default._bimi.outreach
Valore: v=BIMI1; l=https://zakstudio.com/logo.svg; a=https://zakstudio.com/logo.pem
```
*Richiede: DMARC `p=quarantine` o `reject`, logo SVG 1:1, certificato VMC (costo ~€1000/anno) — **Opzionale, fa dopo.***

#### TLS-RPT (SMTP TLS Reporting)
```
Tipo: TXT
Nome: _smtp._tls.outreach
Valore: v=TLSRPTv1; rua=mailto:tlsrpt@zakstudio.com
```

---

## 4️⃣ VERIFICA RECORD (Prima di Warmup)

### Tool Gratuiti
```bash
# MXToolbox (web) → mxtoolbox.com/SuperTool.aspx
# Controlla: SPF, DKIM, DMARC, MX, Blacklist

# Da terminale:
dig TXT outreach.zakstudio.com +short        # SPF
dig TXT _dmarc.outreach.zakstudio.com +short # DMARC
dig CNAME agentmail1._domainkey.outreach.zakstudio.com +short  # DKIM (AgentMail)

# Test invio reale → mail-tester.com
# Invia email test a indirizzo mail-tester → score su 10
# Target: ≥ 9/10 prima di warmup
```

### Checklist Pre-Warmup
- [ ] MX record risolto e punta a ESP
- [ ] SPF record presente, `include:` corretto, `~all` (non `-all` yet)
- [ ] DKIM record(i) presenti, CNAME risolti (se ESP gestisce) o TXT con chiave pubblica
- [ ] DMARC `p=none`, `rua` email valida (riceverai report XML giornalieri)
- [ ] mail-tester.com score ≥ 9/10
- [ ] Nessun errore su mxtoolbox.com (SPF/DKIM/DMARC/MX all green)

---

## 5️⃣ WARMUP SCHEDULE (4-6 SETTIMANE — NON SALTABILE)

### Principio
Nuovo dominio/sottodominio = reputazione zero. Inviare 200 email giorno 1 = **blacklist immediata**.

### Piano Settimanale (Volume Giornaliero)

| Settimana | Giorni | Volume/Giorno | Target | Note |
|-----------|--------|---------------|--------|------|
| **1** | Lun-Ven | **10** | Reputazione iniziale | Solo email a contatti interni/amici/colleghi che rispondono |
| **2** | Lun-Ven | **15** | Engagement reale | Aggiungi 5 contatti "caldi" (clienti passati, network) che rispondono |
| **3** | Lun-Ven | **20** | Scalata | Mix 50% warm contatti + 50% cold Tier A (high pain score) |
| **4** | Lun-Ven | **25** | Target operativo | Tutti Tier A, poi Tier B |
| **5+** | Lun-Ven | **25-30** | Mantieni | Non superare 30/gg per sicurezza |

### Regole Warmup (NON NEGOZIABILI)
1. **Solo giorni lavorativi** (Lun-Ven) — niente weekend
2. **Pause casuali 2-8 min** tra email (simula umano)
3. **Obbligatorio reply rate > 20%** in settimana 1-2 → chiedi a contatti interni di rispondere
4. **Se bounce > 2% o complaint > 0.1% → FERMA warmup, indaga**
5. **Monitora mail-tester.com ogni 3 giorni** — score deve salire/stabilizzarsi ≥ 9
6. **Controlla DMARC report giornalieri** (rua) — allinea SPF/DKIM se fail

### Tool Warmup Automatizzati (Opzionali)
| Tool | Costo | Funzione |
|------|-------|----------|
| **Warmy.io** | €29/mese | Warmup automatizzato, rete contatti reali, report |
| **Mailreach** | $25/mese | Simile, buona reputazione |
| **Lemwarm (Lemlist)** | $29/mese | Integrato se usi Lemlist |
| **Manuale (GRATIS)** | Tempo | Tu invii a 10-15 contatti fidati che rispondono |

**Consiglio:** Fai **manuale settimane 1-2** (costa 0, impari), poi tool se vuoi scalare.

---

## 6️⃣ CONFIGURAZIONE ESP (AgentMail / Resend / SendGrid)

### AgentMail (Consigliato per Cold Outreach)
1. Crea account → https://agentmail.to
2. **Verify Domain** → aggiungi `outreach.zakstudio.com`
3. Segui wizard: ti darà MX, DKIM CNAME, SPF include
4. Crea **Inbox**: `outreach-zakstudio` (riceve reply, bounce, webhook)
5. Genera **API Key** → salva in `AGENTMAIL_API_KEY`
6. Configura **Webhook URL**: `https://api.tuodominio.com/webhooks/email/agentmail`
7. Test: invia email a te stesso → controlla headers (SPF=pass, DKIM=pass, DMARC=pass)

### Resend (Alternativa Semplice)
1. Account → https://resend.com
2. **Domains** → Add `outreach.zakstudio.com`
3. Copia record DNS (MX, SPF TXT, DKIM CNAME)
4. **API Keys** → Create → `re_xxxxx` → salva in `RESEND_API_KEY`
5. Test invio via API → controlla `delivered` webhook

### SendGrid (Enterprise)
1. Settings → Sender Authentication → Authenticate Your Domain
2. Ti dà 3 CNAME DKIM + 1 TXT SPF + MX
3. API Key con permessi `Mail Send` + `Mail Send Scheduler`
4. **Suppression Management** → attiva per unsubscribe/bounce/complaint auto

---

## 7️⃣ UNSUBSCRIBE PAGE DEPLOY (Obbligatorio per Legal)

### Struttura Minima (Static — Vercel/Netlify/Cloudflare Pages)

```
unsubscribe-page/
├── index.html          # Pagina conferma (GET ?h=hash)
├── success.html        # Pagina successo (POST)
├── styles.css
├── script.js
├── vercel.json         # o netlify.toml
└── package.json        # (se serve build)
```

### `index.html` (Conferma One-Click)
```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disiscrizione — ZAK Studio Web</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="container">
    <header>
      <svg class="logo" viewBox="0 0 120 40"><text x="0" y="28" font-size="24" font-weight="700" fill="#1a3c5e">ZAK Studio Web</text></svg>
    </header>
    <section class="card">
      <h1>Vuoi davvero disiscriverti?</h1>
      <p id="email-display">Caricamento...</p>
      <p>Non riceverai più email commerciali da parte nostra. Potrai sempre riscriverti contattandoci a <a href="mailto:privacy@zakstudio.com">privacy@zakstudio.com</a>.</p>
      <form id="unsub-form" method="POST" action="/api/unsubscribe">
        <input type="hidden" name="hash" id="hash-input">
        <button type="submit" class="btn btn-danger">SÌ, DISISCRIVIMI</button>
        <a href="javascript:history.back()" class="btn btn-secondary">ANNULLA</a>
      </form>
    </section>
    <footer>
      <p>ZAK Studio Web di Mario Rossi — Via Roma 123, 25121 Brescia — P.IVA 01234567890 — REA BS-123456</p>
      <p><a href="https://zakstudio.com/privacy">Privacy Policy</a></p>
    </footer>
  </main>
  <script src="script.js"></script>
</body>
</html>
```

### `script.js` (Hash Validation + Submit)
```javascript
(async () => {
  const params = new URLSearchParams(window.location.search);
  const hash = params.get('h');
  const hashInput = document.getElementById('hash-input');
  const emailDisplay = document.getElementById('email-display');
  
  if (!hash) {
    emailDisplay.textContent = '❌ Link non valido o scaduto.';
    document.getElementById('unsub-form').style.display = 'none';
    return;
  }
  
  hashInput.value = hash;
  
  // Verifica hash via API (opzionale, per mostrare email)
  try {
    const res = await fetch(`/api/verify-hash?h=${encodeURIComponent(hash)}`);
    if (res.ok) {
      const data = await res.json();
      emailDisplay.innerHTML = `Email: <strong>${data.email}</strong><br>Azienda: <strong>${data.company}</strong>`;
    }
  } catch {}
  
  document.getElementById('unsub-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Elaborazione...';
    
    const formData = new FormData(e.target);
    const res = await fetch('/api/unsubscribe', { method: 'POST', body: formData });
    
    if (res.ok) {
      window.location.href = '/success.html';
    } else {
      btn.disabled = false;
      btn.textContent = 'SÌ, DISISCRIVIMI';
      alert('Errore. Riprova o contatta privacy@zakstudio.com');
    }
  });
})();
```

### API Endpoints (Vercel Functions / Netlify Functions / Cloudflare Workers)

#### `api/verify-hash.js` (Vercel)
```javascript
// Vercel Function: /api/verify-hash?h=xxx
import { verifyHash } from '../../lib/unsubscribe.js'; // Tua libreria HMAC

export default async function handler(req, res) {
  const { h } = req.query;
  if (!h) return res.status(400).json({ error: 'Hash required' });
  
  // Decodifica hash per mostrare email (solo se hash valido)
  // Non fare reverse lookup reale — sicurezza
  // Usa database/lookup table se hai salvato mapping hash→email
  return res.status(200).json({ email: 'mario.rossi@esempromeccanica.it', company: 'Esempio Meccanica Srl' });
}
```

#### `api/unsubscribe.js` (Vercel)
```javascript
// Vercel Function: POST /api/unsubscribe
import { verifyHash, addToSuppression } from '../../lib/unsubscribe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { hash } = req.body;
  if (!hash) return res.status(400).json({ error: 'Hash required' });
  
  // Verifica HMAC
  if (!verifyHash(hash)) return res.status(400).json({ error: 'Invalid hash' });
  
  // Estrai email da hash (se nel payload) o lookup
  // Qui: aggiungi a suppression list ESP + locale + Sheets
  await addToSuppression({ hash, source: 'unsubscribe_page', reason: 'unsubscribe' });
  
  return res.status(200).json({ success: true });
}
```

### Deploy Vercel (Gratis, SSL auto, veloce)
```bash
cd unsubscribe-page
npm i -g vercel
vercel login
vercel --prod
# Output: https://unsubscribe-zakstudio.vercel.app
# Configura dominio custom: unsubscribe.zakstudio.com → DNS CNAME → cname.vercel-dns.com
```

### Variabili Ambiente (Vercel Dashboard → Settings → Environment Variables)
| Variabile | Valore |
|-----------|--------|
| `UNSUB_SECRET` | Chiave HMAC 32+ char (genera: `openssl rand -hex 32`) |
| `AGENTMAIL_API_KEY` | Per sync suppression ESP |
| `GOOGLE_SHEETS_CREDENTIALS` | JSON service account (per sync Sheets) |

---

## 8️⃣ TEST COMPLETO PRE-LANCIO (Checklist Finale)

| Test | Metodo | Pass Criteria |
|------|--------|---------------|
| **DNS SPF** | `dig TXT outreach.zakstudio.com` | `v=spf1 include:_spf.agentmail.to ~all` |
| **DNS DKIM** | `dig CNAME agentmail1._domainkey.outreach.zakstudio.com` | Risolve a `dkim1.agentmail.to.` |
| **DNS DMARC** | `dig TXT _dmarc.outreach.zakstudio.com` | `v=DMARC1; p=none; rua=mailto:dmarc@zakstudio.com` |
| **MX Record** | `dig MX outreach.zakstudio.com` | Punta a ESP inbound |
| **mail-tester.com** | Invia test email a indirizzo fornito | Score ≥ 9/10 |
| **MXToolbox** | mxtoolbox.com → SPF/DKIM/DMARC/MX/Blacklist | Tutti verde |
| **AgentMail/Resend Verify** | Dashboard → Domain status | "Verified" / "Authenticated" |
| **Invio Test Interno** | Invia a 3 indirizzi tuoi (Gmail, Outlook, Aziendale) | Ricevute in Inbox (non Spam), header SPF/DKIM/DMARC = pass |
| **Reply Test** | Rispondi a email test → arriva in AgentMail inbox / webhook | Webhook `replied` processato, classification funziona |
| **Unsubscribe Test** | Click link unsubscribe in email test → pagina conferma → submit | Email in suppression list (locale + ESP + Sheets) |
| **Bounce Test** | Invia a `bounce@simulator.amazonses.com` (se SES) o email inesistente | Webhook `bounced` → suppression + pause sequence |
| **Complaint Test** | Iscriviti a FBL (Gmail/Outlook) o usa simulator | Webhook `complained` → suppression + alert |
| **Rate Limit Test** | Trigger invio 30 email rapidi → controlla delay | Delay 2-8 min tra email, max 25/gg rispettato |
| **DMARC Report** | Controlla `dmarc@zakstudio.com` dopo 24h | Report XML ricevuto, SPF/DKIM aligned |

---

## 9️⃣ TIMELINE REALISTICA (Da Zero a Pronto)

| Giorno | Attività | Output |
|--------|----------|--------|
| **Giorno 1** | Compra/Configura dominio → Cloudflare DNS | Nameserver cambiati, zona DNS attiva |
| **Giorno 1-2** | Crea record MX, SPF, DKIM, DMARC (`p=none`) | DNS propagato (controlla `dig`) |
| **Giorno 2** | Setup ESP (AgentMail/Resend) + Verifica dominio | ESP dice "Verified" |
| **Giorno 2-3** | Deploy unsubscribe page + API + test | `unsubscribe.zakstudio.com` funziona |
| **Giorno 3** | mail-tester.com + mxtoolbox → fix se errori | Score ≥ 9, tutti green |
| **Giorno 4-10** | **Warmup Settimana 1** — 10 email/gg a contesti fidati | Reply rate > 20%, 0 bounce, 0 complaint |
| **Giorno 11-17** | **Warmup Settimana 2** — 15 email/gg + primi cold Tier A | Reply rate > 10%, score mail-tester stabile |
| **Giorno 18-24** | **Warmup Settimana 3** — 20 email/gg | Pronti per lancio |
| **Giorno 25-31** | **Warmup Settimana 4** — 25 email/gg | **LANCIO UFFICIALE** |
| **Giorno 35+** | DMARC `p=quarantine` → `p=reject` | Policy progressiva |

**Totale: ~5 settimane prima di inviare 200 email a freddo.**

---

## 🔟 MANUTENZIONE CONTINUA

| Attività | Frequenza | Tool |
|----------|-----------|------|
| Controlla DMARC report (rua) | Giornaliera (automatizza parsing) | `dmarcian`, `parsedmarc`, script custom |
| mail-tester.com score | Settimanale | mail-tester.com |
| Blacklist check (MXToolbox) | Settimanale | mxtoolbox.com/blacklists.aspx |
| ESP reputation dashboard | Giornaliera | AgentMail/Resend/SendGrid dashboard |
| Suppression list audit | Mensile | CSV + ESP + Sheets reconcile |
| DKIM key rotation | Annuale | Rigenera chiavi, aggiorna DNS |
| DMARC policy upgrade | Ogni 4-6 settimane post-warmup | `p=none` → `quarantine` → `reject` |

---

## 📞 CONTATTI EMERGENZA

| Problema | Chi Contattare | Come |
|----------|----------------|------|
| Dominio blacklistato | ESP Support + Delist request | Spamhaus, SURBL, Barracuda, Google Postmaster Tools |
| DMARC fail improvvisi | Controlla SPF/DKIM alignment | `parsedmarc` su report rua |
| DKIM key compromise | Ruota chiavi immediatamente | Nuove chiavi → DNS → ESP |
| Volume spike incontrollato | Ferma sender daemon | `pkill -f sender_daemon` |

---

**Hai tutto. Ora esegui in ordine: DNS → ESP → Unsubscribe → Warmup → Lancio.**