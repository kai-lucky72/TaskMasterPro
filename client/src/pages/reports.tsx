import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download, Eye, FileText, Loader2, Plus } from 'lucide-react';
import ReportForm from '@/components/reports/ReportForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Report {
  id: number;
  userId: number;
  title: string;
  content: string;
  status: string;
  submissionDate: string;
  user?: {
    firstName: string;
    lastName: string;
    workId: string;
    role: string;
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('all');

  // Different endpoints for different roles
  const getEndpoint = () => {
    switch (user?.role) {
      case 'manager':
        // Managers view reports from sales staff
        return '/api/reports/manager';
      case 'sales_staff':
        // Sales staff view reports from their team leaders and agents
        return '/api/reports/sales-staff';
      case 'team_leader':
        // Team leaders view reports from their agents
        return '/api/reports/team-leader';
      default:
        // Agents view their own reports
        return '/api/reports/agent';
    }
  };

  const {
    data: reports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/reports', date],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/reports');
      const data = await response.json();
      return data.reports || [];
    },
    enabled: !!user,
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest('POST', '/api/reports', reportData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Report submitted',
        description: 'Your report has been submitted successfully.',
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const approveReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest('PUT', `/api/reports/${reportId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Report approved',
        description: 'The report has been approved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve report. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const handleCreateReport = (data: any) => {
    // Add userId to the report data
    const reportData = {
      ...data,
      userId: user?.id
    };
    createReportMutation.mutate(reportData);
  };

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'user',
      header: 'Submitted By',
      cell: ({ row }) => {
        const userData = row.original.user;
        return userData ? (
          <div>
            <div className="font-semibold">{userData.firstName} {userData.lastName}</div>
            <div className="text-xs text-muted-foreground">{userData.workId}</div>
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'submissionDate',
      header: 'Submitted On',
      cell: ({ row }) => {
        const date = row.getValue('submissionDate') as string;
        return date ? format(new Date(date), 'PPP') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        let variant: 'default' | 'success' | 'destructive' | 'outline' = 'default';
        
        switch (status) {
          case 'approved':
            variant = 'success';
            break;
          case 'rejected':
            variant = 'destructive';
            break;
          case 'pending':
            variant = 'outline';
            break;
        }
        
        return (
          <Badge variant={variant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReport(report);
                setViewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {/* Approval button only for managers/sales staff and pending reports */}
            {['manager', 'sales_staff'].includes(user?.role || '') && 
             report.status === 'pending' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => approveReportMutation.mutate(report.id)}
                disabled={approveReportMutation.isPending}
              >
                {approveReportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredReports = () => {
    if (activeTab === 'all') return reports;
    return reports?.filter(report => report.status === activeTab);
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred'}
              </p>
              <Button
                className="mt-4"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
                }
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Determine the allowed roles based on the application requirements
  const allowedRoles = ['manager', 'sales_staff', 'individual_agent', 'team_leader', 'sales_agent'];

  return (
    <RoleGuard allowedRoles={allowedRoles} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">
                {user?.role === 'manager' ? 'Review and manage reports from sales staff.' :
                 user?.role === 'sales_staff' ? 'Review reports from your team leaders and agents.' :
                 user?.role === 'team_leader' ? 'Collect reports from your agents and submit consolidated reports.' :
                 'View and submit your reports.'}
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
              
              {/* Only show New Report button for agents and team leaders, not for sales staff or managers */}
              {['individual_agent', 'team_leader', 'sales_agent'].includes(user?.role || '') && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-1">
                      <Plus className="h-4 w-4" />
                      New Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Report</DialogTitle>
                      <DialogDescription>
                        {user?.role === 'team_leader' 
                          ? 'Submit a consolidated report including your agents\'s reports.' 
                          : 'Submit a new report to your team leader.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {user && (
                        <ReportForm 
                          onSubmit={handleCreateReport} 
                          isSubmitting={createReportMutation.isPending} 
                          role={user.role}
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <DataTable
            columns={columns}
            data={filteredReports() || []}
            searchColumn="title"
            searchPlaceholder="Search by title..."
            loading={isLoading}
            emptyMessage="No reports found."
          />

          {/* Report Viewer Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedReport?.title}</DialogTitle>
                <DialogDescription>
                  Submitted on {selectedReport?.submissionDate && format(new Date(selectedReport.submissionDate), 'PPP')}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="p-4 border rounded-md bg-slate-50">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Report Content</h3>
                  </div>
                  <p className="whitespace-pre-wrap">{selectedReport?.content}</p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  {['manager', 'sales_staff'].includes(user?.role || '') && 
                   selectedReport?.status === 'pending' && (
                    <Button
                      onClick={() => {
                        approveReportMutation.mutate(selectedReport.id);
                        setViewDialogOpen(false);
                      }}
                      disabled={approveReportMutation.isPending}
                    >
                      {approveReportMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Approve Report
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
