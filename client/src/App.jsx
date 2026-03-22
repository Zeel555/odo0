import { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import AuroraBackground from './components/ui/AuroraBackground';
import ToastProvider, { showToast } from './components/common/Toast';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateCompany from './pages/CreateCompany';
import InviteAccept from './pages/InviteAccept';
import Members from './pages/Members';

// Products
import ProductList from './components/products/ProductList';
import ProductForm from './components/products/ProductForm';
import ProductDetail from './components/products/ProductDetail';
import ProductVersionHistory from './components/products/ProductVersionHistory';

// BOM
import BOMList from './components/bom/BOMList';
import BOMForm from './components/bom/BOMForm';
import BOMDetail from './components/bom/BOMDetail';

// ECO
import ECOList from './components/eco/ECOList';
import ECOForm from './components/eco/ECOForm';
import ECODetail from './components/eco/ECODetail';

// Reports
import ECOReport from './components/reports/ECOReport';
import VersionMatrix from './components/reports/VersionMatrix';
import AuditLog from './components/reports/AuditLog';
import ArchivedProducts from './components/reports/ArchivedProducts';

// Settings
import StageManager from './components/settings/StageManager';
import ApprovalRuleManager from './components/settings/ApprovalRuleManager';

import {
  canViewSettings, canViewReports,
  canCreateProduct,
  canCreateBOM,
  canCreateECO, canEditECO,
} from './utils/roleGuard';

/** Master data edits are ECO-only — redirect old /edit URLs to new ECO with context */
const ProductEcoRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/eco/new?productId=${id}&ecoType=Product`} replace />;
};
const BOMEcoRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/eco/new?bomId=${id}`} replace />;
};

/* ──────────────────────────────────────────────────────────────
   AUTH GUARD
   ────────────────────────────────────────────────────────────── */
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-plm-page flex items-center justify-center">
      <div className="w-6 h-6 border-[2.5px] border-plm-mist border-t-plm-ocean rounded-full animate-spin" />
    </div>
  );
  return currentUser ? <Outlet /> : <Navigate to="/" replace />;
};

/* ──────────────────────────────────────────────────────────────
   PUBLIC ROUTE
   ────────────────────────────────────────────────────────────── */
const PublicOnlyRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/dashboard" replace /> : children;
};

/* ──────────────────────────────────────────────────────────────
   ROLE GUARD
   ────────────────────────────────────────────────────────────── */
