import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import { StatusBadge, Badge } from '../common/Badge';
import Button from '../common/Button';
import { useECO } from '../../hooks/useECO';
import { useAuth } from '../../context/AuthContext';
import {
  canCreateECO,
  canEditECO,
  canValidateECO,
  canApproveECO,
  canRejectECO,
  canApplyECO,
} from '../../utils/roleGuard';
import { formatDate } from '../../utils/formatDate';
import { ECO_STATUS } from '../../utils/constants';
import { getStages } from '../../api/settings';

const ECOList = () => {
  const { ecos, loading, error, fetchECOs, validateECO, approveECO, rejectECO, applyECO } = useECO();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const [stages, setStages] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchECOs();
    getStages().then((r) => setStages(r.data || [])).catch(() => setStages([]));
  }, [fetchECOs]);

  const stageMeta = useCallback(
    (name) => stages.find((s) => s.name === name),
    [stages]
  );

  const run = async (id, fn) => {
    setBusyId(id);
    try {
      await fn(id);
      await fetchECOs();
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

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
        {canCreateECO(role) && (
          <Button onClick={() => navigate('/eco/new')}>+ New ECO</Button>
        )}
      </div>

      <Table headers={['Title', 'Type', 'Product', 'Stage', 'Status', 'Created By', 'Date', 'Actions']}>
        {ecos.length === 0 ? (
          <Table.Row><Table.Cell>No ECOs found.</Table.Cell></Table.Row>
        ) : (
          ecos.map((e) => {
            const sm = stageMeta(e.stage);
            const isOpen = e.status === ECO_STATUS.OPEN;
            const showSubmit = isOpen && canValidateECO(role) && sm && !sm.requiresApproval && !sm.isFinal;
            const showAppr = isOpen && canApproveECO(role) && sm?.requiresApproval;
            const showApply = isOpen && canApplyECO(role) && sm?.isFinal;
            const showEdit = canEditECO(role) && stages[0]?.name === e.stage && isOpen;
            const b = busyId === e._id;

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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
                    <Link to={`/eco/${e._id}`} style={{ textDecoration: 'none' }}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                    {showEdit && (
                      <Link to={`/eco/${e._id}/edit`} style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="secondary">Edit</Button>
                      </Link>
                    )}
                    {showSubmit && (
                      <Button size="sm" loading={b} onClick={() => run(e._id, () => validateECO(e._id))}>Submit</Button>
                    )}
                    {showAppr && (
                      <>
                        <Button size="sm" variant="success" loading={b} onClick={() => run(e._id, () => approveECO(e._id))}>Approve</Button>
                        {canRejectECO(role) && (
                          <Button
                            size="sm"
                            variant="danger"
                            loading={b}
                            onClick={() => {
                              const reason = window.prompt('Reject reason (optional):') ?? '';
                              run(e._id, () => rejectECO(e._id, reason));
                            }}
                          >Reject</Button>
                        )}
                      </>
                    )}
                    {showApply && (
                      <Button size="sm" loading={b} onClick={() => { if (window.confirm('Apply to master data?')) run(e._id, () => applyECO(e._id)); }}>Apply</Button>
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
