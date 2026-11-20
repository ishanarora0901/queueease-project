import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateReceiptPDFBuffer = async (payment) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Generate verification QR code buffer
      const qrData = `QUEUEEASE-RECEIPT:${payment.receiptNumber}:TXN:${payment.transactionId}:AMOUNT:${payment.amount}:STUDENT:${payment.studentRollNumber}`;
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 120, margin: 1 });

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('QUEUEEASE SMART CAMPUS', 55, 52);
      doc.fontSize(10).font('Helvetica').fillColor('#94A3B8').text('Centralized Campus Administrative Management Portal', 55, 74);

      // Receipt Title
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('OFFICIAL ELECTRONIC FEE RECEIPT', 40, 120);
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(`Issued on: ${new Date(payment.paidAt || Date.now()).toLocaleString()}`, 40, 138);

      // Status Badge
      doc.roundedRect(430, 115, 120, 26, 4).fill('#ECFDF5');
      doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold').text('✓ PAYMENT SUCCESS', 440, 123);

      doc.moveTo(40, 155).lineTo(555, 155).strokeColor('#E2E8F0').stroke();

      // Student and Transaction Details Grid
      let y = 170;
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text('Student Details', 40, y);
      doc.text('Payment Information', 300, y);

      y += 18;
      doc.font('Helvetica').fontSize(9).fillColor('#64748B');
      doc.text(`Student Name: `, 40, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.studentName || 'Aarav Patel', 130, y);
      doc.fillColor('#64748B').font('Helvetica').text(`Receipt Number: `, 300, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.receiptNumber, 400, y);

      y += 18;
      doc.fillColor('#64748B').font('Helvetica').text(`Roll Number: `, 40, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.studentRollNumber || 'CS2023089', 130, y);
      doc.fillColor('#64748B').font('Helvetica').text(`Transaction ID: `, 300, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.transactionId, 400, y);

      y += 18;
      doc.fillColor('#64748B').font('Helvetica').text(`Academic Year: `, 40, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.academicYear || '2025-2026', 130, y);
      doc.fillColor('#64748B').font('Helvetica').text(`Payment Mode: `, 300, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.paymentMethod || 'Online Gateway', 400, y);

      y += 18;
      doc.fillColor('#64748B').font('Helvetica').text(`Semester: `, 40, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.semester || 'Semester 4', 130, y);
      doc.fillColor('#64748B').font('Helvetica').text(`Gateway Ref: `, 300, y);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(payment.razorpayPaymentId || 'GATEWAY-OK', 400, y);

      // Itemized Breakdown Table
      y += 35;
      doc.rect(40, y, 515, 24).fill('#F1F5F9');
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9);
      doc.text('SL', 50, y + 7);
      doc.text('DESCRIPTION / FEE HEAD', 80, y + 7);
      doc.text('ACADEMIC TERM', 320, y + 7);
      doc.text('AMOUNT (INR)', 460, y + 7);

      y += 24;
      doc.rect(40, y, 515, 30).fill('#FFFFFF');
      doc.moveTo(40, y + 30).lineTo(555, y + 30).strokeColor('#E2E8F0').stroke();
      doc.fillColor('#334155').font('Helvetica').fontSize(9);
      doc.text('1', 50, y + 10);
      doc.text(payment.feeCategory, 80, y + 10);
      doc.text(payment.semester || 'Current Session', 320, y + 10);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(`₹ ${payment.amount.toLocaleString('en-IN')}`, 460, y + 10);

      // Total Box
      y += 35;
      doc.rect(300, y, 255, 30).fill('#F8FAFC');
      doc.rect(300, y, 255, 30).strokeColor('#CBD5E1').stroke();
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text('TOTAL AMOUNT PAID:', 310, y + 9);
      doc.fillColor('#0D9488').text(`₹ ${payment.amount.toLocaleString('en-IN')}`, 460, y + 9);

      // QR Code and Verification Section
      y += 50;
      doc.image(qrBuffer, 40, y, { width: 90, height: 90 });

      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Scan to Verify Receipt Authenticity', 145, y + 10);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(
        'This is a computer-generated digital receipt issued by QueueEase Campus Management System. No physical signature is required. Tampering with this document is an offense.',
        145,
        y + 26,
        { width: 260 }
      );

      // University Seal / Registrar signature mark
      doc.rect(430, y + 15, 120, 55).strokeColor('#94A3B8').dash(3, { space: 3 }).stroke();
      doc.undash();
      doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold').text('DIGITALLY SIGNED', 450, y + 25);
      doc.font('Helvetica').fontSize(6).text('Finance Officer / Registrar', 445, y + 40);
      doc.text('QueueEase Campus ERP', 448, y + 50);

      // Footer
      doc.fillColor('#94A3B8').fontSize(7).text('QueueEase – Skip the Wait, Manage Your Campus Services Smartly.', 40, 770, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const generateCertificatePDFBuffer = async (application) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const qrData = `QUEUEEASE-CAD-VERIFY:${application.applicationNumber}:STUDENT:${application.studentDetails?.rollNumber || 'CS2023089'}`;
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 100, margin: 1 });

      // Border frame
      doc.rect(30, 30, 535, 780).lineWidth(2).strokeColor('#0F172A').stroke();
      doc.rect(35, 35, 525, 770).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

      // University Emblem Header
      doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold').text('APEX INSTITUTE OF TECHNOLOGY & SCIENCE', 45, 65, { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#475569').text('Accredited by NAAC Grade "A+" | Affiliated to State University', 45, 90, { align: 'center' });
      doc.text('College Administrative Department (CAD) | Campus ERP Services', 45, 105, { align: 'center' });

      doc.moveTo(60, 125).lineTo(535, 125).strokeColor('#0D9488').lineWidth(1.5).stroke();

      // Certificate Title
      doc.fillColor('#0F172A').fontSize(16).font('Helvetica-Bold').text(application.documentType.toUpperCase(), 45, 155, { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(`Ref No: ${application.applicationNumber}`, 60, 185);
      doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-GB')}`, 420, 185);

      // Body text
      const studentName = application.studentDetails?.name || 'Aarav Patel';
      const rollNumber = application.studentDetails?.rollNumber || 'CS2023089';
      const dept = application.studentDetails?.department || 'Computer Science & Engineering';

      const bodyText = `This is to certify that Mr./Ms. ${studentName}, bearing University Roll Number ${rollNumber}, is a bonafide student of this Institute enrolled in the Department of ${dept}.\n\nAccording to college records, his/her conduct and academic character have been satisfactory throughout the period of study. This certificate is issued upon the student's request for the purpose of: "${application.purpose}".`;

      doc.fillColor('#1E293B').fontSize(11).font('Helvetica').text(bodyText, 60, 225, {
        align: 'justify',
        lineGap: 6,
        width: 475,
      });

      // Verification QR and Signatures
      const y = 460;
      doc.image(qrBuffer, 60, y, { width: 85, height: 85 });
      doc.fontSize(7).fillColor('#64748B').text('Scan to verify digital validity', 55, y + 92);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('Administrative Officer', 380, y + 60, { align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor('#64748B').text('College Administrative Dept (CAD)', 380, y + 75, { align: 'center' });
      doc.text('Apex Institute of Technology', 380, y + 88, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

