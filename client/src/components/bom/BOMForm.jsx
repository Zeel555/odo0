import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../common/Button';
import { useBOM } from '../../hooks/useBOM';
import { useProducts } from '../../hooks/useProducts';

/**
 * BOMForm — glassmorphism dark theme adaptation.
 */
const BOMForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchBOMById, createBOM, updateBOM } = useBOM();
  const { products, fetchProducts } = useProducts();
  const isEdit = Boolean(id);

  const [productId, setProductId] = useState('');
  const [components, setComponents] = useState([{ product: '', quantity: 1 }]);
  const [operations, setOperations] = useState([{ name: '', duration: 0, workCenter: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchBOMById(id).then((bom) => {
        if (bom) {
          setProductId(bom.product?._id || bom.product || '');
          setComponents(bom.components.length ? bom.components.map((c) => ({
            product: c.product?._id || c.product,
            quantity: c.quantity,
          })) : [{ product: '', quantity: 1 }]);
          setOperations(bom.operations.length ? bom.operations : [{ name: '', duration: 0, workCenter: '' }]);
        }
      });
    }
  }, [id]);

  const addComponent = () => setComponents((prev) => [...prev, { product: '', quantity: 1 }]);
  const removeComponent = (i) => setComponents((prev) => prev.filter((_, idx) => idx !== i));
  const updateComponent = (i, key, val) => setComponents((prev) => {
    const next = [...prev]; next[i] = { ...next[i], [key]: val }; return next;
  });

  const addOperation = () => setOperations((prev) => [...prev, { name: '', duration: 0, workCenter: '' }]);
  const removeOperation = (i) => setOperations((prev) => prev.filter((_, idx) => idx !== i));
  const updateOperation = (i, key, val) => setOperations((prev) => {
    const next = [...prev]; next[i] = { ...next[i], [key]: val }; return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const validComponents = components.filter((c) => c.product);
      const validOperations = operations.filter((o) => o.name.trim());
      const data = { product: productId, components: validComponents, operations: validOperations };
      if (isEdit) {
        await updateBOM(id, { components: validComponents, operations: validOperations });
      } else {
        await createBOM(data);
      }
      navigate('/bom');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const activeProducts = products.filter((p) => p.status === 'Active');

  const inputClass = "w-full border border-white/[0.15] bg-white/[0.04] text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";
  const selectClass = "w-full border border-white/[0.15] bg-[#0a0e27] text-white rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";
  const labelClass = "block text-[11px] font-semibold text-[#90E0EF]/80 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-lg text-white/50 hover:text-white transition-colors">←</button>
        <h2 className="m-0 text-base font-semibold text-white/90">{isEdit ? 'Edit BOM' : 'New Bill of Materials'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg m-0">{error}</p>}

        {/* Product */}
        {!isEdit && (
          <div className="glass-card p-5">
            <label className={labelClass}>Parent Product *</label>
            <select
              value={productId} onChange={(e) => setProductId(e.target.value)} required
              className={selectClass}
            >
              <option value="">Select product…</option>
              {activeProducts.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.version})</option>
              ))}
            </select>
          </div>
        )}

        {/* Components */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="m-0 text-[13px] font-semibold text-white/90">Components</h3>
            <Button type="button" size="sm" variant="secondary" onClick={addComponent}>+ Add Component</Button>
          </div>
          <div className="space-y-3">
            {components.map((comp, i) => (
              <div key={i} className="flex gap-2.5 items-center">
                <select
                  value={comp.product}
                  onChange={(e) => updateComponent(i, 'product', e.target.value)}
                  className={`flex-1 ${selectClass}`}
                >
                  <option value="">Select component…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.version})</option>
                  ))}
                </select>
                <input
                  type="number" min="0" step="1"
                  value={comp.quantity}
                  onChange={(e) => updateComponent(i, 'quantity', Number(e.target.value))}
                  className={`w-28 ${inputClass}`}
                  placeholder="Qty"
                />
                <button type="button" onClick={() => removeComponent(i)}
                  className="bg-transparent border-none cursor-pointer text-red-400 hover:text-red-300 px-2 text-lg transition-colors">×</button>
              </div>
            ))}
            {components.length === 0 && <p className="m-0 text-[13px] text-white/40">No components added.</p>}
          </div>
        </div>

        {/* Operations */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="m-0 text-[13px] font-semibold text-white/90">Operations</h3>
            <Button type="button" size="sm" variant="secondary" onClick={addOperation}>+ Add Operation</Button>
          </div>
          <div className="space-y-3">
            {operations.map((op, i) => (
              <div key={i} className="flex gap-2.5 items-center">
                <input
                  value={op.name} onChange={(e) => updateOperation(i, 'name', e.target.value)}
                  placeholder="Operation name"
                  className={`flex-1 ${inputClass}`}
                />
                <input
                  type="number" min="0" value={op.duration}
                  onChange={(e) => updateOperation(i, 'duration', Number(e.target.value))}
                  placeholder="Mins"
                  className={`w-24 ${inputClass}`}
                />
                <input
                  value={op.workCenter} onChange={(e) => updateOperation(i, 'workCenter', e.target.value)}
                  placeholder="Work center"
                  className={`flex-1 ${inputClass}`}
                />
                <button type="button" onClick={() => removeOperation(i)}
                  className="bg-transparent border-none cursor-pointer text-red-400 hover:text-red-300 px-2 text-lg transition-colors">×</button>
              </div>
            ))}
            {operations.length === 0 && <p className="m-0 text-[13px] text-white/40">No operations added.</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{isEdit ? 'Save Changes' : 'Create BOM'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default BOMForm;
