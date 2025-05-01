import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Edit, Ban, CheckCircle, MoreVertical, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import UserForm from "./UserForm";

interface UserTableProps {
  users?: User[];
  isLoading?: boolean;
  showActions?: boolean;
}

export default function UserTable({ users, isLoading, showActions = false }: UserTableProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [userToEnable, setUserToEnable] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Disable user mutation
  const disableUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('PUT', `/api/users/${userId}/disable`, {}),
    onSuccess: () => {
      toast({
        title: "User Disabled",
        description: "The user has been disabled successfully.",
      });
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-role'] });
      setUserToDisable(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Disable User",
        description: error.message || "There was a problem disabling the user.",
        variant: "destructive",
      });
    }
  });

  // Enable user mutation
  const enableUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('PUT', `/api/users/${userId}/enable`, {}),
    onSuccess: () => {
      toast({
        title: "User Enabled",
        description: "The user has been enabled successfully.",
      });
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-role'] });
      setUserToEnable(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Enable User",
        description: error.message || "There was a problem enabling the user.",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) => 
      apiRequest('PUT', `/api/users/${id}`, userData),
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "The user has been updated successfully.",
      });
      // Refresh the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users/by-role'] });
      setUserToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update User",
        description: error.message || "There was a problem updating the user.",
        variant: "destructive",
      });
    }
  });

  // Handle user update
  const handleUpdateUser = (data: any) => {
    if (!userToEdit) return;
    updateUserMutation.mutate({ id: userToEdit.id, userData: data });
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

  if (!users || users.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Name</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Work ID</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Email</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Phone</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Status</th>
            {currentUser?.role === 'admin' && (
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Staff Count</th>
            )}
            {showActions && (
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="py-4 px-6">
                <div className="flex items-center">
                  <UserAvatar user={user} size="sm" className="mr-3" />
                  <div>
                    <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500">{user.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6 text-sm text-slate-700">{user.workId}</td>
              <td className="py-4 px-6 text-sm text-slate-700">{user.email}</td>
              <td className="py-4 px-6 text-sm text-slate-700">{user.phoneNumber}</td>
              <td className="py-4 px-6">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  user.status === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </td>
              {currentUser?.role === 'admin' && (
                <td className="py-4 px-6 text-sm text-slate-700">
                  {user.role === 'manager' ? '12' : '-'}
                </td>
              )}
              {showActions && (
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-blue-600" 
                          title="Edit"
                          onClick={() => setUserToEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                        </DialogHeader>
                        {userToEdit && (
                          <UserForm 
                            user={userToEdit} 
                            onSubmit={handleUpdateUser} 
                            isSubmitting={updateUserMutation.isPending}
                            isEditing={true}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {user.status === 'active' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-red-600" 
                            title="Disable"
                            onClick={() => setUserToDisable(user)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disable User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to disable {user.firstName} {user.lastName}? 
                              They will no longer be able to log in to the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => disableUserMutation.mutate(user.id)}
                            >
                              {disableUserMutation.isPending ? "Disabling..." : "Disable"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-green-600" 
                            title="Enable"
                            onClick={() => setUserToEnable(user)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Enable User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to enable {user.firstName} {user.lastName}? 
                              They will be able to log in to the system again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => enableUserMutation.mutate(user.id)}
                            >
                              {enableUserMutation.isPending ? "Enabling..." : "Enable"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-slate-700" 
                          title="More"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={`/users/${user.id}`}>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
