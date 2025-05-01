import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';

interface HelpRequest {
  id: number;
  workId: string;
  email: string;
  message: string;
  createdAt: string;
  resolvedById: number | null;
  resolvedAt: string | null;
}

export default function HelpRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: helpRequests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/help-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/help-requests');
      const data = await response.json();
      return data.helpRequests;
    },
    enabled: !!user && user.role === 'admin',
  });

  const resolveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest('PUT', `/api/help-requests/${requestId}/resolve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Request resolved',
        description: 'The help request has been marked as resolved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/help-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<HelpRequest>[] = [
    {
      accessorKey: 'workId',
      header: 'Work ID',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => {
        const message = row.getValue('message') as string;
        return (
          <div className="max-w-md truncate" title={message}>
            {message}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested At',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? format(new Date(date), 'PPP p') : '-';
      },
    },
    {
      accessorKey: 'resolvedAt',
      header: 'Status',
      cell: ({ row }) => {
        const resolvedAt = row.original.resolvedAt;
        return resolvedAt ? (
          <span className="text-green-600 font-medium">
            Resolved on {format(new Date(resolvedAt), 'PPP')}
          </span>
        ) : (
          <span className="text-orange-600 font-medium">Pending</span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original;
        if (request.resolvedAt) return null;
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resolveRequestMutation.mutate(request.id)}
            disabled={resolveRequestMutation.isPending}
          >
            {resolveRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Resolve
          </Button>
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
              <CardDescription>Failed to load help requests</CardDescription>
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
                  queryClient.invalidateQueries({ queryKey: ['/api/help-requests'] })
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
    <RoleGuard allowedRoles={['admin']} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Help Requests</h1>
            <p className="text-muted-foreground">
              Manage login help requests from users.
            </p>
          </div>

          <DataTable
            columns={columns}
            data={helpRequests || []}
            searchColumn="email"
            searchPlaceholder="Search by email..."
            loading={isLoading}
            emptyMessage="No help requests found."
          />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
