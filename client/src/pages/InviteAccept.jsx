import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvite, acceptInvite } from '../api/members';
import AuroraBackground from '../components/ui/AuroraBackground';

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

  const inputCls = `w-full py-[11px] px-3.5 bg-white/[0.04] border border-white/[0.15] rounded-xl
                    text-[13.5px] text-white placeholder-white/30 outline-none
                    focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30
                    transition-all box-border`;

  if (loading) return (
    <AuroraBackground>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-white/10 border-t-white/90 rounded-full animate-spin"></div>
      </div>
    </AuroraBackground>
  );

  if (success) return (
    <AuroraBackground>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-10 glass-card mx-4 max-w-sm rounded-[24px]">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-white text-xl font-bold m-0 mb-2">Account Created!</h2>
          <p className="text-[#90E0EF] text-sm m-0 font-medium">Redirecting to login in 3 seconds…</p>
        </div>
      </div>
    </AuroraBackground>
  );

  return (
    <AuroraBackground>
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20
                        rounded-3xl p-9 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border-[1.5px] border-white/[0.1]
                            flex items-center justify-center backdrop-blur-md shadow-sm">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <rect width="14" height="14" rx="3" fill="#00B4D8"/>
                <rect x="18" width="14" height="14" rx="3" fill="#00B4D8"/>
                <rect y="18" width="14" height="14" rx="3" fill="#00B4D8"/>
                <rect x="18" y="18" width="14" height="14" rx="3" fill="#00B4D8"/>
              </svg>
            </div>
            <span className="font-bold text-[18px] text-white tracking-tight">RevoraX</span>
          </div>

          {error && !invite ? (
            <div className="text-center">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="text-white text-xl font-bold m-0 mb-2">Invite Invalid</h2>
              <p className="text-red-300 text-[13.5px] font-medium m-0 mb-4">{error}</p>
              <a href="/" className="text-[#00B4D8] hover:text-[#90E0EF] text-sm font-semibold no-underline transition-colors">← Back to login</a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="inline-block bg-[#00B4D8]/10 border border-[#00B4D8]/30 rounded-lg px-3 py-1.5 
                                text-xs text-[#90E0EF] mb-4 font-bold tracking-wide">
                  {invite?.companyName}
                </div>
                <h1 className="m-0 mb-2 text-[22px] font-bold text-white tracking-tight">You're invited! 🎉</h1>
                <p className="m-0 text-[13.5px] text-white/50 font-medium tracking-wide">Set a password to complete your account.</p>
              </div>

              {/* Pre-filled details */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6 
                              grid grid-cols-2 gap-y-4 gap-x-3 text-xs shadow-inner">
                <Detail label="Name" value={invite?.name} />
                <Detail label="Email" value={invite?.email} />
                <Detail label="Role" value={invite?.role} />
                <Detail label="Company" value={invite?.companyName} />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-[13px] text-red-300 font-medium mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleAccept} className="flex flex-col gap-4">
                <Field label="Set Password">
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="min 6 characters" className={inputCls} />
                </Field>
                <Field label="Confirm Password">
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="repeat password" className={inputCls} />
                </Field>
                <button type="submit" disabled={saving} 
                  className={`mt-3 py-3.5 border-none rounded-xl font-semibold text-[14px]
                              cursor-pointer transition-all duration-300 text-white shadow-lg
                              ${saving ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#00B4D8] hover:bg-[#0096B4] hover:shadow-[#00B4D8]/20'}
                            `}>
                  {saving ? 'Creating account…' : 'Create Account & Join →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      </div>
    </AuroraBackground>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="m-0 mb-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">{label}</p>
    <p className="m-0 text-[13px] font-medium text-white/90 capitalize">{value || '—'}</p>
  </div>
);

export default InviteAccept;
