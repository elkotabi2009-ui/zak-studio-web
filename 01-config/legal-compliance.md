# Legal Compliance Checklist — Cold Email B2B Italia/EU
**Da completare INTERAMENTE prima del PRIMO invio. Non negoziabile.**

---

## 📋 GDPR (Reg. UE 2016/679) — Cold Email B2B

### Art. 6 — Lawful Basis: Legitimate Interest (Art. 6.1.f)
| Requisito | Status | Evidenza / File | Note |
|-----------|--------|-----------------|------|
| **LIA (Legitimate Interest Assessment) completato** | [ ] Sì / [ ] No | `05-legal/legitimate-interest-assessment.md` | 3-part test obbligatorio |
| — Purpose test: interesse legittimo chiaro? | [ ] Sì / [ ] No | | Vendita servizi B2B = interesse legittimo riconosciuto |
| — Necessity test: email necessaria? | [ ] Sì / [ ] No | | No alternative meno invasiva per raggiungere DM |
| — Balancing test: diritti interessato non prevalgono? | [ ] Sì / [ ] No | | B2B, contesto professionale, opt-out facile |
| **LIA documentato e firmato** | [ ] Sì / [ ] No | | Data, firma, versione |

### Art. 13-14 — Informativa Privacy (Al momento raccolta dati)
| Elemento | Presente in email? | Dove |
|----------|-------------------|------|
| Identità titolare (ragione sociale, P.IVA, sede) | [ ] Sì / [ ] No | Footer email |
| Dati di contatto DPO / referente privacy | [ ] Sì / [ ] No | Footer / Link privacy policy |
| Finalità trattamento (vendita servizi web) | [ ] Sì / [ ] No | Email body + privacy policy |
| Base giuridica (Legittimo interesse Art. 6.1.f) | [ ] Sì / [ ] No | Privacy policy |
| Legittimo interesse perseguito | [ ] Sì / [ ] No | Privacy policy + LIA |
| Destinatari/categorie destinatari | [ ] Sì / [ ] No | Privacy policy (ESP, CRM, tool) |
| Trasferimenti extra-UE + garanzie | [ ] Sì / [ ] No | Privacy policy (se ESP US) |
| Periodo conservazione | [ ] Sì / [ ] No | Privacy policy (es. 12 mesi da ultimo contatto) |
| Diritti interessato (accesso, rettifica, cancellazione, opposizione, limitazione, portabilità) | [ ] Sì / [ ] No | Privacy policy + link DSAR |
| Diritto reclamo Garante | [ ] Sì / [ ] No | Privacy policy |
| Esistenza processo decisionale automatizzato | [ ] Sì / [ ] No | Privacy policy (se usi scoring) |

### Art. 21 — Diritto di Opposizione (Opt-out)
| Requisito | Status | Implementazione |
|-----------|--------|-----------------|
| **Unsubscribe one-click in OGNI email** | [ ] Sì / [ ] No | Link `unsubscribe.domain.com/?id=UNIQUE_HASH` |
| Opt-out onora in ≤ 24h | [ ] Sì / [ ] No | Automazione ESP / webhook |
| Nessun ostacolo (no login, no "perché", no sondaggi) | [ ] Sì / [ ] No | Direct link → confirmed page |
| Suppression list aggiornata real-time | [ ] Sì / [ ] No | `02-data/suppression-list.csv` + ESP suppression |
| Opposizione = stop immediato + cancellazione dati (se richiesto) | [ ] Sì / [ ] No | Processo DSAR per cancellazione |

### Art. 30 — RoPA (Record of Processing Activities)
| Elemento Art. 30.1 | Completato? | File |
|-------------------|-------------|------|
| Nome/dettagli titolare | [ ] Sì / [ ] No | `05-legal/gdpr-ropa.md` |
| Finalità trattamento | [ ] Sì / [ ] No | |
| Categorie interessati (decision maker B2B) | [ ] Sì / [ ] No | |
| Categorie dati (nome, email, ruolo, azienda, trigger) | [ ] Sì / [ ] No | |
| Categorie destinatari (ESP, CRM, tool enrichment) | [ ] Sì / [ ] No | |
| Trasferimenti extra-UE + garanzie | [ ] Sì / [ ] No | |
| Tempi cancellazione (es. 12 mesi da ultimo contatto / opt-out) | [ ] Sì / [ ] No | |
| Misure sicurezza tecniche/organizzative | [ ] Sì / [ ] No | |
| **Ultimo aggiornamento RoPA** | [DATA] | Deve essere ≤ 90gg fa |

