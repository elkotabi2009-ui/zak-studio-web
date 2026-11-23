import { NextRequest, NextResponse } from 'next/server';
import { handleAgentMailWebhook, handleUnsubscribeRequest } from '@/dispatch-engine/index';
import { verifyWebhookSignature } from '@/lib/webhook-utils';

const WEBHOOK_SECRET = process.env.AGENTMAIL_WEBHOOK_SECRET!;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');
    const body = await request.text();

    if (!verifyWebhookSignature(body, signature || '', timestamp || '', WEBHOOK_SECRET)) {
      console.warn('[webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    await handleAgentMailWebhook(payload);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const trackingId = searchParams.get('trackingId');
  const timestamp = searchParams.get('timestamp');
  const sig = searchParams.get('sig');

  if (!email || !trackingId || !timestamp || !sig) {
    return NextResponse.redirect(new URL('/unsubscribe?error=missing_params', request.url));
  }

  const result = await handleUnsubscribeRequest({ email, trackingId, timestamp, sig });

  if (result.success) {
    return NextResponse.redirect(new URL('/unsubscribe?success=1', request.url));
  } else {
    return NextResponse.redirect(new URL(`/unsubscribe?error=${encodeURIComponent(result.message)}`, request.url));
  }
}