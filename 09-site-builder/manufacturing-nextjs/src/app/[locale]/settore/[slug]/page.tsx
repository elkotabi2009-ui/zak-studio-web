import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCatalog } from '@/components/sections/ProductCatalog';
import { Hero } from '@/components/sections/Hero';
import { RFQForm } from '@/components/sections/RFQForm';
import { Card, CardContent, CardMedia } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, CheckCircle, BarChart3, Zap, Shield, Globe, Target, Users, Award, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const sectors = {
  'presse-idrauliche': {
    name: 'Presse Idrauliche',
    icon: '⚙️',
    description: 'Dalle presse a 4 colonne per stampaggio lamiere alle servoidrauliche di precisione per forgiatura a caldo. Schede tecniche con forze 200-10.000 kN, curve forza-tempo, automazione robotizzata.',
    keywords: ['pressa idraulica', 'stampaggio lamiere', 'forgiatura a caldo', 'servoidraulica', 'presse 4 colonne'],
    stats: [{ value: '12+', label: 'Progetti realizzati' }, { value: '5000 kN', label: 'Forza max gestita' }, { value: '±0.01mm', label: 'Precisione servoidraulica' }, { value: '24/7', label: 'Affidabilità produzione' }],
    caseStudies: [
      { title: 'Pressa 500T per stampaggio automotive', client: 'Tier 1 Automotive', result: 'Ciclo -35%, qualità +28%', href: '/case-study/pressa-500t-automotive' },
      { title: 'Servoidraulica 200T per precisione medicale', client: 'Medical Device Manufacturer', result: 'Scarti -92%, Cpk 2.1', href: '/case-study/servo-medical' },
    ],
    featuredProducts: [
      { id: '1', slug: 'pressa-idraulica-500t', name: 'Pressa Idraulica 500T', category: 'Presse Idrauliche', shortDescription: 'Pressa a 4 colonne per stampaggio lamiere spesse, controllo CNC, cambio stampo rapido.', features: ['Forza 5000 kN', 'Corsa 800 mm', 'Velocità 150 mm/s', 'CNC Siemens 840D'], images: ['/images/press-500t.jpg'], isFeatured: true, isNew: false },
      { id: '2', slug: 'pressa-idraulica-1000t', name: 'Pressa Idraulica 1000T', category: 'Presse Idrauliche', shortDescription: 'Pressa a montanti per forgiatura a caldo, forze fino a 10.000 kN, automazione completa.', features: ['Forza 10.000 kN', 'Corsa 1200 mm', 'Automazione robotizzata', 'Controllo termico'], images: ['/images/press-1000t.jpg'], isFeatured: false, isNew: true },
      { id: '3', slug: 'pressa-servoidraulica', name: 'Pressa Servoidraulica 200T', category: 'Presse Idrauliche', shortDescription: 'Pressa servoidraulica ad alta precisione per stampaggio precisione, curva forza-tempo programmabile.', features: ['Forza 2000 kN', 'Precisione ±0.01mm', 'Curva programmabile', 'Efficienza +40%'], images: ['/images/servo-press.jpg'], isFeatured: true, isNew: false },
    ],
  },
  'macchine-utensili': {
    name: 'Macchine Utensili',
    icon: '🔧',
    description: 'Centri lavoro 5 assi, torni multitasking, rettificatrici CNC alta precisione. Lavorazione completa in un setup, tolleranze micrometriche, automazione pallettizzata.',
    keywords: ['centro lavoro 5 assi', 'torno multitasking', 'rettificatrice CNC', 'lavorazione simultanea', 'pallettizzazione'],
    stats: [{ value: '8+', label: 'Progetti realizzati' }, { value: '±0.003mm', label: 'Precisione 5 assi' }, { value: '18.000 rpm', label: 'Mandrino max' }, { value: '60 pos.', label: 'Cambio utensile' }],
    caseStudies: [
      { title: 'Centro lavoro 5 assi per aerospaziale', client: 'Aerospace Supplier', result: 'Setup -60%, lead time -45%', href: '/case-study/5axis-aerospace' },
      { title: 'Torno multitasking per medicale', client: 'Orthopedic Implants', result: 'Operazioni 12→1, costi -40%', href: '/case-study/multitasking-medical' },
    ],
    featuredProducts: [
      { id: '4', slug: 'centro-lavoro-5assi', name: 'Centro Lavoro 5 Assi', category: 'Macchine Utensili', shortDescription: 'Lavorazione simultanea 5 assi, cambio utensile 60 posizioni, precisione ±0.003mm.', features: ['Corsa 800/600/550', 'Mandrino 18.000 rpm', 'Cambio 2.5s', 'Heidenhain TNC640'], images: ['/images/5axis.jpg'], isFeatured: true, isNew: true },
      { id: '5', slug: 'tornio-cnc-multitasking', name: 'Torno CNC Multitasking', category: 'Macchine Utensili', shortDescription: 'Torno fresatrice Y/B axis, 2 torrette, 2 mandrini, lavorazione completa in un setup.', features: ['Ø max 320mm', 'Lunghezza 1000mm', 'Mandrino 6000/12000', 'Fanuc 31i-B'], images: ['/images/multitasking.jpg'], isFeatured: false, isNew: false },
      { id: '6', slug: 'rettificatrice-cnc', name: 'Rettificatrice CNC Alta Precisione', category: 'Macchine Utensili', shortDescription: 'Rettificatrice tangenziale per particolari precisione, risoluzione 0.1µm, compensazione termica.', features: ['Tavola 600x300', 'Risoluzione 0.1µm', 'Compensazione termica', 'Misurazione in-process'], images: ['/images/grinder.jpg'], isFeatured: true, isNew: false },
    ],
  },
  'stampaggio-metalli': {
    name: 'Stampaggio Metalli',
    icon: '🏭',
    description: 'Stampi progressivi, transfer, tranciatura fine per automotive, elettrodomestici, elettronica. Simulazione FEM, prove stampo, manutenzione predittiva, durata 500k+ pezzi.',
    keywords: ['stampo progressivo', 'stampo transfer', 'tranciatura fine', 'simulazione FEM', 'manutenzione predittiva'],
    stats: [{ value: '15+', label: 'Progetti realizzati' }, { value: '500k+', label: 'Durata stampi' }, { value: '±0.02mm', label: 'Tolleranza tranciatura' }, { value: '300 c/min', label: 'Velocità max' }],
    caseStudies: [
      { title: 'Stampo progressivo 24 stazioni auto', client: 'OEM Automotive', result: 'Ciclo 15 c/min, zero scarti', href: '/case-study/progressive-auto' },
      { title: 'Tranciatura fine per connettori', client: 'Electronics Manufacturer', result: 'Tolleranza ±0.01mm, 300 c/min', href: '/case-study/fine-blanking-connectors' },
    ],
    featuredProducts: [
      { id: '7', slug: 'stampo-progressivo', name: 'Stampo Progressivo Auto', category: 'Stampaggio Metalli', shortDescription: 'Stampo progressivo per componenti automotive, 24 stazioni, acciaio HSLA.', features: ['24 stazioni', 'HSLA 420MPa', '15 c/min', 'Durata 500k'], images: ['/images/progressive-die.jpg'], isFeatured: false, isNew: false },
      { id: '8', slug: 'stampo-trasferimento', name: 'Stampo Trasferimento Grossi Spessori', category: 'Stampaggio Metalli', shortDescription: 'Stampo transfer per particolari spessore 3-8mm, 6 stazioni, cambio rapido.', features: ['3-8mm', '6 stazioni', 'Cambio <15min', 'Qualità integrata'], images: ['/images/transfer-die.jpg'], isFeatured: true, isNew: true },
      { id: '9', slug: 'stampo-tranciatura-fine', name: 'Stampo Tranciatura Fine', category: 'Stampaggio Metalli', shortDescription: 'Stampo tranciatura fine per componenti elettronici, tolleranze ±0.02mm, zero bave.', features: ['±0.02mm', 'Zero bave', '300 c/min', '0.1-1.5mm'], images: ['/images/fine-blanking.jpg'], isFeatured: false, isNew: false },
    ],
  },
  'automazione-industriale': {
    name: 'Automazione Industriale',
    icon: '🤖',
    description: 'Robot collaborativi, celle robotizzate saldatura/assemblaggio, AGV navigazione SLAM, visione 3D, offline programming, Industry 4.0 ready, sicurezza integrata.',
    keywords: ['robot collaborativo', 'cella robotizzata', 'AGV SLAM', 'visione 3D', 'Industry 4.0'],
    stats: [{ value: '10+', label: 'Progetti realizzati' }, { value: '10 kg', label: 'Payload cobot' }, { value: '1500 kg', label: 'Payload AGV' }, { value: 'ISO 10218', label: 'Sicurezza robotica' }],
    caseStudies: [
      { title: 'Cella saldatura robotizzata 6 assi', client: 'Heavy Machinery', result: 'Produzione +85%, costi -30%', href: '/case-study/welding-cell' },
      { title: 'Flotta AGV 12 veicoli logistica', client: 'Logistics Center', result: 'Movimentazione 24/7, ROI 14 mesi', href: '/case-study/agv-fleet' },
    ],
    featuredProducts: [
      { id: '10', slug: 'robot-collaborativo', name: 'Robot Collaborativo UR10e', category: 'Automazione Industriale', shortDescription: 'Cobot payload 10kg, reach 1300mm, force sensing, programmazione intuitiva.', features: ['Payload 10 kg', 'Reach 1300 mm', 'Force/torque sensor', 'Polyscope UI'], images: ['/images/cobot.jpg'], isFeatured: true, isNew: false },
      { id: '11', slug: 'cellula-robotizzata-saldatura', name: 'Cellula Robotizzata Saldatura', category: 'Automazione Industriale', shortDescription: 'Cella saldatura MIG/TIG con robot 6 assi, posizione rotante, visione 3D.', features: ['Robot 20kg', 'Posizionatore rotante', 'Visione 3D', 'Offline programming'], images: ['/images/welding-cell.jpg'], isFeatured: false, isNew: true },
      { id: '12', slug: 'agv-logistica', name: 'AGV Navigazione Naturale', category: 'Automazione Industriale', shortDescription: 'Veicoli a guida autonoma navigazione SLAM, payload 1500kg, ricarica opportunistica.', features: ['SLAM', '1500 kg', 'Ricarica opportunistica', 'Flotta centralizzata'], images: ['/images/agv.jpg'], isFeatured: true, isNew: false },
    ],
  },
  'componentistica-automotive': {
    name: 'Componentistica Automotive',
    icon: '🚗',
    description: 'Componenti powertrain, telaio, carrozzeria per OEM e Tier 1. IATF 16949, PPAP, APQP, FMEA, MSA, Cpk > 1.67, tracciabilità totale, zero difetti.',
    keywords: ['componenti powertrain', 'componenti telaio', 'IATF 16949', 'PPAP', 'Cpk 1.67'],
    stats: [{ value: '7+', label: 'Progetti realizzati' }, { value: 'IATF 16949', label: 'Certificazione' }, { value: 'Cpk > 1.67', label: 'Capacità processo' }, { value: 'PPAP Liv. 3', label: 'Approvazione' }],
    caseStudies: [
      { title: 'Alberi trasmissione precisione IT5', client: 'Transmission Supplier', result: 'Cpk 2.1, PPAP approvato', href: '/case-study/transmission-shafts' },
      { title: 'Travi telaio saldate robotizzate', client: 'Chassis Manufacturer', result: '100% visione, zero richiami', href: '/case-study/chassis-welded' },
    ],
    featuredProducts: [
      { id: '13', slug: 'componente-powertrain', name: 'Componenti Powertrain Precisione', category: 'Componentistica Automotive', shortDescription: 'Alberi, ingranaggi, flange per trasmissioni, tolleranze IT5-IT6, Cpk > 1.67.', features: ['IT5-IT6', 'Cpk > 1.67', '16MnCr5/20MnCr5', 'Trattamento termico'], images: ['/images/powertrain.jpg'], isFeatured: false, isNew: false },
      { id: '14', slug: 'componente-telaio', name: 'Componenti Telaio Saldati', category: 'Componentistica Automotive', shortDescription: 'Travi, crociere, longheroni saldati robotizzati, certificazione IATF 16949.', features: ['IATF 16949', 'Robotizzata', 'Visione 100%', 'Tracciabilità'], images: ['/images/chassis.jpg'], isFeatured: true, isNew: true },
    ],
  },
  'meccanica-precisione': {
    name: 'Meccanica di Precisione',
    icon: '🎯',
    description: 'Fresatura/tornitura 5 assi per medicale, aerospaziale, utensili speciali. Ra < 0.2µm, certificazione materiale 3.1/3.2, utensili su disegno, servizio riaffilatura.',
    keywords: ['meccanica precisione', '5 assi medicale', 'Ra 0.2µm', 'utensili speciali', 'certificato 3.1'],
    stats: [{ value: '9+', label: 'Progetti realizzati' }, { value: '<0.2µm', label: 'Rugosità Ra' }, { value: 'Cert. 3.1/3.2', label: 'Materiale' }, { value: '5-10gg', label: 'Consegna utensili' }],
    caseStudies: [
      { title: 'Impianti ortopedici Ti6Al4V', client: 'Medical Implants', result: 'Ra 0.15µm, FDA compliant', href: '/case-study/orthopedic-implants' },
      { title: 'Utensili speciali aerospaziale', client: 'Aerospace Tooling', result: 'Vita utensile +200%, costi -35%', href: '/case-study/aerospace-tools' },
    ],
    featuredProducts: [
      { id: '15', slug: 'particolari-precisione', name: 'Particolari Meccanici Alta Precisione', category: 'Meccanica Precisione', shortDescription: 'Fresatura/tornitura 5 assi per medicale/aerospaziale, Ra < 0.2µm, certificazione 3.1.', features: ['Ra < 0.2µm', 'Cert. 3.1', '5 assi simultanei', 'Ti/Inconel/Acciaio'], images: ['/images/precision-parts.jpg'], isFeatured: true, isNew: false },
      { id: '16', slug: 'utensili-speciali', name: 'Utensili Speciali Su Disegno', category: 'Meccanica Precisione', shortDescription: 'Punte, frese, alesatori speciali su specifica, rivestimenti PVD/CVD, riaffilatura.', features: ['Su disegno', 'PVD/CVD', 'Riaffilatura', 'Consegna 5-10gg'], images: ['/images/special-tools.jpg'], isFeatured: false, isNew: true },
    ],
  },
};

