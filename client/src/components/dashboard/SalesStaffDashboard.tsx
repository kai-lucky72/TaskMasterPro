import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { StatsData, User, Report, AgentGroup } from "@/types";

import PageHeader from "@/components/layout/PageHeader";
import Stats from "@/components/dashboard/Stats";
import UserTable from "@/components/users/UserTable";
import ReportList from "@/components/reports/ReportList";
import PerformanceChart from "@/components/performance/PerformanceChart";
import AttendanceTimeframe from "@/components/attendance/AttendanceTimeframe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  UserCheck, 
  Users, 
  BarChart,
  Clock,
  FileText,
  MessageSquare,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalesStaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData[]>([]);
  const [activeTab, setActiveTab] = useState("agents");

  // Fetch agents
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/users/by-role/individual_agent'],
  });

  // Fetch team leaders
  const { data: teamLeadersData, isLoading: teamLeadersLoading } = useQuery({
    queryKey: ['/api/users/by-role/team_leader'],
  });

  // Fetch sales agents
  const { data: salesAgentsData, isLoading: salesAgentsLoading } = useQuery({
    queryKey: ['/api/users/by-role/sales_agent'],
  });

  // Fetch agent groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/agent-groups'],
  });

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
  });

  // Fetch attendance timeframes
  const { data: timeframesData, isLoading: timeframesLoading } = useQuery({
    queryKey: ['/api/attendance/timeframes'],
  });

  // Calculate stats
  useEffect(() => {
    if (!agentsData || !teamLeadersData || !salesAgentsData || !groupsData) return;

    const individualAgents = agentsData.users || [];
    const teamLeaders = teamLeadersData.users || [];
    const salesAgents = salesAgentsData.users || [];
    const groups = groupsData.groups || [];
    
    const activeIndividualAgents = individualAgents.filter(agent => agent.status === 'active');
    const activeTeamLeaders = teamLeaders.filter(leader => leader.status === 'active');
    const activeSalesAgents = salesAgents.filter(agent => agent.status === 'active');
    
    const totalAgents = individualAgents.length + teamLeaders.length + salesAgents.length;
    const activeAgents = activeIndividualAgents.length + activeTeamLeaders.length + activeSalesAgents.length;
    
    // Calculate total clients (in a real app this would come from an API call)
    const totalClients = 78;
    const newClientsThisWeek = 12;
    
    setStats([
      {
        icon: <Users />,
        title: "Total Agents",
        value: totalAgents,
        change: 4,
        changeText: "from last month",
        color: "green"
      },
      {
        icon: <UserCheck />,
        title: "Active Agents",
        value: activeAgents,
        changeText: `${((activeAgents / Math.max(totalAgents, 1)) * 100).toFixed(1)}% active rate`,
        color: "blue"
      },
      {
        icon: <UserCog />,
        title: "Agent Groups",
        value: groups.length,
        changeText: `${teamLeaders.length} team leaders`,
        color: "amber"
      },
      {
        icon: <BarChart />,
        title: "Total Clients",
        value: totalClients,
        change: newClientsThisWeek,
        changeText: "new this week",
        color: "orange"
      }
    ]);
  }, [agentsData, teamLeadersData, salesAgentsData, groupsData]);

  // Performance data for the chart
  const performanceData = [
    { name: 'Week 1', sales: 2400, clients: 12 },
    { name: 'Week 2', sales: 1800, clients: 9 },
    { name: 'Week 3', sales: 3200, clients: 16 },
    { name: 'Week 4', sales: 2780, clients: 13 },
    { name: 'Week 5', sales: 1890, clients: 8 },
    { name: 'Week 6', sales: 2390, clients: 11 },
    { name: 'Week 7', sales: 3490, clients: 17 },
  ];

  // Combine all agent types
  const getAllAgents = () => {
    if (!agentsData?.users || !teamLeadersData?.users || !salesAgentsData?.users) return [];
    
    return [
      ...(agentsData.users || []),
      ...(teamLeadersData.users || []),
      ...(salesAgentsData.users || [])
    ];
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Sales Staff Dashboard" 
        description="Manage your agents and monitor performance" 
        actions={
          <div className="flex space-x-2">
            <Link href="/agents/add">
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </Link>
            <Link href="/attendance/timeframes">
              <Button variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Set Timeframes
              </Button>
            </Link>
          </div>
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
      
      {/* Attendance Timeframes */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="flex-row justify-between items-center pb-2 border-b">
          <div>
            <CardTitle className="text-lg">Attendance Timeframes</CardTitle>
            <CardDescription>Set timeframes for agents to mark their attendance</CardDescription>
          </div>
          <Link href="/attendance/timeframes/add">
            <Button size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Add Timeframe
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent className="p-4">
          <AttendanceTimeframe 
            timeframes={timeframesData?.timeframes} 
            isLoading={timeframesLoading}
          />
        </CardContent>
      </Card>
      
      {/* Agent Management */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="pb-2 border-b">
          <Tabs defaultValue="agents" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Agent Management</CardTitle>
              <TabsList>
                <TabsTrigger value="agents">All Agents</TabsTrigger>
                <TabsTrigger value="individual">Individual Agents</TabsTrigger>
                <TabsTrigger value="teamLeaders">Team Leaders</TabsTrigger>
                <TabsTrigger value="salesAgents">Sales Agents</TabsTrigger>
                <TabsTrigger value="groups">Agent Groups</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        
        <TabsContent value="agents" className="m-0">
          <UserTable 
            users={getAllAgents()} 
            isLoading={agentsLoading || teamLeadersLoading || salesAgentsLoading} 
            showActions={true}
          />
        </TabsContent>
        
        <TabsContent value="individual" className="m-0">
          <UserTable 
            users={agentsData?.users} 
            isLoading={agentsLoading} 
            showActions={true}
          />
        </TabsContent>
        
        <TabsContent value="teamLeaders" className="m-0">
          <UserTable 
            users={teamLeadersData?.users} 
            isLoading={teamLeadersLoading} 
            showActions={true}
          />
        </TabsContent>
        
        <TabsContent value="salesAgents" className="m-0">
          <UserTable 
            users={salesAgentsData?.users} 
            isLoading={salesAgentsLoading} 
            showActions={true}
          />
        </TabsContent>
        
        <TabsContent value="groups" className="m-0">
          <div className="p-4">
            {groupsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-slate-100 h-16 rounded animate-pulse"></div>
                ))}
              </div>
            ) : groupsData?.groups?.length ? (
              <div className="space-y-4">
                {groupsData.groups.map((group: AgentGroup) => (
                  <div key={group.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-slate-500">Created: {new Date(group.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Link href={`/agent-groups/${group.id}`}>
                          <Button size="sm">View Group</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p>No agent groups found</p>
                <Link href="/agent-groups/add">
                  <Button className="mt-4">Create Agent Group</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
        
        <CardFooter className="border-t p-4 text-sm">
          <div className="flex items-center justify-between w-full">
            <p className="text-slate-600">
              {activeTab === "agents" && getAllAgents().length > 0 && `Showing ${getAllAgents().length} agents`}
              {activeTab === "individual" && agentsData?.users && `Showing ${agentsData.users.length} individual agents`}
              {activeTab === "teamLeaders" && teamLeadersData?.users && `Showing ${teamLeadersData.users.length} team leaders`}
              {activeTab === "salesAgents" && salesAgentsData?.users && `Showing ${salesAgentsData.users.length} sales agents`}
              {activeTab === "groups" && groupsData?.groups && `Showing ${groupsData.groups.length} agent groups`}
            </p>
            <div className="flex items-center space-x-2">
              <Link href="/agents/add">
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Agent
                </Button>
              </Link>
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
              <Button variant="link" className="text-green-600 hover:text-green-800 font-medium">
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
              Communicate with your team members and agents.
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
              Agent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              View and manage attendance records for your agents.
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
              Client Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              View summary of clients added by your agents.
            </p>
            <Link href="/clients">
              <Button className="w-full" variant="outline">View Clients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
