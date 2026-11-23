import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

interface PostDeliveryAction {
  dealId: string;
  actionType: 'training' | 'support_ticket' | 'upsell' | 'renewal' | 'testimonial' | 'referral' | 'health_check';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

interface ClientHealthScore {
  dealId: string;
  score: number; // 0-100
  factors: {
    siteUptime: number;
    supportTickets: number;
    featureUsage: number;
    paymentHistory: number;
    engagement: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  calculatedAt: string;
}

interface UpsellOpportunity {
  dealId: string;
  type: 'maintenance' | 'seo' | 'content' | 'analytics' | 'enterprise_upgrade' | 'additional_site' | 'integration';
  description: string;
  estimatedValue: number;
  probability: number;
  triggeredBy: string;
  detectedAt: string;
}

/**
 * Post-delivery orchestration for client success and growth
 */
export class PostDeliveryOrchestrator {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  /**
   * Initializes post-delivery workflow for a completed deal
   */
  async initializePostDelivery(dealId: string): Promise<void> {
    const deal = await this.getDeal(dealId);
    if (!deal) throw new Error(`Deal ${dealId} not found`);

    // Schedule standard post-delivery actions
    const actions: Omit<PostDeliveryAction, 'dealId' | 'status'>[] = [
      {
        actionType: 'training',
        scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(), // 3 days
        assignedTo: 'customer_success',
        notes: 'Sessione formazione CMS (1h) - prenotare via Calendly',
        metadata: { duration: 60, format: 'video_call' },
      },
      {
        actionType: 'health_check',
        scheduledAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days
        assignedTo: 'customer_success',
        notes: 'Primo health check post-lancio',
        metadata: { depth: 'standard' },
      },
      {
        actionType: 'health_check',
        scheduledAt: new Date(Date.now() + 90 * 86400000).toISOString(), // 90 days
        assignedTo: 'customer_success',
        notes: 'Health check trimestrale',
        metadata: { depth: 'deep' },
      },
      {
        actionType: 'testimonial',
        scheduledAt: new Date(Date.now() + 60 * 86400000).toISOString(), // 60 days
        assignedTo: 'marketing',
        notes: 'Richiedere testimonial/case study',
        metadata: { incentive: '1 mese manutenzione gratis' },
      },
      {
        actionType: 'referral',
        scheduledAt: new Date(Date.now() + 120 * 86400000).toISOString(), // 120 days
        assignedTo: 'sales',
        notes: 'Programma referral - sconto 10% per referral qualificato',
        metadata: { reward: '10% discount or €500 credit' },
      },
      {
        actionType: 'renewal',
        scheduledAt: new Date(Date.now() + 300 * 86400000).toISOString(), // 300 days (10 mesi)
        assignedTo: 'customer_success',
        notes: 'Avviare processo rinnovo (preavviso 60 giorni)',
        metadata: { noticeDays: 60 },
      },
    ];

    for (const action of actions) {
      await this.scheduleAction({ ...action, dealId, status: 'scheduled' });
    }

    // Create initial health score
    await this.calculateHealthScore(dealId);

    // Check for immediate upsell opportunities
    await this.detectUpsellOpportunities(dealId);
  }

