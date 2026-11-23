import { google } from 'googleapis';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export type DealStatus =
  | 'lead'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'negotiation'
  | 'contract_sent'
  | 'contract_signed'
  | 'awaiting_deposit'
  | 'deposit_received'
  | 'in_production'
  | 'awaiting_balance'
  | 'balance_received'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export type DealEvent =
  | 'proposal_created'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'contract_generated'
  | 'contract_sent'
  | 'contract_signed'
  | 'contract_declined'
  | 'deposit_received'
  | 'deposit_failed'
  | 'production_started'
  | 'milestone_completed'
  | 'balance_requested'
  | 'balance_received'
  | 'balance_failed'
  | 'site_deployed'
  | 'credentials_delivered'
  | 'client_confirmed'
  | 'cancelled_by_client'
  | 'cancelled_by_provider'
  | 'refund_requested'
  | 'refund_processed'
  | 'dispute_raised';

// Valid state transitions
const VALID_TRANSITIONS: Record<DealStatus, DealEvent[]> = {
  lead: ['proposal_created', 'proposal_sent'],
  proposal_sent: ['proposal_viewed', 'proposal_accepted', 'proposal_rejected', 'cancelled_by_client'],
  proposal_viewed: ['proposal_accepted', 'proposal_rejected', 'negotiation', 'cancelled_by_client'],
  negotiation: ['proposal_accepted', 'proposal_rejected', 'contract_generated', 'cancelled_by_client'],
  proposal_accepted: ['contract_generated', 'contract_sent', 'cancelled_by_client'],
  proposal_rejected: [], // Terminal unless new proposal
  contract_generated: ['contract_sent', 'cancelled_by_client'],
  contract_sent: ['contract_signed', 'contract_declined', 'cancelled_by_client'],
  contract_signed: ['deposit_received', 'deposit_failed', 'awaiting_deposit', 'cancelled_by_client'],
  contract_declined: ['negotiation', 'cancelled_by_client'],
  awaiting_deposit: ['deposit_received', 'deposit_failed', 'cancelled_by_client', 'cancelled_by_provider'],
  deposit_received: ['production_started', 'in_production', 'cancelled_by_client'],
  deposit_failed: ['awaiting_deposit', 'cancelled_by_client', 'cancelled_by_provider'],
  in_production: ['milestone_completed', 'balance_requested', 'awaiting_balance', 'cancelled_by_client', 'cancelled_by_provider'],
  awaiting_balance: ['balance_received', 'balance_failed', 'cancelled_by_client'],
  balance_received: ['site_deployed', 'delivered', 'cancelled_by_client'],
  balance_failed: ['awaiting_balance', 'cancelled_by_client', 'cancelled_by_provider'],
  site_deployed: ['credentials_delivered', 'delivered'],
  credentials_delivered: ['client_confirmed', 'delivered'],
  client_confirmed: ['completed'],
  delivered: ['completed', 'dispute_raised'],
  completed: ['dispute_raised'], // Can reopen for disputes
  cancelled: [], // Terminal
  refunded: [], // Terminal
  disputed: ['refund_processed', 'completed', 'cancelled_by_provider'],
};

interface Deal {
  dealId: string;
  companyId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  proposalNumber: string;
  contractNumber?: string;
  status: DealStatus;
  plan: 'business' | 'enterprise';
  totalValue: number; // in EUR cents
  paidAmount: number; // in EUR cents
  depositPercent: number;
  depositAmount: number; // in EUR cents
  depositDueDate?: string;
  balanceDueDate?: string;
  depositReceivedAt?: string;
  balanceReceivedAt?: string;
  contractSignedAt?: string;
  productionStartedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  siteUrl?: string;
  adminUrl?: string;
  ghostUrl?: string;
  credentialsSentAt?: string;
  lastEvent?: string;
  lastEventAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransitionResult {
  success: boolean;
  newStatus?: DealStatus;
  error?: string;
  requiresAction?: string[];
}

/**
 * State machine for deal lifecycle management
 */
export class DealStateMachine {
  private dealsCache: Map<string, Deal> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Gets current deal from sheets (with caching)
   */
  async getDeal(dealId: string): Promise<Deal | null> {
    // Check cache
    if (Date.now() < this.cacheExpiry && this.dealsCache.has(dealId)) {
      return this.dealsCache.get(dealId)!;
    }

    await this.refreshCache();
    return this.dealsCache.get(dealId) || null;
  }

  /**
   * Refreshes cache from Google Sheets
   */
  private async refreshCache(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Deals!A:Z',
      });

