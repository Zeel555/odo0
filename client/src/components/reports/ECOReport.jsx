import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getECOReport } from '../../api/reports';
import Table from '../common/Table';
import { StatusBadge, Badge } from '../common/Badge';
import Modal from '../common/Modal';
import ECODiff from '../eco/ECODiff';
import { formatDate } from '../../utils/formatDate';
import { ECO_TYPES } from '../../utils/constants';

/** ECOReport — table of all ECOs with clickable Changes modal with dark glass theme. */
const ECOReport = () => {
  const [ecos, setEcos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedECO, setSelectedECO] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getECOReport().then((r) => setEcos(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center text-white/50 text-[13px]">Loading…</div>;

  return (
    <>
      <div className="space-y-4">
        <h3 className="m-0 text-[13px] font-semibold text-white/90">ECO Summary Report</h3>
        <div className="glass-card overflow-hidden">
          <Table headers={['Title', 'Type', 'Product', 'Stage', 'Status', 'Created By', 'Date', 'Changes']}>
            {ecos.map((e) => (
              <Table.Row key={e._id} onClick={() => navigate(`/eco/${e._id}`)}>
                <Table.Cell><span className="font-medium text-white/90">{e.title}</span></Table.Cell>
                <Table.Cell><Badge color={e.ecoType === ECO_TYPES.BOM ? 'purple' : 'teal'}>{e.ecoType}</Badge></Table.Cell>
                <Table.Cell><span className="text-white/80">{e.product?.name || '—'}</span></Table.Cell>
                <Table.Cell className="text-[#90E0EF] font-medium">{e.stage}</Table.Cell>
                <Table.Cell><StatusBadge status={e.status} /></Table.Cell>
                <Table.Cell className="text-xs text-white/50">{e.user?.name || '—'}</Table.Cell>
                <Table.Cell className="text-xs text-white/40">{formatDate(e.createdAt)}</Table.Cell>
                <Table.Cell>
                  <button onClick={(ev) => { ev.stopPropagation(); setSelectedECO(e); }}
                    className="bg-transparent border-none cursor-pointer text-[13px] text-[#00B4D8] hover:text-[#90E0EF] hover:underline font-medium p-0 transition-colors">View Diff</button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        </div>
      </div>

      {/* Diff Modal */}
      <Modal isOpen={!!selectedECO} onClose={() => setSelectedECO(null)} title={selectedECO?.title} size="lg">
        {selectedECO && (
          <ECODiff
            ecoType={selectedECO.ecoType}
            currentRecord={selectedECO.ecoType === ECO_TYPES.BOM ? selectedECO.bom : selectedECO.product}
            proposedChanges={selectedECO.proposedChanges}
          />
        )}
      </Modal>
    </>
  );
};

export default ECOReport;
