import { useState, useEffect } from 'react';
import { getRules, createRule, deleteRule, getStages } from '../../api/settings';
import { ROLES } from '../../utils/constants';
import Button from '../common/Button';
import Table from '../common/Table';
import { Badge } from '../common/Badge';

/**
 * ApprovalRuleManager — admin UI to map stages → approver roles with glass dark theme.
 */
const ApprovalRuleManager = () => {
  const [rules, setRules] = useState([]);
  const [stages, setStages] = useState([]);
  const [form, setForm] = useState({ stage: '', approverRole: ROLES.APPROVER });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [rulesRes, stagesRes] = await Promise.all([getRules(), getStages()]);
    setRules(rulesRes.data);
    setStages(stagesRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.stage || !form.approverRole) return;
    setSaving(true);
    try {
      await createRule(form);
      await load();
      setForm({ stage: form.stage, approverRole: ROLES.APPROVER });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    await deleteRule(id);
    await load();
  };

  const selectClass = "w-full border border-white/[0.15] bg-[#0a0e27] text-white rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";

  return (
    <div className="space-y-6">
      <h3 className="m-0 text-[13px] font-semibold text-white/90">Approval Rules</h3>

      {/* Add form */}
      <form onSubmit={handleAdd} className="glass-card p-5">
        <p className="m-0 mb-4 text-[13px] font-semibold text-[#90E0EF]">Add Rule</p>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">Stage</label>
            <select value={form.stage} onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))} required
              className={selectClass}>
              <option value="">Select stage…</option>
              {stages.filter((s) => s.requiresApproval).map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5">Approver Role</label>
            <select value={form.approverRole} onChange={(e) => setForm((p) => ({ ...p, approverRole: e.target.value }))}
              className={selectClass}>
              {Object.values(ROLES).filter((r) => r !== ROLES.OPERATIONS).map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={saving}>Add Rule</Button>
        </div>
      </form>

      {/* Rules table */}
      {loading ? (
        <div className="h-20 flex items-center justify-center text-white/40 text-[13px]">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table headers={['Stage', 'Approver Role', 'Actions']}>
            {rules.length === 0 ? (
              <Table.Row><Table.Cell className="text-center text-white/40 py-6">No rules configured.</Table.Cell></Table.Row>
            ) : (
              rules.map((rule) => (
                <Table.Row key={rule._id}>
                  <Table.Cell><span className="font-medium text-white/90">{rule.stage}</span></Table.Cell>
                  <Table.Cell><Badge color="amber" className="capitalize">{rule.approverRole}</Badge></Table.Cell>
                  <Table.Cell>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(rule._id)}>Delete</Button>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table>
        </div>
      )}
    </div>
  );
};

export default ApprovalRuleManager;
