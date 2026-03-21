import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { useBOM } from '../../hooks/useBOM';
import { useAuth } from '../../context/AuthContext';
import { canCreateBOM, canEditBOM, isOperations } from '../../utils/roleGuard';

const BOMList = () => {
  const { boms, loading, error, fetchBOMs } = useBOM();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const opsMode = isOperations(role);

  useEffect(() => { fetchBOMs(); }, [fetchBOMs]);

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90E0EF', fontSize: 13 }}>Loading BOMs…</div>;
  if (error) return <div style={{ color: '#A32D2D', padding: 16, fontSize: 13 }}>{error}</div>;

  // Operations: only show BOMs for Active products
  const displayBOMs = opsMode
    ? boms.filter((b) => b.product?.status === 'Active' || b.status === 'Active')
    : boms;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#03045E' }}>Bills of Materials</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90E0EF' }}>
            {displayBOMs.length} {opsMode ? 'active' : 'total'}
          </p>
        </div>
        {canCreateBOM(role) && (
          <Button onClick={() => navigate('/bom/new')}>+ New BOM</Button>
        )}
      </div>

      <Table headers={['Product', 'BOM Version', 'Components', 'Operations', 'Status', 'Actions']}>
        {displayBOMs.length === 0 ? (
          <Table.Row><Table.Cell>No BOMs found.</Table.Cell></Table.Row>
        ) : (
          displayBOMs.map((b) => (
            <Table.Row key={b._id} onClick={() => navigate(`/bom/${b._id}`)}>
              <Table.Cell><span style={{ fontWeight: 500, color: '#03045E' }}>{b.product?.name || '—'}</span></Table.Cell>
              <Table.Cell>
                <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#EAF6FB', padding: '2px 7px', borderRadius: 4, color: '#0077B6' }}>{b.version}</span>
              </Table.Cell>
              <Table.Cell>{b.components?.length ?? 0}</Table.Cell>
              <Table.Cell>{b.operations?.length ?? 0}</Table.Cell>
              <Table.Cell><StatusBadge status={b.status} /></Table.Cell>
              <Table.Cell>
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {/* View: all roles */}
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/bom/${b._id}`)}>View</Button>
                  {/* Edit: engineering + admin only */}
                  {!opsMode && canEditBOM(role) && (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/bom/${b._id}/edit`)}>Edit</Button>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table>
    </div>
  );
};

export default BOMList;