const sectorIcons: Record<string, React.ReactNode> = {
  'presse-idrauliche': <Target className="w-8 h-8" />,
  'macchine-utensili': <Zap className="w-8 h-8" />,
  'stampaggio-metalli': <Globe className="w-8 h-8" />,
  'automazione-industriale': <Users className="w-8 h-8" />,
  'componentistica-automotive': <Award className="w-8 h-8" />,
  'meccanica-precisione': <TrendingUp className="w-8 h-8" />,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sector = sectors[slug as keyof typeof sectors];

  if (!sector) {
    return { title: 'Settore non trovato' };
  }

  return {
    title: `${sector.name} | ZAK Studio Web`,
    description: sector.description,
    keywords: sector.keywords,
    openGraph: {
      title: `${sector.name} - Siti Web B2B Manufacturing | ZAK Studio Web`,
      description: sector.description,
      type: 'website',
    },
  };
}

export default async function SectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = sectors[slug as keyof typeof sectors];

  if (!sector) notFound();

  return (
    <div className="min-h-screen">
      <Hero
        headline={`${sector.icon} ${sector.name}: siti web B2B specializzati`}
        subheadline={sector.description}
        ctaText="Richiedi preventivo per il tuo settore"
        ctaHref="/preventivo"
        secondaryCtaText="Vedi case study settore"
        secondaryCtaHref={`/case-study?sector=${slug}`}
        badgeText={`Specialisti ${sector.name} — ${sector.stats[0].value} progetti realizzati`}
        stats={sector.stats}
        features={[
          { icon: <CheckCircle className="w-6 h-6" />, title: 'Schema.org Product/Service', desc: 'Markup strutturato per ogni scheda tecnica e servizio offerto' },
          { icon: <BarChart3 className="w-6 h-6" />, title: 'SEO tecnico per keyword industriali', desc: 'Posizionamento per ricerche tecniche B2B ad alta intenzione' },
          { icon: <Shield className="w-6 h-6" />, title: 'Catalogo prodotti dinamico', desc: 'Gestione illimitata schede, specifiche, PDF, video, varianti' },
          { icon: <Zap className="w-6 h-6" />, title: 'RFQ intelligente per settore', desc: 'Campi specifici per il tuo comparto, CRM sync automatico' },
        ]}
      />

      <section className="section" aria-labelledby="case-studies-heading">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <h2 id="case-studies-heading" className="heading-h2 mb-2">Case study del settore</h2>
              <p className="text-body text-secondary-600 dark:text-secondary-400">
                Risultati misurabili per aziende come la tua.
              </p>
            </div>
            <Link href={`/case-study?sector=${slug}`} className="btn-outline">
              Vedi tutti <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {sector.caseStudies.map((cs, index) => (
              <Card key={index} variant="hover" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="heading-h4 mb-1">{cs.title}</h3>
                    <p className="text-sm text-secondary-500 dark:text-secondary-500 mb-2">{cs.client}</p>
                    <p className="text-body font-medium text-primary-600 dark:text-primary-400">{cs.result}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <Link href={cs.href} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1">
                    Leggi case study completo <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="products-heading">
        <div className="container-custom">
          <ProductCatalog
            products={sector.featuredProducts}
            categories={[{ slug: slug, name: sector.name, productCount: sector.featuredProducts.length }]}
            showFilters={false}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="why-us-heading">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 id="why-us-heading" className="heading-h2 mb-4">Perché le aziende {sector.name.toLowerCase()} scelgono ZAK Studio Web</h2>
            <p className="text-body-lg text-secondary-600 dark:text-secondary-400">
              Conosciamo il tuo linguaggio tecnico, i tuoi clienti, le tue normative. Il tuo sito non sarà generico.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="hover" className="p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
                {sectorIcons[slug] || <Target className="w-8 h-8" />}
              </div>
              <h3 className="heading-h4 mb-2">Keyword research settoriale</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">150+ keyword tecniche {sector.name.toLowerCase()} mappate per intent B2B</p>
            </Card>

            <Card variant="hover" className="p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="heading-h4 mb-2">Schema.org Industry Specific</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">Product, Service, HowTo, FAQ markup per {sector.name.toLowerCase()}</p>
            </Card>

            <Card variant="hover" className="p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="heading-h4 mb-2">Catalogo prodotti nativo</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">Specifiche, tolleranze, certificazioni, PDF, video, varianti configurabili</p>
            </Card>

            <Card variant="hover" className="p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="heading-h4 mb-2">RFQ con campi settoriali</h3>
              <p className="text-body text-secondary-600 dark:text-secondary-400">Quantità, tolleranze, materiali, certificazioni, tempistiche, budget</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="section bg-primary-600 dark:bg-primary-700" aria-labelledby="sector-cta-heading">
        <div className="container-custom text-center">
          <h2 id="sector-cta-heading" className="heading-h2 text-white mb-4">Vuoi vedere una demo live per {sector.name.toLowerCase()}?</h2>
          <p className="text-body-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Ti mostriamo il prototype del tuo sito con catalogo prodotti reale, form RFQ settoriale, calcolatore ROI con i tuoi numeri. Gratis, senza impegno.
          </p>
          <RFQForm
            availableProducts={sector.featuredProducts.map(p => ({ id: p.id, name: p.name }))}
            className="max-w-xl mx-auto"
          />
        </div>
      </section>
    </div>
  );
}