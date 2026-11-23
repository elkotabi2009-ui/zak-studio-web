# LIA — Legitimate Interest Assessment (GDPR Art. 6.1.f)
**Obbligatorio per cold email B2B. Completa OGNI sezione. Firma e data.**

---

## 1. IDENTIFICAZIONE TRATTAMENTO
| Campo | Valore |
|-------|--------|
| **Titolare del trattamento** | [Ragione Sociale / Tuo Nome Cognome] |
| **DPO / Referente Privacy** | [Nome / "Non nominato (sotto soglia)" / "Esterno: Nome Studio"] |
| **Attività di trattamento** | Cold email outreach B2B per vendita servizi creazione siti web |
| **Categorie dati** | Nome, cognome, email aziendale, ruolo/titolo, nome azienda, settore, dimensione, trigger signal, pain point hypothesis, personalization hook |
| **Fonte dati** | Fonti pubbliche (LinkedIn, sito web azienda, registri imprese, fiere, directory settoriali), tool enrichment (Apollo, Hunter, Lusha) con consenso legittimo per dati business |
| **Destinatari dati** | ESP (Resend/SendGrid), CRM (HubSpot/Pipedrive), tool verifica email (ZeroBounce), tool enrichment (Apollo) — tutti con DPA Art. 28 firmato |
| **Trasferimenti extra-UE** | [Sì/No] Se sì: quale processor, quale garanzia (SCCs, EU-US DPF, Adeguatezza) |
| **Periodo conservazione** | 12 mesi dall'ultimo contatto / 30 giorni da opt-out / cancellazione su richiesta DSAR |
| **Base giuridica claimata** | **Legittimo interesse (Art. 6.1.f GDPR)** — Vendita servizi B2B a decision maker aziendali |

---

## 2. THREE-PART TEST (WP217 Opinion 6/2014 + EDPB Guidelines 1/2024)

### 2.1 PURPOSE TEST — Interesse legittimo identificato
| Domanda | Risposta | Evidenza |
|---------|----------|----------|
| Qual è l'interesse legittimo perseguito? | **Sviluppo commerciale B2B** — Contattare decision maker di aziende target per offrire servizi creazione siti web conversion-focused | Business plan, offer definita in `01-config/sender-profile.md` |
| È un interesse legittimo ai sensi Art. 6.1.f? | **Sì** — "Direct marketing" esplicitamente citato come legittimo interesse nel Considerando 47 GDPR + WP217 + provvedimenti Garante | Considerando 47: "Il trattamento di dati personali per finalità di marketing diretto può essere considerato un interesse legittimo" |
| È specifico, esplicito, legittimo? | **Sì** — Non "marketing generico" ma outreach mirato a ICP definito (settore, size, geo, trigger) con pain point ipotizzato | ICP documentato in `01-config/icp-definition.md` |

### 2.2 NECESSITY TEST — Il trattamento è necessario?
| Domanda | Risposta | Evidenza |
|---------|----------|----------|
| L'email è necessaria per raggiungere lo scopo? | **Sì** — Nessun canale meno invasivo per raggiungere decision maker B2B che non ci conoscono. Telefonata a freddo più invasiva. LinkedIn InMail richiede connessione/premium. PEC illegale per marketing. | Benchmark canali: email < telefonata < LinkedIn < PEC per invasività |
| I dati trattati sono limitati al necessario? | **Sì** — Solo dati business pubblici/professionali: nome, ruolo, email aziendale, azienda. Nessun dato sensibile, privato, bancario, salute. | Minimizzazione: no phone, no indirizzo casa, no dati sensibili |
| Esistono alternative meno invasive? | **No** — Advertising (FB/Google) targetta male B2B niche. SEO/Content marketing tempi 6-12 mesi. Referral network non scalabile da zero. Eventi fiere costosi/sporadici. | Analisi canali in `founder-marketing` output |

### 2.3 BALANCING TEST — Diritti interessato vs Interesse titolare
| Fattore di bilanciamento | Valutazione | Misure mitigazione |
|--------------------------|-------------|-------------------|
| **Natura dati** | Dati business/professionali (nome, ruolo, email aziendale) — **bassa sensibilità** | Solo dati professionali, no dati privati |
| **Aspettative interessato** | Decision maker B2B si aspetta contatti commerciali rilevanti — **aspettativa ragionevole** | Trigger signal = rilevanza contestuale (es. sito vecchio, nuova linea prodotto) |
| **Impatto su diritti/fondamentali** | **Basso** — Riceve email rilevante, può ignorare, unsubscribe one-click, dati cancellati su richiesta | Unsubscribe immediato, DSAR 30gg, suppression list real-time |
| **Squilibrio potere** | Titolare = microimpresa, Interessato = decision maker azienda 10-50 dip — **nessuno squilibrio rilevante** | Rapporto paritario B2B |
| **Vulnerabilità interessato** | Nessuna — Professionisti abituati a valutare offerte commerciali | N/A |
| **Trasparenza** | Informativa Art. 13 in footer email + privacy policy link + unsubscribe chiaro | Footer legale completo in OGNI email |
| **Controllo interessato** | Opt-out immediato, accesso/rettifica/cancellazione su richiesta | Unsubscribe link, DSAR workflow, suppression list |

