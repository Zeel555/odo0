import { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
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
  canCreateProduct, canEditProduct,
  canCreateBOM, canEditBOM,
  canCreateECO, canEditECO,
} from './utils/roleGuard';

/* ──────────────────────────────────────────────────────────────
   AUTH GUARD — redirect to / (landing) if not authenticated
   ────────────────────────────────────────────────────────────── */
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: '2.5px solid #CAF0F8', borderTopColor: '#0077B6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
  return currentUser ? <Outlet /> : <Navigate to="/" replace />;
};

/* ──────────────────────────────────────────────────────────────
   PUBLIC ROUTE — redirect authenticated users to /dashboard
   ────────────────────────────────────────────────────────────── */
const PublicOnlyRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser ? <Navigate to="/dashboard" replace /> : children;
};

/* ──────────────────────────────────────────────────────────────
   ROLE GUARD — redirect to /dashboard + toast if insufficient role
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
   APP LAYOUT — fixed sidebar + topbar
   ────────────────────────────────────────────────────────────── */
const AppLayout = ({ title }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F9FF' }}>
    <Sidebar />
    <div style={{ flex: 1, marginLeft: 220, display: 'flex', flexDirection: 'column' }}>
      <Topbar title={title} />
      <main className="page-content custom-scrollbar" style={{ flex: 1, padding: '72px 24px 24px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  </div>
);

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
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid #CAF0F8' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 500, border: 'none',
            background: 'transparent', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            color: tab === t.id ? '#0077B6' : '#90E0EF',
            borderBottom: tab === t.id ? '2px solid #0077B6' : '2px solid transparent',
            transition: 'color 0.2s',
          }}>{t.label}</button>
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
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid #CAF0F8' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 500, border: 'none',
            background: 'transparent', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            color: tab === t.id ? '#0077B6' : '#90E0EF',
            borderBottom: tab === t.id ? '2px solid #0077B6' : '2px solid transparent',
            transition: 'color 0.2s',
          }}>{t.label}</button>
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
      {/* Invite accept is always public (recipients aren't logged in) */}
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
          <Route path="/products/:id/edit" element={
            <RoleGuardedRoute permissionFn={canEditProduct} toastMsg="You don't have permission to edit products.">
              <ProductForm />
            </RoleGuardedRoute>
          } />
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
          <Route path="/bom/:id/edit" element={
            <RoleGuardedRoute permissionFn={canEditBOM} toastMsg="You don't have permission to edit BOMs.">
              <BOMForm />
            </RoleGuardedRoute>
          } />
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