### Art. 28 — DPA con Processori (Data Processing Agreements)
| Processore | Servizio | DPA Firmato? | Data | Standard Contractual Clauses (se extra-UE) |
|------------|----------|--------------|------|-------------------------------------------|
| [ES: Resend] | Email sending | [ ] Sì / [ ] No | | [ ] Sì / [ ] No / [ ] N/A (EU) |
| [ES: SendGrid] | Email sending | [ ] Sì / [ ] No | | [ ] Sì / [ ] No / [ ] N/A |
| [ES: Apollo.io] | Enrichment/contatti | [ ] Sì / [ ] No | | [ ] Sì / [ ] No / [ ] N/A |
| [ES: HubSpot/Pipedrive] | CRM | [ ] Sì / [ ] No | | [ ] Sì / [ ] No / [ ] N/A |
| [ES: ZeroBounce] | Email verification | [ ] Sì / [ ] No | | [ ] Sì / [ ] No / [ ] N/A |
| [ES: Calendly/Cal.com] | Booking | [ ] Sì / [ ] No | | [ ] Sì / [ ] No / [ ] N/A |

### Art. 32 — Sicurezza del Trattamento
| Misura | Implementata? | Dettaglio |
|--------|--------------|-----------|
| Pseudonimizzazione / minimizzazione dati | [ ] Sì / [ ] No | Solo dati necessari per outreach |
| Cifratura in transito (TLS 1.2+) | [ ] Sì / [ ] No | ESP + SMTP TLS |
| Cifratura a riposo (database, backup) | [ ] Sì / [ ] No | ESP / CRM / file system |
| Ripristinabilità tempestiva (backup) | [ ] Sì / [ ] No | ESP / CRM gestiscono |
| Procedure test/verifica regolari | [ ] Sì / [ ] No | Audit trimestrale |

### Art. 33-34 — Data Breach
| Elemento | Status | File / Responsabile |
|----------|--------|---------------------|
| **Breach log (Art. 33.5) — TUTTI gli incidenti** | [ ] Sì / [ ] No | `05-legal/breach-log.md` |
| Processo notifica Garante ≤ 72h | [ ] Sì / [ ] No | Responsabile: [Nome] |
| Processo notifica interessati (se rischio alto) | [ ] Sì / [ ] No | Template pronto |
| Root cause analysis + CAPA | [ ] Sì / [ ] No | Procedura documentata |

### Art. 15-22 — Diritti Interessato (DSAR)
| Diritto | Processo Documentato? | SLA | File |
|---------|----------------------|-----|------|
| Accesso (Art. 15) | [ ] Sì / [ ] No | 30gg | `05-legal/dsar-workflow.md` |
| Rettifica (Art. 16) | [ ] Sì / [ ] No | 30gg | |
| Cancellazione / Diritto all'oblio (Art. 17) | [ ] Sì / [ ] No | 30gg | |
| Limitazione (Art. 18) | [ ] Sì / [ ] No | 30gg | |
| Portabilità (Art. 20) | [ ] Sì / [ ] No | 30gg | |
| Opposizione (Art. 21) — **già coperto da unsubscribe** | [ ] Sì / [ ] No | Immediato | |
| Non sottoporre a decisioni automatizzate (Art. 22) | [ ] Sì / [ ] No | N/A | |

---

## 🇮🇹 Normativa Italiana Specifica

### DLgs 196/2003 (Codice Privacy) + GDPR
| Requisito | Status | Note |
|-----------|--------|------|
| **B2B cold email = Legittimo interesse** | [ ] Confermato | WP217 Opinion 6/2014, Garante provvedimenti |
| **Registro Pubbliche Opposizioni (RPO)** | [ ] Verificato | B2B generalmente escluso, ma verifica se target iscritti |
| **PEC — NON usare per marketing** | [ ] Confermato | Solo atti ufficiali, sanzioni se abuso |
| **Fatturazione elettronica (SDI)** | [ ] Pronto | Da giorno 1 post-vendita |

### DLgs 70/2003 (E-commerce / Servizi Società Informazione)
| Requisito | In/footer email? | In privacy policy? |
|-----------|------------------|-------------------|
| Ragione sociale / Denominazione | [ ] Sì / [ ] No | [ ] Sì / [ ] No |
| Sede legale | [ ] Sì / [ ] No | [ ] Sì / [ ] No |
| P.IVA / CF | [ ] Sì / [ ] No | [ ] Sì / [ ] No |
| Iscrizione REA (numero, Ufficio) | [ ] Sì / [ ] No | [ ] Sì / [ ] No |
| Capitale sociale (se Srl/SpA) | [ ] Sì / [ ] No | [ ] Sì / [ ] No |
| Stato liquidazione / concordato (se applicabile) | [ ] Sì / [ ] No | [ ] Sì / [ ] No |
| Link privacy policy | [ ] Sì / [ ] No | N/A |

