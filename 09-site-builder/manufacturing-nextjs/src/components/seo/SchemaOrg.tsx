'use client';

import { useEffect } from 'react';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ZAK Studio Web S.r.l.',
  url: 'https://zakstudio.com',
  logo: 'https://zakstudio.com/logo.png',
  sameAs: [
    'https://linkedin.com/company/zakstudio',
    'https://twitter.com/zakstudioweb',
    'https://youtube.com/@zakstudioweb',
    'https://github.com/zakstudio',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+39-02-1234-5678',
    contactType: 'customer service',
    availableLanguage: ['Italian', 'English'],
    areaServed: 'IT',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Via delle Industrie 15',
    addressLocality: 'Milano',
    addressRegion: 'MI',
    postalCode: '20100',
    addressCountry: 'IT',
  },
  vatID: 'IT01234567890',
  taxID: 'IT01234567890',
  legalName: 'ZAK Studio Web S.r.l.',
  foundingDate: '2020-01-15',
  numberOfEmployees: '10-50',
  knowsAbout: [
    'Next.js',
    'React',
    'TypeScript',
    'Ghost CMS',
    'Headless CMS',
    'B2B Web Development',
    'Manufacturing Industry',
    'Technical SEO',
    'Schema.org',
    'Core Web Vitals',
    'WCAG 2.1',
    'Conversion Rate Optimization',
  ],
  makesOffer: {
    '@type': 'Offer',
    name: 'Sito Web B2B Manufacturing',
    description: 'Siti web conversion-focused per aziende manifatturiere con Next.js 14, Ghost CMS headless, Schema.org completo, catalogo prodotti dinamico, form RFQ intelligente.',
    category: 'Web Development',
    price: '3500',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'ZAK Studio Web S.r.l.',
    },
  },
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ZAK Studio Web',
  url: 'https://zakstudio.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://zakstudio.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: ['it', 'en'],
};

const breadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export function SchemaOrg() {
  useEffect(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"][data-zak-schema]');
    scripts.forEach((script) => script.remove());

    const schemas = [organizationSchema, webSiteSchema];

    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-zak-schema', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, []);

  return null;
}

export function ProductSchema({ product }: { product: {
  name: string;
  description: string;
  image?: string;
  brand?: string;
  sku?: string;
  category?: string;
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  offers?: {
    price: number;
    currency: string;
    availability: string;
    seller?: { name: string; url: string };
  }[];
} }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image ? [product.image] : undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    sku: product.sku,
    category: product.category,
    aggregateRating: product.aggregateRating ? {
      '@type': 'AggregateRating',
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    offers: product.offers?.map((offer) => ({
      '@type': 'Offer',
      price: offer.price,
      priceCurrency: offer.currency,
      availability: `https://schema.org/${offer.availability}`,
      seller: offer.seller ? {
        '@type': 'Organization',
        name: offer.seller.name,
        url: offer.seller.url,
      } : {
        '@type': 'Organization',
        name: 'ZAK Studio Web S.r.l.',
        url: 'https://zakstudio.com',
      },
    }),

  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-zak-schema', 'product');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => script.remove();
  }, [product.name]);

  return null;
}

export function ServiceSchema({ service }: { service: {
  name: string;
  description: string;
  provider: { name: string; url: string };
  areaServed?: string[];
  category?: string;
  offers?: { price: number; currency: string; description: string }[];
} }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: service.provider.name,
      url: service.provider.url,
    },
    areaServed: service.areaServed?.map((area) => ({
      '@type': 'AdministrativeArea',
      name: area,
    })) || [{ '@type': 'Country', name: 'Italia' }],
    category: service.category || 'B2B Web Development',
    offers: service.offers?.map((offer) => ({
      '@type': 'Offer',
      name: service.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: offer.currency,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: service.provider.name,
        url: service.provider.url,
      },
    })),
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-zak-schema', 'service');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => script.remove();
  }, [service.name]);

  return null;
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-zak-schema', 'faq');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => script.remove();
  }, [faqs.length]);

  return null;
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = breadcrumbSchema(items);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-zak-schema', 'breadcrumb');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => script.remove();
  }, [items.length]);

  return null;
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://zakstudio.com/#organization',
    name: 'ZAK Studio Web S.r.l.',
    description: 'Realizziamo siti web B2B conversion-focused per aziende manifatturiere italiane. Next.js 14 + Ghost CMS + Schema.org completo.',
    url: 'https://zakstudio.com',
    telephone: '+39-02-1234-5678',
    email: 'commercial@zakstudio.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Via delle Industrie 15',
      addressLocality: 'Milano',
      addressRegion: 'MI',
      postalCode: '20100',
      addressCountry: 'IT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 45.4642,
      longitude: 9.19,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    priceRange: '€€',
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer, Stripe',
    areaServed: {
      '@type': 'Country',
      name: 'Italia',
    },
    availableLanguage: ['Italian', 'English'],
    knowsAbout: [
      'Next.js',
      'React',
      'TypeScript',
      'Ghost CMS',
      'Headless CMS',
      'B2B Web Development',
      'Manufacturing Industry',
      'Technical SEO',
      'Schema.org',
      'Core Web Vitals',
      'WCAG 2.1',
      'Conversion Rate Optimization',
    ],
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-zak-schema', 'localbusiness');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return null;
}