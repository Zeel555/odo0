import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvite, acceptInvite } from '../api/members';

const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getInvite(token)
      .then(res => setInvite(res.data))
      .catch(err => setError(err.response?.data?.message || 'Invite not found or expired'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setSaving(true);
    setError('');
    try {
      await acceptInvite(token, { password });
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Center><Spinner /></Center>;

  if (success) return (
    <Center>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#03045E', margin: '0 0 8px' }}>Account Created!</h2>
        <p style={{ color: '#0077B6', fontSize: 14 }}>Redirecting to login in 3 seconds…</p>
      </div>
    </Center>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F0F9FF 0%, #EAF6FB 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,119,182,0.12)', border: '1.5px solid #90E0EF', padding: '44px 36px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="14" height="14" rx="3" fill="#0077B6"/>
            <rect x="18" width="14" height="14" rx="3" fill="#00B4D8"/>
            <rect y="18" width="14" height="14" rx="3" fill="#48CAE4"/>
            <rect x="18" y="18" width="14" height="14" rx="3" fill="#90E0EF"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#03045E' }}>RevoraX</span>
        </div>

        {error && !invite ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: '#03045E', margin: '0 0 8px' }}>Invite Invalid</h2>
            <p style={{ color: '#A32D2D', fontSize: 13 }}>{error}</p>
            <a href="/" style={{ color: '#0077B6', fontSize: 13 }}>← Back to login</a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'inline-block', background: '#EAF6FB', border: '1px solid #90E0EF', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#0077B6', marginBottom: 12, fontWeight: 600 }}>
                {invite?.companyName}
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#03045E' }}>You're invited! 🎉</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#90E0EF' }}>Set a password to complete your account.</p>
            </div>

            {/* Pre-filled details */}
            <div style={{ background: '#EAF6FB', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <Detail label="Name" value={invite?.name} />
              <Detail label="Email" value={invite?.email} />
              <Detail label="Role" value={invite?.role} />
              <Detail label="Company" value={invite?.companyName} />
            </div>

            {error && (
              <div style={{ background: '#FCEBEB', border: '1px solid #F28B82', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Set Password">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="min 6 characters" style={inputStyle} />
              </Field>
              <Field label="Confirm Password">
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="repeat password" style={inputStyle} />
              </Field>
              <button type="submit" disabled={saving} style={{
                marginTop: 6, padding: '13px', background: saving ? '#90E0EF' : '#0077B6',
                color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Creating account…' : 'Create Account & Join →'}
              </button>
            </form>
          </>
        )}
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

const Detail = ({ label, value }) => (
  <div>
    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 600, color: '#90E0EF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#03045E', textTransform: 'capitalize' }}>{value || '—'}</p>
  </div>
);

const Center = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F9FF' }}>
    {children}
  </div>
);

const Spinner = () => (
  <div style={{ width: 28, height: 28, border: '3px solid #CAF0F8', borderTopColor: '#0077B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
  </div>
);

export default InviteAccept;
