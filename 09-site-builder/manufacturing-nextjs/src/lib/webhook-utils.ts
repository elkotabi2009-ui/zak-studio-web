import { createHmac, timingSafeEqual } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  if (!signature || !timestamp) return false;

  const expectedSignature = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function generateWebhookSignature(payload: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
}

export function isTimestampValid(timestamp: string, toleranceSeconds = 300): boolean {
  const webhookTime = parseInt(timestamp, 10) * 1000;
  const now = Date.now();
  return Math.abs(now - webhookTime) <= toleranceSeconds * 1000;
}