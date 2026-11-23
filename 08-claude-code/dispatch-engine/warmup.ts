import { google } from 'googleapis';
import { emailQueue } from './queue';
import { sendEmail } from './sender';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

export interface WarmupConfig {
  weeks: number;
  schedule: number[]; // emails per day per week
  startDate: Date;
  currentWeek: number;
  currentDay: number;
  emailsSentToday: number;
  emailsSentThisWeek: number;
  dmarcPolicy: 'none' | 'quarantine' | 'reject';
  spfAligned: boolean;
  dkimAligned: boolean;
}

export interface WarmupContact {
  email: string;
  name: string;
  domain: string;
  type: 'seed' | 'real' | 'colleague';
  engagementScore: number; // 0-100
  lastContact?: Date;
  status: 'active' | 'paused' | 'exhausted';
}

class WarmupManager {
  private config: WarmupConfig;
  private contacts: WarmupContact[] = [];
  private isRunning = false;

  constructor() {
    this.config = {
      weeks: parseInt(process.env.WARMUP_WEEKS || '5', 10),
      schedule: JSON.parse(process.env.WARMUP_SCHEDULE || '[10,15,20,25,25]'),
      startDate: new Date(process.env.WARMUP_START_DATE || new Date().toISOString()),
      currentWeek: 0,
      currentDay: 0,
      emailsSentToday: 0,
      emailsSentThisWeek: 0,
      dmarcPolicy: 'none',
      spfAligned: false,
      dkimAligned: false,
    };
  }

  async initialize(): Promise<void> {
    await this.loadContacts();
    await this.loadProgress();
    this.calculateCurrentWeek();
  }

