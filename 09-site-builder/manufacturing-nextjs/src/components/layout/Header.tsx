'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, Globe, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem } from '@/lib/types';
import { LocaleSwitcher } from './LocaleSwitcher';

const navItems: NavItem[] = [
  {
    label: 'Soluzioni',
    href: '/soluzioni',
    megaMenu: {
      columns: [
        {
          title: 'Per Settore',
          links: [
            { label: 'Presse Idrauliche', href: '/settore/presse-idrauliche' },
            { label: 'Macchine Utensili', href: '/settore/macchine-utensili' },
            { label: 'Stampaggio Metalli', href: '/settore/stampaggio-metalli' },
            { label: 'Automazione Industriale', href: '/settore/automazione-industriale' },
          ],
        },
        {
          title: 'Per Funzione',
          links: [
            { label: 'Catalogo Prodotti', href: '/catalogo', description: 'Catalogo dinamico con specifiche tecniche' },
            { label: 'Richiesta Preventivo', href: '/preventivo', description: 'Form RFQ intelligente con CRM sync' },
            { label: 'Case Study', href: '/case-study', description: 'Risultati misurabili per settore' },
          ],
        },
      ],
    },
  },
  {
    label: 'Tecnologia',
    href: '/tecnologia',
    children: [
      { label: 'Stack Tecnologico', href: '/tecnologia/stack' },
      { label: 'Performance', href: '/tecnologia/performance' },
      { label: 'SEO & Schema.org', href: '/tecnologia/seo' },
      { label: 'Accessibilità', href: '/tecnologia/accessibilita' },
      { label: 'Sicurezza', href: '/tecnologia/sicurezza' },
    ],
  },
  {
    label: 'Demo Live',
    href: '/demo',
  },
  {
    label: 'Prezzi',
    href: '/prezzi',
  },
  {
    label: 'Blog',
    href: '/blog',
  },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 dark:bg-secondary-950/95 backdrop-blur-sm shadow-elevation-1 border-b border-secondary-200 dark:border-secondary-800'
          : 'bg-transparent'
      )}
      role="banner"
    >
      <nav className="container-custom" aria-label="Navigazione principale">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-heading font-bold text-secondary-900 dark:text-secondary-50 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
              aria-label="ZAK Studio Web - Home"
            >
              <svg
                className="w-8 h-8 text-primary-600 dark:text-primary-400"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path
                  d="M8 12h16M8 16h12M8 20h8"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="hidden sm:block">ZAK Studio Web</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavItemComponent key={item.href} item={item} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LocaleSwitcher />

            <div className="hidden sm:flex items-center gap-6 text-sm text-secondary-600 dark:text-secondary-400">
              <a
                href="mailto:commercial@zakstudio.com"
                className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>commercial@zakstudio.com</span>
              </a>
              <a
                href="tel:+390212345678"
                className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span>+39 02 1234 5678</span>
              </a>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/demo"
                className="btn-secondary btn-sm"
              >
                Vedi Demo
              </Link>
              <Link
                href="/preventivo"
                className="btn-primary btn-sm"
              >
                Richiedi Preventivo
              </Link>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800 transition-colors"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
            isMobileMenuOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'
          )}
          role="navigation"
          aria-label="Menu mobile"
        >
          <div className="pt-4 space-y-1">
            {navItems.map((item) => (
              <MobileNavItem key={item.href} item={item} />
            ))}
            <div className="border-t border-secondary-200 dark:border-secondary-800 my-4 pt-4 space-y-3">
              <LocaleSwitcher />
              <div className="flex flex-col gap-2">
                <Link href="/demo" className="btn-secondary w-full justify-center">
                  Vedi Demo
                </Link>
                <Link href="/preventivo" className="btn-primary w-full justify-center">
                  Richiedi Preventivo
                </Link>
              </div>
              <div className="flex flex-col gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <a href="mailto:commercial@zakstudio.com" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  commercial@zakstudio.com
                </a>
                <a href="tel:+390212345678" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  +39 02 1234 5678
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

function NavItemComponent({
  item,
  openDropdown,
  setOpenDropdown,
}: {
  item: NavItem;
  openDropdown: string | null;
  setOpenDropdown: (value: string | null) => void;
}) {
  const isOpen = openDropdown === item.href;
  const hasChildren = item.children && item.children.length > 0;
  const hasMegaMenu = item.megaMenu;

  if (hasMegaMenu) {
    return (
      <div className="relative" onMouseEnter={() => setOpenDropdown(item.href)} onMouseLeave={() => setOpenDropdown(null)}>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors rounded-lg"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={`mega-menu-${item.href}`}
        >
          {item.label}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
        {isOpen && (
          <div
            id={`mega-menu-${item.href}`}
            className="absolute left-0 top-full z-50 mt-2 w-full max-w-5xl rounded-2xl border border-secondary-200 bg-white p-6 shadow-elevation-4 dark:border-secondary-800 dark:bg-secondary-900 animate-slide-down"
            role="menu"
          >
            <div className="grid gap-8 md:grid-cols-{item.megaMenu?.columns.length || 2}">
              {item.megaMenu?.columns.map((column, colIndex) => (
                <div key={colIndex}>
                  <h4 className="mb-3 text-sm font-semibold text-secondary-900 dark:text-secondary-100">{column.title}</h4>
                  <ul className="space-y-2" role="list">
                    {column.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          href={link.href}
                          className="flex items-start gap-2 text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                          role="menuitem"
                        >
                          <span aria-hidden="true">→</span>
                          <div>
                            <span className="font-medium">{link.label}</span>
                            {link.description && (
                              <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-0.5">{link.description}</p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div className="relative" onMouseEnter={() => setOpenDropdown(item.href)} onMouseLeave={() => setOpenDropdown(null)}>
        <button
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors rounded-lg"
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={`dropdown-${item.href}`}
        >
          {item.label}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
        {isOpen && (
          <ul
            id={`dropdown-${item.href}`}
            className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-secondary-200 bg-white py-2 shadow-elevation-3 dark:border-secondary-800 dark:bg-secondary-900 animate-slide-down"
            role="menu"
          >
            {item.children?.map((child, index) => (
              <li key={index}>
                <Link
                  href={child.href}
                  className="block px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-primary-600 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-primary-400 transition-colors"
                  role="menuitem"
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="px-3 py-2 text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors rounded-lg"
    >
      {item.label}
    </Link>
  );
}

function MobileNavItem({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const hasMegaMenu = item.megaMenu;

  if (hasMegaMenu) {
    return (
      <div className="border-b border-secondary-200 dark:border-secondary-800 last:border-0">
        <button
          className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-secondary-600 dark:text-secondary-400"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {item.label}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
        {isOpen && (
          <div className="pl-4 pb-4 space-y-3">
            {item.megaMenu?.columns.map((column, colIndex) => (
              <div key={colIndex}>
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-500 dark:text-secondary-500">{column.title}</h5>
                <ul className="space-y-1" role="list">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="block text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div className="border-b border-secondary-200 dark:border-secondary-800 last:border-0">
        <button
          className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-secondary-600 dark:text-secondary-400"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {item.label}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
        {isOpen && (
          <ul className="pl-4 pb-3 space-y-1" role="list">
            {item.children?.map((child, index) => (
              <li key={index}>
                <Link
                  href={child.href}
                  className="block px-3 py-2 text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors rounded-lg"
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="block px-3 py-3 text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
      onClick={() => setIsOpen(false)}
    >
      {item.label}
    </Link>
  );
}