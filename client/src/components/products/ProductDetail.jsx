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

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-plm-frost text-[13px]">Loading…</div>
  );
  if (!product) return <div className="text-red-700 p-4 text-[13px]">Product not found</div>;

  return (
    <div className="page-content max-w-[640px] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="bg-transparent border-none cursor-pointer text-lg text-white/50 hover:text-white transition-colors">
          ←
        </button>
        <h2 className="m-0 text-base font-semibold text-white/90 flex-1">{product.name}</h2>
        <StatusBadge status={product.status} />
      </div>

      {/* Info Card */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          <Field label="Version">
            <span className="font-mono text-[#90E0EF] font-semibold bg-white/[0.08] px-2 py-0.5 rounded">{product.version}</span>
          </Field>
          <Field label="Status"><StatusBadge status={product.status} /></Field>
          <Field label="Sale Price">${product.salePrice?.toLocaleString()}</Field>
          <Field label="Cost Price">${product.costPrice?.toLocaleString()}</Field>
          <Field label="Created By">{product.createdBy?.name || '—'}</Field>
          <Field label="Created At">{formatDate(product.createdAt)}</Field>
        </div>

        {product.attachments?.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-white/[0.08]">
            <p className="m-0 mb-2 text-[11px] font-medium text-white/50 uppercase tracking-wider">
              Attachments
            </p>
            <div className="flex flex-wrap gap-1.5">
              {product.attachments.map((a, i) => (
                <span key={i} className="bg-white/[0.08] text-[#90E0EF] text-[11px] px-2.5 py-1
                                          rounded-md border border-white/[0.1] hover:bg-white/[0.15] cursor-pointer transition-colors">
                  📎 {a}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions — role-based */}
      <div className="flex gap-2.5">
        <Link to={`/products/${id}/history`} className="no-underline">
          <Button variant="secondary">📜 Version History</Button>
        </Link>
        {canCreateECO(role) && product.status === 'Active' && (
          <Link to={`/eco/new?productId=${id}&ecoType=Product`} className="no-underline">
            <Button variant="secondary">📋 Propose change (ECO)</Button>
          </Link>
        )}
        {canArchiveProduct(role) && product.status === 'Active' && (
          <Button variant="danger" onClick={handleArchive}>Archive</Button>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <p className="m-0 mb-0.5 text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</p>
    <div className="text-[13px] text-white/90">{children}</div>
  </div>
);

export default ProductDetail;
