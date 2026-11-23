# RoPA — Record of Processing Activities (GDPR Art. 30)
**Aggiornato al: [DATA ODIERNA] — Prossima revisione: [DATA + 90 GIORNI]**

---

## 1. TITOLARE DEL TRATTAMENTO (Art. 30.1.a)

| Elemento | Valore |
|----------|--------|
| **Ragione sociale / Denominazione** | [ZAK Studio Web di Tuo Nome Cognome] |
| **Forma giuridica** | [Ditta individuale / Srl / Srls / Altro] |
| **Sede legale** | [Via, CAP, Città, Provincia, Italia] |
| **P.IVA / CF** | [XXXXXXXXXX / CFXXXXXXXXXXXXXX] |
| **Iscrizione REA** | [XX] - [XXXXXX] — [Camera di Commercio] |
| **PEC** | [pec@dominioprivato.it] |
| **Email privacy** | [privacy@zakstudio.com] |
| **DPO / Referente Privacy** | [Nome Cognome / "Non nominato (sotto soglia Art. 37)" / "Esterno: Studio Legale X"] |
| **Rappresentante UE (se extra-UE)** | N/A (stabilito in Italia) |

---

## 2. ATTIVITÀ DI TRATTAMENTO: COLD EMAIL OUTREACH B2B

### 2.1 Scheda Trattamento (Art. 30.1.b-g)

| Campo Art. 30 | Valore |
|---------------|--------|
| **Nome trattamento** | Cold Email Outreach B2B — Vendita servizi creazione siti web |
| **Finalità (Art. 30.1.b)** | Sviluppo commerciale: contattare decision maker aziende target (ICP) per offrire servizi creazione siti web conversion-focused, generare call discovery, chiudere contratti |
| **Base giuridica (Art. 30.1.b)** | **Legittimo interesse (Art. 6.1.f GDPR)** — LIA documentato in `legitimate-interest-assessment.md` |
| **Categorie interessati (Art. 30.1.c)** | Decision maker aziende B2B: Titolari/CEO, Marketing Manager, Direttori Commerciali, CTO/Technical Director — settori manifatturiero, B2B services, 10-50 dip, Nord Italia |
| **Categorie dati personali (Art. 30.1.c)** | **Dati identificativi business:** Nome, cognome, email aziendale, ruolo/titolo, nome azienda, settore, dimensioni azienda (dip/fatturato), località<br>**Dati comportamentali/derivati:** Trigger signal (es. sito vecchio, nuova linea), pain point hypothesis, personalization hook, engagement (open, click, reply, unsubscribe) |
| **Categorie destinatari (Art. 30.1.d)** | **Interni:** Titolare, eventuali collaboratori commerciali<br>**Esterni (Processori Art. 28):**<br>1. ESP — Resend / SendGrid / Customer.io (invio email, tracking)<br>2. CRM — HubSpot / Pipedrive / Attio (gestione pipeline)<br>3. Email Verification — ZeroBounce / MillionVerifier / NeverBounce (verifica deliverability)<br>4. Enrichment — Apollo.io / Hunter.io / Lusha (dati contatti)<br>5. Calendar — Calendly / Cal.com (booking call)<br>6. Hosting/Cloud — Vercel / AWS / Hetzner (infrastruttura) |
| **Trasferimenti paesi terzi (Art. 30.1.e)** | [Elenca se ESP/processor extra-UE]<br>Es. SendGrid (US) — **EU-US Data Privacy Framework** (certificato luglio 2023)<br>Es. HubSpot (US) — **SCCs + Supplementary Measures**<br>→ TIA (Transfer Impact Assessment) in `transfer-impact-assessment.md` |
| **Periodo conservazione (Art. 30.1.f)** | **Prospect attivi:** 12 mesi dall'ultimo engagement (open/click/reply)<br>**Opt-out/unsubscribe:** Cancellazione immediata da liste attive, mantenimento 30gg in suppression list per compliance<br>**DSAR cancellazione:** Entro 30gg da richiesta<br>**Contratto chiuso:** Spostato in CRM clienti, retention per obblighi fiscali (10 anni fatture) |
| **Misure sicurezza (Art. 30.1.g)** | **Tecniche:** TLS 1.2+ in transito, cifratura a riposo (ESP/CRM), accesso 2FA, principle least privilege<br>**Organizzative:** DPA Art. 28 con tutti i processatori, formazione privacy team, breach log 72h, DSAR workflow, LIA documentato, RoPA aggiornato ≤90gg, minimizzazione dati (solo business), no dati sensibili |

