# Data Breach Log — Art. 33.5 GDPR
**Registro di TUTTI gli incidenti (notificabili e non). Obbligatorio per accountability.**

---

## 1. RESPONSABILI BREACH MANAGEMENT

| Ruolo | Nome | Email | Telefono | Disponibilità |
|-------|------|-------|----------|---------------|
| **Breach Owner (decide notifica)** | [Titolare / Tuo Nome] | privacy@zakstudio.com | [Tel] | H24 |
| **DPO / Privacy Lead** | [Nome / Esterno] | dpo@zakstudio.com | [Tel] | Working hours + emergenza |
| **Tech Lead (containment/forensics)** | [Nome / Fornitore] | tech@zakstudio.com | [Tel] | H24 |
| **Legale Esterno (consulenza notifica)** | [Studio / Avvocato] | privacy@studiolegale.it | [Tel] | Working hours |
| **Comunicazione Esterna (se Art. 34)** | [Titolare / PR] | press@zakstudio.com | [Tel] | H24 |

---

## 2. PROCESSO 72 ORE — TIMELINE OBBLIGATORIO

| Ora | Azione | Responsabile | Output |
|-----|--------|--------------|--------|
| **T+0** (Discovery) | Rileva / Ricevi segnalazione breach | Chiunque | Log immediato in questo registro |
| **T+1h** | Triaggio: conferma breach, classifica severità, identifica dati coinvolti | Breach Owner + Tech Lead | Scheda breach compilata (Sezione 3) |
| **T+4h** | Containment: isolamento sistemi, revoca accessi, stop processing | Tech Lead | Azioni containment documentate |
| **T+12h** | Valutazione rischio diritti interessati (Art. 33.1) | Breach Owner + DPO + Legale | Risk Assessment (Sezione 4) |
| **T+24h** | Decisione notifica Garante (Sì/No) + preparazione notifica se Sì | Breach Owner + Legale | Notifica bozza / Decisione "No notify" motivata |
| **T+48h** | Decisione notifica interessati Art. 34 (se rischio alto) | Breach Owner + DPO + Legale | Notifica interessati bozza / Decisione "No notify" |
| **T+72h** | **INVIO NOTIFICA GARANTE** (se required) via portale Garante | Breach Owner | Ricevuta protocollo Garante |
| **T+72h** | **INVIO NOTIFICA INTERESSATI** (se Art. 34 required) | Breach Owner + Comunicazione | Log invio + conferme ricezione |
| **T+7gg** | Root Cause Analysis (RCA) complete | Tech Lead | RCA Report |
| **T+30gg** | Corrective and Preventive Actions (CAPA) implementate | Breach Owner + Tech Lead | CAPA Log |
| **Continuo** | Monitoraggio post-breach, aggiornamento Garante se nuovi elementi | Breach Owner | Follow-up log |

---

## 3. SCHEDA BREACH — COMPILA PER OGNI INCIDENTE

### 3.1 Identificazione
| Campo | Valore |
|-------|--------|
| **Breach ID** | BR-YYYYMMDD-XXX (es. BR-20261121-001) |
| **Data/Ora Discovery** | YYYY-MM-DD HH:MM (UTC) |
| **Data/Ora Inizio Presunto** | YYYY-MM-DD HH:MM (UTC) / "Sconosciuto" |
| **Scopertura da** | [Interno / ESP alert / Interessato / Fornitore / Autorità / Altro] |
| **Stato** | [Aperto / Contenuto / In indagine / Notificato Garante / Notificato Interessati / Chiuso] |

### 3.2 Descrizione Incidente
| Campo | Valore |
|-------|--------|
| **Tipo breach** | [Confidenzialità / Integrità / Disponibilità / Combinazione] |
| **Vettore attacco / Causa** | [Phishing / Credenziali compromesse / Vulnerabilità SW / Config errata / Insider / Furto device / Errore umano / Altro] |
| **Sistemi coinvolti** | [CRM / ESP / Email Verification / Enrichment / Calendar / File Storage / Backup / Sito web / Altro] |
| **Processori coinvolti** | [Elencare se processor esterno causa/compromesso] |
| **Descrizione sintetica** | [Cosa è successo, come, cosa è stato esposto] |

