import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../common/Button';
import { useECO } from '../../hooks/useECO';
import { useProducts } from '../../hooks/useProducts';
import { useBOM } from '../../hooks/useBOM';
import { ECO_TYPES } from '../../utils/constants';

/**
 * ECOForm — glassmorphism dark theme adaptation.
 */
const ECOForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchECOById, createECO, updateECO } = useECO();
  const { products, fetchProducts } = useProducts();
  const { boms, fetchBOMs, fetchBOMById } = useBOM();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '', ecoType: ECO_TYPES.PRODUCT, product: '',
    bom: '', effectiveDate: '', versionUpdate: true,
  });
  const [proposedP, setProposedP] = useState({ name: '', salePrice: '', costPrice: '', attachments: '' });
  const [proposedComponents, setProposedComponents] = useState([{ product: '', quantity: 1 }]);
  const [proposedOperations, setProposedOperations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ecoAttachments, setEcoAttachments] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchBOMs();
    if (isEdit) {
      fetchECOById(id).then((eco) => {
        if (!eco) return;
        setForm({
          title: eco.title || '',
          ecoType: eco.ecoType || ECO_TYPES.PRODUCT,
          product: eco.product?._id || eco.product || '',
          bom: eco.bom?._id || eco.bom || '',
          effectiveDate: eco.effectiveDate ? eco.effectiveDate.split('T')[0] : '',
          versionUpdate: eco.versionUpdate ?? true,
        });
        const pc = eco.proposedChanges || {};
        if (eco.ecoType === ECO_TYPES.PRODUCT) {
          setProposedP({
            name: pc.name ?? '',
            salePrice: pc.salePrice ?? '',
            costPrice: pc.costPrice ?? '',
            attachments: (pc.attachments || []).join(', '),
          });
        } else {
          setProposedComponents(pc.components?.length ? pc.components : [{ product: '', quantity: 1 }]);
          setProposedOperations(pc.operations || []);
        }
        setEcoAttachments((eco.attachmentUrls || []).join(', '));
      });
    }
  }, [id]);

  /** Prefill from ?productId= & ?bomId= (master data changes go through ECO only) */
  useEffect(() => {
    if (isEdit) return;
    const productId = searchParams.get('productId');
    const bomId = searchParams.get('bomId');
    const ecoTypeParam = searchParams.get('ecoType');
    if (bomId) {
      fetchBOMById(bomId).then((bom) => {
        if (!bom) return;
        const pid = bom.product?._id || bom.product;
        setForm((f) => ({
          ...f,
          ecoType: ECO_TYPES.BOM,
          product: String(pid),
          bom: bomId,
        }));
      });
    } else if (productId) {
      setForm((f) => ({
        ...f,
        product: productId,
        ecoType: ecoTypeParam === ECO_TYPES.BOM ? ECO_TYPES.BOM : ECO_TYPES.PRODUCT,
      }));
    }
  }, [isEdit, searchParams, fetchBOMById]);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const buildProposedChanges = () => {
    if (form.ecoType === ECO_TYPES.PRODUCT) {
      const p = {};
      if (proposedP.name.trim()) p.name = proposedP.name.trim();
      if (proposedP.salePrice !== '') p.salePrice = parseFloat(proposedP.salePrice);
      if (proposedP.costPrice !== '') p.costPrice = parseFloat(proposedP.costPrice);
      if (proposedP.attachments) p.attachments = proposedP.attachments.split(',').map((s) => s.trim()).filter(Boolean);
      return p;
    } else {
      return {
        components: proposedComponents.filter((c) => c.product),
        operations: proposedOperations.filter((o) => o.name?.trim()),
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const attachmentUrls = ecoAttachments.split(',').map((s) => s.trim()).filter(Boolean);
      const data = {
        ...form,
        versionUpdate: form.versionUpdate,
        proposedChanges: buildProposedChanges(),
        attachmentUrls,
      };
      if (isEdit) {
        await updateECO(id, {
          title: form.title,
          effectiveDate: form.effectiveDate,
          versionUpdate: form.versionUpdate,
          bom: form.bom || undefined,
          proposedChanges: buildProposedChanges(),
          attachmentUrls,
        });
      } else {
        await createECO(data);
      }
      navigate('/eco');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedProductBOMs = boms.filter((b) => {
    const pid = form.product;
    return pid && (b.product?._id === pid || b.product === pid) && b.status === 'Active';
  });

  const inputClass = "w-full border border-white/[0.15] bg-white/[0.04] text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";
  const selectClass = "w-full border border-white/[0.15] bg-[#0a0e27] text-white rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";
  const labelClass = "block text-[11px] font-semibold text-[#90E0EF]/80 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-lg text-white/50 hover:text-white transition-colors">←</button>
        <h2 className="m-0 text-base font-semibold text-white/90">{isEdit ? 'Edit ECO' : 'New Engineering Change Order'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg m-0">{error}</p>}

        {/* Basic Info */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="m-0 text-[13px] font-semibold text-white/90">Basic Info</h3>

          <div>
            <label className={labelClass}>Title *</label>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} required
              className={inputClass}
              placeholder="e.g. Increase screw quantity in BOM v1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ECO Type *</label>
              <select value={form.ecoType} onChange={(e) => setField('ecoType', e.target.value)} disabled={isEdit}
                className={selectClass}>
                {Object.values(ECO_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Effective Date</label>
              <input type="date" value={form.effectiveDate} onChange={(e) => setField('effectiveDate', e.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Product *</label>
            <select value={form.product} onChange={(e) => { setField('product', e.target.value); setField('bom', ''); }} required disabled={isEdit}
              className={selectClass}>
              <option value="">Select product…</option>
              {products.filter((p) => p.status === 'Active').map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.version})</option>
              ))}
            </select>
          </div>

          {form.ecoType === ECO_TYPES.BOM && (
            <div>
              <label className={labelClass}>BOM *</label>
              <select value={form.bom} onChange={(e) => setField('bom', e.target.value)} required
                className={selectClass}>
                <option value="">Select BOM…</option>
                {selectedProductBOMs.map((b) => (
                  <option key={b._id} value={b._id}>BOM {b.version}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="versionUpdate" checked={form.versionUpdate}
              onChange={(e) => setField('versionUpdate', e.target.checked)}
              className="w-4 h-4 text-[#00B4D8] border-white/[0.15] bg-white/[0.04] rounded focus:ring-[#00B4D8]"
            />
            <label htmlFor="versionUpdate" className="text-[13px] text-white/80 cursor-pointer">
              Create new version on apply (otherwise patch in-place)
            </label>
          </div>

          <div className="pt-2">
            <label className={labelClass}>ECO attachment URLs (comma-separated, optional)</label>
            <input value={ecoAttachments} onChange={(e) => setEcoAttachments(e.target.value)}
                   className={inputClass} placeholder="https://..., spec.pdf" />
          </div>
        </div>

        {/* Proposed Changes */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="m-0 text-[13px] font-semibold text-white/90">Proposed Changes</h3>

          {form.ecoType === ECO_TYPES.PRODUCT ? (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>New Name</label>
                <input value={proposedP.name} onChange={(e) => setProposedP((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Leave blank to keep current" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>New Sale Price</label>
                  <input type="number" value={proposedP.salePrice} onChange={(e) => setProposedP((p) => ({ ...p, salePrice: e.target.value }))} className={inputClass} placeholder="e.g. 1099" />
                </div>
                <div>
                  <label className={labelClass}>New Cost Price</label>
                  <input type="number" value={proposedP.costPrice} onChange={(e) => setProposedP((p) => ({ ...p, costPrice: e.target.value }))} className={inputClass} placeholder="e.g. 550" />
                </div>
              </div>
              <div>
                <label className={labelClass}>New Attachments (comma-separated)</label>
                <input value={proposedP.attachments} onChange={(e) => setProposedP((p) => ({ ...p, attachments: e.target.value }))} className={inputClass} placeholder="file1.pdf, spec.docx" />
              </div>
            </div>
          ) : (
            <BOMProposedEditor
              products={products}
              components={proposedComponents}
              setComponents={setProposedComponents}
              operations={proposedOperations}
              setOperations={setProposedOperations}
              inputClass={inputClass}
              selectClass={selectClass}
            />
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Save ECO' : 'Create ECO'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

const BOMProposedEditor = ({ products, components, setComponents, operations, setOperations, inputClass, selectClass }) => {
  const addComp = () => setComponents((p) => [...p, { product: '', quantity: 1 }]);
  const removeComp = (i) => setComponents((p) => p.filter((_, idx) => idx !== i));
  const updateComp = (i, k, v) => setComponents((p) => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });

  const addOp = () => setOperations((p) => [...p, { name: '', duration: 0, workCenter: '' }]);
  const removeOp = (i) => setOperations((p) => p.filter((_, idx) => idx !== i));
  const updateOp = (i, k, v) => setOperations((p) => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between mb-3 border-b border-white/[0.08] pb-2">
          <p className="m-0 text-[13px] font-semibold text-white/80">Components</p>
          <button type="button" onClick={addComp} className="bg-transparent border-none text-[13px] text-[#90E0EF] cursor-pointer hover:underline p-0">+ Add</button>
        </div>
        <div className="space-y-3">
          {components.map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <select value={c.product} onChange={(e) => updateComp(i, 'product', e.target.value)}
                className={`flex-1 ${selectClass}`}>
                <option value="">Select component…</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.version})</option>)}
              </select>
              <input type="number" min="0" value={c.quantity} onChange={(e) => updateComp(i, 'quantity', Number(e.target.value))}
                className={`w-24 ${inputClass}`} placeholder="Qty" />
              <button type="button" onClick={() => removeComp(i)} className="bg-transparent border-none text-red-400 hover:text-red-300 px-2 text-lg cursor-pointer">×</button>
            </div>
          ))}
          {components.length === 0 && <p className="m-0 text-[13px] text-white/40">No components added.</p>}
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-3 border-b border-white/[0.08] pb-2">
          <p className="m-0 text-[13px] font-semibold text-white/80">Operations</p>
          <button type="button" onClick={addOp} className="bg-transparent border-none text-[13px] text-[#90E0EF] cursor-pointer hover:underline p-0">+ Add</button>
        </div>
        <div className="space-y-3">
          {operations.map((o, i) => (
            <div key={i} className="flex gap-2.5">
              <input value={o.name} onChange={(e) => updateOp(i, 'name', e.target.value)} placeholder="Operation name"
                className={`flex-1 ${inputClass}`} />
              <input type="number" min="0" value={o.duration} onChange={(e) => updateOp(i, 'duration', Number(e.target.value))} placeholder="Mins"
                className={`w-20 ${inputClass}`} />
              <input value={o.workCenter} onChange={(e) => updateOp(i, 'workCenter', e.target.value)} placeholder="Work center"
                className={`flex-1 ${inputClass}`} />
              <button type="button" onClick={() => removeOp(i)} className="bg-transparent border-none text-red-400 hover:text-red-300 px-2 text-lg cursor-pointer">×</button>
            </div>
          ))}
          {operations.length === 0 && <p className="m-0 text-[13px] text-white/40">No operations added.</p>}
        </div>
      </div>
    </div>
  );
};

export default ECOForm;
