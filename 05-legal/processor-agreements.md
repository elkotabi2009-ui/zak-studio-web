# Processor Agreements — DPA Art. 28 GDPR
**Registro DPA firmati con tutti i processatori. Obbligatorio prima di inviare QUALSIASI dato.**

---

## 1. CHECKLIST DPA ART. 28.3 (a-j) — CLAUSOLE OBBLIGATORIE

Ogni DPA DEVE contenere:

| Lettera Art. 28.3 | Clausola | Verifica nel DPA |
|-------------------|----------|------------------|
| **(a)** | Tratta dati solo su istruzioni documentate titolare (salvo obbligo UE/Stato membro) | [ ] Sì |
| **(b)** | Persone autorizzate al trattamento vincolate a riservatezza | [ ] Sì |
| **(c)** | Misure sicurezza Art. 32 appropriate (cifratura, riservatezza, integrità, disponibilità, resilienza) | [ ] Sì |
| **(d)** | Sub-processori: solo con consenso scritto preventivo (generale o specifico) + notifica modifiche | [ ] Sì |
| **(e)** | Assistenza titolare per diritti interessati (Art. 15-22) considerando natura trattamento | [ ] Sì |
| **(f)** | Assistenza titolare per Art. 32-36 (sicurezza, breach, DPIA, consultazione preventiva) | [ ] Sì |
| **(g)** | A scelta titolare: cancella o restituisce dati a fine servizio + cancella copie esistenti | [ ] Sì |
| **(h)** | Mette a disposizione titolare info per dimostrare compliance + audit/ispezioni | [ ] Sì |
| **(i)** | Informa titolare se istruzione viola GDPR/UE/Stato membro | [ ] Sì |
| **(j)** | Trasferimenti extra-UE: solo con garanzie adeguate (Art. 44-49) | [ ] Sì |

---

## 2. REGISTRO DPA — STATO PER PROCESSORE

| # | Processore | Servizio | DPA Firmato? | Data Firma | Scadenza | Clausole 28.3 Complete? | Sub-processori Notificati? | Trasferimenti Extra-UE | Meccanismo Trasferimento | Note |
|---|------------|----------|--------------|------------|----------|------------------------|---------------------------|------------------------|-------------------------|------|
| 1 | **Resend** | Email sending + tracking | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | |
| 2 | **SendGrid** (Twilio) | Email sending + tracking | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | EU-US DPF certificato |
| 3 | **HubSpot** | CRM + Marketing Automation | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | SCCs 2021 + Suppl. Measures |
| 4 | **Pipedrive** | CRM Sales | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | Sede Estonia (EU) |
| 5 | **ZeroBounce** | Email Verification | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | Solo email hash, retention breve |
| 6 | **Apollo.io** | Enrichment / Contatti | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | Dati solo business |
| 7 | **Calendly** | Booking / Calendar | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | Dati minimi meeting |
| 8 | **Cal.com** | Booking (self-host option) | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | Opzione EU hosting |
| 9 | **Vercel** | Hosting / Edge Functions | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | Regione Frankfurt (EU) |
| 10 | **Altro** | | [ ] Sì / [ ] No | | | [ ] Sì / [ ] Parziale / [ ] No | [ ] Sì / [ ] No / [ ] N/A | [ ] Sì / [ ] No | [EU / DPF / SCCs / Adeguatezza] | |

> **Regola:** Nessun dato a processore senza DPA firmato. Se "Parziale" o "No" → BLOCCO invio dati.

---

## 3. SUB-PROCESSORI — MONITORAGGIO

### 3.1 Sub-processori Critici (da notificare per iscritto)
| Processore Principale | Sub-processore | Servizio | Luogo | Notificato? | Data Notifica | DPA Catena? |
|----------------------|----------------|----------|-------|-------------|---------------|-------------|
| SendGrid | AWS / Google Cloud | Infrastructure | US / EU | [ ] Sì / [ ] No | | [ ] Sì |
| HubSpot | AWS / AWS sub | Infrastructure | US | [ ] Sì / [ ] No | | [ ] Sì |
| Vercel | AWS / Cloudflare | Infrastructure / CDN | US / EU | [ ] Sì / [ ] No | | [ ] Sì |

