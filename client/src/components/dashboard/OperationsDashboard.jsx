/**
 * OperationsDashboard.jsx
 * Focus: READ-ONLY VIEW of active products and BOMs
 * No ECOs, no edit buttons, no approval actions
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
  <div style={{
    background: '#FFFFFF', border: `1.5px solid ${accent}33`,
    borderRadius: 14, padding: '20px 22px',
  }}>
    <span style={{ fontSize: 24 }}>{icon}</span>
    <p style={{ margin: '10px 0 2px', fontSize: 30, fontWeight: 700, color: '#0F172A' }}>
      {loading ? '…' : value}
    </p>
    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
  </div>
);

/* ── Read-only Table ────────────────────────────────────────── */
const ReadOnlyTable = ({ columns, rows, emptyMsg, loading }) => (
  <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
    {/* Header */}
    <div style={{
      display: 'grid', gridTemplateColumns: columns.map(c => c.w || '1fr').join(' '),
      padding: '10px 18px', background: '#F8FAFC',
      borderBottom: '1px solid #E2E8F0',
    }}>
      {columns.map(c => (
        <span key={c.key} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.label}</span>
      ))}
    </div>

    {loading ? (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ width: 20, height: 20, border: `2.5px solid ${cfg.accentBorder}`, borderTopColor: cfg.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ) : rows.length === 0 ? (
      <div style={{ padding: '36px 24px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>{emptyMsg}</div>
    ) : (
      rows.map((row, i) => (
        <div key={row._id || i} style={{
          display: 'grid', gridTemplateColumns: columns.map(c => c.w || '1fr').join(' '),
          padding: '12px 18px', borderBottom: i < rows.length - 1 ? '1px solid #F1F5F9' : 'none',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {columns.map(c => (
            <span key={c.key} style={{ fontSize: 13, color: c.muted ? '#64748B' : '#0F172A', fontWeight: c.bold ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; })();

  const productCols = [
    { key: 'name', label: 'Product Name', w: '2fr', bold: true },
    { key: 'category', label: 'Category', w: '1fr', muted: true },
    { key: 'version', label: 'Version', w: '80px', muted: true, render: r => r.version ? `v${r.version}` : '—' },
    { key: 'status', label: 'Status', w: '90px', render: r => (
      <span style={{ fontSize: 11, fontWeight: 600, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 20 }}>Active</span>
    )},
  ];

  const bomCols = [
    { key: 'name', label: 'BOM Name', w: '2fr', bold: true },
    { key: 'product', label: 'Product', w: '1fr', muted: true, render: r => r.product?.name || '—' },
    { key: 'version', label: 'Version', w: '80px', muted: true, render: r => r.version ? `v${r.version}` : '—' },
    { key: 'status', label: 'Status', w: '90px', render: r => (
      <span style={{ fontSize: 11, fontWeight: 600, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 20 }}>Active</span>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
          Good {greeting}, {currentUser?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
          Operations view — read-only access to active products and bill of materials.
        </p>
      </div>

      {/* Read-only banner */}
      <div style={{
        background: cfg.accentLight, border: `1px solid ${cfg.accentBorder}`,
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>👁️</span>
        <p style={{ margin: 0, fontSize: 12, color: cfg.accent, fontWeight: 500 }}>
          Read-only mode — you can view all active records but cannot make changes.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard label="Active Products" value={products.length} icon="📦" accent={cfg.accent} loading={loading} />
        <StatCard label="Active BOMs" value={boms.length} icon="🔧" accent="#0077B6" loading={loading} />
      </div>

      {/* Products Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Active Products</h3>
          <Link to="/products" style={{ fontSize: 12, color: cfg.accent, textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        <ReadOnlyTable
          columns={productCols}
          rows={products.slice(0, 8)}
          emptyMsg="No active products found."
          loading={loading}
        />
      </div>

      {/* BOMs Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Active Bills of Materials</h3>
          <Link to="/bom" style={{ fontSize: 12, color: cfg.accent, textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        <ReadOnlyTable
          columns={bomCols}
          rows={boms.slice(0, 8)}
          emptyMsg="No active BOMs found."
          loading={loading}
        />
      </div>
    </div>
  );
};

export default OperationsDashboard;
