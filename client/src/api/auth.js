import api from './axiosInstance';

/** POST /api/auth/login */
export const login = (data) => api.post('/auth/login', data);

/** GET /api/auth/me */
export const me = () => api.get('/auth/me');
export const getMe = me; // backward compat alias

/** GET /api/auth/users (admin only) */
export const getAllUsers = () => api.get('/auth/users');