### 3.3 Dati Coinvolti (Art. 33.3.c)
| Categoria Dati | Numero Record | Tipologia Interessati | Sensibilità |
|----------------|---------------|----------------------|-------------|
| [Es. Email aziendali] | [Es. 200] | [Prospect B2B] | Bassa (business) |
| [Es. Nome, ruolo, azienda] | [Es. 200] | [Prospect B2B] | Bassa |
| [Es. Engagement data] | [Es. 200] | [Prospect B2B] | Bassa |
| [Es. Credenziali API] | [Es. 5 key] | [Interni / Processori] | Alta |
| [Altro] | | | |

### 3.4 Interessati Coinvolti (Art. 33.3.d)
| Categoria | Numero Stimato | Geografia | Note |
|-----------|----------------|-----------|------|
| Prospect B2B (lista outreach) | | Italia / EU | |
| Clienti attivi | | Italia / EU | |
| Collaboratori / Staff | | Italia | |
| Altri | | | |

---

## 4. RISK ASSESSMENT — NOTIFICA GARANTE (Art. 33) E INTERESSATI (Art. 34)

### 4.1 Valutazione Rischio per Diritti/Libertà Interessati
| Fattore di Rischio | Livello (Basso/Medio/Alto/Critico) | Giustificazione |
|--------------------|-----------------------------------|-----------------|
| **Natura dati** (sensibilità) | | Es. Solo dati business low-sensitivity = Basso |
| **Volume dati** | | Es. 200 record = Basso |
| **Categoria interessati** | | Es. Professionisti B2B = Basso |
| **Facilità identificazione** | | Es. Email + nome = Medio |
| **Possibili conseguenze** | [Furto identità / Frode / Phishing mirato / Danno reputazionale / Discriminazione / Perdita controllo dati / Altro] | |
| **Vulnerabilità interessati** | | Es. Nessuna vulnerabilità particolare = Basso |
| **Misure di protezione preesistenti** | [Cifratura / Pseudonimizzazione / Access controls / MFA / Monitoring / Altro] | |

### 4.2 Decisione Notifica
| Decisione | Sì / No | Motivazione (Art. 33.1 / 34.1) | Art. 33 / 34 |
|-----------|---------|-------------------------------|--------------|
| **Notifica Garante (Art. 33)** | [ ] Sì / [ ] No | [Se No: "Rischio basso per diritti libertà — dati business low-sensitivity, volume limitato, cifratura, containment rapido"] | Art. 33 |
| **Notifica Interessati (Art. 34)** | [ ] Sì / [ ] No | [Se No: "Rischio non alto / Misure mitigazione efficaci / Communicazione sproporzionata"] | Art. 34 |

> **Regola:** Se dubbio → Notifica. Meglio over-notify che under-notify.

---

## 5. NOTIFICA GARANTE (Art. 33.3) — Se Required

### 5.1 Contenuto Notifica (Portale Garante Privacy)
| Campo | Valore da Inviare |
|-------|-------------------|
| **Natura violazione** | [Descrizione + categorie dati + n. record + n. interessati] |
| **Probabili conseguenze** | [Valutazione rischi Sezione 4.1] |
| **Misure adottate/proposte** | [Containment + mitigazione + CAPA planned] |
| **Dati contatto DPO/referente** | [Nome, email, telefono] |
| **Altre informazioni utili** | [Es. Processor coinvolto, vettore attacco, IOC] |

