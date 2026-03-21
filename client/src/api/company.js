import axios from './axiosInstance';

export const registerCompany = (data) => axios.post('/company/register', data);
export const getMyCompany    = ()     => axios.get('/company/me');
