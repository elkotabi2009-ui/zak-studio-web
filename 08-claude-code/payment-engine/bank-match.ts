import { google } from 'googleapis';
import { parse } from 'csv-parse/sync';
import { Readable } from 'stream';

const SHEETS_ID = process.env.GOOGLE_SHEETS_TRACKING_ID!;

interface BankTransaction {
  date: Date;
  description: string;
  amount: number; // in cents
  currency: string;
  senderName: string;
  senderIban: string;
  reference: string;
  bankName: string;
}

interface PendingDeal {
  dealId: string;
  companyId: string;
  companyName: string;
  proposalNumber: string;
  expectedAmount: number; // in cents
  expectedCurrency: string;
  expectedIban: string;
  paymentType: 'deposit' | 'balance' | 'installment' | 'full';
  dueDate: Date;
  status: 'awaiting_payment' | 'partial' | 'overdue';
}

interface MatchResult {
  dealId: string;
  transaction: BankTransaction;
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
  matchReasons: string[];
  discrepancies: string[];
}

/**
 * Fetches bank transactions from CSV/statement
 * In production, this would connect to bank APIs (PSD2/Open Banking)
 */
export async function fetchBankTransactions(
  source: 'csv' | 'api' | 'manual',
  params?: { csvContent?: string; iban?: string; fromDate?: Date; toDate?: Date }
): Promise<BankTransaction[]> {
  if (source === 'csv' && params?.csvContent) {
    return parseCsvTransactions(params.csvContent);
  }

  if (source === 'api' && params?.iban) {
    return fetchFromBankApi(params.iban, params.fromDate, params.toDate);
  }

  // Manual entry fallback
  return [];
}

/**
 * Parses CSV bank statement (common Italian bank formats)
 */
function parseCsvTransactions(csvContent: string): BankTransaction[] {
  // Try multiple delimiters common in Italian banks
  const delimiters = [';', ',', '\t'];
  let records: any[] = [];

  for (const delimiter of delimiters) {
    try {
      records = parse(csvContent, {
        columns: true,
        delimiter,
        skip_empty_lines: true,
        trim: true,
      });
      if (records.length > 0) break;
    } catch {
      continue;
    }
  }

  return records.map(r => normalizeTransaction(r));
}

function normalizeTransaction(record: any): BankTransaction {
  // Handle various Italian bank column naming conventions
  const dateKeys = ['Data', 'Data Operazione', 'Data Valuta', 'Date', 'Data Contabile'];
  const descKeys = ['Descrizione', 'Operazione', 'Causale', 'Description', 'Dettaglio'];
  const amountKeys = ['Importo', 'Amount', 'Importo Operazione', 'Valore'];
  const currencyKeys = ['Valuta', 'Currency', 'Divisa'];
  const senderKeys = ['Ordinante', 'Beneficiario', 'Sender', 'Mittente', 'Intestatario'];
  const ibanKeys = ['IBAN Ordinante', 'IBAN', 'Iban', 'Conto Ordinante'];
  const refKeys = ['Riferimento', 'Reference', 'Causale', 'Note', 'Motivo'];
  const bankKeys = ['Banca', 'Bank', 'Istituto'];

  const getValue = (keys: string[]) => {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== '') return record[key];
    }
    return '';
  };

  const amountStr = getValue(amountKeys).replace(/[^\d.,-]/g, '').replace(',', '.');
  const amount = Math.round(parseFloat(amountStr) * 100);

  return {
    date: parseDate(getValue(dateKeys)),
    description: getValue(descKeys),
    amount,
    currency: getValue(currencyKeys) || 'EUR',
    senderName: getValue(senderKeys),
    senderIban: getValue(ibanKeys).replace(/\s/g, '').toUpperCase(),
    reference: getValue(refKeys),
    bankName: getValue(bankKeys),
  };
}

function parseDate(dateStr: string): Date {
  // Handle multiple date formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[1]) {
        return new Date(`${match[1]}-${match[2]}-${match[3]}`);
      }
      return new Date(`${match[3]}-${match[2]}-${match[1]}`);
    }
  }
  return new Date(); // fallback
}

/**
 * Mock bank API - replace with actual PSD2/Open Banking integration
 */
async function fetchFromBankApi(
  iban: string,
  fromDate?: Date,
  toDate?: Date
): Promise<BankTransaction[]> {
  // In production: integrate with bank APIs (Nexi, Fabrick, Salt Edge, Tink, etc.)
  console.log(`[bank-match] Fetching transactions for IBAN ${iban} via API`);
  return [];
}

/**
 * Fetches pending deals awaiting payment from Google Sheets
 */
