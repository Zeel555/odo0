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
    setInviteError('');
    setInviting(true);
    try {
      const res = await inviteMember(inviteForm);
      setInviteLink(res.data.inviteUrl);
      setInviteForm({ name: '', email: '', role: 'engineering' });
      load();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (inviteId) => {
    try {
      const res = await resendInvite(inviteId);
      setInviteLink(res.data.inviteUrl);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend');
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from your company?')) return;
    try {
      await removeMember(userId);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove');
    }
  };

  const activeUsers = users.filter(u => u.isActive !== false);
  const totalUsers = activeUsers.length;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#03045E' }}>Team Members</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#90E0EF' }}>Manage who has access to your company workspace.</p>
        </div>
        <button onClick={() => { setShowInviteForm(s => !s); setInviteLink(''); setInviteError(''); }}
          style={{ padding: '10px 18px', background: '#0077B6', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          {showInviteForm ? '✕ Cancel' : '+ Invite Member'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Total Members" value={totalUsers} icon="👤" />
        <StatCard label="Active" value={activeUsers.length} icon="✅" />
        <StatCard label="Pending Invites" value={invites.length} icon="📨" />
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div style={{ background: '#EAF6FB', border: '1.5px solid #90E0EF', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#03045E' }}>Invite a Team Member</h3>
          {inviteError && <div style={{ background: '#FCEBEB', border: '1px solid #F28B82', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#A32D2D', marginBottom: 12 }}>{inviteError}</div>}
          <form onSubmit={handleInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <FormField label="Name">
              <input required value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Bob Smith" style={inpStyle} />
            </FormField>
            <FormField label="Email">
              <input type="email" required value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder="bob@company.com" style={inpStyle} />
            </FormField>
            <FormField label="Role">
              <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} style={inpStyle}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </FormField>
            <button type="submit" disabled={inviting} style={{ padding: '10px 18px', background: '#0077B6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {inviting ? '…' : 'Send Invite'}
            </button>
          </form>

          {inviteLink && (
            <div style={{ marginTop: 14, background: '#fff', border: '1.5px dashed #00B4D8', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#0077B6', textTransform: 'uppercase' }}>Invite Link (share this)</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ flex: 1, fontSize: 12, color: '#03045E', wordBreak: 'break-all', background: '#F0F9FF', padding: '6px 10px', borderRadius: 6 }}>{inviteLink}</code>
                <button onClick={() => navigator.clipboard.writeText(inviteLink)} style={{ padding: '6px 12px', background: '#0077B6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Copy</button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#90E0EF' }}>⏰ This link expires in 24 hours.</p>
            </div>
          )}
        </div>
      )}

      {/* Members Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#90E0EF', padding: 40, fontSize: 13 }}>Loading…</div>
      ) : (
        <div>
          <div style={{ background: '#fff', border: '1.5px solid #90E0EF', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#EAF6FB', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#0077B6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span>
            </div>
            {activeUsers.map((u, i) => (
              <div key={u._id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 16px', borderTop: '1px solid #CAF0F8', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#FAFEFF' }}>
                <span style={{ fontWeight: 500, fontSize: 13, color: '#03045E' }}>{u.name} {u._id === currentUser?._id ? <span style={{ fontSize: 10, background: '#EAF6FB', color: '#0077B6', padding: '1px 6px', borderRadius: 4 }}>You</span> : ''}</span>
                <span style={{ fontSize: 12, color: '#90E0EF' }}>{u.email}</span>
                <RolePill role={u.role} />
                <span style={{ fontSize: 11, color: '#0077B6', fontWeight: 500 }}>Active</span>
                <div>
                  {u._id !== currentUser?._id && (
                    <button onClick={() => handleRemove(u._id)} style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: '1px solid #F28B82', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0077B6' }}>Pending Invites ({invites.length})</h3>
              <div style={{ background: '#fff', border: '1.5px solid #90E0EF', borderRadius: 12, overflow: 'hidden' }}>
                {invites.map((inv, i) => (
                  <div key={inv._id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr', padding: '12px 16px', borderTop: i > 0 ? '1px solid #CAF0F8' : 'none', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: 13, color: '#03045E' }}>{inv.name}</span>
                    <span style={{ fontSize: 12, color: '#90E0EF' }}>{inv.email}</span>
                    <RolePill role={inv.role} />
                    <span style={{ fontSize: 11, color: '#00B4D8', fontWeight: 500 }}>⏳ Pending</span>
                    <button onClick={() => handleResend(inv._id)} style={{ fontSize: 11, color: '#0077B6', background: 'none', border: '1px solid #90E0EF', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>Resend</button>
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
  <div style={{ background: '#fff', border: '1.5px solid #90E0EF', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#03045E', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#90E0EF', fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const RolePill = ({ role }) => {
  const colors = { admin: '#0077B6', engineering: '#48CAE4', approver: '#00B4D8', operations: '#90E0EF' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: colors[role] || '#0077B6', padding: '3px 8px', borderRadius: 5, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
};

const inpStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #90E0EF', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' };

const FormField = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#0077B6', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
    {children}
  </div>
);

export default Members;
