/**
 * AdminDashboard.jsx
 * Focus: SYSTEM CONTROL — total overview + management shortcuts
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getECOs } from '../../api/eco';
import { getProducts } from '../../api/products';
import { getBOMs } from '../../api/bom';
import { getMembers } from '../../api/members';
import { getDashboardStats } from '../../api/dashboard';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatDate';
import { getRoleConfig } from '../../utils/roleConfig';
import ShineBorder from '../ui/ShineBorder';

const cfg = getRoleConfig('admin');

/* ── KPI Card ──────────────────────────────────────────────── */
const KPICard = ({ label, value, icon, accent, loading, sub, shine }) => {
  const inner = (
    <div className={shine ? 'px-5 py-5 h-full flex flex-col justify-center' : ''}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
        {sub && <span className="text-[11px] font-medium" style={{ color: accent }}>{sub}</span>}
      </div>
      <p className="m-0 text-[32px] font-bold text-white">{loading ? '…' : value}</p>
      <p className="m-0 mt-1 text-xs font-bold text-white/50 uppercase tracking-wider">{label}</p>
    </div>
  );

  if (shine) {
    return (
      <ShineBorder colors={[accent, '#7C3AED', '#00B4D8']} borderWidth={2} className="h-full">
        <div className="glass-card h-full" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {inner}
        </div>
      </ShineBorder>
    );
  }

  return (
    <div className="glass-card px-5 py-5 relative overflow-hidden"
         style={{ borderColor: `rgba(255,255,255,0.12)` }}>
      {inner}
    </div>
  );
};

/* ── Control Button ─────────────────────────────────────────── */
const ControlBtn = ({ label, icon, to, accent }) => (
  <Link to={to} className="no-underline flex items-center gap-2.5 px-[18px] py-3.5
                            glass-card hover:bg-white/[0.12] hover:-translate-y-0.5
                            transition-all duration-150 group">
    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-lg flex-shrink-0 bg-white/[0.08] border border-white/[0.15] group-hover:bg-white/[0.15] transition-colors">
      {icon}
    </div>
    <span className="text-[13px] font-semibold text-white/90">{label}</span>
    <span className="ml-auto text-white/30 text-sm group-hover:text-white/60 transition-colors">→</span>
  </Link>
);

/* ── Activity Row ───────────────────────────────────────────── */
const ActivityRow = ({ eco, i, total }) => (
  <Link to={`/eco/${eco._id}`}
    className="flex items-center gap-3.5 px-[18px] py-3 no-underline
               hover:bg-white/[0.08] transition-colors border-b border-white/[0.05]"
    style={{ borderBottom: i < total - 1 ? '' : 'none' }}>
    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] flex-shrink-0 bg-white/[0.08] border border-white/[0.15]">
      📋
    </div>
    <div className="flex-1 min-w-0">
      <p className="m-0 text-[13px] font-semibold text-white/90 truncate">{eco.title}</p>
      <p className="m-0 mt-0.5 text-[11px] text-white/50">
        {eco.createdBy?.name || 'Unknown'} · {formatDate(eco.updatedAt || eco.createdAt)}
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
const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState({ ecos: [], products: 0, boms: 0, members: 0, pending: 0, open: 0, ready: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, pRes, bRes, mRes, dashRes] = await Promise.all([
          getECOs().catch(() => ({ data: [] })),
          getProducts().catch(() => ({ data: [] })),
          getBOMs().catch(() => ({ data: [] })),
          getMembers().catch(() => ({ data: [] })),
          getDashboardStats().catch(() => ({ data: {} })),
        ]);
        const ecos = eRes.data || [];
        const d = dashRes.data || {};
        setData({
          ecos: ecos.slice(0, 8),
          products: (pRes.data || []).length,
          boms: (bRes.data || []).length,
          members: Array.isArray(mRes.data) ? mRes.data.length : 0,
          pending: d.pendingApproval ?? ecos.filter((e) => e.stage === 'Approval' && e.status === 'Open').length,
          open: d.openECOs ?? ecos.filter((e) => e.status === 'Open').length,
          ready: d.readyToApply ?? 0,
        });
      } finally { setLoading(false); }
    };
    load();
  }, []);

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
            Admin workspace — system overview and full control.
          </p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full tracking-wider bg-white/[0.15] border border-white/[0.2] text-white">
          ⚡ ADMIN
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <KPICard label="Total Members" value={data.members} icon="👥" accent="#90E0EF" loading={loading} />
        <KPICard label="Active ECOs" value={data.open} icon="📋" accent="#00B4D8" loading={loading} />
        <KPICard label="Pending Approvals" value={data.pending} icon="⏳" accent="#FCD34D" loading={loading}
                 sub={data.pending > 0 ? 'Needs attention' : undefined} shine={data.pending > 0} />
        <KPICard label="Ready to apply" value={data.ready} icon="⚡" accent="#A78BFA" loading={loading}
                 sub="Final stage — run Apply" />
        <KPICard label="Products" value={data.products} icon="📦" accent="#6EE7B7" loading={loading} />
      </div>

      {/* System Control Panel */}
      <div>
        <h3 className="m-0 mb-3 text-sm font-bold text-white/90">System Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ControlBtn label="Manage Members" icon="👥" to="/members" accent="#90E0EF" />
          <ControlBtn label="ECO Stages" icon="⚙️" to="/settings" accent="#00B4D8" />
          <ControlBtn label="Approval Rules" icon="📜" to="/settings" accent="#FCD34D" />
          <ControlBtn label="View Reports" icon="📊" to="/reports" accent="#6EE7B7" />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="m-0 mb-3 text-sm font-bold text-white/90">Quick Actions</h3>
        <div className="flex gap-2.5 flex-wrap">
          {[
            { label: '+ New Product', to: '/products/new', primary: false },
            { label: '+ New BOM', to: '/bom/new', primary: false },
            { label: '+ New ECO', to: '/eco/new', primary: true },
            { label: 'Invite Member', to: '/members', primary: false },
          ].map(a => (
            <Link key={a.label} to={a.to}
              className={`no-underline px-4 py-2 rounded-lg text-xs font-semibold transition-all
                          hover:opacity-80 ${a.primary
                            ? 'text-white border-none shadow-lg'
                            : 'text-white/80 bg-white/[0.1] border border-white/[0.15]'
                          }`}
              style={a.primary ? { background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' } : undefined}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent ECO Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-sm font-bold text-white/90">Recent ECO Activity</h3>
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
          ) : data.ecos.length === 0 ? (
            <div className="py-9 px-6 text-center text-[13px] text-white/40">No ECO activity yet.</div>
          ) : (
            data.ecos.map((eco, i) => <ActivityRow key={eco._id} eco={eco} i={i} total={data.ecos.length} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