      const rows = response.data.values || [];
      this.dealsCache.clear();

      // Assuming header row at index 0
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Skip empty rows

        const deal: Deal = {
          dealId: row[0],
          companyId: row[1] || '',
          companyName: row[2] || '',
          contactName: row[3] || '',
          contactEmail: row[4] || '',
          contactPhone: row[5] || '',
          proposalNumber: row[6] || '',
          contractNumber: row[7],
          status: (row[8] as DealStatus) || 'lead',
          plan: (row[9] as 'business' | 'enterprise') || 'business',
          totalValue: Math.round(parseFloat(row[10] || '0') * 100),
          paidAmount: Math.round(parseFloat(row[11] || '0') * 100),
          depositPercent: parseFloat(row[12] || '50'),
          depositAmount: Math.round(parseFloat(row[13] || '0') * 100),
          depositDueDate: row[14],
          balanceDueDate: row[15],
          depositReceivedAt: row[16],
          balanceReceivedAt: row[17],
          contractSignedAt: row[18],
          productionStartedAt: row[19],
          deliveredAt: row[20],
          completedAt: row[21],
          cancelledAt: row[22],
          cancelReason: row[23],
          stripeSessionId: row[24],
          stripePaymentIntentId: row[25],
          siteUrl: row[26],
          adminUrl: row[27],
          ghostUrl: row[28],
          credentialsSentAt: row[29],
          lastEvent: row[30],
          lastEventAt: row[31],
          notes: row[32],
          createdAt: row[33] || new Date().toISOString(),
          updatedAt: row[34] || new Date().toISOString(),
        };

