/**
 * Table — glass-card with dark theme styling.
 */
const Table = ({ headers = [], children, emptyMessage = 'No records found.' }) => (
  <div className="glass-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px] text-left">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.08] text-xs font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children || (
            <tr>
              <td colSpan={headers.length} className="px-[14px] py-10 text-center text-[13px] text-white/30">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

Table.Row = ({ children, onClick, className = '' }) => (
  <tr
    onClick={onClick}
    className={`group border-b border-white/[0.05] last:border-none transition-colors duration-150 ${onClick ? 'cursor-pointer hover:bg-white/[0.06]' : ''} ${className}`}
  >
    {children}
  </tr>
);

Table.Cell = ({ children, className = '' }) => (
  <td className={`px-3.5 py-2.5 text-[13px] text-white/80 transition-colors ${className}`}>
    {children}
  </td>
);

export default Table;
