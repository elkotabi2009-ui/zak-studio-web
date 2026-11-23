import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { google } from 'googleapis';
import { sendPaymentConfirmationEmail, sendContractForSignature } from './email-sender';
import { generateContractPDF, generateProposalPDF } from './pdf-generator';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

interface PaymentMetadata {
  dealId: string;
  companyId: string;
  proposalNumber: string;
  plan: 'business' | 'enterprise';
  amount: number; // in cents
  currency: string;
  paymentType: 'deposit' | 'balance' | 'installment' | 'full';
  installmentNumber?: number;
  totalInstallments?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] Handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata as unknown as PaymentMetadata;
  if (!metadata?.dealId) return;

  const paymentData = {
    dealId: metadata.dealId,
    companyId: metadata.companyId,
    proposalNumber: metadata.proposalNumber,
    plan: metadata.plan,
    amount: session.amount_total || 0,
    currency: session.currency?.toUpperCase() || 'EUR',
    paymentType: metadata.paymentType,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    customerEmail: session.customer_details?.email || '',
    customerName: session.customer_details?.name || '',
    paidAt: new Date(),
    status: 'succeeded',
  };

  await recordPayment(paymentData);
  await updateDealStatus(metadata.dealId, 'payment_received');

  // Send payment confirmation email
  await sendPaymentConfirmationEmail({
    to: paymentData.customerEmail,
    companyName: paymentData.customerName,
    proposalNumber: metadata.proposalNumber,
    amount: paymentData.amount / 100,
    currency: paymentData.currency,
    paymentType: metadata.paymentType,
    paidAt: paymentData.paidAt,
  });

  // If deposit paid, send contract for signature
  if (metadata.paymentType === 'deposit') {
    await sendContractForSignature(metadata.dealId, metadata.proposalNumber);
  }

  // If full payment or balance paid, trigger delivery
  if (metadata.paymentType === 'balance' || metadata.paymentType === 'full') {
    await triggerSiteDelivery(metadata.dealId);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const metadata = paymentIntent.metadata as unknown as PaymentMetadata;
  if (!metadata?.dealId) return;

  // Avoid duplicate processing if already handled via checkout.session.completed
  const existing = await getPaymentRecord(metadata.dealId, paymentIntent.id);
  if (existing) return;

  const paymentData = {
    dealId: metadata.dealId,
    companyId: metadata.companyId,
    proposalNumber: metadata.proposalNumber,
    plan: metadata.plan,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency.toUpperCase(),
    paymentType: metadata.paymentType,
    stripePaymentIntentId: paymentIntent.id,
    customerEmail: paymentIntent.receipt_email || '',
    paidAt: new Date(paymentIntent.created * 1000),
    status: 'succeeded',
  };

  await recordPayment(paymentData);
  await updateDealStatus(metadata.dealId, 'payment_received');
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const metadata = paymentIntent.metadata as unknown as PaymentMetadata;
  if (!metadata?.dealId) return;

  const paymentData = {
    dealId: metadata.dealId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency.toUpperCase(),
    stripePaymentIntentId: paymentIntent.id,
    errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
    failedAt: new Date(),
    status: 'failed',
  };

  await recordFailedPayment(paymentData);
  await updateDealStatus(metadata.dealId, 'payment_failed');

  // Notify sales team
  await notifySalesTeam('payment_failed', metadata.dealId, paymentData.errorMessage);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Handle recurring payments (installments)
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const metadata = subscription.metadata as unknown as PaymentMetadata;

    if (metadata?.dealId) {
      const paymentData = {
        dealId: metadata.dealId,
        amount: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        stripeInvoiceId: invoice.id,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        status: 'succeeded',
      };

      await recordPayment(paymentData);
    }
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  // Handle installment plan changes
  const metadata = subscription.metadata as unknown as PaymentMetadata;
  if (metadata?.dealId) {
    await recordSubscriptionChange(metadata.dealId, subscription);
  }
}

async function recordPayment(data: {
  dealId: string;
  companyId?: string;
  proposalNumber?: string;
  plan?: string;
  amount: number;
  currency: string;
  paymentType?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  customerEmail?: string;
  customerName?: string;
  paidAt: Date;
  status: string;
}): Promise<void> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: 'Payments!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.paidAt.toISOString(),
          data.dealId,
          data.companyId || '',
          data.proposalNumber || '',
          data.plan || '',
          (data.amount / 100).toFixed(2),
          data.currency,
          data.paymentType || '',
          data.stripeSessionId || '',
          data.stripePaymentIntentId || '',
          data.stripeInvoiceId || '',
          data.status,
          data.customerEmail || '',
        ]],
      },
    });
  } catch (error) {
    console.error('[payment] Record error:', error);
  }
}

async function recordFailedPayment(data: {
  dealId: string;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  errorMessage: string;
  failedAt: Date;
  status: string;
}): Promise<void> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: 'Payments!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          data.failedAt.toISOString(),
          data.dealId,
          '', '', '',
          (data.amount / 100).toFixed(2),
          data.currency,
          'failed',
          '',
          data.stripePaymentIntentId,
          '',
          data.status,
          data.errorMessage,
        ]],
      },
    });
  } catch (error) {
    console.error('[payment] Record failed error:', error);
  }
}

async function recordSubscriptionChange(dealId: string, subscription: Stripe.Subscription): Promise<void> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: 'SubscriptionChanges!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          dealId,
          subscription.id,
          subscription.status,
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : '',
          subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : '',
          JSON.stringify(subscription.metadata),
        ]],
      },
    });
  } catch (error) {
    console.error('[payment] Subscription change error:', error);
  }
}

async function getPaymentRecord(dealId: string, paymentIntentId: string): Promise<boolean> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Payments!A:M',
    });

    const rows = response.data.values || [];
    return rows.some(row => row[9] === paymentIntentId); // stripePaymentIntentId column
  } catch {
    return false;
  }
}

async function updateDealStatus(dealId: string, status: string): Promise<void> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    // Find and update deal row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Deals!A:Z',
    });

    const rows = response.data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === dealId) { // Assuming dealId is in column A
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEETS_ID,
          range: `Deals!${String.fromCharCode(65 + (rows[i].length - 1))}${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[status]] },
        });
        break;
      }
    }
  } catch (error) {
    console.error('[payment] Update deal status error:', error);
  }
}

async function triggerSiteDelivery(dealId: string): Promise<void> {
  // This will be called by the delivery pipeline
  console.log('[payment] Triggering site delivery for deal:', dealId);
  // The master orchestrator will pick this up
}

async function notifySalesTeam(type: string, dealId: string, message: string): Promise<void> {
  console.log(`[payment] Sales notification: ${type} for deal ${dealId}: ${message}`);
  // In production: send to Slack, email, CRM
}