import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Landing — public entry point.
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
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F0F9FF 0%, #EAF6FB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, maxWidth: 860, width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,119,182,0.12)', border: '1.5px solid #90E0EF', overflow: 'hidden' }}>

        {/* Left — Create Company */}
        <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="14" height="14" rx="3" fill="#0077B6"/>
              <rect x="18" width="14" height="14" rx="3" fill="#00B4D8"/>
              <rect y="18" width="14" height="14" rx="3" fill="#48CAE4"/>
              <rect x="18" y="18" width="14" height="14" rx="3" fill="#90E0EF"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 18, color: '#03045E' }}>RevoraX</span>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#03045E' }}>Start your workspace</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#90E0EF' }}>
              Create a company account and invite your team.
            </p>
          </div>

          <Link to="/create-company" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%', padding: '13px 20px', background: '#0077B6', color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
              onMouseOver={(e) => e.target.style.background = '#023E8A'}
              onMouseOut={(e) => e.target.style.background = '#0077B6'}
            >
              🏢 Create Company Account
            </button>
          </Link>

          <div style={{ background: '#EAF6FB', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#0077B6', lineHeight: 1.6 }}>
            <strong>What you get:</strong><br />
            ✓ Full ECO workflow management<br />
            ✓ Products & BOM versioning<br />
            ✓ Team invites with role-based access<br />
            ✓ Isolated company data
          </div>
        </div>

        {/* Divider */}
        <div style={{ background: '#CAF0F8' }} />

        {/* Right — Login */}
        <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#03045E' }}>Welcome back</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#90E0EF' }}>Sign in to your company workspace.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loginError && (
              <div style={{ background: '#FCEBEB', border: '1px solid #F28B82', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D' }}>
                {loginError}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0077B6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input
                type="email" required value={loginForm.email}
                onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #90E0EF', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#FAFEFF' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0077B6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input
                type="password" required value={loginForm.password}
                onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #90E0EF', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#FAFEFF' }}
              />
            </div>
            <button type="submit" disabled={loginLoading} style={{
              width: '100%', padding: '13px', background: loginLoading ? '#90E0EF' : '#023E8A',
              color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14,
              cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            }}>
              {loginLoading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Landing;
