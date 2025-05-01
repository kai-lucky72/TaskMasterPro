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
import { CalendarIcon, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
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

interface Attendance {
  id: number;
  userId: number;
  date: string;
  isPresent: boolean;
  isExcused: boolean;
  location: string;
  sector: string;
  excusedById: number | null;
  excuseReason: string | null;
  user?: {
    firstName: string;
    lastName: string;
    workId: string;
    role: string;
  };
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('all');

  // Different endpoints for different roles
  const getEndpoint = () => {
    switch (user?.role) {
      case 'manager':
        return '/api/attendance/manager';
      case 'sales_staff':
        return '/api/attendance/sales-staff';
      case 'team_leader':
        return '/api/attendance/team-leader';
      default:
        return '/api/attendance/user';
    }
  };

  const {
    data: attendanceRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/attendance', date],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/attendance');
      const data = await response.json();
      return data.attendance || [];
    },
    enabled: !!user,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/attendance', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Attendance marked',
        description: 'Your attendance has been recorded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const excuseAbsenceMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      const response = await apiRequest('PUT', `/api/attendance/${id}/excuse`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Absence excused',
        description: 'The absence has been excused successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setExcuseDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to excuse absence. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<Attendance>[] = [
    // For managers and sales staff, show user column
    ...(user?.role === 'manager' || user?.role === 'sales_staff' || user?.role === 'team_leader' ? [
      {
        accessorKey: 'user',
        header: 'User',
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
      } as ColumnDef<Attendance>,
    ] : []),
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.getValue('date') as string;
        return date ? format(new Date(date), 'PPP') : '-';
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
    },
    {
      accessorKey: 'sector',
      header: 'Sector',
      cell: ({ row }) => {
        const sector = row.getValue('sector') as string;
        return sector ? sector.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-';
      },
    },
    {
      accessorKey: 'isPresent',
      header: 'Status',
      cell: ({ row }) => {
        const isPresent = row.getValue('isPresent') as boolean;
        const isExcused = row.getValue('isExcused') as boolean;
        
        if (isPresent) {
          return (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Present
            </Badge>
          );
        } else if (isExcused) {
          return (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Excused
            </Badge>
          );
        } else {
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Absent
            </Badge>
          );
        }
      },
    },
    ...(user?.role === 'manager' || user?.role === 'sales_staff' ? [
      {
        id: 'actions',
        cell: ({ row }) => {
          const attendance = row.original;
          if (!attendance.isPresent && !attendance.isExcused) {
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAttendance(attendance);
                  setExcuseDialogOpen(true);
                }}
              >
                Excuse Absence
              </Button>
            );
          }
          return null;
        },
      } as ColumnDef<Attendance>,
    ] : []),
  ];

  const filteredAttendance = () => {
    if (activeTab === 'all') return attendanceRecords;
    else if (activeTab === 'present') return attendanceRecords?.filter(record => record.isPresent);
    else if (activeTab === 'absent') return attendanceRecords?.filter(record => !record.isPresent && !record.isExcused);
    else return attendanceRecords?.filter(record => record.isExcused);
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load attendance records</CardDescription>
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
                  queryClient.invalidateQueries({ queryKey: ['/api/attendance'] })
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
              <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
              <p className="text-muted-foreground">
                {user?.role === 'manager' ? 'Monitor attendance records for your sales staff and agents.' :
                 user?.role === 'sales_staff' ? 'Manage attendance records for your agents.' :
                 user?.role === 'team_leader' ? 'View your team\'s attendance records.' :
                 'Track your attendance history.'}
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
              
              {/* Mark Attendance button - only visible to agents */}
              {['individual_agent', 'team_leader', 'sales_agent'].includes(user?.role || '') && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Clock className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mark Your Attendance</DialogTitle>
                      <DialogDescription>
                        Record your attendance for today.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-center text-muted-foreground">
                        Attendance form will be implemented here.
                      </p>
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
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="present">Present</TabsTrigger>
              <TabsTrigger value="absent">Absent</TabsTrigger>
              <TabsTrigger value="excused">Excused</TabsTrigger>
            </TabsList>
          </Tabs>

          <DataTable
            columns={columns}
            data={filteredAttendance() || []}
            searchColumn={user?.role === 'manager' || user?.role === 'sales_staff' ? 'user.workId' : 'date'}
            searchPlaceholder={user?.role === 'manager' || user?.role === 'sales_staff' ? "Search by Work ID..." : "Search by date..."}
            loading={isLoading}
            emptyMessage="No attendance records found."
          />

          {/* Excuse Absence Dialog */}
          <Dialog open={excuseDialogOpen} onOpenChange={setExcuseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excuse Absence</DialogTitle>
                <DialogDescription>
                  Provide a reason for excusing this absence.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-center text-muted-foreground">
                  Excuse absence form will be implemented here.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setExcuseDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedAttendance) {
                        excuseAbsenceMutation.mutate({
                          id: selectedAttendance.id,
                          reason: 'Absence excused by administrator',
                        });
                      }
                    }}
                    disabled={excuseAbsenceMutation.isPending}
                  >
                    {excuseAbsenceMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Excuse Absence
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
