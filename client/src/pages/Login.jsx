import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import AuroraBackground from '../components/ui/AuroraBackground';

const Login = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES.ENGINEERING });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password, form.role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const inputCls = `w-full py-[11px] px-3.5 bg-white/[0.04] border border-white/[0.15] rounded-xl
                    text-[13.5px] text-white placeholder-white/30 outline-none
                    focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30
                    transition-all`;
  
  const labelCls = "block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider";

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-[420px] relative z-10">

        {/* Logo block */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border-[1.5px] border-white/[0.1]
                          flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-xl">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
              <rect x="1.5" y="1.5" width="7.5" height="7.5" rx="1.5" stroke="#00B4D8" strokeWidth="1.7"/>
              <rect x="13" y="1.5" width="7.5" height="7.5" rx="1.5" stroke="#00B4D8" strokeWidth="1.7"/>
              <rect x="1.5" y="13" width="7.5" height="7.5" rx="1.5" stroke="#00B4D8" strokeWidth="1.7"/>
              <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" stroke="#00B4D8" strokeWidth="1.7"/>
            </svg>
          </div>
          <h1 className="m-0 text-[26px] font-bold text-white tracking-tight">RevoraX</h1>
          <p className="m-0 mt-1.5 text-[13.5px] text-[#90E0EF] font-medium tracking-wide">Product Lifecycle Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20
                        rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          
          {/* Tabs */}
          <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl p-[5px] mb-8">
            {['login', 'signup'].map((tab) => (
              <button key={tab} onClick={() => { setMode(tab); setError(''); }}
                className={`flex-1 py-2 text-[13px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-300
                            ${mode === tab 
                              ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20' 
                              : 'bg-transparent text-white/50 hover:text-white/80'}`}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl
                              p-3 text-[13px] text-red-300 font-medium text-center">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className={labelCls}>Full Name</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} required
                  placeholder="John Doe" className={inputCls} />
              </div>
            )}

            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
                placeholder="you@company.com" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6}
                placeholder="••••••••" className={inputCls} />
            </div>

            {mode === 'signup' && (
              <div>
                <label className={labelCls}>Role</label>
                <select value={form.role} onChange={(e) => set('role', e.target.value)}
                  className={`${inputCls} bg-[#0a0e27]`}>
                  {Object.values(ROLES).map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`mt-3 py-3.5 border-none rounded-xl font-semibold text-[14px]
                          cursor-pointer transition-all duration-300 text-white
                          flex items-center justify-center gap-2.5 shadow-lg
                          ${loading ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#00B4D8] hover:bg-[#0096B4] hover:shadow-[#00B4D8]/20'}
                        `}
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white/90 rounded-full animate-spin" />
              )}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-white/30 mt-8 tracking-widest uppercase font-medium">
          RevoraX © 2026 — Internal Use Only
        </p>
      </div>
      </div>
    </AuroraBackground>
  );
};

export default Login;
