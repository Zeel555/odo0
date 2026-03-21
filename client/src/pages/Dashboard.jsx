/**
 * Dashboard.jsx
 * Role-based router — renders the correct dashboard per currentUser.role.
 */
import { useAuth } from '../context/AuthContext';
import EngineeringDashboard from '../components/dashboard/EngineeringDashboard';
import ApproverDashboard    from '../components/dashboard/ApproverDashboard';
import OperationsDashboard  from '../components/dashboard/OperationsDashboard';
import AdminDashboard       from '../components/dashboard/AdminDashboard';
import { getRoleConfig }    from '../utils/roleConfig';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const cfg  = getRoleConfig(role);

  switch (role) {
    case 'engineering': return <EngineeringDashboard />;
    case 'approver':    return <ApproverDashboard />;
    case 'operations':  return <OperationsDashboard />;
    case 'admin':       return <AdminDashboard />;
    default:
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 300, gap: 12,
        }}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
            Dashboard unavailable
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            Your account role (<code>{role || 'unknown'}</code>) does not have a configured dashboard.
          </p>
        </div>
      );
  }
};

export default Dashboard;
