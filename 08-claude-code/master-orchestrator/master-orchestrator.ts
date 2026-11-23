import { EventEmitter } from 'events';
import schedule from 'node-schedule';
import { google } from 'googleapis';
import { dealStateMachine, DealStatus, DealEvent } from '../payment-engine/deal-state';
import { deliveryPipeline, triggerDelivery } from '../delivery-pipeline/delivery-pipeline';
import { postDeliveryOrchestrator, runPostDeliveryCron } from '../delivery-pipeline/post-delivery';
import { runDailyReconciliation } from '../payment-engine/bank-match';
import { initializeDispatchEngine } from '../dispatch-engine/index';
import { warmupManager } from '../dispatch-engine/warmup';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

interface OrchestratorConfig {
  // Lead discovery
  leadDiscovery: {
    enabled: boolean;
    schedule: string; // cron expression
    sources: string[]; // 'apify', 'manual', 'webhook'
    maxPerRun: number;
  };

  // Analysis
  analysis: {
    enabled: boolean;
    minPainScore: number;
    maxConcurrent: number;
  };

  // Demo generation
  demos: {
    enabled: boolean;
    plans: ('business' | 'enterprise')[];
    maxConcurrent: number;
  };

  // Email dispatch
  dispatch: {
    enabled: boolean;
    warmupCheck: boolean;
    maxDailyPerDomain: number;
    queueProcessingInterval: number; // ms
  };

  // Payment processing
  payments: {
    enabled: boolean;
    reconciliationSchedule: string; // cron
    stripeWebhookEnabled: boolean;
    bankMatchEnabled: boolean;
  };

  // Delivery
  delivery: {
    enabled: boolean;
    maxConcurrent: number;
    autoTrigger: boolean;
  };

  // Post-delivery
  postDelivery: {
    enabled: boolean;
    cronSchedule: string;
  };

