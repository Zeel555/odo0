import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

const roleColors = {
  admin:       { bg: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: 'rgba(124,58,237,0.3)' },
  engineering: { bg: 'rgba(0,180,216,0.2)', color: '#67E8F9', border: 'rgba(0,180,216,0.3)' },
  approver:    { bg: 'rgba(217,119,6,0.2)', color: '#FCD34D', border: 'rgba(217,119,6,0.3)' },
  operations:  { bg: 'rgba(5,150,105,0.2)', color: '#6EE7B7', border: 'rgba(5,150,105,0.3)' },
};

const Topbar = ({ title = '' }) => {
  const { currentUser, logout } = useAuth();
  const { collapsed, openMobile } = useSidebar();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const rStyle = roleColors[role] || { bg: 'rgba(0,180,216,0.2)', color: '#67E8F9', border: 'rgba(0,180,216,0.3)' };
  const initials = (currentUser?.name || 'U').charAt(0).toUpperCase();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header
      className="fixed top-0 right-0 h-14
                 bg-white/[0.05] backdrop-blur-xl border-b border-white/[0.08]
                 flex items-center px-4 md:px-6 z-20 content-transition"
      style={{ left: collapsed ? 64 : 220 }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={openMobile}
        className="md:hidden mr-3 p-1.5 rounded-lg hover:bg-white/[0.1] transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#90E0EF" strokeWidth="2"
             strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14"/>
        </svg>
      </button>

      {/* Left: title + breadcrumb */}
      <div className="flex-1 min-w-0">
        <p className="m-0 text-base font-semibold text-white/90 leading-tight">{title}</p>
        <p className="m-0 text-[11px] text-white/30 leading-none mt-0.5">
          RevoraX / {title}
        </p>
      </div>

      {/* Right: role badge, user, logout */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span
          className="text-[11px] font-medium px-2.5 py-[3px] rounded-full capitalize hidden sm:inline-block"
          style={{ background: rStyle.bg, color: rStyle.color, border: `1px solid ${rStyle.border}` }}
        >
          {role}
        </span>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/[0.1] border border-white/[0.15]
                          flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-white/80">{initials}</span>
          </div>
          <span className="text-[13px] font-medium text-white/80 hidden sm:block">
            {currentUser?.name}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-xs font-medium text-white/40 px-2 py-1 rounded-md
                     hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
