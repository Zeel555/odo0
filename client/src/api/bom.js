import api from './axiosInstance';

/** GET /api/bom */
export const getBOMs = () => api.get('/bom');

/** GET /api/bom/:id */
export const getBOMById = (id) => api.get(`/bom/${id}`);

/** GET /api/bom/:id/history */
export const getBOMHistory = (id) => api.get(`/bom/${id}/history`);

/** POST /api/bom */
export const createBOM = (data) => api.post('/bom', data);

/** PUT /api/bom/:id — disabled server-side; use ECO */
export const updateBOM = (id, data) => api.put(`/bom/${id}`, data);

/** DELETE /api/bom/:id — archive (admin) */
export const archiveBOM = (id) => api.delete(`/bom/${id}`);
