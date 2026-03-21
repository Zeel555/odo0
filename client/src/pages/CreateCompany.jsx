import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCompany } from '../api/company';
import { useAuth } from '../context/AuthContext';

const CreateCompany = () => {
  const navigate = useNavigate();
  const { setCurrentUserFromToken } = useAuth();

  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await registerCompany({
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Auto-login: store token and set user
      localStorage.setItem('token', res.data.token);
      setCurrentUserFromToken(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F0F9FF 0%, #EAF6FB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,119,182,0.12)', border: '1.5px solid #90E0EF', padding: '48px 40px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="14" height="14" rx="3" fill="#0077B6"/>
            <rect x="18" width="14" height="14" rx="3" fill="#00B4D8"/>
            <rect y="18" width="14" height="14" rx="3" fill="#48CAE4"/>
            <rect x="18" y="18" width="14" height="14" rx="3" fill="#90E0EF"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#03045E' }}>RevoraX</span>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#03045E' }}>Create Your Company</h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#90E0EF' }}>You'll be the Admin. Invite your team after setup.</p>

        {error && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F28B82', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Company Name">
            <input required value={form.companyName} onChange={e => setField('companyName', e.target.value)}
              placeholder="Acme Corp" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Your Name">
              <input required value={form.name} onChange={e => setField('name', e.target.value)}
                placeholder="Alice Smith" style={inputStyle} />
            </Field>
            <Field label="Email">
              <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)}
                placeholder="alice@acme.com" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Password">
              <input type="password" required value={form.password} onChange={e => setField('password', e.target.value)}
                placeholder="min 6 chars" style={inputStyle} />
            </Field>
            <Field label="Confirm Password">
              <input type="password" required value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)}
                placeholder="repeat password" style={inputStyle} />
            </Field>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: 8, padding: '13px', background: loading ? '#90E0EF' : '#0077B6',
            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}>
            {loading ? 'Creating…' : '🚀 Create Company & Get Started'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#90E0EF', margin: 0 }}>
            Already have an account?{' '}
            <a href="/" style={{ color: '#0077B6', fontWeight: 600, textDecoration: 'none' }}>Sign in →</a>
          </p>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '10px 13px', border: '1.5px solid #90E0EF', borderRadius: 8,
  fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FAFEFF',
};

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#0077B6', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

export default CreateCompany;
