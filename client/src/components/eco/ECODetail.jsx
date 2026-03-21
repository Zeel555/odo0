import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useECO } from '../../hooks/useECO';
import { useAuth } from '../../context/AuthContext';
import { getStages } from '../../api/settings';
import { StatusBadge, Badge } from '../common/Badge';
import Button from '../common/Button';
import ECOStageBar from './ECOStageBar';
import ECODiff from './ECODiff';
import { formatDate } from '../../utils/formatDate';
import {
  canValidateECO, canApproveECO, canApplyECO, canEditECO, isOperations,
} from '../../utils/roleGuard';
import { ECO_TYPES, ECO_STATUS } from '../../utils/constants';

const ECODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { fetchECOById, validateECO, approveECO, applyECO } = useECO();

  const [eco, setEco] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const role = currentUser?.role;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ecoData, stagesRes] = await Promise.all([fetchECOById(id), getStages()]);
        setEco(ecoData);
        setStages(stagesRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const currentStageObj = stages.find((s) => s.name === eco?.stage);
  const isApplied = eco?.status === ECO_STATUS.APPLIED;
  const isFirstStage = eco && stages.length > 0 && eco.stage === stages[0]?.name;

  // Per-role action visibility
  const showValidate = !isApplied && currentStageObj && !currentStageObj.requiresApproval && !currentStageObj.isFinal && canValidateECO(role);
  const showApprove  = !isApplied && currentStageObj?.requiresApproval && canApproveECO(role);
  const showApply    = !isApplied && currentStageObj?.isFinal && canApplyECO(role);
  const showEdit     = !isApplied && isFirstStage && canEditECO(role);
  const opsReadOnly  = isOperations(role);

  const handleAction = async (action) => {
    setActionError('');
    setActionLoading(true);
    try {
      let result;
      if (action === 'validate') result = await validateECO(id);
      else if (action === 'approve') result = await approveECO(id);
      else if (action === 'apply') result = await applyECO(id);
      const updated = result?.eco || result;
      if (updated?._id) setEco(updated);
      const fresh = await fetchECOById(id);
      if (fresh) setEco(fresh);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90E0EF', fontSize: 13 }}>Loading…</div>;
  if (!eco) return <div style={{ color: '#A32D2D', padding: 16, fontSize: 13 }}>ECO not found</div>;

  const currentRecord = eco.ecoType === ECO_TYPES.BOM ? eco.bom : eco.product;

  return (
    <div className="page-content" style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#90E0EF' }}>←</button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#03045E', flex: 1 }}>{eco.title}</h2>
        <StatusBadge status={eco.status} />
        <Badge color={eco.ecoType === ECO_TYPES.BOM ? 'blue' : 'teal'}>{eco.ecoType}</Badge>
      </div>

      {/* Operations read-only banner */}
      {opsReadOnly && (
        <div style={{ background: '#EAF6FB', border: '1px solid #90E0EF', borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#0077B6' }}>
          You have read-only access to ECOs.
        </div>
      )}

      {/* Stage Bar */}
      <ECOStageBar stages={stages} currentStage={eco.stage} />

      {/* Action buttons — hidden for operations */}
      {!isApplied && !opsReadOnly && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {showValidate && (
            <Button onClick={() => handleAction('validate')} loading={actionLoading} variant="primary">
              ✓ Validate (Move to {stages[stages.findIndex(s => s.name === eco.stage) + 1]?.name || 'Next'})
            </Button>
          )}
          {showApprove && (
            <Button onClick={() => handleAction('approve')} loading={actionLoading} variant="success">
              ✓ Approve ECO
            </Button>
          )}
          {showApply && (
            <Button onClick={() => handleAction('apply')} loading={actionLoading} variant="primary">
              ⚡ Apply ECO
            </Button>
          )}
          {showEdit && (
            <Link to={`/eco/${id}/edit`} style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm">✏️ Edit</Button>
            </Link>
          )}
          {actionError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{actionError}</p>}
        </div>
      )}

      {/* ECO Info Card */}
      <div style={{ background: '#FFFFFF', border: '1.5px solid #90E0EF', borderRadius: 12, padding: 20 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#03045E' }}>ECO Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          <Field label="Product">{eco.product?.name} <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#EAF6FB', padding: '1px 6px', borderRadius: 4 }}>{eco.product?.version}</span></Field>
          {eco.ecoType === ECO_TYPES.BOM && <Field label="BOM Version"><span style={{ fontFamily: 'monospace' }}>{eco.bom?.version || '—'}</span></Field>}
          <Field label="Stage"><span style={{ color: '#0077B6', fontWeight: 600 }}>{eco.stage}</span></Field>
          <Field label="Status"><StatusBadge status={eco.status} /></Field>
          <Field label="Version Update">{eco.versionUpdate ? '✅ New version' : '⚠️ Patch in-place'}</Field>
          <Field label="Effective Date">{formatDate(eco.effectiveDate)}</Field>
          <Field label="Created By">{eco.user?.name || '—'}</Field>
          <Field label="Created">{formatDate(eco.createdAt)}</Field>
        </div>
      </div>

      {/* Proposed Changes Diff — always read-only for all roles here */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#03045E' }}>Proposed Changes</p>
        <ECODiff ecoType={eco.ecoType} currentRecord={currentRecord} proposedChanges={eco.proposedChanges} />
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

export default ECODetail;