  /**
   * Schedules a post-delivery action
   */
  async scheduleAction(action: PostDeliveryAction): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'PostDeliveryActions!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            action.dealId,
            action.actionType,
            action.status,
            action.scheduledAt,
            action.completedAt || '',
            action.assignedTo || '',
            action.notes || '',
            JSON.stringify(action.metadata || {}),
            new Date().toISOString(),
            new Date().toISOString(),
          ]],
        },
      });
    } catch (error) {
      console.error('[post-delivery] Schedule action error:', error);
    }
  }

  /**
   * Gets pending actions for a deal
   */
  async getPendingActions(dealId: string): Promise<PostDeliveryAction[]> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'PostDeliveryActions!A:J',
      });

      const rows = response.data.values || [];
      return rows
        .filter(row => row[0] === dealId && row[2] === 'scheduled')
        .map(row => ({
          dealId: row[0],
          actionType: row[1] as any,
          status: row[2] as any,
          scheduledAt: row[3],
          completedAt: row[4],
          assignedTo: row[5],
          notes: row[6],
          metadata: JSON.parse(row[7] || '{}'),
        }));
    } catch (error) {
      console.error('[post-delivery] Get actions error:', error);
      return [];
    }
  }

  /**
   * Marks action as completed
   */
  async completeAction(dealId: string, actionType: string, notes?: string): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'PostDeliveryActions!A:J',
      });

      const rows = response.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === dealId && rows[i][1] === actionType && rows[i][2] === 'scheduled') {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range: `PostDeliveryActions!C${i + 1}:J${i + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[
                'completed',
                new Date().toISOString(),
                rows[i][5],
                notes || rows[i][6],
                rows[i][7],
                new Date().toISOString(),
                new Date().toISOString(),
              ]],
            },
          });
          break;
        }
      }
    } catch (error) {
      console.error('[post-delivery] Complete action error:', error);
    }
  }

  /**
   * Calculates client health score
   */
  async calculateHealthScore(dealId: string): Promise<ClientHealthScore> {
    const deal = await this.getDeal(dealId);
    if (!deal) throw new Error(`Deal ${dealId} not found`);

    // Fetch real metrics (simplified - in production integrate with monitoring)
    const metrics = await this.fetchClientMetrics(dealId);

    // Calculate factors (0-100 each)
    const factors = {
      siteUptime: metrics.uptime || 99.9,
      supportTickets: Math.max(0, 100 - (metrics.ticketsLast30Days || 0) * 10),
      featureUsage: metrics.featureAdoption || 50,
      paymentHistory: deal.paidAmount >= deal.totalValue ? 100 : 50,
      engagement: metrics.loginFrequency || 30,
    };

    // Weighted score
    const weights = { siteUptime: 0.25, supportTickets: 0.2, featureUsage: 0.2, paymentHistory: 0.15, engagement: 0.2 };
    const score = Math.round(
      factors.siteUptime * weights.siteUptime +
      factors.supportTickets * weights.supportTickets +
      factors.featureUsage * weights.featureUsage +
      factors.paymentHistory * weights.paymentHistory +
      factors.engagement * weights.engagement
    );

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (score < 50) riskLevel = 'high';
    else if (score < 75) riskLevel = 'medium';

    const recommendations = this.generateRecommendations(factors, score);

    const healthScore: ClientHealthScore = {
      dealId,
      score,
      factors,
      riskLevel,
      recommendations,
      calculatedAt: new Date().toISOString(),
    };

    // Store health score
    await this.storeHealthScore(healthScore);

    // Trigger alerts for at-risk clients
    if (riskLevel === 'high') {
      await this.alertTeam('high_risk_client', { dealId, score, factors });
    }

    return healthScore;
  }

  private generateRecommendations(factors: ClientHealthScore['factors'], score: number): string[] {
    const recs: string[] = [];

    if (factors.siteUptime < 99.5) recs.push('Investigare problemi uptime - contattare hosting');
    if (factors.supportTickets > 5) recs.push('Alto volume ticket - programmare call di allineamento');
    if (factors.featureUsage < 30) recs.push('Bassa adozione feature - offrire formazione aggiuntiva');
    if (factors.paymentHistory < 100) recs.push('Pagamenti in ritardo - contattare amministrazione');
    if (factors.engagement < 20) recs.push('Basso engagement - inviare tips & best practices');
    if (score >= 80) recs.push('Cliente sano - opportunità upsell/referral');

    return recs;
  }

  private async storeHealthScore(score: ClientHealthScore): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'ClientHealth!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            score.dealId,
            score.score,
            JSON.stringify(score.factors),
            score.riskLevel,
            JSON.stringify(score.recommendations),
            score.calculatedAt,
            new Date().toISOString(),
            new Date().toISOString(),
          ]],
        },
      });
    } catch (error) {
      console.error('[post-delivery] Store health score error:', error);
    }
  }

  /**
   * Detects upsell opportunities
   */
  async detectUpsellOpportunities(dealId: string): Promise<UpsellOpportunity[]> {
    const deal = await this.getDeal(dealId);
    if (!deal) return [];

    const opportunities: UpsellOpportunity[] = [];
    const now = new Date().toISOString();

    // Maintenance upsell (if not Enterprise)
    if (deal.plan === 'business') {
      opportunities.push({
        dealId,
        type: 'maintenance',
        description: 'Piano manutenzione proattiva (aggiornamenti, backup, monitoring, SLA prioritario)',
        estimatedValue: 1200, // €/year
        probability: 0.7,
        triggeredBy: 'plan_limitation',
        detectedAt: now,
      });
    }

    // SEO upsell
    opportunities.push({
      dealId,
      type: 'seo',
      description: 'SEO continuativo: keyword research, content optimization, link building, report mensili',
      estimatedValue: 3600, // €/year
      probability: 0.5,
      triggeredBy: 'health_check',
      detectedAt: now,
    });

    // Content marketing
    opportunities.push({
      dealId,
      type: 'content',
      description: 'Produzione contenuti blog/articoli tecnici (4/mese) per lead generation organica',
      estimatedValue: 4800, // €/year
      probability: 0.4,
      triggeredBy: 'catalog_usage',
      detectedAt: now,
    });

    // Enterprise upgrade
    if (deal.plan === 'business') {
      opportunities.push({
        dealId,
        type: 'enterprise_upgrade',
        description: 'Upgrade piano Enterprise: multi-lingua avanzato, SSO, audit log, supporto telefonico, SLA 99.99%',
        estimatedValue: 3600, // €/year additional
        probability: 0.3,
        triggeredBy: 'growth_signals',
        detectedAt: now,
      });
    }

    // Analytics dashboard
    opportunities.push({
      dealId,
      type: 'analytics',
      description: 'Dashboard analytics avanzata: funnel RFQ, heatmap, A/B testing, report executive',
      estimatedValue: 1800, // €/year
      probability: 0.6,
      triggeredBy: 'rfq_volume',
      detectedAt: now,
    });

    // Store opportunities
    for (const opp of opportunities) {
      await this.storeUpsellOpportunity(opp);
    }

    // Notify sales for high-probability opportunities
    const highProb = opportunities.filter(o => o.probability > 0.6);
    if (highProb.length > 0) {
      await this.alertTeam('upsell_opportunity', { dealId, opportunities: highProb });
    }

    return opportunities;
  }

  private async storeUpsellOpportunity(opp: UpsellOpportunity): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'UpsellOpportunities!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            opp.dealId,
            opp.type,
            opp.description,
            opp.estimatedValue,
            opp.probability,
            opp.triggeredBy,
            opp.detectedAt,
            'identified',
            new Date().toISOString(),
          ]],
        },
      });
    } catch (error) {
      console.error('[post-delivery] Store upsell error:', error);
    }
  }

  /**
   * Sends training session invitation
   */
  async sendTrainingInvitation(dealId: string): Promise<void> {
    const deal = await this.getDeal(dealId);
    if (!deal) return;

    const calendlyUrl = process.env.CALENDLY_TRAINING_URL || process.env.CALENDLY_URL;

    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sessione Formativa - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">🎓 La tua sessione formativa</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #ddd6fe;">Inclusa nel tuo piano ${deal.plan === 'business' ? 'Business' : 'Enterprise'}</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">Gentile ${deal.contactName},</p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Il tuo sito è online da qualche settimana e vogliamo assicurarci che tu e il tuo team
                siate completamente autonomi nella gestione. È il momento della <strong>sessione formativa inclusa</strong> nel tuo piano!
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #334155;">Cosa imparerai:</h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 2;">
                      <li>Gestione pagine e contenuti via Ghost CMS</li>
                      <li>Aggiunta/modifica prodotti nel catalogo</li>
                      <li>Creazione articoli blog e case study</li>
                      <li>Gestione richieste preventivo (RFQ)</li>
                      <li>Analisi base analytics (GA4)</li>
                      <li>Best practice SEO per nuovi contenuti</li>
                      <li>Q&A su tue esigenze specifiche</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${calendlyUrl}" style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      📅 Prenota la tua sessione (1h)
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                La sessione si svolge via Google Meet/Zoom. Riceverai il link automaticamente alla prenotazione.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Hai domande urgenti? Rispondi a questa email o apri un ticket nel
                <a href="${process.env.APP_URL}/portal/${dealId}/tickets" style="color: #7c3aed;">Portale Cliente</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'success@zakstudio.com'}>`,
        to: deal.contactEmail,
        subject: '🎓 La tua sessione formativa inclusa - Prenota ora',
        html,
      });

      await this.completeAction(dealId, 'training', 'Invito formazione inviato');
    } catch (error) {
      console.error('[post-delivery] Training invitation error:', error);
    }
  }

  /**
   * Sends health check survey
   */
  async sendHealthCheckSurvey(dealId: string, depth: 'standard' | 'deep' = 'standard'): Promise<void> {
    const deal = await this.getDeal(dealId);
    if (!deal) return;

    const surveyUrl = `${process.env.APP_URL}/survey/health-check/${dealId}?depth=${depth}`;

    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Check - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">💚 Check-up del tuo progetto</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #a7f3d0;">${depth === 'deep' ? 'Analisi approfondita' : 'Controllo standard'} - 3 minuti</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">Gentile ${deal.contactName},</p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Sono passate alcune settimane dal lancio del tuo sito. Il tuo feedback è fondamentale
                per assicurarci che tutto funzioni al meglio e per identificare eventuali miglioramenti.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px; font-size: 14px; color: #166534;">Il sondaggio richiede <strong>3 minuti</strong></p>
                    <a href="${surveyUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Inizia Health Check
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                Gli argomenti: uptime/performance, gestione contenuti, lead generation, supporto, suggerimenti.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'success@zakstudio.com'}>`,
        to: deal.contactEmail,
        subject: `💚 Health Check ${depth === 'deep' ? 'Approfondito' : 'Standard'} - Il tuo feedback (3 min)`,
        html,
      });

      await this.completeAction(dealId, 'health_check', `Health check ${depth} survey inviato`);
    } catch (error) {
      console.error('[post-delivery] Health check survey error:', error);
    }
  }

  /**
   * Requests testimonial
   */
  async requestTestimonial(dealId: string): Promise<void> {
    const deal = await this.getDeal(dealId);
    if (!deal) return;

    const testimonialUrl = `${process.env.APP_URL}/testimonial/${dealId}`;

    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testimonial - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <span style="font-size: 48px;">⭐</span>
              <h1 style="margin: 16px 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">La tua opinione conta</h1>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">Gentile ${deal.contactName},</p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Speriamo che il nuovo sito stia portando ottimi risultati!
                Sarebbe fantastico se potessi condividere la tua esperienza con una breve testimonianza.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fffbeb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #92400e;">🎁 Come ringraziamento:</h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #92400e; line-height: 2;">
                      <li><strong>1 mese di manutenzione GRATIS</strong> (valore €${deal.plan === 'business' ? '297' : '597'})</li>
                      <li>Visibilità sul nostro sito come case study</li>
                      <li>Backlink da dominio autorevole (DR 50+)</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${testimonialUrl}" style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Lascia una testimonianza (2 min)
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                Basta qualche frase: qual era la sfida, come hai risolto, che risultati hai ottenuto.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'marketing@zakstudio.com'}>`,
        to: deal.contactEmail,
        subject: '⭐ La tua testimonianza = 1 mese manutenzione gratis',
        html,
      });

      await this.completeAction(dealId, 'testimonial', 'Richiesta testimonial inviata');
    } catch (error) {
      console.error('[post-delivery] Testimonial request error:', error);
    }
  }

  /**
   * Sends referral program invitation
   */
  async sendReferralInvitation(dealId: string): Promise<void> {
    const deal = await this.getDeal(dealId);
    if (!deal) return;

    const referralUrl = `${process.env.APP_URL}/referral/${dealId}`;

    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Programma Referral - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">🤝 Programma Referral</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #fce7f3;">Condividi il successo, guadagna ricompense</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">Gentile ${deal.contactName},</p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Conosci altre aziende che potrebbero beneficiare di un sito web professionale come il tuo?
                Il nostro <strong>Programma Referral</strong> premia chi ci presenta nuovi clienti.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fdf2f8; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #be185d;">🎁 Ricompense:</h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #be185d; line-height: 2;">
                      <li><strong>Per te:</strong> €500 credito o sconto 10% sul rinnovo per ogni referral qualificato</li>
                      <li><strong>Per il referral:</strong> 10% sconto sul primo anno</li>
                      <li>Nessun limite di referral</li>
                      <li>Pagamento entro 30 giorni dalla firma del referral</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${referralUrl}" style="display: inline-block; background: #ec4899; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Scopri il programma e invita
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                Basta inserire l'email del contatto: ci pensiamo noi a contattarli senza pressioni.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'partnerships@zakstudio.com'}>`,
        to: deal.contactEmail,
        subject: '🤝 Programma Referral: €500 per ogni presentazione qualificata',
        html,
      });

      await this.completeAction(dealId, 'referral', 'Invito referral inviato');
    } catch (error) {
      console.error('[post-delivery] Referral invitation error:', error);
    }
  }

  /**
   * Initiates renewal process
   */
  async initiateRenewal(dealId: string): Promise<void> {
    const deal = await this.getDeal(dealId);
    if (!deal) return;

    // Create renewal proposal
    const renewalValue = deal.totalValue / 100; // Annual value

    const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rinnovo Contratto - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">📋 Rinnovo Contratto</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">Scadenza tra 60 giorni</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155;">Gentile ${deal.contactName},</p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Il tuo contratto annuale (${deal.contractNumber}) sta per scadere.
                Vogliamo assicurarci continuità del servizio senza interruzioni.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Piano attuale</span>
                    <span style="float: right; font-weight: 600; color: #334155;">${deal.plan === 'business' ? 'Business' : 'Enterprise'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Canone annuo</span>
                    <span style="float: right; font-weight: 600; color: #334155;">€ ${renewalValue.toLocaleString('it-IT')} + IVA</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #64748b;">Scadenza</span>
                    <span style="float: right; font-weight: 600; color: #dc2626;">60 giorni</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #334155; line-height: 1.6;">
                <strong>Opzioni:</strong>
              </p>
              <ul style="font-size: 14px; color: #334155; line-height: 2; padding-left: 20px;">
                <li>Rinnovo automatico alle stesse condizioni (non serve fare nulla)</li>
                <li>Upgrade a Enterprise per funzionalità avanzate</li>
                <li>Downgrade o modifica piano (contattaci per discutere)</li>
              </ul>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${process.env.APP_URL}/portal/${dealId}/renewal" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Gestisci Rinnovo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                Il tuo Customer Success Manager ti contatterà a breve per discutere le opzioni.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'success@zakstudio.com'}>`,
        to: deal.contactEmail,
        subject: '📋 Rinnovo contratto tra 60 giorni - Opzioni disponibili',
        html,
      });

      await this.completeAction(dealId, 'renewal', 'Comunicazione rinnovo inviata');
    } catch (error) {
      console.error('[post-delivery] Renewal initiation error:', error);
    }
  }

  /**
   * Fetches deal from sheets
   */
  private async getDeal(dealId: string): Promise<any> {
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
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === dealId) {
          return {
            dealId: rows[i][0],
            companyId: rows[i][1],
            companyName: rows[i][2],
            contactName: rows[i][3],
            contactEmail: rows[i][4],
            contactPhone: rows[i][5],
            proposalNumber: rows[i][6],
            contractNumber: rows[i][7],
            status: rows[i][8],
            plan: rows[i][9],
            totalValue: parseFloat(rows[i][10] || '0') * 100,
            paidAmount: parseFloat(rows[i][11] || '0') * 100,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('[post-delivery] Get deal error:', error);
      return null;
    }
  }

  /**
   * Fetches client metrics (integrate with real monitoring)
   */
  private async fetchClientMetrics(dealId: string): Promise<{
    uptime: number;
    ticketsLast30Days: number;
    featureAdoption: number;
    loginFrequency: number;
  }> {
    // In production: integrate with uptime monitor, helpdesk, analytics
    return {
      uptime: 99.95,
      ticketsLast30Days: 2,
      featureAdoption: 45,
      loginFrequency: 8,
    };
  }

  /**
   * Alerts internal team
   */
  private async alertTeam(type: string, data: any): Promise<void> {
    console.log(`[post-delivery] ALERT [${type}]:`, JSON.stringify(data, null, 2));
    // In production: send to Slack, email, PagerDuty
  }
}

