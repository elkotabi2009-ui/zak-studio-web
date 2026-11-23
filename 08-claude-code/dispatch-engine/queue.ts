import { google } from 'googleapis';
import type { EmailPayload } from './sender';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export interface QueuedEmail {
  id: string;
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
  trackingId: string;
  sequenceStep: number;
  leadId: string;
  scheduledAt: Date;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'bounced' | 'complained' | 'unsubscribed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  priority: number;
}

export interface QueueStats {
  pending: number;
  sending: number;
  sentToday: number;
  failedToday: number;
  bouncedToday: number;
  complainedToday: number;
  unsubscribedToday: number;
  nextSendAt?: Date;
}

class EmailQueue {
  private queue: Map<string, QueuedEmail> = new Map();
  private processing = false;
  private dailySentCount = 0;
  private dailyLimit = parseInt(process.env.MAX_EMAILS_PER_DAY || '25', 10);
  private domainDailyLimits: Map<string, number> = new Map();
  private domainDailyLimit = parseInt(process.env.MAX_EMAILS_PER_DOMAIN_PER_DAY || '3', 10);

  async initialize() {
    await this.loadFromSheets();
    this.resetDailyCounters();
    setInterval(() => this.resetDailyCounters(), 24 * 60 * 60 * 1000);
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

      const rows = response.data.values || [];
      for (const row of rows.slice(1)) {
        if (row[4]) { // trackingId
          this.queue.set(row[4], {
            id: row[1],
            to: row[2],
            subject: row[3],
            trackingId: row[4],
            tags: row[5]?.split(',') || [],
            status: row[6] as any,
            sequenceStep: 1,
            leadId: '',
            scheduledAt: new Date(row[0]),
            attempts: 1,
            error: row[7] || '',
            priority: 0,
            html: '',
            text: '',
          });
        }
      }
    } catch (error) {
      console.error('[queue] Load error:', error);
    }
  }

  private resetDailyCounters() {
    this.dailySentCount = 0;
    this.domainDailyLimits.clear();
  }

  getDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || 'unknown';
  }

  canSend(email: string): boolean {
    if (this.dailySentCount >= this.dailyLimit) return false;

    const domain = this.getDomain(email);
    const domainCount = this.domainDailyLimits.get(domain) || 0;
    if (domainCount >= this.domainDailyLimit) return false;

    return true;
  }

  async enqueue(email: QueuedEmail): Promise<void> {
    this.queue.set(email.trackingId, email);
    await this.persistToSheets(email);
  }

  async enqueueBatch(emails: QueuedEmail[]): Promise<void> {
    for (const email of emails) {
      this.queue.set(email.trackingId, email);
    }
    await this.persistBatchToSheets(emails);
  }

  private async persistToSheets(email: QueuedEmail): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'EmailLog!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            email.scheduledAt.toISOString(),
            email.id,
            email.to,
            email.subject,
            email.trackingId,
            email.tags?.join(',') || '',
            email.status,
            email.error || '',
          ]],
        },
      });
    } catch (error) {
      console.error('[queue] Persist error:', error);
    }
  }

  private async persistBatchToSheets(emails: QueuedEmail[]): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'EmailLog!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: emails.map((email) => [
            email.scheduledAt.toISOString(),
            email.id,
            email.to,
            email.subject,
            email.trackingId,
            email.tags?.join(',') || '',
            email.status,
            email.error || '',
          ]),
        },
      });
    } catch (error) {
      console.error('[queue] Batch persist error:', error);
    }
  }

  async updateStatus(trackingId: string, status: QueuedEmail['status'], error?: string): Promise<void> {
    const email = this.queue.get(trackingId);
    if (!email) return;

    email.status = status;
    if (error) email.error = error;
    if (status === 'sent') {
      this.dailySentCount++;
      const domain = this.getDomain(email.to);
      this.domainDailyLimits.set(domain, (this.domainDailyLimits.get(domain) || 0) + 1);
    }
    if (status === 'sending') email.attempts++;
    email.lastAttempt = new Date();

    await this.persistUpdateToSheets(email);
  }

  private async persistUpdateToSheets(email: QueuedEmail): Promise<void> {
    // In production, update specific row. For now, append new row with updated status.
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'EmailLog!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString(),
            email.id,
            email.to,
            email.subject,
            email.trackingId,
            email.tags?.join(',') || '',
            email.status,
            email.error || '',
          ]],
        },
      });
    } catch (error) {
      console.error('[queue] Update persist error:', error);
    }
  }

  getPendingEmails(limit = 50): QueuedEmail[] {
    const now = new Date();
    return Array.from(this.queue.values())
      .filter((e) => e.status === 'pending' && e.scheduledAt <= now)
      .sort((a, b) => b.priority - a.priority || a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .slice(0, limit);
  }

  getStats(): QueueStats {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sentToday = 0, failedToday = 0, bouncedToday = 0, complainedToday = 0, unsubscribedToday = 0;
    let nextSendAt: Date | undefined;

    for (const email of this.queue.values()) {
      const emailDate = new Date(email.scheduledAt);
      if (emailDate >= today) {
        if (email.status === 'sent') sentToday++;
        else if (email.status === 'failed') failedToday++;
        else if (email.status === 'bounced') bouncedToday++;
        else if (email.status === 'complained') complainedToday++;
        else if (email.status === 'unsubscribed') unsubscribedToday++;
        else if (email.status === 'pending' && (!nextSendAt || emailDate < nextSendAt)) {
          nextSendAt = emailDate;
        }
      }
    }

    return {
      pending: Array.from(this.queue.values()).filter(e => e.status === 'pending').length,
      sending: Array.from(this.queue.values()).filter(e => e.status === 'sending').length,
      sentToday,
      failedToday,
      bouncedToday,
      complainedToday,
      unsubscribedToday,
      nextSendAt,
    };
  }

  isProcessing(): boolean {
    return this.processing;
  }

  setProcessing(value: boolean): void {
    this.processing = value;
  }
}

export const emailQueue = new EmailQueue();