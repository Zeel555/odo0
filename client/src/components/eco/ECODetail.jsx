import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useECO } from '../../hooks/useECO';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, Badge } from '../common/Badge';
import Button from '../common/Button';
import ECODiff from './ECODiff';
import { formatDate } from '../../utils/formatDate';
import {
  canApproveECO,
  canApplyECO,
  canRejectECO,
  canValidateECO,
} from '../../utils/roleGuard';
import { ECO_TYPES, ECO_STATUS } from '../../utils/constants';
import { getStages } from '../../api/settings';

const ECODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    fetchECOById,
    fetchECOTimeline,
    validateECO,
    approveECO,
    rejectECO,
    applyECO,
    addECOComment,
    downloadECOExport,
  } = useECO();

  const [eco, setEco] = useState(null);
  const [stages, setStages] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [commentText, setCommentText] = useState('');

  const role = currentUser?.role;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ecoData, stageRes, tl] = await Promise.all([
          fetchECOById(id),
          getStages().catch(() => ({ data: [] })),
          fetchECOTimeline(id).catch(() => []),
        ]);
        setEco(ecoData);
        setStages(stageRes.data || []);
        setTimeline(tl || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const reload = async () => {
    const ecoData = await fetchECOById(id);
    setEco(ecoData);
    const tl = await fetchECOTimeline(id);
    setTimeline(tl || []);
  };

  const stageMeta = stages.find((s) => s.name === eco?.stage);
  const isOpen = eco?.status === ECO_STATUS.OPEN;
  const isFinal = stageMeta?.isFinal;
  const needsApproval = stageMeta?.requiresApproval;

  const showSubmit =
    isOpen &&
    canValidateECO(role) &&
    stageMeta &&
    !needsApproval &&
    !isFinal;
  const showApproveReject =
    isOpen && canApproveECO(role) && needsApproval;
  const showApply = isOpen && canApplyECO(role) && isFinal;
  const showReject = showApproveReject && canRejectECO(role);

  const handleValidate = async () => {
    if (!window.confirm('Submit ECO to the next stage?')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await validateECO(id);
      await reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Approve and move "${eco.title}" to the next stage? (Master data updates only after Apply.)`)) return;
    setActionError('');
    setActionLoading(true);
    try {
      await approveECO(id);
      await reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    setActionError('');
    setActionLoading(true);
    try {
      await rejectECO(id, reason);
      await reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Reject failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async () => {
    if (!window.confirm('Apply this ECO to master data? This cannot be undone.')) return;
    setActionError('');
    setActionLoading(true);
    try {
      await applyECO(id);
      await reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Apply failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActionLoading(true);
    try {
      await addECOComment(id, commentText.trim());
      setCommentText('');
      await reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90E0EF', fontSize: 13 }}>Loading…</div>;
  if (!eco) return <div style={{ color: '#A32D2D', padding: 16, fontSize: 13 }}>ECO not found</div>;

  const currentRecord = eco.ecoType === ECO_TYPES.BOM ? eco.bom : eco.product;

  return (
    <div className="page-content" style={{ maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#90E0EF' }}>←</button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#03045E', flex: 1 }}>{eco.title}</h2>
        <StatusBadge status={eco.status} />
        <Badge color={eco.ecoType === ECO_TYPES.BOM ? 'blue' : 'teal'}>{eco.ecoType}</Badge>
        <Button size="sm" variant="secondary" onClick={() => downloadECOExport(id, eco.title)}>⬇ Export CSV</Button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {showSubmit && (
          <Button onClick={handleValidate} loading={actionLoading} variant="secondary">➡ Submit / Next stage</Button>
        )}
        {showApproveReject && (
          <>
            <Button onClick={handleApprove} loading={actionLoading} variant="success">✓ Approve</Button>
            {showReject && (
              <Button onClick={handleReject} loading={actionLoading} variant="danger">✕ Reject</Button>
            )}
          </>
        )}
        {showApply && (
          <Button onClick={handleApply} loading={actionLoading}>⚡ Apply to master data</Button>
        )}
        {actionError && <span style={{ fontSize: 12, color: '#A32D2D' }}>{actionError}</span>}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: '#90E0EF' }}>
        Workflow: submit through stages → approval when required → <strong style={{ color: '#03045E' }}>Apply</strong> (admin) only in the final stage executes master-data changes.
      </p>

      {eco.status === ECO_STATUS.REJECTED && eco.rejectReason && (
        <div style={{ background: '#FCEBEB', border: '1px solid #F28B82', borderRadius: 8, padding: 12, fontSize: 13, color: '#791F1F' }}>
          <strong>Rejection reason:</strong> {eco.rejectReason}
        </div>
      )}

      {eco.status === ECO_STATUS.APPLIED && (
        <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#166534', fontWeight: 600 }}>
          ✅ This ECO has been applied to master data.
        </div>
      )}

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
        {eco.attachmentUrls?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Field label="ECO attachments">{eco.attachmentUrls.join(', ')}</Field>
          </div>
        )}
      </div>

      <div>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#03045E' }}>Proposed changes</p>
        <ECODiff ecoType={eco.ecoType} currentRecord={currentRecord} proposedChanges={eco.proposedChanges} />
      </div>

      {isOpen && (
        <div style={{ background: '#FFFFFF', border: '1.5px solid #90E0EF', borderRadius: 12, padding: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#03045E' }}>Discussion</p>
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #90E0EF', fontSize: 13 }}
            />
            <Button type="submit" size="sm" disabled={actionLoading}>Post</Button>
          </form>
          {(eco.comments || []).length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: '#90E0EF' }}>No comments yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#03045E' }}>
              {eco.comments.map((c, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <strong>{c.user?.name || 'User'}</strong>
                  <span style={{ color: '#90E0EF', fontSize: 11, marginLeft: 8 }}>{formatDate(c.createdAt)}</span>
                  <div style={{ marginTop: 4 }}>{c.text}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ background: '#FFFFFF', border: '1.5px solid #CAF0F8', borderRadius: 12, padding: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#03045E' }}>Activity timeline</p>
        {timeline.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: '#90E0EF' }}>No audit entries yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#0077B6' }}>
            {timeline.map((log) => (
              <li key={log._id} style={{ marginBottom: 8 }}>
                <strong>{log.action}</strong> — {log.performedBy?.name || '—'}{' '}
                <span style={{ color: '#90E0EF' }}>{formatDate(log.timestamp)}</span>
              </li>
            ))}
          </ul>
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

export default ECODetail;
