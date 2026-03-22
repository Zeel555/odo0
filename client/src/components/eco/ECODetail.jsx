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
import ShineBorder from '../ui/ShineBorder';

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

  const showSubmit = isOpen && canValidateECO(role) && stageMeta && !needsApproval && !isFinal;
  const showApproveReject = isOpen && canApproveECO(role) && needsApproval;
  const showApply = isOpen && canApplyECO(role) && isFinal;
  const showReject = showApproveReject && canRejectECO(role);

  const handleValidate = async () => {
    if (!window.confirm('Submit ECO to the next stage?')) return;
    setActionError(''); setActionLoading(true);
    try { await validateECO(id); await reload(); }
    catch (err) { setActionError(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Approve and move "${eco.title}" to the next stage?`)) return;
    setActionError(''); setActionLoading(true);
    try { await approveECO(id); await reload(); }
    catch (err) { setActionError(err.response?.data?.message || 'Approval failed'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason for rejection (optional):') ?? '';
    setActionError(''); setActionLoading(true);
    try { await rejectECO(id, reason); await reload(); }
    catch (err) { setActionError(err.response?.data?.message || 'Reject failed'); }
    finally { setActionLoading(false); }
  };

  const handleApply = async () => {
    if (!window.confirm('Apply this ECO to master data? This cannot be undone.')) return;
    setActionError(''); setActionLoading(true);
    try { await applyECO(id); await reload(); }
    catch (err) { setActionError(err.response?.data?.message || 'Apply failed'); }
    finally { setActionLoading(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActionLoading(true);
    try { await addECOComment(id, commentText.trim()); setCommentText(''); await reload(); }
    catch (err) { setActionError(err.response?.data?.message || 'Failed to add comment'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="h-40 flex items-center justify-center text-plm-frost text-[13px]">Loading…</div>
  );
  if (!eco) return <div className="text-red-700 p-4 text-[13px]">ECO not found</div>;

  const currentRecord = eco.ecoType === ECO_TYPES.BOM ? eco.bom : eco.product;
  const isPending = needsApproval && isOpen;

  const detailsCard = (
    <div className="glass-card p-5">
      <p className="m-0 mb-3.5 text-[13px] font-semibold text-white/90">ECO Details</p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <Field label="Product">
          {eco.product?.name}{' '}
          <span className="font-mono text-[11px] bg-white/[0.08] text-[#90E0EF] px-1.5 py-0.5 rounded">
            {eco.product?.version}
          </span>
        </Field>
        {eco.ecoType === ECO_TYPES.BOM && (
          <Field label="BOM Version"><span className="font-mono text-[#90E0EF] bg-white/[0.08] px-1.5 py-0.5 rounded">{eco.bom?.version || '—'}</span></Field>
        )}
        <Field label="Stage"><span className="text-[#6EE7B7] font-semibold">{eco.stage}</span></Field>
        <Field label="Status"><StatusBadge status={eco.status} /></Field>
        <Field label="Version Update">{eco.versionUpdate ? '✅ New version' : '⚠️ Patch in-place'}</Field>
        <Field label="Effective Date">{formatDate(eco.effectiveDate)}</Field>
        <Field label="Created By">{eco.user?.name || '—'}</Field>
        <Field label="Created">{formatDate(eco.createdAt)}</Field>
      </div>
      {eco.attachmentUrls?.length > 0 && (
        <div className="mt-3">
          <Field label="ECO attachments">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {eco.attachmentUrls.map((a, i) => (
                <span key={i} className="bg-white/[0.08] text-[#90E0EF] text-[11px] px-2.5 py-1
                                          rounded-md border border-white/[0.1] hover:bg-white/[0.15] cursor-pointer transition-colors">
                  📎 {a}
                </span>
              ))}
            </div>
          </Field>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-content max-w-[840px] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button type="button" onClick={() => navigate(-1)}
          className="bg-transparent border-none cursor-pointer text-lg text-white/50 hover:text-white transition-colors">
          ←
        </button>
        <h2 className="m-0 text-base font-semibold text-white/90 flex-1">{eco.title}</h2>
        <StatusBadge status={eco.status} />
        <Badge color={eco.ecoType === ECO_TYPES.BOM ? 'blue' : 'teal'}>{eco.ecoType}</Badge>
        <Button size="sm" variant="secondary" onClick={() => downloadECOExport(id, eco.title)}>⬇ Export CSV</Button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5 items-center">
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
        {actionError && <span className="text-xs text-red-400 font-medium px-3 py-1 bg-red-500/10 rounded border border-red-500/20">{actionError}</span>}
      </div>

      <p className="m-0 text-[11px] text-white/40 uppercase tracking-wider">
        Workflow: Submit stages → Approval → <strong className="text-white/70">Apply</strong> (master data updated)
      </p>

      {/* Status banners */}
      {eco.status === ECO_STATUS.REJECTED && eco.rejectReason && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3.5 text-[13px] text-red-300">
          <strong className="text-red-400">Rejection reason:</strong> {eco.rejectReason}
        </div>
      )}
      {eco.status === ECO_STATUS.APPLIED && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-[13px] text-green-300 font-semibold flex items-center gap-2">
          <span>✅</span> This ECO has been applied to master data.
        </div>
      )}

      {/* ECO Details */}
      {isPending ? (
        <ShineBorder colors={['#D97706', '#7C3AED', '#00B4D8']} borderWidth={2} className="rounded-xl">
          <div className="glass-card p-5 bg-white/[0.02]">
            <p className="m-0 mb-3.5 text-[13px] font-bold text-[#FDE68A] uppercase tracking-wider">⏳ Pending Approval</p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              <Field label="Product">
                {eco.product?.name}{' '}
                <span className="font-mono text-[11px] bg-white/[0.08] text-[#90E0EF] px-1.5 py-0.5 rounded">{eco.product?.version}</span>
              </Field>
              {eco.ecoType === ECO_TYPES.BOM && (
                <Field label="BOM Version"><span className="font-mono text-[#90E0EF] bg-white/[0.08] px-1.5 py-0.5 rounded">{eco.bom?.version || '—'}</span></Field>
              )}
              <Field label="Stage"><span className="text-[#FCD34D] font-semibold">{eco.stage}</span></Field>
              <Field label="Status"><StatusBadge status={eco.status} /></Field>
              <Field label="Version Update">{eco.versionUpdate ? '✅ New version' : '⚠️ Patch in-place'}</Field>
              <Field label="Effective Date">{formatDate(eco.effectiveDate)}</Field>
              <Field label="Created By">{eco.user?.name || '—'}</Field>
              <Field label="Created">{formatDate(eco.createdAt)}</Field>
            </div>
          </div>
        </ShineBorder>
      ) : detailsCard}

      {/* Proposed changes */}
      <div>
        <p className="m-0 mb-2.5 text-[13px] font-semibold text-white/90">Proposed changes</p>
        <ECODiff ecoType={eco.ecoType} currentRecord={currentRecord} proposedChanges={eco.proposedChanges} />
      </div>

      {/* Discussion */}
      {isOpen && (
        <div className="glass-card p-5">
          <p className="m-0 mb-3 text-[13px] font-semibold text-white/90">Discussion</p>
          <form onSubmit={handleComment} className="flex gap-2.5 mb-4">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-white/[0.15] text-[13px] bg-white/[0.04] text-white placeholder-white/30
                         focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 outline-none transition-all"
            />
            <Button type="submit" disabled={actionLoading}>Post</Button>
          </form>
          {(eco.comments || []).length === 0 ? (
            <p className="m-0 text-[13px] text-white/40">No comments yet.</p>
          ) : (
            <ul className="m-0 pl-[18px] text-[13px] text-white/80 space-y-3">
              {eco.comments.map((c, i) => (
                <li key={i} className="marker:text-white/20">
                  <div className="flex items-baseline gap-2">
                    <strong className="text-white/90">{c.user?.name || 'User'}</strong>
                    <span className="text-white/40 text-[11px]">{formatDate(c.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-white/70">{c.text}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="glass-card p-5 bg-white/[0.02] border-white/[0.08]">
        <p className="m-0 mb-3 text-[13px] font-semibold text-white/90">Activity timeline</p>
        {timeline.length === 0 ? (
          <p className="m-0 text-[13px] text-white/40">No audit entries yet.</p>
        ) : (
          <ul className="m-0 pl-[18px] text-[13px] text-white/70 space-y-2.5 marker:text-white/20">
            {timeline.map((log) => (
              <li key={log._id}>
                <strong className="text-[#90E0EF] font-medium">{log.action}</strong>{' '}
                <span className="text-white/40 mx-1">—</span>{' '}
                <span className="text-white/80">{log.performedBy?.name || 'System'}</span>{' '}
                <span className="text-white/40 text-[11px] ml-1">({formatDate(log.timestamp)})</span>
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
    <p className="m-0 mb-0.5 text-[11px] font-medium text-white/40 uppercase tracking-wider">{label}</p>
    <div className="text-[13px] text-white/90">{children}</div>
  </div>
);

export default ECODetail;
