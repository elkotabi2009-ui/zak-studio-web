import { google } from 'googleapis';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export interface SuppressionEntry {
  email: string;
  reason: 'unsubscribe' | 'bounce' | 'complaint' | 'manual' | 'invalid';
  addedAt: Date;
  trackingId?: string;
  source?: string;
}

class SuppressionList {
  private cache: Map<string, SuppressionEntry> = new Map();
  private loaded = false;

  async initialize(): Promise<void> {
    await this.loadFromSheets();
    this.loaded = true;
  }

  private async loadFromSheets(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Suppression!A:E',
      });

      const rows = response.data.values || [];
      for (const row of rows.slice(1)) {
        if (row[1]) {
          this.cache.set(row[1].toLowerCase(), {
            email: row[1].toLowerCase(),
            reason: row[3] as any,
            addedAt: new Date(row[0]),
            trackingId: row[2],
            source: row[4],
          });
        }
      }
      console.log(`[suppression] Loaded ${this.cache.size} entries`);
    } catch (error) {
      console.error('[suppression] Load error:', error);
    }
  }

  isSuppressed(email: string): boolean {
    return this.cache.has(email.toLowerCase());
  }

  getEntry(email: string): SuppressionEntry | undefined {
    return this.cache.get(email.toLowerCase());
  }

  async add(entry: SuppressionEntry): Promise<void> {
    const key = entry.email.toLowerCase();
    this.cache.set(key, entry);

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Suppression!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            entry.addedAt.toISOString(),
            entry.email,
            entry.trackingId || '',
            entry.reason,
            entry.source || '',
          ]],
        },
      });
    } catch (error) {
      console.error('[suppression] Add error:', error);
    }
  }

  async remove(email: string): Promise<boolean> {
    const key = email.toLowerCase();
    if (!this.cache.has(key)) return false;

    this.cache.delete(key);

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'Suppression!A:E',
      });

      const rows = response.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1]?.toLowerCase() === key) {
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEETS_ID,
            range: `Suppression!A${i + 1}:E${i + 1}`,
          });
          return true;
        }
      }
    } catch (error) {
      console.error('[suppression] Remove error:', error);
    }
    return false;
  }

  async bulkAdd(entries: SuppressionEntry[]): Promise<void> {
    for (const entry of entries) {
      this.cache.set(entry.email.toLowerCase(), entry);
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Suppression!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: entries.map((entry) => [
            entry.addedAt.toISOString(),
            entry.email,
            entry.trackingId || '',
            entry.reason,
            entry.source || '',
          ]),
        },
      });
    } catch (error) {
      console.error('[suppression] Bulk add error:', error);
    }
  }

  getAll(): SuppressionEntry[] {
    return Array.from(this.cache.values());
  }

  getByReason(reason: SuppressionEntry['reason']): SuppressionEntry[] {
    return Array.from(this.cache.values()).filter((e) => e.reason === reason);
  }

  getCount(): number {
    return this.cache.size;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const suppressionList = new SuppressionList();