export async function fetchPendingDeals(): Promise<PendingDeal[]> {
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
    const deals: PendingDeal[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const status = row[10] || ''; // Assuming status column
      if (['awaiting_payment', 'partial', 'overdue'].includes(status)) {
        deals.push({
          dealId: row[0],
          companyId: row[1],
          companyName: row[2],
          proposalNumber: row[3],
          expectedAmount: Math.round(parseFloat(row[5] || '0') * 100),
          expectedCurrency: row[6] || 'EUR',
          expectedIban: row[7] || '',
          paymentType: row[8] as any || 'deposit',
          dueDate: row[9] ? new Date(row[9]) : new Date(),
          status: status as any,
        });
      }
    }

    return deals;
  } catch (error) {
    console.error('[bank-match] Fetch pending deals error:', error);
    return [];
  }
}

/**
 * Matches bank transactions to pending deals
 */
export async function matchTransactionsToDeals(
  transactions: BankTransaction[],
  deals: PendingDeal[]
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  for (const transaction of transactions) {
    // Only consider incoming payments (positive amounts)
    if (transaction.amount <= 0) continue;

    let bestMatch: MatchResult | null = null;
    let bestScore = 0;

    for (const deal of deals) {
      const match = evaluateMatch(transaction, deal);
      if (match.confidence !== 'none' && getConfidenceScore(match.confidence) > bestScore) {
        bestScore = getConfidenceScore(match.confidence);
        bestMatch = match;
      }
    }

    if (bestMatch) {
      results.push(bestMatch);
    } else {
      // No match found - log for manual review
      results.push({
        dealId: 'UNMATCHED',
        transaction,
        confidence: 'none',
        matchReasons: [],
        discrepancies: ['Nessuna proposta corrispondente trovata'],
      });
    }
  }

  return results;
}

function evaluateMatch(transaction: BankTransaction, deal: PendingDeal): MatchResult {
  const reasons: string[] = [];
  const discrepancies: string[] = [];
  let score = 0;

  // 1. Amount match (exact or within tolerance)
  const amountDiff = Math.abs(transaction.amount - deal.expectedAmount);
  const amountTolerance = deal.expectedAmount * 0.02; // 2% tolerance
  if (amountDiff === 0) {
    score += 40;
    reasons.push('Importo esatto');
  } else if (amountDiff <= amountTolerance) {
    score += 30;
    reasons.push(`Importo entro tolleranza (diff: €${(amountDiff / 100).toFixed(2)})`);
  } else {
    discrepancies.push(`Importo non corrispondente: atteso €${(deal.expectedAmount / 100).toFixed(2)}, ricevuto €${(transaction.amount / 100).toFixed(2)}`);
  }

  // 2. Currency match
  if (transaction.currency === deal.expectedCurrency) {
    score += 10;
    reasons.push('Valuta corrispondente');
  } else {
    discrepancies.push(`Valuta diversa: attesa ${deal.expectedCurrency}, ricevuta ${transaction.currency}`);
  }

  // 3. IBAN match (company's IBAN in reference or sender IBAN known)
  const cleanExpectedIban = deal.expectedIban.replace(/\s/g, '').toUpperCase();
  const cleanSenderIban = transaction.senderIban.replace(/\s/g, '').toUpperCase();
  const refIbanMatch = transaction.reference.toUpperCase().includes(cleanExpectedIban.slice(-10));

  if (cleanSenderIban === cleanExpectedIban || refIbanMatch) {
    score += 25;
    reasons.push('IBAN corrispondente');
  } else if (transaction.reference.toUpperCase().includes(deal.proposalNumber.toUpperCase())) {
    score += 15;
    reasons.push('Numero proposta nel riferimento');
  } else {
    discrepancies.push('IBAN non verificabile');
  }

  // 4. Reference contains proposal number or company name
  const refUpper = transaction.reference.toUpperCase();
  const proposalInRef = refUpper.includes(deal.proposalNumber.toUpperCase());
  const companyInRef = refUpper.includes(deal.companyName.toUpperCase().slice(0, 10));
  const senderNameMatch = transaction.senderName.toUpperCase().includes(deal.companyName.toUpperCase().slice(0, 10));

  if (proposalInRef) {
    score += 15;
    reasons.push('Numero proposta nel riferimento');
  }
  if (companyInRef || senderNameMatch) {
    score += 10;
    reasons.push('Nome azienda mittente corrispondente');
  }

  // 5. Date within expected window (due date ± 14 days)
  const daysDiff = Math.abs((transaction.date.getTime() - deal.dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 14) {
    score += 10;
    reasons.push('Data pagamento entro finestra attesa');
  } else if (daysDiff <= 30) {
    score += 5;
    reasons.push('Data pagamento vicina a scadenza');
  } else {
    discrepancies.push(`Pagamento fuori finestra: ${daysDiff.toFixed(0)} giorni dalla scadenza`);
  }

  // Determine confidence
  let confidence: MatchResult['confidence'] = 'none';
  if (score >= 80) confidence = 'exact';
  else if (score >= 60) confidence = 'high';
  else if (score >= 40) confidence = 'medium';
  else if (score >= 20) confidence = 'low';

  return {
    dealId: deal.dealId,
    transaction,
    confidence,
    matchReasons: reasons,
    discrepancies,
  };
}

function getConfidenceScore(confidence: MatchResult['confidence']): number {
  const scores = { exact: 100, high: 75, medium: 50, low: 25, none: 0 };
  return scores[confidence];
}

/**
 * Auto-confirms high-confidence matches and updates deal status
 */
export async function autoConfirmMatches(results: MatchResult[]): Promise<{
  confirmed: MatchResult[];
  needsReview: MatchResult[];
}> {
  const confirmed: MatchResult[] = [];
  const needsReview: MatchResult[] = [];

  for (const result of results) {
    if (result.confidence === 'exact' || result.confidence === 'high') {
      // Auto-confirm
      await updateDealPaymentStatus(result.dealId, 'confirmed', result);
      confirmed.push(result);
    } else if (result.confidence === 'medium' || result.confidence === 'low') {
      // Flag for manual review
      await flagForManualReview(result);
      needsReview.push(result);
    }
  }

  return { confirmed, needsReview };
}

async function updateDealPaymentStatus(
  dealId: string,
  status: string,
  match: MatchResult
): Promise<void> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Record payment
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: 'Payments!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          match.transaction.date.toISOString(),
          dealId,
          '', // companyId
          '', // proposalNumber
          '', // plan
          (match.transaction.amount / 100).toFixed(2),
          match.transaction.currency,
          'bank_transfer',
          '', // session
          '', // payment intent
          '', // invoice
          status,
          `Auto-matched: ${match.matchReasons.join(', ')}`,
        ]],
      },
    });

    // Update deal status
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: 'Deals!A:Z',
    });

    const rows = response.data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === dealId) {
        const newStatus = determineNewDealStatus(rows[i], match.transaction.amount);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEETS_ID,
          range: `Deals!K${i + 1}`, // Status column
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newStatus]] },
        });
        break;
      }
    }
  } catch (error) {
    console.error('[bank-match] Update deal status error:', error);
  }
}

