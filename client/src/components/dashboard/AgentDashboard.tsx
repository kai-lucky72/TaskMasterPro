import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { StatsData, User, Report, Client, Attendance, AttendanceTimeframe } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

import PageHeader from "@/components/layout/PageHeader";
import Stats from "@/components/dashboard/Stats";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import ReportList from "@/components/reports/ReportList";
import ClientList from "@/components/clients/ClientList";
import ClientForm from "@/components/clients/ClientForm";
import ReportForm from "@/components/reports/ReportForm";
import PerformanceChart from "@/components/performance/PerformanceChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  BarChart,
  FileText,
  MessageSquare,
  Users,
  PlusCircle,
  Calendar,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);
  
  // Role-specific title
  const roleTitle = user?.role === 'team_leader' ? 'Team Leader' : 
                    user?.role === 'individual_agent' ? 'Individual Agent' : 'Sales Agent';

  // Fetch today's attendance
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/attendance/user', user?.id],
  });

  // Fetch attendance timeframes
  const { data: timeframesData, isLoading: timeframesLoading } = useQuery({
    queryKey: ['/api/attendance/timeframes'],
  });

  // Fetch clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (attendanceData: any) => 
      apiRequest('POST', '/api/attendance', attendanceData),
    onSuccess: () => {
      toast({
        title: "Attendance Marked",
        description: "Your attendance has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/user', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Mark Attendance",
        description: error.message || "There was a problem marking your attendance.",
        variant: "destructive",
      });
    }
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (clientData: any) => 
      apiRequest('POST', '/api/clients', clientData),
    onSuccess: () => {
      toast({
        title: "Client Added",
        description: "The client has been added successfully.",
      });
      setShowAddClient(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Client",
        description: error.message || "There was a problem adding the client.",
        variant: "destructive",
      });
    }
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData: any) => 
      apiRequest('POST', '/api/reports', reportData),
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Your report has been submitted successfully.",
      });
      setShowAddReport(false);
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Report",
        description: error.message || "There was a problem submitting your report.",
        variant: "destructive",
      });
    }
  });

  // Check if attendance is marked for today
  const isTodayAttendanceMarked = () => {
    if (!attendanceData?.attendance || attendanceData.attendance.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return attendanceData.attendance.some((record: Attendance) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  };

  // Get today's attendance record
  const getTodayAttendance = () => {
    if (!attendanceData?.attendance) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return attendanceData.attendance.find((record: Attendance) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  };

  // Check if current time is within any timeframe
  const isWithinTimeframe = () => {
    if (!timeframesData?.timeframes) return false;
    
    const now = new Date();
    
    return timeframesData.timeframes.some((timeframe: AttendanceTimeframe) => {
      const start = new Date(timeframe.startTime);
      const end = new Date(timeframe.endTime);
      return now >= start && now <= end;
    });
  };

  // Calculate stats
  useEffect(() => {
    if (!clientsData) return;

    const clients = clientsData.clients || [];
    const todayAttendance = getTodayAttendance();
    
    // Get client counts
    const totalClients = clients.length;
    
    // Get this week's clients
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekClients = clients.filter((client: Client) => {
      return new Date(client.createdAt) >= oneWeekAgo;
    }).length;
    
    // Calculate total revenue
    const totalRevenue = clients.reduce((sum: number, client: Client) => sum + client.amount, 0);
    
    setStats([
      {
        icon: <CheckCircle2 />,
        title: "Attendance Status",
        value: todayAttendance ? (todayAttendance.isPresent ? "Present" : "Absent") : "Not Marked",
        changeText: todayAttendance?.isExcused ? "Absence excused" : (isWithinTimeframe() ? "Mark now" : "Outside timeframe"),
        color: todayAttendance ? (todayAttendance.isPresent || todayAttendance.isExcused ? "green" : "red") : "amber"
      },
      {
        icon: <Users />,
        title: "Total Clients",
        value: totalClients,
        change: thisWeekClients,
        changeText: "this week",
        color: "blue"
      },
      {
        icon: <BarChart />,
        title: "Total Revenue",
        value: `RWF ${totalRevenue.toLocaleString()}`,
        changeText: "from all clients",
        color: "green"
      },
      {
        icon: <FileText />,
        title: "Reports Submitted",
        value: reportsData?.reports?.length || 0,
        changeText: "View or submit reports",
        color: "purple"
      }
    ]);
  }, [clientsData, attendanceData, timeframesData, reportsData]);

  // Performance data for the chart
  const performanceData = [
    { name: 'Week 1', clients: 3, revenue: 30000 },
    { name: 'Week 2', clients: 2, revenue: 20000 },
    { name: 'Week 3', clients: 4, revenue: 40000 },
    { name: 'Week 4', clients: 3, revenue: 35000 },
    { name: 'Week 5', clients: 5, revenue: 50000 },
    { name: 'Week 6', clients: 2, revenue: 25000 },
    { name: 'Week 7', clients: 3, revenue: 32000 },
  ];

  // Handle attendance submission
  const handleMarkAttendance = (data: any) => {
    markAttendanceMutation.mutate(data);
  };

  // Handle client submission
  const handleAddClient = (data: any) => {
    createClientMutation.mutate(data);
  };

  // Handle report submission
  const handleSubmitReport = (data: any) => {
    createReportMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <PageHeader 
        title={`${roleTitle} Dashboard`} 
        description="Manage your clients, attendance, and reports" 
        actions={
          <div className="flex space-x-2">
            {isTodayAttendanceMarked() ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={!isTodayAttendanceMarked() || !getTodayAttendance()?.isPresent}
                    onClick={() => setShowAddClient(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                  </DialogHeader>
                  <ClientForm onSubmit={handleAddClient} isSubmitting={createClientMutation.isPending} />
                </DialogContent>
              </Dialog>
            ) : (
              <Button 
                variant="outline"
                disabled={!isWithinTimeframe() || isTodayAttendanceMarked()}
                onClick={() => {
                  // Open attendance form dialog if not marked already
                  document.getElementById('attendance-dialog-trigger')?.click();
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setShowAddReport(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Weekly Report</DialogTitle>
                </DialogHeader>
                <ReportForm 
                  onSubmit={handleSubmitReport} 
                  isSubmitting={createReportMutation.isPending}
                  role={user?.role || 'individual_agent'}
                />
              </DialogContent>
            </Dialog>
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

      {/* Attendance Dialog */}
      <Dialog>
        <DialogTrigger id="attendance-dialog-trigger" className="hidden"></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Your Attendance</DialogTitle>
          </DialogHeader>
          <AttendanceForm 
            onSubmit={handleMarkAttendance} 
            isSubmitting={markAttendanceMutation.isPending}
            isWithinTimeframe={isWithinTimeframe()}
            timeframes={timeframesData?.timeframes}
          />
        </DialogContent>
      </Dialog>
      
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
      
      {/* Attendance Status */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg">Attendance Status</CardTitle>
          <CardDescription>Your daily attendance records</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          {attendanceLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 bg-slate-200 rounded w-32 animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                <div className="mb-4">
                  {!isTodayAttendanceMarked() ? (
                    <>
                      <Clock className="mx-auto h-12 w-12 text-amber-500 mb-2" />
                      <h3 className="text-lg font-semibold text-slate-800">Attendance Not Marked</h3>
                      {isWithinTimeframe() ? (
                        <p className="text-slate-600">
                          Please mark your attendance for today.
                          <Button 
                            variant="link" 
                            className="ml-1"
                            onClick={() => {
                              document.getElementById('attendance-dialog-trigger')?.click();
                            }}
                          >
                            Mark Now
                          </Button>
                        </p>
                      ) : (
                        <p className="text-slate-600">
                          You are outside the attendance timeframe.
                        </p>
                      )}
                    </>
                  ) : (
                    getTodayAttendance()?.isPresent ? (
                      <>
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-2" />
                        <h3 className="text-lg font-semibold text-slate-800">Marked as Present</h3>
                        <p className="text-slate-600">
                          You're marked as present for today. You can add clients.
                        </p>
                      </>
                    ) : (
                      getTodayAttendance()?.isExcused ? (
                        <>
                          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-2" />
                          <h3 className="text-lg font-semibold text-slate-800">Absence Excused</h3>
                          <p className="text-slate-600">
                            Your absence has been excused. You can add clients.
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
                          <h3 className="text-lg font-semibold text-slate-800">Marked as Absent</h3>
                          <p className="text-slate-600">
                            You're marked as absent for today. You cannot add clients until excused.
                          </p>
                        </>
                      )
                    )
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {!isTodayAttendanceMarked() && isWithinTimeframe() && (
                    <Button 
                      onClick={() => document.getElementById('attendance-dialog-trigger')?.click()}
                    >
                      Mark Attendance
                    </Button>
                  )}
                  
                  {(getTodayAttendance()?.isPresent || getTodayAttendance()?.isExcused) && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowAddClient(true)}
                    >
                      Add Client
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowAddReport(true)}
                  >
                    Submit Report
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Recent Attendance</h3>
                <div className="space-y-2">
                  {attendanceData?.attendance?.slice(0, 5).map((record: Attendance) => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        {record.isPresent ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Present
                          </span>
                        ) : record.isExcused ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Excused
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Absent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Clients & Reports Tabs */}
      <Card className="shadow-sm border border-slate-200 mb-8">
        <CardHeader className="pb-2 border-b">
          <Tabs defaultValue="clients">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Clients & Reports</CardTitle>
              <TabsList>
                <TabsTrigger value="clients">My Clients</TabsTrigger>
                <TabsTrigger value="reports">My Reports</TabsTrigger>
                {user?.role === 'team_leader' && (
                  <TabsTrigger value="teamClients">Team Clients</TabsTrigger>
                )}
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        
        <TabsContent value="clients" className="m-0">
          <ClientList 
            clients={clientsData?.clients} 
            isLoading={clientsLoading}
            onAddNew={() => setShowAddClient(true)}
          />
        </TabsContent>
        
        <TabsContent value="reports" className="m-0">
          <ReportList 
            reports={reportsData?.reports} 
            isLoading={reportsLoading}
            onAddNew={() => setShowAddReport(true)}
          />
        </TabsContent>
        
        {user?.role === 'team_leader' && (
          <TabsContent value="teamClients" className="m-0">
            <div className="p-6 text-center text-slate-500">
              <p>Team clients view will be implemented soon.</p>
            </div>
          </TabsContent>
        )}
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
              Communicate with your {user?.role === 'individual_agent' || user?.role === 'sales_agent' ? 'sales staff' : 'team members'}.
            </p>
            <Link href="/messages">
              <Button className="w-full" variant="outline">Open Messages</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              View your complete attendance history and records.
            </p>
            <Link href="/attendance">
              <Button className="w-full" variant="outline">View History</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              View detailed statistics about your performance.
            </p>
            <Link href="/performance">
              <Button className="w-full" variant="outline">View Summary</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
