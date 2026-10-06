import { jsPDF } from 'jspdf';

/**
 * Triggers crisp, single-page A4 printing of Chhaya International Candidate Registration Form.
 * Opens an isolated invisible iframe to prevent browser modal/backdrop clipping.
 */
export const printRegistrationForm = (form, options = { photoPreview: null, signaturePreview: null, blank: false }) => {
  if (!form) return;

  const isBlank = Boolean(options.blank);
  const fullName = isBlank ? '' : (form.fullName || '');
  const fatherName = isBlank ? '' : (form.fatherName || '');
  const address = isBlank ? '' : (form.address || '');
  const state = isBlank ? '' : (form.state || 'Uttar Pradesh');
  const pinCode = isBlank ? '' : (form.pinCode || '');
  const contactNo = isBlank ? '' : (form.contactNo || '');
  const whatsappNo = isBlank ? '' : (form.whatsappNo || '');
  const email = isBlank ? '' : (form.email || '');
  const familyContact = isBlank ? '' : (form.familyContact || '');

  const passportNumber = isBlank ? '' : (form.passportNumber || '');
  const dob = isBlank ? '' : (form.dob || '');
  const passportIssue = isBlank ? '' : (form.passportIssue || '');
  const passportExpiry = isBlank ? '' : (form.passportExpiry || '');
  const ecrStatus = isBlank ? '' : (form.ecrStatus || 'ECNR');
  const nationality = isBlank ? '' : (form.nationality || 'Indian');

  const occupation = isBlank ? '' : (form.occupation || '');
  const placeOfEmployment = isBlank ? '' : (form.placeOfEmployment || '');
  const lastExperience = isBlank ? '' : (form.lastExperience || '');
  const lastSalaryAndPost = isBlank ? '' : (form.lastSalaryAndPost || '');
  const newExpectedSalary = isBlank ? '' : (form.newExpectedSalary || '');
  const medicalReport = isBlank ? '' : (form.medicalReport || 'Pending');
  const pccStatus = isBlank ? '' : (form.pccStatus || 'Pending');

  const agentCode = isBlank ? '' : (form.agentCode || 'AG-771');
  const officeCountry = isBlank ? '' : (form.officeConfirmationCountry || 'Saudi Arabia');
  const officeWork = isBlank ? '' : (form.officeConfirmationWork || occupation || 'General Worker');
  const officeSalary = isBlank ? '' : (form.officeConfirmationSalary || 'SAR 2,500');

  const regDate = form.date || new Date().toISOString().split('T')[0];
  const regNo = form.regNo || 'CIP-REG';

  const photoHtml = (!isBlank && options.photoPreview)
    ? `<img src="${options.photoPreview}" alt="Photo" />`
    : `<div style="text-align: center; color: #888; font-size: 8.5px; line-height: 1.2;">PASTE PASSPORT PHOTO<br><span style="font-size: 7.5px;">(35 × 45 mm)</span></div>`;

  const sigHtml = (!isBlank && options.signaturePreview)
    ? `<img src="${options.signaturePreview}" alt="Signature" style="max-height: 40px; max-width: 90%; object-fit: contain;" />`
    : (!isBlank && fullName)
      ? `<span style="font-family: monospace; font-size: 11px; font-weight: bold; color: #222;">${fullName}</span>`
      : `<span style="color: #999; font-size: 9px; font-style: italic;">Candidate Signature / Thumb Impression</span>`;

  const printHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Registration Form - ${regNo} - ${fullName || 'Candidate'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 7mm 9mm 7mm 9mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      padding: 0;
      line-height: 1.25;
      font-size: 10px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .sheet {
      width: 100%;
      max-width: 192mm;
      margin: 0 auto;
    }
    
    /* Header */
    .top-header {
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .co-name {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .co-address {
      font-size: 9.5px;
      color: #222;
      margin-top: 1.5px;
      font-weight: 500;
    }
    .co-contact {
      font-size: 9px;
      color: #111;
      margin-top: 2px;
      font-weight: 700;
    }
    .co-right {
      text-align: right;
    }
    .co-badge {
      font-size: 14px;
      font-weight: 900;
      line-height: 1.1;
    }
    .co-lic {
      font-size: 8px;
      color: #555;
      margin-top: 2px;
      font-family: monospace;
    }

    /* Form Title & Meta */
    .title-banner {
      text-align: center;
      margin-bottom: 4px;
    }
    .title-banner h2 {
      display: inline-block;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1.5px solid #000;
      padding-bottom: 1px;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      font-weight: 700;
      border-bottom: 1px solid #777;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .meta-val {
      font-family: monospace;
      font-size: 11px;
      text-decoration: underline;
      font-weight: 800;
    }

    /* Section Headings */
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2.5px;
      display: flex;
      align-items: center;
      gap: 3px;
      color: #111;
    }

    /* Grid Form Table */
    .field-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
    }
    .field-table td {
      border: 1px solid #666;
      padding: 3.5px 5.5px;
      font-size: 9.5px;
      vertical-align: top;
    }
    .field-label {
      color: #555;
      font-size: 8.5px;
      display: block;
      margin-bottom: 1px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .field-val {
      font-weight: 800;
      color: #000;
      min-height: 13px;
      display: block;
      font-size: 10px;
    }

    /* Declaration */
    .declaration-box {
      border: 1px solid #000;
      padding: 4px 7px;
      font-size: 9px;
      line-height: 1.35;
      font-style: italic;
      color: #222;
      margin-bottom: 6px;
      background: #fafafa;
    }

    /* Signatures & Photo */
    .sign-photo-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      margin-bottom: 5px;
    }
    .sign-container {
      flex: 1;
    }
    .sign-title {
      font-size: 9.5px;
      font-weight: 800;
      border-bottom: 1px solid #000;
      padding-bottom: 1.5px;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .sign-box {
      height: 48px;
      border: 1px solid #666;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }

    .photo-container {
      width: 82px;
      text-align: center;
    }
    .photo-title {
      font-size: 9.5px;
      font-weight: 800;
      border-bottom: 1px solid #000;
      padding-bottom: 1.5px;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .photo-box {
      width: 76px;
      height: 90px;
      border: 1px solid #666;
      border-radius: 3px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fafafa;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Office Use Only */
    .office-panel {
      border-top: 1.5px solid #000;
      padding-top: 3.5px;
      margin-top: 2px;
    }
    .office-heading {
      font-size: 9.5px;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 2.5px;
      color: #000;
    }
    .office-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      background: #fdfdfd;
    }
    .office-table td {
      border: 1px solid #000;
      padding: 3px 5px;
      font-size: 9px;
      width: 25%;
    }
    .office-label {
      font-size: 8px;
      font-weight: 700;
      color: #555;
      display: block;
      text-transform: uppercase;
    }
    .office-val {
      font-size: 9.5px;
      font-weight: 800;
      color: #000;
    }

    /* Small Footer */
    .doc-footer {
      text-align: center;
      font-size: 7.5px;
      color: #555;
      margin-top: 4px;
      border-top: 0.5px dashed #aaa;
      padding-top: 2px;
    }

    @media print {
      body {
        padding: 0;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    
    <!-- 1. Header -->
    <div class="top-header">
      <div>
        <div class="co-name">Chhaya International Pvt. Ltd.</div>
        <div class="co-address">LIG 2 Nirala Nagar Unnao, Uttar Pradesh 209801</div>
        <div class="co-contact">
          Email: chhayainternationalpvtltd@gmail.com &nbsp;•&nbsp; Contact No: +91 80814 78307
        </div>
      </div>
      <div class="co-right">
        <div class="co-brand">Chhaya International</div>
        <div class="co-lic">Ministry Reg: B-1204/UP/COM/1000+/5/9821/2021</div>
      </div>
    </div>

    <!-- 2. Form Title & Meta -->
    <div class="title-banner">
      <h2>Registration Form</h2>
    </div>
    
    <div class="meta-bar">
      <div class="meta-item">
        <span>Date:</span>
        <span class="meta-val">${regDate}</span>
      </div>
      <div class="meta-item">
        <span>Registration No:</span>
        <span class="meta-val">${regNo}</span>
      </div>
    </div>

    <!-- 3. Personal Details -->
    <div class="section-title">● 1. Personal Details</div>
    <table class="field-table">
      <tr>
        <td style="width: 50%;">
          <span class="field-label">Full Name</span>
          <span class="field-val">${fullName || '&nbsp;'}</span>
        </td>
        <td style="width: 50%;">
          <span class="field-label">Father Name</span>
          <span class="field-val">${fatherName || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <span class="field-label">Permanent Address</span>
          <span class="field-val">${address || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="field-label">State</span>
          <span class="field-val">${state || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">PIN Code</span>
          <span class="field-val">${pinCode || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="field-label">Contact No</span>
          <span class="field-val">${contactNo || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">WhatsApp Number</span>
          <span class="field-val">${whatsappNo || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="field-label">Email ID</span>
          <span class="field-val">${email || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">Family / Alternate Contact</span>
          <span class="field-val">${familyContact || '&nbsp;'}</span>
        </td>
      </tr>
    </table>

    <!-- 4. Passport Details -->
    <div class="section-title">● 2. Passport Particulars</div>
    <table class="field-table">
      <tr>
        <td style="width: 33.33%;">
          <span class="field-label">Passport Number</span>
          <span class="field-val" style="font-family: monospace;">${passportNumber || '&nbsp;'}</span>
        </td>
        <td style="width: 33.33%;">
          <span class="field-label">Date Of Birth</span>
          <span class="field-val">${dob || '&nbsp;'}</span>
        </td>
        <td style="width: 33.33%;">
          <span class="field-label">Passport Issue Date</span>
          <span class="field-val">${passportIssue || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="field-label">Passport Expiry Date</span>
          <span class="field-val">${passportExpiry || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">ECR / ECNR Status</span>
          <span class="field-val">${ecrStatus || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">Nationality</span>
          <span class="field-val">${nationality || '&nbsp;'}</span>
        </td>
      </tr>
    </table>

    <!-- 5. Work Details -->
    <div class="section-title">● 3. Work & Professional Details</div>
    <table class="field-table">
      <tr>
        <td style="width: 50%;">
          <span class="field-label">Occupation / Trade</span>
          <span class="field-val">${occupation || '&nbsp;'}</span>
        </td>
        <td style="width: 50%;">
          <span class="field-label">Place of Employment</span>
          <span class="field-val">${placeOfEmployment || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="field-label">Last Experience</span>
          <span class="field-val">${lastExperience || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">Last Salary & Post</span>
          <span class="field-val">${lastSalaryAndPost || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="field-label">New Expected Salary</span>
          <span class="field-val">${newExpectedSalary || '&nbsp;'}</span>
        </td>
        <td>
          <span class="field-label">GAMCA Medical Report Status</span>
          <span class="field-val">${medicalReport || '&nbsp;'}</span>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <span class="field-label">Police Clearance Certificate (PCC) Status</span>
          <span class="field-val">${pccStatus || '&nbsp;'}</span>
        </td>
      </tr>
    </table>

    <!-- 6. Declaration -->
    <div class="declaration-box">
      <strong>Candidate Declaration:</strong> I hereby accept that all details filled above are correct and I certify that I do not apply my passport for another country or office during 3 months of Application submitted date.
    </div>

    <!-- 7. Signatures & Photo -->
    <div class="sign-photo-row">
      <div class="sign-container">
        <div class="sign-title">Candidate Name & Signature:</div>
        <div class="sign-box">
          ${sigHtml}
        </div>
      </div>
      <div class="photo-container">
        <div class="photo-title">Photo:</div>
        <div class="photo-box">
          ${photoHtml}
        </div>
      </div>
    </div>

    <!-- 8. For Office Use Only -->
    <div class="office-panel">
      <div class="office-heading">For Office Use Only:</div>
      <table class="office-table">
        <tr>
          <td>
            <span class="office-label">Agent Code</span>
            <span class="office-val">${agentCode || 'AG-771'}</span>
          </td>
          <td>
            <span class="office-label">Country</span>
            <span class="office-val">${officeCountry || 'Saudi Arabia'}</span>
          </td>
          <td>
            <span class="office-label">Work / Trade</span>
            <span class="office-val">${officeWork || 'General Worker'}</span>
          </td>
          <td>
            <span class="office-label">Agreed Salary</span>
            <span class="office-val">${officeSalary || 'SAR 2,500'}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- 9. Legal Footer -->
    <div class="doc-footer">
      Official Physical Candidate Registration Sheet • Chhaya International Pvt. Ltd. (Govt. Approved Recruitment Agency)
    </div>

  </div>
</body>
</html>
  `;

  try {
    let iframe = document.getElementById('chhaya-reg-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'chhaya-reg-print-frame';
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
    doc.write(printHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 300);
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.open:', err);
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
  }
};

/**
 * Generates an official, perfectly formatted A4 Vector PDF of the Candidate Registration Form.
 */
export const generateRegistrationFormPdf = (form, options = { photoPreview: null, signaturePreview: null, download: true, blank: false }) => {
  if (!form) return;

  const isBlank = Boolean(options.blank);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186
  const colHalf = contentWidth / 2; // 93
  const colThird = contentWidth / 3; // 62
  const colQuarter = contentWidth / 4; // 46.5

  const fullName = isBlank ? '' : (form.fullName || '');
  const fatherName = isBlank ? '' : (form.fatherName || '');
  const address = isBlank ? '' : (form.address || '');
  const state = isBlank ? '' : (form.state || 'Uttar Pradesh');
  const pinCode = isBlank ? '' : (form.pinCode || '');
  const contactNo = isBlank ? '' : (form.contactNo || '');
  const whatsappNo = isBlank ? '' : (form.whatsappNo || '');
  const email = isBlank ? '' : (form.email || '');
  const familyContact = isBlank ? '' : (form.familyContact || '');

  const passportNumber = isBlank ? '' : (form.passportNumber || '');
  const dob = isBlank ? '' : (form.dob || '');
  const passportIssue = isBlank ? '' : (form.passportIssue || '');
  const passportExpiry = isBlank ? '' : (form.passportExpiry || '');
  const ecrStatus = isBlank ? '' : (form.ecrStatus || 'ECNR');
  const nationality = isBlank ? '' : (form.nationality || 'Indian');

  const occupation = isBlank ? '' : (form.occupation || '');
  const placeOfEmployment = isBlank ? '' : (form.placeOfEmployment || '');
  const lastExperience = isBlank ? '' : (form.lastExperience || '');
  const lastSalaryAndPost = isBlank ? '' : (form.lastSalaryAndPost || '');
  const newExpectedSalary = isBlank ? '' : (form.newExpectedSalary || '');
  const medicalReport = isBlank ? '' : (form.medicalReport || 'Pending');
  const pccStatus = isBlank ? '' : (form.pccStatus || 'Pending');

  const regDate = form.date || new Date().toISOString().split('T')[0];
  const regNo = form.regNo || 'CIP-REG';

  // 1. Top Header
  let y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text('CHHAYA INTERNATIONAL PVT. LTD.', margin, y);

  doc.setFontSize(12);
  doc.text('Chhaya International', pageWidth - margin, y, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('LIG 2 Nirala Nagar Unnao, Uttar Pradesh 209801', margin, y);
  doc.text('Ministry Reg: B-1204/UP/COM/1000+/5/9821/2021', pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.setFontSize(8);
  doc.text('Email: chhayainternationalpvtltd@gmail.com  •  Contact No: +91 80814 78307', margin, y);

  y += 3.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);

  // 2. Title & Meta Row
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('REGISTRATION FORM', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFontSize(8.5);
  doc.text(`Date: ${regDate}`, margin, y);
  doc.text(`Reg No.: ${regNo}`, pageWidth - margin, y, { align: 'right' });

  y += 2.5;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Helper function to draw table cells
  const drawCell = (x, yPos, w, h, label, val) => {
    doc.setDrawColor(140, 140, 140);
    doc.setLineWidth(0.2);
    doc.rect(x, yPos, w, h);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text(label.toUpperCase(), x + 2, yPos + 3.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(String(val || ''), x + 2, yPos + 7.5);
  };

  // 3. Section 1: Personal Details
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('1. PERSONAL DETAILS', margin, y);

  y += 2;
  const rowH = 9.2;
  // Row 1
  drawCell(margin, y, colHalf, rowH, 'Full Name', fullName);
  drawCell(margin + colHalf, y, colHalf, rowH, 'Father Name', fatherName);
  y += rowH;

  // Row 2
  drawCell(margin, y, contentWidth, rowH, 'Permanent Address', address);
  y += rowH;

  // Row 3
  drawCell(margin, y, colHalf, rowH, 'State', state);
  drawCell(margin + colHalf, y, colHalf, rowH, 'PIN Code', pinCode);
  y += rowH;

  // Row 4
  drawCell(margin, y, colHalf, rowH, 'Contact No', contactNo);
  drawCell(margin + colHalf, y, colHalf, rowH, 'WhatsApp Number', whatsappNo);
  y += rowH;

  // Row 5
  drawCell(margin, y, colHalf, rowH, 'Email ID', email);
  drawCell(margin + colHalf, y, colHalf, rowH, 'Family / Alternate Contact', familyContact);
  y += rowH;

  // 4. Section 2: Passport Particulars
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('2. PASSPORT PARTICULARS', margin, y);

  y += 2;
  // Row 1 (3 cols)
  drawCell(margin, y, colThird, rowH, 'Passport Number', passportNumber);
  drawCell(margin + colThird, y, colThird, rowH, 'Date of Birth', dob);
  drawCell(margin + colThird * 2, y, colThird, rowH, 'Issue Date', passportIssue);
  y += rowH;

  // Row 2 (3 cols)
  drawCell(margin, y, colThird, rowH, 'Expiry Date', passportExpiry);
  drawCell(margin + colThird, y, colThird, rowH, 'ECR / ECNR Status', ecrStatus);
  drawCell(margin + colThird * 2, y, colThird, rowH, 'Nationality', nationality);
  y += rowH;

  // 5. Section 3: Work & Professional Details
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('3. WORK & PROFESSIONAL DETAILS', margin, y);

  y += 2;
  // Row 1
  drawCell(margin, y, colHalf, rowH, 'Occupation / Trade', occupation);
  drawCell(margin + colHalf, y, colHalf, rowH, 'Place of Employment', placeOfEmployment);
  y += rowH;

  // Row 2
  drawCell(margin, y, colHalf, rowH, 'Last Experience', lastExperience);
  drawCell(margin + colHalf, y, colHalf, rowH, 'Last Salary & Post', lastSalaryAndPost);
  y += rowH;

  // Row 3
  drawCell(margin, y, colHalf, rowH, 'New Expected Salary', newExpectedSalary);
  drawCell(margin + colHalf, y, colHalf, rowH, 'Medical Report Status', medicalReport);
  y += rowH;

  // Row 4
  drawCell(margin, y, contentWidth, rowH, 'Police Clearance Certificate (PCC) Status', pccStatus);
  y += rowH;

  // 6. Declaration Box
  y += 4;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 12, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const declText = 'I hereby accept that all details filled above are correct and I certify that I do not apply my passport for another country or office during 3 months of Application submitted date.';
  doc.text(declText, margin + 2.5, y + 5, { maxWidth: contentWidth - 5 });
  y += 15;

  // 7. Signature & Photo Area
  const photoW = 26;
  const photoH = 32;
  const sigW = contentWidth - photoW - 10;
  const sigH = 32;

  // Signature Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('CANDIDATE NAME & SIGNATURE:', margin, y);

  // Photo Box Title
  doc.text('PHOTO (35x45mm):', margin + sigW + 10, y);

  y += 2.5;
  // Draw Signature Rect
  doc.setDrawColor(140, 140, 140);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, sigW, sigH);

  if (!isBlank && fullName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(fullName, margin + 5, y + sigH - 4);
  }

  // Draw Photo Rect
  doc.rect(margin + sigW + 10, y, photoW, photoH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('PASTE PHOTO', margin + sigW + 10 + photoW / 2, y + photoH / 2, { align: 'center' });

  y += sigH + 5;

  // 8. For Office Use Only
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('FOR OFFICE USE ONLY:', margin, y);

  y += 2;
  const officeH = 8.5;
  drawCell(margin, y, colQuarter, officeH, 'Agent Code', form.agentCode || 'AG-771');
  drawCell(margin + colQuarter, y, colQuarter, officeH, 'Country', form.officeConfirmationCountry || 'Saudi Arabia');
  drawCell(margin + colQuarter * 2, y, colQuarter, officeH, 'Work / Trade', form.officeConfirmationWork || occupation || 'Pipe Fitter');
  drawCell(margin + colQuarter * 3, y, colQuarter, officeH, 'Agreed Salary', form.officeConfirmationSalary || 'SAR 2,500');

  // 9. Document Footer
  y += officeH + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Official Candidate Physical Registration Sheet • Chhaya International Pvt. Ltd. • Ministry of External Affairs Licensed', pageWidth / 2, y, { align: 'center' });

  const fileName = `Registration_Form_${regNo}_${(fullName || 'Candidate').replace(/\s+/g, '_')}.pdf`;

  if (options.download) {
    doc.save(fileName);
  }

  return doc;
};
