import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../common/Button';
import { useProducts } from '../../hooks/useProducts';

/**
 * ProductForm — glassmorphism dark theme adaptation.
 */
const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProductById, createProduct, updateProduct, loading } = useProducts();

  const [form, setForm] = useState({
    name: '',
    salePrice: '',
    costPrice: '',
    attachments: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      fetchProductById(id).then((p) => {
        if (p) {
          setForm({
            name: p.name || '',
            salePrice: p.salePrice ?? '',
            costPrice: p.costPrice ?? '',
            attachments: (p.attachments || []).join(', '),
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        salePrice: parseFloat(form.salePrice),
        costPrice: parseFloat(form.costPrice),
        attachments: form.attachments ? form.attachments.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-white/[0.15] bg-white/[0.04] text-white placeholder-white/30 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]/30 transition-all";
  const labelClass = "block text-[11px] font-semibold text-[#90E0EF]/80 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-lg text-white/50 hover:text-white transition-colors">←</button>
        <h2 className="m-0 text-base font-semibold text-white/90">{isEdit ? 'Edit Product' : 'New Product'}</h2>
      </div>

      <div className="glass-card p-6 border-white/[0.2] bg-white/[0.04]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg m-0">{error}</p>}

          <div>
            <label className={labelClass}>Product Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              className={inputClass}
              placeholder="e.g. iPhone 17"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sale Price *</label>
              <input
                type="number" name="salePrice" value={form.salePrice} onChange={handleChange}
                required min="0" step="0.01"
                className={inputClass}
                placeholder="999.00"
              />
            </div>
            <div>
              <label className={labelClass}>Cost Price *</label>
              <input
                type="number" name="costPrice" value={form.costPrice} onChange={handleChange}
                required min="0" step="0.01"
                className={inputClass}
                placeholder="500.00"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Attachments</label>
            <input
              name="attachments" value={form.attachments} onChange={handleChange}
              className={inputClass}
              placeholder="file1.pdf, spec.docx (comma-separated)"
            />
            <p className="m-0 text-[11px] text-white/40 mt-1.5">Comma-separated list of file names or URLs</p>
          </div>

          {isEdit && (
            <div>
              <label className={labelClass}>Version</label>
              <p className="m-0 text-[13px] text-white/40">Auto-managed by ECO. Cannot be changed manually.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
            <Button type="submit" loading={saving}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
