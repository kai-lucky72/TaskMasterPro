import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { StatsData, User, Report } from "@/types";
import { formatDistanceToNow } from "date-fns";

import PageHeader from "@/components/layout/PageHeader";
import Stats from "@/components/dashboard/Stats";
import UserTable from "@/components/users/UserTable";
import ReportList from "@/components/reports/ReportList";
import PerformanceChart from "@/components/performance/PerformanceChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  UserPlus, 
  UserCheck, 
  Users, 
  BarChart,
  FileText,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData[]>([]);

  // Fetch sales staff
  const { data: salesStaffData, isLoading: salesStaffLoading } = useQuery({
    queryKey: ['/api/users/by-role/sales_staff'],
  });

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
  });

  // Calculate stats
  useEffect(() => {
    if (!salesStaffData) return;

    const salesStaff = salesStaffData.users || [];
    const activeSalesStaff = salesStaff.filter(staff => staff.status === 'active');
    
    // Simulated stats (in a real app, these would come from API calls)
    const totalAgents = 32; // This would come from a separate API call
    const recentClientsAdded = 17;
    
    setStats([
      {
        icon: <Users />,
        title: "Total Sales Staff",
        value: salesStaff.length,
        change: 3,
        changeText: "from last month",
        color: "purple"
      },
      {
        icon: <UserCheck />,
        title: "Active Sales Staff",
        value: activeSalesStaff.length,
        changeText: `${((activeSalesStaff.length / Math.max(salesStaff.length, 1)) * 100).toFixed(1)}% active rate`,
        color: "green"
      },
      {
        icon: <Users />,
        title: "Total Agents",
        value: totalAgents,
        change: 8,
        changeText: "increase since last month",
        color: "blue"
      },
      {
        icon: <BarChart />,
        title: "Recent Clients Added",
        value: recentClientsAdded,
        change: 12,
        changeText: "in the last 7 days",
        color: "orange"
      }
    ]);
  }, [salesStaffData]);

  // Performance data for the chart
  const performanceData = [
    { name: 'Week 1', sales: 4000, clients: 24 },
    { name: 'Week 2', sales: 3000, clients: 13 },
    { name: 'Week 3', sales: 5000, clients: 22 },
    { name: 'Week 4', sales: 2780, clients: 10 },
    { name: 'Week 5', sales: 1890, clients: 7 },
    { name: 'Week 6', sales: 2390, clients: 14 },
    { name: 'Week 7', sales: 3490, clients: 18 },
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Manager Dashboard" 
        description="Manage your sales staff and monitor performance" 
        actions={
          <Link href="/sales-staff/add">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Sales Staff
            </Button>
          </Link>
        }
      />
      
      {/* Stats Overview */}
      {stats.length > 0 ? (
        <Stats data={stats} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="h-20 flex items-center justify-center">
                  <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Performance Overview */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="flex-row justify-between items-center pb-2 border-b">
          <CardTitle className="text-lg">Performance Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">Weekly</Button>
            <Button variant="outline" size="sm">Monthly</Button>
            <Button variant="outline" size="sm">Quarterly</Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <PerformanceChart data={performanceData} />
        </CardContent>
      </Card>
      
      {/* Sales Staff Management */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="flex-row justify-between items-center pb-2 border-b">
          <CardTitle className="text-lg">Sales Staff Management</CardTitle>
          <Link href="/sales-staff/add">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Sales Staff
            </Button>
          </Link>
        </CardHeader>
        
        <UserTable 
          users={salesStaffData?.users} 
          isLoading={salesStaffLoading} 
          showActions={true}
        />
        
        <CardFooter className="border-t p-4 text-sm">
          <div className="flex items-center justify-between w-full">
            <p className="text-slate-600">
              {salesStaffData?.users ? `Showing ${salesStaffData.users.length} of ${salesStaffData.users.length} sales staff` : 'Loading...'}
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Reports */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg">Recent Reports</CardTitle>
        </CardHeader>
        
        <ReportList 
          reports={reportsData?.reports} 
          isLoading={reportsLoading}
        />
        
        <CardFooter className="border-t p-4 text-sm">
          <div className="w-full text-center">
            <Link href="/reports">
              <Button variant="link" className="text-purple-600 hover:text-purple-800 font-medium">
                View All Reports
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Communicate with your team members and coordinate activities.
            </p>
            <Link href="/messages">
              <Button className="w-full" variant="outline">Open Messages</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <UserCheck className="w-5 h-5 mr-2" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Monitor attendance records for your sales staff and agents.
            </p>
            <Link href="/attendance">
              <Button className="w-full" variant="outline">View Attendance</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Report Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Generate and view summary reports for your department.
            </p>
            <Link href="/reports/summary">
              <Button className="w-full" variant="outline">Generate Summary</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
