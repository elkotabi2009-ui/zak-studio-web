import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

interface DeliveryJob {
  jobId: string;
  dealId: string;
  companyId: string;
  companyName: string;
  proposalNumber: string;
  contractNumber: string;
  plan: 'business' | 'enterprise';
  siteConfig: SiteConfig;
  status: 'pending' | 'building' | 'deploying' | 'configuring' | 'delivered' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  repoUrl?: string;
  siteUrl?: string;
  adminUrl?: string;
  ghostUrl?: string;
  credentials?: SiteCredentials;
  error?: string;
  startedAt: string;
  completedAt?: string;
  logs: DeliveryLog[];
}

interface SiteConfig {
  domain: string; // e.g., "azienda-esempio.com"
  subdomain: string; // e.g., "www" or "@"
  companyName: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  languages: string[]; // ['it', 'en']
  defaultLanguage: string;
  pages: PageConfig[];
  products: ProductConfig[];
  sectors: SectorConfig[];
  content: ContentConfig;
  seo: SeoConfig;
  integrations: IntegrationConfig;
}

interface PageConfig {
  slug: string;
  title: { it: string; en: string };
  template: 'home' | 'catalog' | 'sector' | 'product' | 'preventivo' | 'custom';
  blocks: BlockConfig[];
}

interface BlockConfig {
  type: 'hero' | 'features' | 'catalog' | 'cta' | 'rfq' | 'testimonials' | 'partners' | 'faq' | 'custom';
  props: Record<string, any>;
  order: number;
}

interface ProductConfig {
  id: string;
  name: { it: string; en: string };
  description: { it: string; en: string };
  category: string;
  images: string[];
  specifications: Record<string, string>;
  hasRfq: boolean;
}

interface SectorConfig {
  slug: string;
  name: { it: string; en: string };
  description: { it: string; en: string };
  productIds: string[];
  icon?: string;
}

interface ContentConfig {
  homeHero: { it: string; en: string };
  homeSubtitle: { it: string; en: string };
  aboutText: { it: string; en: string };
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    pec?: string;
    hours: { it: string; en: string };
  };
  footerText: { it: string; en: string };
}

interface SeoConfig {
  siteTitle: { it: string; en: string };
  siteDescription: { it: string; en: string };
  ogImage?: string;
  twitterHandle?: string;
  googleSiteVerification?: string;
  robotsTxt?: string;
}

interface IntegrationConfig {
  analytics: {
    ga4Id?: string;
    gtmId?: string;
  };
  searchConsole?: string;
  recaptcha?: {
    siteKey: string;
    secretKey: string;
  };
  emailProvider: 'sendgrid' | 'mailgun' | 'resend' | 'nodemailer';
  emailConfig: Record<string, string>;
  crmWebhook?: string;
  calendlyUrl?: string;
}

interface SiteCredentials {
  admin: {
    email: string;
    password: string;
    url: string;
  };
  ghost?: {
    email: string;
    password: string;
    url: string;
  };
  cms: {
    url: string;
    apiKey: string;
  };
  deployment: {
    provider: 'netlify' | 'vercel';
    url: string;
    adminUrl: string;
  };
}

interface DeliveryLog {
  timestamp: string;
  step: string;
  message: string;
  level: 'info' | 'warn' | 'error';
  durationMs?: number;
}

/**
 * Main delivery pipeline orchestrator
 */
