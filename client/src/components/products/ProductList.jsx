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

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90E0EF', fontSize: 13 }}>Loading products…</div>;
  if (error) return <div style={{ color: '#A32D2D', padding: 16, fontSize: 13 }}>{error}</div>;

  // Operations can only see Active products
  const displayProducts = opsMode ? products.filter((p) => p.status === 'Active') : products;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#03045E' }}>Products</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90E0EF' }}>
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
              <Table.Cell><span style={{ fontWeight: 500, color: '#03045E' }}>{p.name}</span></Table.Cell>
              <Table.Cell><span style={{ fontFamily: 'monospace', fontSize: 11, background: '#EAF6FB', padding: '2px 7px', borderRadius: 4, color: '#0077B6' }}>{p.version}</span></Table.Cell>
              <Table.Cell>${p.salePrice?.toLocaleString()}</Table.Cell>
              <Table.Cell>${p.costPrice?.toLocaleString()}</Table.Cell>
              <Table.Cell><StatusBadge status={p.status} /></Table.Cell>
              <Table.Cell style={{ fontSize: 12, color: '#90E0EF' }}>{p.createdBy?.name || '—'}</Table.Cell>
              <Table.Cell>
                {/* Operations: no action buttons at all */}
                {!opsMode && (
                  <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    {canCreateECO(role) && p.status === 'Active' && (
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/eco/new?productId=${p._id}&ecoType=Product`)}>ECO</Button>
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