function determineNewDealStatus(dealRow: string[], paidAmount: number): string {
  // Simple logic: if paid >= expected, mark as paid
  const expected = Math.round(parseFloat(dealRow[5] || '0') * 100);
  const currentPaid = Math.round(parseFloat(dealRow[11] || '0') * 100); // Assuming paid amount column
  const totalPaid = currentPaid + paidAmount;

  if (totalPaid >= expected) return 'paid';
  if (totalPaid > 0) return 'partial';
  return 'awaiting_payment';
}

async function flagForManualReview(match: MatchResult): Promise<void> {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEETS_ID,
      range: 'ManualReview!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          match.dealId,
          match.transaction.senderName,
          match.transaction.senderIban,
          (match.transaction.amount / 100).toFixed(2),
          match.transaction.currency,
          match.transaction.reference,
          match.confidence,
          match.matchReasons.join('; '),
          match.discrepancies.join('; '),
        ]],
      },
    });
  } catch (error) {
    console.error('[bank-match] Flag review error:', error);
  }
}

/**
 * Main reconciliation job - runs daily
 */
export async function runDailyReconciliation(): Promise<{
  processed: number;
  matched: number;
  needsReview: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Fetch transactions (from CSV upload or API)
    const transactions = await fetchBankTransactions('manual'); // In production: 'api' or 'csv'
    const deals = await fetchPendingDeals();

    if (transactions.length === 0) {
      return { processed: 0, matched: 0, needsReview: 0, errors: ['Nessuna transazione trovata'] };
    }

    const matches = await matchTransactionsToDeals(transactions, deals);
    const { confirmed, needsReview } = await autoConfirmMatches(matches);

    return {
      processed: transactions.length,
      matched: confirmed.length,
      needsReview: needsReview.length,
      errors,
    };
  } catch (error) {
    errors.push(`Reconciliation error: ${error}`);
    return { processed: 0, matched: 0, needsReview: 0, errors };
  }
}

/**
 * Manual reconciliation trigger for uploaded CSV
 */
export async function reconcileFromCsv(csvContent: string): Promise<MatchResult[]> {
  const transactions = await fetchBankTransactions('csv', { csvContent });
  const deals = await fetchPendingDeals();
  return matchTransactionsToDeals(transactions, deals);
}