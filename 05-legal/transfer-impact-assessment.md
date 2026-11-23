# Transfer Impact Assessment (TIA) — Schrems II Compliance
**Per ogni trasferimento dati extra-UE verso processori (ESP, CRM, Enrichment, Calendar). Obbligatorio se non c'è adeguatezza.**

---

## 1. PANORAMICA TRASFERIMENTI

| # | Processore | Servizio | Sede Legale | Dati Trasferiti | Meccanismo Base | TIA Richiesto? |
|---|------------|----------|-------------|-----------------|-----------------|----------------|
| 1 | SendGrid (Twilio) | Email Sending | US (Denver) | Email, nome, tracking data | **EU-US DPF** (Adeguatezza) | No (ma verifica certificazione) |
| 2 | HubSpot | CRM + Marketing | US (Cambridge, MA) | Contatti, deal, email history, engagement | **SCCs 2021** + Supplementary Measures | **SÌ** |
| 3 | ZeroBounce | Email Verification | US (San Francisco) | Email (hash/temporaneo) | **SCCs 2021** | **SÌ** |
| 4 | Apollo.io | Enrichment / Contatti | US (San Francisco) | Nome, email, ruolo, azienda, LinkedIn | **SCCs 2021** | **SÌ** |
| 5 | Calendly | Booking / Calendar | US (Atlanta) | Nome, email, meeting details | **SCCs 2021** | **SÌ** |
| 6 | Resend | Email Sending | EU (vari) / US | Email, tracking | **EU** (se regia EU) / DPF | Verifica regia |
| 7 | Vercel | Hosting / Edge | US (SF) / EU (FRA) | Logs, analytics, PII se forms | **EU** (se regione FRA) / DPF | Verifica regione |

---

## 2. TIA TEMPLATE PER PROCESSORE (Compila per ognuno con SCCs)

### TIA-01: HubSpot (CRM)

#### 2.1 Descrizione Trasferimento
| Elemento | Dettaglio |
|----------|-----------|
| **Esportatore (Controller)** | ZAK Studio Web — [Indirizzo], Italia |
| **Importatore (Processor)** | HubSpot, Inc. — 25 First Street, Cambridge, MA 02141, USA |
| **Categorie Dati** | Contatti (nome, email, ruolo, azienda), Deal, Email history, Engagement (open, click, reply), Custom fields (budget, timeline, objective) |
| **Categorie Interessati** | Decision maker B2B (prospect/clienti), Collaboratori interni |
| **Finalità** | Gestione pipeline vendita, marketing automation, reporting, compliance (DSAR, suppression) |
| **Volume** | ~200 record/mese (prospect), ~50 clienti attivi |
| **Frequenza** | Real-time (sync bidirezionale CRM ↔ ESP) |
| **Durata** | Durata contratto + 10 anni obblighi fiscali (dati clienti) / 12 mesi (prospect) |

#### 2.2 Valutazione Legge Paese Terzo (EDPB Rec 01/2020 § 46-50)
| Fattore | Valutazione | Fonte |
|---------|-------------|-------|
| **Legge sorveglianza US (FISA 702, EO 12333, CLOUD Act)** | Accesso potenziale autorità US a dati cloud per sicurezza nazionale | EDPB, Schrems II, pubblicazioni CIPL |
| **Richieste obbligatorie disclosure** | Sì — National Security Letters, FISA orders, CLOUD Act warrants | US Law |
| **Rimedi giudiziari per non-US persons** | Limitati — PCLOB oversight, ma no standing diretto Corte US per EU citizens | PCLOB Report 2014, 2023 |
| **Trasparenza richieste** | Rapporti trasparenza annuali (HubSpot, Twilio, altri) | HubSpot Transparency Report |
| **Conclusione rischio accesso indebito** | **Medio** — Dati business low-sensitivity, ma accesso teorico possibile | |

#### 2.3 Misure Contrattuali (SCCs 2021 Modulo Controller-Processor)
| Clausola SCCs | Implementazione HubSpot | Note |
|---------------|------------------------|------|
| **Cl. 7-8: Obblighi importatore** | DPA HubSpot include SCCs 2021 + UK Addendum | Verificato DPA signed |
| **Cl. 9: Sub-processori** | Lista sub-processori pubblicata, notifica 30gg, opt-out | HubSpot sub-processor list |
| **Cl. 10: Diritti interessati** | Tool DSAR automatizzato, API per cancellazione/accesso | HubSpot GDPR tools |
| **Cl. 11: Sicurezza** | SOC 2 Type II, ISO 27001, cifratura AES-256 at rest, TLS 1.2+ transit | HubSpot Security page |
| **Cl. 12: Breach notification** | Notifica entro 24h a controller (contrattuale) | DPA Cl. 12 |
| **Cl. 13-14: Audit / Ispezioni** | SOC 2 report available, audit rights per DPA | SOC 2 Type II annuale |
| **Cl. 15: Legge applicabile / Foro** | Delaware US / GDPR Art. 28.3 | Standard SCCs |