**CONCLUSIONE BALANCING TEST:** ✅ **Interesse legittimo PREVALE** — Dati low-sensitivity, aspettativa ragionevole B2B, impatto basso, controlli forti, trasparenza completa.

---

## 3. SAFEGUARDS ADDIZIONALI (Art. 6.1.f + Accountability)

| Misura | Implementata? | Dettaglio |
|--------|--------------|-----------|
| **ICP definito e documentato** | [ ] Sì | `01-config/icp-definition.md` — no spray-and-pray |
| **Trigger signal per rilevanza** | [ ] Sì | Ogni riga CSV ha `trigger_signal` e `personalization_hook` univoci |
| **Personalizzazione reale (non template)** | [ ] Sì | Opener = hook specifico, pain framing settore, case study rilevante |
| **Volume controllato** | [ ] Sì | Max 200/giorno (post-warmup), batch 20-30 per sicurezza |
| **Unsubscribe one-click ≤ 24h** | [ ] Sì | Link in ogni email, automazione ESP, suppression list real-time |
| **Footer legale completo (Art. 13 + DLgs 70/2003)** | [ ] Sì | Ragione sociale, P.IVA, sede, REA, privacy policy, unsubscribe |
| **DPA con tutti i processatori** | [ ] Sì | ESP, CRM, enrichment, verification — Art. 28 firmati |
| **RoPA aggiornato (Art. 30)** | [ ] Sì | `05-legal/gdpr-ropa.md` — refresh ≤ 90gg |
| **DSAR workflow testato (Art. 15-22)** | [ ] Sì | `05-legal/dsar-workflow.md` — response ≤ 30gg |
| **Breach log + 72h process (Art. 33-34)** | [ ] Sì | `05-legal/breach-log.md` + responsabile nominato |
| **Email verification pre-invio** | [ ] Sì | ZeroBounce/MillionVerifier — bounce < 2% |
| **Suppression list onorata real-time** | [ ] Sì | `02-data/suppression-list.csv` + ESP suppression list |
| **Nessuna PEC, nessun ruolo generico (info@, admin@)** | [ ] Sì | Solo decision maker nominativi verificati |
| **Registro Opposizioni verificato** | [ ] Sì | B2B escluso ma verifica campione mensile |

---

## 4. RISK ASSESSMENT SUMMARY

| Rischio | Likelihood | Impact | Risk Level | Mitigazione |
|---------|------------|--------|------------|-------------|
| Reclamo Garante per spam | Basso | Medio | **Basso** | Unsubscribe facile, rilevanza trigger, volume basso, footer legale |
| Reclamo interessato (DSAR ignorata) | Molto basso | Alto | **Basso** | Workflow testato, 30gg SLA, responsabile nominato |
| Data breach (ESP compromise) | Basso | Alto | **Medio** | DPA Art. 28, ESP reputati, cifratura, breach log 72h |
| Blacklist dominio / deliverability drop | Medio | Alto | **Medio** | Warmup corretto, volume controllato, verifica email, unsubscribe |
| Sanzioni DLgs 70/2003 (footer mancante) | Molto basso | Medio | **Basso** | Footer completo in OGNI email, checklist pre-invio |

**RISK LEVEL COMPLESSIVO: 🟢 BASSO** — Con tutte le mitigazioni implementate.

---

## 5. DECISIONE E FIRMA

> **Esito LIA:** ✅ **LEGITTIMO INTERESSE CONFERMATO** — Il trattamento per cold email outreach B2B come descritto soddisfa il three-part test (Purpose, Necessity, Balancing) con safeguards adeguati per Art. 6.1.f GDPR.

| Ruolo | Nome | Firma | Data |
|-------|------|-------|------|
| **Titolare del Trattamento** | [Tuo Nome Cognome] | | |
| **DPO / Referente Privacy** | [Nome / "Non nominato"] | | |
| **Legale Esterno (se consultato)** | [Nome Studio / Avvocato] | | |

---

## 6. REVISIONE PROGRAMMATA

| Trigger revisione | Frequenza | Responsabile |
|-------------------|-----------|--------------|
| Cambio ICP / offer / volume | Ad ogni cambio | Titolare |
| Nuovo processor / tool | Prima onboarding | Titolare |
| Reclamo Garante / DSAR complesso | Immediata | DPO / Legale |
| **Revisione periodica obbligatoria** | **Ogni 12 mesi** | Titolare + DPO |

**Prossima revisione:** [DATA ODIERNA + 12 MESI]

---

**ALLEGATI OBBLIGATORI:**
- [ ] `01-config/icp-definition.md` (ICP + 200 aziende con trigger)
- [ ] `01-config/sender-profile.md` (Offer, proof points, email setup)
- [ ] `05-legal/gdpr-ropa.md` (RoPA completo)
- [ ] `05-legal/dsar-workflow.md` (Processo DSAR)
- [ ] `05-legal/breach-log.md` (Registro breach)
- [ ] DPA firmati con tutti i processatori
- [ ] Privacy policy pubblicata (link in footer email)