/**
 * Payment Engine - Main Entry Point
 * Exports all payment processing modules
 */

export {
  POST as stripeWebhook
} from './stripe-webhook';

export {
  fetchBankTransactions,
  fetchPendingDeals,
  matchTransactionsToDeals,
  autoConfirmMatches,
  runDailyReconciliation,
  reconcileFromCsv
} from './bank-match';

export {
  generateProposalPDF,
  saveProposalPDF
} from './generate-proposal-pdf';

export {
  generateContractPDF,
  saveContractPDF
} from './generate-contract-pdf';

export {
  sendPaymentConfirmationEmail,
  sendContractForSignature,
  sendSiteDeliveryEmail,
  sendPaymentReminderEmail
} from './email-sender';

export {
  dealStateMachine,
  DealStatus,
  DealEvent,
  startOrchestrator
} from './deal-state';

export type {
  Deal,
  TransitionResult,
  PaymentMetadata
} from './deal-state';