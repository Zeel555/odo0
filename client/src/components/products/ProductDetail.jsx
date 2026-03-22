import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';
import { canCreateECO, canArchiveProduct } from '../../utils/roleGuard';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProduct: product, loading, fetchProductById, archiveProduct } = useProducts();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  useEffect(() => { fetchProductById(id); }, [id]);

  const handleArchive = async () => {
    if (!window.confirm('Archive this product?')) return;
    await archiveProduct(id);
    navigate('/products');
  };

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90E0EF', fontSize: 13 }}>Loading…</div>;
  if (!product) return <div style={{ color: '#A32D2D', padding: 16, fontSize: 13 }}>Product not found</div>;

  return (
    <div className="page-content" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#90E0EF' }}>←</button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#03045E', flex: 1 }}>{product.name}</h2>
        <StatusBadge status={product.status} />
      </div>

      {/* Info Card */}
      <div style={{ background: '#FFFFFF', border: '1.5px solid #90E0EF', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          <Field label="Version"><span style={{ fontFamily: 'monospace', color: '#0077B6', fontWeight: 600 }}>{product.version}</span></Field>
          <Field label="Status"><StatusBadge status={product.status} /></Field>
          <Field label="Sale Price">${product.salePrice?.toLocaleString()}</Field>
          <Field label="Cost Price">${product.costPrice?.toLocaleString()}</Field>
          <Field label="Created By">{product.createdBy?.name || '—'}</Field>
          <Field label="Created At">{formatDate(product.createdAt)}</Field>
        </div>

        {product.attachments?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, color: '#90E0EF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attachments</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {product.attachments.map((a, i) => (
                <span key={i} style={{ background: '#EAF6FB', color: '#0077B6', fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid #90E0EF' }}>📎 {a}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions — role-based */}
      <div style={{ display: 'flex', gap: 10 }}>
        {/* Version History: all roles */}
        <Link to={`/products/${id}/history`} style={{ textDecoration: 'none' }}>
          <Button variant="secondary">📜 Version History</Button>
        </Link>
        {canCreateECO(role) && product.status === 'Active' && (
          <Link to={`/eco/new?productId=${id}&ecoType=Product`} style={{ textDecoration: 'none' }}>
            <Button variant="secondary">📋 Propose change (ECO)</Button>
          </Link>
        )}
        {/* Archive: admin only */}
        {canArchiveProduct(role) && product.status === 'Active' && (
          <Button variant="danger" onClick={handleArchive}>Archive</Button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 500, color: '#90E0EF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <div style={{ fontSize: 13, color: '#03045E' }}>{children}</div>
  </div>
);

export default ProductDetail;
