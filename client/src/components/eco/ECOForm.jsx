import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../common/Button';
import { useECO } from '../../hooks/useECO';
import { useProducts } from '../../hooks/useProducts';
import { useBOM } from '../../hooks/useBOM';
import { ECO_TYPES } from '../../utils/constants';

/**
 * ECOForm — create/edit ECO with dynamic proposedChanges section.
 * Product ECO: shows field inputs. BoM ECO: shows component/operation editor.
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

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit ECO' : 'New Engineering Change Order'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Basic Info</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Increase screw quantity in BOM v1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ECO Type *</label>
              <select value={form.ecoType} onChange={(e) => setField('ecoType', e.target.value)} disabled={isEdit}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                {Object.values(ECO_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
              <input type="date" value={form.effectiveDate} onChange={(e) => setField('effectiveDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select value={form.product} onChange={(e) => { setField('product', e.target.value); setField('bom', ''); }} required disabled={isEdit}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Select product…</option>
              {products.filter((p) => p.status === 'Active').map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.version})</option>
              ))}
            </select>
          </div>

          {form.ecoType === ECO_TYPES.BOM && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BOM *</label>
              <select value={form.bom} onChange={(e) => setField('bom', e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Select BOM…</option>
                {selectedProductBOMs.map((b) => (
                  <option key={b._id} value={b._id}>BOM {b.version}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input type="checkbox" id="versionUpdate" checked={form.versionUpdate}
              onChange={(e) => setField('versionUpdate', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="versionUpdate" className="text-sm font-medium text-gray-700">
              Create new version on apply (otherwise patch in-place)
            </label>
          </div>

          <FieldInput
            label="ECO attachment URLs (comma-separated, optional)"
            value={ecoAttachments}
            onChange={setEcoAttachments}
            placeholder="https://..., spec.pdf"
          />
        </div>

        {/* Proposed Changes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Proposed Changes</h3>

          {form.ecoType === ECO_TYPES.PRODUCT ? (
            <div className="space-y-3">
              <FieldInput label="New Name" value={proposedP.name} onChange={(v) => setProposedP((p) => ({ ...p, name: v }))} placeholder="Leave blank to keep current" />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="New Sale Price" type="number" value={proposedP.salePrice} onChange={(v) => setProposedP((p) => ({ ...p, salePrice: v }))} placeholder="e.g. 1099" />
                <FieldInput label="New Cost Price" type="number" value={proposedP.costPrice} onChange={(v) => setProposedP((p) => ({ ...p, costPrice: v }))} placeholder="e.g. 550" />
              </div>
              <FieldInput label="New Attachments (comma-separated)" value={proposedP.attachments} onChange={(v) => setProposedP((p) => ({ ...p, attachments: v }))} placeholder="file1.pdf, spec.docx" />
            </div>
          ) : (
            <BOMProposedEditor
              products={products}
              components={proposedComponents}
              setComponents={setProposedComponents}
              operations={proposedOperations}
              setOperations={setProposedOperations}
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

const FieldInput = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
    />
  </div>
);

const BOMProposedEditor = ({ products, components, setComponents, operations, setOperations }) => {
  const addComp = () => setComponents((p) => [...p, { product: '', quantity: 1 }]);
  const removeComp = (i) => setComponents((p) => p.filter((_, idx) => idx !== i));
  const updateComp = (i, k, v) => setComponents((p) => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });

  const addOp = () => setOperations((p) => [...p, { name: '', duration: 0, workCenter: '' }]);
  const removeOp = (i) => setOperations((p) => p.filter((_, idx) => idx !== i));
  const updateOp = (i, k, v) => setOperations((p) => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">Components</p>
          <button type="button" onClick={addComp} className="text-xs text-indigo-600 hover:underline">+ Add</button>
        </div>
        {components.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select value={c.product} onChange={(e) => updateComp(i, 'product', e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">Select component…</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.version})</option>)}
            </select>
            <input type="number" min="0" value={c.quantity} onChange={(e) => updateComp(i, 'quantity', Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Qty" />
            <button type="button" onClick={() => removeComp(i)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">Operations</p>
          <button type="button" onClick={addOp} className="text-xs text-indigo-600 hover:underline">+ Add</button>
        </div>
        {operations.map((o, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={o.name} onChange={(e) => updateOp(i, 'name', e.target.value)} placeholder="Operation name"
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <input type="number" min="0" value={o.duration} onChange={(e) => updateOp(i, 'duration', Number(e.target.value))} placeholder="Mins"
              className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <input value={o.workCenter} onChange={(e) => updateOp(i, 'workCenter', e.target.value)} placeholder="Work center"
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            <button type="button" onClick={() => removeOp(i)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ECOForm;
