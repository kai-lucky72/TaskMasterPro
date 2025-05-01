import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';

interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
  user?: {
    workId: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function ActivitiesPage() {
  const { user } = useAuth();

  const {
    data: activityLogs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/activity-logs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/activity-logs');
      const data = await response.json();
      return data.activityLogs;
    },
    enabled: !!user && user.role === 'admin',
  });

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const userData = row.original.user;
        return userData ? (
          <div>
            <div className="font-semibold">{userData.workId}</div>
            <div className="text-xs text-muted-foreground">
              {userData.firstName} {userData.lastName}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">System</span>
        );
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.getValue('action') as string;
        return (
          <span className="font-medium">
            {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        );
      },
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const details = row.getValue('details') as string;
        return details || '-';
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? format(new Date(date), 'PPP p') : '-';
      },
    },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load activity logs</CardDescription>
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
        </div>
      </DashboardLayout>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">User Activities</h1>
            <p className="text-muted-foreground">
              Monitor user activities and system events.
            </p>
          </div>

          <DataTable
            columns={columns}
            data={activityLogs || []}
            searchColumn="action"
            searchPlaceholder="Search by action..."
            loading={isLoading}
            emptyMessage="No activity logs found."
          />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
