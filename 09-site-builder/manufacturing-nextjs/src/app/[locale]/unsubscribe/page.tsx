'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Mail, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === '1') {
      setStatus('success');
      setMessage('Ti sei disiscritto con successo. Non riceverai più email da ZAK Studio Web.');
    } else if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(error));
    } else {
      setStatus('idle');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-950/50 px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-body text-secondary-600 dark:text-secondary-400">Verifica in corso...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-950/50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-heading font-bold text-secondary-900 dark:text-secondary-50 mb-8">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span>ZAK Studio Web</span>
          </Link>
          <h1 className="heading-h2 mb-2">Gestisci iscrizione</h1>
        </div>

        <Card variant="elevated" className="p-8">
          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="heading-h3 mb-3">Disiscrizione completata</h2>
              <p className="text-body text-secondary-600 dark:text-secondary-400 mb-6">{message}</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-500 mb-6">
                Il tuo indirizzo è stato aggiunto alla lista di soppressione. Non riceverai più email commerciali da parte nostra.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/" className="btn-primary">
                  Torna alla Home
                </Link>
                <Link href="/contatti" className="btn-outline">
                  Contatta il supporto
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30 mb-6 mx-auto">
                <XCircle className="w-8 h-8 text-accent-600 dark:text-accent-400" />
              </div>
              <h2 className="heading-h3 mb-3">Errore durante la disiscrizione</h2>
              <p className="text-body text-secondary-600 dark:text-secondary-400 mb-6">{message || 'Link non valido o scaduto. Riprova con il link originale ricevuto via email.'}</p>
              <div className="flex flex-col gap-3">
                <Link href="/" className="btn-primary">
                  Torna alla Home
                </Link>
                <Link href="/contatti" className="btn-outline">
                  Contatta il supporto
                </Link>
              </div>
            </div>
          )}

          {status === 'idle' && (
            <div className="text-center">
              <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 mb-6 mx-auto">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="heading-h3 mb-3">Conferma disiscrizione</h2>
              <p className="text-body text-secondary-600 dark:text-secondary-400 mb-6">
                Sei sicuro di voler cancellare la tua iscrizione alle email di ZAK Studio Web?
                Non riceverai più aggiornamenti tecnici, case study, offerte o comunicazioni commerciali.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="border-accent-500 text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/30"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const email = params.get('email');
                    const trackingId = params.get('trackingId');
                    const timestamp = params.get('timestamp');
                    const sig = params.get('sig');
                    if (email && trackingId && timestamp && sig) {
                      window.location.href = `/unsubscribe?email=${email}&trackingId=${trackingId}&timestamp=${timestamp}&sig=${sig}`;
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Sì, disiscrivimi
                </Button>
                <Link href="/" className="btn-primary">
                  No, torna alla Home
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-800">
            <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              I tuoi diritti GDPR
            </h3>
            <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400 text-left">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> Diritto di accesso ai tuoi dati</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> Diritto di rettifica</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> Diritto alla cancellazione (diritto all'oblio)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> Diritto di limitazione del trattamento</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> Diritto alla portabilità dei dati</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" /> Diritto di opposizione</li>
            </ul>
            <p className="mt-4 text-sm text-secondary-500 dark:text-secondary-500">
              Per esercitare i tuoi diritti: <a href="mailto:privacy@zakstudio.com" className="link">privacy@zakstudio.com</a>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}