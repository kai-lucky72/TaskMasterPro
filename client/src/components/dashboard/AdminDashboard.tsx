import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { StatsData, User, HelpRequest, ActivityLog } from "@/types";
import { formatDistanceToNow } from "date-fns";

import PageHeader from "@/components/layout/PageHeader";
import Stats from "@/components/dashboard/Stats";
import UserTable from "@/components/users/UserTable";
import HelpRequestList from "@/components/help/HelpRequestList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  UserPlus, 
  UserCheck, 
  HelpCircle, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "../layout/UserAvatar";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData[]>([]);

  // Fetch managers
  const { data: managersData, isLoading: managersLoading } = useQuery({
    queryKey: ['/api/users/by-role/manager'],
  });

  // Fetch help requests
  const { data: helpRequestsData, isLoading: helpRequestsLoading } = useQuery({
    queryKey: ['/api/help-requests'],
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
  });

  // Calculate stats
  useEffect(() => {
    if (!managersData || !helpRequestsData) return;

    const managers = managersData.users || [];
    const helpRequests = helpRequestsData.helpRequests || [];
    
    const activeManagers = managers.filter(manager => manager.status === 'active');
    const pendingHelpRequests = helpRequests.filter(request => request.status === 'pending');
    
    // Calculate organization size (all users in the system)
    const fetchOrgSize = async () => {
      try {
        // Make parallel requests for all role types
        const roles = ['manager', 'sales_staff', 'individual_agent', 'team_leader', 'sales_agent'];
        const requests = roles.map(role => 
          apiRequest('GET', `/api/users/by-role/${role}`).then(res => res.json())
        );
        
        const results = await Promise.all(requests);
        const totalUsers = results.reduce((acc, curr) => acc + (curr.users?.length || 0), 0);
        
        // Update the stats
        setStats([
          {
            icon: <Users />,
            title: "Total Managers",
            value: managers.length,
            change: 5,
            changeText: "from last month",
            color: "blue"
          },
          {
            icon: <UserCheck />,
            title: "Active Managers",
            value: activeManagers.length,
            changeText: `${((activeManagers.length / managers.length) * 100).toFixed(1)}% active rate`,
            color: "green"
          },
          {
            icon: <HelpCircle />,
            title: "Login Help Requests",
            value: helpRequests.length,
            changeText: `${pendingHelpRequests.length} pending`,
            color: "orange"
          },
          {
            icon: <Users />,
            title: "Total Organization Size",
            value: totalUsers,
            change: 12,
            changeText: "growth this quarter",
            color: "purple"
          }
        ]);
      } catch (error) {
        console.error('Error fetching organization size:', error);
        toast({
          title: "Error",
          description: "Failed to calculate organization statistics.",
          variant: "destructive"
        });
      }
    };

    fetchOrgSize();
  }, [managersData, helpRequestsData, toast]);

  return (
    <div className="p-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Manage your organization structure and monitor activities" 
        actions={
          <Link href="/managers/add">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Manager
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
      
      {/* Manager Management */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="flex-row justify-between items-center pb-2 border-b">
          <CardTitle className="text-lg">Manager Management</CardTitle>
          <Link href="/managers/add">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Manager
            </Button>
          </Link>
        </CardHeader>
        
        <UserTable 
          users={managersData?.users} 
          isLoading={managersLoading} 
          showActions={true}
        />
        
        <CardFooter className="border-t p-4 text-sm">
          <div className="flex items-center justify-between w-full">
            <p className="text-slate-600">
              {managersData?.users ? `Showing ${managersData.users.length} of ${managersData.users.length} managers` : 'Loading...'}
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
      
      {/* Help Login Requests */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg">Help Login Requests</CardTitle>
        </CardHeader>
        
        <HelpRequestList 
          helpRequests={helpRequestsData?.helpRequests} 
          isLoading={helpRequestsLoading}
        />
        
        <CardFooter className="border-t p-4 text-sm">
          <div className="w-full text-center">
            <Link href="/help-requests">
              <Button variant="link" className="text-blue-600 hover:text-blue-800 font-medium">
                View All Help Requests
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Recent Activity */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {activityLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : activityData?.activityLogs?.length ? (
              activityData.activityLogs.slice(0, 4).map((activity: ActivityLog) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                      ${getActivityIconColor(activity.action)}`}>
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">
                        {activity.user ? (
                          <>
                            <span className="font-medium text-slate-800">
                              {activity.user.firstName} {activity.user.lastName}
                            </span>
                            <span className="text-slate-600"> {getActivityDescription(activity.action)} </span>
                            {activity.details && (
                              <span className="font-medium text-slate-800">{activity.details.split('(')[1]?.replace(')', '') || ''}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-600">{getActivityDescription(activity.action)}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                No recent activities found
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t p-4 text-sm">
          <div className="w-full text-center">
            <Link href="/activities">
              <Button variant="link" className="text-blue-600 hover:text-blue-800 font-medium">
                View All Activity
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper functions for activity logs
const getActivityIcon = (action: string) => {
  switch (true) {
    case action.includes('USER_CREATED'):
      return <UserPlus className="w-4 h-4" />;
    case action.includes('USER_DISABLED'):
      return <Users className="w-4 h-4" />;
    case action.includes('USER_ENABLED'):
      return <UserCheck className="w-4 h-4" />;
    case action.includes('HELP_REQUEST'):
      return <HelpCircle className="w-4 h-4" />;
    default:
      return <ArrowUpRight className="w-4 h-4" />;
  }
};

const getActivityIconColor = (action: string) => {
  switch (true) {
    case action.includes('CREATED'):
      return 'bg-slate-200 text-slate-600';
    case action.includes('DISABLED'):
      return 'bg-red-100 text-red-600';
    case action.includes('ENABLED'):
      return 'bg-green-100 text-green-600';
    case action.includes('HELP_REQUEST'):
      return 'bg-orange-100 text-orange-600';
    case action.includes('LOGIN_SUCCESS'):
      return 'bg-green-100 text-green-600';
    case action.includes('LOGIN_FAILED'):
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-blue-100 text-blue-600';
  }
};

const getActivityDescription = (action: string) => {
  switch (action) {
    case 'USER_CREATED':
      return 'created a new user';
    case 'USER_UPDATED':
      return 'updated user';
    case 'USER_DISABLED':
      return 'disabled user';
    case 'USER_ENABLED':
      return 'enabled user';
    case 'LOGIN_SUCCESS':
      return 'logged in successfully';
    case 'LOGIN_FAILED':
      return 'failed to log in';
    case 'LOGOUT':
      return 'logged out';
    case 'HELP_REQUEST_RESOLVED':
      return 'resolved help request for';
    default:
      return action.toLowerCase().replace(/_/g, ' ');
  }
};
