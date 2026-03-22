import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // collapsed = icons-only (default). Sidebar expands on hover.
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  // hovered = temporarily expanded via mouse hover
  const [hovered, setHovered] = useState(false);

  const toggleSidebar = () => setCollapsed(c => !c);
  const openMobile    = () => setMobileOpen(true);
  const closeMobile   = () => setMobileOpen(false);

  // The sidebar is visually expanded when either pinned open OR hovered
  const isExpanded = !collapsed || hovered;

  return (
    <SidebarContext.Provider value={{
      collapsed, toggleSidebar,
      mobileOpen, openMobile, closeMobile,
      hovered, setHovered,
      isExpanded,
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