### 5.2 Invio e Tracciamento
| Campo | Valore |
|-------|--------|
| **Data/Ora Invio** | YYYY-MM-DD HH:MM |
| **Canale** | Portale Garante (https://servizi.gpdp.it) / PEC protocollo@gpdp.it |
| **Protocollo/Ricevuta** | [Numero protocollo Garante] |
| **Allegati inviati** | [Elencare: RCA preliminare, misure tecniche, ecc.] |

---

## 6. NOTIFICA INTERESSATI (Art. 34) — Se Required

### 6.1 Contenuto Comunicazione (Linguaggio Chiaro)
> **Oggetto:** Importante — Incidente sicurezza dati personali — [Breve descrizione]
>
> Gentile [Nome],
>
> La informiamo che in data [DATA] abbiamo rilevato un incidente di sicurezza che ha coinvolto i suoi dati personali trattati per [finalità: cold email outreach B2B].
>
> **Cosa è successo:** [Descrizione non tecnica, chiara]
>
> **Dati coinvolti:** [Categorie — es. "Il suo nome, email aziendale, ruolo e nome azienda"]
>
> **Cosa stiamo facendo:** [Containment, indagine, misure aggiuntive]
>
> **Cosa può fare lei:** [Consigli pratici — es. "Attenzione a email sospette che citano i suoi dati", "Attivi 2FA sui suoi account", "Segnali tentativi phishing"]
>
> **Contatti:** privacy@zakstudio.com / [Tel] / DPO: dpo@zakstudio.com
>
> Ci scusiamo per l'accaduto. La protezione dei suoi dati è la nostra priorità.
>
> Cordiali saluti,
> [Titolare]
> ZAK Studio Web

### 6.2 Invio e Tracciamento
| Campo | Valore |
|-------|--------|
| **Data/Ora Invio** | YYYY-MM-DD HH:MM |
| **Canale** | Email / PEC / Posta raccomandata A/R |
| **Numero interessati notificati** | [N] |
| **Bounce / Non consegnate** | [N] — Azione follow-up: [PEC / Raccomandata] |
| **Conferme ricezione** | [N] |
| **Richieste info / reclami ricevuti** | [N] — Log separato |

---

## 7. ROOT CAUSE ANALYSIS (RCA) — Entro 7 giorni

| Campo | Valore |
|-------|--------|
| **Root Cause Primaria** | [Es. "Credenziali API ESP in repo pubblico GitHub"] |
| **Cause Contribuenti** | [Es. "Mancanza secret scanning", "Mancanza policy commit", "Developer non formato"] |
| **Gap Controlli Esistenti** | [Es. "No secret scanning CI/CD", "No rotazione chiavi automatica", "Accessi eccessivi"] |
| **Timeline Eventi** | [T-0: Commit errato → T+2gg: Scanner rileva → T+2gg+1h: Revoca chiavi → T+2gg+2h: Notifica interna] |
| **Evidenze Raccolte** | [Log, screenshot, commit hash, IP accessi, geo-location] |

---

## 8. CORRECTIVE AND PREVENTIVE ACTIONS (CAPA) — Entro 30 giorni

| # | Azione | Tipo (Corrective/Preventive) | Responsabile | Scadenza | Stato | Verifica Efficacia |
|---|--------|------------------------------|--------------|----------|-------|-------------------|
| 1 | Revoca immediata chiavi compromise | Corrective | Tech Lead | T+0 | [ ] Done | [ ] Verified |
| 2 | Rotazione tutte chiavi API ESP/CRM | Corrective | Tech Lead | T+24h | [ ] Done | [ ] Verified |
| 3 | Implementa secret scanning (GitGuardian/TruffleHog) | Preventive | Tech Lead | T+7gg | [ ] In progress | [ ] Test pass |
| 4 | Policy: no secret in repo + pre-commit hooks | Preventive | Tech Lead | T+7gg | [ ] Done | [ ] Audit pass |
| 5 | Formazione team security awareness | Preventive | Breach Owner | T+30gg | [ ] Planned | [ ] Attendance |
| 6 | Audit accessi least privilege tutti tool | Preventive | Tech Lead | T+14gg | [ ] In progress | [ ] Review done |
| 7 | Aggiorna DPA processor se processor causa | Corrective | Breach Owner + Legale | T+30gg | [ ] Done | [ ] Signed |

---

## 9. BREACH LOG REGISTER — TEMPLATE `breach-register.csv`

```csv
breach_id,discovery_date,discovery_time,start_date,start_time,discovered_by,status,type,vector,systems_involved,processors_involved,description,data_categories,record_count,interested_categories,interested_count,risk_level,notify_garante,notify_interested,garante_protocol,interested_notified_count,rca_root_cause,capa_count,closed_date,notes
BR-20261121-001,2026-11-21,10:30,2026-11-19,14:22,Internal monitoring,Closed,Confidentiality,Misconfiguration,ESP (SendGrid),SendGrid,"API key exposed in public repo for 48h","Email, name, role, company, engagement",200,"Prospect B2B",200,Low,No,No,N/A,0,"API key in public GitHub repo",7,2026-11-28,"Contained in 2h, keys rotated, secret scanning added"
```

---

## 10. BREACH LOG ENTRIES — COMPILA QUI SOTTO

### ENTRY 1
| Campo | Valore |
|-------|--------|
| **Breach ID** | BR-YYYYMMDD-001 |
| **Data Discovery** | YYYY-MM-DD |
| **Stato** | [Aperto/Chiuso] |
| **Tipo** | [Confidenzialità/Integrità/Disponibilità] |
| **Vettore** | [Phishing/Credenziali/Vulnerabilità/Config/Insider/Furto/Errore/Altro] |
| **Sistemi** | [Elencare] |
| **Processori** | [Elencare] |
| **Descrizione** | |
| **Dati / Record / Interessati** | / / |
| **Risk Level** | [Basso/Medio/Alto/Critico] |
| **Notifica Garante** | [Sì/No] — Protocollo: |
| **Notifica Interessati** | [Sì/No] — Notificati: |
| **RCA Root Cause** | |
| **CAPA Count** | |
| **Data Chiusura** | |
| **Note** | |

---

### ENTRY 2
| Campo | Valore |
|-------|--------|
| **Breach ID** | BR-YYYYMMDD-002 |
| ... | (copia struttura sopra) |

---

## 11. TEST E SIMULAZIONI

| Test | Frequenza | Ultima Esecuzione | Prossima | Risultato |
|------|-----------|-------------------|----------|-----------|
| **Tabletop Exercise** (simulazione breach complete) | Semestrale | [Data] | [Data + 6 mesi] | [Pass/Fail] |
| **Test notifica Garante** (portale test / dry-run) | Annuale | [Data] | [Data + 12 mesi] | [Pass/Fail] |
| **Test notifica interessati** (template + canali) | Annuale | [Data] | [Data + 12 mesi] | [Pass/Fail] |
| **Backup restore test** (verifica integrità + tempo) | Trimestrale | [Data] | [Data + 3 mesi] | [Pass/Fail] |

---

## 12. CONTATTI EMERGENZA

| Ente / Servizio | Contatto | Note |
|-----------------|----------|------|
| **Garante Privacy — Protocollo** | protocollo@gpdp.it / +39 06 696771 | Portale: https://servizi.gpdp.it |
| **CERT Nazionale (ACN)** | cert@acn.gov.it / +39 06 828881 | Incidenti cyber rilevanti |
| **Polizia Postale** | www.poliziadistato.it / 113 | Reati informatici |
| **Fornitore Cyber Insurance** | [Broker / Compagnia] / [Polizza #] | Se attiva |
| **Legale Esterno Privacy** | [Studio / Avvocato] / [Tel] | Per consulenza notifica |

---

## 13. FIRMA E APPROVAZIONE PROCESSO

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare / Breach Owner** | [Tuo Nome] | | |
| **DPO / Referente Privacy** | [Nome] | | |
| **Tech Lead** | [Nome] | | |
| **Legale Esterno** | [Studio / Avvocato] | | |

**Prossima revisione processo:** [DATA ODIERNA + 12 MESI] o post-breach / post-test