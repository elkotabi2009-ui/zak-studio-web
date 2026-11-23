import { AgentMailClient } from 'agentmail';
import { createHmac } from 'crypto';
import { google } from 'googleapis';
import type { RFQFormData } from '@/lib/types';

const agentmail = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY!,
});

const UNSUB_SECRET = process.env.UNSUB_SECRET!;
const UNSUB_DOMAIN = process.env.UNSUB_DOMAIN || 'unsubscribe.zakstudio.com';
const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
  trackingId?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  try {
    const unsubscribeUrl = generateUnsubscribeUrl(payload.to, payload.trackingId || '');

    const htmlWithUnsub = injectUnsubscribeLink(payload.html, unsubscribeUrl);
    const textWithUnsub = injectUnsubscribeText(payload.text, unsubscribeUrl);

    const message = await agentmail.messages.send({
      from: {
        email: process.env.AGENTMAIL_FROM_EMAIL || 'mario.rossi@outreach.zakstudio.com',
        name: process.env.AGENTMAIL_FROM_NAME || 'Mario Rossi — ZAK Studio Web',
      },
      to: [{ email: payload.to, name: payload.toName }],
      subject: payload.subject,
      html: htmlWithUnsub,
      text: textWithUnsub,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Tracking-ID': payload.trackingId || '',
        'X-Entity-Ref-ID': payload.trackingId || '',
        ...payload.headers,
      },
      tags: payload.tags || ['outreach'],
    });

    await logEmailSent({
      messageId: message.id,
      to: payload.to,
      subject: payload.subject,
      trackingId: payload.trackingId,
      tags: payload.tags,
    });

    return { success: true, messageId: message.id };
  } catch (error) {
    console.error('[sender] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBulkEmails(
  emails: EmailPayload[],
  options: { delayMs?: number; maxConcurrent?: number } = {}
): Promise<SendResult[]> {
  const { delayMs = 3000, maxConcurrent = 3 } = options;
  const results: SendResult[] = [];

  for (let i = 0; i < emails.length; i += maxConcurrent) {
    const batch = emails.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map((email, idx) => {
        const delay = (i + idx) * delayMs + Math.random() * 2000;
        return new Promise<SendResult>((resolve) => {
          setTimeout(async () => {
            const result = await sendEmail(email);
            resolve(result);
          }, delay);
        });
      })
    );
    results.push(...batchResults);

    if (i + maxConcurrent < emails.length) {
      await new Promise((r) => setTimeout(r, delayMs * maxConcurrent));
    }
  }

  return results;
}

function generateUnsubscribeUrl(email: string, trackingId: string): string {
  const timestamp = Date.now().toString();
  const data = `${email}|${trackingId}|${timestamp}`;
  const signature = createHmac('sha256', UNSUB_SECRET).update(data).digest('hex');
  const params = new URLSearchParams({
    email,
    trackingId,
    timestamp,
    sig: signature,
  });
  return `https://${UNSUB_DOMAIN}/unsubscribe?${params.toString()}`;
}

function injectUnsubscribeLink(html: string, unsubscribeUrl: string): string {
  const unsubscribeHtml = `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      <p style="margin:0 0 8px;">Se non desideri ricevere ulteriori comunicazioni, puoi
        <a href="${unsubscribeUrl}" style="color:#3848f7;text-decoration:underline;">disiscriverti con un click</a>.
      </p>
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        ZAK Studio Web S.r.l. — Via delle Industrie 15, 20100 Milano — P.IVA IT01234567890
      </p>
    </div>
  `;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeHtml}</body>`);
  }
  return html + unsubscribeHtml;
}

function injectUnsubscribeText(text: string, unsubscribeUrl: string): string {
  return `${text}\n\n---\nSe non desideri ricevere ulteriori comunicazioni, disiscriviti: ${unsubscribeUrl}\n\nZAK Studio Web S.r.l. — Via delle Industrie 15, 20100 Milano — P.IVA IT01234567890`;
}

async function logEmailSent(data: {
  messageId: string;
  to: string;
  subject: string;
  trackingId?: string;
  tags?: string[];
}) {
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
          data.messageId,
          data.to,
          data.subject,
          data.trackingId || '',
          data.tags?.join(',') || '',
          'sent',
          '',
        ]],
      },
    });
  } catch (error) {
    console.error('[sender] Sheets log error:', error);
  }
}

export function validateUnsubscribeToken(email: string, trackingId: string, timestamp: string, signature: string): boolean {
  const data = `${email}|${trackingId}|${timestamp}`;
  const expectedSig = createHmac('sha256', UNSUB_SECRET).update(data).digest('hex');
  return signature === expectedSig;
}

export function isTokenExpired(timestamp: string, maxAgeHours = 24 * 365): boolean {
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  return (now - tokenTime) > maxAgeHours * 3600 * 1000;
}