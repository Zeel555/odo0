/**
 * ApproverDashboard.jsx
 * Focus: REVIEW & APPROVE ECOs
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getECOs, approveECO } from '../../api/eco';
import { getDashboardStats } from '../../api/dashboard';
import { ECO_STATUS } from '../../utils/constants';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatDate';
import { getRoleConfig } from '../../utils/roleConfig';
import ShineBorder from '../ui/ShineBorder';

const cfg = getRoleConfig('approver');

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, loading, urgent, border, shine }) => {
  const content = (
    <div className={`rounded-xl px-5 py-[18px] relative overflow-hidden h-full flex flex-col justify-center
                     ${urgent ? 'bg-amber-900/[0.15] border border-amber-500/30' : 'glass-card'}`}
         style={!urgent && border ? { borderColor: `${border}30` } : undefined}>
      {urgent && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-red-500" />
      )}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[22px]">{icon}</span>
        {urgent && (
          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-200 px-2 py-0.5
                           rounded-full uppercase tracking-wider border border-amber-500/30">
            ACTION NEEDED
          </span>
        )}
      </div>
      <p className={`m-0 text-[28px] font-bold ${urgent ? 'text-amber-400' : 'text-white'}`}>
        {loading ? '…' : value}
      </p>
      <p className="m-0 mt-1 text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
    </div>
  );

  if (shine) {
    return (
      <ShineBorder colors={['#D97706', '#EF4444', '#F59E0B']} borderWidth={2} className="h-full">
        {content}
      </ShineBorder>
    );
  }

  return content;
};

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
    } catch { /* handled globally */ } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3.5 px-[18px] py-3.5 hover:bg-white/[0.08] transition-colors"
         style={{ borderBottom: i < total - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
      <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]" />
      <div className="flex-1 min-w-0">
        <Link to={`/eco/${eco._id}`} className="no-underline">
          <p className="m-0 text-[13px] font-semibold text-white/90 truncate">{eco.title}</p>
          <p className="m-0 mt-0.5 text-[11px] text-white/50">
            {eco.product?.name || '—'} · Submitted {formatDate(eco.updatedAt || eco.createdAt)}
          </p>
        </Link>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={eco.status} />
        <Link to={`/eco/${eco._id}`}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md no-underline
                     bg-white/[0.1] text-white/80 border border-white/[0.15] hover:bg-white/[0.15] transition-colors">
          View
        </Link>
        <button onClick={handleApprove} disabled={busy}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md border
                     bg-green-500/20 text-green-300 border-green-500/30
                     hover:bg-green-500/30 transition-colors cursor-pointer disabled:opacity-50">
          {busy ? '…' : '✓ Approve'}
        </button>
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
        const [res, dashRes] = await Promise.all([
          getECOs().catch(() => ({ data: [] })),
          getDashboardStats().catch(() => ({ data: {} })),
        ]);
        const all = res.data || [];
        const d = dashRes.data || {};
        setAllECOs(all);
        setStats({
          pending: d.pendingApproval ?? all.filter((e) => e.stage === 'Approval' && e.status === ECO_STATUS.OPEN).length,
          approved: all.filter((e) => e.status === 'Applied').length,
          rejected: all.filter((e) => e.status === ECO_STATUS.REJECTED).length,
        });
      } finally { setLoading(false); }
    };
    load();
  }, [tick]);

  const pendingECOs = allECOs.filter(e => e.stage === 'Approval' && e.status === 'Open');
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; })();

  return (
    <div className="flex flex-col gap-7">

      {/* Header */}
      <div>
        <h2 className="m-0 text-[22px] font-bold text-white/90">
          Good {greeting}, {currentUser?.name?.split(' ')[0]} 👋
        </h2>
        <p className="m-0 mt-1 text-[13px] text-white/50">
          Approver workspace — review pending ECOs and make decisions.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard label="Pending Approvals" value={stats.pending} icon="⏳" loading={loading}
                  urgent={stats.pending > 0} shine={stats.pending > 0} />
        <StatCard label="Approved ECOs" value={stats.approved} icon="✅" loading={loading} border="#10B981" />
        <StatCard label="Rejected / Cancelled" value={stats.rejected} icon="❌" loading={loading} border="#EF4444" />
      </div>

      {/* Urgent Banner */}
      {!loading && stats.pending > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md
                        rounded-xl px-[18px] py-3.5 flex items-center gap-3">
          <span className="text-xl">🔔</span>
          <div>
            <p className="m-0 text-[13px] font-bold text-amber-300">
              {stats.pending} ECO{stats.pending > 1 ? 's' : ''} require your approval
            </p>
            <p className="m-0 mt-0.5 text-xs text-amber-200/70">Review and approve or reject them below.</p>
          </div>
        </div>
      )}

      {/* Pending Approvals List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-sm font-bold text-white/90">
            Pending Approvals
            {stats.pending > 0 && (
              <span className="ml-2 text-[11px] font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                {stats.pending}
              </span>
            )}
          </h3>
          <Link to="/eco" className="text-xs font-medium no-underline text-[#FCD34D] hover:text-[#FDE68A] transition-colors">
            View all ECOs →
          </Link>
        </div>

        <div className={`glass-card overflow-hidden border
                         ${stats.pending > 0 ? 'border-amber-500/40' : 'border-white/[0.12]'}`}>
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-[22px] h-[22px] border-[2.5px] border-amber-500/30 border-t-amber-400
                              rounded-full animate-spin mx-auto" />
            </div>
          ) : pendingECOs.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="m-0 text-sm text-white/60 font-semibold">All caught up!</p>
              <p className="m-0 mt-1.5 text-xs text-white/40">No ECOs pending your approval right now.</p>
            </div>
          ) : (
            pendingECOs.map((eco, i) => (
              <ApprovalRow key={eco._id} eco={eco} i={i} total={pendingECOs.length} onAction={reload} />
            ))
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-2.5">
        <Link to="/eco" className="no-underline px-4 py-2 rounded-lg text-xs font-semibold
                                    bg-white/[0.1] text-white/80 border border-white/[0.15] hover:bg-white/[0.15] transition-colors">
          Browse All ECOs
        </Link>
        <Link to="/reports" className="no-underline px-4 py-2 rounded-lg text-xs font-semibold
                                       bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
          View Reports
        </Link>
      </div>
    </div>
  );
};

export default ApproverDashboard;
