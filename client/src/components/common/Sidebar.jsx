import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canViewECO, canViewReports, canManageSettings, canViewSettings } from '../../utils/roleGuard';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: DashIcon },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { label: 'Products', to: '/products', icon: ProductIcon },
      { label: 'Bill of Materials', to: '/bom', icon: BOMIcon },
    ],
  },
  {
    label: 'Change Control',
    items: [
      { label: 'Change Orders', to: '/eco', icon: ECOIcon, guard: canViewECO },
      { label: 'Reports', to: '/reports', icon: ReportIcon, guard: canViewReports },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Members', to: '/members', icon: MembersIcon, guard: canViewSettings },
      { label: 'Settings', to: '/settings', icon: SettingsIcon, guard: canManageSettings },
    ],
  },
];

const Sidebar = () => {
  const { currentUser, currentCompany } = useAuth();
  const role = currentUser?.role;
  const initials = (currentUser?.name || 'U').charAt(0).toUpperCase();

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100vh', width: '220px',
      background: '#FFFFFF', borderRight: '1.5px solid #CAF0F8',
      display: 'flex', flexDirection: 'column', zIndex: 30,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #EAF6FB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon box */}
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#CAF0F8', border: '1.5px solid #90E0EF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="#0077B6" strokeWidth="1.4"/>
              <rect x="8.5" y="1" width="4.5" height="4.5" rx="1" stroke="#0077B6" strokeWidth="1.4"/>
              <rect x="1" y="8.5" width="4.5" height="4.5" rx="1" stroke="#0077B6" strokeWidth="1.4"/>
              <rect x="8.5" y="8.5" width="4.5" height="4.5" rx="1" stroke="#0077B6" strokeWidth="1.4"/>
            </svg>
          </div>
          {/* Brand text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#03045E', margin: 0, lineHeight: 1.2 }}>RevoraX</p>
            <p style={{ fontSize: 10, color: '#90E0EF', margin: 0, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentCompany?.name || 'Lifecycle Manager'}
            </p>
          </div>
          {/* Live dot */}
          <div className="live-dot" style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#00B4D8', flexShrink: 0,
          }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }} className="custom-scrollbar">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(({ guard }) => !guard || guard(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label} style={{ marginBottom: 4 }}>
              <p style={{
                fontSize: 10, fontWeight: 600, color: '#90E0EF',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '8px 8px 2px', margin: 0,
              }}>{section.label}</p>
              {visibleItems.map(({ label, to, icon: Icon }, idx) => (
                <NavLink
                  key={to}
                  to={to}
                  className="nav-item"
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 13, fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#03045E' : '#0077B6',
                    background: isActive ? '#CAF0F8' : 'transparent',
                    transition: 'background 0.18s, color 0.18s',
                    marginBottom: 1,
                    animationDelay: `${(idx + 1) * 0.04}s`,
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.dataset.active) {
                      e.currentTarget.style.background = '#EAF6FB';
                      e.currentTarget.style.color = '#03045E';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#0077B6';
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon color={isActive ? '#03045E' : '#0077B6'} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom user block */}
      <div style={{ padding: '10px 12px 16px', borderTop: '1px solid #EAF6FB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#CAF0F8', border: '1.5px solid #90E0EF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#0077B6' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11.5, fontWeight: 500, color: '#03045E', margin: 0, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</p>
            <p style={{ fontSize: 10, color: '#00B4D8', margin: 0, textTransform: 'capitalize' }}>{role}</p>
          </div>
        </div>
      </div>
    </aside>
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
