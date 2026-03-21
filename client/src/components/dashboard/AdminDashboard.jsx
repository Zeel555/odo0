/**
 * AdminDashboard.jsx
 * Focus: SYSTEM CONTROL
 * Shows: Total Users, Active ECOs, Pending Approvals, System Stats
 * Main: Recent activity log + quick management links
 * Actions: Manage Users, Configure ECO Stages, All ECO actions
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getECOs } from '../../api/eco';
import { getProducts } from '../../api/products';
import { getBOMs } from '../../api/bom';
import { getMembers } from '../../api/members';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatDate';
import { getRoleConfig } from '../../utils/roleConfig';

const cfg = getRoleConfig('admin');

/* ── KPI Card ──────────────────────────────────────────────── */
const KPICard = ({ label, value, icon, accent, loading, sub }) => (
  <div style={{
    background: '#FFFFFF', border: `1.5px solid ${accent}33`,
    borderRadius: 14, padding: '20px 22px',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 60, height: 60,
      background: `${accent}0D`, borderRadius: '0 14px 0 60px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
      padding: 10, fontSize: 18,
    }}>{icon}</div>
    <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#0F172A' }}>
      {loading ? '…' : value}
    </p>
    <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    {sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: accent, fontWeight: 500 }}>{sub}</p>}
  </div>
);

/* ── Control Button ─────────────────────────────────────────── */
const ControlBtn = ({ label, icon, to, accent }) => (
  <Link to={to} style={{
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 18px', background: '#FFFFFF',
    border: `1.5px solid ${accent}33`, borderRadius: 12,
    transition: 'box-shadow 0.2s, transform 0.15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${accent}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 9,
      background: `${accent}15`, border: `1px solid ${accent}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
    }}>{icon}</div>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{label}</span>
    <span style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: 14 }}>→</span>
  </Link>
);

/* ── Activity Row ───────────────────────────────────────────── */
const ActivityRow = ({ eco, i, total }) => (
  <Link to={`/eco/${eco._id}`} style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '12px 18px', textDecoration: 'none',
    borderBottom: i < total - 1 ? '1px solid #F1F5F9' : 'none',
    transition: 'background 0.15s',
  }}
    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: 34, height: 34, borderRadius: 9, background: cfg.accentLight,
      border: `1px solid ${cfg.accentBorder}`, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
    }}>📋</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eco.title}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
        {eco.createdBy?.name || 'Unknown'} · {formatDate(eco.updatedAt || eco.createdAt)}
      </p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.accent, background: cfg.accentLight, padding: '2px 8px', borderRadius: 6 }}>{eco.stage}</span>
      <StatusBadge status={eco.status} />
    </div>
  </Link>
);

/* ── Main Component ─────────────────────────────────────────── */
const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState({ ecos: [], products: 0, boms: 0, members: 0, pending: 0, open: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, pRes, bRes, mRes] = await Promise.all([
          getECOs().catch(() => ({ data: [] })),
          getProducts().catch(() => ({ data: [] })),
          getBOMs().catch(() => ({ data: [] })),
          getMembers().catch(() => ({ data: [] })),
        ]);
        const ecos = eRes.data || [];
        setData({
          ecos: ecos.slice(0, 8),
          products: (pRes.data || []).length,
          boms: (bRes.data || []).length,
          members: Array.isArray(mRes.data) ? mRes.data.length : 0,
          pending: ecos.filter(e => e.stage === 'Approval' && e.status === 'Open').length,
          open: ecos.filter(e => e.status === 'Open').length,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
            Good {greeting}, {currentUser?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Admin workspace — system overview and full control.
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
          background: cfg.badge.bg, color: cfg.badge.color, letterSpacing: '0.04em',
        }}>⚡ ADMIN</span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        <KPICard label="Total Members" value={data.members} icon="👥" accent={cfg.accent} loading={loading} />
        <KPICard label="Active ECOs" value={data.open} icon="📋" accent="#0077B6" loading={loading} />
        <KPICard label="Pending Approvals" value={data.pending} icon="⏳" accent="#D97706" loading={loading} sub={data.pending > 0 ? 'Needs attention' : undefined} />
        <KPICard label="Products" value={data.products} icon="📦" accent="#059669" loading={loading} />
      </div>

      {/* System Control Panel */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>System Management</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          <ControlBtn label="Manage Members" icon="👥" to="/members" accent={cfg.accent} />
          <ControlBtn label="ECO Stages" icon="⚙️" to="/settings" accent="#0077B6" />
          <ControlBtn label="Approval Rules" icon="📜" to="/settings" accent="#D97706" />
          <ControlBtn label="View Reports" icon="📊" to="/reports" accent="#059669" />
        </div>
      </div>

      {/* All Quick Actions */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '+ New Product', to: '/products/new', primary: false },
            { label: '+ New BOM', to: '/bom/new', primary: false },
            { label: '+ New ECO', to: '/eco/new', primary: true },
            { label: 'Invite Member', to: '/members', primary: false },
          ].map(a => (
            <Link key={a.label} to={a.to} style={{
              textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: a.primary ? cfg.accent : '#F1F5F9',
              color: a.primary ? '#FFF' : '#475569',
              border: a.primary ? 'none' : '1px solid #E2E8F0',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >{a.label}</Link>
          ))}
        </div>
      </div>

      {/* Recent ECO Activity */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent ECO Activity</h3>
          <Link to="/eco" style={{ fontSize: 12, color: cfg.accent, textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 22, height: 22, border: `2.5px solid ${cfg.accentBorder}`, borderTopColor: cfg.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : data.ecos.length === 0 ? (
            <div style={{ padding: '36px 24px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>No ECO activity yet.</div>
          ) : (
            data.ecos.map((eco, i) => <ActivityRow key={eco._id} eco={eco} i={i} total={data.ecos.length} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
