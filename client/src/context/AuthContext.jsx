import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, me as apiMe } from '../api/auth';
import { getMyCompany } from '../api/company';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const [meRes, companyRes] = await Promise.all([
        apiMe(),
        getMyCompany().catch(() => ({ data: null })),
      ]);
      setCurrentUser(meRes.data.user);
      setCurrentCompany(companyRes.data);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    localStorage.setItem('token', res.data.token);
    setCurrentUser(res.data.user);
    // Load company in background
    getMyCompany().then(r => setCurrentCompany(r.data)).catch(() => {});
    return res.data.user;
  };

  /** Called after company registration — token already in localStorage */
  const setCurrentUserFromToken = (user) => {
    setCurrentUser(user);
    getMyCompany().then(r => setCurrentCompany(r.data)).catch(() => {});
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentCompany(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, currentCompany, loading, login, logout, setCurrentUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
