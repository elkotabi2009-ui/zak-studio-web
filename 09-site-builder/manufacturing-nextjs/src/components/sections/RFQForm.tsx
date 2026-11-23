'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, AlertCircle, Mail, Send, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const RFQSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Inserisci un\'email valida'),
  phone: z.string().optional(),
  company: z.string().min(1, 'Nome azienda richiesto'),
  role: z.string().optional(),
  country: z.string().default('IT'),
  productIds: z.array(z.string()).optional(),
  message: z.string().min(20, 'Il messaggio deve contenere almeno 20 caratteri').max(5000),
  budget: z.enum(['under-10k', '10k-50k', '50k-100k', '100k-250k', '250k-500k', '500k+', 'not-specified']).optional(),
  timeline: z.enum(['asap', '1-month', '3-months', '6-months', '12-months', 'planning']).optional(),
  privacy: z.literal(true, { errorMap: () => ({ message: 'Devi accettare la privacy policy' }) }),
  marketing: z.boolean().optional(),
  recaptchaToken: z.string().optional(),
});

type RFQFormData = z.infer<typeof RFQSchema>;

const BUDGET_OPTIONS = [
  { value: 'under-10k', label: 'Sotto €10.000' },
  { value: '10k-50k', label: '€10.000 - €50.000' },
  { value: '50k-100k', label: '€50.000 - €100.000' },
  { value: '100k-250k', label: '€100.000 - €250.000' },
  { value: '250k-500k', label: '€250.000 - €500.000' },
  { value: '500k+', label: 'Oltre €500.000' },
  { value: 'not-specified', label: 'Preferisco non specificare' },
];

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'Il prima possibile' },
  { value: '1-month', label: 'Entro 1 mese' },
  { value: '3-months', label: 'Entro 3 mesi' },
  { value: '6-months', label: 'Entro 6 mesi' },
  { value: '12-months', label: 'Entro 12 mesi' },
  { value: 'planning', label: 'Solo pianificazione' },
];