### 3.2 Processo Notifica Sub-processori (Art. 28.3.d)
1. **Consenso generale** nel DPA per categorie sub-processori (es. infrastructure, support, analytics)
2. **Notifica preventiva** nuovi sub-processori specifici → 30gg per obiezione titolare
3. **Registro** aggiornato in questa tabella
4. **DPA catena** : sub-processore vincolato agli stessi obblighi (Art. 28.4)

---

## 4. TRASFERIMENTI EXTRA-UE — DPA ADDENDUM

### 4.1 Standard Contractual Clauses (SCCs) 2021 — Modulo Controller-Processor
| Processore | Modulo SCCs Firmato? | Data | Allegato I (Descrizione trattamento) | Allegato II (Misure sicurezza) | Allegato III (Sub-processori) |
|------------|---------------------|------|--------------------------------------|-------------------------------|-------------------------------|
| HubSpot | [ ] Sì / [ ] No | | [ ] Completo | [ ] Completo | [ ] Completo |
| ZeroBounce | [ ] Sì / [ ] No | | [ ] Completo | [ ] Completo | [ ] Completo |
| Apollo.io | [ ] Sì / [ ] No | | [ ] Completo | [ ] Completo | [ ] Completo |
| Calendly | [ ] Sì / [ ] No | | [ ] Completo | [ ] Completo | [ ] Completo |

### 4.2 EU-US Data Privacy Framework (DPF) — Adeguatezza Luglio 2023
| Processore | Certificato DPF? | Verifica Lista DPF (dataprivacyframework.gov) | Data Verifica |
|------------|------------------|-----------------------------------------------|---------------|
| SendGrid (Twilio) | [ ] Sì / [ ] No | [ ] Verificato | |
| Altri US | [ ] Sì / [ ] No | [ ] Verificato | |

> **Nota:** DPF = adeguatezza, no SCCs necessari. Ma verifica certificazione ATTIVA periodicamente.

### 4.3 Transfer Impact Assessment (TIA) — Schrems II
| Processore Extra-UE | TIA Completato? | Data | Risk Level | Supplementary Measures | Riesame Programmato |
|---------------------|-----------------|------|------------|------------------------|---------------------|
| HubSpot (US) | [ ] Sì / [ ] No | | [Basso/Medio/Alto] | [Cifratura, accessi limitati, audit diritti, no bulk access gov] | [Data + 12 mesi] |
| ZeroBounce (US) | [ ] Sì / [ ] No | | [Basso/Medio/Alto] | [Solo email hash, retention 30gg, no PII persistente] | [Data + 12 mesi] |
| Apollo.io (US) | [ ] Sì / [ ] No | | [Basso/Medio/Alto] | [Dati solo business, no sensibili, retention breve] | [Data + 12 mesi] |
| Calendly (US) | [ ] Sì / [ ] No | | [Basso/Medio/Alto] | [Dati minimi meeting, cifratura] | [Data + 12 mesi] |

---

## 5. AUDIT E MONITORAGGIO PROCESSORI (Art. 28.3.h)

| Attività | Frequenza | Responsabile | Ultima Esecuzione | Prossima | Risultato |
|----------|-----------|--------------|-------------------|----------|-----------|
| **Review DPA compliance** (checklist Art. 28.3) | Annuale | [Titolare / DPO] | [Data] | [Data + 12 mesi] | [Pass / Gap] |
| **Verifica sub-processori notificati** | Semestrale | [Titolare] | [Data] | [Data + 6 mesi] | [Aggiornato] |
| **Verifica certificazioni (ISO 27001, SOC 2, DPF)** | Annuale | [Titolare] | [Data] | [Data + 12 mesi] | [Validi] |
| **Test diritto cancellazione (Art. 17) vs processor** | Annuale | [Titolare / Tech] | [Data] | [Data + 12 mesi] | [Funziona] |
| **Test breach notification flow processor → titolare** | Annuale | [Breach Owner] | [Data] | [Data + 12 mesi] | [Entro 24h] |
| **Richiedi report sicurezza / pentest summary** | Annuale | [Titolare] | [Data] | [Data + 12 mesi] | [Ricevuto] |

---

## 6. TEMPLATE RICHIESTA DPA A NUOVO PROCESSORE

