/**
 * ApproverDashboard.jsx
 * Focus: REVIEW & APPROVE ECOs
 * Shows: Pending Approvals (highlighted), Approved, Rejected
 * Actions: Approve (green), Reject (red), View diff
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getECOs, approveECO } from '../../api/eco';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatDate';
import { getRoleConfig } from '../../utils/roleConfig';

const cfg = getRoleConfig('approver');

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, bg, border, loading, urgent }) => (
  <div style={{
    background: urgent ? '#FFF7ED' : '#FFFFFF',
    border: `1.5px solid ${urgent ? '#FCD34D' : border || '#E2E8F0'}`,
    borderRadius: 14, padding: '18px 20px',
    position: 'relative', overflow: 'hidden',
  }}>
    {urgent && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
      }} />
    )}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      {urgent && <span style={{ fontSize: 10, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACTION NEEDED</span>}
    </div>
    <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: urgent ? '#B45309' : '#0F172A' }}>
      {loading ? '…' : value}
    </p>
    <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
  </div>
);

/* ── Approve / Reject Row ───────────────────────────────────── */
const ApprovalRow = ({ eco, i, total, onAction }) => {
  const [busy, setBusy] = useState(false);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Approve "${eco.title}"?`)) return;
    setBusy(true);
    try {
      await approveECO(eco._id);
      onAction();
    } catch {
      /* handled globally */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      borderBottom: i < total - 1 ? '1px solid #F1F5F9' : 'none',
      background: '#FFFFFF',
    }}>
      {/* Urgency dot */}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, boxShadow: '0 0 0 3px #FEF3C7' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/eco/${eco._id}`} style={{ textDecoration: 'none' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eco.title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
            {eco.product?.name || '—'} · Submitted {formatDate(eco.updatedAt || eco.createdAt)}
          </p>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <StatusBadge status={eco.status} />
        <Link to={`/eco/${eco._id}`} style={{
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
          background: '#F1F5F9', color: '#475569', textDecoration: 'none', border: '1px solid #E2E8F0',
        }}>View</Link>
        <button onClick={handleApprove} disabled={busy} style={{
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
          background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#BBF7D0'}
          onMouseLeave={e => e.currentTarget.style.background = '#DCFCE7'}
        >{busy ? '…' : '✓ Approve'}</button>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────── */
const ApproverDashboard = () => {
  const { currentUser } = useAuth();
  const [allECOs, setAllECOs] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = () => setTick(t => t + 1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getECOs().catch(() => ({ data: [] }));
        const all = res.data || [];
        setAllECOs(all);
        setStats({
          pending: all.filter(e => e.stage === 'Approval' && e.status === 'Open').length,
          approved: all.filter(e => e.status === 'Closed').length,
          rejected: all.filter(e => e.status === 'Cancelled').length,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tick]);

  const pendingECOs = allECOs.filter(e => e.stage === 'Approval' && e.status === 'Open');
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
          Good {greeting}, {currentUser?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
          Approver workspace — review pending ECOs and make decisions.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard label="Pending Approvals" value={stats.pending} icon="⏳" loading={loading} urgent={stats.pending > 0} />
        <StatCard label="Approved ECOs" value={stats.approved} icon="✅" loading={loading} border="#BBF7D0" />
        <StatCard label="Rejected / Cancelled" value={stats.rejected} icon="❌" loading={loading} border="#FECACA" />
      </div>

      {/* Urgent Banner */}
      {!loading && stats.pending > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)',
          border: '1.5px solid #FCD34D', borderRadius: 12,
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#92400E' }}>
              {stats.pending} ECO{stats.pending > 1 ? 's' : ''} require your approval
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B45309' }}>Review and approve or reject them below.</p>
          </div>
        </div>
      )}

      {/* Pending Approvals List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            Pending Approvals
            {stats.pending > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 20 }}>{stats.pending}</span>
            )}
          </h3>
          <Link to="/eco" style={{ fontSize: 12, color: cfg.accent, textDecoration: 'none', fontWeight: 500 }}>View all ECOs →</Link>
        </div>

        <div style={{ background: '#FFFFFF', border: `1.5px solid ${stats.pending > 0 ? '#FCD34D' : '#E2E8F0'}`, borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 22, height: 22, border: '2.5px solid #FDE68A', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : pendingECOs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <p style={{ margin: 0, fontSize: 14, color: '#64748B', fontWeight: 600 }}>All caught up!</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94A3B8' }}>No ECOs pending your approval right now.</p>
            </div>
          ) : (
            pendingECOs.map((eco, i) => (
              <ApprovalRow key={eco._id} eco={eco} i={i} total={pendingECOs.length} onAction={reload} />
            ))
          )}
        </div>
      </div>

      {/* All ECOs quick link */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Link to="/eco" style={{
          textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0',
        }}>Browse All ECOs</Link>
        <Link to="/reports" style={{
          textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: cfg.badge.bg, color: cfg.badge.color, border: `1px solid ${cfg.accentBorder}`,
        }}>View Reports</Link>
      </div>
    </div>
  );
};

export default ApproverDashboard;
