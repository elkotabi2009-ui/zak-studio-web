import { Metadata } from 'next';
import { ProductCatalog } from '@/components/sections/ProductCatalog';
import { Hero } from '@/components/sections/Hero';
import { ArrowRight, Filter, Search, Tag, Box } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Catalogo Prodotti e Servizi | ZAK Studio Web',
  description: 'Esplora il catalogo completo di soluzioni per l\'industria manifatturiera: presse idrauliche, macchine utensili, stampaggio metalli, automazione industriale. Schede tecniche complete, Schema.org Product.',
  openGraph: {
    title: 'Catalogo Prodotti e Servizi | ZAK Studio Web',
    description: 'Catalogo dinamico con specifiche tecniche, immagini HD, brochure PDF, Schema.org Product markup.',
    type: 'website',
  },
};

const allProducts = [
  // Presse Idrauliche
  { id: '1', slug: 'pressa-idraulica-500t', name: 'Pressa Idraulica 500T', category: 'Presse Idrauliche', shortDescription: 'Pressa a 4 colonne per stampaggio lamiere spesse, controllo CNC, cambio stampo rapido.', features: ['Forza 5000 kN', 'Corsa 800 mm', 'Velocità 150 mm/s', 'CNC Siemens 840D'], images: ['/images/press-500t.jpg'], isFeatured: true, isNew: false },
  { id: '2', slug: 'pressa-idraulica-1000t', name: 'Pressa Idraulica 1000T', category: 'Presse Idrauliche', shortDescription: 'Pressa a montanti per forgiatura a caldo, forze fino a 10.000 kN, automazione completa.', features: ['Forza 10.000 kN', 'Corsa 1200 mm', 'Automazione robotizzata', 'Controllo termico'], images: ['/images/press-1000t.jpg'], isFeatured: false, isNew: true },
  { id: '3', slug: 'pressa-servoidraulica', name: 'Pressa Servoidraulica 200T', category: 'Presse Idrauliche', shortDescription: 'Pressa servoidraulica ad alta precisione per stampaggio precisione, curva forza-tempo programmabile.', features: ['Forza 2000 kN', 'Precisione ±0.01mm', 'Curva programmabile', 'Efficienza energetica +40%'], images: ['/images/servo-press.jpg'], isFeatured: true, isNew: false },

  // Macchine Utensili
  { id: '4', slug: 'centro-lavoro-5assi', name: 'Centro Lavoro 5 Assi', category: 'Macchine Utensili', shortDescription: 'Lavorazione simultanea 5 assi, cambio utensile 60 posizioni, precisione ±0.003mm.', features: ['Corsa X/Y/Z 800/600/550', 'Mandrino 18.000 rpm', 'Cambio utensile 2.5s', 'Heidenhain TNC640'], images: ['/images/5axis.jpg'], isFeatured: true, isNew: true },
  { id: '5', slug: 'tornio-cnc-multitasking', name: 'Torno CNC Multitasking', category: 'Macchine Utensili', shortDescription: 'Torno fresatrice Y/B axis, 2 torrette, 2 mandrini, lavorazione completa in un setup.', features: ['Diametro max 320mm', 'Lunghezza tornitura 1000mm', 'Mandrino 6000/12000 rpm', 'Fanuc 31i-B'], images: ['/images/multitasking.jpg'], isFeatured: false, isNew: false },
  { id: '6', slug: 'rettificatrice-cnc', name: 'Rettificatrice CNC Alta Precisione', category: 'Macchine Utensili', shortDescription: 'Rettificatrice tangenziale per particolari precisione, risoluzione 0.1µm, compensazione termica.', features: ['Tavola 600x300mm', 'Risoluzione 0.1µm', 'Compensazione termica', 'Misurazione in-process'], images: ['/images/grinder.jpg'], isFeatured: true, isNew: false },

  // Stampaggio Metalli
  { id: '7', slug: 'stampo-progressivo', name: 'Stampo Progressivo Auto', category: 'Stampaggio Metalli', shortDescription: 'Stampo progressivo per componenti automotive, 24 stazioni, acciaio HSLA.', features: ['24 stazioni', 'Materiale HSLA 420MPa', 'Ciclo 15 colpi/min', 'Durata 500k pezzi'], images: ['/images/progressive-die.jpg'], isFeatured: false, isNew: false },
  { id: '8', slug: 'stampo-trasferimento', name: 'Stampo Trasferimento Grossi Spessori', category: 'Stampaggio Metalli', shortDescription: 'Stampo transfer per particolari spessore 3-8mm, 6 stazioni, cambio rapido.', features: ['Spessore 3-8mm', '6 stazioni', 'Cambio stampo <15min', 'Controllo qualità integrato'], images: ['/images/transfer-die.jpg'], isFeatured: true, isNew: true },
  { id: '9', slug: 'stampo-tranciatura-fine', name: 'Stampo Tranciatura Fine', category: 'Stampaggio Metalli', shortDescription: 'Stampo tranciatura fine per componenti elettronici, tolleranze ±0.02mm, zero bave.', features: ['Tolleranza ±0.02mm', 'Zero bave', 'Alta velocità 300 colpi/min', 'Materiale 0.1-1.5mm'], images: ['/images/fine-blanking.jpg'], isFeatured: false, isNew: false },

  // Automazione Industriale
  { id: '10', slug: 'robot-collaborativo', name: 'Robot Collaborativo UR10e', category: 'Automazione Industriale', shortDescription: 'Cobot payload 10kg, reach 1300mm, force sensing, programmazione intuitiva.', features: ['Payload 10 kg', 'Reach 1300 mm', 'Force/torque sensor', 'Polyscope UI'], images: ['/images/cobot.jpg'], isFeatured: true, isNew: false },
  { id: '11', slug: 'cellula-robotizzata-saldatura', name: 'Cellula Robotizzata Saldatura', category: 'Automazione Industriale', shortDescription: 'Cella saldatura MIG/TIG con robot 6 assi, posizione rotante, visione 3D.', features: ['Robot 6 assi 20kg', 'Posizionatore rotante', 'Visione 3D', 'Offline programming'], images: ['/images/welding-cell.jpg'], isFeatured: false, isNew: true },
  { id: '12', slug: 'agv-logistica', name: 'AGV Navigazione Naturale', category: 'Automazione Industriale', shortDescription: 'Veicoli a guida autonoma navigazione SLAM, payload 1500kg, ricarica opportunistica.', features: ['Navigazione SLAM', 'Payload 1500 kg', 'Ricarica opportunistica', 'Flotta gestita centralmente'], images: ['/images/agv.jpg'], isFeatured: true, isNew: false },

  // Componentistica Automotive
  { id: '13', slug: 'componente-powertrain', name: 'Componenti Powertrain Precisione', category: 'Componentistica Automotive', shortDescription: 'Alberi, ingranaggi, flange per trasmissioni, tolleranze IT5-IT6, Cpk > 1.67.', features: ['Tolleranza IT5-IT6', 'Cpk > 1.67', 'Materiale 16MnCr5/20MnCr5', 'Trattamento termico'], images: ['/images/powertrain.jpg'], isFeatured: false, isNew: false },
  { id: '14', slug: 'componente-telaio', name: 'Componenti Telaio Saldati', category: 'Componentistica Automotive', shortDescription: 'Travi, crociere, longheroni saldati robotizzati, certificazione IATF 16949.', features: ['IATF 16949', 'Saldatura robotizzata', 'Controllo 100% visione', 'Tracciabilità completa'], images: ['/images/chassis.jpg'], isFeatured: true, isNew: true },

  // Meccanica Precisione
  { id: '15', slug: 'particolari-precisione', name: 'Particolari Meccanici Alta Precisione', category: 'Meccanica Precisione', shortDescription: 'Fresatura/tornitura 5 assi per medicale/aerospaziale, Ra < 0.2µm, certificazione materiale 3.1.', features: ['Ra < 0.2µm', 'Certificato 3.1', '5 assi simultanei', 'Materiale Ti/Inconel/Acciaio'], images: ['/images/precision-parts.jpg'], isFeatured: true, isNew: false },
  { id: '16', slug: 'utensili-speciali', name: 'Utensili Speciali Su Disegno', category: 'Meccanica Precisione', shortDescription: 'Punte, frese, alesatori speciali su specifica cliente, rivestimenti PVD/CVD, riaffilatura.', features: ['Su disegno cliente', 'Rivestimenti PVD/CVD', 'Servizio riaffilatura', 'Consegna 5-10gg'], images: ['/images/special-tools.jpg'], isFeatured: false, isNew: true },
];

