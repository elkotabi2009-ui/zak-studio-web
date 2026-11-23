import { Metadata } from 'next';
import { Hero, defaultHeroFeatures } from '@/components/sections/Hero';
import { ProductCatalog } from '@/components/sections/ProductCatalog';
import { RFQForm } from '@/components/sections/RFQForm';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardMedia } from '@/components/ui/Card';
import { ArrowRight, CheckCircle, BarChart3, Zap, Shield, Globe,_target, Users, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Siti Web B2B per Produzione Industriale | ZAK Studio Web',
  description: 'Realizziamo siti web conversion-focused per aziende manifatturiere. Next.js 14 + Ghost CMS + Schema.org completo. Catalogo prodotti dinamico, form RFQ intelligente, Core Web Vitals ottimizzati.',
  keywords: ['sito web B2B', 'manifatturiero', 'Next.js', 'Ghost CMS', 'RFQ', 'lead generation', 'industria 4.0', 'sito web industriale'],
  openGraph: {
    title: 'Siti Web B2B per Produzione Industriale | ZAK Studio Web',
    description: 'Next.js 14 + Ghost CMS + Schema.org. RFQ, catalogo prodotti, Core Web Vitals ottimizzati.',
    type: 'website',
    images: ['/og-home.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Siti Web B2B per Produzione Industriale',
    description: 'Next.js 14 + Ghost CMS + Schema.org. RFQ, catalogo prodotti, Core Web Vitals ottimizzati.',
    images: ['/og-home.png'],
  },
};

const stats = [
  { value: '+38%', label: 'RFQ qualificate in 90 giorni' },
  { value: '<2.5s', label: 'LCP mobile garantito' },
  { value: '99.99%', label: 'Uptime SLA Edge Network' },
  { value: 'WCAG AA', label: 'Accessibilità certificata' },
];

const trustIndicators = [
  { icon: <Award className="w-6 h-6" />, title: 'ISO 9001:2015', desc: 'Qualità certificata' },
  { icon: <Shield className="w-6 h-6" />, title: 'ISO 27001:2022', desc: 'Sicurezza informazioni' },
  { icon: <Globe className="w-6 h-6" />, title: 'GDPR Compliant', desc: 'Privacy by design' },
  { icon: <Users className="w-6 h-6" />, title: 'Team Senior', desc: '15+ anni esperienza' },
];

const sectors = [
  { slug: 'presse-idrauliche', name: 'Presse Idrauliche', icon: '⚙️', count: 12 },
  { slug: 'macchine-utensili', name: 'Macchine Utensili', icon: '🔧', count: 8 },
  { slug: 'stampaggio-metalli', name: 'Stampaggio Metalli', icon: '🏭', count: 15 },
  { slug: 'automazione-industriale', name: 'Automazione Industriale', icon: '🤖', count: 10 },
  { slug: 'componentistica-automotive', name: 'Componentistica Automotive', icon: '🚗', count: 7 },
  { slug: 'meccanica-precisione', name: 'Meccanica di Precisione', icon: '🎯', count: 9 },
];

const featuredProducts = [
  {
    id: '1',
    slug: 'pressa-idraulica-500t',
    name: 'Pressa Idraulica 500T',
    category: 'Presse Idrauliche',
    shortDescription: 'Pressa a 4 colonne per stampaggio lamiere spesse, controllo CNC, cambio stampo rapido.',
    features: ['Forza 5000 kN', 'Corsa 800 mm', 'Velocità 150 mm/s', 'CNC Siemens 840D'],
    images: ['/images/press-500t.jpg'],
    isFeatured: true,
    isNew: false,
  },
  {
    id: '2',
    slug: 'centro-lavoro-5assi',
    name: 'Centro Lavoro 5 Assi',
    category: 'Macchine Utensili',
    shortDescription: 'Lavorazione simultanea 5 assi, cambio utensile 60 posizioni, precisione ±0.003mm.',
    features: ['Corsa X/Y/Z 800/600/550', 'Mandrino 18.000 rpm', 'Cambio utensile 2.5s', 'Heidenhain TNC640'],
    images: ['/images/5axis.jpg'],
    isFeatured: true,
    isNew: true,
  },
  {
    id: '3',
    slug: 'stampo-progressivo',
    name: 'Stampo Progressivo Auto',
    category: 'Stampaggio Metalli',
    shortDescription: 'Stampo progressivo per componenti automotive, 24 stazioni, acciaio HSLA.',
    features: ['24 stazioni', 'Materiale HSLA 420MPa', 'Ciclo 15 colpi/min', 'Durata 500k pezzi'],
    images: ['/images/progressive-die.jpg'],
    isFeatured: false,
    isNew: false,
  },
  {
    id: '4',
    slug: 'robot-collaborativo',
    name: 'Robot Collaborativo UR10e',
    category: 'Automazione Industriale',
    shortDescription: 'Cobot payload 10kg, reach 1300mm, force sensing, programmazione intuitiva.',
    features: ['Payload 10 kg', 'Reach 1300 mm', 'Force/torque sensor', 'Polyscope UI'],
    images: ['/images/cobot.jpg'],
    isFeatured: true,
    isNew: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero
        headline="Siti Web B2B che generano RFQ qualificate per l'industria manifatturiera"
        subheadline="Non realizziamo vetrine. Costruiamo motori di lead generation: Next.js 14, Ghost CMS headless, Schema.org completo, catalogo prodotti dinamico, form RFQ intelligente. Risultati misurabili in 90 giorni."
        ctaText="Richiedi un preventivo"
        ctaHref="/preventivo"
        secondaryCtaText="Vedi demo live"
        secondaryCtaHref="/demo"
        badgeText="Nuovo: Calcolatore ROI interattivo nella demo"
        stats={stats}
        features={defaultHeroFeatures}
      />

      <section className="section bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="sectors-heading">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="sectors-heading" className="heading-h2 mb-4">Specializzati nel tuo settore</h2>
            <p className="text-body-lg text-secondary-600 dark:text-secondary-400">
              Conosciamo le specificità tecniche, commerciali e normative di ogni comparto manifatturiero.
              Il tuo sito parlerà la lingua dei tuoi clienti.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {sectors.map((sector) => (
              <Link
                key={sector.slug}
                href={`/settore/${sector.slug}`}
                className="card-hover group p-6 text-center"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{sector.icon}</div>
                <h3 className="heading-h4 mb-1">{sector.name}</h3>
                <p className="text-sm text-secondary-500 dark:text-secondary-500">
                  {sector.count} progetti realizzati
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="catalog-heading">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <h2 id="catalog-heading" className="heading-h2 mb-2">Esempi dal catalogo prodotti</h2>
              <p className="text-body text-secondary-600 dark:text-secondary-400">
                Ogni scheda prodotto include specifiche tecniche complete, immagini ad alta risoluzione, brochure PDF scaricabili e Schema.org Product markup.
              </p>
            </div>
            <Link href="/catalogo" className="btn-outline">
              Vedi catalogo completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ProductCatalog
            products={featuredProducts}
            categories={sectors.map(s => ({ id: s.slug, slug: s.slug, name: s.name, productCount: s.count }))}
            maxProducts={4}
            showFilters={false}
          />
        </div>
      </section>

      <section className="section bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="tech-heading">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="tech-heading" className="heading-h2 mb-4">Tecnologia all'avanguardia, performance garantite</h2>
            <p className="text-body-lg text-secondary-600 dark:text-secondary-400">
              Stack moderno, deploy edge globale, monitoraggio continuo. Il tuo sito è veloce, sicuro e scalabile dal giorno uno.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="hover" className="text-center p-8">
              <CardMedia aspectRatio="square" className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </CardMedia>
              <h3 className="heading-h4 mb-2">Core Web Vitals</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">
                LCP < 2.5s, INP < 200ms, CLS < 0.1 su mobile e desktop. Misurati, non promessi.
              </p>
            </Card>

            <Card variant="hover" className="text-center p-8">
              <CardMedia aspectRatio="square" className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Globe className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </CardMedia>
              <h3 className="heading-h4 mb-2">Edge Network Globale</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">
                Deploy su Netlify/Vercel Edge: 350+ PoP worldwide, 99.99% uptime SLA, zero cold starts.
              </p>
            </Card>

            <Card variant="hover" className="text-center p-8">
              <CardMedia aspectRatio="square" className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </CardMedia>
              <h3 className="heading-h4 mb-2">Sicurezza Enterprise</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">
                SSL/TLS 1.3, HSTS, CSP, Rate Limiting, WAF, backup cifrati giornalieri, disaster recovery.
              </p>
            </Card>

            <Card variant="hover" className="text-center p-8">
              <CardMedia aspectRatio="square" className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Target className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </CardMedia>
              <h3 className="heading-h4 mb-2">Schema.org Completo</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">
                Organization, Product, Service, Breadcrumb, FAQ, HowTo, JobPosting. SEO tecnico nativo.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="trust-heading">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="trust-heading" className="heading-h2 mb-4">Perché scegliere ZAK Studio Web</h2>
            <p className="text-body-lg text-secondary-600 dark:text-secondary-400">
              Non siamo un'agenzia generica. Siamo specialisti B2B manufacturing con risultati misurabili.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {trustIndicators.map((indicator, index) => (
              <Card key={index} variant="hover" className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                  {indicator.icon}
                </div>
                <h3 className="heading-h4 mb-2">{indicator.title}</h3>
                <p className="text-body text-secondary-600 dark:text-secondary-400">{indicator.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-primary-600 dark:bg-primary-700" aria-labelledby="cta-heading">
        <div className="container-custom text-center">
          <h2 id="cta-heading" className="heading-h2 text-white mb-4">Pronto a trasformare il tuo sito in un motore di lead?</h2>
          <p className="text-body-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Prenota una call di 15 minuti. Analizziamo il tuo sito attuale, ti mostriamo la demo live del tuo settore e calcoliamo il ROI potenziale. Nessun impegno.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" asChild className="bg-white text-primary-600 hover:bg-primary-50">
              <a href="/preventivo">Richiedi preventivo <ArrowRight className="w-4 h-4" /></a>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-primary-500" asChild>
              <a href="https://calendly.com/zakstudio/15min" target="_blank" rel="noopener noreferrer">Prenota call 15 min</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="section bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="rfq-heading">
        <div className="container-custom max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="rfq-heading" className="heading-h2 mb-4">Provalo ora: richiedi un preventivo di test</h2>
            <p className="text-body text-secondary-600 dark:text-secondary-400">
              Compila il form qui sotto come se fossi un tuo cliente. Riceverai la conferma immediata e vedrai come funziona l'intero flusso RFQ.
            </p>
          </div>
          <RFQForm
            availableProducts={featuredProducts.map(p => ({ id: p.id, name: p.name }))}
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>
    </div>
  );
}