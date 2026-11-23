'use client';

import { useEffect, useState } from 'react';
import { X, Cookie, Shield, ChartBar, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const CONSENT_KEY = 'zak-cookie-consent';
const CONSENT_VERSION = '1.0';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_CONSENT);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION && parsed.preferences) {
          setPreferences(parsed.preferences);
          loadScripts(parsed.preferences);
        } else {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
    setIsLoaded(true);
  }, []);

  const loadScripts = (prefs: ConsentPreferences) => {
    if (prefs.analytics && process.env.NEXT_PUBLIC_GA_ID) {
      loadGA(process.env.NEXT_PUBLIC_GA_ID);
    }
    if (prefs.analytics && process.env.NEXT_PUBLIC_GTM_ID) {
      loadGTM(process.env.NEXT_PUBLIC_GTM_ID);
    }
    if (prefs.marketing) {
      loadMarketingScripts();
    }
  };

  const loadGA = (gaId: string) => {
    if (document.getElementById('ga-script')) return;
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    window.gtag = function gtag(...args: unknown[]) {
      (window.gtag.q = window.gtag.q || []).push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
  };

  const loadGTM = (gtmId: string) => {
    if (document.getElementById('gtm-script')) return;
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(script);
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.prepend(noscript);
  };

  const loadMarketingScripts = () => {
    // Add marketing pixels here (LinkedIn Insight, Facebook Pixel, etc.)
  };

  const acceptAll = () => {
    const newPrefs: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(newPrefs);
    loadScripts(newPrefs);
    setShowBanner(false);
  };

  const rejectAll = () => {
    const newPrefs: ConsentPreferences = { ...DEFAULT_CONSENT };
    saveConsent(newPrefs);
    setShowBanner(false);
  };

  const savePreferences = () => {
    const newPrefs = { ...preferences, necessary: true };
    saveConsent(newPrefs);
    loadScripts(newPrefs);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: CONSENT_VERSION, preferences: prefs, timestamp: Date.now() })
    );
    setPreferences(prefs);
  };

  if (!isLoaded || !showBanner) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setShowBanner(false)} aria-hidden="true" />

      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ease-out',
          'translate-y-0 opacity-100 lg:static lg:translate-y-0 lg:opacity-100'
        )}
        role="dialog"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
      >
        <div className="container-custom">
          <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-elevation-4 dark:border-secondary-800 dark:bg-secondary-900 lg:max-w-4xl lg:mx-auto lg:rounded-xl lg:shadow-elevation-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center dark:bg-primary-900/30">
                  <Cookie className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="cookie-title" className="heading-h4 mb-2">
                    Utilizziamo i cookie
                  </h3>
                  <p id="cookie-desc" className="text-body text-secondary-600 dark:text-secondary-400 max-w-2xl">
                    Utilizziamo cookie tecnici necessari e, con il tuo consenso, cookie analitici e di marketing per migliorare la tua esperienza e analizzare il traffico.
                    <a href="/cookie" className="link ml-1">Scopri di più</a>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={acceptAll}
                  className="btn-primary w-full sm:w-auto"
                >
                  Accetta tutti
                </button>
                <button
                  onClick={rejectAll}
                  className="btn-outline w-full sm:w-auto"
                >
                  Rifiuta non essenziali
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Personalizza
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreferences && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreferences(false)}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-secondary-200 bg-white p-6 shadow-elevation-4 dark:border-secondary-800 dark:bg-secondary-900 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="prefs-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="prefs-title" className="heading-h3">Preferenze Cookie</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="p-2 rounded-lg text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                aria-label="Chiudi preferenze"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <PreferenceCategory
                title="Cookie Necessari"
                description="Essenziali per il funzionamento del sito. Non possono essere disattivati."
                icon={<Shield className="w-5 h-5 text-green-600 dark:text-green-400" />}
                enabled={true}
                disabled
              />

              <PreferenceCategory
                title="Cookie Analitici"
                description="Ci aiutano a capire come i visitatori interagiscono con il sito (Google Analytics, GTM). Dati anonimizzati."
                icon={<ChartBar className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                enabled={preferences.analytics}
                onChange={(enabled) => setPreferences((p) => ({ ...p, analytics: enabled }))}
              />

              <PreferenceCategory
                title="Cookie di Marketing"
                description="Utilizzati per mostrarti annunci pertinenti su altre piattaforme (LinkedIn, Meta, Google Ads)."
                icon={<SlidersHorizontal className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                enabled={preferences.marketing}
                onChange={(enabled) => setPreferences((p) => ({ ...p, marketing: enabled }))}
              />

              <PreferenceCategory
                title="Cookie di Preferenza"
                description="Memorizzano le tue scelte (lingua, regione, tema) per una navigazione personalizzata."
                icon={<Cookie className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                enabled={preferences.preferences}
                onChange={(enabled) => setPreferences((p) => ({ ...p, preferences: enabled }))}
              />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end border-t border-secondary-200 dark:border-secondary-800 pt-6">
              <button onClick={rejectAll} className="btn-secondary">
                Rifiuta tutti
              </button>
              <button onClick={savePreferences} className="btn-primary">
                Salva preferenze
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreferenceCategory({
  title,
  description,
  icon,
  enabled,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onChange?: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-secondary-200 bg-secondary-50/50 dark:border-secondary-800 dark:bg-secondary-900/50">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-secondary-800 flex items-center justify-center border border-secondary-200 dark:border-secondary-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-secondary-900 dark:text-secondary-100">{title}</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-disabled={disabled}
        onClick={() => !disabled && onChange?.(!enabled)}
        disabled={disabled}
        className={cn(
          'relative flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          enabled ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={enabled ? `${title} attivo` : `${title} disattivo`}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}