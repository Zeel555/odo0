import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/ui/AuroraBackground';

/**
 * Landing — public entry point with AuroraBackground.
 * Left: Create Company. Right: Login to existing account.
 */
const Landing = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-[860px]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_1fr] bg-white/10 backdrop-blur-xl
                        rounded-2xl border border-white/20 shadow-2xl overflow-hidden">

          {/* Left — Create Company */}
          <div className="p-10 md:p-12 flex flex-col gap-5">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="14" height="14" rx="3" fill="#0077B6"/>
                <rect x="18" width="14" height="14" rx="3" fill="#00B4D8"/>
                <rect y="18" width="14" height="14" rx="3" fill="#48CAE4"/>
                <rect x="18" y="18" width="14" height="14" rx="3" fill="#90E0EF"/>
              </svg>
              <span className="font-bold text-lg text-white">RevoraX</span>
            </div>

            <div>
              <h1 className="m-0 text-[22px] font-bold text-white">Start your workspace</h1>
              <p className="m-0 mt-1.5 text-sm text-white/50">
                Create a company account and invite your team.
              </p>
            </div>

            <Link to="/create-company" className="no-underline">
              <button className="w-full py-3.5 px-5 bg-plm-ocean text-white border-none rounded-xl
                                 font-semibold text-sm cursor-pointer
                                 hover:bg-[#023E8A] transition-colors">
                🏢 Create Company Account
              </button>
            </Link>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl
                            p-4 text-xs text-white/70 leading-relaxed">
              <strong className="text-white/90">What you get:</strong><br />
              ✓ Full ECO workflow management<br />
              ✓ Products & BOM versioning<br />
              ✓ Team invites with role-based access<br />
              ✓ Isolated company data
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block bg-white/20" />

          {/* Right — Login */}
          <div className="p-10 md:p-12 flex flex-col gap-5">
            <div>
              <h2 className="m-0 text-xl font-bold text-white">Welcome back</h2>
              <p className="m-0 mt-1.5 text-sm text-white/50">Sign in to your company workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              {loginError && (
                <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-3.5 py-2.5
                                text-sm text-red-200">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-white/60 mb-1.5
                                  uppercase tracking-wider">Email</label>
                <input
                  type="email" required value={loginForm.email}
                  onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="w-full py-3 px-3.5 bg-white/10 border border-white/20 rounded-lg
                             text-sm text-white placeholder-white/30 outline-none
                             focus:border-plm-surf focus:ring-1 focus:ring-plm-surf/30
                             transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/60 mb-1.5
                                  uppercase tracking-wider">Password</label>
                <input
                  type="password" required value={loginForm.password}
                  onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full py-3 px-3.5 bg-white/10 border border-white/20 rounded-lg
                             text-sm text-white placeholder-white/30 outline-none
                             focus:border-plm-surf focus:ring-1 focus:ring-plm-surf/30
                             transition-colors"
                />
              </div>
              <button
                type="submit" disabled={loginLoading}
                className={`w-full py-3.5 border-none rounded-xl font-semibold text-sm
                            cursor-pointer transition-colors text-white
                            ${loginLoading
                              ? 'bg-plm-frost/50 cursor-not-allowed'
                              : 'bg-[#023E8A] hover:bg-plm-deep'
                            }`}
              >
                {loginLoading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          </div>
        </div>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default Landing;
