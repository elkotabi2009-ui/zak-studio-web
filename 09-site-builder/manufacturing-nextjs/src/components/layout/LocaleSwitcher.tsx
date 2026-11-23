'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const locales = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
] as const;

type LocaleCode = (typeof locales)[number]['code'];

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = (pathname.split('/')[1] as LocaleCode) || 'it';
  const current = locales.find((l) => l.code === currentLocale) || locales[0];

  function switchLocale(locale: LocaleCode) {
    if (locale === currentLocale) return;

    const segments = pathname.split('/').filter(Boolean);
    segments[0] = locale;
    const newPathname = `/${segments.join('/')}`;

    router.push(newPathname);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary-200 bg-white text-sm font-medium text-secondary-700 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:bg-secondary-800 transition-colors',
          isOpen && 'ring-2 ring-primary-500'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Cambia lingua"
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="hidden sm:inline">{current.nativeName}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <ul
            className="absolute right-0 z-50 mt-2 min-w-[160px] rounded-lg border border-secondary-200 bg-white py-2 shadow-elevation-3 dark:border-secondary-700 dark:bg-secondary-900 animate-slide-down"
            role="listbox"
            aria-label="Lingue disponibili"
          >
            {locales.map((locale) => (
              <li key={locale.code}>
                <button
                  role="option"
                  aria-selected={locale.code === currentLocale}
                  onClick={() => switchLocale(locale.code)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300',
                    locale.code === currentLocale && 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  )}
                >
                  <span aria-hidden="true">{locale.flag}</span>
                  <span>{locale.nativeName}</span>
                  {locale.code === currentLocale && <Check className="ml-auto w-4 h-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}