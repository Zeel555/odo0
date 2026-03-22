import { useEffect, useState } from 'react';
import { getArchived } from '../../api/reports';
import Table from '../common/Table';
import { formatDate } from '../../utils/formatDate';

/** ArchivedProducts — lists all archived products and BOMs with glass-card dark styling. */
const ArchivedProducts = () => {
  const [data, setData] = useState({ products: [], boms: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArchived().then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center text-white/50 text-[13px]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="m-0 text-[13px] font-semibold text-white/90 mb-4">Archived Products ({data.products.length})</h3>
        <Table headers={['Name', 'Version', 'Sale Price', 'Cost Price', 'Archived On']}>
          {data.products.map((p) => (
            <Table.Row key={p._id}>
              <Table.Cell><span className="font-medium text-white/90">{p.name}</span></Table.Cell>
              <Table.Cell><span className="font-mono text-[11px] bg-red-500/10 border border-red-500/20 text-red-300 px-1.5 py-0.5 rounded">{p.version}</span></Table.Cell>
              <Table.Cell>${p.salePrice?.toLocaleString()}</Table.Cell>
              <Table.Cell>${p.costPrice?.toLocaleString()}</Table.Cell>
              <Table.Cell><span className="text-white/40">{formatDate(p.updatedAt)}</span></Table.Cell>
            </Table.Row>
          ))}
        </Table>
      </div>

      <div className="glass-card p-5">
        <h3 className="m-0 text-[13px] font-semibold text-white/90 mb-4">Archived BOMs ({data.boms.length})</h3>
        <Table headers={['Product', 'BOM Version', 'Components', 'Archived On']}>
          {data.boms.map((b) => (
            <Table.Row key={b._id}>
              <Table.Cell><span className="text-white/90">{b.product?.name || '—'}</span></Table.Cell>
              <Table.Cell><span className="font-mono text-[11px] bg-red-500/10 border border-red-500/20 text-red-300 px-1.5 py-0.5 rounded">{b.version}</span></Table.Cell>
              <Table.Cell>{b.components?.length ?? 0}</Table.Cell>
              <Table.Cell><span className="text-white/40">{formatDate(b.updatedAt)}</span></Table.Cell>
            </Table.Row>
          ))}
        </Table>
      </div>
    </div>
  );
};

export default ArchivedProducts;
