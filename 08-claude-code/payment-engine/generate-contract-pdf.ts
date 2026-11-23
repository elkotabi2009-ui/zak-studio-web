import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface ContractData {
  contractNumber: string;
  date: string;
  proposalNumber: string;

  // Provider (ZAK Studio Web)
  provider: {
    companyName: string;
    legalForm: string; // S.r.l., S.p.A., etc.
    address: string;
    vatNumber: string;
    taxCode: string;
    reaNumber: string;
    shareCapital: string;
    email: string;
    pec: string;
    website: string;
    sdiCode: string;
    representedBy: {
      name: string;
      role: string;
      taxCode: string;
    };
  };

  // Client
  client: {
    companyName: string;
    legalForm: string;
    address: string;
    vatNumber: string;
    taxCode: string;
    reaNumber?: string;
    email: string;
    pec?: string;
    sdiCode?: string;
    representedBy: {
      name: string;
      role: string;
      taxCode: string;
    };
  };

  // Service details
  service: {
    description: string;
    plan: 'business' | 'enterprise';
    deliverables: string[];
    timeline: string; // e.g., "60 giorni dalla data di attivazione"
    startDate: string;
    endDate?: string; // if fixed term
    autoRenewal: boolean;
    renewalNoticeDays: number;
  };

  // Commercial
  commercial: {
    setupFee: number;
    monthlyFee: number;
    currency: string;
    vatRate: number;
    billingCycle: 'monthly' | 'quarterly' | 'annual';
    paymentTerms: string;
    latePaymentInterest: number; // annual percentage
    depositPercent: number;
    depositAmount: number;
    depositDueDate: string;
    balanceDueDate: string;
  };

  // SLA
  sla: {
    uptime: string; // e.g., "99.9%"
    responseTimeHours: number;
    resolutionTimeHours: number;
    supportChannels: string[];
    businessHours: string; // e.g., "Lun-Ven 9:00-18:00 CET"
    excludedFromSla: string[];
  };

  // GDPR
  gdpr: {
    dpoContact: string;
    dataProcessingAddendum: boolean;
    dataRetentionMonths: number;
    subProcessors: string[];
  };

  // Terms
  terms: {
    terminationNoticeDays: number;
    penaltyClause: boolean;
    intellectualProperty: 'client' | 'provider' | 'shared';
    confidentialityYears: number;
    governingLaw: string;
    jurisdiction: string;
    language: string;
  };

  // Signatures
  signatures: {
    place: string;
    date: string;
    providerSignature: string;
    clientSignature: string;
  };
}

/**
 * Generates a formal B2B service contract PDF
 */
