# Sender Profile — ZAK Studio Web
**Compila OGNI campo. Niente placeholder.**

---

## 👤 Chi sei (il mittente umano)
| Campo | Valore |
|-------|--------|
| **Nome completo** | [Il tuo nome e cognome] |
| **Ruolo** | [Founder / CEO / Web Developer / Creative Director] |
| **Anni esperienza** | [es. 5 anni freelance, 3 anni agenzia, primo cliente 2021] |
| **Perché tu?** | [Il tuo "unfair advantage": ex-dev che capisce tech, designer che capisce conversion, ex-marketer che capisce funnel, locale che capisce mercato...] |

---

## 🏢 Cosa vendi (l'offer)
| Campo | Valore |
|-------|--------|
| **Servizio core** | [es. Siti web B2B conversion-focused per PMI industriali] |
| **Target primario** | [es. Aziende 10-50 dip, fatturato 1-10M€, settore manifatturiero/B2B services] |
| **Pacchetti & Prezzi** | **Starter:** €[X] — [cosa include]<br>**Growth:** €[Y] — [cosa include]<br>**Scale:** €[Z] — [cosa include] |
| **Delivery timeline** | [es. 4-6 settimane dalla firma] |
| **Differenziatore** | [Perché scegliere te vs agenzia generica / freelance / builder fai-da-te] |

---

## 🏆 Proof Points (3 MINIMO — veri, verificabili)
| # | Cliente / Progetto | Problema | Soluzione | Risultato Misurabile |
|---|-------------------|----------|-----------|---------------------|
| 1 | [Nome azienda o "Azienda manifatturiera Veneto"] | [es. Sito vecchio, 0 lead/mese] | [es. Nuovo sito + landing per campagna Google Ads] | [es. +12 lead qualificati/mese, -40% CAC] |
| 2 | [Nome azienda o settore] | [Problema] | [Soluzione] | [Risultato] |
| 3 | [Nome azienda o settore] | [Problema] | [Soluzione] | [Risultato] |

> **Nota:** Se non hai 3 clienti paganti con risultati, metti progetti pro-bono, personali, o case study "ipotetici basati su best practice" — ma **dichiaralo onestamente**.

---

## 📧 Identità Email (per cold outreach)
| Campo | Valore |
|-------|--------|
| **Dominio dedicato** | `outreach.zakstudio.com` (già configurato? Sì/No) |
| **Indirizzo mittente** | `[nome]@outreach.zakstudio.com` |
| **Nome visualizzato** | `[Tuo Nome] — ZAK Studio Web` |
| **SPF/DKIM/DMARC** | Configurati? [Sì/No] — Test mail-tester.com: [score/10] |
| **Warmup completato** | [Sì/No — settimane, volume finale/giorno] |
| **ESP/Tool invio** | [Resend / SendGrid / Customer.io / Mailgun / Altro] |
| **DPA firmato con ESP** | [Sì/No — data] |

---

## ⚖️ Legal Basis & Compliance
| Elemento | Status | Note |
|----------|--------|------|
| **Lawful basis (GDPR Art. 6)** | Legitimate Interest (Art. 6.1.f) | LIA documentato in `05-legal/legitimate-interest-assessment.md` |
| **LIA completato** | [Sì/No] | 3-part test: purpose, necessity, balancing |
| **RoPA aggiornato** | [Sì/No] | `05-legal/gdpr-ropa.md` — ultimo aggiornamento: [data] |
| **Unsubscribe mechanism** | [Sì/No] | One-click, funziona, testato |
| **Footer legale completo** | [Sì/No] | Ragione sociale, P.IVA, sede, REA, privacy policy link |
| **Suppression list attiva** | [Sì/No] | `02-data/suppression-list.csv` aggiornata real-time |
| **Breach log + 72h process** | [Sì/No] | `05-legal/breach-log.md` + responsabile nominato |
| **DSAR workflow** | [Sì/No] | `05-legal/dsar-workflow.md` — rispondi in 30gg |
| **DPA con processori** | [Sì/No] | ESP, tool enrichment, CRM — tutti firmati |

---

## 🎯 Obiettivi Outreach (KPI)
| Metrica | Target | Come misuri |
|---------|--------|-------------|
| Email/giorno (dopo warmup) | [es. 50-100] | Dashboard ESP |
| Open rate | ≥ 40% | ESP tracking |
| Reply rate | ≥ 8% | Reply manuali + auto-classifier |
| Meeting booked / 200 | ≥ 4 (2%) | Calendly/Cal.com link |
| Unsubscribe rate | < 1% | ESP + suppression list |
| Bounce rate | < 2% | Verifica pre-invio (ZeroBounce) |

---

## 📅 Prossimi Step (Da completare PRIMA di lanciare)
- [ ] Compilare questo file al 100%
- [ ] Compilare `icp-definition.md` con 200 aziende target
- [ ] Completare warmup dominio (4-6 settimane)
- [ ] Finalizzare LIA + RoPA + DPA (`05-legal/`)
- [ ] Creare 3 case study PDF (`07-assets/case-studies/`)
- [ ] Setup Calendly/Cal.com link (`07-assets/cal-link.md`)
- [ ] Scrivere sequenza 6 email (`03-sequences/`) con cold-email skill
- [ ] Legal sign-off 🟢 DPA-READY
- [ ] Test invio 10 email interne → controlla deliverability, rendering, unsubscribe