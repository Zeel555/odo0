import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../api/products';
import { getBOMs } from '../api/bom';
import { getECOs } from '../api/eco';
import { StatusBadge } from '../components/common/Badge';
import { formatDate } from '../utils/formatDate';
import { canCreateECO, canCreateProduct, canCreateBOM, canViewECO, isOperations } from '../utils/roleGuard';
import { MODULES, ECO_TYPES } from '../utils/constants';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const [stats, setStats] = useState({ products: 0, boms: 0, openECOs: 0, pendingApprovals: 0 });
  const [recentECOs, setRecentECOs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, bomRes, ecoRes] = await Promise.all([
          getProducts().catch(() => ({ data: [] })),
          getBOMs().catch(() => ({ data: [] })),
          canViewECO(role) ? getECOs().catch(() => ({ data: [] })) : { data: [] },
        ]);
        const products = prodRes.data;
        const boms = bomRes.data;
        const ecos = ecoRes.data;
        setStats({
          products: products.filter((p) => p.status === 'Active').length,
          boms: boms.filter((b) => b.status === 'Active').length,
          openECOs: ecos.filter((e) => e.status === 'Open').length,
          pendingApprovals: ecos.filter((e) => e.status === 'Open' && e.stage === 'Approval').length,
        });
        setRecentECOs(ecos.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [role]);

  const cards = [
    { label: 'ACTIVE PRODUCTS', value: stats.products, icon: '📦', to: '/products', accent: '#0077B6', bar: 60 },
    { label: 'ACTIVE BOMS',     value: stats.boms,     icon: '🔧', to: '/bom',      accent: '#0077B6', bar: 40 },
    ...(canViewECO(role) ? [
      { label: 'OPEN ECOS',        value: stats.openECOs,         icon: '📋', to: '/eco', accent: '#0077B6', bar: 75 },
      { label: 'PENDING APPROVALS',value: stats.pendingApprovals, icon: '⏳', to: '/eco', accent: '#00B4D8', bar: 30, highlight: true },
    ] : []),
  ];

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Welcome */}
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#03045E' }}>
          Good {getGreeting()}, {currentUser?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#90E0EF' }}>
          Here's what's happening in your RevoraX system today.
        </p>
      </div>

      {/* Operations read-only banner */}
      {isOperations(role) && (
        <div style={{
          background: '#EAF6FB', border: '1px solid #90E0EF',
          borderRadius: 8, padding: '10px 16px',
          fontSize: 12, color: '#0077B6',
        }}>
          You are viewing in read-only mode. Only active products and BOMs are visible.
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 110, background: '#EAF6FB', borderRadius: 12, opacity: 0.6 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {cards.map((card) => (
            <Link key={card.label} to={card.to} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#FFFFFF', border: `1.5px solid ${card.highlight ? '#00B4D8' : '#90E0EF'}`,
                borderRadius: 12, padding: 16, transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,119,182,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <p style={{
                  margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
                  color: '#90E0EF', textTransform: 'uppercase', marginBottom: 6,
                }}>{card.label}</p>
                <p style={{
                  margin: 0, fontSize: 26, fontWeight: 700,
                  color: card.highlight ? '#00B4D8' : '#03045E',
                }}>{card.value}</p>
                {/* Mini progress bar */}
                <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: '#EAF6FB', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: card.accent,
                    width: `${Math.min(card.bar + card.value * 5, 100)}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent ECOs */}
      {canViewECO(role) && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#03045E' }}>Recent Change Orders</h3>
            <Link to="/eco" style={{ fontSize: 12, color: '#0077B6', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentECOs.length === 0 ? (
            <div style={{
              background: '#FFFFFF', border: '1.5px solid #90E0EF', borderRadius: 12,
              padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#90E0EF',
            }}>
              No ECOs yet.{' '}
              {canCreateECO(role) && (
                <Link to="/eco/new" style={{ color: '#0077B6' }}>Create one →</Link>
              )}
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1.5px solid #90E0EF', borderRadius: 12, overflow: 'hidden' }}>
              {recentECOs.map((e, i) => (
                <Link key={e._id} to={`/eco/${e._id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px', textDecoration: 'none',
                  borderBottom: i < recentECOs.length - 1 ? '1px solid #CAF0F8' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F5FBFF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: '#EAF6FB', border: '1px solid #90E0EF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0,
                  }}>
                    {e.ecoType === ECO_TYPES.BOM ? '🔧' : '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#03045E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#90E0EF' }}>{e.product?.name} · {formatDate(e.createdAt)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0077B6' }}>{e.stage}</span>
                    <StatusBadge status={e.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#03045E' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {canCreateProduct(role) && (
            <Link to="/products/new" className="btn-outline btn-sm" style={{ textDecoration: 'none' }}>
              + New Product
            </Link>
          )}
          {canCreateBOM(role) && (
            <Link to="/bom/new" className="btn-outline btn-sm" style={{ textDecoration: 'none' }}>
              + New BOM
            </Link>
          )}
          {canCreateECO(role) && (
            <Link to="/eco/new" className="btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              + New ECO
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
