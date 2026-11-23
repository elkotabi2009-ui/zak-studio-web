import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

// Email transporter configuration
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

/**
 * Sends payment confirmation email to client
 */
export async function sendPaymentConfirmationEmail(params: {
  to: string;
  companyName: string;
  contactName?: string;
  proposalNumber: string;
  amount: number;
  currency: string;
  paymentType: string;
  paidAt: Date;
  contractUrl?: string;
  portalUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();

  const paymentTypeLabels: Record<string, string> = {
    deposit: 'Acconto',
    balance: 'Saldo',
    full: 'Pagamento completo',
    installment: 'Rata',
  };

  const typeLabel = paymentTypeLabels[params.paymentType] || params.paymentType;
  const formattedDate = params.paidAt.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Pagamento - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background: #ffffff; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 800; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">ZAK</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Studio Web</p>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Pagamento confermato ✓
              </h1>

              <p style="margin: 0 0 8px; font-size: 16px; color: #334155; line-height: 1.6;">
                Gentile ${params.contactName || params.companyName},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Confermiamo la ricezione del <strong>${typeLabel}</strong> per la proposta <strong>${params.proposalNumber}</strong>.
              </p>

              <!-- Payment Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Importo</span>
                    <span style="float: right; font-size: 18px; font-weight: 700; color: #0f172a;">${params.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ${params.currency}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Tipo pagamento</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${typeLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Data pagamento</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #64748b;">Proposta</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${params.proposalNumber}</span>
                  </td>
                </tr>
              </table>

              ${params.paymentType === 'deposit' ? `
              <p style="margin: 24px 0 0; font-size: 15px; color: #334155; line-height: 1.6;">
                <strong>Prossimo passo:</strong> Entro 24 ore riceverete via email il <strong>Contratto di Fornitura</strong>
                precompilato per la firma digitale. Una volta firmato, avvieremo immediatamente i lavori.
              </p>
              ` : params.paymentType === 'balance' || params.paymentType === 'full' ? `
              <p style="margin: 24px 0 0; font-size: 15px; color: #334155; line-height: 1.6;">
                <strong>Ottimo!</strong> Il pagamento è completato. Il vostro progetto entra ora in fase di consegna.
                Riceverete a breve le credenziali di accesso e la guida per la gestione del sito.
              </p>
              ` : ''}

              ${params.contractUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${params.contractUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Scarica Contratto
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${params.portalUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${params.portalUrl}" style="display: inline-block; background: transparent; color: #0f172a; padding: 14px 32px; border: 2px solid #0f172a; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Accedi al Portale Cliente
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; line-height: 1.6;">
                La fattura elettronica (SDI) sarà emessa automaticamente e inviata alla vostra PEC/email.
              </p>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                Per qualsiasi domanda: <a href="mailto:amministrazione@zakstudio.com" style="color: #0f172a; text-decoration: none;">amministrazione@zakstudio.com</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              ZAK Studio Web S.r.l.<br>
              Via Example 123, 20100 Milano (MI) | P.IVA 12345678901<br>
              <a href="https://zakstudio.com" style="color: #64748b; text-decoration: none;">zakstudio.com</a> |
              <a href="mailto:info@zakstudio.com" style="color: #64748b; text-decoration: none;">info@zakstudio.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Unsubscribe -->
    <tr>
      <td style="text-align: center; padding: 16px;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Questa è una comunicazione transazionale relativa al vostro ordine.
          <a href="${process.env.APP_URL}/unsubscribe?email=${encodeURIComponent(params.to)}" style="color: #94a3b8;">Gestisci preferenze</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Pagamento confermato - ZAK Studio Web

Gentile ${params.contactName || params.companyName},

Confermiamo la ricezione del ${typeLabel} per la proposta ${params.proposalNumber}.

Dettagli:
- Importo: € ${params.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ${params.currency}
- Tipo: ${typeLabel}
- Data: ${formattedDate}
- Proposta: ${params.proposalNumber}

${params.paymentType === 'deposit' ? 'Prossimo passo: riceverete il Contratto di Fornitura per la firma digitale entro 24 ore.' : ''}
${params.paymentType === 'balance' || params.paymentType === 'full' ? 'Il pagamento è completato. Il progetto entra in fase di consegna.' : ''}

La fattura elettronica (SDI) sarà emessa automaticamente.

ZAK Studio Web S.r.l.
info@zakstudio.com | zakstudio.com
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'noreply@zakstudio.com'}>`,
      to: params.to,
      subject: `✓ Pagamento confermato - ${typeLabel} Proposta ${params.proposalNumber}`,
      text,
      html,
    });

    // Log to sheets
    await logEmailSent({
      to: params.to,
      subject: `Pagamento confermato - ${params.proposalNumber}`,
      type: 'payment_confirmation',
      trackingId: info.messageId,
      proposalNumber: params.proposalNumber,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] Payment confirmation error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Sends contract for digital signature
 */
export async function sendContractForSignature(dealId: string, proposalNumber: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Fetch deal/client details from sheets
  const deal = await getDealDetails(dealId);
  if (!deal) {
    return { success: false, error: 'Deal not found' };
  }

  const contractUrl = `${process.env.APP_URL}/contracts/${deal.contractNumber}?sign=true`;
  const portalUrl = `${process.env.APP_URL}/portal/${dealId}`;

  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contratto per Firma - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background: #ffffff; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 800; color: #0f172a;">ZAK</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Studio Web</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f172a;">
                Contratto pronto per la firma 📄
              </h1>

              <p style="margin: 0 0 8px; font-size: 16px; color: #334155;">
                Gentile ${deal.contactName || deal.companyName},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                L'<strong>acconto</strong> per la proposta <strong>${proposalNumber}</strong> è stato registrato.
                Il <strong>Contratto di Fornitura Servizi Web N. ${deal.contractNumber}</strong> è pronto per la vostra firma digitale.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Contratto N.</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${deal.contractNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Proposta collegata</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${proposalNumber}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Piano</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${deal.plan === 'business' ? 'Business' : 'Enterprise'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #64748b;">Investimento totale</span>
                    <span style="float: right; font-size: 14px; font-weight: 700; color: #0f172a;">€ ${deal.totalValue.toLocaleString('it-IT')} + IVA</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${contractUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Firma Digitalmente il Contratto
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 16px 0 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                La firma è semplice, sicura e legalmente valida (eIDAS).
                Non serve stampare né scansionare.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #334155;">
                Cosa succede dopo la firma:
              </h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 2;">
                <li>Avvio immediato dei lavori (Kick-off entro 48h)</li>
                <li>Accesso al Portale Cliente per tracciare l'avanzamento</li>
                <li>Assegnazione Project Manager dedicato</li>
                <li>Prima consegna (wireframe/design) entro i tempi concordati</li>
              </ul>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #94a3b8;">
              ZAK Studio Web S.r.l. | zakstudio.com | info@zakstudio.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 16px;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Comunicazione relativa al vostro ordine.
          <a href="${process.env.APP_URL}/unsubscribe?email=${encodeURIComponent(deal.email)}" style="color: #94a3b8;">Preferenze</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Contratto pronto per la firma - ZAK Studio Web

Gentile ${deal.contactName || deal.companyName},

L'acconto per la proposta ${proposalNumber} è stato registrato.
Il Contratto di Fornitura N. ${deal.contractNumber} è pronto per la firma digitale.

Dettagli:
- Contratto: ${deal.contractNumber}
- Proposta: ${proposalNumber}
- Piano: ${deal.plan === 'business' ? 'Business' : 'Enterprise'}
- Totale: € ${deal.totalValue.toLocaleString('it-IT')} + IVA

Firma qui: ${contractUrl}

La firma è semplice, sicura e legalmente valida (eIDAS).

Dopo la firma: avvio lavori entro 48h, accesso portale cliente, PM dedicato.

ZAK Studio Web S.r.l.
info@zakstudio.com | zakstudio.com
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'noreply@zakstudio.com'}>`,
      to: deal.email,
      subject: `📄 Contratto da firmare - ${deal.contractNumber} (Proposta ${proposalNumber})`,
      text,
      html,
    });

    await logEmailSent({
      to: deal.email,
      subject: `Contratto da firmare - ${deal.contractNumber}`,
      type: 'contract_signature',
      trackingId: info.messageId,
      proposalNumber,
      dealId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] Contract signature error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Sends site delivery email with credentials
 */
export async function sendSiteDeliveryEmail(params: {
  to: string;
  companyName: string;
  contactName?: string;
  dealId: string;
  contractNumber: string;
  proposalNumber: string;
  siteUrl: string;
  adminUrl: string;
  credentials: {
    email: string;
    password: string; // temporary, will be changed on first login
  };
  ghostUrl?: string;
  ghostCredentials?: { email: string; password: string };
  portalUrl: string;
  supportEmail: string;
  documentationUrl: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consegna Sito - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background: #ffffff; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 800; color: #059669;">ZAK</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 14px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.1em;">Studio Web</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f172a;">
                Il vostro sito è online! 🚀
              </h1>

              <p style="margin: 0 0 8px; font-size: 16px; color: #334155;">
                Gentile ${params.contactName || params.companyName},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                Complimenti! Il progetto <strong>${params.proposalNumber}</strong> (Contratto ${params.contractNumber})
                è stato completato e consegnato. Il vostro nuovo sito web è <strong>online e operativo</strong>.
              </p>

              <!-- Site Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="text-align: center; padding: 16px 0;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">Sito Pubblico</p>
                    <a href="${params.siteUrl}" style="font-size: 18px; font-weight: 600; color: #059669; text-decoration: none; word-break: break-all;">${params.siteUrl}</a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 16px 0; border-top: 1px solid #bbf7d0;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">Area Amministrazione</p>
                    <a href="${params.adminUrl}" style="font-size: 18px; font-weight: 600; color: #059669; text-decoration: none; word-break: break-all;">${params.adminUrl}</a>
                  </td>
                </tr>
              </table>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #92400e;">
                      ⚠️ Credenziali di Accesso (temporanee)
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #fde68a;">
                          <span style="font-size: 13px; color: #78350f;">Email</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #92400e; font-family: monospace;">${params.credentials.email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="font-size: 13px; color: #78350f;">Password temporanea</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #92400e; font-family: monospace;">${params.credentials.password}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 16px 0 0; font-size: 12px; color: #78350f; line-height: 1.5;">
                      <strong>Importante:</strong> Al primo accesso vi sarà richiesto di cambiare la password.
                      Salvate le nuove credenziali in un gestore sicuro.
                    </p>
                  </td>
                </tr>
              </table>

              ${params.ghostUrl && params.ghostCredentials ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #334155;">👻 Ghost CMS (Gestione Contenuti/Blog)</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                          <span style="font-size: 13px; color: #64748b;">URL</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #334155; word-break: break-all;">${params.ghostUrl}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                          <span style="font-size: 13px; color: #64748b;">Email</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #334155; font-family: monospace;">${params.ghostCredentials.email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="font-size: 13px; color: #64748b;">Password</span><br>
                          <span style="font-size: 15px; font-weight: 600; color: #334155; font-family: monospace;">${params.ghostCredentials.password}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${params.portalUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                      Accedi al Portale Cliente
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #334155;">
                Risorse a vostra disposizione:
              </h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155; line-height: 2;">
                <li><a href="${params.documentationUrl}" style="color: #059669;">Documentazione tecnica e guide</a></li>
                <li><a href="${params.portalUrl}/tickets" style="color: #059669;">Apri ticket supporto</a> (SLA: ${params.supportEmail})</li>
                <li><a href="${params.portalUrl}/analytics" style="color: #059669;">Dashboard analytics</a></li>
                <li>Backup automatici giornalieri (retenzione 30 giorni)</li>
                <li>Aggiornamenti security automatici inclusi</li>
              </ul>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;">

              <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Siamo a vostra disposizione per qualsiasi necessità.
                Il vostro Project Manager vi contatterà a breve per il follow-up post-consegna.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #94a3b8;">
              ZAK Studio Web S.r.l. | zakstudio.com | ${params.supportEmail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 16px;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Comunicazione di consegna progetto.
          <a href="${process.env.APP_URL}/unsubscribe?email=${encodeURIComponent(params.to)}" style="color: #94a3b8;">Preferenze</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Il vostro sito è online! - ZAK Studio Web

Gentile ${params.contactName || params.companyName},

Complimenti! Il progetto ${params.proposalNumber} (Contratto ${params.contractNumber}) è stato completato.

Sito pubblico: ${params.siteUrl}
Area admin: ${params.adminUrl}

Credenziali temporanee:
- Email: ${params.credentials.email}
- Password: ${params.credentials.password}
(Al primo accesso dovrete cambiare la password)

${params.ghostUrl ? `Ghost CMS: ${params.ghostUrl}\nEmail: ${params.ghostCredentials?.email}\nPassword: ${params.ghostCredentials?.password}` : ''}

Portale Cliente: ${params.portalUrl}
Supporto: ${params.supportEmail}
Documentazione: ${params.documentationUrl}

Il vostro Project Manager vi contatterà per il follow-up.

ZAK Studio Web S.r.l.
zakstudio.com | ${params.supportEmail}
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'noreply@zakstudio.com'}>`,
      to: params.to,
      subject: `🚀 Consegna completata - Il vostro sito è online! (${params.proposalNumber})`,
      text,
      html,
    });

    await logEmailSent({
      to: params.to,
      subject: `Consegna sito - ${params.proposalNumber}`,
      type: 'site_delivery',
      trackingId: info.messageId,
      proposalNumber: params.proposalNumber,
      dealId: params.dealId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] Site delivery error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Sends payment reminder email
 */
export async function sendPaymentReminderEmail(params: {
  to: string;
  companyName: string;
  contactName?: string;
  proposalNumber: string;
  contractNumber?: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paymentType: 'deposit' | 'balance' | 'installment';
  iban: {
    beneficiary: string;
    iban: string;
    bic: string;
    reference: string;
  };
  daysOverdue?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();

  const isOverdue = params.daysOverdue && params.daysOverdue > 0;
  const paymentTypeLabels: Record<string, string> = {
    deposit: 'Acconto',
    balance: 'Saldo',
    installment: 'Rata',
  };
  const typeLabel = paymentTypeLabels[params.paymentType];

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isOverdue ? 'Sollicito Pagamento' : 'Promemoria Pagamento'} - ZAK Studio Web</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${isOverdue ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background: #ffffff; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 800; color: ${isOverdue ? '#dc2626' : '#f59e0b'};">ZAK</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 14px; color: ${isOverude ? '#fecaca' : '#fde68a'}; text-transform: uppercase; letter-spacing: 0.1em;">Studio Web</p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 32px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0f172a;">
                ${isOverdue ? '⚠️ Pagamento in ritardo' : '📅 Promemoria pagamento'}
              </h1>

              <p style="margin: 0 0 8px; font-size: 16px; color: #334155;">
                Gentile ${params.contactName || params.companyName},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.6;">
                ${isOverude
                  ? `Il <strong>${typeLabel}</strong> per la proposta <strong>${params.proposalNumber}</strong> risulta <strong>scaduto da ${params.daysOverdue} giorno${params.daysOverdue > 1 ? 'i' : ''}</strong>.`
                  : `Vi ricordiamo che il <strong>${typeLabel}</strong> per la proposta <strong>${params.proposalNumber}</strong> è in scadenza il <strong>${params.dueDate.toLocaleDateString('it-IT')}</strong>.`
                }
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Importo dovuto</span>
                    <span style="float: right; font-size: 22px; font-weight: 700; color: ${isOverdue ? '#dc2626' : '#0f172a'};">${params.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ${params.currency}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Tipo</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${typeLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 14px; color: #64748b;">Scadenza</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${params.dueDate.toLocaleDateString('it-IT')}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #64748b;">Proposta</span>
                    <span style="float: right; font-size: 14px; font-weight: 600; color: #334155;">${params.proposalNumber}</span>
                  </td>
                </tr>
              </table>

              <!-- IBAN Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #92400e;">🏦 Coordinate per il bonifico</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 12px; color: #78350f; text-transform: uppercase; letter-spacing: 0.05em;">Beneficiario</span><br>
                          <span style="font-size: 14px; font-weight: 600; color: #92400e;">${params.iban.beneficiary}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 12px; color: #78350f; text-transform: uppercase; letter-spacing: 0.05em;">IBAN</span><br>
                          <span style="font-size: 16px; font-weight: 700; color: #0f172a; font-family: monospace; letter-spacing: 0.5px;">${params.iban.iban}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 12px; color: #78350f; text-transform: uppercase; letter-spacing: 0.05em;">BIC/SWIFT</span><br>
                          <span style="font-size: 14px; font-weight: 600; color: #92400e;">${params.iban.bic}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 12px; color: #78350f; text-transform: uppercase; letter-spacing: 0.05em;">Causale <span style="color: #dc2626;">(OBBLIGATORIA)</span></span><br>
                          <span style="font-size: 14px; font-weight: 700; color: #dc2626; font-family: monospace;">${params.iban.reference}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${isOverdue ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.6;">
                      <strong>Attenzione:</strong> Il ritardo nel pagamento potrebbe comportare la sospensione dei lavori
                      e l'applicazione degli interessi di mora (${process.env.LATE_PAYMENT_INTEREST || '8%'} annuo, D.Lgs. 231/2002).
                      Vi preghiamo di regolarizzare al più presto.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 24px 0 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Se avete già effettuato il pagamento, vi preghiamo di inviarci la contabile a
                <a href="mailto:amministrazione@zakstudio.com" style="color: #0f172a;">amministrazione@zakstudio.com</a>
                per accelerare la verifica.
              </p>

              <p style="margin: 16px 0 0; font-size: 14px; color: #334155; line-height: 1.6;">
                Per dubbi o necessità di rateizzazione:
                <a href="mailto:amministrazione@zakstudio.com" style="color: #0f172a;">amministrazione@zakstudio.com</a>
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
          <tr>
            <td style="text-align: center; font-size: 12px; color: #94a3b8;">
              ZAK Studio Web S.r.l. | zakstudio.com | amministrazione@zakstudio.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding: 16px;">
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          Comunicazione amministrativa.
          <a href="${process.env.APP_URL}/unsubscribe?email=${encodeURIComponent(params.to)}" style="color: #94a3b8;">Preferenze</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
${isOverdue ? 'SOLLECITO PAGAMENTO' : 'PROMEMORIA PAGAMENTO'} - ZAK Studio Web

Gentile ${params.contactName || params.companyName},

${isOverdue
  ? `Il ${typeLabel} per la proposta ${params.proposalNumber} risulta scaduto da ${params.daysOverdue} giorno${params.daysOverdue > 1 ? 'i' : ''}.`
  : `Vi ricordiamo che il ${typeLabel} per la proposta ${params.proposalNumber} scade il ${params.dueDate.toLocaleDateString('it-IT')}.`
}

Importo: € ${params.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} ${params.currency}
Scadenza: ${params.dueDate.toLocaleDateString('it-IT')}
Proposta: ${params.proposalNumber}

COORDINATE BONIFICO:
Beneficiario: ${params.iban.beneficiary}
IBAN: ${params.iban.iban}
BIC: ${params.iban.bic}
CAUSALE OBBLIGATORIA: ${params.iban.reference}

${isOverdue ? 'Attenzione: il ritardo può comportare sospensione lavori e interessi di mora.' : ''}

Se già pagato, inviate contabile a amministrazione@zakstudio.com

ZAK Studio Web S.r.l.
amministrazione@zakstudio.com | zakstudio.com
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ZAK Studio Web" <${process.env.SMTP_FROM || 'amministrazione@zakstudio.com'}>`,
      to: params.to,
      subject: `${isOverdue ? '⚠️ SOLLECITO' : '📅 Promemoria'} - ${typeLabel} ${params.proposalNumber} (€ ${params.amount.toLocaleString('it-IT')})`,
      text,
      html,
    });

    await logEmailSent({
      to: params.to,
      subject: `${isOverdue ? 'Sollicito' : 'Promemoria'} ${typeLabel} - ${params.proposalNumber}`,
      type: isOverdue ? 'payment_overdue' : 'payment_reminder',
      trackingId: info.messageId,
      proposalNumber: params.proposalNumber,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] Payment reminder error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Logs sent email to Google Sheets
 */
async function logEmailSent(data: {
  to: string;
  subject: string;
  type: string;
  trackingId?: string;
  proposalNumber?: string;
  dealId?: string;
}): Promise<void> {
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
          data.to,
          data.subject,
          data.type,
          data.trackingId || '',
          data.proposalNumber || '',
          data.dealId || '',
          'sent',
        ]],
      },
    });
  } catch (error) {
    console.error('[email] Log error:', error);
  }
}

/**
 * Fetches deal details from Google Sheets
 */
async function getDealDetails(dealId: string): Promise<{
  companyName: string;
  contactName: string;
  email: string;
  contractNumber: string;
  plan: string;
  totalValue: number;
} | null> {
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
          companyName: rows[i][2] || '',
          contactName: rows[i][3] || '',
          email: rows[i][4] || '',
          contractNumber: rows[i][5] || '',
          plan: rows[i][6] || 'business',
          totalValue: parseFloat(rows[i][7] || '0'),
        };
      }
    }
    return null;
  } catch (error) {
    console.error('[email] Get deal error:', error);
    return null;
  }
}