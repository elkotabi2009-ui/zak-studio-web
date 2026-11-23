# DSAR Workflow — Data Subject Access Request (GDPR Art. 15-22)
**Processo operativo per gestire richieste diritti interessati. SLA: 30 giorni (estendibile a 60 per complessità).**

---

## 1. CANALI RICEZIONE RICHIESTE

| Canale | Indirizzo / Referente | Chi Monitora | Frequenza Check |
|--------|----------------------|--------------|-----------------|
| **Email dedicata** | privacy@zakstudio.com | [Titolare / DPO / Referente] | Giornaliera (working days) |
| **Form sito web** | zakstudio.com/privacy/dsar | Auto-forward a privacy@ | Real-time |
| **PEC** | pec@dominioprivato.it | [Titolare] | Giornaliera |
| **Posta cartacea** | Sede legale | [Titolare] | All'arrivo |
| **Verbale (telefono/in persona)** | Da documentare per iscritto subito | Chi riceve | Immediato |

> **Regola:** Ogni richiesta = ticket DSAR unico con ID `DSAR-YYYYMMDD-XXX`

---

## 2. PROCESSO STEP-BY-STEP

### STEP 1 — RICEZIONE E LOG (Giorno 0)
```
AZIONE:
1. Assegna ID: DSAR-YYYYMMDD-XXX (es. DSAR-20261121-001)
2. Log in: `dsar-log.csv` (vedi template sotto)
3. Conferma ricezione all'interessato (entro 24h) — Template sotto
4. Verifica identità (vedi Step 2)
5. Classifica tipo richiesta (Accesso / Rettifica / Cancellazione / Limitazione / Portabilità / Opposizione)
```

**Template Conferma Ricezione (invia entro 24h):**
> Oggetto: Conferma ricezione richiesta diritti GDPR — [DSAR-YYYYMMDD-XXX]
>
> Gentile [Nome],
>
> Confermiamo la ricezione della sua richiesta del [DATA] relativa al diritto di [ACCESSO/RETTIFICA/CANCELLAZIONE/LIMITAZIONE/PORTABILITÀ/OPPOSIZIONE] ai sensi dell'Art. [15-21] GDPR.
>
> La sua richiesta è stata registrata con ID: **DSAR-YYYYMMDD-XXX**.
>
> Provvederemo a rispondere entro **30 giorni** dalla verifica della sua identità (prorogabili di ulteriori 60 giorni per complessità, con comunicazione tempestiva).
>
> Per qualsiasi chiarimento: privacy@zakstudio.com
>
> Cordiali saluti,
> [Titolare / DPO]
> ZAK Studio Web

---

### STEP 2 — VERIFICA IDENTITÀ (Giorno 0-3)
| Situazione | Azione |
|------------|--------|
| **Richiesta da email già nota in CRM/ESP** (match exact) | Identità verificata → Procedi Step 3 |
| **Richiesta da email diversa / canale non verificato** | Richiedi documento identità (fronte/retro oscurando dati sensibili non necessari) + selfie con documento (opzionale ma raccomandato) |
| **Richiesta per conto terzi (avvocato, genitore, tutore)** | Richiedi procura/delega firmata + documento delegante + documento delegato |
| **Dubbi su identità** | Non procedere — richiedi info aggiuntive. Log motivo ritardo. |

**Template Richiesta Documenti:**
> Abbiamo bisogno di verificare la sua identità per proteggere i suoi dati. La preghiamo di inviare copia documento identità (carta identità/patente/passaporto) con dati sensibili non necessari oscurati (es. indirizzo residenza, codice fiscale se non richiesto). Risponderemo entro 30gg da ricezione documenti validi.

---

### STEP 3 — RICERCA DATI (Giorno 3-15)

| Sistema / Fonte | Cosa Cercare | Chi Esegue | Output |
|-----------------|--------------|------------|--------|
| **CRM** (HubSpot/Pipedrive/Attio) | Contatti, deal, note, email log, task | [Titolare / Admin CRM] | Export JSON/CSV completo record |
| **ESP** (Resend/SendGrid/Customer.io) | Email inviate, open, click, bounce, unsubscribe, suppression | [Titolare / Admin ESP] | Export CSV + suppression status |
| **Email Verification** (ZeroBounce) | Log verifica email | [Titolare] | Log API calls per quell'email |
| **Enrichment** (Apollo/Hunter) | Dati arricchiti, crediti usati | [Titolare] | Log ricerche |
| **Calendar** (Calendly/Cal.com) | Meeting booked, cancellati, note | [Titolare] | Export inviti |
| **File storage** (Drive/Notion/Locale) | Proposte, contratti, case study condivisi | [Titolare] | Lista file + link |
| **Backup** | Verifica se dati in backup (es. DB dump, email export) | [Titolare / Tech] | Nota: backup = cancellazione differita |

