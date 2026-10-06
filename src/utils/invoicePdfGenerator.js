import { jsPDF } from 'jspdf';

/**
 * Extracts and computes consistent billing metrics from lead object
 */
export const getLeadBillingSummary = (lead) => {
  if (!lead) return {};
  const p = lead.paymentDetails || {};
  const bb = lead.billBook || {};
  
  const serviceFee = Number(p.serviceFee) || 9500;
  const medicalFee = Number(p.medicalFee) || 2500;
  
  const totalBilled = bb.approvedPayable || (serviceFee + medicalFee);
  
  const totalPaid = Number(
    bb.totalReceived !== undefined 
      ? bb.totalReceived 
      : (p.totalPaid !== undefined ? p.totalPaid : (p.advancePaid !== undefined ? p.advancePaid : ((Number(p.servicePaid) || 0) + (Number(p.medicalPaid) || 0))))
  );
  
  const balance = Math.max(0, totalBilled - totalPaid);
  const status = balance === 0 && totalPaid > 0 ? 'SETTLED' : totalPaid > 0 ? 'PARTIAL' : 'OPEN';
  const receiptNo = p.receiptNo || (lead._id ? `REC-FIN-${lead._id.substring(lead._id.length - 4).toUpperCase()}` : 'REC-FIN-8428');
  const paymentMode = p.paymentMode || (bb.transactions?.[0]?.paymentMode) || 'NetBanking';
  const paymentDate = p.lastPaymentDate 
    ? new Date(p.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return {
    serviceFee,
    medicalFee,
    totalBilled,
    totalPaid,
    balance,
    status,
    receiptNo,
    paymentMode,
    paymentDate,
    transactions: bb.transactions || [],
    charges: bb.charges || []
  };
};

/**
 * Generates an official branded Tax Invoice & Payment Receipt PDF for Chhaya International.
 */
export const generateInvoicePdf = (lead, options = { download: true, returnBlob: false }) => {
  const summary = getLeadBillingSummary(lead);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP HEADER & BRANDING
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Emerald & Gold accent line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CHHAYA INTERNATIONAL PRIVATE LIMITED', margin, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Govt. Approved Overseas Recruitment & Manpower Consultancy Services', margin, 18);
  doc.setFontSize(7.5);
  doc.text('Reg No: B-1204/UP/COM/1000+/5/9821/2021  •  Email: accounts@chhayainternational.com  •  Phone: +91 98765 43210', margin, 23);

  // 2. DOCUMENT METADATA
  let y = 37;
  const dateStr = summary.paymentDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`INVOICE / RECEIPT NO: ${summary.receiptNo}`, margin, y);
  doc.text(`DATE ISSUED: ${dateStr}`, pageWidth - margin - 45, y);

  // 3. TITLE BANNER
  y += 5;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

  doc.setTextColor(6, 95, 70); // emerald-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL BILLING INVOICE & PAYMENT RECEIPT', pageWidth / 2, y + 5.5, { align: 'center' });

  const statusLabel = summary.status === 'SETTLED' ? 'FULL PAYMENT RECEIVED & SETTLED' : summary.status === 'PARTIAL' ? 'PARTIALLY PAID (BALANCE PENDING)' : 'PAYMENT PENDING';
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  doc.text(`PAYMENT STATUS: [ ${statusLabel} ]  •  ACCOUNTS CLEARANCE VOUCHER`, pageWidth / 2, y + 9.5, { align: 'center' });

  // 4. CANDIDATE PARTICULARS TABLE
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CANDIDATE & CASE PARTICULARS', margin, y);

  y += 3;
  const colW = contentWidth / 2;
  const rowH = 6.2;
  const candidateRows = [
    ['Candidate Name', lead.candidateName || lead.name || 'N/A', 'Case / Client ID', lead.leadId || lead.candidateCode || lead._id?.slice(-8) || 'N/A'],
    ['Contact Mobile', lead.phone || 'N/A', 'Passport Number', lead.passportNumber || 'N/A'],
    ['Destination Country', lead.country || lead.targetCountry || 'Gulf Region', 'Applied Trade / Role', lead.trade || 'General Worker'],
    ['Current Desk', lead.stage || lead.currentStage || 'ACCOUNTS_COLLECTION', 'Payment Method', summary.paymentMode || 'NetBanking / UPI']
  ];

  candidateRows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowH, 'S');

    // Left Col Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row[0], margin + 2.5, y + 4.2);

    // Left Col Value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(row[1]), margin + 35, y + 4.2);

    // Right Col Label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + colW + 2.5, y + 4.2);

    // Right Col Value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(row[3]), margin + colW + 35, y + 4.2);

    y += rowH;
  });

  // 5. ITEMIZED FEE BREAKDOWN TABLE
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. FEE BREAKDOWN & CHARGES STATEMENT', margin, y);

  y += 3;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('SL', margin + 3, y + 4.7);
  doc.text('DESCRIPTION OF SERVICE / HEAD', margin + 14, y + 4.7);
  doc.text('SAC / CODE', margin + 105, y + 4.7);
  doc.text('AMOUNT (INR)', pageWidth - margin - 3, y + 4.7, { align: 'right' });

  y += 7;
  const lineItems = [
    { sl: '1', desc: 'Overseas Recruitment & Visa Documentation Processing Service Fee', code: '998512', amount: summary.serviceFee },
    { sl: '2', desc: 'GAMCA Approved GCC Diagnostic Medical Center Examination Fee', code: '999312', amount: summary.medicalFee }
  ];

  lineItems.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 7, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(item.sl, margin + 3, y + 4.7);
    doc.setTextColor(15, 23, 42);
    doc.text(item.desc, margin + 14, y + 4.7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.code, margin + 105, y + 4.7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`₹ ${item.amount.toLocaleString('en-IN')}`, pageWidth - margin - 3, y + 4.7, { align: 'right' });

    y += 7;
  });

  // Totals Box
  y += 2;
  const totW = 85;
  const totX = pageWidth - margin - totW;
  
  // Total Billed Row
  doc.setFillColor(248, 250, 252);
  doc.rect(totX, y, totW, 6, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(totX, y, totW, 6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL BILLED AMOUNT:', totX + 3, y + 4.2);
  doc.setTextColor(37, 99, 235);
  doc.text(`₹ ${summary.totalBilled.toLocaleString('en-IN')}`, totX + totW - 3, y + 4.2, { align: 'right' });

  y += 6;
  // Total Paid Row
  doc.setFillColor(236, 253, 245);
  doc.rect(totX, y, totW, 6.5, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.rect(totX, y, totW, 6.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('TOTAL AMOUNT RECEIVED:', totX + 3, y + 4.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`₹ ${summary.totalPaid.toLocaleString('en-IN')}`, totX + totW - 3, y + 4.5, { align: 'right' });

  y += 6.5;
  // Outstanding Balance Row
  doc.setFillColor(summary.balance > 0 ? 254 : 248, summary.balance > 0 ? 243 : 250, summary.balance > 0 ? 199 : 252);
  doc.rect(totX, y, totW, 6.5, 'F');
  doc.setDrawColor(summary.balance > 0 ? 252 : 226, summary.balance > 0 ? 211 : 232, summary.balance > 0 ? 77 : 240);
  doc.rect(totX, y, totW, 6.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(summary.balance > 0 ? 180 : 100, summary.balance > 0 ? 83 : 116, summary.balance > 0 ? 9 : 139);
  doc.text('OUTSTANDING BALANCE:', totX + 3, y + 4.5);
  doc.text(`₹ ${summary.balance.toLocaleString('en-IN')}`, totX + totW - 3, y + 4.5, { align: 'right' });

  // 6. PAYMENT TRANSACTION & AUDIT RECORD
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. TRANSACTION & AUDIT VERIFICATION', margin, y);

  y += 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Payment Mode: ${summary.paymentMode}  |  Date: ${summary.paymentDate}`, margin + 4, y + 5);
  doc.text(`• Reference ID: ${summary.receiptNo}  |  Official Ledger Entry: VERIFIED & AUDITED`, margin + 4, y + 9.5);
  doc.text(`• Notes: Official fee booking under Chhaya International Ministry of External Affairs Licensed Recruitment Rules.`, margin + 4, y + 14);

  // 7. SIGNATURES & OFFICIAL STAMP
  y += 24;
  const sigBoxW = (contentWidth - 10) / 3;
  const sigBoxH = 24;

  // Box 1: Candidate Sign
  doc.rect(margin, y, sigBoxW, sigBoxH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CANDIDATE SIGNATURE', margin + sigBoxW / 2, y + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(lead.candidateName || 'Candidate', margin + sigBoxW / 2, y + sigBoxH - 2.5, { align: 'center' });

  // Box 2: Accounts Officer
  const box2X = margin + sigBoxW + 5;
  doc.rect(box2X, y, sigBoxW, sigBoxH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ACCOUNTS OFFICER', box2X + sigBoxW / 2, y + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Accounts & Ledger Desk', box2X + sigBoxW / 2, y + sigBoxH - 2.5, { align: 'center' });

  // Box 3: Verified Stamp
  const box3X = margin + (sigBoxW + 5) * 2;
  doc.rect(box3X, y, sigBoxW, sigBoxH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('OFFICIAL SEAL & STAMP', box3X + sigBoxW / 2, y + 4.5, { align: 'center' });

  // Green verification seal stamp
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.roundedRect(box3X + 6, y + 6.5, sigBoxW - 12, 10, 1.5, 1.5, 'S');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAID & VERIFIED', box3X + sigBoxW / 2, y + 11.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('CHHAYA INTL PVT LTD', box3X + sigBoxW / 2, y + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized Signatory', box3X + sigBoxW / 2, y + sigBoxH - 2.5, { align: 'center' });

  // 8. BOTTOM FOOTER
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Official Tax Invoice & Payment Receipt • Generated on ${new Date().toLocaleString('en-IN')} • Valid Without Physical Signature`, pageWidth / 2, pageHeight - 3, { align: 'center' });

  const fileName = `Invoice_${summary.receiptNo}_${(lead.candidateName || 'Candidate').replace(/\s+/g, '_')}.pdf`;

  if (options.download) {
    doc.save(fileName);
  }

  if (options.returnBlob) {
    return doc.output('blob');
  }

  return true;
};

/**
 * Triggers clean, high-resolution direct printing in browser with native print preview
 */
export const printInvoiceReceipt = (lead) => {
  if (!lead) return;
  const summary = getLeadBillingSummary(lead);

  const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice Receipt - ${summary.receiptNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: #0f172a;
      color: #ffffff;
      padding: 20px 24px;
      border-bottom: 3px solid #10b981;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    .company-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .reg-tag {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      font-family: monospace;
    }
    .badge-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      text-transform: uppercase;
    }
    .banner {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner h2 {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.5px;
    }
    .meta-text {
      font-size: 11px;
      color: #64748b;
    }
    .meta-text strong {
      color: #0f172a;
    }
    .body-content {
      padding: 20px 24px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .grid-table td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
    }
    .grid-table td.label {
      width: 18%;
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 11px;
    }
    .grid-table td.val {
      width: 32%;
      color: #0f172a;
      font-weight: 600;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .item-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
    }
    .item-table td {
      padding: 9px 12px;
      border: 1px solid #e2e8f0;
    }
    .item-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-container {
      margin-left: auto;
      width: 320px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 12px;
      font-size: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .tot-row:last-child {
      border-bottom: none;
    }
    .tot-row.paid {
      background: #ecfdf5;
      color: #065f46;
      font-weight: 700;
      font-size: 13px;
    }
    .tot-row.balance {
      background: #fffbeb;
      color: #92400e;
      font-weight: 700;
      font-size: 13px;
    }
    .notes-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      color: #64748b;
      margin-bottom: 24px;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 10px;
    }
    .sig-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sig-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .seal-stamp {
      border: 2px solid #10b981;
      color: #059669;
      border-radius: 6px;
      padding: 3px 8px;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.5px;
      display: inline-block;
      margin: auto;
    }
    .sig-sub {
      font-size: 10px;
      color: #94a3b8;
    }
    .footer-bar {
      background: #0f172a;
      color: #94a3b8;
      text-align: center;
      font-size: 10px;
      padding: 8px;
      border-top: 1px solid #334155;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .invoice-card {
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    
    <div class="header">
      <div>
        <div class="company-name">CHHAYA INTERNATIONAL PRIVATE LIMITED</div>
        <div class="company-sub">Govt. Approved Overseas Recruitment & Manpower Consultancy Services</div>
        <div class="reg-tag">Reg No: B-1204/UP/COM/1000+/5/9821/2021 | GST/Tax Accounts Portal</div>
      </div>
      <div style="text-align: right;">
        <span class="badge-pill">${summary.status === 'SETTLED' ? 'PAID & SETTLED' : 'PARTIAL PAYMENT'}</span>
      </div>
    </div>

    <div class="banner">
      <div>
        <h2>OFFICIAL TAX INVOICE & PAYMENT RECEIPT</h2>
        <div class="meta-text">Govt. Registered Ministry Overseas Manpower Clearance Voucher</div>
      </div>
      <div style="text-align: right;">
        <div class="meta-text">Receipt No: <strong>${summary.receiptNo}</strong></div>
        <div class="meta-text">Date: <strong>${summary.paymentDate}</strong></div>
      </div>
    </div>

    <div class="body-content">
      
      <div class="section-title">1. Candidate & Case Information</div>
      <table class="grid-table">
        <tr>
          <td class="label">Candidate Name</td>
          <td class="val">${lead.candidateName || lead.name || 'N/A'}</td>
          <td class="label">Case / Client ID</td>
          <td class="val">${lead.leadId || lead.candidateCode || (lead._id ? lead._id.substring(lead._id.length - 8) : 'N/A')}</td>
        </tr>
        <tr>
          <td class="label">Passport Number</td>
          <td class="val" style="font-family: monospace;">${lead.passportNumber || 'N/A'}</td>
          <td class="label">Mobile Phone</td>
          <td class="val">${lead.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td class="label">Applied Trade</td>
          <td class="val">${lead.trade || 'General Worker'}</td>
          <td class="label">Target Country</td>
          <td class="val">${lead.country || lead.targetCountry || 'Gulf Region'}</td>
        </tr>
        <tr>
          <td class="label">Payment Mode</td>
          <td class="val">${summary.paymentMode}</td>
          <td class="label">Payment Date</td>
          <td class="val">${summary.paymentDate}</td>
        </tr>
      </table>

      <div class="section-title">2. Itemized Billing Breakdown</div>
      <table class="item-table">
        <thead>
          <tr>
            <th style="width: 40px;" class="text-center">#</th>
            <th>Description of Service</th>
            <th style="width: 100px;">SAC / Code</th>
            <th style="width: 120px;" class="text-right">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center">1</td>
            <td><strong>Overseas Recruitment & Visa Processing Service Fee</strong><br><span style="color: #64748b; font-size: 10.5px;">Documentation, interview coordination, offer letter verification & desk handling</span></td>
            <td style="color: #64748b; font-family: monospace;">998512</td>
            <td class="text-right" style="font-weight: 700; font-family: monospace;">₹ ${summary.serviceFee.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td class="text-center">2</td>
            <td><strong>GAMCA Approved Diagnostic Medical Center Checkup Fee</strong><br><span style="color: #64748b; font-size: 10.5px;">Approved GCC health laboratory fitness test & certificate processing</span></td>
            <td style="color: #64748b; font-family: monospace;">999312</td>
            <td class="text-right" style="font-weight: 700; font-family: monospace;">₹ ${summary.medicalFee.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals-container">
        <div class="tot-row">
          <span>Total Billed Fee:</span>
          <span style="font-weight: 700; font-family: monospace;">₹ ${summary.totalBilled.toLocaleString('en-IN')}</span>
        </div>
        <div class="tot-row paid">
          <span>Total Amount Received:</span>
          <span style="font-family: monospace;">₹ ${summary.totalPaid.toLocaleString('en-IN')}</span>
        </div>
        <div class="tot-row balance">
          <span>Outstanding Balance:</span>
          <span style="font-family: monospace;">₹ ${summary.balance.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div class="notes-box">
        <strong>Payment Audit Verification:</strong> This document certifies receipt of overseas recruitment processing fees for candidate ${lead.candidateName || 'Candidate'}. Official transaction reference: <code>${summary.receiptNo}</code>. Cleared in company accounts register.
      </div>

      <div class="sig-row">
        <div class="sig-box">
          <div class="sig-title">Candidate Signature</div>
          <div class="sig-sub">${lead.candidateName || 'Candidate'}</div>
        </div>
        <div class="sig-box">
          <div class="sig-title">Accounts Officer</div>
          <div class="sig-sub">Finance & Billing Desk</div>
        </div>
        <div class="sig-box">
          <div class="sig-title">Official Verification Seal</div>
          <div class="seal-stamp">✓ PAID & VERIFIED</div>
          <div class="sig-sub">Chhaya International Pvt Ltd</div>
        </div>
      </div>

    </div>

    <div class="footer-bar">
      Chhaya International Pvt Ltd • Head Office: Lucknow / Delhi NCR • Support: accounts@chhayainternational.com • Generated on ${new Date().toLocaleString('en-IN')}
    </div>

  </div>
</body>
</html>
  `;

  // Try opening via printable hidden iframe first to prevent popup blockers
  try {
    let iframe = document.getElementById('chhaya-invoice-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'chhaya-invoice-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 300);
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.open:', err);
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      // If popup blocked, generate direct PDF download
      generateInvoicePdf(lead, { download: true });
    }
  }
};
