import { jsPDF } from 'jspdf';

/**
 * Generates an official Refund & Settlement Statement PDF for Accounts & Audit.
 * Matches Chhaya International compliance standards.
 */
export const generateRefundPdf = (lead, options = { download: true, returnBlob: false }) => {
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

  // Red/Gold accent line for refund/settlement voucher
  doc.setFillColor(220, 38, 38); // red-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
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
  const voucherRef = `CHHAYA/REF-VOUCHER/${lead._id ? lead._id.slice(-6).toUpperCase() : 'NA'}/${Date.now().toString().slice(-4)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`VOUCHER REF: ${voucherRef}`, margin, y);
  doc.text(`DATE ISSUED: ${dateStr}`, pageWidth - margin - 40, y);

  // 3. TITLE BANNER
  y += 5;
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(252, 165, 165); // red-300
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

  doc.setTextColor(153, 27, 27); // red-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL REFUND & CANCELLATION SETTLEMENT STATEMENT', pageWidth / 2, y + 5.5, { align: 'center' });

  const closureStatus = lead.closureStatus || (lead.billBook?.refundBalance === 0 ? 'FINAL_CLOSED' : 'REFUND_PENDING');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28);
  doc.text(`SETTLEMENT STATUS: [ ${closureStatus.replace(/_/g, ' ')} ]  •  ACCOUNTS DISBURSEMENT VOUCHER`, pageWidth / 2, y + 9.5, { align: 'center' });

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
    ['Candidate Name', lead.candidateName || 'N/A', 'Client / Case ID', lead.leadId || lead._id?.slice(-8) || 'N/A'],
    ['Contact Mobile', lead.phone || 'N/A', 'Passport Number', lead.passportNumber || 'N/A'],
    ['Target Country', lead.applicationForm?.preferredCountries?.[0] || lead.targetCountry || 'N/A', 'Applied Trade', lead.trade || lead.applicationForm?.trade || 'N/A'],
    ['Cancellation Reason', lead.closureDetails?.reason || lead.holdReason || 'Client withdrew / Mutual Cancellation', 'Closure Date', lead.closureDetails?.closedAt ? new Date(lead.closureDetails.closedAt).toLocaleDateString('en-IN') : dateStr]
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

    // Left Col Val
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(row[1]).substring(0, 32), margin + 34, y + 4.2);

    // Right Col Label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + colW + 2.5, y + 4.2);

    // Right Col Val
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(row[3]).substring(0, 32), margin + colW + 34, y + 4.2);

    y += rowH;
  });

  // 5. FINANCIAL LEDGER & BREAKDOWN
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. FINANCIAL SETTLEMENT BREAKDOWN', margin, y);

  y += 3;
  const billBook = lead.billBook || {};
  const totalReceived = billBook.totalReceived || lead.paymentDetails?.totalPaid || lead.paymentDetails?.advancePaid || 0;
  const approvedRefund = billBook.approvedRefund || lead.closureDetails?.refundPayable || 0;
  const totalDeduction = Math.max(0, totalReceived - approvedRefund);
  const refundPaid = billBook.refundPaid || lead.closureDetails?.refundPaid || 0;
  const refundBalance = Math.max(0, approvedRefund - refundPaid);

  const finRows = [
    ['Total Amount Received by Agency:', `INR ${totalReceived.toLocaleString('en-IN')}`, 'Received via Official Receipts & Bill Book'],
    ['Less: Administrative & Processing Expenses:', `INR ${totalDeduction.toLocaleString('en-IN')}`, 'Medical / Documentation / Portal Charges'],
    ['Net Approved Refund Liability:', `INR ${approvedRefund.toLocaleString('en-IN')}`, 'Sanctioned by Management / Accounts'],
    ['Total Refund Disbursed to Candidate:', `INR ${refundPaid.toLocaleString('en-IN')}`, 'Credited to Candidate Account'],
    ['Remaining Outstanding Balance:', `INR ${refundBalance.toLocaleString('en-IN')}`, refundBalance === 0 ? 'Full & Final Settlement Completed (NIL Balance)' : 'Pending Disbursement by Accounts']
  ];

  finRows.forEach((row, i) => {
    const isHighlight = i === 2 || i === 4;
    if (isHighlight) {
      doc.setFillColor(i === 4 && refundBalance === 0 ? 240 : 254, i === 4 && refundBalance === 0 ? 253 : 242, i === 4 && refundBalance === 0 ? 244 : 242);
    } else {
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
    }
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowH, 'S');

    doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(isHighlight ? (i === 4 && refundBalance === 0 ? 21 : 185) : 30, isHighlight ? (i === 4 && refundBalance === 0 ? 128 : 28) : 41, isHighlight ? (i === 4 && refundBalance === 0 ? 61 : 28) : 59);
    doc.text(row[0], margin + 2.5, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.text(row[1], margin + 85, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + 118, y + 4.2);

    y += rowH;
  });

  // 6. CANDIDATE BANK / PAYOUT PARTICULARS
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. CANDIDATE BANK DETAILS FOR DISBURSEMENT', margin, y);

  y += 3;
  const bank = lead.closureDetails?.bankDetails || {};
  const bankRows = [
    ['Beneficiary Name', bank.accountHolderName || lead.candidateName || 'N/A', 'Bank Name', bank.bankName || 'Direct Transfer'],
    ['Account Number', bank.accountNumber || 'N/A', 'IFSC Code', bank.ifscCode || 'N/A'],
    ['UPI ID / VPA', bank.upiId || 'N/A', 'Disbursement Channel', 'NEFT / RTGS / IMPS / UPI']
  ];

  bankRows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row[0], margin + 2.5, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(row[1]).substring(0, 32), margin + 34, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], margin + colW + 2.5, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(row[3]).substring(0, 32), margin + colW + 34, y + 4.2);

    y += rowH;
  });

  // 7. TRANSACTION LOG (REFUND TRANSACTIONS)
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('4. REFUND DISBURSEMENT TRANSACTIONS LOG', margin, y);

  y += 3;
  const refundTxs = (billBook.transactions || []).filter(t => t.type === 'REFUND');

  // Header of tx table
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, rowH, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, contentWidth, rowH, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RECEIPT NO', margin + 2, y + 4.2);
  doc.text('DATE', margin + 32, y + 4.2);
  doc.text('MODE', margin + 55, y + 4.2);
  doc.text('UTR / REF NUMBER', margin + 78, y + 4.2);
  doc.text('AMOUNT (INR)', margin + 125, y + 4.2);
  doc.text('STATUS', margin + 155, y + 4.2);
  y += rowH;

  if (refundTxs.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowH, 'S');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No refund disbursement transactions recorded yet.', margin + 2, y + 4.2);
    y += rowH;
  } else {
    refundTxs.forEach((tx, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, rowH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowH, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(tx.receiptNo || 'N/A', margin + 2, y + 4.2);
      doc.text(tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A', margin + 32, y + 4.2);
      doc.text(tx.paymentMode || 'BANK', margin + 55, y + 4.2);
      doc.text((tx.referenceNo || 'N/A').substring(0, 20), margin + 78, y + 4.2);
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${Number(tx.amount || 0).toLocaleString('en-IN')}`, margin + 125, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129);
      doc.text(tx.status || 'VERIFIED', margin + 155, y + 4.2);

      y += rowH;
    });
  }

  // 8. LEGAL DISCHARGE & UNDERTAKING
  y += 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('LEGAL SETTLEMENT & FULL DISCHARGE UNDERTAKING:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    '1. The candidate hereby confirms receipt of the stated refund amount towards final and conclusive settlement of all claims.\n' +
    '2. Upon settlement of balance to NIL, both parties agree that neither agency nor candidate holds any outstanding financial liability.\n' +
    '3. This statement is electronically verified and maintained in the Central Accounts Ledger of Chhaya International Private Limited.',
    margin + 3,
    y + 8.5
  );

  // 9. SIGNATURES & OFFICIAL SEALS
  y += 18;
  const sigBoxW = (contentWidth - 8) / 3;
  const sigBoxH = 22;

  // Box 1: Candidate Acknowledgment
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CANDIDATE SIGNATURE', margin + sigBoxW / 2, y + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Candidate / Payee Signature', margin + sigBoxW / 2, y + sigBoxH - 2.5, { align: 'center' });

  // Box 2: Accounts Officer
  const box2X = margin + sigBoxW + 4;
  doc.roundedRect(box2X, y, sigBoxW, sigBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ACCOUNTS OFFICER', box2X + sigBoxW / 2, y + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text('Verified & Ledger Cleared', box2X + sigBoxW / 2, y + 10, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Accounts Dept. Sign & Stamp', box2X + sigBoxW / 2, y + sigBoxH - 2.5, { align: 'center' });

  // Box 3: Authorized Signatory & Official Seal
  const box3X = margin + (sigBoxW + 4) * 2;
  doc.roundedRect(box3X, y, sigBoxW, sigBoxH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AUTHORIZED SIGNATORY', box3X + sigBoxW / 2, y + 4.5, { align: 'center' });

  // Official verified red seal stamp
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.8);
  doc.roundedRect(box3X + 6, y + 6.5, sigBoxW - 12, 10, 1.5, 1.5, 'S');
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ACCOUNTS SETTLED', box3X + sigBoxW / 2, y + 11.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('CHHAYA INTL PVT LTD', box3X + sigBoxW / 2, y + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Managing Director / Authorized', box3X + sigBoxW / 2, y + sigBoxH - 2.5, { align: 'center' });

  // 10. BOTTOM FOOTER
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Official Refund & Settlement Voucher • Generated on ${new Date().toLocaleString('en-IN')} • Confidential`, pageWidth / 2, pageHeight - 3, { align: 'center' });

  const fileName = `${(lead.candidateName || 'Candidate').replace(/\s+/g, '_')}_Refund_Settlement_Statement.pdf`;

  if (options.download) {
    doc.save(fileName);
  }

  if (options.returnBlob) {
    return doc.output('blob');
  }

  return true;
};
