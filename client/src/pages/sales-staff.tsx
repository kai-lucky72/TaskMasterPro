import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, UserCheck, UserX } from 'lucide-react';
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

export default function SalesStaffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: salesStaff,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/users/by-role/sales_staff'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/by-role/sales_staff');
      const data = await response.json();
      return data.users;
    },
    enabled: !!user && user.role === 'manager',
  });

  const disableUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/disable`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Staff member disabled',
        description: 'The sales staff member has been disabled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-role/sales_staff'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable staff member. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const enableUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/enable`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Staff member enabled',
        description: 'The sales staff member has been enabled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-role/sales_staff'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable staff member. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'workId',
      header: 'Work ID',
    },
    {
      accessorKey: 'firstName',
      header: 'First Name',
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'active' ? 'success' : 'destructive'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? format(new Date(date), 'PPP') : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const salesStaffMember = row.original;
        return (
          <div className="flex space-x-2">
            {salesStaffMember.status === 'active' ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => disableUserMutation.mutate(salesStaffMember.id)}
                disabled={disableUserMutation.isPending}
              >
                {disableUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => enableUserMutation.mutate(salesStaffMember.id)}
                disabled={enableUserMutation.isPending}
              >
                {enableUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
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
              <CardDescription>Failed to load sales staff</CardDescription>
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
                  queryClient.invalidateQueries({ queryKey: ['/api/users/by-role/sales_staff'] })
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

  return (
    <RoleGuard allowedRoles={['manager']} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sales Staff</h1>
              <p className="text-muted-foreground">
                Manage your sales staff members and their access.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Sales Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Sales Staff</DialogTitle>
                  <DialogDescription>
                    Create a new sales staff account.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-center text-muted-foreground">
                    User creation form will be implemented here.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable
            columns={columns}
            data={salesStaff || []}
            searchColumn="workId"
            searchPlaceholder="Search by Work ID..."
            loading={isLoading}
            emptyMessage="No sales staff found."
          />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
