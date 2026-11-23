'use client';

import { ArrowRight, CheckCircle, BarChart3, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HeroProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  badgeText?: string;
  stats?: Array<{ value: string; label: string }>;
  features?: Array<{ icon: React.ReactNode; title: string; description: string }>;
  backgroundImage?: string;
  className?: string;
}

export function Hero({
  headline,
  subheadline,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  badgeText,
  stats,
  features,
  backgroundImage,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24',
        className
      )}
      aria-labelledby="hero-heading"
    >
      {backgroundImage && (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <img
            src={backgroundImage}
            alt=""
            className="w-full h-full object-cover opacity-5 dark:opacity-10"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-900/80 via-transparent to-transparent dark:from-secondary-950/90" />
        </div>
      )}

      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          {badgeText && (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" aria-hidden="true" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" aria-hidden="true" />
              </span>
              {badgeText}
            </div>
          )}

          <h1 id="hero-heading" className="heading-h1 mb-6 animate-slide-up">
            {headline.split(' ').map((word, i) =>
              <span key={i} className={cn('inline-block', i === 0 && 'gradient-text')}>{word}</span>
            ).join(' ')}
          </h1>

          <p className="text-body-lg text-secondary-600 dark:text-secondary-400 mb-8 max-w-2xl mx-auto animate-slide-up animation-delay-100">
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up animation-delay-200">
            <Button size="lg" asChild>
              <a href={ctaHref}>{ctaText} <ArrowRight className="w-4 h-4" aria-hidden="true" /></a>
            </Button>
            {secondaryCtaText && secondaryCtaHref && (
              <Button variant="outline" size="lg" asChild>
                <a href={secondaryCtaHref}>{secondaryCtaText}</a>
              </Button>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 animate-fade-in animation-delay-300" role="list" aria-label="Statistiche chiave">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" role="listitem">
                  <div className="text-display-md font-heading font-bold text-primary-600 dark:text-primary-400 mb-1">{stat.value}</div>
                  <div className="text-body text-secondary-600 dark:text-secondary-400">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {features && features.length > 0 && (
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in animation-delay-400" role="list" aria-label="Caratteristiche principali">
              {features.map((feature, index) => (
                <div key={index} className="card-hover group text-left p-6" role="listitem">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="heading-h4 mb-2">{feature.title}</h3>
                  <p className="text-body text-secondary-600 dark:text-secondary-400">{feature.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export const defaultHeroFeatures = [
  {
    icon: <BarChart3 className="w-6 h-6" aria-hidden="true" />,
    title: 'Core Web Vitals',
    description: 'LCP < 2.5s, INP < 200ms, CLS < 0.1 garantiti su mobile e desktop',
  },
  {
    icon: <Zap className="w-6 h-6" aria-hidden="true" />,
    title: 'Deploy Edge',
    description: 'Netlify/Vercel Edge Network globale con 99.99% uptime SLA',
  },
  {
    icon: <Shield className="w-6 h-6" aria-hidden="true" />,
    title: 'Sicurezza Enterprise',
    description: 'SSL, HSTS, CSP, Rate limiting, WAF, backup cifrati giornalieri',
  },
  {
    icon: <Globe className="w-6 h-6" aria-hidden="true" />,
    title: 'Multilingua Nativo',
    description: 'Next-intl per IT/EN con routing localizzato e SEO per paese',
  },
  {
    icon: <CheckCircle className="w-6 h-6" aria-hidden="true" />,
    title: 'WCAG 2.1 AA',
    description: 'Accessibilità certificata: contrasti, focus, screen reader, keyboard nav',
  },
];