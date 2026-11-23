import { google } from 'googleapis';
import { emailTracker } from './tracker';
import { emailQueue } from './queue';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;
const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET!;

export interface ReplyData {
  trackingId: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string;
  timestamp: Date;
  headers?: Record<string, string>;
}

export interface ReplyClassification {
  type: 'interested' | 'not_interested' | 'unsubscribe_request' | 'referral' | 'question' | 'auto_reply' | 'bounce' | 'other';
  intent: 'positive' | 'negative' | 'neutral';
  confidence: number;
  suggestedAction: 'schedule_call' | 'send_case_study' | 'send_proposal' | 'add_to_nurture' | 'suppress' | 'forward_to_sales' | 'none';
  extractedData?: {
    proposedTime?: string;
    referredEmail?: string;
    referredName?: string;
    questions?: string[];
    objections?: string[];
  };
}

class ReplyHandler {
  private positiveKeywords = [
    'interessato', 'interessata', 'vorrei', 'vorremmo', 'contattatemi', 'chiamatemi',
    'preventivo', 'demo', 'prova', 'progetto', 'budget', 'timeline', 'partire',
    'interested', 'would like', 'contact me', 'call me', 'quote', 'demo', 'trial',
    'project', 'budget', 'timeline', 'start', 'proceed', 'next step'
  ];

  private negativeKeywords = [
    'non interessato', 'non interessata', 'non serve', 'già abbiamo', 'già fatto',
    'rivenditore', 'agenzia', 'spam', 'cancellatemi', 'rimuovetemi', 'unsubscribe',
    'not interested', 'already have', 'already done', 'spam', 'remove me',
    'stop', 'no thanks', 'not now', 'budget no', 'no budget'
  ];

  private referralKeywords = [
    'collega', 'colleghi', 'responsabile', 'decision maker', 'cto', 'ceo', 'plant manager',
    'colleague', 'colleagues', 'responsible', 'decision maker', 'manager', 'director'
  ];

  private questionKeywords = [
    'come', 'costa', 'prezzo', 'tempi', 'funziona', 'integra', 'cms', 'hosting',
    'how', 'cost', 'price', 'timeline', 'work', 'integrate', 'cms', 'hosting'
  ];

  async initialize(): Promise<void> {
    // Load any existing reply data if needed
  }

  async handleReply(reply: ReplyData): Promise<ReplyClassification> {
    const classification = this.classifyReply(reply);

    await this.recordReply(reply, classification);

    await emailTracker.track({
      trackingId: reply.trackingId,
      event: 'replied',
      timestamp: reply.timestamp,
      metadata: {
        fromEmail: reply.fromEmail,
        fromName: reply.fromName,
        subject: reply.subject,
        bodyText: reply.bodyText.substring(0, 500),
        classification: classification.type,
        intent: classification.intent,
        confidence: classification.confidence,
        suggestedAction: classification.suggestedAction,
        extractedData: classification.extractedData,
      },
    });

    await this.executeAction(reply, classification);

    return classification;
  }

  classifyReply(reply: ReplyData): ReplyClassification {
    const text = `${reply.subject} ${reply.bodyText}`.toLowerCase();

    let positiveScore = 0;
    let negativeScore = 0;
    let referralScore = 0;
    let questionScore = 0;

    for (const kw of this.positiveKeywords) {
      if (text.includes(kw.toLowerCase())) positiveScore++;
    }
    for (const kw of this.negativeKeywords) {
      if (text.includes(kw.toLowerCase())) negativeScore++;
    }
    for (const kw of this.referralKeywords) {
      if (text.includes(kw.toLowerCase())) referralScore++;
    }
    for (const kw of this.questionKeywords) {
      if (text.includes(kw.toLowerCase())) questionScore++;
    }

    const isAutoReply = this.isAutoReply(reply);

    let type: ReplyClassification['type'] = 'other';
    let intent: ReplyClassification['intent'] = 'neutral';
    let confidence = 0.5;
    let suggestedAction: ReplyClassification['suggestedAction'] = 'none';
    const extractedData: ReplyClassification['extractedData'] = {};

    if (isAutoReply) {
      type = 'auto_reply';
      intent = 'neutral';
      confidence = 0.9;
      suggestedAction = 'none';
    } else if (negativeScore > 0 && negativeScore >= positiveScore) {
      if (text.includes('unsubscribe') || text.includes('cancellatemi') || text.includes('rimuovetemi') || text.includes('remove me')) {
        type = 'unsubscribe_request';
        intent = 'negative';
        confidence = 0.95;
        suggestedAction = 'suppress';
      } else {
        type = 'not_interested';
        intent = 'negative';
        confidence = 0.7 + (negativeScore * 0.05);
        suggestedAction = 'add_to_nurture';
      }
    } else if (referralScore > 0) {
      type = 'referral';
      intent = 'positive';
      confidence = 0.7;
      suggestedAction = 'forward_to_sales';
      extractedData.referredEmail = this.extractEmail(text);
      extractedData.referredName = this.extractName(text);
    } else if (positiveScore > 0) {
      type = 'interested';
      intent = 'positive';
      confidence = 0.6 + (positiveScore * 0.05);
      suggestedAction = 'schedule_call';
      extractedData.proposedTime = this.extractTime(text);
    } else if (questionScore > 0) {
      type = 'question';
      intent = 'neutral';
      confidence = 0.6;
      suggestedAction = 'send_case_study';
      extractedData.questions = this.extractQuestions(text);
    }

    extractedData.objections = this.extractObjections(text);

    return {
      type,
      intent,
      confidence: Math.min(confidence, 1),
      suggestedAction,
      extractedData: Object.keys(extractedData).length > 0 ? extractedData : undefined,
    };
  }