const COUNTRY_OPTIONS = [
  { value: 'IT', label: 'Italia' },
  { value: 'DE', label: 'Germania' },
  { value: 'FR', label: 'Francia' },
  { value: 'ES', label: 'Spagna' },
  { value: 'CH', label: 'Svizzera' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgio' },
  { value: 'NL', label: 'Paesi Bassi' },
  { value: 'PL', label: 'Polonia' },
  { value: 'CZ', label: 'Repubblica Ceca' },
  { value: 'other', label: 'Altro' },
];

interface RFQFormProps {
  preselectedProducts?: string[];
  utmParams?: Record<string, string>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  showProductSelector?: boolean;
  availableProducts?: Array<{ id: string; name: string }>;
}

export function RFQForm({
  preselectedProducts = [],
  utmParams = {},
  onSuccess,
  onError,
  className,
  showProductSelector = true,
  availableProducts = [],
}: RFQFormProps) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RFQFormData>({
    resolver: zodResolver(RFQSchema),
    defaultValues: {
      country: 'IT',
      productIds: preselectedProducts,
      privacy: false,
      marketing: false,
      ...utmParams,
    },
  });

  const selectedProducts = watch('productIds');

  const onSubmit = async (data: RFQFormData) => {
    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      const response = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Errore durante l\'invio. Riprova più tardi.');
      }

      setSubmitStatus('success');
      onSuccess?.();

      setTimeout(() => {
        setSubmitStatus('idle');
        Object.keys(data).forEach((key) => {
          if (key !== 'privacy' && key !== 'marketing' && key !== 'country') {
            setValue(key as keyof RFQFormData, '' as any);
          }
        });
        setValue('privacy', false);
        setValue('marketing', false);
      }, 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      setSubmitStatus('error');
      setSubmitError(message);
      onError?.(message);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className={cn('text-center py-12', className)} role="alert">
        <div className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h3 className="heading-h3 mb-3">Richiesta inviata con successo!</h3>
        <p className="text-body text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">
          Grazie per averci contattato. Il nostro team commerciale analizzerà la tua richiesta e ti risponderà entro 24 ore lavorative.
        </p>
        <p className="text-sm text-secondary-500 dark:text-secondary-500">
          Hai ricevuto una email di conferma all'indirizzo <strong>{watch('email')}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)} noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Nome *"
          placeholder="Mario"
          {...register('firstName')}
          error={errors.firstName?.message}
          autoComplete="given-name"
        />
        <Input
          label="Cognome *"
          placeholder="Rossi"
          {...register('lastName')}
          error={errors.lastName?.message}
          autoComplete="family-name"
        />
        <Input
          label="Email aziendale *"
          type="email"
          placeholder="mario.rossi@azienda.it"
          {...register('email')}
          error={errors.email?.message}
          autoComplete="email"
          leftIcon={<Mail className="w-5 h-5" aria-hidden="true" />}
        />
        <Input
          label="Telefono"
          type="tel"
          placeholder="+39 02 1234 5678"
          {...register('phone')}
          autoComplete="tel"
        />
        <Input
          label="Azienda *"
          placeholder="Rossi Manufacturing S.r.l."
          {...register('company')}
          error={errors.company?.message}
          autoComplete="organization"
        />
        <Input
          label="Ruolo"
          placeholder="Plant Manager / CEO / Procurement"
          {...register('role')}
          autoComplete="job-title"
        />
        <Select
          label="Paese *"
          options={COUNTRY_OPTIONS}
          placeholder="Seleziona paese"
          {...register('country')}
          error={errors.country?.message}
        />
      </div>

      {showProductSelector && availableProducts.length > 0 && (
        <div>
          <label className="label">Prodotti/Servizi di interesse</label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Selezione prodotti">
            {availableProducts.map((product) => (
              <label
                key={product.id}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border-2 transition-colors cursor-pointer',
                  selectedProducts.includes(product.id)
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-secondary-200 text-secondary-700 hover:border-secondary-300 dark:border-secondary-700 dark:text-secondary-300'
                )}
              >
                <input
                  type="checkbox"
                  value={product.id}
                  checked={selectedProducts.includes(product.id)}
                  onChange={(e) => {
                    const current = watch('productIds') || [];
                    if (e.target.checked) {
                      setValue('productIds', [...current, product.id], { shouldValidate: true });
                    } else {
                      setValue('productIds', current.filter((id) => id !== product.id), { shouldValidate: true });
                    }
                  }}
                  className="sr-only"
                  aria-label={product.name}
                />
                {product.name}
              </label>
            ))}
          </div>
          {errors.productIds && (
            <p className="mt-1.5 text-sm text-accent-600 dark:text-accent-400" role="alert">
              {errors.productIds.message}
            </p>
          )}
        </div>
      )}

      <Textarea
        label="Descrivi la tua richiesta *"
        placeholder="Descrivi il tuo progetto, le specifiche tecniche, le quantità previste, le tempistiche e qualsiasi altro dettaglio utile per preparare un preventivo accurato..."
        rows={6}
        {...register('message')}
        error={errors.message?.message}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Select
          label="Budget indicativo"
          options={BUDGET_OPTIONS}
          placeholder="Seleziona fascia di budget"
          {...register('budget')}
        />
        <Select
          label="Tempistiche previste"
          options={TIMELINE_OPTIONS}
          placeholder="Seleziona tempistica"
          {...register('timeline')}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-secondary-200 dark:border-secondary-800">
        <Checkbox
          label="Accetto l'informativa privacy *"
          description="Dichiaro di aver letto e accettato la <a href='/privacy' className='link'>Privacy Policy</a> e acconsento al trattamento dei dati per la gestione della richiesta."
          {...register('privacy')}
          error={errors.privacy?.message}
        />

        <Checkbox
          label="Vuoi ricevere aggiornamenti tecnici e commerciali?"
          description="Newsletter mensile con case study, novità tecnologiche e offerte esclusive. Puoi disiscriverti in qualsiasi momento."
          {...register('marketing')}
        />
      </div>

      {submitError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-accent-50 border border-accent-200 dark:bg-accent-900/20 dark:border-accent-800" role="alert">
          <AlertCircle className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0" aria-hidden="true" />
          <p className="text-accent-700 dark:text-accent-300">{submitError}</p>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-800">
        <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          <p className="font-medium mb-1">I tuoi dati sono al sicuro</p>
          <p>Non condividiamo i tuoi dati con terze parti. Crittografia TLS 1.3, server in UE, GDPR compliant. <a href="/privacy" className="link">Leggi di più</a></p>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full lg:w-auto"
        size="lg"
        loading={isSubmitting || submitStatus === 'submitting'}
        leftIcon={<Send className="w-5 h-5" aria-hidden="true" />}
      >
        {submitStatus === 'submitting' ? 'Invio in corso...' : 'Invia richiesta preventivo'}
      </Button>

      <p className="text-center text-xs text-secondary-500 dark:text-secondary-500">
        <Lock className="w-3 h-3 inline align-middle mr-1" aria-hidden="true" />
        Connessione sicura TLS 1.3 — Dati inviati tramite API protetta — Nessuno spam, mai
      </p>
    </form>
  );
}

export function QuickRFQForm({ productId, productName }: { productId: string; productName: string }) {
  return (
    <RFQForm
      preselectedProducts={[productId]}
      showProductSelector={false}
      className="max-w-xl mx-auto"
    />
  );
}