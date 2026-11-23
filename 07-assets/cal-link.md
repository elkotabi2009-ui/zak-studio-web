# Calendly / Cal.com Link — Booking Discovery Call
**Configura PRIMA di lanciare outreach. Link va in CTA email e footer caso studio.**

---

## 1. EVENT TYPE SETUP

### 1.1 Calendly (Opzione A — Consigliata per semplicità)
| Campo | Valore |
|-------|--------|
| **Event Name** | Discovery Call — ZAK Studio Web (15 min) |
| **Duration** | 15 minutes |
| **Description** | Call conoscitiva per capire se ha senso lavorare insieme sul vostro sito web. Nessun impegno, niente pitch aggressivo. Portate domande, io porto ascolto. |
| **Location** | Google Meet / Zoom / Teams (auto-generated link) |
| **Availability** | Lun-Ven 9:00-13:00 / 14:30-17:00 (timezone: Europe/Rome) |
| **Buffer** | 10 min before / 10 min after |
| **Min Scheduling Notice** | 2 ore |
| **Max Bookings Per Day** | 4 (per qualità) |
| **Questions (Required)** | 1. Nome e Cognome<br>2. Email aziendale<br>3. Ruolo / Titolo<br>4. Nome azienda<br>5. Sito web attuale (se c'è)<br>6. Obiettivo principale: Lead / Credibilità / Vendita / Altro<br>7. Budget indicativo: <5k / 5-15k / 15k+ / Da definire<br>8. Timeline: Subito / 1-3 mesi / 3-6 mesi / Esplorativo |
| **Confirmation Email** | Custom: "Confermato! Il [DATA] alle [ORA] ci sentiamo per 15 min. Link meeting: [LINK]. Se qualcosa cambia, usa il link per rimandare. A presto, [Tuo Nome]" |
| **Reminder** | 24h prima (email) + 1h prima (SMS se numero fornito) |
| **Cancellation Policy** | Fino a 1h prima — link in confirmation email |
| **Redirect After Booking** | `https://zakstudio.com/grazie-call?utm_source=calendly&utm_medium=booking&utm_campaign=discovery` |

**Link finale da usare in email:**
```
https://calendly.com/tuo-username/discovery-call-15min
# O con parametri pre-compilati:
https://calendly.com/tuo-username/discovery-call-15min?name={{decision_maker_name}}&email={{email}}&company={{company_name}}
```

---

### 1.2 Cal.com (Opzione B — Self-hosted, più controllo, gratis)
| Campo | Valore |
|-------|--------|
| **Installazione** | Docker su VPS (Hetzner/DigitalOcean) O Cal.com Cloud (gratis fino a 100 booking/mese) |
| **Event Type** | `discovery-call-15min` |
| **Duration** | 15 min |
| **Schedule** | Mon-Fri 09:00-13:00, 14:30-17:00 (Europe/Rome) |
| **Booking Fields** | Stessi di Calendly sopra |
| **Video Conferencing** | Daily.co / Whereby / Jitsi / Google Meet integration |
| **Email Notifications** | Custom templates (nodemailer / SendGrid / Resend) |
| **Webhook** | `https://api.zakstudio.com/webhooks/cal-com/booking-created` → CRM update |
| **API Key** | Per sync programmatico |

**Link finale:**
```
https://cal.com/tuo-username/discovery-call-15min
```

---

## 2. INTEGRAZIONE CRM (Auto-create Deal/Contact)

### 2.1 HubSpot
```javascript
// Webhook Calendly/Cal.com → HubSpot
// Crea/aggiorna Contact + crea Deal in pipeline "Outreach" stage "Discovery Scheduled"

const hubspotFields = {
  email: booking.attendee.email,
  firstname: booking.attendee.name.split(' ')[0],
  lastname: booking.attendee.name.split(' ').slice(1).join(' '),
  company: booking.attendee.company,
  jobtitle: booking.attendee.role,
  website: booking.attendee.website,
  // Custom fields
  zak_budget: booking.attendee.budget,
  zak_timeline: booking.attendee.timeline,
  zak_objective: booking.attendee.objective,
  zak_source: 'cold_email_outreach',
  zak_sequence_step: booking.metadata.sequence_step // 1-6
};
```

### 2.2 Pipedrive
```javascript
// Crea Person + Organization + Deal
const pipedriveData = {
  person: { name, email, org_id, phone },
  organization: { name: company, website },
  deal: {
    title: `Discovery: ${company}`,
    value: estimate_value(budget), // da budget field
    stage_id: 'discovery_scheduled',
    pipeline_id: 'outreach_pipeline',
    custom_fields: {
      budget_field: budget,
      timeline_field: timeline,
      objective_field: objective,
      source_field: 'cold_email',
      sequence_step_field: sequence_step
    }
  }
};
```

---

## 3. TRACKING UTM PER LINK CAL

### 3.1 Parametri Standard
| Parametro | Valore | Esempio |
|-----------|--------|---------|
| `utm_source` | `cold_email` | fixed |
| `utm_medium` | `email` | fixed |
| `utm_campaign` | `zak_web_outreach_2026` | fixed |
| `utm_content` | `step_1_cta` / `step_2_cta` / `case_study_link` / `footer` | variabile |
| `utm_term` | `{{company_slug}}` | opzionale per attribution granulare |

### 3.2 Link Calendly con UTM (Grandezza massima URL < 2048 char)
```
https://calendly.com/tuo-username/discovery-call-15min?
  utm_source=cold_email&
  utm_medium=email&
  utm_campaign=zak_web_outreach_2026&
  utm_content=step_1_cta&
  utm_term=esempromeccanica-srl
```

> **Nota:** Calendly supporta parametri query che passa al redirect. Per pre-compilare campi: `?name=Mario%20Rossi&email=mario%40esempromeccanica.it&a1=Esempio%20Meccanica%20Srl` (campi custom `a1`, `a2`... dipende da configurazione).

---

## 4. THANK YOU PAGE (Post-booking)

### 4.1 URL: `https://zakstudio.com/grazie-call`
### 4.2 Contenuto
```html
<!-- Static page su Vercel/Netlify -->
<h1>Call confermata! 🎯</h1>
<p>Il <strong>[DATA]</strong> alle <strong>[ORA]</strong> ci sentiamo per 15 minuti.</p>
<p>Link meeting: <a href="[MEETING_LINK]">Partecipa qui</a> (si apre al momento).</p>

<h2>Cosa preparare (opzionale, ma utile):</h2>
<ul>
  <li>Link sito attuale (se c'è)</li>
  <li>2-3 competitor/aziende che vi piacciono come riferimento</li>
  <li>Obiettivo n.1: lead / credibilità / vendita diretta / altro</li>
  <li>Budget mentale (anche indicativo)</li>
</ul>

<h2>Se qualcosa cambia:</h2>
<p>Usa il link "Reschedule/Cancel" nell'email di conferma. Nessun problema.</p>

<p>—<br>[Tuo Nome] — ZAK Studio Web<br>
<a href="https://zakstudio.com">zakstudio.com</a> | <a href="mailto:privacy@zakstudio.com">privacy@zakstudio.com</a></p>
```

### 4.3 Analytics Event (GA4 / Plausible / Matomo)
```javascript
// Fires on thank you page load
gtag('event', 'booking_confirmed', {
  event_category: 'outreach',
  event_label: 'discovery_call_15min',
  value: estimated_value, // da budget field
  custom_parameters: {
    sequence_step: 'step_1', // o step dove ha cliccato
    company: 'esempromeccanica-srl',
    source: 'cold_email'
  }
});
```

---

## 5. CHECKLIST PRE-LANCIO (Calendly/Cal.com)

| Controllo | Fatto? |
|-----------|--------|
| [ ] Event type creato (15 min, disponibilità corretta) | |
| [ ] Campi prenotazione configurati (8 domande required) | |
| [ ] Email conferma customizzata (italiano, tono peer) | |
| [ ] Reminder 24h + 1h attivi | |
| [ ] Redirect thank you page con UTM | |
| [ ] Integrazione CRM testata (booking → Contact + Deal) | |
| [ ] Webhook → CRM funziona (test booking → verifica deal creato) | |
| [ ] Link meeting (Google Meet/Zoom/Teams) generato correttamente | |
| [ ] Timezone Europe/Rome impostata ovunque | |
| [ ] Buffer 10min before/after attivo | |
| [ ] Max 4 booking/giorno (protezione qualità) | |
| [ ] Link corto/brand: `cal.zakstudio.com/discovery` (opzionale) | |
| [ ] Test end-to-end: click email → booking → conferma → CRM → reminder | |

---

## 6. LINK DA USARE IN EMAIL (Template)

### 6.1 CTA Email 1 (Step 1)
```
Vale la pena una call 15 min giovedì? → https://calendly.com/tuo-username/discovery-call-15min?utm_source=cold_email&utm_medium=email&utm_campaign=zak_web_outreach_2026&utm_content=step_1_cta&utm_term={{company_slug}}
```

### 6.2 CTA Email 2 (Case Study)
```
Ha 15 min per vedere se lo stesso approccio funziona per {{company_name}}? → https://calendly.com/tuo-username/discovery-call-15min?utm_source=cold_email&utm_medium=email&utm_campaign=zak_web_outreach_2026&utm_content=step_2_cta&utm_term={{company_slug}}
```

### 6.3 CTA Email 3 (Benchmark)
```
Vuole il benchmark dettagliato per il vostro settore? Te lo mando via email, 2 pagine. → https://calendly.com/tuo-username/discovery-call-15min?utm_source=cold_email&utm_medium=email&utm_campaign=zak_web_outreach_2026&utm_content=step_3_cta&utm_term={{company_slug}}
```

### 6.4 CTA Email 4 (Direct Ask)
```
Se siete voi: rispondete e fissiamo 15 min. → https://calendly.com/tuo-username/discovery-call-15min?utm_source=cold_email&utm_medium=email&utm_campaign=zak_web_outreach_2026&utm_content=step_4_cta&utm_term={{company_slug}}
```

### 6.5 CTA Email 5 (Referral)
```
Chi è la persona giusta? Rispondete con nome/ruolo. → (nessun link, reply-based)
```

### 6.6 CTA Email 6 (Breakup)
```
Se diventa priorità, rispondete qui. → (nessun link, reply-based)
```

---

## 7. FIRMA E APPROVAZIONE

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Founder / Titolare** | [Tuo Nome] | | |
| **Tech Lead (se esterno)** | [Nome] | | |

**Prossima revisione:** [DATA ODIERNA + 3 MESI] o post-cambiamento pricing/packaging/availability