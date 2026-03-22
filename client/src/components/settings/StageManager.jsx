import { useState, useEffect } from 'react';
import { getStages, createStage, updateStage, deleteStage } from '../../api/settings';
import Button from '../common/Button';
import Modal from '../common/Modal';

/**
 * StageManager — admin UI for ECO stage CRUD.
 * Dark glass theme adaptation.
 */
const StageManager = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', order: 1, requiresApproval: false, isFinal: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getStages().then((r) => setStages(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name: '', order: (stages.length + 1), requiresApproval: false, isFinal: false });
    setEditing(null);
    setModal('add');
  };

  const openEdit = (stage) => {
    setForm({ name: stage.name, order: stage.order, requiresApproval: stage.requiresApproval, isFinal: stage.isFinal });
    setEditing(stage);
    setModal('edit');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (modal === 'add') {
        await createStage(form);
      } else {
        await updateStage(editing._id, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stage?')) return;
    await deleteStage(id);
    load();
  };

  const inputClass = "w-full border border-white/[0.15] bg-white/[0.04] text-white placeholder-white/30 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-semibold text-white/90">ECO Stages</h3>
        <Button size="sm" onClick={openAdd}>+ Add Stage</Button>
      </div>

      {loading ? (
        <div className="h-20 flex items-center justify-center text-white/40 text-[13px]">Loading…</div>
      ) : (
        <div className="space-y-2">
          {stages.map((stage) => (
            <div key={stage._id} className="glass-card px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-white/[0.08] text-[#90E0EF] rounded-full flex items-center justify-center font-bold text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                {stage.order}
              </div>
              <div className="flex-1">
                <p className="m-0 font-semibold text-white/90 text-[13px]">{stage.name}</p>
                <div className="flex gap-3 mt-1">
                  {stage.requiresApproval && <span className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium">Requires Approval</span>}
                  {stage.isFinal && <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">Final Stage</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(stage)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(stage._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Stage' : 'Edit Stage'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded m-0">{error}</p>}
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1">Stage Name *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required
              className={inputClass}
              placeholder="e.g. QA Review"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1">Order *</label>
            <input type="number" min="1" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} required
              className={inputClass}
            />
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.requiresApproval}
                onChange={(e) => setForm((p) => ({ ...p, requiresApproval: e.target.checked }))}
                className="w-4 h-4 text-[#00B4D8] border-white/[0.15] bg-white/[0.04] rounded focus:ring-[#00B4D8]" />
              <span className="text-[13px] text-white/80">Requires Approval</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.isFinal}
                onChange={(e) => setForm((p) => ({ ...p, isFinal: e.target.checked }))}
                className="w-4 h-4 text-[#00B4D8] border-white/[0.15] bg-white/[0.04] rounded focus:ring-[#00B4D8]" />
              <span className="text-[13px] text-white/80">Final Stage (triggers ECO apply)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
            <Button type="submit" loading={saving}>Save Stage</Button>
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StageManager;
