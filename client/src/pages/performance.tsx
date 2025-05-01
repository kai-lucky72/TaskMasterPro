import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data interfaces (replace with actual API data)
interface PerformanceData {
  attendanceRate: number;
  clientsCount: number;
  reportSubmissions: number;
  teamPerformance: {
    name: string;
    clients: number;
    attendance: number;
  }[];
  salesByType: {
    name: string;
    value: number;
  }[];
  monthlyPerformance: {
    month: string;
    clients: number;
    attendance: number;
  }[];
}

export default function PerformancePageWrapper() {
  const { user } = useAuth();
  
  // Performance page is available for multiple roles but with different data
  const allowedRoles = ['manager', 'sales_staff', 'individual_agent', 'team_leader', 'sales_agent'];
  
  return (
    <RoleGuard allowedRoles={allowedRoles} redirect="/">
      <PerformancePage />
    </RoleGuard>
  );
}

function PerformancePage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [periodType, setPeriodType] = useState('month'); // month, quarter, year
  const [activeTab, setActiveTab] = useState('overview');

  // Different API endpoints based on user role
  const getEndpoint = () => {
    switch (user?.role) {
      case 'manager':
        return '/api/performance/manager';
      case 'sales_staff':
        return '/api/performance/sales-staff';
      case 'team_leader':
        return '/api/performance/team-leader';
      default:
        return '/api/performance/agent';
    }
  };

  const {
    data: performanceData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [getEndpoint(), date, periodType],
    queryFn: async () => {
      // This would be an actual API call in a real implementation
      // Instead, we'll return mock data for now
      return new Promise<PerformanceData>((resolve) => {
        setTimeout(() => {
          resolve({
            attendanceRate: 87,
            clientsCount: 345,
            reportSubmissions: 42,
            teamPerformance: [
              { name: 'Team A', clients: 120, attendance: 92 },
              { name: 'Team B', clients: 85, attendance: 78 },
              { name: 'Team C', clients: 140, attendance: 89 },
            ],
            salesByType: [
              { name: 'Health', value: 45 },
              { name: 'Education', value: 20 },
              { name: 'Life', value: 25 },
              { name: 'Property', value: 10 },
            ],
            monthlyPerformance: [
              { month: 'Jan', clients: 30, attendance: 80 },
              { month: 'Feb', clients: 25, attendance: 75 },
              { month: 'Mar', clients: 35, attendance: 90 },
              { month: 'Apr', clients: 40, attendance: 85 },
              { month: 'May', clients: 28, attendance: 82 },
              { month: 'Jun', clients: 32, attendance: 88 },
            ],
          });
        }, 800);
      });
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Determine page title based on user role
  const getPageTitle = () => {
    switch (user?.role) {
      case 'manager':
        return 'Department Performance';
      case 'sales_staff':
        return 'Team Performance';
      case 'team_leader':
        return 'Team Performance';
      default:
        return 'My Performance';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground">
              Monitor performance metrics and trends.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred'}
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Attendance Rate</CardTitle>
                      <CardDescription>Overall team attendance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{performanceData?.attendanceRate}%</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Clients</CardTitle>
                      <CardDescription>New and existing clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{performanceData?.clientsCount}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Report Submissions</CardTitle>
                      <CardDescription>Submitted reports this period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{performanceData?.reportSubmissions}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance</CardTitle>
                    <CardDescription>Client acquisition and attendance trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={performanceData?.monthlyPerformance}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="clients" fill="#8884d8" name="New Clients" />
                          <Bar dataKey="attendance" fill="#82ca9d" name="Attendance %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="attendance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Attendance Comparison</CardTitle>
                    <CardDescription>Attendance rates by team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={performanceData?.teamPerformance}
                          layout="vertical"
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="attendance" fill="#82ca9d" name="Attendance %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sales" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales by Insurance Type</CardTitle>
                      <CardDescription>Distribution of insurance types</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={performanceData?.salesByType}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {performanceData?.salesByType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Performance</CardTitle>
                      <CardDescription>Client acquisition by team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={performanceData?.teamPerformance}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="clients" fill="#8884d8" name="Clients" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