---

## 3. ALTRI TRATTAMENTI (Se applicabili)

| # | Trattamento | Finalità | Base Giuridica | Categorie Dati | Conservazione |
|---|-------------|----------|----------------|----------------|---------------|
| 2 | Gestione clienti / Contratti | Esecuzione contratto, fatturazione, delivery | Contratto (Art. 6.1.b) + Obbligo legale (Art. 6.1.c) | Anagrafica, fiscali, progetto, comunicazioni | 10 anni (fiscali) / Durata rapporto + 5 anni |
| 3 | Fatturazione elettronica (SDI) | Obbligo legale | Obbligo legale (Art. 6.1.c) | Dati fattura, P.IVA, SDI | 10 anni |
| 4 | Analytics sito web (zakstudio.com) | Ottimizzazione, marketing | Consenso (Art. 6.1.a) / Legittimo interesse | IP anonimizzato, pagine, referrer, eventi | 14 mesi (GA4) / 26 mesi (Matomo) |
| 5 | Newsletter opt-in (se separata) | Marketing diretto | Consenso (Art. 6.1.a) | Email, nome, preferenze | Fino a revoca consenso |

---

## 4. PROCESSORI — DPA ART. 28 STATUS

| Processore | Servizio | DPA Firmato | Data Firma | SCCs / DPF / Adeguatezza | Sub-processori notificati |
|------------|----------|-------------|------------|--------------------------|---------------------------|
| Resend | Email sending | [ ] Sì / [ ] No | | EU (nessun trasferimento) | [ ] Sì / [ ] No |
| SendGrid | Email sending | [ ] Sì / [ ] No | | EU-US DPF (certificato) | [ ] Sì / [ ] No |
| HubSpot | CRM + Marketing | [ ] Sì / [ ] No | | SCCs 2021 + Supplementary | [ ] Sì / [ ] No |
| Pipedrive | CRM | [ ] Sì / [ ] No | | EU (Estonia) | [ ] Sì / [ ] No |
| ZeroBounce | Email verification | [ ] Sì / [ ] No | | US — SCCs | [ ] Sì / [ ] No |
| Apollo.io | Enrichment | [ ] Sì / [ ] No | | US — SCCs | [ ] Sì / [ ] No |
| Calendly | Booking | [ ] Sì / [ ] No | | US — SCCs | [ ] Sì / [ ] No |
| Cal.com | Booking | [ ] Sì / [ ] No | | EU (opzione self-host) | [ ] Sì / [ ] No |
| Vercel | Hosting | [ ] Sì / [ ] No | | EU (Frankfurt) / US — DPF | [ ] Sì / [ ] No |

> **Regola:** Nessun processore senza DPA firmato. Verifica trimestrale sub-processori.

---

## 5. TRASFERIMENTI EXTRA-UE — TIA STATUS

| Trasferimento | Processore | Meccanismo | TIA Completato | Supplementary Measures | Data TIA |
|---------------|------------|------------|----------------|------------------------|----------|
| Email sending | SendGrid | EU-US DPF | [ ] Sì / [ ] No | Nessuna (adequacy) | |
| CRM | HubSpot | SCCs 2021 | [ ] Sì / [ ] No | Cifratura, accessi limitati, audit diritti | |
| Verification | ZeroBounce | SCCs 2021 | [ ] Sì / [ ] No | Solo email hash, no PII persistente | |
| Enrichment | Apollo.io | SCCs 2021 | [ ] Sì / [ ] No | Dati solo business, retention 30gg | |
| Booking | Calendly | SCCs 2021 | [ ] Sì / [ ] No | Dati minimi (nome, email, meeting) | |