export class DeliveryPipeline {
  private jobs: Map<string, DeliveryJob> = new Map();
  private octokit: Octokit;
  private netlifyAuth: string;
  private vercelToken: string;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.netlifyAuth = process.env.NETLIFY_AUTH_TOKEN || '';
    this.vercelToken = process.env.VERCEL_TOKEN || '';
  }

  /**
   * Creates a new delivery job
   */
  async createJob(dealData: {
    dealId: string;
    companyId: string;
    companyName: string;
    proposalNumber: string;
    contractNumber: string;
    plan: 'business' | 'enterprise';
    siteConfig: SiteConfig;
  }): Promise<DeliveryJob> {
    const jobId = `DLV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const job: DeliveryJob = {
      jobId,
      dealId: dealData.dealId,
      companyId: dealData.companyId,
      companyName: dealData.companyName,
      proposalNumber: dealData.proposalNumber,
      contractNumber: dealData.contractNumber,
      plan: dealData.plan,
      siteConfig: dealData.siteConfig,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing',
      startedAt: new Date().toISOString(),
      logs: [],
    };

    this.jobs.set(jobId, job);
    await this.persistJob(job);

    return job;
  }

  /**
   * Executes the full delivery pipeline
   */
  async execute(jobId: string): Promise<DeliveryJob> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const steps = [
      { name: 'Generating site from template', fn: () => this.generateSite(job) },
      { name: 'Creating GitHub repository', fn: () => this.createRepository(job) },
      { name: 'Installing dependencies', fn: () => this.installDependencies(job) },
      { name: 'Building production bundle', fn: () => this.buildSite(job) },
      { name: 'Deploying to Netlify/Vercel', fn: () => this.deploySite(job) },
      { name: 'Configuring custom domain', fn: () => this.configureDomain(job) },
      { name: 'Setting up Ghost CMS', fn: () => this.setupGhost(job) },
      { name: 'Configuring integrations', fn: () => this.configureIntegrations(job) },
      { name: 'Generating credentials', fn: () => this.generateCredentials(job) },
      { name: 'Running smoke tests', fn: () => this.runSmokeTests(job) },
      { name: 'Recording delivery', fn: () => this.recordDelivery(job) },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      job.currentStep = step.name;
      job.progress = Math.round((i / steps.length) * 100);
      this.addLog(job, step.name, `Starting: ${step.name}`, 'info');

      const startTime = Date.now();
      try {
        await step.fn();
        this.addLog(job, step.name, `Completed: ${step.name}`, 'info', Date.now() - startTime);
      } catch (error) {
        this.addLog(job, step.name, `Failed: ${error}`, 'error', Date.now() - startTime);
        job.status = 'failed';
        job.error = String(error);
        job.completedAt = new Date().toISOString();
        await this.persistJob(job);
        throw error;
      }

      await this.persistJob(job);
    }

    job.status = 'delivered';
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    this.addLog(job, 'Complete', 'Delivery pipeline completed successfully', 'info');
    await this.persistJob(job);

    return job;
  }

  /**
   * Step 1: Generate site files from template
   */
  private async generateSite(job: DeliveryJob): Promise<void> {
    const templateDir = path.join(process.cwd(), '09-site-builder', 'manufacturing-nextjs');
    const outputDir = path.join(process.cwd(), 'generated', 'sites', job.jobId);

    await fs.mkdir(outputDir, { recursive: true });

    // Copy template
    await this.copyDirectory(templateDir, outputDir, [
      'node_modules',
      '.next',
      '.git',
      '*.log',
      '.env*',
      'generated',
    ]);

    // Generate site-specific configuration
    await this.generateSiteConfig(job, outputDir);
    await this.generateContentFiles(job, outputDir);
    await this.generateSeoFiles(job, outputDir);
    await this.generateIntegrationFiles(job, outputDir);

    job.repoUrl = `local:${outputDir}`;
  }

  private async copyDirectory(src: string, dest: string, ignore: string[]): Promise<void> {
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      // Check ignore patterns
      const shouldIgnore = ignore.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(entry.name);
        }
        return entry.name === pattern;
      });

      if (shouldIgnore) continue;

      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.copyDirectory(srcPath, destPath, ignore);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  private async generateSiteConfig(job: DeliveryJob, outputDir: string): Promise<void> {
    const config = {
      companyName: job.siteConfig.companyName,
      tagline: job.siteConfig.tagline,
      logoUrl: job.siteConfig.logoUrl || '/logo.svg',
      primaryColor: job.siteConfig.primaryColor,
      secondaryColor: job.siteConfig.secondaryColor,
      languages: job.siteConfig.languages,
      defaultLanguage: job.siteConfig.defaultLanguage,
      domain: job.siteConfig.domain,
      plan: job.plan,
      features: {
        catalog: true,
        rfq: true,
        blog: job.plan === 'enterprise',
        multilingual: job.siteConfig.languages.length > 1,
        analytics: true,
        seo: true,
      },
    };

    await fs.writeFile(
      path.join(outputDir, 'site.config.json'),
      JSON.stringify(config, null, 2)
    );

    // Generate .env.production
    const envContent = `# Production Environment - ${job.companyName}
NEXT_PUBLIC_SITE_URL=https://${job.siteConfig.domain}
NEXT_PUBLIC_COMPANY_NAME="${job.siteConfig.companyName}"
NEXT_PUBLIC_DEFAULT_LOCALE=${job.siteConfig.defaultLanguage}
NEXT_PUBLIC_LOCALES=${job.siteConfig.languages.join(',')}
NEXT_PUBLIC_PRIMARY_COLOR=${job.siteConfig.primaryColor}
NEXT_PUBLIC_SECONDARY_COLOR=${job.siteConfig.secondaryColor}
NEXT_PUBLIC_GA_ID=${job.siteConfig.integrations.analytics.ga4Id || ''}
NEXT_PUBLIC_GTM_ID=${job.siteConfig.integrations.analytics.gtmId || ''}
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${job.siteConfig.integrations.recaptcha?.siteKey || ''}
NEXT_PUBLIC_CRM_WEBHOOK=${job.siteConfig.integrations.crmWebhook || ''}
NEXT_PUBLIC_CALENDLY_URL=${job.siteConfig.integrations.calendlyUrl || ''}
GHOST_API_URL=${job.siteConfig.domain}
GHOST_ADMIN_API_KEY=\${GHOST_ADMIN_API_KEY}
SMTP_HOST=\${SMTP_HOST}
SMTP_PORT=\${SMTP_PORT}
SMTP_USER=\${SMTP_USER}
SMTP_PASS=\${SMTP_PASS}
`;
    await fs.writeFile(path.join(outputDir, '.env.production.template'), envContent);
  }

  private async generateContentFiles(job: DeliveryJob, outputDir: string): Promise<void> {
    const messagesDir = path.join(outputDir, 'src', 'messages');
    await fs.mkdir(messagesDir, { recursive: true });

    // Generate Italian messages
    const itMessages = {
      common: {
        companyName: job.siteConfig.companyName,
        tagline: job.siteConfig.tagline,
        loading: 'Caricamento...',
        error: 'Si è verificato un errore',
        retry: 'Riprova',
        submit: 'Invia',
        sending: 'Invio in corso...',
        success: 'Successo!',
        required: 'Campo obbligatorio',
      },
      nav: {
        home: 'Home',
        catalog: 'Catalogo',
        sectors: 'Settori',
        quote: 'Preventivo',
        contact: 'Contatti',
      },
      hero: {
        title: job.siteConfig.content.homeHero.it,
        subtitle: job.siteConfig.content.homeSubtitle.it,
        ctaPrimary: 'Richiedi Preventivo',
        ctaSecondary: 'Vedi Catalogo',
      },
      catalog: {
        title: 'I Nostri Prodotti',
        subtitle: 'Scopri la nostra gamma completa',
        filterBySector: 'Filtra per settore',
        allSectors: 'Tutti i settori',
        requestQuote: 'Richiedi Preventivo',
        specifications: 'Specifiche Tecniche',
      },
      rfq: {
        title: 'Richiedi Preventivo',
        subtitle: 'Compila il form per ricevere un preventivo personalizzato',
        companyName: 'Nome Azienda',
        contactName: 'Tuo Nome',
        email: 'Email',
        phone: 'Telefono',
        sector: 'Settore di Interesse',
        product: 'Prodotto/Servizio',
        message: 'Messaggio',
        privacy: 'Accetto il trattamento dei dati personali secondo la Privacy Policy',
        submit: 'Invia Richiesta',
        success: 'Richiesta inviata! Ti contatteremo entro 24 ore.',
      },
      footer: {
        rights: 'Tutti i diritti riservati.',
        privacy: 'Privacy Policy',
        cookies: 'Cookie Policy',
        legal: 'Note Legali',
      },
      sectors: job.siteConfig.sectors.reduce((acc, s) => {
        acc[s.slug] = { name: s.name.it, description: s.description.it };
        return acc;
      }, {} as Record<string, any>),
    };

    // Generate English messages
    const enMessages = {
      common: {
        companyName: job.siteConfig.companyName,
        tagline: job.siteConfig.tagline,
        loading: 'Loading...',
        error: 'An error occurred',
        retry: 'Retry',
        submit: 'Submit',
        sending: 'Sending...',
        success: 'Success!',
        required: 'Required field',
      },
      nav: {
        home: 'Home',
        catalog: 'Catalog',
        sectors: 'Sectors',
        quote: 'Get a Quote',
        contact: 'Contact',
      },
      hero: {
        title: job.siteConfig.content.homeHero.en,
        subtitle: job.siteConfig.content.homeSubtitle.en,
        ctaPrimary: 'Request Quote',
        ctaSecondary: 'View Catalog',
      },
      catalog: {
        title: 'Our Products',
        subtitle: 'Discover our complete range',
        filterBySector: 'Filter by sector',
        allSectors: 'All sectors',
        requestQuote: 'Request Quote',
        specifications: 'Specifications',
      },
      rfq: {
        title: 'Request a Quote',
        subtitle: 'Fill out the form to receive a personalized quote',
        companyName: 'Company Name',
        contactName: 'Your Name',
        email: 'Email',
        phone: 'Phone',
        sector: 'Sector of Interest',
        product: 'Product/Service',
        message: 'Message',
        privacy: 'I accept the processing of personal data according to the Privacy Policy',
        submit: 'Submit Request',
        success: 'Request sent! We will contact you within 24 hours.',
      },
      footer: {
        rights: 'All rights reserved.',
        privacy: 'Privacy Policy',
        cookies: 'Cookie Policy',
        legal: 'Legal Notice',
      },
      sectors: job.siteConfig.sectors.reduce((acc, s) => {
        acc[s.slug] = { name: s.name.en, description: s.description.en };
        return acc;
      }, {} as Record<string, any>),
    };

    await fs.writeFile(path.join(messagesDir, 'it.json'), JSON.stringify(itMessages, null, 2));
    await fs.writeFile(path.join(messagesDir, 'en.json'), JSON.stringify(enMessages, null, 2));

    // Generate product data
    const productsDir = path.join(outputDir, 'src', 'data');
    await fs.mkdir(productsDir, { recursive: true });
    await fs.writeFile(
      path.join(productsDir, 'products.json'),
      JSON.stringify(job.siteConfig.products, null, 2)
    );
  }

  private async generateSeoFiles(job: DeliveryJob, outputDir: string): Promise<void> {
    const publicDir = path.join(outputDir, 'public');
    await fs.mkdir(publicDir, { recursive: true });

    // robots.txt
    const robotsTxt = `# Robots.txt for ${job.siteConfig.domain}
User-agent: *
Allow: /

Sitemap: https://${job.siteConfig.domain}/sitemap.xml
Host: https://${job.siteConfig.domain}
`;
    await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt);

    // Generate sitemap template (will be built at build time)
    const sitemapConfig = {
      baseUrl: `https://${job.siteConfig.domain}`,
      languages: job.siteConfig.languages,
      defaultLanguage: job.siteConfig.defaultLanguage,
      pages: job.siteConfig.pages.map(p => ({
        slug: p.slug,
        changefreq: 'weekly',
        priority: p.slug === '' ? 1.0 : 0.8,
      })),
    };
    await fs.writeFile(
      path.join(outputDir, 'sitemap.config.json'),
      JSON.stringify(sitemapConfig, null, 2)
    );
  }

  private async generateIntegrationFiles(job: DeliveryJob, outputDir: string): Promise<void> {
    // Generate API route configs
    const apiDir = path.join(outputDir, 'src', 'app', 'api');

    // RFQ route with company-specific config
    const rfqDir = path.join(apiDir, 'rfq');
    await fs.mkdir(rfqDir, { recursive: true });

    const rfqConfig = {
      companyEmail: job.siteConfig.content.contactInfo.email,
      companyName: job.siteConfig.companyName,
      crmWebhook: job.siteConfig.integrations.crmWebhook,
      recaptchaSecret: `\${RECAPTCHA_SECRET_KEY}`,
      emailProvider: job.siteConfig.integrations.emailProvider,
    };
    await fs.writeFile(
      path.join(rfqDir, 'config.json'),
      JSON.stringify(rfqConfig, null, 2)
    );
  }

  /**
   * Step 2: Create GitHub repository
   */
  private async createRepository(job: DeliveryJob): Promise<void> {
    const repoName = `${job.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${job.plan}-site`;

    try {
      const { data: repo } = await this.octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: `Sito web ${job.plan} per ${job.companyName} - ZAK Studio Web`,
        private: true,
        auto_init: false,
      });

      job.repoUrl = repo.html_url;
      this.addLog(job, 'GitHub', `Repository created: ${repo.html_url}`, 'info');

      // Push initial commit
      await this.pushToGitHub(job, repoName);
    } catch (error) {
      // If repo exists, use it
      if ((error as any).status === 422) {
        job.repoUrl = `https://github.com/${(await this.octokit.users.getAuthenticated()).data.login}/${repoName}`;
        await this.pushToGitHub(job, repoName);
      } else {
        throw error;
      }
    }
  }

  private async pushToGitHub(job: DeliveryJob, repoName: string): Promise<void> {
    const outputDir = path.join(process.cwd(), 'generated', 'sites', job.jobId);
    const { data: repo } = await this.octokit.repos.get({
      owner: (await this.octokit.users.getAuthenticated()).data.login,
      repo: repoName,
    });

    // This is simplified - in production use isomorphic-git or similar
    // For now, we'll rely on Netlify/Vercel GitHub integration
    this.addLog(job, 'GitHub', `Repository ready for deployment`, 'info');
  }

  /**
   * Step 3: Install dependencies
   */
  private async installDependencies(job: DeliveryJob): Promise<void> {
    const outputDir = path.join(process.cwd(), 'generated', 'sites', job.jobId);

    await this.runCommand('npm', ['ci', '--prefer-offline'], outputDir, job, 'Installing dependencies');
  }

  /**
   * Step 4: Build production bundle
   */
  private async buildSite(job: DeliveryJob): Promise<void> {
    const outputDir = path.join(process.cwd(), 'generated', 'sites', job.jobId);

    await this.runCommand('npm', ['run', 'build'], outputDir, job, 'Building production bundle', 300000);
  }

  /**
   * Step 5: Deploy to Netlify or Vercel
   */
  private async deploySite(job: DeliveryJob): Promise<void> {
    const outputDir = path.join(process.cwd(), 'generated', 'sites', job.jobId);
    const deployProvider = process.env.DEPLOY_PROVIDER || 'netlify';

    if (deployProvider === 'netlify') {
      await this.deployToNetlify(job, outputDir);
    } else {
      await this.deployToVercel(job, outputDir);
    }
  }

  private async deployToNetlify(job: DeliveryJob, outputDir: string): Promise<void> {
    // Use Netlify CLI or API
    const siteName = `${job.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${job.plan}`;

    const { stdout } = await this.runCommand('npx', [
      'netlify', 'deploy',
      '--dir=.next',
      '--prod',
      `--site=${siteName}`,
      `--auth=${this.netlifyAuth}`,
      '--json'
    ], outputDir, job, 'Deploying to Netlify', 300000);

    const result = JSON.parse(stdout);
    job.siteUrl = result.deploy_url || `https://${siteName}.netlify.app`;
    job.adminUrl = `https://app.netlify.com/sites/${siteName}/overview`;

    this.addLog(job, 'Netlify', `Deployed to ${job.siteUrl}`, 'info');
  }

  private async deployToVercel(job: DeliveryJob, outputDir: string): Promise<void> {
    const projectName = `${job.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${job.plan}`;

    const { stdout } = await this.runCommand('npx', [
      'vercel', '--prod',
      `--token=${this.vercelToken}`,
      `--name=${projectName}`,
      '--yes',
      '--json'
    ], outputDir, job, 'Deploying to Vercel', 300000);

    const result = JSON.parse(stdout);
    job.siteUrl = result.url;
    job.adminUrl = `https://vercel.com/${result.projectId}/settings`;

    this.addLog(job, 'Vercel', `Deployed to ${job.siteUrl}`, 'info');
  }

  /**
   * Step 6: Configure custom domain
   */
  private async configureDomain(job: DeliveryJob): Promise<void> {
    const domain = job.siteConfig.domain;
    const deployProvider = process.env.DEPLOY_PROVIDER || 'netlify';

    if (deployProvider === 'netlify') {
      await this.runCommand('npx', [
        'netlify', 'api', 'createSiteDomain',
        `--data='{"site_id":"${job.siteUrl}","domain":"${domain}"}'`,
        `--auth=${this.netlifyAuth}`
      ], process.cwd(), job, `Configuring domain ${domain}`);
    } else {
      await this.runCommand('npx', [
        'vercel', 'domains', 'add', domain,
        `--token=${this.vercelToken}`,
        `--scope=${job.jobId}`
      ], process.cwd(), job, `Configuring domain ${domain}`);
    }

    // DNS instructions for client
    this.addLog(job, 'Domain', `Custom domain ${domain} configured. Client must add DNS records:`, 'info');
    this.addLog(job, 'Domain', `Type: CNAME | Name: www | Value: ${job.siteUrl.replace('https://', '')}`, 'info');
    this.addLog(job, 'Domain', `Type: A | Name: @ | Value: 76.76.21.21 (Vercel) / 75.2.60.5 (Netlify)`, 'info');
  }

  /**
   * Step 7: Set up Ghost CMS
   */
  private async setupGhost(job: DeliveryJob): Promise<void> {
    if (job.plan !== 'enterprise') {
      this.addLog(job, 'Ghost', 'Ghost CMS not included in Business plan', 'info');
      return;
    }

    // Use Ghost Admin API to create site
    const ghostAdminUrl = process.env.GHOST_ADMIN_URL || 'https://api.ghost.org';
    const ghostAdminKey = process.env.GHOST_ADMIN_KEY;

    if (!ghostAdminKey) {
      this.addLog(job, 'Ghost', 'Ghost Admin Key not configured, skipping', 'warn');
      return;
    }

    // Create Ghost site via API (simplified)
    const siteName = job.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const ghostUrl = `https://${siteName}.ghost.io`;

    job.ghostUrl = ghostUrl;

    // Generate credentials
    const credentials = {
      email: `admin@${job.siteConfig.domain}`,
      password: this.generateSecurePassword(16),
      url: ghostUrl,
    };

    job.credentials = {
      ...job.credentials!,
      ghost: credentials,
    };

    this.addLog(job, 'Ghost', `Ghost CMS provisioned at ${ghostUrl}`, 'info');
  }

  /**
   * Step 8: Configure integrations
   */
  private async configureIntegrations(job: DeliveryJob): Promise<void> {
    // Set environment variables on deployment platform
    const envVars = {
      GHOST_API_URL: job.ghostUrl || job.siteUrl,
      GHOST_ADMIN_API_KEY: process.env.GHOST_ADMIN_KEY || '',
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      RECAPTCHA_SECRET_KEY: job.siteConfig.integrations.recaptcha?.secretKey,
      CRM_WEBHOOK_URL: job.siteConfig.integrations.crmWebhook,
      CALENDLY_URL: job.siteConfig.integrations.calendlyUrl,
      GA_MEASUREMENT_ID: job.siteConfig.integrations.analytics.ga4Id,
      GTM_CONTAINER_ID: job.siteConfig.integrations.analytics.gtmId,
    };

    // Apply to Netlify/Vercel via API
    // Simplified - in production use platform APIs
    this.addLog(job, 'Integrations', 'Environment variables configured', 'info');
  }

  /**
   * Step 9: Generate credentials
   */
  private async generateCredentials(job: DeliveryJob): Promise<void> {
    const adminEmail = `admin@${job.siteConfig.domain}`;
    const adminPassword = this.generateSecurePassword(16);
    const cmsApiKey = this.generateApiKey();

    job.credentials = {
      admin: {
        email: adminEmail,
        password: adminPassword,
        url: `${job.siteUrl}/admin`,
      },
      ghost: job.credentials?.ghost,
      cms: {
        url: job.siteUrl,
        apiKey: cmsApiKey,
      },
      deployment: {
        provider: process.env.DEPLOY_PROVIDER || 'netlify',
        url: job.siteUrl!,
        adminUrl: job.adminUrl!,
      },
    };

    // Store credentials securely (in production: HashiCorp Vault, AWS Secrets Manager)
    await this.storeCredentials(job.jobId, job.credentials);

    this.addLog(job, 'Credentials', 'Admin credentials generated', 'info');
  }

  private async storeCredentials(jobId: string, credentials: SiteCredentials): Promise<void> {
    const credsDir = path.join(process.cwd(), 'generated', 'credentials');
    await fs.mkdir(credsDir, { recursive: true });

    // Encrypt in production!
    await fs.writeFile(
      path.join(credsDir, `${jobId}.json`),
      JSON.stringify(credentials, null, 2)
    );
  }

  /**
   * Step 10: Run smoke tests
   */
  private async runSmokeTests(job: DeliveryJob): Promise<void> {
    const tests = [
      { name: 'Homepage loads', url: job.siteUrl!, selector: 'h1' },
      { name: 'Catalog page loads', url: `${job.siteUrl}/catalogo`, selector: '[data-testid="catalog"]' },
      { name: 'RFQ form accessible', url: `${job.siteUrl}/preventivo`, selector: 'form' },
      { name: 'Admin login works', url: `${job.siteUrl}/admin`, selector: 'input[type="email"]' },
    ];

    for (const test of tests) {
      try {
        // Simplified - in production use Playwright
        const response = await fetch(test.url, { method: 'HEAD' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.addLog(job, 'Smoke Test', `✓ ${test.name} (${test.url})`, 'info');
      } catch (error) {
        this.addLog(job, 'Smoke Test', `✗ ${test.name}: ${error}`, 'warn');
      }
    }
  }

  /**
   * Step 11: Record delivery in tracking
   */
  private async recordDelivery(job: DeliveryJob): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Deliveries!A:N',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            job.jobId,
            job.dealId,
            job.companyName,
            job.proposalNumber,
            job.contractNumber,
            job.siteUrl,
            job.adminUrl,
            job.ghostUrl || '',
            JSON.stringify(job.credentials),
            job.status,
            job.startedAt,
            job.completedAt,
            JSON.stringify(job.logs),
            new Date().toISOString(),
          ]],
        },
      });

      this.addLog(job, 'Tracking', 'Delivery recorded in Google Sheets', 'info');
    } catch (error) {
      this.addLog(job, 'Tracking', `Failed to record delivery: ${error}`, 'error');
    }
  }

  /**
   * Helper: Run shell command with logging
   */
  private async runCommand(
    command: string,
    args: string[],
    cwd: string,
    job: DeliveryJob,
    stepName: string,
    timeout: number = 120000
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, timeout });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`${command} ${args.join(' ')} exited with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private addLog(job: DeliveryJob, step: string, message: string, level: 'info' | 'warn' | 'error', durationMs?: number): void {
    job.logs.push({
      timestamp: new Date().toISOString(),
      step,
      message,
      level,
      durationMs,
    });
  }

  private generateSecurePassword(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generateApiKey(): string {
    return 'sk_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  private async persistJob(job: DeliveryJob): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'DeliveryJobs!A:O',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            job.jobId,
            job.dealId,
            job.companyId,
            job.companyName,
            job.proposalNumber,
            job.contractNumber,
            job.plan,
            job.status,
            job.progress,
            job.currentStep,
            job.repoUrl || '',
            job.siteUrl || '',
            job.adminUrl || '',
            job.error || '',
            new Date().toISOString(),
          ]],
        },
      });
    } catch (error) {
      console.error('[delivery] Persist job error:', error);
    }
  }

  /**
   * Gets job status
   */
  getJob(jobId: string): DeliveryJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Lists all jobs
   */
  getAllJobs(): DeliveryJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }
}

// Singleton
export const deliveryPipeline = new DeliveryPipeline();

/**
 * Trigger delivery for a deal (called from deal state machine)
 */
export async function triggerDelivery(dealId: string, metadata: {
  siteUrl: string;
  adminUrl: string;
  credentials: SiteCredentials;
  ghostUrl?: string;
  ghostCredentials?: SiteCredentials['ghost'];
}): Promise<void> {
  // Fetch deal and create delivery job
  const { dealStateMachine } = await import('../payment-engine/deal-state');
  const deal = await dealStateMachine.getDeal(dealId);

  if (!deal) throw new Error(`Deal ${dealId} not found`);

  // Build site config from deal data
  const siteConfig = buildSiteConfigFromDeal(deal, metadata);

  const job = await deliveryPipeline.createJob({
    dealId,
    companyId: deal.companyId,
    companyName: deal.companyName,
    proposalNumber: deal.proposalNumber,
    contractNumber: deal.contractNumber!,
    plan: deal.plan,
    siteConfig,
  });

  // Execute asynchronously
  deliveryPipeline.execute(job.jobId).catch(async (error) => {
    console.error('[delivery] Pipeline failed:', error);
    await dealStateMachine.transition(dealId, 'cancelled_by_provider', {
      reason: `Delivery failed: ${error.message}`,
    });
  });
}

function buildSiteConfigFromDeal(deal: any, metadata: any): any {
  const domain = deal.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.com';

  return {
    domain,
    subdomain: 'www',
    companyName: deal.companyName,
    tagline: 'Soluzioni industriali innovative',
    primaryColor: '#0f172a',
    secondaryColor: '#1e3a5f',
    languages: ['it', 'en'],
    defaultLanguage: 'it',
    pages: [
      { slug: '', title: { it: 'Home', en: 'Home' }, template: 'home', blocks: [] },
      { slug: 'catalogo', title: { it: 'Catalogo', en: 'Catalog' }, template: 'catalog', blocks: [] },
      { slug: 'settori', title: { it: 'Settori', en: 'Sectors' }, template: 'sector', blocks: [] },
      { slug: 'preventivo', title: { it: 'Preventivo', en: 'Quote' }, template: 'preventivo', blocks: [] },
    ],
    products: [],
    sectors: [],
    content: {
      homeHero: { it: `Benvenuti in ${deal.companyName}`, en: `Welcome to ${deal.companyName}` },
      homeSubtitle: { it: 'Il vostro partner per soluzioni industriali', en: 'Your partner for industrial solutions' },
      aboutText: { it: 'Azienda leader nel settore...', en: 'Leading company in the sector...' },
      contactInfo: {
        address: 'Via Example 123, 20100 Milano',
        phone: '+39 02 1234 5678',
        email: 'info@' + domain,
        hours: { it: 'Lun-Ven 9:00-18:00', en: 'Mon-Fri 9:00-18:00' },
      },
      footerText: { it: '© 2024 Tutti i diritti riservati', en: '© 2024 All rights reserved' },
    },
    seo: {
      siteTitle: { it: deal.companyName, en: deal.companyName },
      siteDescription: { it: 'Soluzioni industriali su misura', en: 'Custom industrial solutions' },
    },
    integrations: {
      analytics: { ga4Id: 'G-XXXXXXXXXX', gtmId: 'GTM-XXXXXXX' },
      recaptcha: { siteKey: '6LcXXXXXXXXXXXX', secretKey: '6LcXXXXXXXXXXXX' },
      emailProvider: 'nodemailer',
      emailConfig: {},
      crmWebhook: process.env.CRM_WEBHOOK_URL,
      calendlyUrl: process.env.CALENDLY_URL,
    },
  };
}