#### 2.4 Misure Supplementari (EDPB Rec 01/2020 § 56-89) — **OBBLIGATORIE se rischio residuo**

| Categoria | Misura Implementata | Verifica |
|-----------|---------------------|----------|
| **Contrattuali** | SCCs 2021 firmate + UK Addendum | ✅ DPA signed |
| **Organizzative** | Policy: solo dati business necessari, no dati sensibili, minimizzazione campi | ✅ Policy interna |
| **Organizzative** | Formazione team: no export bulk dati, no download CSV non necessario | ✅ Training log |
| **Tecniche — Cifratura** | TLS 1.2+ transit (API), AES-256 at rest (HubSpot infra) | ✅ HubSpot SOC 2 |
| **Tecniche — Pseudonimizzazione** | Email come identifier primario, no名字+CF in campi custom sensibili | ✅ Schema CRM |
| **Tecniche — Access Control** | SSO + MFA obbligatorio, ruoli least privilege (Solo Sales vede deal, Marketing vede contatti) | ✅ HubSpot settings |
| **Tecniche — Logging/Monitoring** | Audit log HubSpot (tutti accessi, export, modifiche) + SIEM interno alert su export anomali | ✅ Audit log enabled |
| **Tecniche — Data Localization (Opzionale)** | Non disponibile su HubSpot standard (solo Enterprise con data residency EU — costoso) | ⚠️ Non attivo — Risk accepted |
| **Contrattuali — Government Access** | HubSpot si impegna a: notificare controller se richiesta gov (salvo gag order), contestare richieste eccessive, transparency report | ✅ DPA + Transparency Report |

#### 2.5 Valutazione Residuale
| Rischio Residuo | Livello | Giustificazione |
|-----------------|---------|-----------------|
| Accesso autorità US a dati business low-sensitivity (nome, email aziendale, ruolo) | **Basso** | Dati già pubblici/semi-pubblici (LinkedIn, sito web), no dati sensibili, no finanziari, no salute, volume limitato |

**CONCLUSIONE TIA HUBSPOT:** ✅ **TRASFERIMENTO AUTORIZZATO** — SCCs 2021 + Supplementary Measures adeguate per rischio residuo basso.

---

### TIA-02: ZeroBounce (Email Verification)

#### 2.1 Descrizione Trasferimento
| Elemento | Dettaglio |
|----------|-----------|
| **Importatore** | ZeroBounce LLC — US |
| **Dati** | Solo email address (string) — NO nome, no azienda, no PII aggiuntivo |
| **Finalità** | Verifica deliverability (valid/catch-all/invalid/spamtrap) |
| **Retention ZeroBounce** | 30 giorni (policy dichiarata) poi auto-purge |
| **Volume** | ~200 email/batch, batch settimanali |

#### 2.2 Misure Supplementari
| Misura | Implementazione |
|--------|-----------------|
| **Minimizzazione estrema** | Solo email hash SHA-256 inviato (non email plaintext) — ZeroBounce accetta hash? No, richiede email. → Invia solo email, nessun altro campo |
| **Retention breve** | Contrattuale 30gg max — verifica policy ZeroBounce |
| **No sub-processori critici** | ZeroBounce usa AWS US — SCCs catena |
| **Cancellazione garantita** | API delete / account delete purga tutto |

#### 2.3 Conclusione
**Rischio residuo: BASSO** — Solo email, retention breve, no correlazione identità. ✅ AUTORIZZATO.

---

### TIA-03: Apollo.io (Enrichment)

#### 2.1 Descrizione Trasferimento
| Elemento | Dettaglio |
|----------|-----------|
| **Importatore** | Apollo.io Inc. — US |
| **Dati Inviati** | Email aziendale (per lookup) — Riceve: nome, ruolo, LinkedIn, telefono (se pubblico), azienda, size, tech stack |
| **Finalità** | Arricchimento contatti per personalizzazione outreach |
| **Dati Sensibili** | NO — Solo dati business/professionali pubblici |

#### 2.2 Misure Supplementari
| Misura | Implementazione |
|--------|-----------------|
| **Solo lookup email** | Non inviamo nome/azienda — solo email per match |
| **Dati ricevuti = già pubblici** | LinkedIn, sito web, registri — basso rischio |
| **Retention Apollo** | Policy: dati arricchiti retention account — richiedi cancellazione via API/DPA |
| **Opt-out Apollo** | Honor global opt-out list |