const categories = [
  { id: 'presse-idrauliche', slug: 'presse-idrauliche', name: 'Presse Idrauliche', productCount: 3 },
  { id: 'macchine-utensili', slug: 'macchine-utensili', name: 'Macchine Utensili', productCount: 3 },
  { id: 'stampaggio-metalli', slug: 'stampaggio-metalli', name: 'Stampaggio Metalli', productCount: 3 },
  { id: 'automazione-industriale', slug: 'automazione-industriale', name: 'Automazione Industriale', productCount: 3 },
  { id: 'componentistica-automotive', slug: 'componentistica-automotive', name: 'Componentistica Automotive', productCount: 2 },
  { id: 'meccanica-precisione', slug: 'meccanica-precisione', name: 'Meccanica Precisione', productCount: 2 },
];

export default function CatalogoPage() {
  return (
    <div className="min-h-screen">
      <Hero
        headline="Catalogo completo prodotti e servizi manifatturieri"
        subheadline="16+ schede prodotto con specifiche tecniche complete, immagini HD, brochure PDF scaricabili, video demo, Schema.org Product markup. Filtra per categoria, cerca per specifiche, confronta modelli."
        ctaText="Richiedi preventivo per un prodotto"
        ctaHref="/preventivo"
        badgeText="Nuovo: Confronto side-by-side modelli simili"
        stats={[
          { value: '16+', label: 'Schede prodotto' },
          { value: '6', label: 'Categorie' },
          { value: 'Schema.org', label: 'Product markup' },
          { value: 'PDF/Video', label: 'Allegati tecnici' },
        ]}
        features={[]}
      />

      <section className="section" aria-labelledby="catalog-heading">
        <div className="container-custom">
          <ProductCatalog
            products={allProducts}
            categories={categories}
            showFilters={true}
            maxProducts={undefined}
          />
        </div>
      </section>

      <section className="section bg-secondary-50 dark:bg-secondary-900/50" aria-labelledby="cta-heading">
        <div className="container-custom text-center">
          <h2 id="cta-heading" className="heading-h2 mb-4">Non trovi ciò che cerchi?</h2>
          <p className="text-body-lg text-secondary-600 dark:text-secondary-400 mb-8 max-w-2xl mx-auto">
            Il nostro catalogo è in continuo aggiornamento. Contattaci per richiedere schede tecniche di prodotti non ancora pubblicati o per soluzioni custom.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/preventivo" className="btn-primary btn-lg">
              Richiedi scheda tecnica custom <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contatti" className="btn-outline btn-lg bg-transparent border-white text-white hover:bg-primary-500">
              Contatta il team tecnico
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}