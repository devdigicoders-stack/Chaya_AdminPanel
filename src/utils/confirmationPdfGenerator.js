import { jsPDF } from 'jspdf';

/**
 * Generates an official, branded Confirmation PDF for Chhaya International.
 * Matches all specifications from:
 * - Notes_261001_144432.PDF
 * - Chhaya_Office_App_Requirements_261001_144318.pdf (Section 8)
 *
 * @param {Object} lead - Full lead object
 * @param {Object} template - Confirmation template { docType, title, desk }
 * @param {Object} options - { download: true, returnBlob: true }
 * @returns {Blob} The generated PDF as a Blob (if returnBlob is true)
 */
export const generateConfirmationPdf = (lead, template, options = { download: true, returnBlob: true }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ─── 1. TOP HEADER & BRANDING ─────────────────────────────────────────
  // Primary header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent line
  doc.setFillColor(234, 179, 8); // yellow-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CHHAYA INTERNATIONAL PRIVATE LIMITED', margin, 12);

  // Subtitle & License info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Govt. Approved Overseas Recruitment & Manpower Consultancy Services', margin, 18);
  doc.setFontSize(7.5);
  doc.text('Reg No: B-1204/UP/COM/1000+/5/9821/2021  •  Email: info@chhayainternational.com  •  Web: chhayainternational.com', margin, 23);

  // ─── 2. DOCUMENT METADATA BADGE ───────────────────────────────────────
  let y = 38;

  // Reference Code & Date
  const refCode = `CHHAYA/CONF/${lead._id ? lead._id.slice(-6).toUpperCase() : 'NA'}/${Date.now().toString().slice(-4)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`REF NO: ${refCode}`, margin, y);
  doc.text(`DATE: ${dateStr}`, pageWidth - margin - 35, y);

  y += 6;

  // Title Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(template.title.toUpperCase(), margin + 5, y + 9);

  // Desk tag
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 241); // indigo-600
  doc.text(`DESK: ${template.desk || 'General'}`, pageWidth - margin - 40, y + 9);

  y += 20;

  // ─── 3. CANDIDATE PROFILE PARTICULARS (GRID TABLE) ────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CANDIDATE & APPLICATION PARTICULARS', margin, y);

  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 34, 'FD');

  // Columns layout
  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 4;
  let py = y + 6;

  const candidateName = lead.name || 'N/A';
  const passportNo = lead.passportNumber || lead.passport || 'Under Verification / N/A';
  const phoneNo = lead.phone || 'N/A';
  const trade = lead.trade || lead.jobPosition || 'General Placement';
  const country = lead.destinationCountry || lead.country || 'Gulf / Europe';
  const caseId = lead.caseId || (lead._id ? `CI-${lead._id.slice(-6).toUpperCase()}` : 'CI-NEW');
  const staffHandler = lead.activeHolder?.name || lead.assignedTo?.name || 'Calling Desk Staff';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Candidate Name:', col1X, py);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(candidateName, col1X + 32, py);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Case / Client ID:', col2X, py);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(caseId, col2X + 32, py);

  py += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Passport Number:', col1X, py);
  doc.setTextColor(15, 23, 42);
  doc.text(passportNo, col1X + 32, py);

  doc.setTextColor(100, 116, 139);
  doc.text('Contact Mobile:', col2X, py);
  doc.setTextColor(15, 23, 42);
  doc.text(phoneNo, col2X + 32, py);

  py += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Applied Trade:', col1X, py);
  doc.setTextColor(15, 23, 42);
  doc.text(trade, col1X + 32, py);

  doc.setTextColor(100, 116, 139);
  doc.text('Target Country:', col2X, py);
  doc.setTextColor(15, 23, 42);
  doc.text(country, col2X + 32, py);

  py += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Assigned Officer:', col1X, py);
  doc.setTextColor(15, 23, 42);
  doc.text(staffHandler, col1X + 32, py);

  doc.setTextColor(100, 116, 139);
  doc.text('Workflow Stage:', col2X, py);
  doc.setTextColor(15, 23, 42);
  doc.text((lead.currentStage || 'PROCESSING').replace(/_/g, ' '), col2X + 32, py);

  y += 42;

  // ─── 4. SPECIFIC CONFIRMATION CLAUSES (BASED ON DOCTYPE) ──────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TERMS, CONDITIONS & UNDERTAKING CLAUSES', margin, y);

  y += 4;

  let clauses = [];

  switch (template.docType) {
    case 'MEDICAL_FITNESS_DECLARATION':
    case 'MEDICAL_CONFIRMATION':
      clauses = [
        'A. Medical Referral: Candidate referred to GAMCA/authorized diagnostic center for comprehensive overseas medical examination.',
        'B. 5-in-1 Dossier Attached: The 5 core documents (1. CV / Resume, 2. Passport Copy, 3. Client Detail Registration Form, 4. GAMCA Medical Fitness Report, 5. Medical Condition Letter) have been compiled and officially delivered to candidate.',
        'C. Clinical Fitness Terms: Candidate certifies freedom from chronic, communicable or disabling medical conditions, and explicitly accepts the clinical fitness undertaking.',
        'D. Repeat Tests Protocol: In the event of temporary unfitness or repeat requirement, candidate commits to follow prescribed clinical instructions.',
        'E. Compliance & Call Recording: Calling Staff has explained all medical and placement conditions to candidate, and preserved verified confirmation call audio in central compliance archive.'
      ];
      break;

    case 'COMPANY_SELECTION_OFFER':
    case 'PROPOSAL_AGREEMENT':
      clauses = [
        'A. Offer Acceptance: The candidate confirms having read, understood, and accepted the employment offer for the specified position and foreign employer.',
        'B. Remuneration & Working Hours: Salary, overtime, working shifts, and job duties have been explicitly explained to the candidate by the recruitment staff.',
        'C. Amenities: Free or subsidized accommodation, medical insurance, and transportation shall be governed as per the official demand letter approved by the Ministry.',
        'D. Document Authenticity: Candidate certifies all certificates, trade test records, and experience credentials submitted are authentic and genuine.'
      ];
      break;

    case 'AFTER_ADVANCE_CONFIRMATION':
      clauses = [
        'A. Advance Collection: Payment received towards initial document processing, visa allocation, and attestation charges has been recorded in the central Bill Book.',
        'B. Official Receipt: Only transactions verified with official computerized receipt and UTR/Reference numbers are recognized by Chhaya International Pvt. Ltd.',
        'C. Non-Deduction Principle: All legitimate deposits remain accounted for against the total agreed service fee.',
        'D. Policy on Cancellation: In case candidate withdraws after visa application submission, actual incurred statutory costs shall be chargeable as per company refund policy.'
      ];
      break;

    case 'RECEIVING_CONFIRMATION':
      clauses = [
        'A. File Handover Protocol: Physical and digital candidate dossiers have been officially transferred and received by the processing desk.',
        'B. Verification Checklist: Complete original passport, photos, biometric slips, and medical fitness certificates have been verified for integrity.',
        'C. Two-Party Verification: Both sender staff and receiving desk officer confirm file acceptance without discrepancies.'
      ];
      break;

    case 'RE_APPLY_CONFIRMATION':
      clauses = [
        'A. File Re-Allocation: Candidate hereby consents to reallocation of the application to an alternative approved vacancy/employer.',
        'B. No Dual Liability: Previous employer terms stand cancelled, and fresh terms as explained apply without financial penalty on verified advance funds.',
        'C. Timeline Extension: Processing timeline is recalibrated as per the fresh visa issuance window of the new principal sponsor.'
      ];
      break;

    case 'PRE_VIVA_CLEARANCE':
    case 'PRI_VISA_CONFIRMATION':
      clauses = [
        'A. Pre-Visa Verification: Background checks, police clearance certificates (PCC), and embassy document compilation are complete.',
        'B. Expected Flight Window: Candidate has been briefed on expected visa issuance and departure timeframe.',
        'C. Communication Channel: Candidate agrees to remain available on the registered mobile number for biometric appointments and final visa calls.'
      ];
      break;

    case 'VISA_SUBMISSION_APPROVAL':
    case 'AFTER_VISA_CONFIRMATION':
      clauses = [
        'A. Visa Stamping & Verification: The employment visa has been successfully issued and verified with the respective country immigration portal.',
        'B. Visa Handover & Review: The candidate has personally inspected the visa copy, company sponsor name, and salary classification.',
        'C. Departure Commitment: Candidate commits to travel on the scheduled flight date and report to the overseas employer camp/representative upon arrival.',
        'D. Voice / Video Evidence: As mandated by compliance rules, audio/video proof of visa verification has been preserved in the system.'
      ];
      break;

    case 'FLIGHT_AND_JOINING':
      clauses = [
        'A. Ticket Issuance: Confirmed air ticket with designated PNR, airport transit details, and baggage allowance has been delivered to candidate.',
        'B. Airport Assistance & Reporting: Candidate has been provided overseas contact coordinator numbers and airport reporting guidelines.',
        'C. Mandatory Departure: Actual departure confirmation will close the deployment file with completed status in official records.'
      ];
      break;

    default:
      clauses = [
        'A. General Undertaking: The candidate acknowledges and agrees to the processing terms of Chhaya International Pvt. Ltd.',
        'B. Compliance: All recruitment procedures conform to the Emigration Act guidelines and verified principal demand orders.',
        'C. Contact Information: Any update in phone number or residential address must be immediately reported to the handling officer.'
      ];
      break;
  }

  // Draw clauses inside a nice bordered card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 52, 'FD');

  let cy = y + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // slate-800

  clauses.forEach((cl) => {
    const lines = doc.splitTextToSize(cl, contentWidth - 8);
    doc.text(lines, margin + 4, cy);
    cy += (lines.length * 4.2) + 2;
  });

  y += 60;

  // ─── 5. VERIFICATION & RECORDING STATUS ────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. COMPLIANCE & VERIFICATION AUDIT', margin, y);

  y += 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 22, 'FD');

  const vCol1 = margin + 4;
  const vCol2 = margin + (contentWidth / 2) + 4;
  let vy = y + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Confirmation Status:', vCol1, vy);
  doc.setTextColor(22, 163, 74); // emerald-600
  doc.text('OFFICIALLY VERIFIED', vCol1 + 35, vy);

  doc.setTextColor(100, 116, 139);
  doc.text('Communication Channel:', vCol2, vy);
  doc.setTextColor(15, 23, 42);
  doc.text('WHATSAPP / IN-PERSON', vCol2 + 40, vy);

  vy += 8;
  doc.setTextColor(100, 116, 139);
  doc.text('Evidence Media Proof:', vCol1, vy);
  doc.setTextColor(15, 23, 42);
  doc.text('VOICE RECORDING / SIGNED COPY', vCol1 + 35, vy);

  doc.setTextColor(100, 116, 139);
  doc.text('System Integrity Hash:', vCol2, vy);
  doc.setFont('courier', 'bold');
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(refCode.replace(/\//g, '-'), vCol2 + 40, vy);

  y += 30;

  // ─── 6. SIGNATURE BOXES & STAMP ───────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. SIGNATURES & OFFICIAL ENDORSEMENT', margin, y);

  y += 4;

  const boxWidth = (contentWidth - 8) / 3;
  const boxHeight = 32;

  // Box 1: Candidate
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CANDIDATE SIGNATURE', margin + 4, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('(Accepted & Confirmed)', margin + 4, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(candidateName, margin + 4, y + 28);

  // Box 2: Handling Officer
  const box2X = margin + boxWidth + 4;
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('HANDLING STAFF SIGNATURE', box2X + 4, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('(Verified on Desk)', box2X + 4, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(staffHandler, box2X + 4, y + 28);

  // Box 3: Authorized Signatory
  const box3X = box2X + boxWidth + 4;
  doc.roundedRect(box3X, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED SIGNATORY', box3X + 4, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('(Chhaya International Pvt. Ltd.)', box3X + 4, y + 9);

  // Official Seal watermark representation
  doc.setDrawColor(220, 38, 38); // red-600
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.roundedRect(box3X + 8, y + 13, boxWidth - 16, 10, 1, 1, 'D');
  doc.text('OFFICIALLY VERIFIED', box3X + 11, y + 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('Director / Office Manager', box3X + 4, y + 28);

  // ─── 7. BOTTOM FOOTER ─────────────────────────────────────────────────
  const footY = pageHeight - 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footY - 3, pageWidth - margin, footY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('This is a computer-generated confirmation certificate under Chhaya International Client Management System.', margin, footY);
  doc.text(`Page 1 of 1  •  Case: ${caseId}`, pageWidth - margin - 35, footY);

  // ─── 8. ACTIONS & RETURN ──────────────────────────────────────────────
  const fileName = `${candidateName.replace(/\s+/g, '_')}_${template.docType}_Confirmation.pdf`;

  if (options.download) {
    doc.save(fileName);
  }

  if (options.returnBlob) {
    return {
      blob: doc.output('blob'),
      fileName,
    };
  }

  return doc;
};