#### 2.3 Conclusione
**Rischio residuo: BASSO** — Dati business pubblici, minimizzazione input. ✅ AUTORIZZATO.

---

### TIA-04: Calendly (Booking)

#### 2.1 Descrizione Trasferimento
| Elemento | Dettaglio |
|----------|-----------|
| **Importatore** | Calendly LLC — US |
| **Dati** | Nome, email, risposte 8 campi custom (budget, timeline, objective, ecc.) |
| **Finalità** | Scheduling discovery call |
| **Volume** | ~4-10 booking/mese |

#### 2.2 Misure Supplementari
| Misura | Implementazione |
|--------|-----------------|
| **Campi minimi** | Solo necessari per call (nome, email, contesto business) |
| **No dati sensibili** | Budget/timeline = business info, non sensibili |
| **Alternative EU** | Cal.com self-hosted su VPS EU (Hetzner) — elimina trasferimento | ⚠️ **Considera migrazione** |

#### 2.3 Conclusione
**Rischio residuo: BASSO-MEDIO** — Dati forniti volontariamente per call. ✅ AUTORIZZATO ma **migrazione a Cal.com EU consigliata per risk reduction**.

---

## 3. REGISTRO TIA — STATO COMPLESSIVO

| Processore | Meccanismo | TIA Completato | Risk Level | Supplementary Measures | Prossima Revisione |
|------------|------------|----------------|------------|------------------------|-------------------|
| SendGrid (Twilio) | EU-US DPF | [ ] Sì (verifica certificazione) | Basso | Nessuna (adequacy) | Mensile (check DPF status) |
| HubSpot | SCCs 2021 | ✅ **QUESTO DOC** | Basso | Cifratura, Access Control, Minimizzazione, Audit Log, Gov Access Clause | 12 mesi / post-breach |
| ZeroBounce | SCCs 2021 | ✅ **QUESTO DOC** | Basso | Solo email, retention 30gg, no correlazione | 12 mesi |
| Apollo.io | SCCs 2021 | ✅ **QUESTO DOC** | Basso | Solo email input, dati output pubblici | 12 mesi |
| Calendly | SCCs 2021 | ✅ **QUESTO DOC** | Basso-Medio | Campi minimi, eval Cal.com EU | 6 mesi (target migrazione) |
| Resend | EU / DPF | [ ] Verifica regia | TBD | TBD | Al setup |
| Vercel | EU (FRA) | [ ] Configura regione FRA | Basso | Forza regione EU in progetto | Al setup |

---

## 4. MONITORAGGIO CONTINUO

| Trigger Riesame TIA | Frequenza | Azione |
|---------------------|-----------|--------|
| **Cambiamento legislativo US/EU** (es. novo EO, sentenza Corte) | Ad evento | Riesame urgente tutti TIA |
| **Nuovo sub-processore critico notificato** | Ad notifica | Valuta impatto su TIA esistente |
| **Breach presso processore** | Ad evento | Riesame misure supplementari efficacia |
| **Scadenza SCCs / DPF renewal** | Annuale | Rinnova / riesamina |
| **Nuovo processore extra-UE** | Pre-onboarding | TIA completo prima primo dato |
| **Revisione periodica obbligatoria** | **12 mesi** | Tutti i TIA sopra |

---

## 5. DOCUMENTAZIONE ALLEGATA (Per Audit Garante)

- [ ] DPA firmati con SCCs 2021 (Modulo Controller-Processor) per cada processore
- [ ] UK Addendum (se UK data flow)
- [ ] HubSpot: SOC 2 Type II report (ultimo), ISO 27001 cert, Transparency Report
- [ ] ZeroBounce: Security policy, Data retention policy, Sub-processor list
- [ ] Apollo.io: Security whitepaper, Privacy policy, DPA
- [ ] Calendly: Security page, DPA, Sub-processor list
- [ ] SendGrid: DPF certification proof (screenshot dataprivacyframework.gov), SOC 2
- [ ] Resend/Vercel: Region configuration proof, Security docs
- [ ] **Questo TIA document** (firmato Titolare + DPO)

---

## 6. FIRMA E APPROVAZIONE

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare del Trattamento** | [Tuo Nome] | | |
| **DPO / Referente Privacy** | [Nome] | | |
| **Legale Esterno (se consultato)** | [Studio / Avvocato] | | |

**Prossima revisione programmata:** [DATA ODIERNA + 12 MESI] o ad evento trigger sopra