const RoleGuardedRoute = ({ permissionFn, toastMsg, children }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  if (permissionFn && !permissionFn(role)) {
    showToast(toastMsg || 'You do not have permission to access this page.');
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/* ──────────────────────────────────────────────────────────────
   APP LAYOUT — fixed sidebar + topbar (responsive)
   ────────────────────────────────────────────────────────────── */
const AppLayout = ({ title }) => {
  const { collapsed } = useSidebar();
  const marginLeft = collapsed ? 64 : 220;

  return (
    <AuroraBackground>
      <div className="flex min-h-screen text-white">
        <Sidebar />
        <div
          className="flex-1 flex flex-col content-transition relative z-10"
          style={{ marginLeft }}
        >
          <Topbar title={title} />
          <main className="page-content custom-scrollbar flex-1 pt-[72px] px-4 md:px-6 pb-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AuroraBackground>
  );
};

/* ──────────────────────────────────────────────────────────────
   REPORTS PAGE
   ────────────────────────────────────────────────────────────── */
const ReportsPage = () => {
  const [tab, setTab] = useState('eco');
  const tabs = [
    { id: 'eco', label: 'ECO Summary' },
    { id: 'versions', label: 'Version Matrix' },
    { id: 'audit', label: 'Audit Log' },
    { id: 'archived', label: 'Archived Records' },
  ];
  return (
    <div className="page-content flex flex-col gap-5">
      <div className="flex gap-1 border-b border-plm-mist">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 rounded-t-lg
                        transition-colors bg-transparent cursor-pointer
                        ${tab === t.id
                          ? 'text-plm-ocean border-plm-ocean'
                          : 'text-plm-frost border-transparent hover:text-plm-surf'
                        }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'eco'      && <ECOReport />}
      {tab === 'versions' && <VersionMatrix />}
      {tab === 'audit'    && <AuditLog />}
      {tab === 'archived' && <ArchivedProducts />}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   SETTINGS PAGE (admin only)
   ────────────────────────────────────────────────────────────── */
const SettingsPage = () => {
  const [tab, setTab] = useState('stages');
  const tabs = [
    { id: 'stages', label: 'ECO Stages' },
    { id: 'rules', label: 'Approval Rules' },
  ];
  return (
    <div className="page-content flex flex-col gap-5">
      <div className="flex gap-1 border-b border-plm-mist">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 rounded-t-lg
                        transition-colors bg-transparent cursor-pointer
                        ${tab === t.id
                          ? 'text-plm-ocean border-plm-ocean'
                          : 'text-plm-frost border-transparent hover:text-plm-surf'
                        }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'stages' && <StageManager />}
      {tab === 'rules'  && <ApprovalRuleManager />}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   MAIN APP ROUTER
   ────────────────────────────────────────────────────────────── */
const App = () => (
  <>
    <ToastProvider />
    <Routes>
      {/* ── Public / Unauthenticated ──────────────────── */}
      <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
      <Route path="/create-company" element={<PublicOnlyRoute><CreateCompany /></PublicOnlyRoute>} />
      <Route path="/invite/:token" element={<InviteAccept />} />

      {/* ── All authenticated routes ──────────────────── */}
      <Route element={<ProtectedRoute />}>

        {/* Dashboard */}
        <Route element={<AppLayout title="Dashboard" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Products */}
        <Route element={<AppLayout title="Products" />}>
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/history" element={<ProductVersionHistory />} />
          <Route path="/products/new" element={
            <RoleGuardedRoute permissionFn={canCreateProduct} toastMsg="You don't have permission to create products.">
              <ProductForm />
            </RoleGuardedRoute>
          } />
          <Route path="/products/:id/edit" element={<ProductEcoRedirect />} />
        </Route>

        {/* BOM */}
        <Route element={<AppLayout title="Bills of Materials" />}>
          <Route path="/bom" element={<BOMList />} />
          <Route path="/bom/:id" element={<BOMDetail />} />
          <Route path="/bom/new" element={
            <RoleGuardedRoute permissionFn={canCreateBOM} toastMsg="You don't have permission to create BOMs.">
              <BOMForm />
            </RoleGuardedRoute>
          } />
          <Route path="/bom/:id/edit" element={<BOMEcoRedirect />} />
        </Route>

        {/* ECO */}
        <Route element={<AppLayout title="Engineering Change Orders" />}>
          <Route path="/eco" element={<ECOList />} />
          <Route path="/eco/:id" element={<ECODetail />} />
          <Route path="/eco/new" element={
            <RoleGuardedRoute permissionFn={canCreateECO} toastMsg="You don't have permission to create or edit ECOs.">
              <ECOForm />
            </RoleGuardedRoute>
          } />
          <Route path="/eco/:id/edit" element={
            <RoleGuardedRoute permissionFn={canEditECO} toastMsg="You don't have permission to create or edit ECOs.">
              <ECOForm />
            </RoleGuardedRoute>
          } />
        </Route>

        {/* Reports */}
        <Route element={<AppLayout title="Reports" />}>
          <Route path="/reports" element={
            <RoleGuardedRoute permissionFn={canViewReports} toastMsg="Reports are not available for your role.">
              <ReportsPage />
            </RoleGuardedRoute>
          } />
        </Route>

        {/* Members — admin only */}
        <Route element={<AppLayout title="Members" />}>
          <Route path="/members" element={
            <RoleGuardedRoute permissionFn={canViewSettings} toastMsg="Member management is only accessible to administrators.">
              <Members />
            </RoleGuardedRoute>
          } />
        </Route>

        {/* Settings — admin only */}
        <Route element={<AppLayout title="Settings" />}>
          <Route path="/settings" element={
            <RoleGuardedRoute permissionFn={canViewSettings} toastMsg="Settings are only accessible to administrators.">
              <SettingsPage />
            </RoleGuardedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  </>
);

export default App;
