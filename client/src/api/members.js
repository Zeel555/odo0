import axios from './axiosInstance';

export const getMembers    = ()              => axios.get('/members');
export const inviteMember  = (data)          => axios.post('/members/invite', data);
export const resendInvite  = (inviteId)      => axios.post(`/members/resend/${inviteId}`);
export const removeMember  = (userId)        => axios.delete(`/members/${userId}`);
export const getInvite     = (token)         => axios.get(`/invite/${token}`);
export const acceptInvite  = (token, data)   => axios.post(`/invite/${token}/accept`, data);
