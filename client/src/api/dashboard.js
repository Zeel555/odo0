import api from './axiosInstance';

/** GET /api/dashboard/stats */
export const getDashboardStats = () => api.get('/dashboard/stats');
