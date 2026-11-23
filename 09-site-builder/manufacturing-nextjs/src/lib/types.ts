import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  category: z.string(),
  specifications: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
  applications: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  brochureUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  priceRange: z.enum(['contact', 'low', 'medium', 'high', 'custom']).optional(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  schemaType: z.enum(['Product', 'Service']).default('Product'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().default(0),
  productCount: z.number().default(0),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const RFQSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  company: z.string().min(1, 'Azienda richiesta'),
  role: z.string().optional(),
  country: z.string().default('IT'),
  productIds: z.array(z.string()).optional(),
  message: z.string().min(10, 'Messaggio troppo breve (min 10 caratteri)'),
  budget: z.enum(['under-10k', '10k-50k', '50k-100k', '100k-250k', '250k-500k', '500k+', 'not-specified']).optional(),
  timeline: z.enum(['asap', '1-month', '3-months', '6-months', '12-months', 'planning']).optional(),
  source: z.enum(['website', 'demo', 'email', 'referral', 'other']).default('website'),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  recaptchaToken: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).default('new'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  legalForm: z.enum(['S.r.l.', 'S.p.A.', 'S.a.s.', 'S.n.c.', 'Ditta Individuale', 'Cooperativa', 'Altro']),
  vatNumber: z.string().regex(/^IT\d{11}$/, 'Partita IVA non valida'),
  rea: z.string().optional(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  cap: z.string().regex(/^\d{5}$/),
  country: z.string().default('Italia'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  sector: z.string(),
  employees: z.number().optional(),
  revenue: z.number().optional(),
  certifications: z.array(z.string()).optional(),
  decisionMakerName: z.string(),
  decisionMakerRole: z.string(),
  decisionMakerEmail: z.string().email().optional(),
  decisionMakerPhone: z.string().optional(),
  painScore: z.number().min(0).max(100).optional(),
  hooks: z.array(z.string()).optional(),
  demoUrl: z.string().url().optional(),
  proposalSent: z.boolean().default(false),
  proposalSentAt: z.string().datetime().optional(),
  contractSigned: z.boolean().default(false),
  contractSignedAt: z.string().datetime().optional(),
  paymentReceived: z.boolean().default(false),
  paymentReceivedAt: z.string().datetime().optional(),
  siteDelivered: z.boolean().default(false),
  siteDeliveredAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SiteConfigSchema = z.object({
  companyName: z.string(),
  tagline: z.string(),
  description: z.string(),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  primaryColor: z.string().default('#3848f7'),
  secondaryColor: z.string().default('#0f172a'),
  accentColor: z.string().default('#f97316'),
  fonts: z.object({
    heading: z.string().default('Space Grotesk'),
    body: z.string().default('Inter'),
    mono: z.string().default('JetBrains Mono'),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    pec: z.string().optional(),
  }),
  social: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    youtube: z.string().url().optional(),
    github: z.string().url().optional(),
  }),
  seo: z.object({
    defaultTitle: z.string(),
    titleTemplate: z.string(),
    defaultDescription: z.string(),
    ogImage: z.string().url().optional(),
    twitterHandle: z.string().optional(),
  }),
  analytics: z.object({
    ga4Id: z.string().optional(),
    gtmId: z.string().optional(),
    clarityId: z.string().optional(),
  }),
  features: z.object({
    blog: z.boolean().default(true),
    multilingual: z.boolean().default(true),
    catalog: z.boolean().default(true),
    rfq: z.boolean().default(true),
    caseStudies: z.boolean().default(true),
  }),
});

export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type RFQ = z.infer<typeof RFQSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  megaMenu?: {
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string; description?: string }>;
    }>;
  };
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}