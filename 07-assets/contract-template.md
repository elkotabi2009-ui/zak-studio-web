# CONTRATTO DI PRESTAZIONE SERVIZI WEB B2B

**Tra**

**ZAK Studio Web S.r.l.**, con sede legale in Via delle Industrie 15, 20100 Milano (MI), P.IVA/CF IT01234567890, REA MI-1234567, Capitale Sociale € 10.000 i.v., in persona del legale rappresentante pro tempore Mario Rossi, (di seguito **"Fornitore"**)

**E**

**{{company_name}}** {{company_legal_form}}, con sede legale in {{company_address}}, P.IVA/CF {{company_vat}}, REA {{company_rea}}, in persona del legale rappresentante pro tempore {{decision_maker_name}} {{decision_maker_title}}, (di seguito **"Cliente"**)

Congiuntamente definite le **"Parti"**.

---

## PREMESSA

Il Fornitore opera nel settore della progettazione, sviluppo e gestione di siti web B2B conversion-focused per aziende manifatturiere. Il Cliente desidera affidare al Fornitore la realizzazione del proprio sito web istituzionale e commerciale secondo le specifiche tecniche allegato.

---

## ART. 1 — OGGETTO DEL CONTRATTO

1.1 Il Fornitore si obbliga a realizzare e consegnare al Cliente il sito web descritto nelle **Specifiche Tecniche (Allegato A)**, parte integrante del presente contratto.

1.2 L'oggetto include:
   - Sviluppo frontend Next.js 14 + TypeScript + Tailwind CSS
   - Configurazione CMS Headless Ghost 5.x
   - Catalogo prodotti/servizi dinamico (max {{max_products}} items)
   - Form RFQ (Request for Quote) con validazione server-side
   - Schema.org completo (Organization, Product, Service, Breadcrumb, FAQ)
   - Deploy su Netlify/Vercel + dominio custom {{custom_domain}} + SSL
   - Sitemap.xml, robots.txt, meta SEO, Open Graph, Twitter Cards
   - Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1 (mobile/desktop)
   - Accessibilità WCAG 2.1 Livello AA
   - Documentazione tecnica + credenziali accesso CMS/Hosting

1.3 Sono escluse: copywriting testi (forniti dal Cliente), fotografia prodotto, traduzioni (se non piano Premium), manutenzione post periodo supporto.

---

## ART. 2 — CORRISPETTIVO E PAGAMENTI

2.1 Il corrispettivo complessivo è di **€ {{price}}** (IVA esclusa, 22%), così ripartito:
   - **Acconto 40% (€ {{deposit_amount}})**: alla firma del presente contratto
   - **Saldo 60% (€ {{balance_amount}})**: a consegna completata (go-live)

2.2 Pagamenti ammessi:
   - Bonifico bancario: IBAN {{iban}} — BIC {{bic}} — {{bank}} — Intestatario: ZAK Studio Web S.r.l.
   - Stripe Payment Link (carta, Satispay, bonifico istantaneo)

2.3 Rateizzazione: su richiesta, fino a 6 rate mensili senza interessi, con prima rata alla firma.

2.4 Ritardo pagamento: interessi moratori ex D.Lgs. 231/2002 (BCE + 8%) + spese recupero.

2.5 Fatturazione: fattura elettronica XML via SDI all'emissione (acconto) e a consegna (saldo).

---

## ART. 3 — TEMPI DI CONSEGNA

3.1 Consegna entro **{{timeline_days}} giorni lavorativi** dalla data di ricezione:
   - Contratto firmato digitalmente
   - Ricevuta acconto
   - Materiali necessari (testi, logo, immagini, schede prodotti) — **Allegato B**

3.2 Il Fornitore non risponde per ritardi causati da:
   - Mancata consegna materiali da parte Cliente (>5 gg lavorativi dalla richiesta)
   - Richieste modifiche fuori specifiche (change order, Art. 7)
   - Force majeure (eventi naturali, scioperi, interruzioni servizi terzi)

3.3 Penale ritardo: 0,5% del corrispettivo per giorno lavorativo di ritardo, max 10%.

---

## ART. 4 — PROPRIETÀ INTELLETTUALE E LICENZE

4.1 **A consegna e saldo pagato**, il Cliente acquisisce piena proprietà di:
   - Codice sorgente frontend (repository Git privato)
   - Design system, componenti, stili
   - Configurazione CMS e contenuti importati
   - Documentazione tecnica

