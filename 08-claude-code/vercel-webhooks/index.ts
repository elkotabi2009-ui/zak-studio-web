/**
 * Vercel Webhooks - Main Entry Point
 * Exports email webhook and unsubscribe handlers
 */

export {
  POST as emailWebhook,
  GET as unsubscribeHandler
} from './email-webhook';