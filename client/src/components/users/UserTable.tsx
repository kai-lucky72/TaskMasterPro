import { useState } from 'react';
import { Link } from 'wouter';
import { MoreHorizontal, Edit, Power, Trash, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import UserAvatar from '@/components/layout/UserAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApi } from '@/hooks/use-api';

interface UserTableProps {
  users?: User[];
  isLoading: boolean;
  showActions?: boolean;
  onRefresh?: () => void;
}

const UserTable = ({ users, isLoading, showActions = true, onRefresh }: UserTableProps) => {
  const { createMutation } = useApi();
  
  // Enable/disable user mutation
  const toggleUserStatus = createMutation<{ id: number; status: 'active' | 'disabled' }, User>(
    'PUT',
    '/api/users/status',
    {
      successMessage: 'User status updated successfully',
      invalidateQueries: '/api/users',
      onSuccess: () => {
        if (onRefresh) onRefresh();
      },
    }
  );

  // Delete user mutation
  const deleteUser = createMutation<{ id: number }, { success: boolean }>(
    'DELETE',
    '/api/users',
    {
      successMessage: 'User deleted successfully',
      invalidateQueries: '/api/users',
      onSuccess: () => {
        if (onRefresh) onRefresh();
      },
    }
  );

  // Handle enable/disable user
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    toggleUserStatus.mutate({ id: user.id, status: newStatus });
  };

  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUser.mutate({ id: userId });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Work ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Role</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Status</th>
                {showActions && (
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="mt-1 h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    {showActions && (
                      <td className="p-4 align-middle">
                        <Skeleton className="h-8 w-8" />
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="flex h-40 w-full flex-col items-center justify-center p-6 text-center">
          <p className="mb-2 text-lg font-medium">No users found</p>
          <p className="text-sm text-slate-500">There are no users to display at this time.</p>
        </div>
      </div>
    );
  }

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Render user table
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">User</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Work ID</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Email</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Role</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Status</th>
              {showActions && (
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} />
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{user.phoneNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle font-mono text-xs">{user.workId}</td>
                <td className="p-4 align-middle">{user.email}</td>
                <td className="p-4 align-middle">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                    {formatRole(user.role)}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                {showActions && (
                  <td className="p-4 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/users/${user.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/users/${user.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggleUserStatus.isPending}
                        >
                          {user.status === 'active' ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUser.isPending}
                          className="text-red-600 focus:bg-red-50 focus:text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
