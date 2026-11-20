import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  counter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
  },
  tokenNumber: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['Queue Experience', 'Staff Behavior', 'Service Delay', 'CAD Document Service', 'Payment Issue', 'General Suggestion'],
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Under Review', 'Resolved'],
    default: 'Open',
  },
  adminResponse: {
    type: String,
    default: '',
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  respondedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;

