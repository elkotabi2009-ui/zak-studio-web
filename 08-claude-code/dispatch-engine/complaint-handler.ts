import { google } from 'googleapis';
import { suppressionList } from './suppression';
import { emailTracker } from './tracker';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export interface ComplaintData {
  trackingId: string;
  email: string;
  type: 'abuse' | 'spam' | 'unsubscribe_request' | 'other';
  feedbackReport?: {
    userAgent?: string;
    reportedDomain?: string;
    reportedUri?: string;
    sourceIp?: string;
    authResults?: string;
  };
  timestamp: Date;
}

class ComplaintHandler {
  private complaintCounts: Map<string, number> = new Map();

  async initialize(): Promise<void> {
    await this.loadComplaintHistory();
  }

  private async loadComplaintHistory(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Complaints!A:E',
      });

      const rows = response.data.values || [];
      for (const row of rows.slice(1)) {
        if (row[1]) {
          const key = row[1].toLowerCase();
          this.complaintCounts.set(key, (this.complaintCounts.get(key) || 0) + 1);
        }
      }
    } catch (error) {
      console.error('[complaint-handler] Load error:', error);
    }
  }

  async handleComplaint(complaint: ComplaintData): Promise<void> {
    const key = complaint.email.toLowerCase();
    const count = (this.complaintCounts.get(key) || 0) + 1;
    this.complaintCounts.set(key, count);

    await this.recordComplaint(complaint);

    if (count === 1) {
      await this.suppressEmail(complaint.email, 'complaint', complaint.trackingId);
    }

    await emailTracker.track({
      trackingId: complaint.trackingId,
      event: 'complained',
      timestamp: complaint.timestamp,
      metadata: {
        email: complaint.email,
        complaintType: complaint.type,
        complaintCount: count,
        feedbackReport: complaint.feedbackReport,
      },
    });
  }

  private async recordComplaint(complaint: ComplaintData): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Complaints!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            complaint.timestamp.toISOString(),
            complaint.email,
            complaint.type,
            complaint.trackingId,
            complaint.feedbackReport ? JSON.stringify(complaint.feedbackReport) : '',
          ]],
        },
      });
    } catch (error) {
      console.error('[complaint-handler] Record error:', error);
    }
  }

  private async suppressEmail(email: string, reason: string, trackingId?: string): Promise<void> {
    await suppressionList.add({
      email: email.toLowerCase(),
      reason: reason as any,
      addedAt: new Date(),
      trackingId,
      source: 'complaint-handler',
    });
  }

  getComplaintCount(email: string): number {
    return this.complaintCounts.get(email.toLowerCase()) || 0;
  }

  isComplainer(email: string): boolean {
    return this.getComplaintCount(email) > 0;
  }

  getGlobalStats(): { totalComplaints: number; uniqueComplainers: number; byType: Record<string, number> } {
    let totalComplaints = 0;
    const byType: Record<string, number> = {};

    for (const [, count] of this.complaintCounts) {
      totalComplaints += count;
    }

    return {
      totalComplaints,
      uniqueComplainers: this.complaintCounts.size,
      byType,
    };
  }
}

export const complaintHandler = new ComplaintHandler();