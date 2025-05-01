import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import SalesStaffDashboard from '@/components/dashboard/SalesStaffDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  useEffect(() => {
    // Set page title based on user role
    if (user) {
      const roleTitle = {
        admin: 'Admin',
        manager: 'Manager',
        sales_staff: 'Sales Staff',
        individual_agent: 'Individual Agent',
        team_leader: 'Team Leader',
        sales_agent: 'Sales Agent',
      }[user.role] || 'Dashboard';
      
      document.title = `${roleTitle} Dashboard - OrganizationPro`;
    }
  }, [user]);

  if (!user) return null;

  return (
    <DashboardLayout>
      {/* Render different dashboard based on user role */}
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'manager' && <ManagerDashboard />}
      {user.role === 'sales_staff' && <SalesStaffDashboard />}
      {['individual_agent', 'team_leader', 'sales_agent'].includes(user.role) && <AgentDashboard />}
    </DashboardLayout>
  );
}
