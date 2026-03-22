import { useEffect, useState } from 'react';
import { getVersionHistory } from '../../api/reports';
import { StatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatDate';

/** VersionMatrix — product version history grouped per product-family with glass dark styling. */
const VersionMatrix = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVersionHistory().then((r) => setGroups(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center text-white/50 text-[13px]">Loading…</div>;

  return (
    <div className="space-y-4">
      <h3 className="m-0 text-[13px] font-semibold text-white/90">Product Version Matrix</h3>
      {groups.map((versions, gi) => {
        const latest = versions[versions.length - 1];
        return (
          <div key={gi} className="glass-card overflow-hidden">
            <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/[0.08] flex items-center justify-between">
              <span className="font-semibold text-white/90 text-[13px] tracking-wide">{latest.name}</span>
              <StatusBadge status={latest.status} />
            </div>
            <div className="divide-y divide-white/[0.05]">
              {versions.map((v) => (
                <div key={v._id} className="flex items-center px-5 py-3 gap-4 hover:bg-white/[0.02] transition-colors">
                  <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.02] font-semibold tracking-wide ${v.status === 'Active' ? 'text-[#00B4D8]' : 'text-white/40'}`}>
                    {v.version}
                  </span>
                  <StatusBadge status={v.status} />
                  <span className="text-[13px] text-white/70">Sale: <span className="text-[#90E0EF] font-medium">${v.salePrice?.toLocaleString()}</span></span>
                  <span className="text-[13px] text-white/70">Cost: <span className="text-white/90 font-medium">${v.costPrice?.toLocaleString()}</span></span>
                  <span className="text-[11px] text-white/40 ml-auto">{formatDate(v.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VersionMatrix;