> **Oggetto:** Richiesta Data Processing Agreement (Art. 28 GDPR) — [Nome Vostro Servizio]
>
> Gentile [Nome Contatto Privacy/Legal],
>
> Siamo ZAK Studio Web (Titolare del trattamento, P.IVA [XXXXXXXXXX]), stiamo valutando / iniziando a utilizzare il vostro servizio **[Nome Servizio]** per [finalità: es. invio email transazionali, CRM, verifica email].
>
> Ai sensi dell'Art. 28 GDPR, necessitiamo di un **Data Processing Agreement (DPA)** che includa tutte le clausole dell'Art. 28.3 (a-j), prima di trasmettervi qualsiasi dato personale.
>
> **Dati che trattereste per nostro conto:**
> - Categorie: [Email aziendali, nomi, ruoli, engagement data, ecc.]
> - Volume stimato: [Es. 200 record/mese, 5000 email/mese]
> - Finalità: [Cold email outreach B2B / Gestione pipeline / Verifica deliverability]
> - Durata: [Fino a risoluzione contratto]
>
> **Requisiti specifici:**
> 1. Sub-processori: notifica preventiva 30gg + consenso per nuovi specifici
> 2. Trasferimenti extra-UE: solo con garanzie adeguate (DPF / SCCs 2021 + TIA)
> 3. Assistenza diritti interessati (Art. 15-22) entro 10gg nostra richiesta
> 4. Breach notification a noi entro 24h (per nostra notifica 72h Garante)
> 5. Cancellazione/Restituzione dati a fine servizio + certificazione
> 6. Audit rights / SOC 2 Type II / ISO 27001 report disponibili
>
> Allego il nostro **DPA Template** (basato su SCCs 2021 Modulo Controller-Processor) per accelerare. In caso abbiate vostro DPA standard, inviatelo per review.
>
> Disponibili per call di allineamento.
>
> Cordiali saluti,
> [Tuo Nome]
> Titolare / DPO
> ZAK Studio Web
> privacy@zakstudio.com

---

## 7. DPA TEMPLATE — ALLEGATO STANDARD (Base SCCs 2021 Modulo Controller-Processor)

> **Nota:** Usa questo come base se processore non ha DPA proprio. Personalizza Allegati I, II, III.

```markdown
# DATA PROCESSING AGREEMENT (Art. 28 GDPR)
## Tra: ZAK Studio Web ("Titolare") e [Nome Processore] ("Processore")

**1. Oggetto, Durata, Natura, Finalità** — Vedì Allegato I
**2. Categorie Dati e Interessati** — Vedì Allegato I
**3. Obblighi Processore (Art. 28.3 a-j)** — Clause standard SCCs 2021 Sezione II
**4. Sub-processori** — Consenso generale per categorie [infrastructure, support, analytics]; notifica 30gg per nuovi specifici; DPA catena vincolante
**5. Trasferimenti Extra-UE** — Solo con: Adeguatezza / DPF / SCCs 2021 + Supplementary Measures (Allegato II)
**6. Diritti Interessati** — Assistenza entro 10gg richiesta scritta titolare
**7. Sicurezza (Art. 32)** — Misure Allegato II + notifica breach entro 24h
**8. DPIA / Consultazione Preventiva** — Assistenza su richiesta
**9. Cancellazione / Restituzione** — A scelta titolare, entro 30gg fine servizio, certificazione scritta
**10. Audit / Ispezioni** — Su richiesta, con preavviso ragionevole, SOC 2 / ISO 27001 accepted
**11. Responsabilità / Indennizzo** — Per legge
**12. Legge Applicabile / Foro** — Legge Italiana / Foro [Tua Città]

**ALLEGATO I:** Descrizione Trattamento (finalità, categorie dati, interessati, durata)
**ALLEGATO II:** Misure Tecniche/Organizzative (cifratura, accessi, MFA, monitoring, backup, pentest)
**ALLEGATO III:** Sub-processori Autorizzati (lista + sedi + DPA catena)

Firmato: _________________ (Titolare) _________________ (Processore) Data: _______
```

---

## 8. FIRMA REGISTRO DPA

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare del Trattamento** | [Tuo Nome] | | |
| **DPO / Referente Privacy** | [Nome] | | |

**Prossima revisione registro:** [DATA ODIERNA + 6 MESI] o ad ogni nuovo processore / cambio sub-processori