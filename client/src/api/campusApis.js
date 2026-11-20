import axiosClient from './axiosClient';

export const staffApi = {
  getStaffList: (params) => axiosClient.get('/staff', { params }),
  updateAvailability: (data) => axiosClient.patch('/staff/availability', data),
  bookAppointment: (data) => axiosClient.post('/staff/appointments/book', data),
  getStudentAppointments: () => axiosClient.get('/staff/appointments/student'),
  getStaffAppointments: () => axiosClient.get('/staff/appointments/staff'),
  updateAppointmentStatus: (id, data) => axiosClient.patch(`/staff/appointments/${id}/status`, data),
};

export const cadApi = {
  getStudentApplications: () => axiosClient.get('/cad/my-applications'),
  getAllApplications: (params) => axiosClient.get('/cad/all', { params }),
  submitApplication: (formData) => axiosClient.post('/cad/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateApplicationStatus: (id, data) => axiosClient.patch(`/cad/${id}/status`, data),
  verifyCollectionQR: (qrData) => axiosClient.post('/cad/verify-collection-qr', { qrData }),
  downloadCertificateUrl: (appNumber) => `/api/cad/download/${appNumber}`,
};

export const paymentApi = {
  getFeeStatus: () => axiosClient.get('/payments/fee-status'),
  verifyStudentFee: (data) => axiosClient.post('/payments/verify-student-fee', data),
  initiateOrder: (data) => axiosClient.post('/payments/order', data),
  verifyPayment: (data) => axiosClient.post('/payments/verify', data),
  getAllTransactions: (params) => axiosClient.get('/payments/transactions', { params }),
  downloadReceiptUrl: (receiptNumber) => `/api/payments/receipt/${receiptNumber}`,
};

export const adminApi = {
  getDashboardMetrics: () => axiosClient.get('/admin/metrics'),
  getAllUsers: (params) => axiosClient.get('/admin/users', { params }),
  createUser: (data) => axiosClient.post('/admin/users', data),
  updateUserStatus: (id, data) => axiosClient.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`),
  createDepartment: (data) => axiosClient.post('/admin/departments', data),
  updateDepartment: (id, data) => axiosClient.patch(`/admin/departments/${id}`, data),
  createCounter: (data) => axiosClient.post('/admin/counters', data),
  updateCounter: (id, data) => axiosClient.patch(`/admin/counters/${id}`, data),
  getCampusWideQueues: () => axiosClient.get('/admin/queues'),
  overrideToken: (id, data) => axiosClient.patch(`/admin/tokens/${id}/override`, data),
  getAppointments: (params) => axiosClient.get('/admin/appointments', { params }),
  updateAppointmentStatus: (id, data) => axiosClient.patch(`/admin/appointments/${id}/status`, data),
  getAuditLogs: (params) => axiosClient.get('/admin/audit-logs', { params }),
};

export const notificationApi = {
  getNotifications: () => axiosClient.get('/notifications'),
  markAsRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch('/notifications/read-all'),
};

export const feedbackApi = {
  submitFeedback: (data) => axiosClient.post('/feedback', data),
  getFeedbacks: () => axiosClient.get('/feedback'),
};

