import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Client } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Edit, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientListProps {
  clients?: Client[];
  isLoading?: boolean;
  onAddNew?: () => void;
}

export default function ClientList({ clients, isLoading, onAddNew }: ClientListProps) {
  const { toast } = useToast();
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: (clientId: number) => 
      apiRequest('DELETE', `/api/clients/${clientId}`, {}),
    onSuccess: () => {
      toast({
        title: "Client Deleted",
        description: "The client has been deleted successfully.",
      });
      // Refresh the clients list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setClientToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Client",
        description: error.message || "There was a problem deleting the client.",
        variant: "destructive",
      });
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, clientData }: { id: number; clientData: any }) => 
      apiRequest('PUT', `/api/clients/${id}`, clientData),
    onSuccess: () => {
      toast({
        title: "Client Updated",
        description: "The client has been updated successfully.",
      });
      // Refresh the clients list
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setClientToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Client",
        description: error.message || "There was a problem updating the client.",
        variant: "destructive",
      });
    }
  });

  // Handle client update
  const handleUpdateClient = (data: any) => {
    if (!clientToEdit) return;
    updateClientMutation.mutate({ id: clientToEdit.id, clientData: data });
  };

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'salary_deduction': return 'Salary Deduction';
      case 'bank': return 'Bank';
      case 'momo': return 'MoMo';
      default: return method;
    }
  };

  // Format insurance type for display
  const formatInsuranceType = (type: string) => {
    switch (type) {
      case 'education': return 'Education';
      case 'intego': return 'Intego';
      case 'family_insurance': return 'Family Insurance';
      case 'epi': return 'EPI';
      case 'nkunganire_shoferi': return 'Nkunganire Shoferi';
      case 'umurage_amashuri': return 'Umurage Amashuri';
      case 'ikimina': return 'Ikimina';
      case 'others': return 'Others';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="p-6 text-center">
        <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-medium text-slate-700 mb-1">No Clients Yet</h3>
        <p className="text-sm text-slate-500 mb-4">
          You haven't added any clients yet. Start adding clients to track your progress.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={onAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm onSubmit={() => {}} isSubmitting={false} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {clients.map((client) => (
          <Card key={client.id} className="p-4 hover:bg-slate-50">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-3 md:mb-0">
                <div className="flex items-center">
                  <h3 className="font-medium text-slate-800">{client.name}</h3>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formatInsuranceType(client.insuranceType)}
                  </span>
                </div>
                <div className="mt-1 text-sm space-y-1">
                  <p className="text-slate-500">
                    <span className="font-medium">National ID:</span> {client.nationalId}
                  </p>
                  <p className="text-slate-500">
                    <span className="font-medium">Contact:</span> {client.phoneNumber}
                    {client.email && ` • ${client.email}`}
                  </p>
                  <p className="text-slate-500">
                    <span className="font-medium">Payment:</span> {formatPaymentMethod(client.paymentMethod)} • 
                    <span className="font-medium text-green-600"> RWF {client.amount.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Added {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-blue-600" 
                          title="Edit Client"
                          onClick={() => setClientToEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Client</DialogTitle>
                        </DialogHeader>
                        {clientToEdit && (
                          <ClientForm 
                            client={clientToEdit} 
                            onSubmit={handleUpdateClient} 
                            isSubmitting={updateClientMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-red-600" 
                          title="Delete Client"
                          onClick={() => setClientToDelete(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Client</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {client.name}'s record?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteClientMutation.mutate(client.id)}
                          >
                            {deleteClientMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={onAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm onSubmit={() => {}} isSubmitting={false} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