export const postDeliveryOrchestrator = new PostDeliveryOrchestrator();

/**
 * Daily cron job to process scheduled actions
 */
export async function runPostDeliveryCron(): Promise<void> {
  const now = new Date();

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'PostDeliveryActions!A:J',
    });

    const rows = response.data.values || [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const scheduledAt = new Date(row[3]);
      const status = row[2];

      if (status === 'scheduled' && scheduledAt <= now) {
        const dealId = row[0];
        const actionType = row[1];

        try {
          switch (actionType) {
            case 'training':
              await postDeliveryOrchestrator.sendTrainingInvitation(dealId);
              break;
            case 'health_check':
              const depth = JSON.parse(row[7] || '{}').depth || 'standard';
              await postDeliveryOrchestrator.sendHealthCheckSurvey(dealId, depth);
              break;
            case 'testimonial':
              await postDeliveryOrchestrator.requestTestimonial(dealId);
              break;
            case 'referral':
              await postDeliveryOrchestrator.sendReferralInvitation(dealId);
              break;
            case 'renewal':
              await postDeliveryOrchestrator.initiateRenewal(dealId);
              break;
            case 'upsell':
              // Handled by sales team
              break;
          }
        } catch (error) {
          console.error(`[post-delivery-cron] Failed ${actionType} for ${dealId}:`, error);
        }
      }
    }

    // Recalculate health scores for all active deals
    const dealsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Deals!A:Z',
    });

    const dealRows = dealsResponse.data.values || [];
    for (let i = 1; i < dealRows.length; i++) {
      const status = dealRows[i][8];
      if (['delivered', 'completed'].includes(status)) {
        await postDeliveryOrchestrator.calculateHealthScore(dealRows[i][0]);
      }
    }

  } catch (error) {
    console.error('[post-delivery-cron] Error:', error);
  }
}