---

## 6. DIRITTI INTERESSATI — WORKFLOW STATUS (Art. 15-22)

| Diritto | Processo Documentato | SLA | Tool/Canale | Testato? |
|---------|---------------------|-----|-------------|----------|
| Accesso (Art. 15) | [ ] Sì | 30gg | Email privacy@ / Form DSAR | [ ] Sì |
| Rettifica (Art. 16) | [ ] Sì | 30gg | CRM update + ESP suppression | [ ] Sì |
| Cancellazione (Art. 17) | [ ] Sì | 30gg | CRM delete + ESP suppress + backup purge | [ ] Sì |
| Limitazione (Art. 18) | [ ] Sì | 30gg | Flag CRM + ESP suppress | [ ] Sì |
| Portabilità (Art. 20) | [ ] Sì | 30gg | Export JSON/CSV da CRM | [ ] Sì |
| Opposizione (Art. 21) | [ ] Sì | **Immediato** | Unsubscribe link + suppression list | [ ] Sì |

---

## 7. DATA BREACH LOG — ART. 33.5 STATUS

| Campo | Valore |
|-------|--------|
| **Registro breach attivo** | [ ] Sì — File: `breach-log.md` |
| **Responsabile notifica 72h** | [Nome Cognome / Ruolo] |
| **Processo notifica Garante** | Documentato in `breach-log.md` |
| **Processo notifica interessati (Art. 34)** | Documentato (se rischio alto) |
| **Breach ultimi 12 mesi** | [Numero] — [0 = nessuno] |
| **Test piano incarico (tabletop)** | [Data ultimo test / "Mai — da programmare"] |

---

## 8. DPIA — ART. 35 STATUS (Se applicabile)

| Trattamento ad alto rischio? | [ ] Sì / [ ] No |
|------------------------------|-----------------|
| **Cold email B2B** | **No** — Dati low-sensitivity, volume controllato, safeguards forti, LIA ok |
| **Profilazione automatizzata** | [ ] Sì / [ ] No — Se scoring lead automatizzato → DPIA richiesta |
| **Monitoraggio sistematico larga scala** | [ ] Sì / [ ] No |
| **Dati sensibili Art. 9** | [ ] Sì / [ ] No — Mai trattati |

> Se qualsiasi "Sì" → DPIA obbligatoria per quel trattamento (Art. 35.7 a-d + consultazione DPO Art. 35.2 + eventuale consultazione preventiva Garante Art. 36)

---

## 9. JOINT CONTROLLERSHIP (Art. 26) — Se applicabile

| Partner | Accordo Art. 26 | Punti chiave | Data |
|---------|-----------------|--------------|------|
| [Es. Agenzia partner co-marketing] | [ ] Sì / [ ] No | Riparto responsabilità, punti contatto, diritti interessati | |

---

## 10. STORICO AGGIORNAMENTI ROPA

| Data | Versione | Cambiamenti | Autore | Approvato da |
|------|----------|-------------|--------|--------------|
| [DATA ODIERNA] | 1.0 | Creazione iniziale — Cold email outreach B2B | [Tuo Nome] | [Tuo Nome] |
| | | | | |

---

## 11. FIRMA E CONFERMA

> **Confermo che questo RoPA è completo, accurato e aggiornato alla data odierna per tutti i trattamenti effettuati da ZAK Studio Web.**

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare del Trattamento** | [Tuo Nome Cognome] | | |
| **DPO / Referente Privacy** | [Nome / "Non nominato"] | | |

---

**PROSSIMA REVISIONE OBBLIGATORIA: [DATA ODIERNA + 90 GIORNI]**

*Nota: Art. 30 richiede aggiornamento "senza ingiustificato ritardo" per cambiamenti. 90gg è best practice per revisione periodica anche senza cambiamenti.*