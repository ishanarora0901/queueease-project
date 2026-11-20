import { isMongoConnected } from '../config/db.js';
import DocumentApplication from '../models/DocumentApplication.js';
import User from '../models/User.js';
import { memoryStore } from '../config/memoryStore.js';
import { generateQRCodeDataURL } from '../services/qrService.js';
import { generateCertificatePDFBuffer } from '../services/pdfService.js';
import { sendNotification, getSocketIO } from '../services/notificationService.js';
import { logAuditEvent } from '../middleware/auditLogger.js';

export const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user._id;
    let apps = [];

    if (isMongoConnected()) {
      apps = await DocumentApplication.find({ student: studentId })
        .populate('collectionCounter', 'counterNumber name')
        .sort({ createdAt: -1 });
    } else {
      apps = memoryStore.getCadApplications({ student: studentId }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, applications: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCadApplications = async (req, res) => {
  try {
    const { status, documentType, search } = req.query;
    let apps = [];

    if (isMongoConnected()) {
      const query = {};
      if (status) query.status = status;
      if (documentType) query.documentType = documentType;

      apps = await DocumentApplication.find(query)
        .populate('student', 'name email phone avatar studentDetails')
        .populate('collectionCounter', 'counterNumber name')
        .sort({ createdAt: -1 });

      if (search) {
        apps = apps.filter((a) => {
          return (
            a.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
            a.student?.name.toLowerCase().includes(search.toLowerCase()) ||
            a.student?.studentDetails?.rollNumber?.toLowerCase().includes(search.toLowerCase())
          );
        });
      }
    } else {
      apps = memoryStore.getCadApplications();
      if (status) apps = apps.filter((a) => a.status === status);
      if (documentType) apps = apps.filter((a) => a.documentType === documentType);
      if (search) {
        apps = apps.filter(
          (a) =>
            a.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
            a.studentDetails?.name?.toLowerCase().includes(search.toLowerCase()) ||
            a.studentDetails?.rollNumber?.toLowerCase().includes(search.toLowerCase())
        );
      }
      apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, count: apps.length, applications: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCadApplication = async (req, res) => {
  try {
    const { documentType, purpose, urgency = 'standard', deliveryMethod = 'digital_download' } = req.body;
    const student = req.user;

    if (!documentType || !purpose) {
      return res.status(400).json({ success: false, message: 'Document Type and Purpose are required.' });
    }

    const appNum = `CAD-APP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    // Process uploaded files if any
    const attachedDocuments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachedDocuments.push({
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileType: file.mimetype,
          uploadedAt: new Date(),
        });
      });
    }

    const qrData = `QE-CAD-COLLECT:${appNum}:STUDENT:${student.studentDetails?.rollNumber || student.email}`;
    const collectionQrCode = await generateQRCodeDataURL(qrData);

    const appData = {
      applicationNumber: appNum,
      student: student._id,
      documentType,
      purpose,
      urgency,
      deliveryMethod,
      attachedDocuments,
      status: 'Submitted',
      collectionQrCode,
      timeline: [
        {
          status: 'Submitted',
          performedByName: student.name,
          timestamp: new Date(),
          notes: 'Application submitted online with required documents',
        },
      ],
    };

    let newApp = null;
    if (isMongoConnected()) {
      newApp = await DocumentApplication.create(appData);
    } else {
      newApp = memoryStore.createCadApplication(appData);
    }

    // Send confirmation notification
    await sendNotification({
      recipient: student._id,
      title: 'CAD Application Submitted',
      message: `Your application (${appNum}) for ${documentType} has been received and is under queue review.`,
      type: 'document_submitted',
      link: '/student/cad',
      metadata: { applicationNumber: appNum },
    });

    // Notify staff channel via socket
    const io = getSocketIO();
    if (io) {
      io.to('cad_channel').emit('new_cad_application', {
        applicationNumber: appNum,
        documentType,
        studentName: student.name,
      });
    }

    await logAuditEvent({
      action: 'CAD_APPLICATION_SUBMITTED',
      module: 'CAD',
      performedBy: student._id,
      performedByName: student.name,
      performedByRole: 'student',
      targetResource: `Application ${appNum}`,
      details: { documentType, urgency, deliveryMethod },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Application ${appNum} submitted successfully.`,
      application: newApp,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCadApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      reviewRemarks,
      rejectionReason,
      collectionDate,
      collectionTimeSlot,
      collectionCounterId,
    } = req.body;
    const staff = req.user;

    const validStatuses = [
      'Submitted',
      'Under Review',
      'Pending Documents',
      'Approved',
      'Rejected',
      'Ready for Collection',
      'Completed',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid application status.' });
    }

    let app = null;
    if (isMongoConnected()) {
      app = await DocumentApplication.findById(id).populate('student');
    } else {
      app = memoryStore.getCadApplicationById(id);
    }

    if (!app) {
      return res.status(404).json({ success: false, message: 'CAD application not found.' });
    }

    const now = new Date();
    const timelineEntry = {
      status,
      updatedBy: staff._id,
      updatedByName: staff.name,
      timestamp: now,
      notes: reviewRemarks || rejectionReason || `Status moved to ${status}`,
    };

    let issuedDocumentUrl = app.issuedDocumentUrl;
    if (status === 'Ready for Collection' || status === 'Approved') {
      issuedDocumentUrl = `/api/cad/download/${app.applicationNumber}`;
    }

    let updated = null;
    if (isMongoConnected()) {
      app.status = status;
      if (reviewRemarks !== undefined) app.reviewRemarks = reviewRemarks;
      if (rejectionReason !== undefined) app.rejectionReason = rejectionReason;
      if (collectionDate) app.collectionDate = collectionDate;
      if (collectionTimeSlot) app.collectionTimeSlot = collectionTimeSlot;
      if (collectionCounterId) app.collectionCounter = collectionCounterId;
      if (issuedDocumentUrl) app.issuedDocumentUrl = issuedDocumentUrl;
      app.assignedReviewer = staff._id;
      app.timeline.push(timelineEntry);

      if (status === 'Completed') {
        app.isCollected = true;
        app.collectedAt = now;
      }

      updated = await app.save();
    } else {
      app.timeline.push(timelineEntry);
      updated = memoryStore.updateCadApplication(id, {
        status,
        reviewRemarks: reviewRemarks !== undefined ? reviewRemarks : app.reviewRemarks,
        rejectionReason: rejectionReason !== undefined ? rejectionReason : app.rejectionReason,
        collectionDate: collectionDate || app.collectionDate,
        collectionTimeSlot: collectionTimeSlot || app.collectionTimeSlot,
        collectionCounter: collectionCounterId || app.collectionCounter,
        issuedDocumentUrl,
        assignedReviewer: staff._id,
        isCollected: status === 'Completed' ? true : app.isCollected,
        collectedAt: status === 'Completed' ? now : app.collectedAt,
        timeline: app.timeline,
      });
    }

    // Send notifications based on status change
    let notifTitle = `CAD Application Update: ${status}`;
    let notifMsg = `Your application ${app.applicationNumber} for ${app.documentType} is now ${status}.`;

    if (status === 'Ready for Collection') {
      notifTitle = '🎉 Document Ready for Download/Collection';
      notifMsg =
        app.deliveryMethod === 'digital_download'
          ? `Your ${app.documentType} has been approved and is available for instant digital download.`
          : `Your ${app.documentType} is ready for physical collection. Counter: CAD Desk.`;
    } else if (status === 'Rejected') {
      notifTitle = 'CAD Application Rejected';
      notifMsg = `Your application for ${app.documentType} was rejected. Reason: ${rejectionReason || 'Documents mismatch'}`;
    } else if (status === 'Pending Documents') {
      notifTitle = 'Action Required: Additional Documents Needed';
      notifMsg = `CAD officer has requested additional documents for ${app.documentType}. Remarks: ${reviewRemarks}`;
    }

    await sendNotification({
      recipient: app.student._id || app.student,
      title: notifTitle,
      message: notifMsg,
      type: `document_${status.toLowerCase().replace(/ /g, '_')}`,
      link: '/student/cad',
    });

    await logAuditEvent({
      action: `CAD_STATUS_${status.toUpperCase()}`,
      module: 'CAD',
      performedBy: staff._id,
      performedByName: staff.name,
      performedByRole: staff.role,
      targetResource: `Application ${app.applicationNumber}`,
      details: { status, reviewRemarks, rejectionReason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Application marked as ${status}.`,
      application: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download Generated Certificate PDF
export const downloadCertificatePDF = async (req, res) => {
  try {
    const { appNumber } = req.params;

    let app = null;
    if (isMongoConnected()) {
      app = await DocumentApplication.findOne({ applicationNumber: appNumber }).populate('student');
    } else {
      app = memoryStore.getCadApplicationById(appNumber);
    }

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application certificate not found.' });
    }

    const pdfBuffer = await generateCertificatePDFBuffer(app);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${app.applicationNumber}_${app.documentType.replace(/ /g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate PDF certificate: ' + error.message });
  }
};

// Verify physical document collection via QR scan
export const verifyCadCollectionQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    const staff = req.user;

    const match = qrData.match(/QE-CAD-COLLECT:([A-Z0-9-]+)/i);
    const applicationNumber = match ? match[1] : null;

    if (!applicationNumber) {
      return res.status(400).json({ success: false, message: 'Invalid CAD Collection QR code.' });
    }

    let app = null;
    if (isMongoConnected()) {
      app = await DocumentApplication.findOne({ applicationNumber }).populate('student');
    } else {
      app = memoryStore.getCadApplicationById(applicationNumber);
    }

    if (!app) {
      return res.status(404).json({ success: false, message: `Application ${applicationNumber} not found.` });
    }

    // Mark as collected
    const now = new Date();
    if (isMongoConnected()) {
      app.status = 'Completed';
      app.isCollected = true;
      app.collectedAt = now;
      app.timeline.push({
        status: 'Completed',
        updatedBy: staff._id,
        updatedByName: staff.name,
        timestamp: now,
        notes: 'Verified and physically handed over via QR verification',
      });
      await app.save();
    } else {
      app.timeline.push({
        status: 'Completed',
        updatedByName: staff.name,
        timestamp: now,
        notes: 'Verified and physically handed over via QR verification',
      });
      memoryStore.updateCadApplication(applicationNumber, {
        status: 'Completed',
        isCollected: true,
        collectedAt: now,
        timeline: app.timeline,
      });
    }

    res.json({
      success: true,
      message: `Verified: ${app.documentType} handed over to ${app.student?.name || app.studentDetails?.name}.`,
      application: app,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

