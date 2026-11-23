import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface ProposalData {
  proposalNumber: string;
  date: string;
  validUntil: string;

  // Sender (ZAK Studio Web)
  sender: {
    companyName: string;
    address: string;
    vatNumber: string;
    email: string;
    phone: string;
    website: string;
    pec: string;
    sdiCode: string;
  };

  // Client
  client: {
    companyName: string;
    contactName: string;
    role: string;
    address: string;
    vatNumber: string;
    email: string;
    phone: string;
    sdiCode?: string;
    pec?: string;
  };

  // Project details
  project: {
    title: string;
    description: string;
    sector: string;
    painPoints: string[];
    objectives: string[];
    deliverables: Deliverable[];
    timeline: TimelinePhase[];
    assumptions: string[];
    exclusions: string[];
  };

  // Commercial
  commercial: {
    plan: 'business' | 'enterprise';
    setupFee: number; // in EUR
    monthlyFee: number; // in EUR
    currency: string;
    paymentTerms: string; // e.g., "50% deposit, 50% on delivery"
    depositPercent: number;
    vatRate: number; // e.g., 22
    billingCycle: 'monthly' | 'quarterly' | 'annual';
    contractDurationMonths: number;
    autoRenewal: boolean;
  };

  // ROI & Value
  roi: {
    estimatedMonthlyVisitors: number;
    estimatedConversionRate: number;
    averageOrderValue: number;
    estimatedMonthlyRevenue: number;
    estimatedAnnualRevenue: number;
    paybackPeriodMonths: number;
  };

  // Next steps
  nextSteps: string[];

  // IBAN for payment
  iban: {
    beneficiary: string;
    iban: string;
    bic: string;
    bankName: string;
    reference: string;
  };
}

interface Deliverable {
  name: string;
  description: string;
  included: boolean;
}

interface TimelinePhase {
  phase: number;
  name: string;
  duration: string;
  description: string;
  deliverables: string[];
}

/**
 * Generates a formal commercial proposal PDF
 */
