import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { useBOM } from '../../hooks/useBOM';
import { useAuth } from '../../context/AuthContext';
import { canCreateBOM, canCreateECO, isAdmin, isOperations } from '../../utils/roleGuard';

const BOMList = () => {
  const { boms, loading, error, fetchBOMs, archiveBOM } = useBOM();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const opsMode = isOperations(role);

  useEffect(() => { fetchBOMs(); }, [fetchBOMs]);

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-plm-frost text-[13px]">Loading BOMs…</div>
  );
  if (error) return <div className="text-red-700 p-4 text-[13px]">{error}</div>;

  const displayBOMs = opsMode
    ? boms.filter((b) => b.product?.status === 'Active' || b.status === 'Active')
    : boms;

  return (
    <div className="page-content flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-white/90">Bills of Materials</h2>
          <p className="m-0 mt-0.5 text-xs text-white/50">
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
              <Table.Cell><span className="font-medium text-white/90">{b.product?.name || '—'}</span></Table.Cell>
              <Table.Cell>
                <span className="font-mono text-[11px] bg-white/[0.1] px-[7px] py-0.5 rounded text-[#90E0EF]">
                  {b.version}
                </span>
              </Table.Cell>
              <Table.Cell>{b.components?.length ?? 0}</Table.Cell>
              <Table.Cell>{b.operations?.length ?? 0}</Table.Cell>
              <Table.Cell><StatusBadge status={b.status} /></Table.Cell>
              <Table.Cell>
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/bom/${b._id}`)}>View</Button>
                  {!opsMode && canCreateECO(role) && b.status === 'Active' && (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/eco/new?bomId=${b._id}`)}>ECO</Button>
                  )}
                  {!opsMode && isAdmin(role) && b.status === 'Active' && (
                    <Button size="sm" variant="danger" onClick={async () => {
                      if (!window.confirm('Archive this BOM?')) return;
                      await archiveBOM(b._id);
                      fetchBOMs();
                    }}>Archive</Button>
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
