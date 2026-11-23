import { Metadata } from 'next';
import { RFQForm } from '@/components/sections/RFQForm';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, Shield, Clock, Mail, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Richiedi Preventivo | ZAK Studio Web',
  description: 'Richiedi un preventivo personalizzato per il tuo sito web B2B manufacturing. Ricevi risposta entro 24h. Form sicuro, GDPR compliant, SSL/TLS 1.3.',
  openGraph: {
    title: 'Richiedi Preventivo | ZAK Studio Web',
    description: 'Preventivo sito web B2B manufacturing in 24h. Next.js 14 + Ghost CMS + Schema.org.',
    type: 'website',
  },
};

const processSteps = [
  { icon: <Send className="w-5 h-5" />, title: 'Invio richiesta', desc: 'Compili il form con i dettagli del tuo progetto. Ci vogliono 2 minuti.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Analisi tecnica', desc: 'Il nostro team analizza requisiti, settore, competitor e stack tecnologico ottimale.' },
  { icon: <Clock className="w-5 h-5" />, title: 'Preventivo dettagliato', desc: 'Ricevi preventivo completo con timeline, specifiche tecniche, investimento e ROI stimato.' },
  { icon: <CheckCircle className="w-5 h-5" />, title: 'Kick-off progetto', desc: 'Firma contratto, acconto 40%, partenza lavori entro 24h. Consegna in 21 giorni.' },
];

const faq = [
  {
    q: 'Quanto costa un sito web B2B manufacturing?',
    a: 'Il piano Business parte da €3.500 (IVA esclusa) e include Next.js 14, Ghost CMS, catalogo 50 prodotti, form RFQ, Schema.org, deploy edge, SSL, 30gg supporto. Il piano Enterprise a €6.500 aggiunge multilingua, CRM sync, marketing automation, A/B testing, 90gg supporto prioritario.',
  },
  {
    q: 'Quali sono i tempi di consegna?',
    a: '21 giorni lavorativi per il piano Business (28 per Enterprise) dalla firma del contratto e ricezione materiali (testi, logo, immagini, schede prodotti). Il timeline include: setup (3gg), sviluppo core (11gg), contenuti/SEO (4gg), QA (2gg), deploy preview, go-live.',
  },
  {
    q: 'Cosa è incluso nel prezzo?',
    a: 'Sviluppo frontend Next.js 14 + TypeScript + Tailwind, configurazione Ghost CMS headless (hosting 1 anno incluso), catalogo prodotti dinamico, form RFQ con validazione e honeypot, Schema.org completo (Organization, Product, Service, Breadcrumb, FAQ), deploy Netlify/Vercel + dominio custom + SSL, sitemap.xml, robots.txt, meta SEO, Open Graph, Core Web Vitals ottimizzati, accessibilità WCAG 2.1 AA, documentazione tecnica + credenziali accesso CMS/Hosting, 30gg supporto post-go-live.',
  },
  {
    q: 'Posso rateizzare il pagamento?',
    a: 'Sì, offriamo rateizzazione fino a 6 mesi senza interessi. Prima rata (40%) alla firma del contratto, rate successive mensili. Disponibile sia per bonifico che per Stripe.',
  },
  {
    q: 'Il sito sarà di mia proprietà?',
    a: 'Sì. A consegna e saldo pagato, acquisisci piena proprietà di: codice sorgente frontend (repository Git privato), design system, componenti, stili, configurazione CMS e contenuti importati, documentazione tecnica. Conserviamo diritti su librerie interne riutilizzabili e know-how.',
  },
  {
    q: 'Come funziona il form RFQ?',
    a: 'Il form RFQ include honeypot anti-spam, validazione client/server-side (Zod), reCAPTCHA v3 opzionale, invio email immediato a te e al tuo CRM (webhook), conferma automatica al richiedente, tracking UTM per attribuzione marketing. Tutto GDPR compliant.',
  },
];

export default function PreventivoPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-20 pb-12 lg:pt-32 lg:pb-20 bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="page-heading">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <h1 id="page-heading" className="heading-h1 mb-4">Richiedi il tuo preventivo personalizzato</h1>
          <p className="text-body-lg text-secondary-600 dark:text-secondary-400 mb-8">
            Compila il form in 2 minuti. Ricevi analisi gratuita del tuo sito attuale + preventivo dettagliato con timeline, specifiche tecniche e ROI stimato entro 24 ore lavorative.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-secondary-600 dark:text-secondary-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> GDPR & Sicurezza</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Risposta 24h</span>
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> Conferma email immediata</span>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="form-heading">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 id="form-heading" className="sr-only">Form richiesta preventivo</h2>
          <RFQForm
            availableProducts={[
              { id: 'business', name: 'Piano Business - €3.500' },
              { id: 'enterprise', name: 'Piano Enterprise - €6.500' },
            ]}
          />
        </div>
      </section>

      <section className="section bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="process-heading">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="process-heading" className="heading-h2 mb-4">Come funziona: dal preventivo al go-live</h2>
            <p className="text-body-lg text-secondary-600 dark:text-secondary-400">
              Processo trasparente, tempi certi, Zero sorprese.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <Card key={index} variant="hover" className="p-6 relative">
                {index < 3 && (
                  <div className="absolute top-8 right-0 hidden lg:block w-12 h-12 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-200 dark:text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 flex-shrink-0">
                  {step.icon}
                </div>
                <div className="text-3xl font-heading font-bold text-primary-600 dark:text-primary-400 mb-2">{index + 1}</div>
                <h3 className="heading-h4 mb-2">{step.title}</h3>
                <p className="text-body text-secondary-600 dark:text-secondary-400">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-heading">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 id="faq-heading" className="heading-h2 text-center mb-12">Domande frequenti</h2>

          <div className="space-y-4">
            {faq.map((item, index) => (
              <details key={index} className="card-hover group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="heading-h4 pr-8">{item.q}</h3>
                  <svg className="w-5 h-5 text-secondary-400 transition-transform group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 animate-slide-down">
                  <p className="text-body text-secondary-600 dark:text-secondary-400">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-primary-600 dark:bg-primary-700" aria-labelledby="cta-heading">
        <div className="container-custom text-center">
          <h2 id="cta-heading" className="heading-h2 text-white mb-4">Hai ancora dubbi? Parliamone.</h2>
          <p className="text-body-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Prenota una call di 15 minuti senza impegno. Rispondiamo a tutte le tue domande tecniche, commerciali e contrattuali.
          </p>
          <a
            href="https://calendly.com/zakstudio/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium rounded-lg border-2 border-white text-white hover:bg-primary-500 transition-colors"
          >
            Prenota call 15 min <Send className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}