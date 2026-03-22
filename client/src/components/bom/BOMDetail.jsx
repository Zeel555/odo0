import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBOM } from '../../hooks/useBOM';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badge';
import Button from '../common/Button';
import { canCreateECO, isAdmin } from '../../utils/roleGuard';

/**
 * BOMDetail — shows full component and operation list for a BOM.
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

  if (loading) return <div className="h-40 flex items-center justify-center text-gray-400">Loading…</div>;
  if (!bom) return <div className="text-red-500 p-4">BOM not found</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {bom.product?.name || 'BOM'} — {bom.version}
          </h2>
          <StatusBadge status={bom.status} />
        </div>
      </div>

      {/* Components */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Components ({bom.components?.length})</h3>
        {bom.components?.length === 0 ? (
          <p className="text-sm text-gray-400">No components defined.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <th className="pb-2">Component</th>
                <th className="pb-2">Version</th>
                <th className="pb-2">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bom.components.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-800">{c.product?.name || '—'}</td>
                  <td className="py-2"><span className="font-mono text-xs bg-gray-100 px-1.5 rounded">{c.product?.version}</span></td>
                  <td className="py-2 font-semibold text-indigo-700">{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Operations */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Operations ({bom.operations?.length})</h3>
        {bom.operations?.length === 0 ? (
          <p className="text-sm text-gray-400">No operations defined.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <th className="pb-2">Operation</th>
                <th className="pb-2">Duration (min)</th>
                <th className="pb-2">Work Center</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bom.operations.map((op, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-800">{op.name}</td>
                  <td className="py-2">{op.duration}</td>
                  <td className="py-2 text-gray-500">{op.workCenter || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        {canCreateECO(role) && bom.status === 'Active' && (
          <Link to={`/eco/new?bomId=${id}`}>
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
