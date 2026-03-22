import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMembers, inviteMember, resendInvite, removeMember } from '../api/members';

const ROLES = ['admin', 'engineering', 'approver', 'operations'];

const Members = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'engineering' });
  const [inviteLink, setInviteLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [emailSent, setEmailSent] = useState(null);
  const [emailNotice, setEmailNotice] = useState('');
  const [inviting, setInviting] = useState(false);

  const load = () => {
    setLoading(true);
    getMembers()
      .then(res => { setUsers(res.data.users); setInvites(res.data.invites); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError(''); setEmailNotice(''); setEmailSent(null); setInviting(true);
    try {
      const res = await inviteMember(inviteForm);
      setInviteLink(res.data.inviteUrl);
      setEmailSent(res.data.emailSent === true);
      if (res.data.emailNotice) setEmailNotice(res.data.emailNotice);
      setInviteForm({ name: '', email: '', role: 'engineering' });
      load();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invite');
    } finally { setInviting(false); }
  };

  const handleResend = async (inviteId) => {
    try {
      const res = await resendInvite(inviteId);
      setShowInviteForm(true);
      setInviteLink(res.data.inviteUrl);
      setEmailSent(res.data.emailSent === true);
      setEmailNotice(res.data.emailNotice || '');
    } catch (err) { alert(err.response?.data?.message || 'Failed to resend'); }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from your company?')) return;
    try { await removeMember(userId); load(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to remove'); }
  };

  const activeUsers = users.filter(u => u.isActive !== false);
  const totalUsers = activeUsers.length;

  return (
    <div className="page-content flex flex-col gap-5 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-white/90">Team Members</h2>
          <p className="m-0 mt-0.5 text-xs text-white/50">
            Manage who has access to your company workspace.
          </p>
        </div>
        <button
          onClick={() => { setShowInviteForm(s => !s); setInviteLink(''); setInviteError(''); setEmailSent(null); setEmailNotice(''); }}
          className="px-[18px] py-2.5 bg-white/[0.1] text-white border border-white/[0.15] rounded-[9px]
                     font-semibold text-[13px] cursor-pointer hover:bg-white/[0.15] transition-colors">
          {showInviteForm ? '✕ Cancel' : '+ Invite Member'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Members" value={totalUsers} icon="👤" />
        <StatCard label="Active" value={activeUsers.length} icon="✅" />
        <StatCard label="Pending Invites" value={invites.length} icon="📨" />
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="glass-card p-5 border-white/[0.2] bg-white/[0.04]">
          <h3 className="m-0 mb-4 text-sm font-semibold text-white/90">Invite a Team Member</h3>

          {inviteError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400 mb-3">
              {inviteError}
            </div>
          )}
          {emailSent === true && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-xs text-green-400 mb-3">
              ✉️ Invite email sent to the address you entered.
            </div>
          )}
          {emailSent === false && emailNotice && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-400 mb-3">
              {emailNotice}
            </div>
          )}

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2.5 items-end">
            <FormField label="Name">
              <input required value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Bob Smith" className="w-full px-3 py-2.5 border border-white/[0.15] rounded-lg text-[13px] bg-white/[0.04] text-white placeholder-white/30 outline-none
                                                    focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all" />
            </FormField>
            <FormField label="Email">
              <input type="email" required value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="bob@company.com" className="w-full px-3 py-2.5 border border-white/[0.15] rounded-lg text-[13px] bg-white/[0.04] text-white placeholder-white/30 outline-none
                                                          focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all" />
            </FormField>
            <FormField label="Role">
              <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2.5 border border-white/[0.15] rounded-lg text-[13px] bg-[#0a0e27] text-white outline-none
                           focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </FormField>
            <button type="submit" disabled={inviting}
              className="px-[18px] py-2.5 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] text-white border-none rounded-lg
                         font-semibold text-[13px] cursor-pointer whitespace-nowrap
                         hover:opacity-90 transition-opacity disabled:opacity-50">
              {inviting ? '…' : 'Send Invite'}
            </button>
          </form>

          {inviteLink && (
            <div className="mt-3.5 bg-white/[0.04] border-2 border-dashed border-[#00B4D8]/40 rounded-lg px-3.5 py-3">
              <p className="m-0 mb-1.5 text-[11px] font-semibold text-[#90E0EF] uppercase">
                Invite Link (share this)
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs text-white/90 break-all bg-black/30 px-2.5 py-1.5 rounded-md">
                  {inviteLink}
                </code>
                <button onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="px-3 py-1.5 bg-white/[0.1] text-white border border-white/[0.15] rounded-md text-xs cursor-pointer
                             hover:bg-white/[0.15] transition-colors">
                  Copy
                </button>
              </div>
              <p className="m-0 mt-1.5 text-[11px] text-white/40">⏰ This link expires in 24 hours.</p>
            </div>
          )}
        </div>
      )}

      {/* Members Table */}
      {loading ? (
        <div className="text-center text-white/40 py-10 text-[13px]">Loading…</div>
      ) : (
        <div>
          <div className="glass-card overflow-hidden">
            {/* Table header */}
            <div className="bg-white/[0.04] border-b border-white/[0.08] grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-4 py-2.5
                            text-[11px] font-bold text-white/50 uppercase tracking-wider">
              <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span>
            </div>
            {activeUsers.map((u, i) => (
              <div key={u._id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-4 py-3 items-center border-b border-white/[0.05] last:border-none hover:bg-white/[0.04] transition-colors">
                <span className="font-medium text-[13px] text-white/90">
                  {u.name} {u._id === currentUser?._id && (
                    <span className="text-[10px] bg-white/[0.1] text-[#90E0EF] px-1.5 py-0.5 rounded ml-1">You</span>
                  )}
                </span>
                <span className="text-xs text-white/60">{u.email}</span>
                <RolePill role={u.role} />
                <span className="text-[11px] text-[#6EE7B7] font-medium">Active</span>
                <div>
                  {u._id !== currentUser?._id && (
                    <button onClick={() => handleRemove(u._id)}
                      className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20
                                 rounded-[5px] px-2 py-0.5 cursor-pointer hover:bg-red-500/20 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div className="mt-5">
              <h3 className="m-0 mb-2.5 text-[13px] font-semibold text-[#90E0EF]">
                Pending Invites ({invites.length})
              </h3>
              <div className="glass-card overflow-hidden bg-white/[0.02] border-white/[0.08]">
                {invites.map((inv, i) => (
                  <div key={inv._id}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-4 py-3 items-center border-b border-white/[0.05] last:border-none">
                    <span className="font-medium text-[13px] text-white/80">{inv.name}</span>
                    <span className="text-xs text-white/50">{inv.email}</span>
                    <RolePill role={inv.role} />
                    <span className="text-[11px] text-[#FCD34D] font-medium">⏳ Pending</span>
                    <button onClick={() => handleResend(inv._id)}
                      className="text-[11px] text-[#90E0EF] bg-white/[0.05] border border-white/[0.1]
                                 rounded-[5px] px-2 py-0.5 cursor-pointer hover:bg-white/[0.1] transition-colors">
                      Resend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="glass-card px-[18px] py-4 flex items-center gap-3.5">
    <span className="text-2xl">{icon}</span>
    <div>
      <div className="text-[22px] font-bold text-white/90 leading-none">{value}</div>
      <div className="text-[11px] text-white/50 font-medium mt-0.5">{label}</div>
    </div>
  </div>
);

const RolePill = ({ role }) => {
  const colors = { admin: 'rgba(124,58,237,0.3)', engineering: 'rgba(0,119,182,0.4)', approver: 'rgba(217,119,6,0.4)', operations: 'rgba(5,150,105,0.4)' };
  const textColors = { admin: '#C4B5FD', engineering: '#90E0EF', approver: '#FDE68A', operations: '#A7F3D0' };
  const borderColors = { admin: 'rgba(124,58,237,0.5)', engineering: 'rgba(0,119,182,0.6)', approver: 'rgba(217,119,6,0.6)', operations: 'rgba(5,150,105,0.6)' };
  
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[5px] capitalize border"
          style={{ background: colors[role] || 'rgba(0,119,182,0.4)', color: textColors[role] || '#90E0EF', borderColor: borderColors[role] || 'rgba(0,119,182,0.6)' }}>
      {role}
    </span>
  );
};

const FormField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-[#90E0EF]/80 mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

export default Members;