  private isAutoReply(reply: ReplyData): boolean {
    const autoReplyIndicators = [
      'auto-reply', 'autoreply', 'automatic reply', 'out of office', 'fuori ufficio',
      'vacation', 'ferie', 'assente', 'away', 'abwesenheit', 'reponse automatique'
    ];

    const subject = reply.subject.toLowerCase();
    const from = reply.fromEmail.toLowerCase();

    if (autoReplyIndicators.some(ind => subject.includes(ind))) return true;
    if (from.includes('noreply') || from.includes('no-reply') || from.includes('donotreply')) return true;
    if (reply.headers?.['x-auto-response-suppress'] || reply.headers?.['auto-submitted']) return true;

    return false;
  }

  private extractEmail(text: string): string | undefined {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match?.[0];
  }

  private extractName(text: string): string | undefined {
    const namePatterns = [
      /(?:parla con|contatta|rivolgiti a|parla con)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /(?:talk to|contact|speak with)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1];
    }
    return undefined;
  }

  private extractTime(text: string): string | undefined {
    const timePatterns = [
      /(?:disponibile|libero|libera|posso|possiamo)\s+(?:dal|dalle|alle|intorno alle)\s+(\d{1,2}[:\.]\d{2})/i,
      /(?:available|free|can)\s+(?:from|at|around)\s+(\d{1,2}[:\.]\d{2})/i,
      /(\d{1,2}[:\.]\d{2})\s*(?:am|pm|di mattina|di pomeriggio|mattina|pomeriggio)/i,
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1];
    }
    return undefined;
  }

  private extractQuestions(text: string): string[] {
    const questions: string[] = [];
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.endsWith('?') || trimmed.match(/^(come|che|cosa|quando|dove|perché|quanto|how|what|when|where|why|how much)/i)) {
        if (trimmed.length > 10 && trimmed.length < 200) {
          questions.push(trimmed);
        }
      }
    }
    return questions.slice(0, 5);
  }

  private extractObjections(text: string): string[] {
    const objections: string[] = [];
    const objectionPatterns = [
      { pattern: /(?:troppo|costa|costoso|budget|prezzo)\s+(?:alto|molto|eccessivo)/i, type: 'price' },
      { pattern: /(?:già abbiamo|abbiamo già|already have)/i, type: 'competitor' },
      { pattern: /(?:non ho tempo|no time|troppo occupato|too busy)/i, type: 'time' },
      { pattern: /(?:non serve|non ci serve|don't need|not needed)/i, type: 'need' },
      { pattern: /(?:decidiamo|decideremo|valuteremo|valutiamo|we will decide|evaluate)/i, type: 'authority' },
    ];

    for (const { pattern, type } of objectionPatterns) {
      if (pattern.test(text)) objections.push(type);
    }
    return [...new Set(objections)];
  }

  private async recordReply(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEETS_ID,
        range: 'Replies!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            reply.timestamp.toISOString(),
            reply.trackingId,
            reply.fromEmail,
            reply.fromName || '',
            reply.subject,
            reply.bodyText.substring(0, 1000),
            classification.type,
            classification.intent,
            classification.confidence.toFixed(2),
            classification.suggestedAction,
          ]],
        },
      });
    } catch (error) {
      console.error('[reply-handler] Record error:', error);
    }
  }

  private async executeAction(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    switch (classification.suggestedAction) {
      case 'schedule_call':
        await this.triggerCalendlyInvite(reply, classification);
        break;
      case 'send_case_study':
        await this.queueCaseStudyEmail(reply, classification);
        break;
      case 'send_proposal':
        await this.queueProposalEmail(reply, classification);
        break;
      case 'suppress':
        // Handled by suppression list via complaint handler
        break;
      case 'forward_to_sales':
        await this.forwardToSales(reply, classification);
        break;
      case 'add_to_nurture':
        await this.addToNurtureSequence(reply, classification);
        break;
    }
  }

  private async triggerCalendlyInvite(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    // In production, use Calendly API to create a scheduling link or book directly
    console.log('[reply-handler] Trigger Calendly for:', reply.fromEmail);
  }

  private async queueCaseStudyEmail(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    // Queue a follow-up email with relevant case study
    console.log('[reply-handler] Queue case study for:', reply.fromEmail);
  }

  private async queueProposalEmail(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    // Queue proposal generation and sending
    console.log('[reply-handler] Queue proposal for:', reply.fromEmail);
  }

  private async forwardToSales(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    // Forward to sales team (Slack, email, CRM)
    console.log('[reply-handler] Forward to sales:', reply.fromEmail);
  }

  private async addToNurtureSequence(reply: ReplyData, classification: ReplyClassification): Promise<void> {
    // Add to long-term nurture sequence
    console.log('[reply-handler] Add to nurture:', reply.fromEmail);
  }
}

export const replyHandler = new ReplyHandler();