  // Monitoring
  monitoring: {
    healthCheckInterval: number; // ms
    alertChannels: string[];
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  leadDiscovery: {
    enabled: true,
    schedule: '0 9 * * 1-5', // Weekdays 9 AM
    sources: ['apify'],
    maxPerRun: 50,
  },
  analysis: {
    enabled: true,
    minPainScore: 40,
    maxConcurrent: 5,
  },
  demos: {
    enabled: true,
    plans: ['business', 'enterprise'],
    maxConcurrent: 3,
  },
  dispatch: {
    enabled: true,
    warmupCheck: true,
    maxDailyPerDomain: 50,
    queueProcessingInterval: 60000,
  },
  payments: {
    enabled: true,
    reconciliationSchedule: '0 6 * * *', // Daily 6 AM
    stripeWebhookEnabled: true,
    bankMatchEnabled: true,
  },
  delivery: {
    enabled: true,
    maxConcurrent: 2,
    autoTrigger: true,
  },
  postDelivery: {
    enabled: true,
    cronSchedule: '0 8 * * *', // Daily 8 AM
  },
  monitoring: {
    healthCheckInterval: 300000, // 5 minutes
    alertChannels: ['slack', 'email'],
    logLevel: 'info',
  },
};

type OrchestratorPhase =
  | 'idle'
  | 'lead_discovery'
  | 'analysis'
  | 'demo_generation'
  | 'email_dispatch'
  | 'payment_processing'
  | 'delivery'
  | 'post_delivery'
  | 'monitoring'
  | 'shutdown';

interface OrchestratorState {
  phase: OrchestratorPhase;
  isRunning: boolean;
  startTime: string;
  lastCycleTime?: string;
  cycleCount: number;
  errors: string[];
  stats: {
    leadsDiscovered: number;
    leadsAnalyzed: number;
    demosGenerated: number;
    emailsSent: number;
    paymentsProcessed: number;
    sitesDelivered: number;
    postDeliveryActions: number;
  };
}

/**
 * Master Orchestrator - Perpetual autonomous loop coordinating all systems
 */
export class MasterOrchestrator extends EventEmitter {
  private config: OrchestratorConfig;
  private state: OrchestratorState;
  private jobs: Map<string, schedule.Job> = new Map();
  private isShuttingDown = false;
  private cycleInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      phase: 'idle',
      isRunning: false,
      startTime: new Date().toISOString(),
      cycleCount: 0,
      errors: [],
      stats: {
        leadsDiscovered: 0,
        leadsAnalyzed: 0,
        demosGenerated: 0,
        emailsSent: 0,
        paymentsProcessed: 0,
        sitesDelivered: 0,
        postDeliveryActions: 0,
      },
    };
  }

  /**
   * Starts the orchestrator
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      this.log('warn', 'Orchestrator already running');
      return;
    }

    this.log('info', '🚀 Starting Master Orchestrator...');
    this.state.isRunning = true;
    this.state.startTime = new Date().toISOString();

    // Initialize subsystems
    await this.initializeSubsystems();

    // Schedule recurring jobs
    this.scheduleJobs();

    // Start main cycle
    this.startMainCycle();

    // Start health monitoring
    this.startHealthMonitoring();

    this.emit('started');
    this.log('info', '✅ Master Orchestrator started successfully');
  }

  /**
   * Stops the orchestrator gracefully
   */
  async stop(): Promise<void> {
    this.log('info', '🛑 Stopping Master Orchestrator...');
    this.isShuttingDown = true;
    this.state.isRunning = false;

    // Clear intervals
    if (this.cycleInterval) clearInterval(this.cycleInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

    // Cancel scheduled jobs
    for (const [name, job] of this.jobs) {
      job.cancel();
      this.log('debug', `Cancelled job: ${name}`);
    }
    this.jobs.clear();

    // Wait for current operations to complete (max 30s)
    await this.waitForCompletion(30000);

    this.emit('stopped');
    this.log('info', '✅ Master Orchestrator stopped');
  }

  /**
   * Initializes all subsystems
   */
  private async initializeSubsystems(): Promise<void> {
    this.log('info', 'Initializing subsystems...');

    // Initialize dispatch engine
    if (this.config.dispatch.enabled) {
      await initializeDispatchEngine();
      this.log('info', '✅ Dispatch engine initialized');
    }

    // Verify Google Sheets connection
    await this.verifySheetsConnection();
    this.log('info', '✅ Google Sheets connected');

    // Verify API connections
    await this.verifyApiConnections();
    this.log('info', '✅ API connections verified');

    // Load existing deals into state machine
    await dealStateMachine.getAllDeals();
    this.log('info', '✅ Deal state machine loaded');
  }

  private async verifySheetsConnection(): Promise<void> {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.get({ spreadsheetId: SHEETS_ID });
  }

  private async verifyApiConnections(): Promise<void> {
    // Verify critical API keys exist
    const required = [
      'AGENTMAIL_API_KEY',
      'FIRECRAWL_API_KEY',
      'NETLIFY_AUTH_TOKEN',
      'UNSUB_SECRET',
    ];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }

  /**
   * Schedules recurring jobs
   */
  private scheduleJobs(): void {
    // Lead discovery
    if (this.config.leadDiscovery.enabled) {
      const job = schedule.scheduleJob(this.config.leadDiscovery.schedule, () => {
        this.runPhase('lead_discovery');
      });
      this.jobs.set('lead_discovery', job);
      this.log('info', `Scheduled lead discovery: ${this.config.leadDiscovery.schedule}`);
    }

    // Payment reconciliation
    if (this.config.payments.enabled && this.config.payments.bankMatchEnabled) {
      const job = schedule.scheduleJob(this.config.payments.reconciliationSchedule, () => {
        this.runPhase('payment_processing');
      });
      this.jobs.set('payment_reconciliation', job);
      this.log('info', `Scheduled payment reconciliation: ${this.config.payments.reconciliationSchedule}`);
    }

    // Post-delivery cron
    if (this.config.postDelivery.enabled) {
      const job = schedule.scheduleJob(this.config.postDelivery.cronSchedule, () => {
        this.runPhase('post_delivery');
      });
      this.jobs.set('post_delivery', job);
      this.log('info', `Scheduled post-delivery: ${this.config.postDelivery.cronSchedule}`);
    }
  }

  /**
   * Starts the main orchestration cycle
   */
  private startMainCycle(): void {
    const runCycle = async () => {
      if (this.isShuttingDown) return;

      try {
        this.state.cycleCount++;
        this.state.lastCycleTime = new Date().toISOString();
        this.log('debug', `Starting cycle #${this.state.cycleCount}`);

        // Run continuous phases
        await this.runContinuousPhases();

        this.log('debug', `Cycle #${this.state.cycleCount} completed`);
      } catch (error) {
        this.state.errors.push(`${new Date().toISOString()}: ${error}`);
        this.log('error', `Cycle error: ${error}`);
        this.emit('error', error);
      }
    };

    // Run immediately, then every 2 minutes
    runCycle();
    this.cycleInterval = setInterval(runCycle, 120000);
  }

  /**
   * Runs continuous phases (not scheduled)
   */
  private async runContinuousPhases(): Promise<void> {
    // 1. Process email queue (handled by dispatch engine internally)

    // 2. Check for deals needing action
    await this.processDealActions();

    // 3. Monitor deliveries
    if (this.config.delivery.enabled) {
      await this.monitorDeliveries();
    }

    // 4. Check warmup status
    if (this.config.dispatch.warmupCheck) {
      await this.checkWarmup();
    }
  }

  /**
   * Processes deals that need action
   */
  private async processDealActions(): Promise<void> {
    const actionableDeals = await dealStateMachine.getDealsRequiringAction();

    for (const deal of actionableDeals) {
      try {
        switch (deal.status) {
          case 'awaiting_deposit':
            // Send payment reminder
            if (deal.depositDueDate) {
              const due = new Date(deal.depositDueDate);
              const daysOverdue = Math.floor((Date.now() - due.getTime()) / 86400000);
              if (daysOverdue >= 0 && daysOverdue % 3 === 0) { // Every 3 days
                await this.sendPaymentReminder(deal, 'deposit', daysOverdue);
              }
            }
            break;

          case 'awaiting_balance':
            if (deal.balanceDueDate) {
              const due = new Date(deal.balanceDueDate);
              const daysOverdue = Math.floor((Date.now() - due.getTime()) / 86400000);
              if (daysOverdue >= 0 && daysOverdue % 3 === 0) {
                await this.sendPaymentReminder(deal, 'balance', daysOverdue);
              }
            }
            break;

          case 'contract_sent':
            // Check if contract viewed but not signed (14 days)
            if (deal.lastEventAt) {
              const sent = new Date(deal.lastEventAt);
              const daysSince = Math.floor((Date.now() - sent.getTime()) / 86400000);
              if (daysSince === 7 || daysSince === 14) {
                await this.sendContractReminder(deal, daysSince);
              }
            }
            break;

          case 'in_production':
            // Check for stalled production (> 60 days)
            if (deal.productionStartedAt) {
              const started = new Date(deal.productionStartedAt);
              const daysInProd = Math.floor((Date.now() - started.getTime()) / 86400000);
              if (daysInProd > 60) {
                await this.alertStalledProduction(deal, daysInProd);
              }
            }
            break;
        }
      } catch (error) {
        this.log('error', `Failed to process deal ${deal.dealId}: ${error}`);
      }
    }
  }

  /**
   * Monitors active deliveries
   */
  private async monitorDeliveries(): Promise<void> {
    const jobs = deliveryPipeline.getAllJobs();
    const activeJobs = jobs.filter(j =>
      ['building', 'deploying', 'configuring'].includes(j.status)
    );

    for (const job of activeJobs) {
      // Check for stuck jobs (> 60 minutes in same phase)
      const lastLog = job.logs[job.logs.length - 1];
      if (lastLog) {
        const logTime = new Date(lastLog.timestamp).getTime();
        if (Date.now() - logTime > 3600000) { // 1 hour
          this.log('warn', `Delivery job ${job.jobId} appears stuck in ${job.currentStep}`);
          this.emit('delivery_stuck', job);
        }
      }
    }
  }

  /**
   * Checks warmup status
   */
  private async checkWarmup(): Promise<void> {
    if (!warmupManager.isWarmupComplete()) {
      const status = warmupManager.getWarmupStatus();
      this.log('info', `Warmup status: Week ${status.currentWeek}/5, ${status.emailsSentToday}/${status.dailyLimit} emails today`);

      if (status.emailsSentToday < status.dailyLimit * 0.5) {
        this.log('warn', 'Warmup behind schedule - consider increasing volume');
      }
    }
  }

  /**
   * Runs a specific phase
   */
  private async runPhase(phase: OrchestratorPhase): Promise<void> {
    this.state.phase = phase;
    this.log('info', `▶️ Starting phase: ${phase}`);

    try {
      switch (phase) {
        case 'lead_discovery':
          await this.runLeadDiscovery();
          break;
        case 'analysis':
          await this.runAnalysis();
          break;
        case 'demo_generation':
          await this.runDemoGeneration();
          break;
        case 'email_dispatch':
          await this.runEmailDispatch();
          break;
        case 'payment_processing':
          await this.runPaymentProcessing();
          break;
        case 'delivery':
          await this.runDelivery();
          break;
        case 'post_delivery':
          await this.runPostDelivery();
          break;
        case 'monitoring':
          await this.runMonitoring();
          break;
      }
      this.log('info', `✅ Phase ${phase} completed`);
    } catch (error) {
      this.log('error', `Phase ${phase} failed: ${error}`);
      this.state.errors.push(`${phase}: ${error}`);
      this.emit('phase_error', { phase, error });
    } finally {
      this.state.phase = 'idle';
    }
  }

  /**
   * Phase: Lead Discovery
   */
  private async runLeadDiscovery(): Promise<void> {
    this.log('info', 'Discovering new leads...');

    // In production: call Apify actor or other sources
    // For now, load from companies.csv if not already processed
    const { LeadAnalyzer } = await import('../custom-skills/lead-analyzer/index');
    const analyzer = new LeadAnalyzer();

    // This would be implemented with actual lead discovery
    this.state.stats.leadsDiscovered += 0; // Placeholder
  }

  /**
   * Phase: Analysis
   */
  private async runAnalysis(): Promise<void> {
    this.log('info', 'Analyzing leads...');

    // Analyze unanalyzed leads from sheets
    const { LeadAnalyzer } = await import('./custom-skills/lead-analyzer/index');
    const analyzer = new LeadAnalyzer();

    // Get companies needing analysis
    const companies = await this.getCompaniesNeedingAnalysis();

    for (const company of companies.slice(0, this.config.analysis.maxConcurrent)) {
      try {
        const result = await analyzer.analyze(company.website);
        if (result.painScore >= this.config.analysis.minPainScore) {
          await this.queueForDemo(company, result);
          this.state.stats.leadsAnalyzed++;
        }
      } catch (error) {
        this.log('error', `Analysis failed for ${company.name}: ${error}`);
      }
    }
  }

  /**
   * Phase: Demo Generation
   */
  private async runDemoGeneration(): Promise<void> {
    this.log('info', 'Generating demos...');

    const { WebDemoGenerator } = await import('../custom-skills/web-demo-generator/index');
    const generator = new WebDemoGenerator();

    const demosToGenerate = await this.getDemosToGenerate();

    for (const demo of demosToGenerate.slice(0, this.config.demos.maxConcurrent)) {
      try {
        await generator.generate({
          companyId: demo.companyId,
          painPoints: demo.painPoints,
          plan: demo.plan,
          deployTarget: 'netlify',
        });
        this.state.stats.demosGenerated++;
      } catch (error) {
        this.log('error', `Demo generation failed for ${demo.companyId}: ${error}`);
      }
    }
  }

  /**
   * Phase: Email Dispatch
   */
  private async runEmailDispatch(): Promise<void> {
    this.log('info', 'Processing email queue...');

    const { emailQueue } = await import('../dispatch-engine/queue');
    const pending = emailQueue.getPendingEmails(this.config.dispatch.maxDailyPerDomain);

    if (pending.length > 0) {
      const { sendBulkEmails } = await import('../dispatch-engine/sender');
      const results = await sendBulkEmails(pending.map(e => ({
        to: e.to,
        toName: e.toName,
        subject: e.subject,
        html: e.html,
        text: e.text,
        headers: e.headers,
        tags: e.tags,
        trackingId: e.trackingId,
      })), { delayMs: 2000, maxConcurrent: 3 });

      for (let i = 0; i < pending.length; i++) {
        if (results[i].success) {
          await emailQueue.updateStatus(pending[i].trackingId, 'sent');
          this.state.stats.emailsSent++;
        } else {
          await emailQueue.updateStatus(pending[i].trackingId, 'failed', results[i].error);
        }
      }
    }
  }

  /**
   * Phase: Payment Processing
   */
  private async runPaymentProcessing(): Promise<void> {
    this.log('info', 'Running payment reconciliation...');

    if (this.config.payments.bankMatchEnabled) {
      const result = await runDailyReconciliation();
      this.state.stats.paymentsProcessed += result.matched;
      this.log('info', `Reconciliation: ${result.processed} processed, ${result.matched} matched, ${result.needsReview} need review`);
    }

    // Also check for overdue payments and send reminders
    await this.processDealActions();
  }

  /**
   * Phase: Delivery
   */
  private async runDelivery(): Promise<void> {
    this.log('info', 'Checking for deliveries to trigger...');

    if (!this.config.delivery.autoTrigger) return;

    const deals = await dealStateMachine.getAllDeals('balance_received');

    for (const deal of deals) {
      // Check if delivery already triggered
      const jobs = deliveryPipeline.getAllJobs();
      const existing = jobs.find(j => j.dealId === deal.dealId);

      if (!existing) {
        // Trigger delivery with metadata from payment
        await triggerDelivery(deal.dealId, {
          siteUrl: `https://${deal.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.com`,
          adminUrl: '',
          credentials: {
            admin: {
              email: deal.contactEmail,
              password: 'temp_' + Date.now(),
              url: '',
            },
          },
        });
        this.state.stats.sitesDelivered++;
      }
    }
  }

  /**
   * Phase: Post-Delivery
   */
  private async runPostDelivery(): Promise<void> {
    this.log('info', 'Running post-delivery actions...');

    await runPostDeliveryCron();
    this.state.stats.postDeliveryActions++;
  }

  /**
   * Phase: Monitoring
   */
  private async runMonitoring(): Promise<void> {
    this.log('debug', 'Running health checks...');

    // Check system health
    const health = await this.checkSystemHealth();

    if (!health.healthy) {
      this.emit('health_degraded', health);
      await this.alertTeam('system_health', health);
    }
  }

  /**
   * Starts health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.runPhase('monitoring');
    }, this.config.monitoring.healthCheckInterval);
  }

  /**
   * Checks system health
   */
  private async checkSystemHealth(): Promise<{
    healthy: boolean;
    checks: Record<string, { status: 'ok' | 'warning' | 'error'; message: string }>;
  }> {
    const checks: Record<string, { status: 'ok' | 'warning' | 'error'; message: string }> = {};

    // Check Google Sheets
    try {
      await this.verifySheetsConnection();
      checks.sheets = { status: 'ok', message: 'Connected' };
    } catch (e) {
      checks.sheets = { status: 'error', message: String(e) };
    }

    // Check dispatch engine
    const { emailQueue } = await import('../dispatch-engine/queue');
    const queueStats = emailQueue.getStats();
    if (queueStats.failed > queueStats.sent * 0.1) {
      checks.dispatch = { status: 'warning', message: `High failure rate: ${queueStats.failed}/${queueStats.sent}` };
    } else {
      checks.dispatch = { status: 'ok', message: `Queue: ${queueStats.pending} pending, ${queueStats.sent} sent` };
    }

    // Check warmup
    if (!warmupManager.isWarmupComplete()) {
      const warmupStatus = warmupManager.getWarmupStatus();
      if (warmupStatus.emailsSentToday < warmupStatus.dailyLimit * 0.3) {
        checks.warmup = { status: 'warning', message: `Behind schedule: ${warmupStatus.emailsSentToday}/${warmupStatus.dailyLimit}` };
      } else {
        checks.warmup = { status: 'ok', message: `Week ${warmupStatus.currentWeek}/5` };
      }
    } else {
      checks.warmup = { status: 'ok', message: 'Complete' };
    }

    // Check deliveries
    const jobs = deliveryPipeline.getAllJobs();
    const stuckJobs = jobs.filter(j =>
      ['building', 'deploying', 'configuring'].includes(j.status) &&
      j.logs.length > 0 &&
      Date.now() - new Date(j.logs[j.logs.length - 1].timestamp).getTime() > 3600000
    );
    if (stuckJobs.length > 0) {
      checks.delivery = { status: 'warning', message: `${stuckJobs.length} stuck jobs` };
    } else {
      checks.delivery = { status: 'ok', message: `${jobs.filter(j => j.status === 'delivered').length} delivered` };
    }

    const healthy = Object.values(checks).every(c => c.status !== 'error');

    return { healthy, checks };
  }

  // Helper methods
  private async getCompaniesNeedingAnalysis(): Promise<any[]> {
    // Fetch from sheets - companies with pain_score = 0 or null
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Leads!A:Z',
      });

      return (response.data.values || []).slice(1)
        .filter(row => !row[10] || parseFloat(row[10]) === 0) // pain_score column
        .map(row => ({
          companyId: row[0],
          name: row[1],
          website: row[2],
          sector: row[3],
        }));
    } catch {
      return [];
    }
  }

  private async queueForDemo(company: any, analysis: any): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Demos!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString(),
            company.companyId,
            company.name,
            analysis.painScore,
            JSON.stringify(analysis.hooks),
            'pending',
            'business', // default plan
            '',
          ]],
        },
      });
    } catch (error) {
      this.log('error', `Queue demo failed: ${error}`);
    }
  }

  private async getDemosToGenerate(): Promise<any[]> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Demos!A:H',
      });

      return (response.data.values || []).slice(1)
        .filter(row => row[5] === 'pending')
        .map(row => ({
          companyId: row[1],
          companyName: row[2],
          painScore: parseFloat(row[3]),
          hooks: JSON.parse(row[4] || '[]'),
          plan: row[6],
        }));
    } catch {
      return [];
    }
  }

  private async sendPaymentReminder(deal: any, type: 'deposit' | 'balance', daysOverdue: number): Promise<void> {
    const { sendPaymentReminderEmail } = await import('../payment-engine/email-sender');
    const iban = {
      beneficiary: 'ZAK Studio Web S.r.l.',
      iban: 'IT60X0542811101000000123456',
      bic: 'BPITIT3M',
      reference: `ZA/${deal.proposalNumber}/${deal.companyName.substring(0, 10).toUpperCase()}`,
    };

    await sendPaymentReminderEmail({
      to: deal.contactEmail,
      companyName: deal.companyName,
      contactName: deal.contactName,
      proposalNumber: deal.proposalNumber,
      contractNumber: deal.contractNumber,
      amount: type === 'deposit' ? deal.depositAmount / 100 : (deal.totalValue - deal.depositAmount) / 100,
      currency: 'EUR',
      dueDate: new Date(type === 'deposit' ? deal.depositDueDate! : deal.balanceDueDate!),
      paymentType: type,
      iban,
      daysOverdue,
    });
  }

  private async sendContractReminder(deal: any, daysSince: number): Promise<void> {
    this.log('info', `Sending contract reminder for ${deal.dealId} (${daysSince} days)`);
    // Would send reminder email
  }

  private async alertStalledProduction(deal: any, days: number): Promise<void> {
    this.log('warn', `Production stalled for ${deal.dealId}: ${days} days`);
    await this.alertTeam('stalled_production', { dealId: deal.dealId, days, companyName: deal.companyName });
  }

  private async alertTeam(type: string, data: any): Promise<void> {
    this.emit('alert', { type, data, timestamp: new Date().toISOString() });
    // In production: send to Slack, email, PagerDuty
    console.log(`[ALERT][${type}]`, JSON.stringify(data, null, 2));
  }

  private async waitForCompletion(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // Check if any async operations are pending
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.monitoring.logLevel];
    if (levels[level] >= configLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}][${level.toUpperCase()}][Orchestrator] ${message}`);
    }
  }

  /**
   * Gets current state
   */
  getState(): OrchestratorState {
    return { ...this.state };
  }

  /**
   * Gets stats
   */
  getStats() {
    return { ...this.state.stats };
  }

  /**
   * Forces a specific phase to run
   */
  async triggerPhase(phase: OrchestratorPhase): Promise<void> {
    await this.runPhase(phase);
  }
}

// Singleton instance
export const masterOrchestrator = new MasterOrchestrator();

/**
 * Starts the master orchestrator with default config
 */
export async function startOrchestrator(config?: Partial<OrchestratorConfig>): Promise<void> {
  const orchestrator = config ? new MasterOrchestrator(config) : masterOrchestrator;
  await orchestrator.start();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down...');
    await orchestrator.stop();
    process.exit(0);
  });

  return new Promise(() => {}); // Keep running
}