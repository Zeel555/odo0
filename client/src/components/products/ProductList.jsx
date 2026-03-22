import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../context/AuthContext';
import { canCreateProduct, canCreateECO, isOperations } from '../../utils/roleGuard';

const ProductList = () => {
  const { products, loading, error, fetchProducts } = useProducts();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const opsMode = isOperations(role);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-plm-frost text-[13px]">Loading products…</div>
  );
  if (error) return <div className="text-red-700 p-4 text-[13px]">{error}</div>;

  const displayProducts = opsMode ? products.filter((p) => p.status === 'Active') : products;

  return (
    <div className="page-content flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-white/90">Products</h2>
          <p className="m-0 mt-0.5 text-xs text-white/50">
            {displayProducts.length} {opsMode ? 'active' : 'total'}
          </p>
        </div>
        {canCreateProduct(role) && (
          <Button onClick={() => navigate('/products/new')}>+ New Product</Button>
        )}
      </div>

      <Table headers={['Name', 'Version', 'Sale Price', 'Cost Price', 'Status', 'Created By', 'Actions']}>
        {displayProducts.length === 0 ? (
          <Table.Row><Table.Cell>No products found.</Table.Cell></Table.Row>
        ) : (
          displayProducts.map((p) => (
            <Table.Row key={p._id} onClick={() => navigate(`/products/${p._id}`)}>
              <Table.Cell><span className="font-medium text-white/90">{p.name}</span></Table.Cell>
              <Table.Cell>
                <span className="font-mono text-[11px] bg-white/[0.1] px-[7px] py-0.5 rounded text-[#90E0EF]">
                  {p.version}
                </span>
              </Table.Cell>
              <Table.Cell>${p.salePrice?.toLocaleString()}</Table.Cell>
              <Table.Cell>${p.costPrice?.toLocaleString()}</Table.Cell>
              <Table.Cell><StatusBadge status={p.status} /></Table.Cell>
              <Table.Cell><span className="text-xs text-white/50">{p.createdBy?.name || '—'}</span></Table.Cell>
              <Table.Cell>
                {!opsMode && (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {canCreateECO(role) && p.status === 'Active' && (
                      <Button size="sm" variant="secondary"
                        onClick={() => navigate(`/eco/new?productId=${p._id}&ecoType=Product`)}>
                        ECO
                      </Button>
                    )}
                  </div>
                )}
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table>
    </div>
  );
};

export default ProductList;
