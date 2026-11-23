import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const RFQSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().min(1),
  role: z.string().optional(),
  country: z.string().default('IT'),
  productIds: z.array(z.string()).optional(),
  message: z.string().min(20).max(5000),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  privacy: z.literal(true),
  marketing: z.boolean().optional(),
  recaptchaToken: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
});

const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Sotto €10.000',
  '10k-50k': '€10.000 - €50.000',
  '50k-100k': '€50.000 - €100.000',
  '100k-250k': '€100.000 - €250.000',
  '250k-500k': '€250.000 - €500.000',
  '500k+': 'Oltre €500.000',
  'not-specified': 'Non specificato',
};

const TIMELINE_LABELS: Record<string, string> = {
  'asap': 'Il prima possibile',
  '1-month': 'Entro 1 mese',
  '3-months': 'Entro 3 mesi',
  '6-months': 'Entro 6 mesi',
  '12-months': 'Entro 12 mesi',
  'planning': 'Solo pianificazione',
};

const COUNTRY_LABELS: Record<string, string> = {
  'IT': 'Italia', 'DE': 'Germania', 'FR': 'Francia', 'ES': 'Spagna',
  'CH': 'Svizzera', 'AT': 'Austria', 'BE': 'Belgio', 'NL': 'Paesi Bassi',
  'PL': 'Polonia', 'CZ': 'Repubblica Ceca', 'other': 'Altro',
};

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return true;

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return data.success && data.score > 0.5;
  } catch {
    return false;
  }
}

