/**
 * EngineeringDashboard.jsx
 * Focus: CREATE & MODIFY ECOs
 * Shows: Draft ECOs, Awaiting Submission, Recently Modified
 * Actions: Create ECO (primary CTA), Edit, Submit for Approval
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getECOs } from '../../api/eco';
import { getProducts } from '../../api/products';
import { getBOMs } from '../../api/bom';
import { getDashboardStats } from '../../api/dashboard';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatDate';
import { getRoleConfig } from '../../utils/roleConfig';

const cfg = getRoleConfig('engineering');

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, loading, to }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div style={{
      background: '#FFFFFF', border: `1.5px solid ${accent}33`,
      borderRadius: 14, padding: '18px 20px',
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${accent}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, background: cfg.badge.bg, color: cfg.badge.color, padding: '2px 8px', borderRadius: 20 }}>
          {loading ? '…' : value}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  </Link>
);

/* ── ECO Row ────────────────────────────────────────────────── */
const ECORow = ({ eco, i, total }) => (
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
      width: 36, height: 36, borderRadius: 10, background: cfg.accentLight,
      border: `1px solid ${cfg.accentBorder}`, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
    }}>📋</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eco.title}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>{eco.product?.name || '—'} · {formatDate(eco.updatedAt || eco.createdAt)}</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.accent, background: cfg.accentLight, padding: '2px 8px', borderRadius: 6 }}>{eco.stage}</span>
      <StatusBadge status={eco.status} />
    </div>
  </Link>
);

/* ── Main Component ─────────────────────────────────────────── */
const EngineeringDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [ecos, setEcos] = useState([]);
  const [stats, setStats] = useState({ draft: 0, awaitingSubmit: 0, recent: 0, products: 0, boms: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ecoRes, prodRes, bomRes, dashRes] = await Promise.all([
          getECOs().catch(() => ({ data: [] })),
          getProducts().catch(() => ({ data: [] })),
          getBOMs().catch(() => ({ data: [] })),
          getDashboardStats().catch(() => ({ data: {} })),
        ]);
        const all = ecoRes.data || [];
        const mine = all.filter((e) => (e.user?._id || e.user) === currentUser?._id);
        const d = dashRes.data || {};
        setEcos(mine.slice(0, 8));
        setStats({
          draft: d.openECOs ?? mine.filter((e) => e.status === 'Open').length,
          awaitingSubmit: d.pendingApproval ?? 0,
          recent: d.readyToApply ?? 0,
          rejected: d.rejectedECOs ?? 0,
          products: (prodRes.data || []).length,
          boms: (bomRes.data || []).length,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

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
            Engineering workspace — create, edit, and submit change orders.
          </p>
        </div>
        {/* Primary CTA */}
        <button onClick={() => navigate('/eco/new')} style={{
          background: `linear-gradient(135deg, ${cfg.accent}, #00B4D8)`,
          color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 20px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: `0 4px 14px ${cfg.accent}44`,
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${cfg.accent}55`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 14px ${cfg.accent}44`; }}
        >
          <span>＋</span> Create ECO
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
        <StatCard label="Open ECOs" value={stats.draft} icon="✏️" accent={cfg.accent} loading={loading} to="/eco" />
        <StatCard label="Pending approval" value={stats.awaitingSubmit} icon="📤" accent="#D97706" loading={loading} to="/eco" />
        <StatCard label="Ready to apply" value={stats.recent} icon="⚡" accent="#059669" loading={loading} to="/eco" />
        <StatCard label="Total Products" value={stats.products} icon="📦" accent="#7C3AED" loading={loading} to="/products" />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: '+ New Product', to: '/products/new', primary: false },
          { label: '+ New BOM', to: '/bom/new', primary: false },
          { label: '+ New ECO', to: '/eco/new', primary: true },
        ].map(a => (
          <Link key={a.label} to={a.to} style={{
            textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: a.primary ? cfg.accent : '#F1F5F9',
            color: a.primary ? '#FFF' : '#475569',
            border: a.primary ? 'none' : '1px solid #E2E8F0',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >{a.label}</Link>
        ))}
      </div>

      {/* My ECOs Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>My Change Orders</h3>
          <Link to="/eco" style={{ fontSize: 12, color: cfg.accent, textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>

        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 22, height: 22, border: `2.5px solid ${cfg.accentBorder}`, borderTopColor: cfg.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : ecos.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <p style={{ margin: 0, fontSize: 14, color: '#64748B', fontWeight: 500 }}>No ECOs yet</p>
              <p style={{ margin: '6px 0 16px', fontSize: 12, color: '#94A3B8' }}>Create your first Engineering Change Order to get started.</p>
              <Link to="/eco/new" style={{
                display: 'inline-block', textDecoration: 'none', padding: '8px 18px',
                background: cfg.accent, color: '#FFF', borderRadius: 8, fontSize: 12, fontWeight: 600,
              }}>Create ECO →</Link>
            </div>
          ) : (
            ecos.map((eco, i) => <ECORow key={eco._id} eco={eco} i={i} total={ecos.length} />)
          )}
        </div>
      </div>

    </div>
  );
};

export default EngineeringDashboard;