4.2 Il Fornitore conserva diritti su:
   - Librerie/utility interne riutilizzabili (es. componenti UI generici, schema generators)
   - Know-how, metodi, processi di sviluppo
   - Template base "manufacturing-nextjs" (licenza d'uso perpetua al Cliente per il sito oggetto)

4.3 Licenze terze parti (Next.js, Tailwind, Ghost, ecc.) restano sotto rispettive licenze open source (MIT, BSD-3).

4.4 Il Cliente concede al Fornitore licenza non esclusiva, mondiale, perpetua per:
   - Usare screenshot/loghi del sito in portfolio, case study, marketing (previo consenso scritto)
   - Indicare il Cliente come riferimento commerciale

---

## ART. 5 — OBBLIGHI DEL CLIENTE

5.1 Fornire entro 5 gg lavorativi dalla firma:
   - Testi finali (IT + EN se piano Premium) — max 15 pagine
   - Logo vettoriale (SVG/EPS) + brand guidelines (colori, font)
   - Immagini prodotti/servizi (min 1200px, max 2MB cadauna)
   - Schede prodotti: nome, descrizione, specifiche tecniche, categoria, PDF scheda
   - Accessi DNS (per configurazione dominio) o delega tecnica
   - Contatti per form RFQ (email destinatario, CRM webhook se attivo)

5.2 Revisionare preview entro 3 gg lavorativi dalla consegna. Mancata risposta = approvazione tacita.

5.3 Non modificare codice/repository post-consegna senza coordinamento (rischio rottura deploy, SSL, CMS).

---

## ART. 6 — GARANZIE E RESPONSABILITÀ

6.1 Il Fornitore garantisce:
   - Conformità alle Specifiche Tecniche (Allegato A)
   - Core Web Vitals nei target dichiarati al momento go-live
   - Funzionamento form RFQ + invio email/CRM
   - SSL valido, HTTPS enforced, HSTS, CSP headers
   - Nessun malware, backdoor, codice oscurato

6.2 Esclusione responsabilità per:
   - Problemi DNS/hosting causati da terzi (registro, provider email)
   - Modifiche non autorizzate dal Cliente post-consegna
   - Cambiamenti algoritmi Google/algoritmi terzi che impattano SEO
   - Danni indiretti, lucro cessante, perdita dati (salvo dolo/colpa grave)

6.3 Limite responsabilità: max importo corrispettivo pagato.

---

## ART. 7 — VARIAZIONI (CHANGE ORDERS)

7.1 Qualsiasi richiesta fuori Specifiche Tecniche = Change Order scritto.

7.2 Change Order include: descrizione, impatto timeline, costo aggiuntivo (€/h: 120€/h), firma entrambe Parti.

7.3 Esempi change order: pagine extra, integrazioni custom, lingue extra, migrazione dati legacy, redesign post-go-live.

---

## ART. 8 — SUPPORTO POST-CONSEGNA

8.1 **Piano Base (incluso):** 30 giorni calendario da go-live
   - Bug fixing (non conformità specifiche)
   - Supporto email (risposta 24h lavorative)
   - 1 intervento deploy fix incluso

8.2 **Piano Premium (se acquistato):** 90 giorni calendario
   - Bug fixing + piccole ottimizzazioni
   - Supporto email + call (risposta 4h lavorative)
   - Monitoring Core Web Vitals + alert
   - Formazione team (2h videocall registrata)

8.3 Estensione supporto: 15%/anno del corrispettivo (rinnovabile).

---

## ART. 9 — PROTEZIONE DATI PERSONALI (GDPR)

9.1 Le Parti sono **Contitolari** per dati trattati tramite sito (Art. 26 GDPR). Accordo separato (Allegato C - DPA).

9.2 Il Fornitore è **Responsabile del trattamento** per:
   - Dati tecnici (log server, analytics anonimi, monitoring)
   - Dati form RFQ (consegnati a Cliente via email/CRM, non conservati >30gg)

9.3 Misure tecniche: crittografia TLS 1.3, backup cifrati, accessi least-privilege, log accessi.

9.4 Data Breach: notifica Cliente entro 24h, DPA entro 72h (Art. 33-34 GDPR).

---

## ART. 10 — RISOLUZIONE

10.1 Risoluzione per giusta causa: inadempimento grave non sanato entro 15 gg da diffida scritta.

10.2 Effetti risoluzione:
   - Acconto trattenuto per lavori eseguiti
   - Materiali consegnati fino a quel momento
   - Restituzione accessi/credenziali entro 5 gg

10.3 Recesso Cliente: preavviso 30 gg, paga lavori eseguiti + 20% corrispettivo residuo.

---

## ART. 11 — FORO COMPETENTE E LEGGE APPLICABILE

11.1 Legge italiana. Foro esclusivo: **Tribunale di Milano**.

11.2 Tentativo obbligatorio mediazione (D.Lgs. 28/2010) prima azione giudiziale.

---

## ART. 12 — DISPOSIZIONI FINALI

12.1 Il presente contratto (compresi Allegati A, B, C) costituisce l'intero accordo tra le Parti.

12.2 Modifiche solo per iscritto, firmate da entrambe le Parti.

12.3 Invalidità parziale non inficia resto del contratto.

12.4 Comunicazioni: email certificata (PEC) o raccomandata A/R. Email ordinaria per comunicazioni operative.

---

**Letto, confermato e sottoscritto.**

---

**PER IL FORNITORE**  
ZAK Studio Web S.r.l.  
Mario Rossi — Founder & CEO  
Firma: _________________________  
Data: _________________________

**PER IL CLIENTE**  
{{company_name}} {{company_legal_form}}  
{{decision_maker_name}} — {{decision_maker_title}}  
Firma: _________________________  
Data: _________________________

---

### ALLEGATI

**Allegato A — Specifiche Tecniche Complete**  
**Allegato B — Checklist Materiali Cliente**  
**Allegato C — Data Processing Agreement (DPA) Art. 28 GDPR**  
**Allegato D — Proposta Commerciale Rif. ZAK/{{year}}/{{sequential_number}}**