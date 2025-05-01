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
import { Eye, Loader2, Phone, Plus, Trash } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phoneNumber: string;
  nationalId: string;
  insuranceType: string;
  paymentMethod: string;
  amount: number;
  agentId: number;
  createdAt: string;
  agent?: {
    firstName: string;
    lastName: string;
    workId: string;
  };
}

export default function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Different endpoints for different roles
  const getEndpoint = () => {
    switch (user?.role) {
      case 'sales_staff':
        return '/api/clients/sales-staff';
      case 'team_leader':
        return '/api/clients/team';
      default:
        return '/api/clients/agent';
    }
  };

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: [getEndpoint()],
    queryFn: async () => {
      const response = await apiRequest('GET', getEndpoint());
      const data = await response.json();
      return data.clients || [];
    },
    enabled: !!user,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Client added',
        description: 'The client has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [getEndpoint()] });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add client. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest('DELETE', `/api/clients/${clientId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Client deleted',
        description: 'The client has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [getEndpoint()] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const formatInsuranceType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: ColumnDef<Client>[] = [
    ...(user?.role === 'sales_staff' || user?.role === 'team_leader' ? [
      {
        accessorKey: 'agent',
        header: 'Agent',
        cell: ({ row }) => {
          const agent = row.original.agent;
          return agent ? (
            <div>
              <div className="font-semibold">{agent.firstName} {agent.lastName}</div>
              <div className="text-xs text-muted-foreground">{agent.workId}</div>
            </div>
          ) : (
            '-'
          );
        },
      } as ColumnDef<Client>,
    ] : []),
    {
      accessorKey: 'name',
      header: 'Client Name',
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone Number',
      cell: ({ row }) => {
        const phoneNumber = row.getValue('phoneNumber') as string;
        return (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{phoneNumber}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'insuranceType',
      header: 'Insurance Type',
      cell: ({ row }) => {
        const insuranceType = row.getValue('insuranceType') as string;
        return formatInsuranceType(insuranceType);
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        return formatCurrency(amount);
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return date ? format(new Date(date), 'PPP') : '-';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedClient(client);
                setViewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {/* Only agents can delete their own clients */}
            {['individual_agent', 'team_leader', 'sales_agent'].includes(user?.role || '') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteClientMutation.mutate(client.id)}
                disabled={deleteClientMutation.isPending}
              >
                {deleteClientMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
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
              <CardDescription>Failed to load clients</CardDescription>
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
                  queryClient.invalidateQueries({ queryKey: [getEndpoint()] })
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
  const allowedRoles = ['sales_staff', 'individual_agent', 'team_leader', 'sales_agent'];

  return (
    <RoleGuard allowedRoles={allowedRoles} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
              <p className="text-muted-foreground">
                {user?.role === 'sales_staff' ? 'Manage clients added by your agents.' :
                 user?.role === 'team_leader' ? 'Manage your team\'s clients.' :
                 'Manage your insurance clients.'}
              </p>
            </div>

            {/* Only agents can add clients */}
            {['individual_agent', 'team_leader', 'sales_agent'].includes(user?.role || '') && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Register a new insurance client.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-center text-muted-foreground">
                      Client creation form will be implemented here.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <DataTable
            columns={columns}
            data={clients || []}
            searchColumn="name"
            searchPlaceholder="Search by client name..."
            loading={isLoading}
            emptyMessage="No clients found."
          />

          {/* Client Details Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Client Details</DialogTitle>
                <DialogDescription>
                  Complete information about this client.
                </DialogDescription>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p>{selectedClient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">National ID</p>
                      <p>{selectedClient.nationalId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p>{selectedClient.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{selectedClient.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Insurance Type</p>
                      <p>{formatInsuranceType(selectedClient.insuranceType)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                      <p>{selectedClient.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount</p>
                      <p className="font-semibold">{formatCurrency(selectedClient.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Added On</p>
                      <p>{format(new Date(selectedClient.createdAt), 'PPP')}</p>
                    </div>
                  </div>

                  {/* Additional actions could be added here */}
                  <div className="pt-4 flex justify-end">
                    <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
