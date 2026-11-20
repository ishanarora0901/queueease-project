import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['administrative', 'academic', 'finance', 'examination', 'services'],
    default: 'administrative',
  },
  description: {
    type: String,
    default: '',
  },
  building: {
    type: String,
    default: 'Main Administrative Block',
  },
  floor: {
    type: String,
    default: 'Ground Floor',
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  email: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  operatingHours: {
    open: { type: String, default: '09:00 AM' },
    close: { type: String, default: '05:00 PM' },
    lunchStart: { type: String, default: '01:00 PM' },
    lunchEnd: { type: String, default: '02:00 PM' },
  },
  servicesOffered: [{
    type: String,
  }],
}, {
  timestamps: true,
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;

