import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { SchemaOrg } from '@/components/seo/SchemaOrg';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: '%s | Sito Web B2B per Produzione Industriale',
    template: '%s | %s',
  },
  description: 'Siti web conversion-focused per aziende manifatturiere. Next.js 14 + Ghost CMS + Schema.org. RFQ, catalogo prodotti, Core Web Vitals ottimizzati.',
  keywords: ['sito web B2B', 'manifatturiero', 'Next.js', 'Ghost CMS', 'RFQ', 'lead generation', 'industria 4.0'],
  authors: [{ name: 'ZAK Studio Web' }],
  creator: 'ZAK Studio Web',
  publisher: 'ZAK Studio Web',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: '/',
    siteName: 'ZAK Studio Web',
    title: 'Siti Web B2B per Produzione Industriale | ZAK Studio Web',
    description: 'Realizziamo siti web conversion-focused per aziende manifatturiere. Next.js 14 + Ghost CMS + Schema.org completo.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'ZAK Studio Web - Siti B2B Manufacturing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Siti Web B2B per Produzione Industriale',
    description: 'Next.js 14 + Ghost CMS + Schema.org. RFQ, catalogo prodotti, Core Web Vitals ottimizzati.',
    images: ['/og-default.png'],
    creator: '@zakstudioweb',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const htmlLang = 'it';

  return (
    <html lang={htmlLang} class={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: process.env.NEXT_PUBLIC_SITE_NAME || 'ZAK Studio Web',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://zakstudio.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zakstudio.com'}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased bg-white text-secondary-900 dark:bg-secondary-950 dark:text-secondary-50">
        <SchemaOrg />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary-600"
        >
          Vai al contenuto principale
        </a>
        <Header />
        <main id="main-content" className="min-h-[calc(100vh-200px)]">
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}