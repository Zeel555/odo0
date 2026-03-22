import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBOM } from '../../hooks/useBOM';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { canCreateECO, isAdmin } from '../../utils/roleGuard';

/**
 * BOMDetail — glass-card dark theme version.
 */
const BOMDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const { selectedBOM: bom, loading, fetchBOMById, archiveBOM } = useBOM();

  useEffect(() => { fetchBOMById(id); }, [id]);

  const handleArchive = async () => {
    if (!window.confirm('Archive this BOM?')) return;
    await archiveBOM(id);
    navigate('/bom');
  };

  if (loading) return <div className="h-40 flex items-center justify-center text-white/50 text-[13px]">Loading…</div>;
  if (!bom) return <div className="text-red-400 p-4 text-[13px]">BOM not found</div>;

  return (
    <div className="page-content max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-lg text-white/50 hover:text-white transition-colors">←</button>
        <div className="flex items-center gap-3">
          <h2 className="m-0 text-base font-semibold text-white/90">
            {bom.product?.name || 'BOM'} <span className="text-white/40 mx-1">—</span> <span className="font-mono text-[#90E0EF] font-semibold bg-white/[0.08] px-2 py-0.5 rounded">{bom.version}</span>
          </h2>
          <StatusBadge status={bom.status} />
        </div>
      </div>

      {/* Components */}
      <div className="glass-card p-5">
        <h3 className="m-0 mb-4 text-[13px] font-semibold text-white/90">Components ({bom.components?.length})</h3>
        {bom.components?.length === 0 ? (
          <p className="m-0 text-xs text-white/40">No components defined.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white/[0.04] text-[11px] font-semibold text-white/50 uppercase tracking-wider border-b border-white/[0.08]">
                  <th className="px-3.5 py-2.5">Component</th>
                  <th className="px-3.5 py-2.5">Version</th>
                  <th className="px-3.5 py-2.5">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {bom.components.map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-none group">
                    <td className="px-3.5 py-3 text-[13px] font-medium text-white/90">{c.product?.name || '—'}</td>
                    <td className="px-3.5 py-3">
                      <span className="font-mono text-[11px] bg-white/[0.08] text-[#90E0EF] px-1.5 py-0.5 rounded border border-white/[0.05] group-hover:border-white/[0.1]">{c.product?.version}</span>
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-[#6EE7B7]">{c.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operations */}
      <div className="glass-card p-5">
        <h3 className="m-0 mb-4 text-[13px] font-semibold text-white/90">Operations ({bom.operations?.length})</h3>
        {bom.operations?.length === 0 ? (
          <p className="m-0 text-xs text-white/40">No operations defined.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-white/[0.04] text-[11px] font-semibold text-white/50 uppercase tracking-wider border-b border-white/[0.08]">
                  <th className="px-3.5 py-2.5">Operation</th>
                  <th className="px-3.5 py-2.5">Duration (min)</th>
                  <th className="px-3.5 py-2.5">Work Center</th>
                </tr>
              </thead>
              <tbody>
                {bom.operations.map((op, i) => (
                  <tr key={i} className="hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-none">
                    <td className="px-3.5 py-3 text-[13px] font-medium text-white/90">{op.name}</td>
                    <td className="px-3.5 py-3 text-[13px] text-white/80">{op.duration}</td>
                    <td className="px-3.5 py-3 text-[13px] text-white/50">{op.workCenter || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {canCreateECO(role) && bom.status === 'Active' && (
          <Link to={`/eco/new?bomId=${id}`} className="no-underline">
            <Button variant="secondary">📋 Propose change (ECO)</Button>
          </Link>
        )}
        {isAdmin(role) && bom.status === 'Active' && (
          <Button variant="danger" onClick={handleArchive}>Archive BOM</Button>
        )}
      </div>
    </div>
  );
};

export default BOMDetail;