### Legge 62/2001 (Editoria) — Se invii newsletter
| Requisito | Status | Note |
|-----------|--------|------|
| Registrazione tribunale (se periodico) | [ ] N/A / [ ] Sì | Cold email ≠ newsletter periodica |
| Direttore responsabile | [ ] N/A | |

---

## 🇺🇸 CAN-SPAM Act (Se contatti aziende US o email .com gestite da US)
| Requisito | Status | Implementazione |
|-----------|--------|-----------------|
| Header info accurati (From, To, Routing) | [ ] Sì / [ ] No | ESP config |
| Subject line non ingannevole | [ ] Sì / [ ] No | No clickbait, no "Re:" fake |
| Identificazione come pubblicità | [ ] Sì / [ ] No | Implicito in cold email B2B, ma chiara finalità |
| Indirizzo fisico mittente | [ ] Sì / [ ] No | Footer email |
| **Opt-out mechanism chiaro e funzionante** | [ ] Sì / [ ] No | Unsubscribe one-click ≤ 10 giorni lavorativi |
| Onora opt-out entro 10 giorni | [ ] Sì / [ ] No | Automazione ESP |
| Monitoraggio terze parti (se usi affiliate) | [ ] N/A / [ ] Sì | |

---

## 📧 ePrivacy Directive (Cookie / Tracking Email)
| Elemento | Status | Note |
|----------|--------|------|
| **Tracking pixel (open tracking)** | [ ] Sì / [ ] No / [ ] Disabilitato | Se sì: menziona in privacy policy, legittimo interesse |
| **Click tracking (link rewriting)** | [ ] Sì / [ ] No / [ ] Disabilitato | Se sì: menziona in privacy policy |
| Consenso per tracking (se richiesto da ePrivacy nazionale) | [ ] Verificato | Italia: legittimo interesse B2B per tracking minimo |

---

## ✅ CHECKLIST FINALE — PRE-LANCIO (Firma qui)

| # | Controllo | Fatto? | Data | Firma |
|---|-----------|--------|------|-------|
| 1 | LIA completato, firmato, versione controllata | [ ] | | |
| 2 | RoPA aggiornato (≤ 90gg) | [ ] | | |
| 3 | Privacy policy pubblicata, link in footer email | [ ] | | |
| 4 | Footer legale completo in OGNI email (DLgs 70/2003) | [ ] | | |
| 5 | Unsubscribe one-click funziona, testato, ≤ 24h | [ ] | | |
| 6 | Suppression list attiva, aggiornata real-time | [ ] | | |
| 7 | Email verificate (bounce < 2%) — ZeroBounce/equivalente | [ ] | | |
| 8 | DPA firmati con TUTTI i processatori (ESP, CRM, enrichment, verification) | [ ] | | |
| 9 | Breach log + processo 72h pronto + responsabile nominato | [ ] | | |
| 10 | DSAR workflow documentato + testato (rispondi in 30gg) | [ ] | | |
| 11 | Dominio dedicato `outreach.zakstudio.com` — SPF/DKIM/DMARC (p=reject) | [ ] | | |
| 12 | Warmup completato (4-6 sett, volume target raggiunto) | [ ] | | |
| 13 | Mail-tester.com score ≥ 9/10 | [ ] | | |
| 14 | Nessuna PEC in lista | [ ] | | |
| 15 | Nessun contatto in Registro Opposizioni (verificato) | [ ] | | |
| 16 | Sequenza email revisionata legal: no "Re:" fake, no clickbait, unsubscribe in tutte | [ ] | | |
| 17 | Case study / proof points veri, non ingannevoli (no fake testimonial) | [ ] | | |
| 18 | Calendly/Cal.com link funziona, privacy policy linkata | [ ] | | |

---

## 🟢 LEGAL SIGN-OFF

> **Io sottoscritto [NOME], in qualità di Titolare del Trattamento / DPO / Referente Legale, confermo che tutti i requisiti sopra sono soddisfatti e il cold email outreach per "Progetto ZAK Studio Web" è compliant GDPR, CAN-SPAM, DLgs 196/2003, DLgs 70/2003, ePrivacy.**

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| Titolare / Founder | | | |
| DPO / Referente Privacy (se nominato) | | | |
| Legale esterno (se consultato) | | | |

---

## 📞 Contatti Urgenze Legal
| Ruolo | Nome | Email | Telefono |
|-------|------|-------|----------|
| Titolare | | | |
| DPO / Referente Privacy | | | |
| Legale esterno (GDPR/Privacy) | | | |
| Garante Privacy (se breach notificabile) | protocollo@gpdp.it | +39 06 696771 | |

---

**Prossima revisione programmata:** [DATA + 90 GIORNI] — RoPA, LIA, DPA, breach log, DSAR log