export async function generateContractPDF(data: ContractData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  let y = pageHeight - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  const drawText = (text: string, x: number, y: number, options: {
    font?: any;
    size?: number;
    color?: any;
    maxWidth?: number;
    lineHeight?: number;
    align?: 'left' | 'center' | 'right';
  } = {}): number => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    const color = options.color || rgb(0, 0, 0);
    const maxWidth = options.maxWidth || contentWidth;
    const lineHeight = options.lineHeight || size * 1.4;
    const align = options.align || 'left';

    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const width = font.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && line !== '') {
        let lineX = x;
        if (align === 'center') lineX = x + (maxWidth - font.widthOfTextAtSize(line, size)) / 2;
        else if (align === 'right') lineX = x + maxWidth - font.widthOfTextAtSize(line, size);

        page.drawText(line, { x: lineX, y: currentY, size, font, color });
        currentY -= lineHeight;
        line = word + ' ';

        if (currentY < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }
      } else {
        line = testLine;
      }
    }

    if (line.trim()) {
      let lineX = x;
      if (align === 'center') lineX = x + (maxWidth - font.widthOfTextAtSize(line.trim(), size)) / 2;
      else if (align === 'right') lineX = x + maxWidth - font.widthOfTextAtSize(line.trim(), size);

      page.drawText(line.trim(), { x: lineX, y: currentY, size, font, color });
      currentY -= lineHeight;
    }

    return currentY;
  };

  const drawLine = (y: number, color = rgb(0.8, 0.8, 0.8), thickness = 0.5) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness,
      color,
    });
  };

  const checkNewPage = (currentY: number, neededSpace: number = 60): number => {
    if (currentY < margin + neededSpace) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      return pageHeight - margin;
    }
    return currentY;
  };

  const addSpace = (currentY: number, lines: number = 1): number => {
    return currentY - (lines * 14);
  };

  // ========== HEADER ==========
  // Title
  y = drawText('CONTRATTO DI FORNITURA SERVIZI WEB E DIGITALI', margin, y, {
    font: helveticaBold, size: 16, color: rgb(0.15, 0.25, 0.45), align: 'center'
  });
  y -= 5;
  y = drawText(`Contratto N. ${data.contractNumber} - Proposta N. ${data.proposalNumber}`, margin, y, {
    font: helvetica, size: 10, color: rgb(0.4, 0.4, 0.4), align: 'center'
  });
  y = drawText(`Del ${data.date}`, margin, y, {
    font: helvetica, size: 10, color: rgb(0.4, 0.4, 0.4), align: 'center'
  });
  y -= 15;
  drawLine(y, rgb(0.15, 0.25, 0.45), 1.5);
  y -= 20;

  // ========== PARTIES ==========
  y = drawText('TRA', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y = drawText('IL FORNITORE', margin, y, { font: helveticaBold, size: 12 });
  y -= 5;

  const providerInfo = [
    `${data.provider.companyName} ${data.provider.legalForm}`,
    `Sede legale: ${data.provider.address}`,
    `P.IVA: ${data.provider.vatNumber} | Cod. Fiscale: ${data.provider.taxCode}`,
    `REA: ${data.provider.reaNumber} | Cap. Soc.: ${data.provider.shareCapital}`,
    `Email: ${data.provider.email} | PEC: ${data.provider.pec}`,
    `Sito web: ${data.provider.website} | Codice SDI: ${data.provider.sdiCode}`,
    `Rappresentato da: ${data.provider.representedBy.name}, ${data.provider.representedBy.role} (CF: ${data.provider.representedBy.taxCode})`,
  ];

  for (const info of providerInfo) {
    y = drawText(info, margin + 10, y, { font: helvetica, size: 9 });
  }
  y -= 15;

  y = drawText('E', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45), align: 'center' });
  y -= 10;

  y = drawText('IL CLIENTE', margin, y, { font: helveticaBold, size: 12 });
  y -= 5;

  const clientInfo = [
    `${data.client.companyName} ${data.client.legalForm}`,
    `Sede legale: ${data.client.address}`,
    `P.IVA: ${data.client.vatNumber} | Cod. Fiscale: ${data.client.taxCode}`,
    data.client.reaNumber ? `REA: ${data.client.reaNumber}` : '',
    `Email: ${data.client.email}${data.client.pec ? ` | PEC: ${data.client.pec}` : ''}`,
    data.client.sdiCode ? `Codice SDI: ${data.client.sdiCode}` : '',
    `Rappresentato da: ${data.client.representedBy.name}, ${data.client.representedBy.role} (CF: ${data.client.representedBy.taxCode})`,
  ].filter(Boolean);

  for (const info of clientInfo) {
    y = drawText(info, margin + 10, y, { font: helvetica, size: 9 });
  }
  y -= 15;
  drawLine(y);
  y -= 15;

  // ========== PREMESSA ==========
  y = drawText('PREMESSA', margin, y, { font: helveticaBold, size: 12, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  const preamble = `Il Fornitore opera nel settore della progettazione, sviluppo e gestione di siti web, piattaforme digitali e servizi connessi. ` +
    `Il Cliente desidera affidare al Fornitore la realizzazione e gestione dei servizi descritti all'Art. 1, ` +
    `secondo i termini e le condizioni del presente Contratto. ` +
    `Le premesse formano parte integrante e sostanziale del presente Contratto.`;

  y = drawText(preamble, margin, y, { font: helvetica, size: 10, lineHeight: 14 });
  y -= 15;
  drawLine(y);
  y -= 15;

  // ========== ARTICLE 1: OGGETTO ==========
  y = checkNewPage(y, 80);
  y = drawText('ART. 1 - OGGETTO DEL CONTRATTO', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  y = drawText('1.1 L\'oggetto del presente Contratto è la fornitura dei seguenti servizi:', margin, y, { font: helvetica, size: 10 });
  y = drawText(data.service.description, margin + 10, y, { font: helvetica, size: 10 });
  y -= 5;

  y = drawText(`1.2 Piano selezionato: ${data.service.plan === 'business' ? 'Business' : 'Enterprise'}`, margin, y, { font: helvetica, size: 10 });
  y -= 5;

  y = drawText('1.3 Consegne incluse:', margin, y, { font: helveticaBold, size: 10 });
  for (const deliverable of data.service.deliverables) {
    y = drawText(`• ${deliverable}`, margin + 10, y, { font: helvetica, size: 10 });
  }
  y -= 5;

  y = drawText(`1.4 Cronoprogramma: ${data.service.timeline}`, margin, y, { font: helvetica, size: 10 });
  y = drawText(`1.5 Data inizio: ${data.service.startDate}${data.service.endDate ? ` | Data fine: ${data.service.endDate}` : ''}`, margin, y, { font: helvetica, size: 10 });
  y = drawText(`1.6 Rinnovo automatico: ${data.service.autoRenewal ? 'Sì (preavviso ' + data.service.renewalNoticeDays + ' giorni)' : 'No'}`, margin, y, { font: helvetica, size: 10 });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 2: CORRISPETTIVI ==========
  y = checkNewPage(y, 120);
  y = drawText('ART. 2 - CORRISPETTIVI E MODALITÀ DI PAGAMENTO', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  y = drawText('2.1 Corrispettivi:', margin, y, { font: helveticaBold, size: 10 });
  y = drawText(`• Fee di attivazione (una tantum): € ${data.commercial.setupFee.toLocaleString()} ${data.commercial.currency} + IVA ${data.commercial.vatRate}%`, margin + 10, y, { font: helvetica, size: 10 });
  y = drawText(`• Fee ricorrente: € ${data.commercial.monthlyFee.toLocaleString()} ${data.commercial.currency}/${data.commercial.billingCycle === 'monthly' ? 'mese' : data.commercial.billingCycle === 'quarterly' ? 'trimestre' : 'anno'} + IVA ${data.commercial.vatRate}%`, margin + 10, y, { font: helvetica, size: 10 });
  y -= 5;

  y = drawText('2.2 Modalità di pagamento:', margin, y, { font: helveticaBold, size: 10 });
  const payments = data.commercial.paymentTerms.split(',').map(p => p.trim());
  for (const payment of payments) {
    y = drawText(`• ${payment}`, margin + 10, y, { font: helvetica, size: 10 });
  }
  y -= 5;

  y = drawText(`2.3 Acconto del ${data.commercial.depositPercent}% (€ ${data.commercial.depositAmount.toLocaleString()} ${data.commercial.currency}) entro il ${data.commercial.depositDueDate}`, margin, y, { font: helveticaBold, size: 10, color: rgb(0.15, 0.25, 0.45) });
  y = drawText(`2.4 Saldo (€ ${(data.commercial.setupFee - data.commercial.depositAmount).toLocaleString()} ${data.commercial.currency}) entro il ${data.commercial.balanceDueDate}`, margin, y, { font: helveticaBold, size: 10, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  y = drawText('2.5 I pagamenti dovranno essere effettuati a mezzo bonifico bancario alle coordinate comunicate nella proposta. Il mancato pagamento nei termini costituisce mora ex lege.', margin, y, { font: helvetica, size: 9 });
  y = drawText(`2.6 Interessi di mora: ${data.commercial.latePaymentInterest}% annuo (D.Lgs. 231/2002)`, margin, y, { font: helvetica, size: 9 });
  y = drawText('2.7 Le fatture saranno emesse in formato elettronico (SDI) e inviate via PEC/email.', margin, y, { font: helvetica, size: 9 });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 3: OBBLIGHI DELLE PARTI ==========
  y = checkNewPage(y, 100);
  y = drawText('ART. 3 - OBBLIGHI DELLE PARTI', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  y = drawText('3.1 Obblighi del Fornitore:', margin, y, { font: helveticaBold, size: 10 });
  const providerObligations = [
    'Eseguire i servizi con diligenza professionale e secondo le migliori pratiche di settore',
    'Rispettare il cronoprogramma concordato (Art. 1.4)',
    'Fornire aggiornamenti periodici sullo stato di avanzamento',
    'Garantire i livelli di servizio (SLA) di cui all\'Art. 5',
    'Mantenere la riservatezza delle informazioni del Cliente (Art. 10)',
    'Adempiere agli obblighi GDPR di cui all\'Art. 11',
  ];
  for (const obl of providerObligations) {
    y = drawText(`• ${obl}`, margin + 10, y, { font: helvetica, size: 9 });
  }
  y -= 5;

  y = drawText('3.2 Obblighi del Cliente:', margin, y, { font: helveticaBold, size: 10 });
  const clientObligations = [
    'Fornire tempestivamente materiali, accessi e informazioni necessari',
    'Effettuare i pagamenti nei termini concordati (Art. 2)',
    'Designare un referente tecnico/decisionale per le approvazioni',
    'Collaborare attivamente per il buon esito del progetto',
    'Comunicare tempestivamente variazioni di dati anagrafici/contatti',
  ];
  for (const obl of clientObligations) {
    y = drawText(`• ${obl}`, margin + 10, y, { font: helvetica, size: 9 });
  }
  y = drawText('3.3 Il ritardo nella fornitura di materiali/accessi da parte del Cliente proroga i termini di consegna di pari durata.', margin, y, { font: helvetica, size: 9 });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 4: VARIAZIONI ==========
  y = checkNewPage(y, 60);
  y = drawText('ART. 4 - VARIAZIONI E INTEGRAZIONI', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText('4.1 Eventuali variazioni all\'oggetto (nuove funzionalità, modifiche sostanziali) saranno oggetto di preventivo separato e ordine di variazione scritto.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('4.2 Le variazioni minori (bug fix, aggiustamenti UI, contenuti) fino a 4 ore/mese sono incluse nel canone.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('4.3 Il Cliente può richiedere variazioni in qualsiasi momento; il Fornitore comunicherà tempi e costi entro 3 giorni lavorativi.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 5: SLA ==========
  y = checkNewPage(y, 100);
  y = drawText('ART. 5 - LIVELLI DI SERVIZIO (SLA)', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  const slaItems = [
    ['Uptime garantito', data.sla.uptime],
    ['Tempo di prima risposta', `${data.sla.responseTimeHours} ore lavorative`],
    ['Tempo di risoluzione', `${data.sla.resolutionTimeHours} ore lavorative`],
    ['Orari supporto', data.sla.businessHours],
    ['Canali supporto', data.sla.supportChannels.join(', ')],
    ['Esclusi da SLA', data.sla.excludedFromSla.join(', ') || 'Nessuno'],
  ];

  for (const [label, value] of slaItems) {
    y = checkNewPage(y, 25);
    page.drawRectangle({
      x: margin, y: y - 22, width: contentWidth, height: 22,
      color: y % 44 < 22 ? rgb(0.98, 0.98, 1) : rgb(1, 1, 1),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    page.drawText(label, { x: margin + 15, y: y - 16, size: 9, font: helveticaBold });
    page.drawText(value, { x: margin + 200, y: y - 16, size: 9, font: helvetica });
    y -= 25;
  }
  y -= 5;
  y = drawText('5.2 In caso di mancato rispetto SLA, il Cliente ha diritto a: riduzione canone 5% per ogni 0.1% sotto uptime; estensione supporto gratuito.', margin, y, { font: helvetica, size: 9, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 6: DURATA E RECESSO ==========
  y = checkNewPage(y, 80);
  y = drawText('ART. 6 - DURATA, RINNOVO E RECESSO', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  if (data.service.endDate) {
    y = drawText(`6.1 Il Contratto ha durata determinata dal ${data.service.startDate} al ${data.service.endDate}.`, margin, y, { font: helvetica, size: 10 });
  } else {
    y = drawText(`6.1 Il Contratto ha durata indeterminata a decorrere dal ${data.service.startDate}.`, margin, y, { font: helvetica, size: 10 });
  }

  if (data.service.autoRenewal) {
    y = drawText(`6.2 Rinnovo automatico per periodi di 12 mesi salvo disdetta da comunicarsi almeno ${data.service.renewalNoticeDays} giorni prima della scadenza.`, margin, y, { font: helvetica, size: 10 });
  } else {
    y = drawText('6.2 Nessun rinnovo automatico. Il Contratto cessa alla scadenza naturale.', margin, y, { font: helvetica, size: 10 });
  }

  y = drawText(`6.3 Recesso libero: ciascuna parte può recedere con preavviso di ${data.terms.terminationNoticeDays} giorni (comunicazione scritta PEC/raccomandata).`, margin, y, { font: helvetica, size: 10 });
  y = drawText('6.4 Recesso per giusta causa: inadempimento grave non sanato entro 15 giorni da diffida scritta.', margin, y, { font: helvetica, size: 10 });
  y = drawText('6.5 Effetti del recesso: il Cliente paga i servizi resi fino alla data effettiva; il Fornitore consegna quanto realizzato.', margin, y, { font: helvetica, size: 10 });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 7: PROPRIETÀ INTELLETTUALE ==========
  y = checkNewPage(y, 60);
  y = drawText('ART. 7 - PROPRIETÀ INTELLETTUALE E LICENZE', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  if (data.terms.intellectualProperty === 'client') {
    y = drawText('7.1 Tutti i diritti di proprietà intellettuale sui deliverables (codice, design, contenuti) passano al Cliente a integrale pagamento del corrispettivo.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  } else if (data.terms.intellectualProperty === 'provider') {
    y = drawText('7.1 Il Fornitore mantiene la proprietà intellettuale; al Cliente viene concessa licenza d\'uso perpetua, non esclusiva, mondiale.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  } else {
    y = drawText('7.1 Proprietà condivisa: il Cliente ha diritti d\'uso esclusivi per i propri scopi; il Fornitore può riutilizzare componenti generici.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  }

  y = drawText('7.2 Il Fornitore si riserva il diritto di mostrare il progetto nel proprio portfolio (saldo divieto scritto del Cliente).', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('7.3 Software di terze parti: licenze secondo termini dei rispettivi fornitori (open source, SaaS, ecc.).', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 8: RESPONSABILITÀ ==========
  y = checkNewPage(y, 80);
  y = drawText('ART. 8 - RESPONSABILITÀ E LIMITAZIONI', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  y = drawText('8.1 Il Fornitore risponde per danni diretti causati da dolo o colpa grave, fino a un massimale pari a 12 mesi di canone.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('8.2 Nessuna responsabilità per: danni indiretti, lucro cessante, perdita dati (salvo backup), forza maggiore, atti di terzi.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('8.3 Il Cliente manleva il Fornitore da pretese di terzi per contenuti/materiali forniti dal Cliente.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('8.4 Il Fornitore non garantisce risultati commerciali (traffico, conversioni, vendite) non dipendenti esclusivamente dalla propria prestazione.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 9: ASSICURAZIONE ==========
  y = checkNewPage(y, 50);
  y = drawText('ART. 9 - COPERTURA ASSICURATIVA', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText('Il Fornitore dichiara di essere coperto da polizza RC Professionale con massimale adeguato (min. € 500.000). Copia disponibile su richiesta.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 10: RISERVATEZZA ==========
  y = checkNewPage(y, 60);
  y = drawText('ART. 10 - RISERVATEZZA', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText(`10.1 Le parti si obbligano a mantenere riservate tutte le informazioni scambiate per ${data.terms.confidentialityYears} anni dalla cessazione.`, margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('10.2 Escluse: informazioni di pubblico dominio, già note, sviluppate indipendentemente, obbligatorie per legge.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('10.3 Obbligo esteso a dipendenti, collaboratori, sub-fornitori.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 11: GDPR ==========
  y = checkNewPage(y, 100);
  y = drawText('ART. 11 - TRATTAMENTO DATI PERSONALI (GDPR)', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;

  y = drawText('11.1 Le parti agiscono come Titolari autonomi per i dati dei propri dipendenti/collaboratori.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('11.2 Per i dati del Cliente trattati dal Fornitore (es. analytics, form contatti), il Fornitore opera come Responsabile ex Art. 28 GDPR.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  if (data.gdpr.dataProcessingAddendum) {
    y = drawText('11.3 È allegato l\'Addendum sul Trattamento Dati (DPA) che disciplina nel dettaglio i reciproci obblighi.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  }
  y = drawText(`11.4 Conservazione dati: ${data.gdpr.dataRetentionMonths} mesi dalla cessazione (salvo obblighi legge).`, margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText(`11.5 Sub-responsabili autorizzati: ${data.gdpr.subProcessors.join(', ') || 'Nessuno oltre l\'hosting provider'}`, margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText(`11.6 DPO/Riferimento privacy: ${data.gdpr.dpoContact}`, margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('11.7 Notifica data breach: entro 24h dalla scoperta all\'altra parte.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 12: FORZA MAGGIORE ==========
  y = checkNewPage(y, 40);
  y = drawText('ART. 12 - FORZA MAGGIORE', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText('Nessuna parte risponde per ritardi/inadempimenti dovuti a cause imprevedibili, inevitabili ed esterne (catastrofi, pandemie, guerre, scioperi, guasti infrastrutture critiche).', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 13: CESSIONE ==========
  y = checkNewPage(y, 40);
  y = drawText('ART. 13 - CESSIONE DEL CONTRATTO', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText('Il Contratto non è cedibile senza consenso scritto dell\'altra parte, salvo cessione a società controllate/collegate (preavviso 30 gg).', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 14: COMUNICAZIONI ==========
  y = checkNewPage(y, 40);
  y = drawText('ART. 14 - COMUNICAZIONI', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText('Tutte le comunicazioni formali: PEC (valore legale), raccomandata A/R, o email confermata. Riferimenti in testata.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 15: LEGGE APPLICABILE E FORO ==========
  y = checkNewPage(y, 50);
  y = drawText('ART. 15 - LEGGE APPLICABILE E FORO COMPETENTE', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText(`15.1 Legge applicabile: ${data.terms.governingLaw}`, margin, y, { font: helvetica, size: 10 });
  y = drawText(`15.2 Foro competente esclusivo: ${data.terms.jurisdiction}`, margin, y, { font: helvetica, size: 10 });
  y = drawText(`15.3 Lingua prevalente: ${data.terms.language}`, margin, y, { font: helvetica, size: 10 });
  y = drawText('15.4 Clausole nulle/inefficaci non inficiano il resto del Contratto.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 15;
  drawLine(y);
  y -= 10;

  // ========== ARTICLE 16: DISPOSIZIONI FINALI ==========
  y = checkNewPage(y, 50);
  y = drawText('ART. 16 - DISPOSIZIONI FINALI', margin, y, { font: helveticaBold, size: 11, color: rgb(0.15, 0.25, 0.45) });
  y -= 5;
  y = drawText('16.1 Il presente Contratto (compresa la Proposta N. ' + data.proposalNumber + ' e allegati) costituisce l\'intero accordo.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('16.2 Modifiche solo se scritte e firmate da entrambe le parti.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('16.3 Tolleranze non costituiscono rinuncia ai diritti.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y = drawText('16.4 Il Contratto è redatto in duplice originale, uno per parte.', margin, y, { font: helvetica, size: 10, maxWidth: contentWidth });
  y -= 20;

  // ========== SIGNATURES ==========
  y = checkNewPage(y, 120);
  drawLine(y, rgb(0.15, 0.25, 0.45), 1);
  y -= 20;

  y = drawText('IN FEDE', margin, y, { font: helveticaBold, size: 11, align: 'center' });
  y -= 15;

  y = drawText(`${data.signatures.place}, ${data.signatures.date}`, margin, y, { font: helvetica, size: 10 });
  y -= 20;

  // Provider signature
  y = drawText('IL FORNITORE', margin, y, { font: helveticaBold, size: 10 });
  y = drawText(data.provider.companyName, margin, y, { font: helvetica, size: 10 });
  y = drawText('____________________________________', margin, y, { font: helvetica, size: 10 });
  y = drawText(data.signatures.providerSignature, margin, y, { font: helvetica, size: 9 });
  y -= 30;

  // Client signature
  y = drawText('IL CLIENTE', margin, y, { font: helveticaBold, size: 10 });
  y = drawText(data.client.companyName, margin, y, { font: helvetica, size: 10 });
  y = drawText('____________________________________', margin, y, { font: helvetica, size: 10 });
  y = drawText(data.signatures.clientSignature, margin, y, { font: helvetica, size: 9 });
  y -= 20;

  // ========== FOOTER ==========
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdfDoc.getPage(i);
    p.drawText(
      `ZAK Studio Web | Contratto ${data.contractNumber} | Pag. ${i + 1}/${totalPages}`,
      { x: margin, y: 30, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) }
    );
    p.drawText(
      `Riservato - ${data.date}`,
      { x: pageWidth - margin - 150, y: 30, size: 7, font: helvetica, color: rgb(0.5, 0.5, 0.5) }
    );
  }

  return pdfDoc.save();
}

/**
 * Saves contract PDF to file system
 */
export async function saveContractPDF(pdfBytes: Uint8Array, contractNumber: string): Promise<string> {
  const dir = path.join(process.cwd(), 'generated', 'contracts');
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `Contratto_${contractNumber}.pdf`);
  await fs.writeFile(filePath, pdfBytes);
  return filePath;
}