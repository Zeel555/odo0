import { useEffect, useState } from 'react';
import { getAuditLog } from '../../api/reports';
import Table from '../common/Table';
import { Badge } from '../common/Badge';
import { formatDateTime } from '../../utils/formatDate';

const ACTION_COLORS = {
  ECO_CREATED:     'indigo',
  STAGE_TRANSITION:'amber',
  ECO_APPROVED:    'green',
  ECO_APPLIED:     'purple',
  VERSION_CREATED: 'blue',
  RECORD_ARCHIVED: 'red',
  PRODUCT_UPDATED: 'gray',
  BOM_UPDATED:     'gray',
};

/** AuditLog — filterable audit trail with glass-card dark styling. */
const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ model: '', action: '' });

  const loadLogs = () => {
    setLoading(true);
    const params = {};
    if (filter.model) params.model = filter.model;
    if (filter.action) params.action = filter.action;
    getAuditLog(params).then((r) => setLogs(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  const selectClass = "border border-white/[0.15] bg-[#0a0e27] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";

  return (
    <div className="space-y-4">
      <h3 className="m-0 text-[13px] font-semibold text-white/90">Audit Log</h3>

      {/* Filters */}
      <div className="glass-card p-4 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">Model</label>
          <select value={filter.model} onChange={(e) => setFilter((p) => ({ ...p, model: e.target.value }))}
            className={selectClass}>
            <option value="">All Models</option>
            <option>ECO</option><option>Product</option><option>BOM</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">Action</label>
          <select value={filter.action} onChange={(e) => setFilter((p) => ({ ...p, action: e.target.value }))}
            className={selectClass}>
            <option value="">All Actions</option>
            {['ECO_CREATED','STAGE_TRANSITION','ECO_APPROVED','ECO_APPLIED','VERSION_CREATED','RECORD_ARCHIVED','PRODUCT_UPDATED','BOM_UPDATED'].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <button onClick={loadLogs} className="px-4 py-2 bg-[#00B4D8] text-white font-medium text-sm rounded-lg hover:bg-[#0096B4] border-none cursor-pointer transition-colors shadow-sm">
          Apply
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-white/50 text-[13px]">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table headers={['Action', 'Model', 'Performed By', 'Timestamp']}>
            {logs.map((log) => (
              <Table.Row key={log._id}>
                <Table.Cell>
                  <Badge color={ACTION_COLORS[log.action] || 'gray'}>{log.action}</Badge>
                </Table.Cell>
                <Table.Cell><span className="text-white/70">{log.affectedModel}</span></Table.Cell>
                <Table.Cell>
                  <div>
                    <p className="m-0 text-[13px] font-medium text-white/90">{log.performedBy?.name || '—'}</p>
                    <p className="m-0 text-[11px] text-[#90E0EF] uppercase tracking-wide mt-0.5">{log.performedBy?.role}</p>
                  </div>
                </Table.Cell>
                <Table.Cell><span className="text-[11px] text-white/40">{formatDateTime(log.timestamp)}</span></Table.Cell>
              </Table.Row>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
