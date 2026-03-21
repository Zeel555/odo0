import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import { StatusBadge, Badge } from '../common/Badge';
import Button from '../common/Button';
import { useECO } from '../../hooks/useECO';
import { useAuth } from '../../context/AuthContext';
import { canCreateECO, canEditECO, canValidateECO, canApproveECO } from '../../utils/roleGuard';
import { formatDate } from '../../utils/formatDate';

const ECOList = () => {
  const { ecos, loading, error, fetchECOs } = useECO();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role;

  useEffect(() => { fetchECOs(); }, [fetchECOs]);

  const ecoTypeColor = { Product: 'teal', BoM: 'blue' };

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90E0EF', fontSize: 13 }}>Loading ECOs…</div>;
  if (error) return <div style={{ color: '#A32D2D', padding: 16, fontSize: 13 }}>{error}</div>;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#03045E' }}>Engineering Change Orders</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90E0EF' }}>{ecos.length} total</p>
        </div>
        {/* + New ECO: only engineering + admin */}
        {canCreateECO(role) && (
          <Button onClick={() => navigate('/eco/new')}>+ New ECO</Button>
        )}
      </div>

      <Table headers={['Title', 'Type', 'Product', 'Stage', 'Status', 'Created By', 'Date', 'Actions']}>
        {ecos.length === 0 ? (
          <Table.Row><Table.Cell>No ECOs found.</Table.Cell></Table.Row>
        ) : (
          ecos.map((e) => {
            // Per-row action button logic
            const showRowValidate = canValidateECO(role) && e.status !== 'Applied';
            const showRowApprove  = canApproveECO(role) && e.status !== 'Applied';
            const showRowEdit     = canEditECO(role) && e.stage === 'New';

            return (
              <Table.Row key={e._id} onClick={() => navigate(`/eco/${e._id}`)}>
                <Table.Cell><span style={{ fontWeight: 500, color: '#03045E' }}>{e.title}</span></Table.Cell>
                <Table.Cell><Badge color={ecoTypeColor[e.ecoType] || 'gray'}>{e.ecoType}</Badge></Table.Cell>
                <Table.Cell>{e.product?.name || '—'}</Table.Cell>
                <Table.Cell><span style={{ fontWeight: 600, color: '#0077B6', fontSize: 12 }}>{e.stage}</span></Table.Cell>
                <Table.Cell><StatusBadge status={e.status} /></Table.Cell>
                <Table.Cell>{e.user?.name || '—'}</Table.Cell>
                <Table.Cell>{formatDate(e.createdAt)}</Table.Cell>
                <Table.Cell>
                  <div style={{ display: 'flex', gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
                    {/* View — always shown */}
                    <Link to={`/eco/${e._id}`} style={{ textDecoration: 'none' }}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                    {/* Edit — engineering + admin, only on 'New' stage */}
                    {showRowEdit && (
                      <Link to={`/eco/${e._id}/edit`} style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="secondary">Edit</Button>
                      </Link>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })
        )}
      </Table>
    </div>
  );
};

export default ECOList;
