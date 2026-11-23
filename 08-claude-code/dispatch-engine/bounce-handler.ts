import { google } from 'googleapis';
import { suppressionList } from './suppression';
import { emailTracker } from './tracker';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export interface BounceData {
  trackingId: string;
  email: string;
  type: 'hard' | 'soft' | 'block' | 'technical';
  code?: string;
  message?: string;
  timestamp: Date;
  originalSubject?: string;
}

export interface BounceClassification {
  shouldSuppress: boolean;
  reason: 'hard_bounce' | 'soft_bounce_repeated' | 'block' | 'technical_issue' | 'none';
  retryAfter?: number; // milliseconds
  maxRetries?: number;
}

class BounceHandler {
  private bounceCounts: Map<string, { count: number; lastBounce: Date; type: string }> = new Map();
  private readonly MAX_SOFT_BOUNCES = 3;
  private readonly SOFT_BOUNCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  async initialize(): Promise<void> {
    await this.loadBounceHistory();
  }

  private async loadBounceHistory(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Bounces!A:F',
      });

      const rows = response.data.values || [];
      for (const row of rows.slice(1)) {
        if (row[1]) {
          const key = row[1].toLowerCase();
          const existing = this.bounceCounts.get(key) || { count: 0, lastBounce: new Date(0), type: '' };
          existing.count++;
          existing.lastBounce = new Date(row[0]);
          existing.type = row[2];
          this.bounceCounts.set(key, existing);
        }
      }
    } catch (error) {
      console.error('[bounce-handler] Load error:', error);
    }
  }

  async handleBounce(bounce: BounceData): Promise<BounceClassification> {
    const classification = this.classifyBounce(bounce);

    await this.recordBounce(bounce, classification);

    if (classification.shouldSuppress) {
      await this.suppressEmail(bounce.email, classification.reason, bounce.trackingId);
    }

    await emailTracker.track({
      trackingId: bounce.trackingId,
      event: 'bounced',
      timestamp: bounce.timestamp,
      metadata: {
        email: bounce.email,
        bounceType: bounce.type,
        bounceCode: bounce.code,
        bounceMessage: bounce.message,
        classification: classification.reason,
      },
    });

    return classification;
  }

  classifyBounce(bounce: BounceData): BounceClassification {
    const key = bounce.email.toLowerCase();
    const history = this.bounceCounts.get(key);

    switch (bounce.type) {
      case 'hard':
        return {
          shouldSuppress: true,
          reason: 'hard_bounce',
        };

      case 'block':
        return {
          shouldSuppress: true,
          reason: 'block',
        };

      case 'soft':
        if (history && history.count >= this.MAX_SOFT_BOUNCES) {
          const timeSinceFirstBounce = Date.now() - history.lastBounce.getTime();
          if (timeSinceFirstBounce < this.SOFT_BOUNCE_WINDOW_MS) {
            return {
              shouldSuppress: true,
              reason: 'soft_bounce_repeated',
            };
          }
        }
        return {
          shouldSuppress: false,
          reason: 'none',
          retryAfter: this.calculateRetryDelay(history?.count || 0),
          maxRetries: this.MAX_SOFT_BOUNCES,
        };

      case 'technical':
        return {
          shouldSuppress: false,
          reason: 'technical_issue',
          retryAfter: 60 * 60 * 1000, // 1 hour
        };

      default:
        return { shouldSuppress: false, reason: 'none' };
    }
  }

  private calculateRetryDelay(bounceCount: number): number {
    const baseDelay = 30 * 60 * 1000; // 30 minutes
    const maxDelay = 24 * 60 * 60 * 1000; // 24 hours
    const delay = Math.min(baseDelay * Math.pow(2, bounceCount), maxDelay);
    return delay + Math.random() * 60 * 60 * 1000; // Add jitter
  }

  private async recordBounce(bounce: BounceData, classification: BounceClassification): Promise<void> {
    const key = bounce.email.toLowerCase();
    const existing = this.bounceCounts.get(key) || { count: 0, lastBounce: new Date(0), type: '' };
    existing.count++;
    existing.lastBounce = bounce.timestamp;
    existing.type = bounce.type;
    this.bounceCounts.set(key, existing);

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Bounces!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            bounce.timestamp.toISOString(),
            bounce.email,
            bounce.type,
            bounce.code || '',
            bounce.message || '',
            classification.reason,
          ]],
        },
      });
    } catch (error) {
      console.error('[bounce-handler] Record error:', error);
    }
  }

  private async suppressEmail(email: string, reason: string, trackingId?: string): Promise<void> {
    await suppressionList.add({
      email: email.toLowerCase(),
      reason: reason as any,
      addedAt: new Date(),
      trackingId,
      source: 'bounce-handler',
    });
  }

  getBounceStats(email: string): { count: number; lastBounce: Date | null; type: string } | null {
    const entry = this.bounceCounts.get(email.toLowerCase());
    if (!entry) return null;
    return {
      count: entry.count,
      lastBounce: entry.lastBounce,
      type: entry.type,
    };
  }

  getGlobalStats(): { totalBounces: number; hardBounces: number; softBounces: number; suppressedCount: number } {
    let totalBounces = 0, hardBounces = 0, softBounces = 0;
    for (const entry of this.bounceCounts.values()) {
      totalBounces += entry.count;
      if (entry.type === 'hard') hardBounces += entry.count;
      if (entry.type === 'soft') softBounces += entry.count;
    }
    return {
      totalBounces,
      hardBounces,
      softBounces,
      suppressedCount: suppressionList.getCount(),
    };
  }

  shouldRetry(email: string): { retry: boolean; delayMs?: number } {
    const stats = this.getBounceStats(email);
    if (!stats) return { retry: true };

    if (stats.type === 'hard' || stats.type === 'block') return { retry: false };
    if (stats.count >= this.MAX_SOFT_BOUNCES) return { retry: false };

    return { retry: true, delayMs: this.calculateRetryDelay(stats.count) };
  }
}

export const bounceHandler = new BounceHandler();