**Checklist Ricerca:**
- [ ] CRM — record completo
- [ ] ESP — history email + tracking + suppression
- [ ] Verification tool — log
- [ ] Enrichment tool — log
- [ ] Calendar — meeting history
- [ ] File storage — documenti condivisi
- [ ] Backup — nota posizione (non ripristinare per DSAR)

---

### STEP 4 — PREPARAZIONE RISPOSTA (Giorno 15-25)

#### Per DIRITTO DI ACCESSO (Art. 15) — Template Risposta
> **Oggetto:** Riscontro diritto accesso Art. 15 GDPR — [DSAR-YYYYMMDD-XXX]
>
> Gentile [Nome],
>
> In riscontro alla sua richiesta del [DATA], le forniamo le seguenti informazioni ai sensi dell'Art. 15 GDPR:
>
> **1. Finalità del trattamento:** Sviluppo commerciale B2B — cold email outreach per offerta servizi creazione siti web.
>
> **2. Categorie dati trattati:** Nome, cognome, email aziendale, ruolo/titolo, nome azienda, settore, dimensioni, località, trigger signal, pain point hypothesis, personalization hook, engagement data (open, click, reply, unsubscribe).
>
> **3. Destinatari/categorie destinatari:** Interni (titolare, collaboratori); Esterni — processori: ESP ([nome]), CRM ([nome]), Email Verification ([nome]), Enrichment ([nome]), Calendar ([nome]). DPA Art. 28 firmati con tutti.
>
> **4. Trasferimenti extra-UE:** [Elenca se applicabile — es. SendGrid (US) via EU-US DPF; HubSpot (US) via SCCs 2021]. Garanzie adeguate in essere.
>
> **5. Periodo conservazione:** 12 mesi dall'ultimo engagement / 30gg da opt-out / 10 anni se cliente (obblighi fiscali).
>
> **6. Diritti:** Lei ha diritto di rettifica (Art. 16), cancellazione (Art. 17), limitazione (Art. 18), portabilità (Art. 20), opposizione (Art. 21), reclamo Garante (Art. 77).
>
> **7. Esistenza processo decisionale automatizzato:** [Sì/No — se scoring lead, descrivi logica, significato, conseguenze].
>
> **8. Origine dati (se non da lei):** Fonti pubbliche (LinkedIn, sito web azienda, registri imprese, fiere, directory settoriali) + tool enrichment (Apollo/Hunter/Lusha) per dati business.
>
> **Allegato:** Export completo suoi dati in formato JSON/CSV (password-protected, password inviata canale separato).
>
> Per esercitare altri diritti: privacy@zakstudio.com
>
> Cordiali saluti,
> [Titolare / DPO]
> ZAK Studio Web

#### Per CANCELLAZIONE (Art. 17) — Azioni Obbligatorie
| Sistema | Azione | Verifica |
|---------|--------|----------|
| CRM | Delete record contatto + deal associati (se non fatturati) | [ ] Done |
| ESP | Suppress email + delete history (se tool permette) | [ ] Done |
| Email Verification | Richiedi cancellazione log al processor (DPA Art. 28.3.g) | [ ] Requested |
| Enrichment | Richiedi cancellazione al processor | [ ] Requested |
| Calendar | Delete meeting history | [ ] Done |
| File Storage | Delete file condivisi / proposte | [ ] Done |
| Backup | **NON ripristinare** — nota: dati saranno purgati al prossimo ciclo backup (max 30gg) | [ ] Noted |
| Suppression List | Mantieni email in suppression list (per non ricontattare) | [ ] Done |

> **Eccezioni Art. 17.3:** Se dati necessari per obbligo legale (es. fatture 10 anni), difesa in giudizio, interesse pubblico. Informare interessato.

---

### STEP 5 — INVIO RISPOSTA (Giorno ≤30)

| Controllo Pre-invio | Verificato |
|---------------------|------------|
| Identità verificata | [ ] |
| Tutti i sistemi interrogati | [ ] |
| Dati completi e accurati | [ ] |
| Formato accessibile (JSON/CSV + spiegazione) | [ ] |
| Password-protected se sensibili | [ ] |
| Risposta in italiano (o lingua richiesta) | [ ] |
| Tutti i diritti Art. 15 menzionati | [ ] |
| Contatti per follow-up / reclamo inclusi | [ ] |
| Log aggiornato con esito | [ ] |

