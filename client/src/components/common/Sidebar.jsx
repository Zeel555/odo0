import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { getRoleConfig } from '../../utils/roleConfig';

/* ── Role-based nav sections ────────────────────────────────── */
const getNavSections = (role) => {
  const base = [
    { label: 'Main', items: [{ label: 'Dashboard', to: '/dashboard', icon: DashIcon }] },
  ];

  const products = { label: 'Products', to: '/products', icon: ProductIcon };
  const bom      = { label: 'Bill of Materials', to: '/bom', icon: BOMIcon };
  const eco      = { label: 'Change Orders', to: '/eco', icon: ECOIcon };
  const reports  = { label: 'Reports', to: '/reports', icon: ReportIcon };
  const members  = { label: 'Members', to: '/members', icon: MembersIcon };
  const settings = { label: 'Settings', to: '/settings', icon: SettingsIcon };

  switch (role) {
    case 'engineering':
      return [
        ...base,
        { label: 'Master Data',    items: [products, bom] },
        { label: 'Change Control', items: [eco, reports] },
      ];
    case 'approver':
      return [
        ...base,
        { label: 'Change Control', items: [eco, reports] },
      ];
    case 'operations':
      return [
        ...base,
        { label: 'Master Data', items: [products, bom] },
      ];
    case 'admin':
    default:
      return [
        ...base,
        { label: 'Master Data',    items: [products, bom] },
        { label: 'Change Control', items: [eco, reports] },
        { label: 'Admin',          items: [members, settings] },
      ];
  }
};

/* ── Sidebar ─────────────────────────────────────────────────── */
const Sidebar = () => {
  const { currentUser, currentCompany } = useAuth();
  const { collapsed, toggleSidebar, mobileOpen, closeMobile, setHovered, isExpanded } = useSidebar();
  const location = useLocation();
  const role     = currentUser?.role;
  const cfg      = getRoleConfig(role);
  const initials = (currentUser?.name || 'U').charAt(0).toUpperCase();
  const sections = getNavSections(role);

  const showLabels = isExpanded;
  const sidebarWidth = isExpanded ? 'w-[220px]' : 'w-16';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop md:hidden" onClick={closeMobile} />
      )}

      <aside
        onMouseEnter={() => { if (collapsed) setHovered(true); }}
        onMouseLeave={() => setHovered(false)}
        className={`
          fixed left-0 top-0 h-screen
          bg-white/[0.06] backdrop-blur-xl border-r border-white/[0.1]
          flex flex-col z-50 sidebar-transition
          ${sidebarWidth}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo + Pin toggle */}
        <div className="px-3 pt-4 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-lg bg-white/[0.08] border border-white/[0.12]
                            flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="#00B4D8" strokeWidth="1.4"/>
                <rect x="8.5" y="1" width="4.5" height="4.5" rx="1" stroke="#48CAE4" strokeWidth="1.4"/>
                <rect x="1" y="8.5" width="4.5" height="4.5" rx="1" stroke="#48CAE4" strokeWidth="1.4"/>
                <rect x="8.5" y="8.5" width="4.5" height="4.5" rx="1" stroke="#90E0EF" strokeWidth="1.4"/>
              </svg>
            </div>
            {showLabels && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white m-0 leading-tight">RevoraX</p>
                <p className="text-[10px] text-white/40 m-0 mt-0.5 truncate">
                  {currentCompany?.name || 'Lifecycle Manager'}
                </p>
              </div>
            )}
            {showLabels && (
              <button
                onClick={toggleSidebar}
                className="hidden md:flex w-6 h-6 items-center justify-center rounded-md
                           hover:bg-white/[0.1] transition-colors flex-shrink-0"
                title={collapsed ? 'Pin sidebar open' : 'Unpin sidebar'}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#90E0EF" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  {collapsed ? (
                    <path d="M7 2v4M4 6h6l1 3H3l1-3zM5 9v3M9 9v3"/>
                  ) : (
                    <path d="M9 3L5 7l4 4"/>
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.label} className="mb-1">
              {showLabels && (
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider
                              px-2 pt-2 pb-0.5 m-0">
                  {section.label}
                </p>
              )}
              {section.items.map(({ label, to, icon: Icon }) => {
                const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeMobile}
                    className="nav-item group"
                    title={!showLabels ? label : undefined}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className={`
                      flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg mb-0.5
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-white/[0.12] text-white font-medium'
                        : 'text-white/60 hover:bg-white/[0.07] hover:text-white/90'
                      }
                      ${!showLabels ? 'justify-center px-0' : ''}
                    `}>
                      <Icon color={isActive ? '#00B4D8' : '#90E0EF'} />
                      {showLabels && <span className="text-[13px] whitespace-nowrap">{label}</span>}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user block */}
        <div className="px-3 py-2.5 border-t border-white/[0.08]">
          <div className={`flex items-center ${!showLabels ? 'justify-center' : 'gap-2'}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${cfg.accent}33`, border: `1.5px solid ${cfg.accent}55` }}
            >
              <span className="text-[10px] font-bold" style={{ color: cfg.accent }}>{initials}</span>
            </div>
            {showLabels && (
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-medium text-white/90 m-0 truncate">{currentUser?.name}</p>
                <p className="text-[10px] m-0 capitalize font-semibold" style={{ color: cfg.accent }}>{cfg.label}</p>
              </div>
            )}
            {showLabels && (
              <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: cfg.accent }} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

/* ── Inline SVG Icon Components ─────────────────────────────── */
const iconProps = { width: 16, height: 16, fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

function DashIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
    <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
  </svg>;
}
function ProductIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <path d="M8 1l6 3v7l-6 3-6-3V4z"/><path d="M8 1v13M2 4l6 3 6-3"/>
  </svg>;
}
function BOMIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <path d="M3 4h10M3 8h7M3 12h5"/><circle cx="13" cy="11.5" r="2.5"/>
  </svg>;
}
function ECOIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
    <path d="M6 6h4M6 9h3"/>
  </svg>;
}
function ReportIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <path d="M2 12l3-4 3 2 3-5 3 3"/>
    <rect x="1" y="1" width="14" height="14" rx="2"/>
  </svg>;
}
function MembersIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <circle cx="5" cy="5" r="3"/><path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
    <circle cx="11.5" cy="5" r="2"/><path d="M14 13c0-1.7-1.1-3-2.5-3"/>
  </svg>;
}
function SettingsIcon({ color = 'currentColor' }) {
  return <svg {...iconProps} viewBox="0 0 16 16" stroke={color}>
    <circle cx="8" cy="8" r="2.5"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/>
  </svg>;
}

export default Sidebar;