export async function generateProposalPDF(data: ProposalData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  let y = pageHeight - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Helper functions
  const drawText = (text: string, x: number, y: number, options: {
    font?: any;
    size?: number;
    color?: any;
    maxWidth?: number;
    lineHeight?: number;
  } = {}) => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    const color = options.color || rgb(0, 0, 0);
    const maxWidth = options.maxWidth || contentWidth;
    const lineHeight = options.lineHeight || size * 1.4;

    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const width = font.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && line !== '') {
        page.drawText(line, { x, y: currentY, size, font, color });
        currentY -= lineHeight;
        line = word + ' ';

        if (currentY < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
    }

    return currentY;
  };

  const drawLine = (y: number, color = rgb(0.8, 0.8, 0.8)) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color,
    });
  };

  const addSpace = (currentY: number, lines: number = 1): number => {
    return currentY - (lines * 14);
  };

  const checkNewPage = (currentY: number, neededSpace: number = 50): number => {
    if (currentY < margin + neededSpace) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      return pageHeight - margin;
    }
    return currentY;
  };

  // ========== HEADER ==========
  // Logo placeholder
  page.drawRectangle({
    x: margin,
    y: y - 40,
    width: 80,
    height: 40,
    color: rgb(0.15, 0.25, 0.45),
  });
  page.drawText('ZAK', {
    x: margin + 10,
    y: y - 28,
    size: 20,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });
  page.drawText('STUDIO WEB', {
    x: margin + 10,
    y: y - 42,
    size: 8,
    font: helvetica,
    color: rgb(0.8, 0.9, 1),
  });

  // Company info right side
  let rightY = y - 10;
  rightY = drawText(data.sender.companyName, pageWidth - margin - 200, rightY, {
    font: helveticaBold, size: 12, maxWidth: 200
  });
  rightY = drawText(data.sender.address, pageWidth - margin - 200, rightY, {
    font: helvetica, size: 8, maxWidth: 200
  });
  rightY = drawText(`P.IVA: ${data.sender.vatNumber}`, pageWidth - margin - 200, rightY, {
    font: helvetica, size: 8, maxWidth: 200
  });
  rightY = drawText(data.sender.email, pageWidth - margin - 200, rightY, {
    font: helvetica, size: 8, maxWidth: 200
  });
  rightY = drawText(data.sender.website, pageWidth - margin - 200, rightY, {
    font: helvetica, size: 8, maxWidth: 200
  });

  y -= 60;
  drawLine(y);
  y -= 20;

  // ========== PROPOSAL TITLE ==========
  y = drawText('PROPOSTA COMMERCIALE', margin, y, {
    font: helveticaBold, size: 22, color: rgb(0.15, 0.25, 0.45)
  });
  y = drawText(`N. ${data.proposalNumber} del ${data.date}`, margin, y, {
    font: helvetica, size: 11, color: rgb(0.4, 0.4, 0.4)
  });
  y = drawText(`Valida fino al: ${data.validUntil}`, margin, y, {
    font: helvetica, size: 11, color: rgb(0.4, 0.4, 0.4)
  });
  y -= 10;
  drawLine(y);
  y -= 20;

  // ========== CLIENT INFO ==========
  y = drawText('DESTINATARIO', margin, y, {
    font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45)
  });
  y = drawText(data.client.companyName, margin, y, { font: helveticaBold, size: 11 });
  y = drawText(`Att.ne: ${data.client.contactName} - ${data.client.role}`, margin, y, { font: helvetica, size: 10 });
  y = drawText(data.client.address, margin, y, { font: helvetica, size: 9 });
  y = drawText(`P.IVA: ${data.client.vatNumber}`, margin, y, { font: helvetica, size: 9 });
  y = drawText(`Email: ${data.client.email} | Tel: ${data.client.phone}`, margin, y, { font: helvetica, size: 9 });
  if (data.client.sdiCode) {
    y = drawText(`Codice SDI: ${data.client.sdiCode}`, margin, y, { font: helvetica, size: 9 });
  }
  if (data.client.pec) {
    y = drawText(`PEC: ${data.client.pec}`, margin, y, { font: helvetica, size: 9 });
  }
  y -= 15;
  drawLine(y);
  y -= 15;

  // ========== EXECUTIVE SUMMARY ==========
  y = drawText('SINTESI ESECUTIVA', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 5;

  const summaryText = `Gentile ${data.client.contactName},\n\n` +
    `Ringraziamo per l'interesse dimostrato verso i nostri servizi. Questa proposta descrive la soluzione "${data.project.title}" ` +
    `progettata specificamente per ${data.client.companyName}, con l'obiettivo di ${data.project.objectives[0].toLowerCase()}` +
    (data.project.objectives.length > 1 ? ` e ${data.project.objectives[1].toLowerCase()}` : '') + `.\n\n` +
    `L'investimento previsto è di €${data.commercial.setupFee.toLocaleString()} per l'implementazione iniziale ` +
    `e €${data.commercial.monthlyFee.toLocaleString()}/${data.commercial.billingCycle === 'monthly' ? 'mese' : data.commercial.billingCycle === 'quarterly' ? 'trimestre' : 'anno'} ` +
    `per la gestione continuativa, con un ROI stimato di €${data.roi.estimatedAnnualRevenue.toLocaleString()}/anno ` +
    `(payback: ${data.roi.paybackPeriodMonths} mesi).`;

  y = drawText(summaryText, margin, y, { font: helvetica, size: 10, lineHeight: 15 });
  y -= 15;
  drawLine(y);
  y -= 15;

  // ========== PROJECT CONTEXT ==========
  y = drawText('CONTESTO E ANALISI DEI BISOGNI', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 5;

  y = drawText('Settore:', margin, y, { font: helveticaBold, size: 10 });
  y = drawText(data.project.sector, margin + 10, y, { font: helvetica, size: 10 });
  y -= 5;

  y = drawText('Problematiche identificate:', margin, y, { font: helveticaBold, size: 10 });
  for (const pain of data.project.painPoints) {
    y = drawText(`• ${pain}`, margin + 10, y, { font: helvetica, size: 10 });
  }
  y -= 5;

  y = drawText('Obiettivi del progetto:', margin, y, { font: helveticaBold, size: 10 });
  for (const obj of data.project.objectives) {
    y = drawText(`• ${obj}`, margin + 10, y, { font: helvetica, size: 10 });
  }
  y -= 10;
  drawLine(y);
  y -= 10;

  // ========== SOLUTION & DELIVERABLES ==========
  y = checkNewPage(y, 100);
  y = drawText('SOLUZIONE PROPOSTA E CONSEGNE', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 5;

  y = drawText(`Piano: ${data.commercial.plan === 'business' ? 'Business' : 'Enterprise'}`, margin, y, {
    font: helvetica, size: 10
  });
  y -= 10;

  // Deliverables table header
  const colWidths = [200, 250, 60];
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1]];

  page.drawRectangle({
    x: margin, y: y - 20, width: contentWidth, height: 20,
    color: rgb(0.15, 0.25, 0.45),
  });
  page.drawText('CONSEGNA', { x: colX[0] + 5, y: y - 14, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('DESCRIZIONE', { x: colX[1] + 5, y: y - 14, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('INCLUSO', { x: colX[2] + 5, y: y - 14, size: 9, font: helveticaBold, color: rgb(1, 1, 1) });
  y -= 25;

  for (const deliverable of data.project.deliverables) {
    y = checkNewPage(y, 30);

    const includedText = deliverable.included ? '✓ Sì' : '✗ No';
    const rowColor = deliverable.included ? rgb(0.95, 1, 0.95) : rgb(1, 0.95, 0.95);

    page.drawRectangle({
      x: margin, y: y - 20, width: contentWidth, height: 20,
      color: rowColor,
    });

    page.drawText(deliverable.name, { x: colX[0] + 5, y: y - 14, size: 9, font: helveticaBold });
    page.drawText(deliverable.description, { x: colX[1] + 5, y: y - 14, size: 8, font: helvetica });
    page.drawText(includedText, { x: colX[2] + 5, y: y - 14, size: 9, font: helvetica,
      color: deliverable.included ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0) });

    y -= 22;
  }
  y -= 10;
  drawLine(y);
  y -= 15;

  // ========== TIMELINE ==========
  y = checkNewPage(y, 100);
  y = drawText('CRONOPROGRAMMA DI REALIZZAZIONE', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 10;

  for (const phase of data.project.timeline) {
    y = checkNewPage(y, 40);
    y = drawText(`Fase ${phase.phase}: ${phase.name} (${phase.duration})`, margin, y, {
      font: helveticaBold, size: 10
    });
    y = drawText(phase.description, margin + 10, y, { font: helvetica, size: 9 });
    for (const del of phase.deliverables) {
      y = drawText(`→ ${del}`, margin + 20, y, { font: helvetica, size: 9 });
    }
    y -= 8;
  }
  y -= 10;
  drawLine(y);
  y -= 15;

  // ========== INVESTMENT ==========
  y = checkNewPage(y, 150);
  y = drawText('INVESTIMENTO E CONDIZIONI COMMERCIALI', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 10;

  // Investment summary box
  const boxY = y - 120;
  page.drawRectangle({
    x: margin, y: boxY, width: contentWidth, height: 120,
    color: rgb(0.98, 0.98, 1),
    borderColor: rgb(0.15, 0.25, 0.45),
    borderWidth: 1,
  });

  let boxTextY = boxY + 100;
  boxTextY = drawText('COSTO DI ATTIVAZIONE (Una tantum)', margin + 10, boxTextY, {
    font: helveticaBold, size: 10
  });
  boxTextY = drawText(`€ ${data.commercial.setupFee.toLocaleString()} ${data.commercial.currency}`, margin + 10, boxTextY, {
    font: helveticaBold, size: 18, color: rgb(0.15, 0.25, 0.45)
  });
  boxTextY = drawText(`Fee mensile: € ${data.commercial.monthlyFee.toLocaleString()} ${data.commercial.currency}/${data.commercial.billingCycle === 'monthly' ? 'mese' : data.commercial.billingCycle === 'quarterly' ? 'trimestre' : 'anno'}`, margin + 10, boxTextY, {
    font: helvetica, size: 10
  });
  boxTextY = drawText(`Durata contratto: ${data.commercial.contractDurationMonths} mesi ${data.commercial.autoRenewal ? '(rinnovo automatico)' : ''}`, margin + 10, boxTextY, {
    font: helvetica, size: 9
  });
  boxTextY = drawText(`IVA ${data.commercial.vatRate}% esclusa`, margin + 10, boxTextY, {
    font: helvetica, size: 9, color: rgb(0.5, 0.5, 0.5)
  });

  y = boxY - 20;

  // Payment terms
  y = drawText('MODALITÀ DI PAGAMENTO', margin, y, { font: helveticaBold, size: 11 });
  y -= 5;

  const payments = data.commercial.paymentTerms.split(',').map(p => p.trim());
  for (const payment of payments) {
    y = drawText(`• ${payment}`, margin + 10, y, { font: helvetica, size: 10 });
  }
  y -= 10;

  // Deposit detail
  const depositAmount = data.commercial.setupFee * (data.commercial.depositPercent / 100);
  y = drawText(`Acconto (${data.commercial.depositPercent}%): € ${depositAmount.toLocaleString()} ${data.commercial.currency} + IVA`, margin + 10, y, {
    font: helveticaBold, size: 10, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 15;
  drawLine(y);
  y -= 15;

  // ========== ROI PROJECTION ==========
  y = checkNewPage(y, 100);
  y = drawText('PROIEZIONE ROI E VALORE ATTESO', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 10;

  const roiItems = [
    ['Visitatori mensili stimati', data.roi.estimatedMonthlyVisitors.toLocaleString()],
    ['Tasso di conversione stimato', `${data.roi.estimatedConversionRate}%`],
    ['Valore medio ordine', `€ ${data.roi.averageOrderValue.toLocaleString()}`],
    ['Fatturato mensile stimato', `€ ${data.roi.estimatedMonthlyRevenue.toLocaleString()}`],
    ['Fatturato annuale stimato', `€ ${data.roi.estimatedAnnualRevenue.toLocaleString()}`],
    ['Periodo di payback', `${data.roi.paybackPeriodMonths} mesi`],
  ];

  for (const [label, value] of roiItems) {
    y = checkNewPage(y, 25);
    page.drawRectangle({
      x: margin, y: y - 22, width: contentWidth, height: 22,
      color: y % 44 < 22 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1),
    });
    page.drawText(label, { x: margin + 15, y: y - 16, size: 9, font: helvetica });
    page.drawText(value, { x: margin + 300, y: y - 16, size: 9, font: helveticaBold });
    y -= 25;
  }
  y -= 10;
  drawLine(y);
  y -= 15;

  // ========== IBAN & PAYMENT DETAILS ==========
  y = checkNewPage(y, 120);
  y = drawText('DATI PER IL PAGAMENTO', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 10;

  // IBAN Box
  page.drawRectangle({
    x: margin, y: y - 100, width: contentWidth, height: 100,
    color: rgb(1, 0.98, 0.95),
    borderColor: rgb(0.8, 0.6, 0.2),
    borderWidth: 1.5,
  });

  let ibanY = y - 20;
  ibanY = drawText('BENEFICIARIO:', margin + 15, ibanY, { font: helveticaBold, size: 9 });
  ibanY = drawText(data.iban.beneficiary, margin + 15, ibanY, { font: helvetica, size: 11 });
  ibanY -= 5;
  ibanY = drawText('IBAN:', margin + 15, ibanY, { font: helveticaBold, size: 9 });
  ibanY = drawText(data.iban.iban, margin + 15, ibanY, { font: helveticaBold, size: 12, color: rgb(0.15, 0.25, 0.45) });
  ibanY = drawText(`BIC/SWIFT: ${data.iban.bic} | Banca: ${data.iban.bankName}`, margin + 15, ibanY, { font: helvetica, size: 9 });
  ibanY -= 5;
  ibanY = drawText('CAUSALE OBBLIGATORIA:', margin + 15, ibanY, { font: helveticaBold, size: 9, color: rgb(0.8, 0, 0) });
  ibanY = drawText(data.iban.reference, margin + 15, ibanY, { font: helveticaBold, size: 10 });

  y -= 120;

  // ========== TERMS & CONDITIONS ==========
  y = checkNewPage(y, 200);
  y = drawText('CONDIZIONI GENERALI', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 10;

  const terms = [
    '1. Questa proposta ha validità fino alla data indicata in testata.',
    '2. L\'accettazione comporta la sottoscrizione del contratto di fornitura allegato.',
    '3. I prezzi si intendono IVA esclusa (aliquota attuale ' + data.commercial.vatRate + '%).',
    '4. Il pagamento dell\'acconto conferma l\'avvio dei lavori.',
    '5. Eventuali variazioni al perimetro saranno quotate separatamente.',
    '6. La proprietà intellettuale del codice e del design passa al cliente a saldo completo.',
    '7. Foro competente: Tribunale di Milano.',
    '8. Trattamento dati personali ai sensi del GDPR (UE 2016/679) e D.Lgs 196/2003.',
  ];

  for (const term of terms) {
    y = checkNewPage(y, 20);
    y = drawText(term, margin, y, { font: helvetica, size: 9, lineHeight: 14 });
  }
  y -= 15;

  // ========== NEXT STEPS ==========
  y = checkNewPage(y, 100);
  y = drawText('PROSSIMI PASSI', margin, y, {
    font: helveticaBold, size: 13, color: rgb(0.15, 0.25, 0.45)
  });
  y -= 10;

  for (let i = 0; i < data.nextSteps.length; i++) {
    y = checkNewPage(y, 25);
    y = drawText(`${i + 1}. ${data.nextSteps[i]}`, margin, y, { font: helvetica, size: 10 });
  }
  y -= 20;

  // ========== SIGNATURES ==========
  y = checkNewPage(y, 100);
  drawLine(y);
  y -= 20;

  y = drawText('PER ACCETTAZIONE', margin, y, { font: helveticaBold, size: 11 });
  y -= 10;
  y = drawText(`${data.sender.companyName}`, margin, y, { font: helvetica, size: 10 });
  y = drawText('__________________________', margin, y, { font: helvetica, size: 10 });
  y = drawText('Luogo e data', margin, y, { font: helvetica, size: 9 });
  y = drawText('Firma e timbro', margin, y, { font: helvetica, size: 9 });
  y -= 30;

  y = drawText(`${data.client.companyName}`, margin, y, { font: helvetica, size: 10 });
  y = drawText('__________________________', margin, y, { font: helvetica, size: 10 });
  y = drawText('Luogo e data', margin, y, { font: helvetica, size: 9 });
  y = drawText('Firma e timbro', margin, y, { font: helvetica, size: 9 });

  // ========== FOOTER ==========
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdfDoc.getPage(i);
    p.drawText(
      `ZAK Studio Web | ${data.sender.website} | ${data.sender.email} | Pag. ${i + 1}/${totalPages}`,
      { x: margin, y: 30, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) }
    );
    p.drawText(
      `Proposta ${data.proposalNumber} - Riservata - ${data.date}`,
      { x: pageWidth - margin - 200, y: 30, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) }
    );
  }

  return pdfDoc.save();
}

/**
 * Saves PDF to file system
 */
export async function saveProposalPDF(pdfBytes: Uint8Array, proposalNumber: string): Promise<string> {
  const dir = path.join(process.cwd(), 'generated', 'proposals');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `Proposta_${proposalNumber}.pdf`);
  await fs.writeFile(filePath, pdfBytes);
  return filePath;
}