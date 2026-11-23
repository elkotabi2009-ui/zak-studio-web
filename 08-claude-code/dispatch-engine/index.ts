export { sendEmail, sendBulkEmails, generateUnsubscribeUrl, validateUnsubscribeToken, isTokenExpired } from './sender';
export { emailQueue, type QueuedEmail, type QueueStats } from './queue';
export { emailTracker, type TrackingEvent, type LeadTrackingSummary } from './tracker';
export { suppressionList, type SuppressionEntry } from './suppression';
export { bounceHandler, type BounceData, type BounceClassification } from './bounce-handler';
export { complaintHandler, type ComplaintData } from './complaint-handler';
export { replyHandler, type ReplyData, type ReplyClassification } from './reply-handler';
export { warmupManager, type WarmupConfig, type WarmupContact } from './warmup';

import { emailQueue } from './queue';
import { emailTracker } from './tracker';
import { suppressionList } from './suppression';
import { bounceHandler } from './bounce-handler';
import { complaintHandler } from './complaint-handler';
import { replyHandler } from './reply-handler';
import { warmupManager } from './warmup';
import { sendBulkEmails } from './sender';

export async function initializeDispatchEngine(): Promise<void> {
  console.log('[dispatch-engine] Initializing...');

  await Promise.all([
    emailQueue.initialize(),
    emailTracker.initialize(),
    suppressionList.initialize(),
    bounceHandler.initialize(),
    complaintHandler.initialize(),
    replyHandler.initialize(),
    warmupManager.initialize(),
  ]);

  console.log('[dispatch-engine] All modules initialized');

  // Start warmup if not complete
  if (!warmupManager.isWarmupComplete()) {
    console.log('[dispatch-engine] Starting warmup scheduler...');
    startWarmupScheduler();
  }

  // Start queue processor
  console.log('[dispatch-engine] Starting queue processor...');
  startQueueProcessor();
}

function startWarmupScheduler(): void {
  // Run warmup every day at 9 AM
  const runWarmup = async () => {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(9, 0, 0, 0);
    if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      try {
        const result = await warmupManager.runDailyWarmup();
        console.log(`[warmup] Daily run complete: sent=${result.sent}, failed=${result.failed}`);
      } catch (error) {
        console.error('[warmup] Daily run error:', error);
      }
      startWarmupScheduler(); // Schedule next
    }, delay);
  };

  runWarmup();
}

function startQueueProcessor(): void {
  const processQueue = async () => {
    if (emailQueue.isProcessing()) return;

    emailQueue.setProcessing(true);

    try {
      const pendingEmails = emailQueue.getPendingEmails(20);

      if (pendingEmails.length > 0) {
        console.log(`[queue] Processing ${pendingEmails.length} emails...`);

        // Convert to sendable format
        const toSend = pendingEmails.map(e => ({
          to: e.to,
          toName: e.toName,
          subject: e.subject,
          html: e.html,
          text: e.text,
          headers: e.headers,
          tags: e.tags,
          trackingId: e.trackingId,
        }));

        const results = await sendBulkEmails(toSend, { delayMs: 2000, maxConcurrent: 3 });

        for (let i = 0; i < pendingEmails.length; i++) {
          const email = pendingEmails[i];
          const result = results[i];
          if (result.success) {
            await emailQueue.updateStatus(email.trackingId, 'sent');
          } else {
            await emailQueue.updateStatus(email.trackingId, 'failed', result.error);
          }
        }
      }
    } catch (error) {
      console.error('[queue] Processor error:', error);
    } finally {
      emailQueue.setProcessing(false);

      // Schedule next run (1-2 minutes)
      setTimeout(processQueue, 60000 + Math.random() * 60000);
    }
  };

  processQueue();
}

export async function handleAgentMailWebhook(payload: any): Promise<void> {
  const webhookType = payload.type;

  switch (webhookType) {
    case 'message.sent':
    case 'message.delivered':
    case 'message.opened':
    case 'message.clicked':
    case 'message.bounced':
    case 'message.complained':
    case 'message.unsubscribed':
    case 'message.replied':
      await emailTracker.handleWebhook(payload);
      break;

    case 'message.bounced':
      await bounceHandler.handleBounce({
        trackingId: payload.trackingId,
        email: payload.email,
        type: payload.bounceType === 'permanent' ? 'hard' : 'soft',
        code: payload.bounceCode,
        message: payload.bounceMessage,
        timestamp: new Date(payload.timestamp),
      });
      break;

    case 'message.complained':
      await complaintHandler.handleComplaint({
        trackingId: payload.trackingId,
        email: payload.email,
        type: payload.complaintType,
        feedbackReport: payload.feedbackReport,
        timestamp: new Date(payload.timestamp),
      });
      break;

    case 'message.replied':
      await replyHandler.handleReply({
        trackingId: payload.trackingId,
        fromEmail: payload.fromEmail,
        fromName: payload.fromName,
        subject: payload.subject,
        bodyText: payload.bodyText,
        bodyHtml: payload.bodyHtml,
        inReplyTo: payload.inReplyTo,
        references: payload.references,
        timestamp: new Date(payload.timestamp),
        headers: payload.headers,
      });
      break;
  }
}

export async function handleUnsubscribeRequest(params: {
  email: string;
  trackingId: string;
  timestamp: string;
  sig: string;
}): Promise<{ success: boolean; message: string }> {
  const result = await emailTracker.handleUnsubscribe(params);

  if (result.valid) {
    return { success: true, message: 'Disiscrizione completata con successo' };
  } else {
    return { success: false, message: result.reason || 'Token non valido o scaduto' };
  }
}