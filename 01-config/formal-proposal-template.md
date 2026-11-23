# Proposta Commerciale Formale — {{company_name}}

**Rif:** ZAK/{{year}}/{{sequential_number}}
**Data:** {{date}}
**Validità:** {{expiry_days}} giorni

---

## 1. INTRODUZIONE

Gentile **{{decision_maker_name}}**,

La ringrazio per l'attenzione. Come anticipato, le invio la nostra proposta formale per la realizzazione del nuovo sito web istituzionale e commerciale di **{{company_name}}**, sviluppato specificamente per il settore **{{sector}}**.

ZAK Studio Web S.r.l. è una società specializzata nella creazione di siti web B2B *conversion-focused* per aziende manifatturiere italiane. Non realizziamo "vetrine": costruiamo motori di lead generation che trasformano il traffico qualificato in richieste di preventivo (RFQ) concrete.

**Dati societari:**
- **Denominazione:** ZAK Studio Web S.r.l.
- **Sede legale:** Via delle Industrie 15, 20100 Milano (MI)
- **P.IVA / CF:** IT01234567890
- **REA:** MI-1234567
- **PEC:** zakstudio@pec.it
- **Capitale sociale:** € 10.000 i.v.

---

## 2. ANALISI SITUAZIONE ATTUALE

Abbiamo analizzato il vostro attuale sito web (**{{domain}}**) rilevando i seguenti punti critici:

| Area | Riscontro | Impatto Business |
|------|-----------|------------------|
| **CMS / Tecnologia** | {{cms_info}} | Sicurezza, manutenibilità, scalabilità compromesse |
| **Performance Mobile** | PageSpeed {{mobile_score}}/100 (LCP: {{lcp}}s) | Abbandono >53% visitatori mobile (Google) |
| **Schema.org / SEO** | {{schema_status}} | Invisibilità per ricerche tecniche B2B (prodotti/servizi) |
| **Lead Capture** | {{lead_capture_status}} | Perdita stimata {{lost_leads_month}}/mese RFQ qualificate |
| **Catalogo Prodotti** | {{catalog_status}} | Impossibilità mostrare specifiche tecniche strutturate |
| **Accessibilità** | {{a11y_status}} | Rischio legale + esclusione utenti disabili |

> **Benchmark settore:** Le aziende competitor che hanno migrato a stack moderno (Next.js + Headless CMS + Schema.org) registrano **+38% RFQ qualificate** nei primi 90 giorni (dati interni 2023-2024, campione 47 aziende manifatturiere Nord Italia).

---

## 3. SOLUZIONE PROPOSTA

### {{selected_plan_name}} — € {{price}}/{{currency}}

**Cosa include:**

