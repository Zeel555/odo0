import { DIFF_COLORS, ECO_TYPES } from '../../utils/constants';
import { computeProductDiff, computeBOMDiff } from '../../utils/diffUtils';

const ROW_STYLES = {
  [DIFF_COLORS.ADDED]:     { background: 'rgba(5, 150, 105, 0.15)', borderLeftColor: '#10B981', color: '#6EE7B7' },
  [DIFF_COLORS.REDUCED]:   { background: 'rgba(239, 68, 68, 0.15)', borderLeftColor: '#EF4444', color: '#FCA5A5' },
  [DIFF_COLORS.UNCHANGED]: { background: 'rgba(255, 255, 255, 0.04)', borderLeftColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.8)' },
};

const CHANGE_LABEL = {
  [DIFF_COLORS.ADDED]:     '▲ Increase',
  [DIFF_COLORS.REDUCED]:   '▼ Decrease',
  [DIFF_COLORS.UNCHANGED]: '= No change',
};

const DiffTable = ({ children, headers }) => (
  <div className="glass-card overflow-hidden">
    <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.08]">
      <p className="m-0 text-xs font-semibold text-white/90">{headers}</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] text-left">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/[0.05]">
            {['Component', 'Old Qty', 'New Qty', 'Change'].map((h) => (
              <th key={h} className="px-3.5 py-2 text-xs font-semibold text-white/50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  </div>
);

const ProductDiffTable = ({ diff }) => (
  <div className="glass-card overflow-hidden">
    <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.08]">
      <p className="m-0 text-xs font-semibold text-white/90">📦 Product Field Changes</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] text-left">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/[0.05]">
            {['Field', 'Current Value', 'Proposed Value'].map((h) => (
              <th key={h} className="px-3.5 py-2 text-xs font-semibold text-white/50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diff.length === 0 ? (
            <tr><td colSpan={3} className="px-6 py-6 text-center text-[13px] text-white/40">No changes proposed.</td></tr>
          ) : (
            diff.map(({ field, oldValue, newValue }) => {
              const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
              const rowStyle = changed ? ROW_STYLES[DIFF_COLORS.ADDED] : ROW_STYLES[DIFF_COLORS.UNCHANGED];
              return (
                <tr key={field} className="border-b border-white/[0.05] last:border-none">
                  <td className="px-3.5 py-2.5 font-medium border-l-[3px]" style={{ ...rowStyle, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize' }}>{field}</td>
                  <td className="px-3.5 py-2.5" style={{ ...rowStyle, borderLeft: 'none', color: 'rgba(255,255,255,0.5)' }}>{fmt(oldValue)}</td>
                  <td className="px-3.5 py-2.5 font-semibold" style={{ ...rowStyle, borderLeft: 'none' }}>{fmt(newValue)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * ECODiff — renders colored diff table using glass-card dark theme.
 */
const ECODiff = ({ ecoType, currentRecord, proposedChanges }) => {
  if (!currentRecord || !proposedChanges) {
    return <p className="text-[13px] text-white/40">No diff available.</p>;
  }

  if (ecoType === ECO_TYPES.PRODUCT) {
    const diff = computeProductDiff(currentRecord, proposedChanges);
    return <ProductDiffTable diff={diff} />;
  }

  if (ecoType === ECO_TYPES.BOM) {
    const { components } = computeBOMDiff(currentRecord, proposedChanges);
    return (
      <DiffTable headers="🔧 Component Changes">
        {components.length === 0 ? (
          <tr><td colSpan={4} className="px-6 py-6 text-center text-white/40">No component changes.</td></tr>
        ) : (
          components.map((c) => {
            const s = ROW_STYLES[c.changeType] || ROW_STYLES[DIFF_COLORS.UNCHANGED];
            return (
              <tr key={c.componentId} className="border-b border-white/[0.05] last:border-none mb-1">
                <td className="px-3.5 py-2.5 font-medium border-l-[3px]" style={{ ...s, color: 'rgba(255,255,255,0.9)' }}>{c.componentName}</td>
                <td className="px-3.5 py-2.5" style={{ ...s, borderLeft: 'none' }}>{c.oldQty ?? <span className="text-white/30">—</span>}</td>
                <td className="px-3.5 py-2.5 font-semibold" style={{ ...s, borderLeft: 'none' }}>
                  {c.newQty ?? <span className="text-red-400 font-bold">Removed</span>}
                </td>
                <td className="px-3.5 py-2.5 text-[11px] font-semibold" style={{ ...s, borderLeft: 'none' }}>
                  {CHANGE_LABEL[c.changeType]}
                </td>
              </tr>
            );
          })
        )}
      </DiffTable>
    );
  }

  return null;
};

const fmt = (val) => {
  if (val == null) return '—';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
};

export default ECODiff;
