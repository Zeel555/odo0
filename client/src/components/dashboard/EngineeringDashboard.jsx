/**
 * EngineeringDashboard.jsx
 * Focus: CREATE & MODIFY ECOs
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
import ShineBorder from '../ui/ShineBorder';

const cfg = getRoleConfig('engineering');

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, loading, to, shine }) => {
  const inner = (
    <div className="h-full px-5 py-[18px]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[22px]">{icon}</span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white bg-white/[0.15]">
          {loading ? '…' : value}
        </span>
      </div>
      <p className="m-0 text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
    </div>
  );

  if (shine) {
    return (
      <Link to={to || '#'} className="no-underline block h-full">
        <ShineBorder colors={['#00B4D8', '#7C3AED', '#90E0EF']} borderWidth={2} className="h-full">
          <div className="glass-card h-full" style={{ background: 'rgba(255,255,255,0.02)' }}>
            {inner}
          </div>
        </ShineBorder>
      </Link>
    );
  }

  return (
    <Link to={to || '#'} className="no-underline block h-full">
      <div className="glass-card h-full hover:bg-white/[0.1] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        {inner}
      </div>
    </Link>
  );
};

/* ── ECO Row ────────────────────────────────────────────────── */
const ECORow = ({ eco, i, total }) => (
  <Link to={`/eco/${eco._id}`}
    className="flex items-center gap-3.5 px-[18px] py-3 no-underline
               hover:bg-white/[0.08] transition-colors border-b border-white/[0.05]"
    style={{ borderBottom: i < total - 1 ? '' : 'none' }}
  >
    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base flex-shrink-0 bg-white/[0.08] border border-white/[0.15]">
      📋
    </div>
    <div className="flex-1 min-w-0">
      <p className="m-0 text-[13px] font-semibold text-white/90 truncate">{eco.title}</p>
      <p className="m-0 mt-0.5 text-[11px] text-white/50">
        {eco.product?.name || '—'} · {formatDate(eco.updatedAt || eco.createdAt)}
      </p>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white bg-white/[0.15]">
        {eco.stage}
      </span>
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
    <div className="flex flex-col gap-7">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-[22px] font-bold text-white/90">
            Good {greeting}, {currentUser?.name?.split(' ')[0]} 👋
          </h2>
          <p className="m-0 mt-1 text-[13px] text-white/50">
            Engineering workspace — create, edit, and submit change orders.
          </p>
        </div>
        <button onClick={() => navigate('/eco/new')}
          className="flex items-center gap-2 px-5 py-2.5 text-white border-none rounded-[10px]
                     text-[13px] font-semibold cursor-pointer
                     hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150"
          style={{ background: `linear-gradient(135deg, ${cfg.accent}, #00bfff)`,
                   boxShadow: `0 4px 14px rgba(0, 180, 216, 0.4)` }}>
          <span>＋</span> Create ECO
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Open ECOs" value={stats.draft} icon="✏️" accent={cfg.accent} loading={loading} to="/eco" shine />
        <StatCard label="Pending approval" value={stats.awaitingSubmit} icon="📤" accent="#D97706" loading={loading} to="/eco" />
        <StatCard label="Ready to apply" value={stats.recent} icon="⚡" accent="#059669" loading={loading} to="/eco" />
        <StatCard label="Total Products" value={stats.products} icon="📦" accent="#7C3AED" loading={loading} to="/products" />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2.5 flex-wrap">
        {[
          { label: '+ New Product', to: '/products/new', primary: false },
          { label: '+ New BOM', to: '/bom/new', primary: false },
          { label: '+ New ECO', to: '/eco/new', primary: true },
        ].map(a => (
          <Link key={a.label} to={a.to}
            className={`no-underline px-4 py-2 rounded-lg text-xs font-semibold transition-all
                        hover:opacity-80 ${a.primary
                          ? 'text-white border-none shadow-lg'
                          : 'text-white/80 bg-white/[0.1] border border-white/[0.15]'
                        }`}
            style={a.primary ? { background: 'linear-gradient(135deg, #00B4D8, #0077B6)' } : undefined}>
            {a.label}
          </Link>
        ))}
      </div>

      {/* My ECOs Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-sm font-bold text-white/90">My Change Orders</h3>
          <Link to="/eco" className="text-xs font-medium no-underline text-[#90E0EF] hover:text-white transition-colors">
            View all →
          </Link>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-[22px] h-[22px] border-[2.5px] rounded-full animate-spin mx-auto border-white/[0.2]"
                   style={{ borderTopColor: '#90E0EF' }} />
            </div>
          ) : ecos.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="m-0 text-sm text-white/60 font-medium">No ECOs yet</p>
              <p className="m-0 mt-1.5 mb-4 text-xs text-white/40">
                Create your first Engineering Change Order to get started.
              </p>
              <Link to="/eco/new"
                className="inline-block no-underline px-[18px] py-2 text-white rounded-lg text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg, #00B4D8, #0077B6)' }}>
                Create ECO →
              </Link>
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