  private async loadContacts(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'WarmupContacts!A:H',
      });

      const rows = response.data.values || [];
      for (const row of rows.slice(1)) {
        if (row[0]) {
          this.contacts.push({
            email: row[0],
            name: row[1] || '',
            domain: row[2] || row[0].split('@')[1],
            type: row[3] as any || 'seed',
            engagementScore: parseInt(row[4], 10) || 50,
            lastContact: row[5] ? new Date(row[5]) : undefined,
            status: row[6] as any || 'active',
          });
        }
      }

      // Add default seed contacts if none
      if (this.contacts.length === 0) {
        this.contacts = this.getDefaultSeedContacts();
        await this.saveContacts();
      }

      console.log(`[warmup] Loaded ${this.contacts.length} warmup contacts`);
    } catch (error) {
      console.error('[warmup] Load contacts error:', error);
      this.contacts = this.getDefaultSeedContacts();
    }
  }

  private getDefaultSeedContacts(): WarmupContact[] {
    const seeds = [
      'warmup1@zakstudio.com', 'warmup2@zakstudio.com', 'warmup3@zakstudio.com',
      'test1@outreach.zakstudio.com', 'test2@outreach.zakstudio.com',
      'mario.rossi@zakstudio.com', 'team@zakstudio.com',
    ];

    return seeds.map((email, i) => ({
      email,
      name: `Warmup Contact ${i + 1}`,
      domain: email.split('@')[1],
      type: 'seed' as const,
      engagementScore: 80 + Math.floor(Math.random() * 20),
      status: 'active' as const,
    }));
  }

  private async saveContacts(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEETS_ID,
        range: 'WarmupContacts!A2:H',
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'WarmupContacts!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: this.contacts.map(c => [
            c.email, c.name, c.domain, c.type, c.engagementScore,
            c.lastContact?.toISOString() || '', c.status, ''
          ]),
        },
      });
    } catch (error) {
      console.error('[warmup] Save contacts error:', error);
    }
  }

  private async loadProgress(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEETS_ID,
        range: 'WarmupProgress!A:F',
      });

      const rows = response.data.values || [];
      if (rows.length > 1) {
        const latest = rows[rows.length - 1];
        this.config.currentWeek = parseInt(latest[1], 10) || 0;
        this.config.currentDay = parseInt(latest[2], 10) || 0;
        this.config.emailsSentToday = parseInt(latest[3], 10) || 0;
        this.config.emailsSentThisWeek = parseInt(latest[4], 10) || 0;
        this.config.dmarcPolicy = latest[5] as any || 'none';
      }
    } catch (error) {
      console.error('[warmup] Load progress error:', error);
    }
  }

  private calculateCurrentWeek(): void {
    const now = new Date();
    const diffTime = now.getTime() - this.config.startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    this.config.currentWeek = Math.min(Math.floor(diffDays / 7), this.config.weeks - 1);
    this.config.currentDay = diffDays % 7;
  }

  getDailyLimit(): number {
    if (this.config.currentWeek >= this.config.weeks) {
      return this.config.schedule[this.config.schedule.length - 1];
    }
    return this.config.schedule[this.config.currentWeek];
  }

  getWeeklyLimit(): number {
    return this.getDailyLimit() * 7;
  }

  canSendToday(): boolean {
    return this.config.emailsSentToday < this.getDailyLimit();
  }

  getRemainingToday(): number {
    return Math.max(0, this.getDailyLimit() - this.config.emailsSentToday);
  }

  getProgress(): WarmupConfig & { progressPercent: number; daysRemaining: number } {
    const totalDays = this.config.weeks * 7;
    const elapsedDays = this.config.currentWeek * 7 + this.config.currentDay;
    return {
      ...this.config,
      progressPercent: Math.min(100, (elapsedDays / totalDays) * 100),
      daysRemaining: Math.max(0, totalDays - elapsedDays),
    };
  }

  async getNextContacts(count: number): Promise<WarmupContact[]> {
    const available = this.contacts
      .filter(c => c.status === 'active')
      .sort((a, b) => {
        // Prioritize: never contacted > least recently contacted > highest engagement
        if (!a.lastContact && b.lastContact) return -1;
        if (a.lastContact && !b.lastContact) return 1;
        if (!a.lastContact && !b.lastContact) return b.engagementScore - a.engagementScore;
        return a.lastContact!.getTime() - b.lastContact!.getTime();
      })
      .slice(0, count);

    return available;
  }

  async sendWarmupEmail(contact: WarmupContact, template: 'intro' | 'followup' | 'value' | 'question'): Promise<boolean> {
    const templates = this.getWarmupTemplates(contact, template);
    const repository = templates[Math.floor(Math.random() * templates.length)];

    const result = await sendEmail({
      to: contact.email,
      toName: contact.name,
      subject: repository.subject,
      html: repository.html,
      text: repository.text,
      trackingId: `warmup_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      tags: ['warmup', template],
    });

    if (result.success) {
      contact.lastContact = new Date();
      contact.engagementScore = Math.min(100, contact.engagementScore + 2);
      this.config.emailsSentToday++;
      this.config.emailsSentThisWeek++;
      await this.saveProgress();
      await this.saveContacts();
      return true;
    }

    return false;
  }

  private getWarmupTemplates(contact: WarmupContact, type: string): Array<{ subject: string; html: string; text: string }> {
    const baseTemplates = {
      intro: [
        {
          subject: `Quick question for ${contact.name}`,
          html: `<p>Ciao ${contact.name},</p><p>Volevo presentarti brevemente ZAK Studio Web — realizziamo siti B2B per aziende manifatturiere.</p><p>Se hai 2 minuti, ti mando un link a una demo live del tuo settore?</p><p>Mario</p>`,
          text: `Ciao ${contact.name},\n\nVolevo presentarti brevemente ZAK Studio Web — realizziamo siti B2B per aziende manifatturiere.\n\nSe hai 2 minuti, ti mando un link a una demo live del tuo settore?\n\nMario`,
        },
      ],
      followup: [
        {
          subject: `Re: Quick question`,
          html: `<p>Ciao ${contact.name},</p><p>Ti scrivevo l'altra volta — nessun problema se non è il momento giusto.</p><p>Se in futuro avrai bisogno di rinnovare il sito aziendale, sai dove trovarmi.</p><p>Mario</p>`,
          text: `Ciao ${contact.name},\n\nTi scrivevo l'altra volta — nessun problema se non è il momento giusto.\n\nSe in futuro avrai bisogno di rinnovare il sito aziendale, sai dove trovarmi.\n\nMario`,
        },
      ],
      value: [
        {
          subject: `Case study: +38% RFQ per azienda simile`,
          html: `<p>Ciao ${contact.name},</p><p>Volevo condividere un risultato recente: un'azienda del tuo settore ha aumentato le RFQ qualificate del 38% in 90 giorni dopo il nuovo sito.</p><p>Ti interessa vedere i dettagli?</p><p>Mario</p>`,
          text: `Ciao ${contact.name},\n\nVolevo condividere un risultato recente: un'azienda del tuo settore ha aumentato le RFQ qualificate del 38% in 90 giorni dopo il nuovo sito.\n\nTi interessa vedere i dettagli?\n\nMario`,
        },
      ],
      question: [
        {
          subject: `Una domanda veloce`,
          html: `<p>Ciao ${contact.name},</p><p>Domanda diretta: come gestite oggi le richieste preventivo che arrivano dal sito?</p><p>Mario</p>`,
          text: `Ciao ${contact.name},\n\nDomanda diretta: come gestite oggi le richieste preventivo che arrivano dal sito?\n\nMario`,
        },
      ],
    };

    return baseTemplates[type as keyof typeof baseTemplates] || baseTemplates.intro;
  }

  private async saveProgress(): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'WarmupProgress!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString(),
            this.config.currentWeek,
            this.config.currentDay,
            this.config.emailsSentToday,
            this.config.emailsSentThisWeek,
            this.config.dmarcPolicy,
          ]],
        },
      });
    } catch (error) {
      console.error('[warmup] Save progress error:', error);
    }
  }

  async runDailyWarmup(): Promise<{ sent: number; failed: number }> {
    if (this.isRunning) return { sent: 0, failed: 0 };
    this.isRunning = true;

    let sent = 0, failed = 0;
    const limit = this.getRemainingToday();

    if (limit <= 0) {
      this.isRunning = false;
      return { sent: 0, failed: 0 };
    }

    // Rotate template types daily
    const templateTypes = ['intro', 'followup', 'value', 'question'];
    const templateType = templateTypes[this.config.currentDay % templateTypes.length];

    const contacts = await this.getNextContacts(limit);

    for (const contact of contacts) {
      if (this.config.emailsSentToday >= this.getDailyLimit()) break;

      const success = await this.sendWarmupEmail(contact, templateType as any);
      if (success) sent++; else failed++;

      // Delay between emails (2-8 minutes)
      await new Promise(r => setTimeout(r, (2 + Math.random() * 6) * 60 * 1000));
    }

    this.isRunning = false;
    return { sent, failed };
  }

  async checkDmarcAlignment(): Promise<void> {
    // In production, use DMARC report parser
    // For now, simulate check
    this.config.spfAligned = true;
    this.config.dkimAligned = true;

    if (this.config.currentWeek >= 2 && this.config.dmarcPolicy === 'none') {
      this.config.dmarcPolicy = 'quarantine';
    }
    if (this.config.currentWeek >= 4 && this.config.dmarcPolicy === 'quarantine') {
      this.config.dmarcPolicy = 'reject';
    }
  }

  isWarmupComplete(): boolean {
    return this.config.currentWeek >= this.config.weeks - 1 &&
           this.config.currentDay >= 6 &&
           this.config.emailsSentToday >= this.getDailyLimit();
  }
}

export const warmupManager = new WarmupManager();