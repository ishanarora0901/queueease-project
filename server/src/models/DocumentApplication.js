import mongoose from 'mongoose';

const documentApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentType: {
    type: String,
    enum: [
      'Bonafide Certificate',
      'Character Certificate',
      'No Dues Certificate',
      'Transcript',
      'Fee Receipt',
      'College ID Card Related Requests',
      'Migration Certificate',
      'Other Administrative Certificates'
    ],
    required: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  urgency: {
    type: String,
    enum: ['standard', 'urgent'],
    default: 'standard',
  },
  status: {
    type: String,
    enum: [
      'Submitted',
      'Under Review',
      'Pending Documents',
      'Approved',
      'Rejected',
      'Ready for Collection',
      'Completed'
    ],
    default: 'Submitted',
  },
  attachedDocuments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  reviewRemarks: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  assignedReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deliveryMethod: {
    type: String,
    enum: ['digital_download', 'physical_collection'],
    default: 'digital_download',
  },
  collectionDate: {
    type: String, // YYYY-MM-DD
  },
  collectionCounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
  },
  collectionTimeSlot: {
    type: String,
  },
  collectionQrCode: {
    type: String, // Data URI for collection QR verification
  },
  isCollected: {
    type: Boolean,
    default: false,
  },
  collectedAt: {
    type: Date,
  },
  issuedDocumentUrl: {
    type: String, // Downloadable URL for generated certificate
  },
  issuedAt: {
    type: Date,
  },
  timeline: [{
    status: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
  }],
}, {
  timestamps: true,
});

documentApplicationSchema.index({ student: 1, status: 1 });

const DocumentApplication = mongoose.model('DocumentApplication', documentApplicationSchema);
export default DocumentApplication;
