import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Twitter, Youtube, Github, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const footerSections = [
  {
    title: 'Soluzioni',
    links: [
      { label: 'Presse Idrauliche', href: '/settore/presse-idrauliche' },
      { label: 'Macchine Utensili', href: '/settore/macchine-utensili' },
      { label: 'Stampaggio Metalli', href: '/settore/stampaggio-metalli' },
      { label: 'Automazione Industriale', href: '/settore/automazione-industriale' },
      { label: 'Componentistica Automotive', href: '/settore/componentistica-automotive' },
    ],
  },
  {
    title: 'Tecnologia',
    links: [
      { label: 'Stack Next.js 14', href: '/tecnologia/stack' },
      { label: 'Ghost CMS Headless', href: '/tecnologia/cms' },
      { label: 'Core Web Vitals', href: '/tecnologia/performance' },
      { label: 'Schema.org Completo', href: '/tecnologia/seo' },
      { label: 'WCAG 2.1 AA', href: '/tecnologia/accessibilita' },
    ],
  },
  {
    title: 'Risorse',
    links: [
      { label: 'Demo Live', href: '/demo' },
      { label: 'Case Study', href: '/case-study' },
      { label: 'Blog Tecnico', href: '/blog' },
      { label: 'Prezzi', href: '/prezzi' },
      { label: 'Documentazione', href: '/docs' },
    ],
  },
  {
    title: 'Azienda',
    links: [
      { label: 'Chi Siamo', href: '/chi-siamo' },
      { label: 'Metodo ZAK', href: '/metodo' },
      { label: 'Lavora con noi', href: '/lavora-con-noi' },
      { label: 'Partner', href: '/partner' },
      { label: 'Contatti', href: '/contatti' },
    ],
  },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookie' },
  { label: 'Termini di Servizio', href: '/termini' },
  { label: 'DPA (GDPR Art. 28)', href: '/dpa' },
];

const socialLinks = [
  { icon: Linkedin, href: 'https://linkedin.com/company/zakstudio', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com/zakstudioweb', label: 'Twitter' },
  { icon: Youtube, href: 'https://youtube.com/@zakstudioweb', label: 'YouTube' },
  { icon: Github, href: 'https://github.com/zakstudio', label: 'GitHub' },
];

const certifications = [
  'ISO 9001:2015',
  'ISO 27001:2022',
  'GDPR Compliant',
  'WCAG 2.1 AA',
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-50 dark:bg-secondary-950 border-t border-secondary-200 dark:border-secondary-800" role="contentinfo">
      <div className="container-custom py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="lg:col-span-1 max-w-xs">
            <Link href="/" className="flex items-center gap-2 text-xl font-heading font-bold text-secondary-900 dark:text-secondary-50 mb-6" aria-label="ZAK Studio Web - Home">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span>ZAK Studio Web</span>
            </Link>
            <p className="text-body text-secondary-600 dark:text-secondary-400 mb-6">
              Realizziamo siti web B2B conversion-focused per aziende manifatturiere italiane.
              Next.js 14 + Ghost CMS + Schema.org. Trasformiamo traffico in RFQ qualificate.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {certifications.map((cert) => (
                <span key={cert} className="badge-primary text-xs">{cert}</span>
              ))}
            </div>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="font-heading font-semibold text-secondary-900 dark:text-secondary-100 mb-4">{section.title}</h3>
              <ul className="space-y-3" role="list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                    >
                      <span aria-hidden="true">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-secondary-200 dark:border-secondary-800">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <h4 className="font-heading font-semibold text-secondary-900 dark:text-secondary-100">Contatti</h4>
              <address className="not-italic space-y-3 text-body text-secondary-600 dark:text-secondary-400">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <div>
                    <p>ZAK Studio Web S.r.l.</p>
                    <p>Via delle Industrie 15</p>
                    <p>20100 Milano (MI), Italia</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <a href="tel:+390212345678" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">+39 02 1234 5678</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <a href="mailto:commercial@zakstudio.com" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">commercial@zakstudio.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <a href="mailto:zakstudio@pec.it" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">zakstudio@pec.it (PEC)</a>
                </div>
              </address>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-heading font-semibold text-secondary-900 dark:text-secondary-100">Dati Societari</h4>
              <dl className="space-y-2 text-body text-secondary-600 dark:text-secondary-400">
                <div className="flex gap-4">
                  <dt className="font-medium min-w-[120px]">P.IVA / CF:</dt>
                  <dd>IT01234567890</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="font-medium min-w-[120px]">REA:</dt>
                  <dd>MI-1234567</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="font-medium min-w-[120px]">Cap. Sociale:</dt>
                  <dd>€ 10.000 i.v.</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="font-medium min-w-[120px]">Foro:</dt>
                  <dd>Tribunale di Milano</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-heading font-semibold text-secondary-900 dark:text-secondary-100">Note Legali</h4>
              <nav aria-label="Link legali">
                <ul className="flex flex-wrap gap-4 md:gap-6" role="list">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-secondary-500 hover:text-primary-600 dark:text-secondary-500 dark:hover:text-primary-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <p className="text-sm text-secondary-500 dark:text-secondary-500">
                © {currentYear} ZAK Studio Web S.r.l. Tutti i diritti riservati.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}