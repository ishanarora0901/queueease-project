import axiosClient from './axiosClient';

export const queueApi = {
  // Student
  getStudentActiveTokens: () => axiosClient.get('/queue/student/active'),
  getStudentHistory: () => axiosClient.get('/queue/student/history'),
  bookToken: (data) => axiosClient.post('/queue/book', data),
  cancelToken: (id, reason) => axiosClient.patch(`/queue/${id}/cancel`, { reason }),
  rescheduleToken: (id, data) => axiosClient.patch(`/queue/${id}/reschedule`, data),
  rejoinQueue: (id) => axiosClient.patch(`/queue/${id}/rejoin`),

  // Staff
  getCounterQueue: (counterId) => axiosClient.get(`/queue/counter/${counterId}`),
  callNextToken: (counterId) => axiosClient.post(`/queue/counter/${counterId}/call-next`),
  updateTokenStatus: (id, data) => axiosClient.patch(`/queue/${id}/status`, data),
  verifyTokenQR: (qrData) => axiosClient.post('/queue/verify-qr', { qrData }),
};

export const counterApi = {
  getAllCounters: () => axiosClient.get('/counters'),
  getCounterById: (id) => axiosClient.get(`/counters/${id}`),
  updateCounterStatus: (id, data) => axiosClient.patch(`/counters/${id}/status`, data),
};

