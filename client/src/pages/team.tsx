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
import { Loader2, UserCheck, UserX } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: teamMembers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/team/members'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/team/members');
      const data = await response.json();
      return data.members || [];
    },
    enabled: !!user && user.role === 'team_leader',
  });

  const disableUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/disable`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Team member disabled',
        description: 'The team member has been disabled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable team member. Please try again.',
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
        title: 'Team member enabled',
        description: 'The team member has been enabled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team/members'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable team member. Please try again.',
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
      header: 'Joined',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? format(new Date(date), 'PPP') : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex space-x-2">
            {member.status === 'active' ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => disableUserMutation.mutate(member.id)}
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
                onClick={() => enableUserMutation.mutate(member.id)}
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
              <CardDescription>Failed to load team members</CardDescription>
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
                  queryClient.invalidateQueries({ queryKey: ['/api/team/members'] })
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
    <RoleGuard allowedRoles={['team_leader']} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
            <p className="text-muted-foreground">
              Manage your team members and their access.
            </p>
          </div>

          <DataTable
            columns={columns}
            data={teamMembers || []}
            searchColumn="workId"
            searchPlaceholder="Search by Work ID..."
            loading={isLoading}
            emptyMessage="No team members found."
          />

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>
                  Overview of your team's performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-medium text-muted-foreground">Reports Submitted</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <a href="/performance">View Detailed Performance</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