**Invia via:** Email (se richiesta via email) / PEC (se richiesta via PEC) / Posta raccomandata A/R (se richiesta cartacea)

---

### STEP 6 — CHIUSURA E LOG (Giorno 30-35)

| Campo Log | Valore |
|-----------|--------|
| DSAR ID | DSAR-YYYYMMDD-XXX |
| Data ricezione | YYYY-MM-DD |
| Tipo richiesta | Accesso / Rettifica / Cancellazione / Limitazione / Portabilità / Opposizione |
| Canale ricezione | Email / Form / PEC / Cartacea / Verbale |
| Identità verificata | Sì / No (se No: motivo) |
| Data verifica identità | YYYY-MM-DD |
| Sistemi interrogati | CRM, ESP, Verification, Enrichment, Calendar, Files, Backup |
| Data completamento ricerca | YYYY-MM-DD |
| Data invio risposta | YYYY-MM-DD |
| Esito | Completato / Parziale (con motivazione) / Rifiutato (con motivazione Art. 12.5) |
| Giorni totali | [Numero] |
| Note | [Eventuali complessità, proroga, reclamo] |

---

## 3. DSAR LOG TEMPLATE (`dsar-log.csv`)

```csv
dsar_id,date_received,request_type,channel,identity_verified,verification_date,systems_queried,completion_date,response_date,outcome,total_days,notes
DSAR-20261121-001,2026-11-21,Access,Email,Yes,2026-11-22,"CRM,ESP,Verification,Enrichment,Calendar,Files",2026-12-10,2026-12-11,Completed,20,
DSAR-20261125-002,2026-11-25,Erasure,Form,Yes,2026-11-26,"CRM,ESP,Verification,Enrichment,Calendar,Files",2026-12-15,2026-12-16,Completed,21,
```

---

## 4. PROROGA (Art. 12.3) — Se Necessaria

**Condizioni:** Complessità richiesta / Numero richieste simultanee
**Massimo:** +60 giorni (totale 90 giorni)
**Obbligo:** Informare interessato **prima** scadenza 30gg con motivazione

**Template Proroga:**
> In riferimento alla sua richiesta [DSAR-XXX], la informiamo che, data la complessità della richiesta / l'elevato numero di richieste simultanee, avremo bisogno di ulteriori 60 giorni (termine finale: [DATA]) per fornire un riscontro completo, come previsto dall'Art. 12.3 GDPR. La terremo aggiornato.

---

## 5. RIUTI (Art. 12.5) — Se Manifondatamente Infondata / Eccessiva

**Criteri:** Ripetitiva, molestia, scopo non protezione dati (es. competitor scraping)
**Azione:** Rifiuto motivato per iscritto + informare diritto reclamo Garante + ricorso giudiziario
**Log:** Obbligatorio in `dsar-log.csv` con outcome="Rejected" + note motivazione

---

## 6. RESPONSABILI E CONTATTI

| Ruolo | Nome | Email | Telefono | Backup |
|-------|------|-------|----------|--------|
| **Titolare / DSAR Owner** | [Tuo Nome] | privacy@zakstudio.com | [Tel] | [Nome Backup] |
| **DPO / Referente Privacy** | [Nome / Esterno] | dpo@zakstudio.com / studio@legal.it | [Tel] | |
| **Tech Support (CRM/ESP/Backup)** | [Nome / Fornitore] | tech@zakstudio.com | [Tel] | |
| **Legale Esterno** | [Studio / Avvocato] | privacy@studiolegale.it | [Tel] | |

---

## 7. TEST E FORMAZIONE

| Attività | Frequenza | Ultima Esecuzione | Prossima |
|----------|-----------|-------------------|----------|
| **Test DSAR end-to-end** (simulazione richiesta) | Trimestrale | [Data] | [Data + 3 mesi] |
| **Formazione team** (nuovi collaboratori) | Ad onboarding + annuale | [Data] | [Data + 12 mesi] |
| **Aggiornamento procedure** (nuovi tool, normativa) | Ad ogni cambiamento | [Data] | — |
| **Audit interno DSAR log** | Semestrale | [Data] | [Data + 6 mesi] |

---

## 8. FIRMA E APPROVAZIONE

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare del Trattamento** | [Tuo Nome] | | |
| **DPO / Referente Privacy** | [Nome] | | |

**Prossima revisione workflow:** [DATA ODIERNA + 12 MESI] o ad ogni cambiamento normativo/organizzativo