{{#each includes}}
- {{this}}
{{/each}}

**Tecnologie:**
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **CMS:** Ghost 5.x Headless (self-hosted su Railway, incluso 1 anno hosting)
- **Deploy:** Netlify/Vercel (Edge Network globale, 99.99% uptime SLA)
- **Dominio:** {{custom_domain}} (configurazione DNS + SSL Let's Encrypt automatico)
- **Analytics:** GA4 + GTM + Consent Mode v2 (GDPR compliant)
- **Monitoring:** Uptime + Core Web Vitals (Checkly, alert real-time)

### Demo Live Personalizzata
Ha già visionato la demo: **{{demo_url}}**

Include:
- Hero con hook specifico per {{sector}}
- Confronto prima/dopo (screenshot reale vs prototype)
- **Calcolatore ROI interattivo** (inserisce Suo traffico → vede fatturato potenziale)
- Case study settore {{sector}}
- Catalogo prodotti navigabile

### Anteprima Sito Produzione
Dopo accettazione, riceverà link preview: **{{preview_url}}**
Potrà testare: navigazione, form RFQ, catalogo, blog, multilingua.

---

## 4. INVESTIMENTO E PAGAMENTO

| Voce | Importo |
|------|---------|
| **{{selected_plan_name}}** | € {{price}} |
| Acconto alla firma ({{deposit_percent}}%) | € {{deposit_amount}} |
| Saldo a consegna | € {{balance_amount}} |
| **Totale** | **€ {{price}}** |

### Modalità pagamento:
1. **Bonifico bancario** (preferito, zero commissioni)
   - **IBAN:** {{iban}}
   - **BIC/SWIFT:** {{bic}}
   - **Intestatario:** ZAK Studio Web S.r.l.
   - **Banca:** {{bank}}
   - **Causale:** Acconto sito web - Rif. ZAK/{{year}}/{{sequential_number}} - {{company_name}}

2. **Stripe Payment Link** (carta, Satispay, bonifico istantaneo)
   - Link: {{stripe_payment_link}}
   - Scadenza: {{expiry_days}} giorni

3. **Rateizzazione** (fino a 6 mesi, interessi zero)
   - Richiedibile in fase contrattuale

> **Nota:** L'acconto del 40% serve a coprire costi vivi (setup CMS, licenze, ore sviluppo iniziali). Il saldo è dovuto esclusivamente a consegna completata e testata.

---

## 5. TIMELINE CONSEGNA

| Fase | Giorni | Descrizione |
|------|--------|-------------|
| **Kick-off & Setup** | 1-3 | Provisioning CMS, repo Git, dominio, SSL, analytics |
| **Sviluppo Core** | 4-14 | Template settore, catalogo prodotti, form RFQ, schema.org |
| **Contenuti & SEO** | 15-18 | Importazione testi, immagini, meta tags, sitemap, schema |
| **QA & Testing** | 19-20 | Core Web Vitals, accessibilità, cross-browser, form, mobile |
| **Deploy Preview** | 20 | Link preview per Sua approvazione (2 revisioni incluse) |
| **Go-Live** | 21 | Switch DNS, SSL, monitoring attivo, consegna credenziali |

**Totale: {{timeline_days}} giorni lavorativi dalla firma.**

> In caso di piano **Premium** (multilingua, CRM sync, A/B testing): **+7 giorni**.

---

## 6. CONTRATTO E DOCUMENTAZIONE

Allegati a questa proposta:
1. **Contratto Servizi Web B2B** (precompilato con Suoi dati) — da firmare digitalmente
2. **Specifiche Tecniche Complete** (allegato A)
3. **Case Study Settore {{sector}}** (risultati misurabili)
4. **Demo Live** — {{demo_url}}
5. **Scheda Tecnica Sito Produzione** (stack, performance, sicurezza)

Il contratto include:
- Clausole GDPR (Art. 28 DPA incluso)
- Proprietà intellettuale (codice + design = Suo a consegna)
- SLA uptime 99.9% + penalty
- Supporto post-go-live (30gg base / 90gg premium)
- Risoluzione controversie (foro competente Milano)

---

## 7. PROSSIMI PASSI

1. **Visiona** la demo: {{demo_url}}
2. **Scarica e firma** il contratto (firma digitale PAdES o stampata+scansionata)
3. **Effettua l'acconto** (bonifico o Stripe) entro **{{expiry_days}} giorni**
4. **Rispondi a questa email** con contratto firmato + ricevuta pagamento
5. **Partiamo** — kick-off entro 24h

---

## 8. CONTATTI

Per qualsiasi dubbio, domanda tecnica o commerciale:

**Mario Rossi — Founder & CEO**  
📧 mario.rossi@zakstudio.com  
📞 +39 02 1234 5678  
📅 Call 15 min: {{calendly_link}}  
🌐 zakstudio.com

---

*Proposta valida fino al {{expiry_date}}.  
ZAK Studio Web S.r.l. — Via delle Industrie 15, 20100 Milano (MI) — P.IVA IT01234567890 — REA MI-1234567 — Cap. Soc. € 10.000 i.v.  
PEC: zakstudio@pec.it — IBAN: {{iban}} — BIC: {{bic}}*

---

**Allegati:**
- Contratto_Servizi_Web_{{company_name}}.pdf
- Specifiche_Tecniche_{{company_name}}.pdf
- Case_Study_{{sector}}.pdf