        this.dealsCache.set(deal.dealId, deal);
      }

      this.cacheExpiry = Date.now() + this.CACHE_TTL;
    } catch (error) {
      console.error('[deal-state] Cache refresh error:', error);
    }
  }

  /**
   * Transitions deal to new status based on event
   */
  async transition(dealId: string, event: DealEvent, metadata?: Record<string, any>): Promise<TransitionResult> {
    const deal = await this.getDeal(dealId);
    if (!deal) {
      return { success: false, error: `Deal ${dealId} not found` };
    }

    // Check if transition is valid
    const validEvents = VALID_TRANSITIONS[deal.status] || [];
    if (!validEvents.includes(event)) {
      return {
        success: false,
        error: `Invalid transition: ${deal.status} --${event}--> not allowed`,
        requiresAction: ['manual_review'],
      };
    }

    // Determine new status
    const newStatus = this.computeNewStatus(deal.status, event);
    if (!newStatus) {
      return { success: false, error: `No status mapping for ${deal.status} + ${event}` };
    }

    // Check preconditions
    const preconditionCheck = await this.checkPreconditions(deal, event, newStatus);
    if (!preconditionCheck.passed) {
      return {
        success: false,
        error: preconditionCheck.reason,
        requiresAction: preconditionCheck.requiresAction,
      };
    }

    // Execute transition
    const updatedDeal = { ...deal, status: newStatus, lastEvent: event, lastEventAt: new Date().toISOString() };

    // Apply event-specific updates
    this.applyEventUpdates(updatedDeal, event, metadata);

    // Persist to sheets
    const persistResult = await this.persistDeal(updatedDeal);
    if (!persistResult.success) {
      return { success: false, error: persistResult.error };
    }

    // Update cache
    this.dealsCache.set(dealId, updatedDeal);

    // Trigger side effects
    await this.triggerSideEffects(updatedDeal, event, metadata);

    return {
      success: true,
      newStatus,
      requiresAction: this.getRequiredActions(newStatus, event),
    };
  }

  /**
   * Computes new status from current status and event
   */
  private computeNewStatus(currentStatus: DealStatus, event: DealEvent): DealStatus | null {
    const transitions: Record<string, DealStatus> = {
      'lead:proposal_created': 'proposal_sent',
      'lead:proposal_sent': 'proposal_sent',
      'proposal_sent:proposal_viewed': 'proposal_viewed',
      'proposal_sent:proposal_accepted': 'proposal_accepted',
      'proposal_sent:proposal_rejected': 'proposal_rejected',
      'proposal_viewed:proposal_accepted': 'proposal_accepted',
      'proposal_viewed:proposal_rejected': 'proposal_rejected',
      'proposal_viewed:negotiation': 'negotiation',
      'negotiation:proposal_accepted': 'proposal_accepted',
      'negotiation:contract_generated': 'contract_generated',
      'proposal_accepted:contract_generated': 'contract_generated',
      'proposal_accepted:contract_sent': 'contract_sent',
      'contract_generated:contract_sent': 'contract_sent',
      'contract_sent:contract_signed': 'contract_signed',
      'contract_sent:contract_declined': 'contract_declined',
      'contract_signed:deposit_received': 'deposit_received',
      'contract_signed:awaiting_deposit': 'awaiting_deposit',
      'awaiting_deposit:deposit_received': 'deposit_received',
      'awaiting_deposit:deposit_failed': 'deposit_failed',
      'deposit_received:production_started': 'in_production',
      'deposit_received:in_production': 'in_production',
      'in_production:balance_requested': 'awaiting_balance',
      'in_production:awaiting_balance': 'awaiting_balance',
      'awaiting_balance:balance_received': 'balance_received',
      'awaiting_balance:balance_failed': 'balance_failed',
      'balance_received:site_deployed': 'site_deployed',
      'balance_received:delivered': 'delivered',
      'site_deployed:credentials_delivered': 'credentials_delivered',
      'credentials_delivered:client_confirmed': 'client_confirmed',
      'client_confirmed:completed': 'completed',
      'delivered:completed': 'completed',
      'proposal_sent:cancelled_by_client': 'cancelled',
      'proposal_viewed:cancelled_by_client': 'cancelled',
      'negotiation:cancelled_by_client': 'cancelled',
      'proposal_accepted:cancelled_by_client': 'cancelled',
      'contract_generated:cancelled_by_client': 'cancelled',
      'contract_sent:cancelled_by_client': 'cancelled',
      'contract_signed:cancelled_by_client': 'cancelled',
      'awaiting_deposit:cancelled_by_client': 'cancelled',
      'deposit_received:cancelled_by_client': 'cancelled',
      'in_production:cancelled_by_client': 'cancelled',
      'awaiting_balance:cancelled_by_client': 'cancelled',
      'balance_received:cancelled_by_client': 'cancelled',
      'delivered:cancelled_by_client': 'cancelled',
      'awaiting_deposit:cancelled_by_provider': 'cancelled',
      'deposit_failed:cancelled_by_provider': 'cancelled',
      'in_production:cancelled_by_provider': 'cancelled',
      'balance_failed:cancelled_by_provider': 'cancelled',
      'delivered:dispute_raised': 'disputed',
      'completed:dispute_raised': 'disputed',
      'disputed:refund_processed': 'refunded',
      'disputed:completed': 'completed',
    };

    const key = `${currentStatus}:${event}`;
    return transitions[key] || null;
  }

  /**
   * Checks preconditions for transition
   */
  private async checkPreconditions(deal: Deal, event: DealEvent, newStatus: DealStatus): Promise<{
    passed: boolean;
    reason?: string;
    requiresAction?: string[];
  }> {
    // Contract signing requires contract to exist
    if (event === 'contract_signed' && !deal.contractNumber) {
      return { passed: false, reason: 'Contract not generated yet', requiresAction: ['generate_contract'] };
    }

    // Deposit received requires contract signed
    if (event === 'deposit_received' && deal.status !== 'contract_signed' && deal.status !== 'awaiting_deposit') {
      return { passed: false, reason: 'Contract must be signed before deposit', requiresAction: ['sign_contract'] };
    }

    // Production start requires deposit
    if ((event === 'production_started' || event === 'in_production') && deal.paidAmount < deal.depositAmount) {
      return { passed: false, reason: 'Deposit not fully received', requiresAction: ['collect_deposit'] };
    }

    // Balance request requires production milestone
    if (event === 'balance_requested' && deal.status !== 'in_production') {
      return { passed: false, reason: 'Production not started', requiresAction: ['start_production'] };
    }

    // Site deploy requires balance
    if (event === 'site_deployed' && deal.paidAmount < deal.totalValue) {
      return { passed: false, reason: 'Full payment not received', requiresAction: ['collect_balance'] };
    }

    // Credentials delivery requires site deployed
    if (event === 'credentials_delivered' && deal.status !== 'site_deployed') {
      return { passed: false, reason: 'Site not deployed yet', requiresAction: ['deploy_site'] };
    }

    return { passed: true };
  }

  /**
   * Applies event-specific field updates
   */
  private applyEventUpdates(deal: Deal, event: DealEvent, metadata?: Record<string, any>): void {
    const now = new Date().toISOString();

    switch (event) {
      case 'proposal_created':
      case 'proposal_sent':
        deal.proposalNumber = metadata?.proposalNumber || deal.proposalNumber;
        break;
      case 'contract_generated':
        deal.contractNumber = metadata?.contractNumber || `CTR-${deal.proposalNumber}`;
        break;
      case 'contract_sent':
        break;
      case 'contract_signed':
        deal.contractSignedAt = now;
        deal.status = 'awaiting_deposit'; // Intermediate
        break;
      case 'deposit_received':
        deal.depositReceivedAt = now;
        deal.paidAmount = Math.max(deal.paidAmount, deal.depositAmount);
        deal.stripePaymentIntentId = metadata?.stripePaymentIntentId || deal.stripePaymentIntentId;
        break;
      case 'deposit_failed':
        deal.notes = `Deposit failed: ${metadata?.error || 'Unknown'}${deal.notes ? ' | ' + deal.notes : ''}`;
        break;
      case 'production_started':
        deal.productionStartedAt = now;
        break;
      case 'balance_requested':
        break;
      case 'balance_received':
        deal.balanceReceivedAt = now;
        deal.paidAmount = deal.totalValue;
        deal.stripePaymentIntentId = metadata?.stripePaymentIntentId || deal.stripePaymentIntentId;
        break;
      case 'balance_failed':
        deal.notes = `Balance failed: ${metadata?.error || 'Unknown'}${deal.notes ? ' | ' + deal.notes : ''}`;
        break;
      case 'site_deployed':
        deal.siteUrl = metadata?.siteUrl || deal.siteUrl;
        deal.adminUrl = metadata?.adminUrl || deal.adminUrl;
        deal.ghostUrl = metadata?.ghostUrl || deal.ghostUrl;
        break;
      case 'credentials_delivered':
        deal.credentialsSentAt = now;
        break;
      case 'client_confirmed':
        deal.deliveredAt = now;
        break;
      case 'completed':
        deal.completedAt = now;
        break;
      case 'cancelled_by_client':
      case 'cancelled_by_provider':
        deal.cancelledAt = now;
        deal.cancelReason = metadata?.reason || event;
        break;
      case 'dispute_raised':
        deal.notes = `Dispute: ${metadata?.reason || 'Client dispute'}${deal.notes ? ' | ' + deal.notes : ''}`;
        break;
    }

    deal.updatedAt = now;
  }

  /**
   * Persists deal to Google Sheets
   */
  private async persistDeal(deal: Deal): Promise<{ success: boolean; error?: string }> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // Find row index
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Deals!A:A',
      });

      const rows = response.data.values || [];
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === deal.dealId) {
          rowIndex = i + 1; // 1-indexed + header
          break;
        }
      }

      if (rowIndex === -1) {
        // Append new row
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEETS_ID,
          range: 'Deals!A:Z',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              deal.dealId,
              deal.companyId,
              deal.companyName,
              deal.contactName,
              deal.contactEmail,
              deal.contactPhone,
              deal.proposalNumber,
              deal.contractNumber || '',
              deal.status,
              deal.plan,
              (deal.totalValue / 100).toFixed(2),
              (deal.paidAmount / 100).toFixed(2),
              deal.depositPercent.toFixed(0),
              (deal.depositAmount / 100).toFixed(2),
              deal.depositDueDate || '',
              deal.balanceDueDate || '',
              deal.depositReceivedAt || '',
              deal.balanceReceivedAt || '',
              deal.contractSignedAt || '',
              deal.productionStartedAt || '',
              deal.deliveredAt || '',
              deal.completedAt || '',
              deal.cancelledAt || '',
              deal.cancelReason || '',
              deal.stripeSessionId || '',
              deal.stripePaymentIntentId || '',
              deal.siteUrl || '',
              deal.adminUrl || '',
              deal.ghostUrl || '',
              deal.credentialsSentAt || '',
              deal.lastEvent || '',
              deal.lastEventAt || '',
              deal.notes || '',
              deal.createdAt,
              deal.updatedAt,
            ]],
          },
        });
      } else {
        // Update existing row
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEETS_ID,
          range: `Deals!A${rowIndex}:AJ${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              deal.dealId,
              deal.companyId,
              deal.companyName,
              deal.contactName,
              deal.contactEmail,
              deal.contactPhone,
              deal.proposalNumber,
              deal.contractNumber || '',
              deal.status,
              deal.plan,
              (deal.totalValue / 100).toFixed(2),
              (deal.paidAmount / 100).toFixed(2),
              deal.depositPercent.toFixed(0),
              (deal.depositAmount / 100).toFixed(2),
              deal.depositDueDate || '',
              deal.balanceDueDate || '',
              deal.depositReceivedAt || '',
              deal.balanceReceivedAt || '',
              deal.contractSignedAt || '',
              deal.productionStartedAt || '',
              deal.deliveredAt || '',
              deal.completedAt || '',
              deal.cancelledAt || '',
              deal.cancelReason || '',
              deal.stripeSessionId || '',
              deal.stripePaymentIntentId || '',
              deal.siteUrl || '',
              deal.adminUrl || '',
              deal.ghostUrl || '',
              deal.credentialsSentAt || '',
              deal.lastEvent || '',
              deal.lastEventAt || '',
              deal.notes || '',
              deal.createdAt,
              deal.updatedAt,
            ]],
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[deal-state] Persist error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Triggers side effects based on transition
   */
  private async triggerSideEffects(deal: Deal, event: DealEvent, metadata?: Record<string, any>): Promise<void> {
    // Import dynamically to avoid circular deps
    const { sendContractForSignature } = await import('./email-sender');
    const { generateContractPDF, saveContractPDF } = await import('./generate-contract-pdf');
    const { generateProposalPDF, saveProposalPDF } = await import('./generate-proposal-pdf');

    try {
      switch (event) {
        case 'proposal_accepted':
          // Generate and send contract
          const contractPdf = await generateContractPDF(this.buildContractData(deal));
          const contractPath = await saveContractPDF(contractPdf, deal.contractNumber!);
          await sendContractForSignature(deal.dealId, deal.proposalNumber);
          break;

        case 'contract_generated':
          // Generate proposal PDF if not exists
          const proposalPdf = await generateProposalPDF(this.buildProposalData(deal));
          await saveProposalPDF(proposalPdf, deal.proposalNumber);
          break;

        case 'deposit_received':
          // Trigger production start
          await this.transition(deal.dealId, 'production_started');
          break;

        case 'balance_received':
          // Trigger site deployment
          await this.transition(deal.dealId, 'site_deployed', metadata);
          break;

        case 'site_deployed':
          // Trigger credentials delivery
          await this.transition(deal.dealId, 'credentials_delivered', metadata);
          break;

        case 'credentials_delivered':
          // Send delivery email
          const { sendSiteDeliveryEmail } = await import('./email-sender');
          await sendSiteDeliveryEmail({
            to: deal.contactEmail,
            companyName: deal.companyName,
            contactName: deal.contactName,
            dealId: deal.dealId,
            contractNumber: deal.contractNumber!,
            proposalNumber: deal.proposalNumber,
            siteUrl: deal.siteUrl!,
            adminUrl: deal.adminUrl!,
            credentials: metadata?.credentials || { email: deal.contactEmail, password: 'temp_' + Date.now() },
            ghostUrl: deal.ghostUrl,
            ghostCredentials: metadata?.ghostCredentials,
            portalUrl: `${process.env.APP_URL}/portal/${deal.dealId}`,
            supportEmail: 'support@zakstudio.com',
            documentationUrl: `${process.env.APP_URL}/docs`,
          });
          break;
      }
    } catch (error) {
      console.error('[deal-state] Side effect error:', error);
      // Don't fail the transition, just log
    }
  }

  /**
   * Builds contract data from deal
   */
  private buildContractData(deal: Deal): any {
    return {
      contractNumber: deal.contractNumber!,
      date: new Date().toLocaleDateString('it-IT'),
      proposalNumber: deal.proposalNumber,
      provider: {
        companyName: 'ZAK Studio Web S.r.l.',
        legalForm: 'S.r.l.',
        address: 'Via Example 123, 20100 Milano (MI)',
        vatNumber: '12345678901',
        taxCode: '12345678901',
        reaNumber: 'MI-1234567',
        shareCapital: '€ 10.000 i.v.',
        email: 'info@zakstudio.com',
        pec: 'zakstudio@pec.it',
        website: 'https://zakstudio.com',
        sdiCode: 'ABCDEFG',
        representedBy: {
          name: 'Marco Rossi',
          role: 'Amministratore Unico',
          taxCode: 'RSSMRC80A01F205X',
        },
      },
      client: {
        companyName: deal.companyName,
        legalForm: 'S.r.l.',
        address: 'Da definire',
        vatNumber: 'Da definire',
        taxCode: 'Da definire',
        email: deal.contactEmail,
        representedBy: {
          name: deal.contactName,
          role: 'Rappresentante Legale',
          taxCode: 'Da definire',
        },
      },
      service: {
        description: `Realizzazione sito web piano ${deal.plan === 'business' ? 'Business' : 'Enterprise'}`,
        plan: deal.plan,
        deliverables: [
          'Sito web responsive multi-lingua (IT/EN)',
          'CMS headless (Ghost) per gestione contenuti',
          'Catalogo prodotti/servizi con richiesta preventivo',
          'Form contatti con reCAPTCHA e notifiche email',
          'SEO tecnico e Schema.org completo',
          'Cookie banner GDPR compliant',
          'Analytics (GA4) + Search Console',
          'Backup automatici giornalieri',
          'SSL/TLS + Security headers',
        ],
        timeline: '60 giorni dalla firma',
        startDate: new Date().toLocaleDateString('it-IT'),
        autoRenewal: true,
        renewalNoticeDays: 30,
      },
      commercial: {
        setupFee: deal.totalValue / 100 * (deal.depositPercent / 100) * 2, // Approximation
        monthlyFee: deal.plan === 'business' ? 297 : 597,
        currency: 'EUR',
        vatRate: 22,
        billingCycle: 'monthly',
        paymentTerms: `${deal.depositPercent}% alla firma, ${100 - deal.depositPercent}% alla consegna`,
        latePaymentInterest: 8,
        depositPercent: deal.depositPercent,
        depositAmount: deal.depositAmount / 100,
        depositDueDate: deal.depositDueDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString('it-IT'),
        balanceDueDate: deal.balanceDueDate || new Date(Date.now() + 60 * 86400000).toLocaleDateString('it-IT'),
      },
      sla: {
        uptime: '99.9%',
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        supportChannels: ['Email', 'Portale Ticket', 'Telefono (Enterprise)'],
        businessHours: 'Lun-Ven 9:00-18:00 CET',
        excludedFromSla: ['Manutenzione programmata', 'Forza maggiore', 'Attacchi DDoS'],
      },
      gdpr: {
        dpoContact: 'privacy@zakstudio.com',
        dataProcessingAddendum: true,
        dataRetentionMonths: 12,
        subProcessors: ['Netlify/Vercel (hosting)', 'Ghost Pro (CMS)', 'SendGrid (email)', 'Google Analytics'],
      },
      terms: {
        terminationNoticeDays: 30,
        penaltyClause: true,
        intellectualProperty: 'client',
        confidentialityYears: 3,
        governingLaw: 'Legge Italiana',
        jurisdiction: 'Foro di Milano',
        language: 'Italiano',
      },
      signatures: {
        place: 'Milano',
        date: new Date().toLocaleDateString('it-IT'),
        providerSignature: 'Marco Rossi - Amministratore Unico',
        clientSignature: deal.contactName,
      },
    };
  }

  /**
   * Builds proposal data from deal
   */
  private buildProposalData(deal: Deal): any {
    return {
      proposalNumber: deal.proposalNumber,
      date: new Date().toLocaleDateString('it-IT'),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('it-IT'),
      sender: {
        companyName: 'ZAK Studio Web S.r.l.',
        address: 'Via Example 123, 20100 Milano (MI)',
        vatNumber: '12345678901',
        email: 'info@zakstudio.com',
        phone: '+39 02 1234 5678',
        website: 'https://zakstudio.com',
        pec: 'zakstudio@pec.it',
        sdiCode: 'ABCDEFG',
      },
      client: {
        companyName: deal.companyName,
        contactName: deal.contactName,
        role: 'Titolare / Responsabile Marketing',
        address: 'Da definire',
        vatNumber: 'Da definire',
        email: deal.contactEmail,
        phone: deal.contactPhone,
      },
      project: {
        title: `Sito Web ${deal.plan === 'business' ? 'Business' : 'Enterprise'} per ${deal.companyName}`,
        description: `Sito web professionale, multi-lingua, con CMS headless, catalogo prodotti e modulo preventivi.`,
        sector: 'Manifatturiero / B2B',
        painPoints: [
          'Sito attuale obsoleto o inesistente',
          'Difficoltà a generare lead qualificati online',
          'Assenza di catalogo prodotti digitale',
          'Gestione contenuti complessa o assente',
        ],
        objectives: [
          'Aumentare visibilità online e credibilità',
          'Generare richieste preventivo qualificate',
          'Presentare prodotti/servizi in modo professionale',
          'Autonomo aggiornamento contenuti via CMS',
        ],
        deliverables: [
          { name: 'Design UX/UI personalizzato', description: 'Mockup Figma + 2 revisioni', included: true },
          { name: 'Sviluppo Next.js 14 + TypeScript', description: 'Responsive, performante, accessibile', included: true },
          { name: 'CMS Ghost headless', description: 'Gestione pagine, blog, catalogo', included: true },
          { name: 'Catalogo prodotti/servizi', description: 'Schede dettagliate + filtri settore', included: true },
          { name: 'Modulo Richiesta Preventivo (RFQ)', description: 'Validazione, reCAPTCHA, email + CRM', included: true },
          { name: 'SEO tecnico + Schema.org', description: 'Meta, sitemap, structured data', included: true },
          { name: 'Cookie banner GDPR', description: 'Consent mode v2, geolocalizzazione', included: true },
          { name: 'Analytics GA4 + Search Console', description: 'Eventi tracciati, dashboard', included: true },
          { name: 'Formazione + Documentazione', description: 'Video guide + sessione live 1h', included: true },
          { name: 'Manutenzione 12 mesi', description: 'Aggiornamenti, backup, security', included: deal.plan === 'enterprise' },
        ],
        timeline: [
          { phase: 1, name: 'Kick-off & Analisi', duration: 'Settimana 1', description: 'Allineamento requisiti, analisi competitor, definizione sitemap', deliverables: ['Brief approvato', 'Sitemap', 'Wireframe homepage'] },
          { phase: 2, name: 'Design System & UI', duration: 'Settimane 2-3', description: 'Design system, componenti, pagine chiave (Home, Catalogo, Contatti)', deliverables: ['Figma prototype', 'Design system', 'Mockup 5 pagine'] },
          { phase: 3, name: 'Sviluppo Frontend', duration: 'Settimane 4-6', description: 'Next.js 14, TypeScript, Tailwind, i18n, componenti responsive', deliverables: ['Sito staging', 'Component library', 'Test cross-browser'] },
          { phase: 4, name: 'CMS & Backend', duration: 'Settimane 5-7', description: 'Ghost CMS setup, content modeling, API integration, RFQ form', deliverables: ['CMS configurato', 'Content model', 'Form funzionante'] },
          { phase: 5, name: 'Contenuti & SEO', duration: 'Settimane 6-8', description: 'Inserimento contenuti, meta tag, Schema.org, sitemap, redirect', deliverables: ['Contenuti live', 'SEO audit', 'GA4 configurato'] },
          { phase: 6, name: 'Test & Consegna', duration: 'Settimana 8', description: 'QA completo, performance, accessibilità, formazione, go-live', deliverables: ['Report QA', 'Credenziali', 'Formazione', 'Sito live'] },
        ],
        assumptions: [
          'Fornitura testi/immagini da parte del cliente entro settimana 3',
          'Accesso DNS/hosting fornito per go-live',
          'Feedback su design entro 3 giorni lavorativi',
        ],
        exclusions: [
          'Copywriting testi (forniti dal cliente)',
          'Fotografia prodotti/servizi',
          'Integrazioni ERP/CRM complesse (su preventivo)',
          'SEO continuativo post-lancio (opzionale)',
        ],
      },
      commercial: {
        plan: deal.plan,
        setupFee: deal.totalValue / 100,
        monthlyFee: deal.plan === 'business' ? 297 : 597,
        currency: 'EUR',
        paymentTerms: `${deal.depositPercent}% alla firma, ${100 - deal.depositPercent}% alla consegna`,
        depositPercent: deal.depositPercent,
        vatRate: 22,
        billingCycle: 'monthly',
        contractDurationMonths: 12,
        autoRenewal: true,
      },
      roi: {
        estimatedMonthlyVisitors: 2000,
        estimatedConversionRate: 3.5,
        averageOrderValue: 15000,
        estimatedMonthlyRevenue: 10500,
        estimatedAnnualRevenue: 126000,
        paybackPeriodMonths: Math.ceil((deal.totalValue / 100) / 10500),
      },
      nextSteps: [
        'Firma digitale del Contratto di Fornitura (link via email)',
        'Pagamento acconto via bonifico (IBAN in proposta)',
        'Kick-off call (entro 48h da firma+pagamento)',
        'Condivisione materiali (testi, immagini, brand guidelines)',
        'Approvazione design (Figma) entro 3 giorni',
        'Go-live sito (target: 8 settimane da kick-off)',
      ],
      iban: {
        beneficiary: 'ZAK Studio Web S.r.l.',
        iban: 'IT60X0542811101000000123456',
        bic: 'BPITIT3M',
        bankName: 'BPER Banca',
        reference: `ZA/${deal.proposalNumber}/${deal.companyName.substring(0, 10).toUpperCase()}`,
      },
    };
  }

  /**
   * Gets required actions for a status
   */
  private getRequiredActions(status: DealStatus, event: DealEvent): string[] {
    const actions: Record<DealStatus, string[]> = {
      lead: ['create_proposal'],
      proposal_sent: ['track_views', 'follow_up'],
      proposal_viewed: ['follow_up', 'send_reminder'],
      negotiation: ['prepare_revised_proposal'],
      proposal_accepted: ['generate_contract', 'send_contract'],
      proposal_rejected: ['analyze_feedback', 'decide_next_step'],
      contract_generated: ['send_contract'],
      contract_sent: ['track_signature', 'send_reminder'],
      contract_signed: ['send_deposit_instructions', 'monitor_payment'],
      contract_declined: ['renegotiate'],
      awaiting_deposit: ['send_payment_reminder', 'check_bank'],
      deposit_received: ['start_production', 'assign_pm'],
      deposit_failed: ['retry_payment', 'contact_client'],
      in_production: ['track_milestones', 'schedule_checkins'],
      awaiting_balance: ['send_balance_invoice', 'monitor_payment'],
      balance_received: ['deploy_site', 'prepare_credentials'],
      balance_failed: ['retry_payment', 'contact_client'],
      site_deployed: ['generate_credentials', 'send_delivery_email'],
      credentials_delivered: ['schedule_training', 'request_confirmation'],
      client_confirmed: ['close_project', 'request_testimonial'],
      delivered: ['monitor_sla', 'check_satisfaction'],
      completed: ['archive', 'upsell_maintenance'],
      cancelled: ['archive', 'analyze_churn'],
      refunded: ['process_refund', 'close_accounting'],
      disputed: ['mediate', 'legal_review'],
    };

    return actions[status] || [];
  }

  /**
   * Gets all deals with optional status filter
   */
  async getAllDeals(statusFilter?: DealStatus): Promise<Deal[]> {
    await this.refreshCache();
    let deals = Array.from(this.dealsCache.values());
    if (statusFilter) {
      deals = deals.filter(d => d.status === statusFilter);
    }
    return deals.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Gets deals requiring action (overdue payments, stale statuses)
   */
  async getDealsRequiringAction(): Promise<Deal[]> {
    const deals = await this.getAllDeals();
    const now = new Date();
    const actionable: Deal[] = [];

    for (const deal of deals) {
      // Overdue deposit
      if (deal.status === 'awaiting_deposit' && deal.depositDueDate) {
        const due = new Date(deal.depositDueDate);
        if (due < now) actionable.push(deal);
      }

      // Overdue balance
      if (deal.status === 'awaiting_balance' && deal.balanceDueDate) {
        const due = new Date(deal.balanceDueDate);
        if (due < now) actionable.push(deal);
      }

      // Stale in production (> 60 days)
      if (deal.status === 'in_production' && deal.productionStartedAt) {
        const started = new Date(deal.productionStartedAt);
        if (now.getTime() - started.getTime() > 60 * 86400000) actionable.push(deal);
      }

      // Stale awaiting signature (> 14 days)
      if (deal.status === 'contract_sent' && deal.lastEventAt) {
        const sent = new Date(deal.lastEventAt);
        if (now.getTime() - sent.getTime() > 14 * 86400000) actionable.push(deal);
      }
    }

    return actionable;
  }
}

// Singleton instance
export const dealStateMachine = new DealStateMachine();

/**
 * Creates a new deal from proposal acceptance
 */
export async function createDealFromProposal(data: {
  companyId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  proposalNumber: string;
  plan: 'business' | 'enterprise';
  totalValue: number; // EUR
  depositPercent: number;
}): Promise<Deal> {
  const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const contractNumber = `CTR-${data.proposalNumber}`;
  const depositAmount = Math.round(data.totalValue * (data.depositPercent / 100) * 100);
  const totalValueCents = Math.round(data.totalValue * 100);

  const deal: Deal = {
    dealId,
    companyId: data.companyId,
    companyName: data.companyName,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    proposalNumber: data.proposalNumber,
    contractNumber,
    status: 'proposal_accepted',
    plan: data.plan,
    totalValue: totalValueCents,
    paidAmount: 0,
    depositPercent: data.depositPercent,
    depositAmount,
    depositDueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    balanceDueDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dealStateMachine.transition(dealId, 'proposal_accepted');
  return deal;
}