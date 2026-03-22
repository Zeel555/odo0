import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCompany } from '../api/company';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/ui/AuroraBackground';

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
      localStorage.setItem('token', res.data.token);
      setCurrentUserFromToken(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full py-3 px-3.5 bg-white/10 border border-white/20 rounded-lg
                    text-sm text-white placeholder-white/30 outline-none
                    focus:border-plm-surf focus:ring-1 focus:ring-plm-surf/30
                    transition-colors`;

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-[480px] bg-white/10 backdrop-blur-xl
                      rounded-2xl border border-white/20 shadow-2xl p-10 md:p-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="14" height="14" rx="3" fill="#0077B6"/>
            <rect x="18" width="14" height="14" rx="3" fill="#00B4D8"/>
            <rect y="18" width="14" height="14" rx="3" fill="#48CAE4"/>
            <rect x="18" y="18" width="14" height="14" rx="3" fill="#90E0EF"/>
          </svg>
          <span className="font-bold text-[17px] text-white">RevoraX</span>
        </div>

        <h1 className="m-0 mb-1.5 text-[22px] font-bold text-white">Create Your Company</h1>
        <p className="m-0 mb-7 text-sm text-white/50">You'll be the Admin. Invite your team after setup.</p>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-3.5 py-2.5
                          text-sm text-red-200 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Company Name">
            <input required value={form.companyName} onChange={e => setField('companyName', e.target.value)}
              placeholder="Acme Corp" className={inputCls} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Your Name">
              <input required value={form.name} onChange={e => setField('name', e.target.value)}
                placeholder="Alice Smith" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)}
                placeholder="alice@acme.com" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Password">
              <input type="password" required value={form.password} onChange={e => setField('password', e.target.value)}
                placeholder="min 6 chars" className={inputCls} />
            </Field>
            <Field label="Confirm Password">
              <input type="password" required value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)}
                placeholder="repeat password" className={inputCls} />
            </Field>
          </div>

          <button
            type="submit" disabled={loading}
            className={`mt-2 py-3.5 border-none rounded-xl font-semibold text-sm
                        cursor-pointer transition-colors text-white
                        ${loading
                          ? 'bg-plm-frost/50 cursor-not-allowed'
                          : 'bg-plm-ocean hover:bg-[#023E8A]'
                        }`}
          >
            {loading ? 'Creating…' : '🚀 Create Company & Get Started'}
          </button>

          <p className="text-center text-sm text-white/40 m-0">
            Already have an account?{' '}
            <a href="/" className="text-plm-surf font-semibold no-underline hover:text-white transition-colors">
              Sign in →
            </a>
          </p>
        </form>
      </div>
      </div>
    </AuroraBackground>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-white/60 mb-1.5
                      uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default CreateCompany;
