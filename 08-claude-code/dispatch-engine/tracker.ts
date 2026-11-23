import { google } from 'googleapis';
import { validateUnsubscribeToken } from './sender';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export interface TrackingEvent {
  trackingId: string;
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' | 'replied';
  timestamp: Date;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  url?: string;
}

export interface LeadTrackingSummary {
  leadId: string;
  email: string;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  totalUnsubscribed: number;
  totalReplied: number;
  lastEventAt?: Date;
  openRate: number;
  clickRate: number;
  replyRate: number;
  status: 'active' | 'bounced' | 'complained' | 'unsubscribed' | 'replied' | 'completed';
}

class EmailTracker {
  private events: Map<string, TrackingEvent[]> = new Map();

  async initialize() {
    await this.loadFromSheets();
  }

  private async loadFromSheets() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'EmailLog!A:H',
      });

      // EmailLog tracks sends. For events, we'd need a separate sheet or webhook storage.
      // This is a simplified version - in production, use a dedicated tracking table.
    } catch (error) {
      console.error('[tracker] Load error:', error);
    }
  }

  async track(event: TrackingEvent): Promise<void> {
    const key = event.trackingId;
    if (!this.events.has(key)) {
      this.events.set(key, []);
    }
    this.events.get(key)!.push(event);

    await this.persistToSheets(event);
    await this.updateLeadStatus(event);
  }

  private async persistToSheets(event: TrackingEvent): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'TrackingEvents!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            event.timestamp.toISOString(),
            event.trackingId,
            event.event,
            event.metadata ? JSON.stringify(event.metadata) : '',
            event.ip || '',
            event.userAgent || '',
            event.url || '',
          ]],
        },
      });
    } catch (error) {
      console.error('[tracker] Persist error:', error);
    }
  }

  private async updateLeadStatus(event: TrackingEvent): Promise<void> {
    if (!['replied', 'unsubscribed', 'bounced', 'complained'].includes(event.event)) return;

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      // Find lead row and update status
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Leads!A:Z',
      });

      const rows = response.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // Assuming trackingId or email matches
        if (row.includes(event.trackingId) || row[2] === event.metadata?.email) {
          const statusMap: Record<string, string> = {
            replied: 'Replied',
            unsubscribed: 'Unsubscribed',
            bounced: 'Bounced',
            complained: 'Complained',
          };
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEETS_ID,
            range: `Leads!${String.fromCharCode(65 + (row.length - 1))}${i + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[statusMap[event.event]]] },
          });
          break;
        }
      }
    } catch (error) {
      console.error('[tracker] Lead status update error:', error);
    }
  }

  getEvents(trackingId: string): TrackingEvent[] {
    return this.events.get(trackingId) || [];
  }

  getLeadSummary(leadId: string, email: string): LeadTrackingSummary {
    const allEvents = Array.from(this.events.values()).flat();
    const leadEvents = allEvents.filter(e =>
      e.trackingId.startsWith(leadId) || e.metadata?.email === email
    );

    const counts = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      unsubscribed: 0,
      replied: 0,
    };

    let lastEventAt: Date | undefined;

    for (const event of leadEvents) {
      counts[event.event]++;
      if (!lastEventAt || event.timestamp > lastEventAt) {
        lastEventAt = event.timestamp;
      }
    }

    const openRate = counts.sent > 0 ? counts.opened / counts.sent : 0;
    const clickRate = counts.sent > 0 ? counts.clicked / counts.sent : 0;
    const replyRate = counts.sent > 0 ? counts.replied / counts.sent : 0;

    let status: LeadTrackingSummary['status'] = 'active';
    if (counts.unsubscribed > 0) status = 'unsubscribed';
    else if (counts.complained > 0) status = 'complained';
    else if (counts.bounced > 0) status = 'bounced';
    else if (counts.replied > 0) status = 'replied';
    else if (counts.sent >= 6) status = 'completed';

    return {
      leadId,
      email,
      totalSent: counts.sent,
      totalDelivered: counts.delivered,
      totalOpened: counts.opened,
      totalClicked: counts.clicked,
      totalBounced: counts.bounced,
      totalComplained: counts.complained,
      totalUnsubscribed: counts.unsubscribed,
      totalReplied: counts.replied,
      lastEventAt,
      openRate,
      clickRate,
      replyRate,
      status,
    };
  }

  async handleWebhook(payload: {
    type: string;
    trackingId: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    url?: string;
  }): Promise<void> {
    const eventMap: Record<string, TrackingEvent['event']> = {
      'message.sent': 'sent',
      'message.delivered': 'delivered',
      'message.opened': 'opened',
      'message.clicked': 'clicked',
      'message.bounced': 'bounced',
      'message.complained': 'complained',
      'message.unsubscribed': 'unsubscribed',
      'message.replied': 'replied',
    };

    const eventType = eventMap[payload.type];
    if (!eventType) {
      console.warn('[tracker] Unknown webhook type:', payload.type);
      return;
    }

    await this.track({
      trackingId: payload.trackingId,
      event: eventType,
      timestamp: new Date(payload.timestamp),
      metadata: payload.metadata,
      ip: payload.ip,
      userAgent: payload.userAgent,
      url: payload.url,
    });
  }

  async handleUnsubscribe(params: {
    email: string;
    trackingId: string;
    timestamp: string;
    sig: string;
  }): Promise<{ valid: boolean; reason?: string }> {
    if (!validateUnsubscribeToken(params.email, params.trackingId, params.timestamp, params.sig)) {
      return { valid: false, reason: 'Invalid signature' };
    }

    if (isTokenExpired(params.timestamp)) {
      return { valid: false, reason: 'Token expired' };
    }

    await this.track({
      trackingId: params.trackingId,
      event: 'unsubscribed',
      timestamp: new Date(params.timestamp),
      metadata: { email: params.email, method: 'one-click' },
    });

    await this.addToSuppressionList(params.email, params.trackingId);

    return { valid: true };
  }

  private async addToSuppressionList(email: string, trackingId: string): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Suppression!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString(),
            email,
            trackingId,
            'unsubscribe',
          ]],
        },
      });
    } catch (error) {
      console.error('[tracker] Suppression add error:', error);
    }
  }
}

function isTokenExpired(timestamp: string, maxAgeHours = 24 * 365): boolean {
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  return (now - tokenTime) > maxAgeHours * 3600 * 1000;
}

export const emailTracker = new EmailTracker();