async function sendEmail(data: z.infer<typeof RFQSchema>, requestId: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM || 'noreply@zakstudio.com';
  const toEmail = process.env.RFQ_RECIPIENT_EMAIL || 'commercial@zakstudio.com';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('SMTP non configurato, email non inviata');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const productList = data.productIds && data.productIds.length > 0
    ? data.productIds.join(', ')
    : 'Non specificato';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3848f7 0%, #f97316 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; }
        .field { margin-bottom: 16px; }
        .label { font-weight: 600; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .value { color: #1e293b; }
        .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; }
        .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .tag { background: #3848f7; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 24px;">Nuova Richiesta Preventivo (RFQ)</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">Ricevuta il ${new Date().toLocaleString('it-IT')} — ID: ${requestId}</p>
      </div>
      <div class="content">
        <div class="field"><div class="label">Contatto</div><div class="value">${data.firstName} ${data.lastName}</div></div>
        <div class="field"><div class="label">Email</div><div class="value"><a href="mailto:${data.email}" style="color: #3848f7;">${data.email}</a></div></div>
        ${data.phone ? `<div class="field"><div class="label">Telefono</div><div class="value"><a href="tel:${data.phone}" style="color: #3848f7;">${data.phone}</a></div></div>` : ''}
        <div class="field"><div class="label">Azienda</div><div class="value">${data.company}</div></div>
        ${data.role ? `<div class="field"><div class="label">Ruolo</div><div class="value">${data.role}</div></div>` : ''}
        <div class="field"><div class="label">Paese</div><div class="value">${COUNTRY_LABELS[data.country] || data.country}</div></div>
        <div class="field"><div class="label">Prodotti/Servizi di interesse</div><div class="value">${productList}</div></div>
        ${data.budget ? `<div class="field"><div class="label">Budget indicativo</div><div class="value">${BUDGET_LABELS[data.budget] || data.budget}</div></div>` : ''}
        ${data.timeline ? `<div class="field"><div class="label">Tempistiche</div><div class="value">${TIMELINE_LABELS[data.timeline] || data.timeline}</div></div>` : ''}
        <div class="field"><div class="label">Messaggio</div><div class="message-box">${data.message}</div></div>
        ${data.utmSource ? `
        <div class="field"><div class="label">UTM Parameters</div>
          <div class="tags">
            ${data.utmSource ? `<span class="tag">utm_source: ${data.utmSource}</span>` : ''}
            ${data.utmMedium ? `<span class="tag">utm_medium: ${data.utmMedium}</span>` : ''}
            ${data.utmCampaign ? `<span class="tag">utm_campaign: ${data.utmCampaign}</span>` : ''}
            ${data.utmContent ? `<span class="tag">utm_content: ${data.utmContent}</span>` : ''}
            ${data.utmTerm ? `<span class="tag">utm_term: ${data.utmTerm}</span>` : ''}
          </div>
        </div>` : ''}
        <div class="footer">
          <p>Questa email è stata generata automaticamente dal form RFQ del sito ZAK Studio Web.</p>
          <p>Rispondi direttamente a questa email per contattare il richiedente.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Nuova Richiesta Preventivo (RFQ)
Ricevuta il ${new Date().toLocaleString('it-IT')} — ID: ${requestId}

Contatto: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Telefono: ${data.phone}` : ''}
Azienda: ${data.company}
${data.role ? `Ruolo: ${data.role}` : ''}
Paese: ${COUNTRY_LABELS[data.country] || data.country}
Prodotti/Servizi: ${productList}
${data.budget ? `Budget: ${BUDGET_LABELS[data.budget] || data.budget}` : ''}
${data.timeline ? `Tempistiche: ${TIMELINE_LABELS[data.timeline] || data.timeline}` : ''}

Messaggio:
${data.message}

${data.utmSource ? `UTM: source=${data.utmSource}, medium=${data.utmMedium}, campaign=${data.utmCampaign}, content=${data.utmContent}, term=${data.utmTerm}` : ''}

---
Rispondi direttamente a questa email per contattare il richiedente.
  `.trim();

  await transporter.sendMail({
    from: `"ZAK Studio Web RFQ" <${fromEmail}>`,
    to: toEmail,
    replyTo: data.email,
    subject: `[RFQ] ${data.company} - ${data.firstName} ${data.lastName} - ${new Date().toLocaleDateString('it-IT')}`,
    text: textContent,
    html: htmlContent,
  });

  // Send confirmation to user
  await transporter.sendMail({
    from: `"ZAK Studio Web" <${fromEmail}>`,
    to: data.email,
    subject: `Conferma ricezione richiesta preventivo - ZAK Studio Web`,
    text: `
Gentile ${data.firstName},

abbiamo ricevuto la tua richiesta di preventivo (Rif. ${requestId}).
Il nostro team commerciale la analizzerà e ti risponderà entro 24 ore lavorative.

Riepilogo della tua richiesta:
- Azienda: ${data.company}
- Prodotti/Servizi: ${productList}
- Budget: ${data.budget ? BUDGET_LABELS[data.budget] : 'Non specificato'}
- Tempistiche: ${data.timeline ? TIMELINE_LABELS[data.timeline] : 'Non specificato'}

Per qualsiasi urgenza, puoi contattarci al +39 02 1234 5678 o rispondere a questa email.

Cordiali saluti,
ZAK Studio Web Team
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3848f7 0%, #f97316 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0;">Ricevuta la tua richiesta</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
          <p>Gentile <strong>${data.firstName}</strong>,</p>
          <p>Abbiamo ricevuto la tua richiesta di preventivo (<strong>Rif. ${requestId}</strong>). Il nostro team commerciale la analizzerà e ti risponderà entro <strong>24 ore lavorative</strong>.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p><strong>Azienda:</strong> ${data.company}</p>
            <p><strong>Prodotti/Servizi:</strong> ${productList}</p>
            <p><strong>Budget:</strong> ${data.budget ? BUDGET_LABELS[data.budget] : 'Non specificato'}</p>
            <p><strong>Tempistiche:</strong> ${data.timeline ? TIMELINE_LABELS[data.timeline] : 'Non specificato'}</p>
          </div>
          <p>Per qualsiasi urgenza, puoi contattarci al <a href="tel:+390212345678" style="color: #3848f7;">+39 02 1234 5678</a> o rispondere a questa email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #64748b; text-align: center;">ZAK Studio Web S.r.l. — Via delle Industrie 15, 20100 Milano — P.IVA IT01234567890</p>
        </div>
      </body>
      </html>
    `,
  });
}

async function sendToCRM(data: z.infer<typeof RFQSchema>, requestId: string) {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;
  const webhookSecret = process.env.CRM_WEBHOOK_SECRET;

  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhookSecret && { 'X-Webhook-Secret': webhookSecret }),
      },
      body: JSON.stringify({
        ...data,
        requestId,
        receivedAt: new Date().toISOString(),
        source: 'website-rfq',
      }),
    });
  } catch (error) {
    console.error('CRM webhook error:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `RFQ-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    const body = await request.json();
    const parsed = RFQSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Dati non validi', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.recaptchaToken) {
      const isValid = await verifyRecaptcha(data.recaptchaToken);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Verifica reCAPTCHA fallita. Riprova.' },
          { status: 400 }
        );
      }
    }

    // Send email notification
    await sendEmail(data, requestId);

    // Send to CRM if configured
    await sendToCRM(data, requestId);

    // Log for analytics
    console.log(`[RFQ] ${requestId} - ${data.company} - ${data.email} - ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Richiesta inviata con successo. Ti risponderemo entro 24 ore.',
      requestId,
    });
  } catch (error) {
    console.error('[RFQ] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    );
  }
}