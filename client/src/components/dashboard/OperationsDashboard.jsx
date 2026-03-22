/**
 * OperationsDashboard.jsx
 * Focus: READ-ONLY VIEW of active products and BOMs
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api/products';
import { getBOMs } from '../../api/bom';
import { getRoleConfig } from '../../utils/roleConfig';

const cfg = getRoleConfig('operations');

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, loading }) => (
  <div className="glass-card px-5 py-5" style={{ borderColor: `rgba(5, 150, 105, 0.3)` }}>
    <span className="text-2xl">{icon}</span>
    <p className="m-0 mt-2.5 mb-0.5 text-3xl font-bold text-white">
      {loading ? '…' : value}
    </p>
    <p className="m-0 text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
  </div>
);

/* ── Read-only Table ────────────────────────────────────────── */
const ReadOnlyTable = ({ columns, rows, emptyMsg, loading }) => (
  <div className="glass-card overflow-hidden">
    {/* Header */}
    <div className="grid bg-white/[0.04] border-b border-white/[0.08] px-[18px] py-2.5"
         style={{ gridTemplateColumns: columns.map(c => c.w || '1fr').join(' ') }}>
      {columns.map(c => (
        <span key={c.key} className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
          {c.label}
        </span>
      ))}
    </div>

    {loading ? (
      <div className="py-10 text-center">
        <div className="w-5 h-5 border-[2.5px] rounded-full animate-spin mx-auto border-white/[0.2]"
             style={{ borderTopColor: '#6EE7B7' }} />
      </div>
    ) : rows.length === 0 ? (
      <div className="py-9 px-6 text-center text-[13px] text-white/40">{emptyMsg}</div>
    ) : (
      rows.map((row, i) => (
        <div key={row._id || i}
          className="grid px-[18px] py-3 hover:bg-white/[0.06] transition-colors"
          style={{
            gridTemplateColumns: columns.map(c => c.w || '1fr').join(' '),
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
          {columns.map(c => (
            <span key={c.key}
              className={`text-[13px] truncate ${c.muted ? 'text-white/50' : 'text-white/90'}
                          ${c.bold ? 'font-medium' : ''}`}>
              {c.render ? c.render(row) : row[c.key] ?? '—'}
            </span>
          ))}
        </div>
      ))
    )}
  </div>
);

/* ── Main Component ─────────────────────────────────────────── */
const OperationsDashboard = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, bRes] = await Promise.all([
          getProducts().catch(() => ({ data: [] })),
          getBOMs().catch(() => ({ data: [] })),
        ]);
        setProducts((pRes.data || []).filter(p => p.status === 'Active'));
        setBoms((bRes.data || []).filter(b => b.status === 'Active'));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; })();

  const productCols = [
    { key: 'name', label: 'Product Name', w: '2fr', bold: true },
    { key: 'category', label: 'Category', w: '1fr', muted: true },
    { key: 'version', label: 'Version', w: '80px', muted: true, render: r => r.version ? `v${r.version}` : '—' },
    { key: 'status', label: 'Status', w: '90px', render: () => (
      <span className="text-[11px] font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">Active</span>
    )},
  ];

  const bomCols = [
    { key: 'name', label: 'BOM Name', w: '2fr', bold: true },
    { key: 'product', label: 'Product', w: '1fr', muted: true, render: r => r.product?.name || '—' },
    { key: 'version', label: 'Version', w: '80px', muted: true, render: r => r.version ? `v${r.version}` : '—' },
    { key: 'status', label: 'Status', w: '90px', render: () => (
      <span className="text-[11px] font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">Active</span>
    )},
  ];

  return (
    <div className="flex flex-col gap-7">

      {/* Header */}
      <div>
        <h2 className="m-0 text-[22px] font-bold text-white/90">
          Good {greeting}, {currentUser?.name?.split(' ')[0]} 👋
        </h2>
        <p className="m-0 mt-1 text-[13px] text-white/50">
          Operations view — read-only access to active products and bill of materials.
        </p>
      </div>

      {/* Read-only banner */}
      <div className="flex items-center gap-2.5 rounded-[10px] px-4 py-2.5 bg-green-500/10 border border-green-500/30">
        <span className="text-base">👁️</span>
        <p className="m-0 text-xs font-medium text-green-300">
          Read-only mode — you can view all active records but cannot make changes.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <StatCard label="Active Products" value={products.length} icon="📦" accent="#10B981" loading={loading} />
        <StatCard label="Active BOMs" value={boms.length} icon="🔧" accent="#00B4D8" loading={loading} />
      </div>

      {/* Products Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-sm font-bold text-white/90">Active Products</h3>
          <Link to="/products" className="text-xs font-medium no-underline text-green-400 hover:text-green-300 transition-colors">
            View all →
          </Link>
        </div>
        <ReadOnlyTable columns={productCols} rows={products.slice(0, 8)}
                       emptyMsg="No active products found." loading={loading} />
      </div>

      {/* BOMs Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-sm font-bold text-white/90">Active Bills of Materials</h3>
          <Link to="/bom" className="text-xs font-medium no-underline text-green-400 hover:text-green-300 transition-colors">
            View all →
          </Link>
        </div>
        <ReadOnlyTable columns={bomCols} rows={boms.slice(0, 8)}
                       emptyMsg="No active BOMs found." loading={loading} />
      </div>
    </div>
  );
};

export default OperationsDashboard;
