/**
 * StatusBadge — color pill for document status.
 */
export const StatusBadge = ({ status }) => {
  const styles = {
    Active:   { background: '#CAF0F8', color: '#03045E', border: '1px solid #00B4D8' },
    Archived: { background: '#F1EFE8', color: '#5F5E5A', border: '1px solid #B4B2A9' },
    Open:     { background: '#CAF0F8', color: '#03045E', border: '1px solid #00B4D8' },
    Applied:  { background: '#EAF6FB', color: '#0077B6', border: '1px solid #0077B6' },
    Rejected: { background: '#FCEBEB', color: '#791F1F', border: '1px solid #A32D2D' },
    New:      { background: '#F0F9FF', color: '#90E0EF', border: '1px solid #CAF0F8' },
    Approval: { background: '#CAF0F8', color: '#03045E', border: '1px solid #00B4D8' },
    Done:     { background: '#EAF6FB', color: '#0077B6', border: '1px solid #0077B6' },
  };
  const s = styles[status] || { background: '#F0F9FF', color: '#90E0EF', border: '1px solid #CAF0F8' };
  return (
    <span style={{
      ...s,
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
    }}>
      {status}
    </span>
  );
};

/**
 * Badge — generic colored pill.
 * color: 'blue' | 'teal' | 'red' | 'amber' | 'gray' | 'indigo' | 'purple' | 'green'
 */
export const Badge = ({ children, color = 'gray' }) => {
  const styles = {
    blue:   { background: '#EAF6FB', color: '#0077B6', border: '1px solid #90E0EF' },
    indigo: { background: '#EAF6FB', color: '#0077B6', border: '1px solid #90E0EF' },
    teal:   { background: '#CAF0F8', color: '#03045E', border: '1px solid #00B4D8' },
    green:  { background: '#EAF3DE', color: '#27500A', border: '1px solid #3B6D11' },
    red:    { background: '#FCEBEB', color: '#791F1F', border: '1px solid #A32D2D' },
    amber:  { background: '#CAF0F8', color: '#03045E', border: '1px solid #00B4D8' },
    gray:   { background: '#F0F9FF', color: '#90E0EF', border: '1px solid #CAF0F8' },
    purple: { background: '#EAF6FB', color: '#0077B6', border: '1px solid #90E0EF' },
  };
  const s = styles[color] || styles.gray;
  return (
    <span style={{
      ...s,
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
    }}>
      {children}
    </span>
  );
};

export default StatusBadge;
