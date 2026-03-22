/**
 * Dashboard.jsx
 * Role-based router — renders the correct dashboard per currentUser.role.
 * Dark theme adaptation.
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

  switch (role) {
    case 'engineering': return <EngineeringDashboard />;
    case 'approver':    return <ApproverDashboard />;
    case 'operations':  return <OperationsDashboard />;
    case 'admin':       return <AdminDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="text-[40px] drop-shadow-md">🔐</div>
          <p className="m-0 text-[15px] font-semibold text-white/90">
            Dashboard unavailable
          </p>
          <p className="m-0 text-[13px] text-white/50">
            Your account role (<code className="bg-white/10 px-1 py-0.5 rounded text-[#90E0EF] font-mono">{role || 'unknown'}</code>) does not have a configured dashboard.
          </p>
        </div>
      );
  }
};

export default Dashboard;
