import { useState } from 'react';
import { Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpRequest } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useApi } from '@/hooks/use-api';
import { Skeleton } from '@/components/ui/skeleton';

interface HelpRequestListProps {
  helpRequests?: HelpRequest[];
  isLoading: boolean;
  limit?: number;
  onRefresh?: () => void;
}

const HelpRequestList = ({
  helpRequests,
  isLoading,
  limit,
  onRefresh,
}: HelpRequestListProps) => {
  const { createMutation } = useApi();

  // Resolve help request mutation
  const resolveRequest = createMutation<{ id: number }, { success: boolean }>(
    'PUT',
    '/api/help-requests/resolve',
    {
      successMessage: 'Help request resolved successfully',
      invalidateQueries: '/api/help-requests',
      onSuccess: () => {
        if (onRefresh) onRefresh();
      },
    }
  );

  // Delete help request mutation
  const deleteRequest = createMutation<{ id: number }, { success: boolean }>(
    'DELETE',
    '/api/help-requests',
    {
      successMessage: 'Help request deleted successfully',
      invalidateQueries: '/api/help-requests',
      onSuccess: () => {
        if (onRefresh) onRefresh();
      },
    }
  );

  // Handle resolve help request
  const handleResolve = (id: number) => {
    resolveRequest.mutate({ id });
  };

  // Handle delete help request
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this help request?')) {
      deleteRequest.mutate({ id });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-16 w-full mt-2" />
              <div className="flex justify-end mt-4 space-x-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
      </div>
    );
  }

  // Render empty state
  if (!helpRequests || helpRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-gray-500">No help requests to display</p>
      </div>
    );
  }

  const displayRequests = limit ? helpRequests.slice(0, limit) : helpRequests;

  // Render help requests
  return (
    <div className="space-y-4 py-2">
      {displayRequests.map((request) => {
        const isPending = !request.resolvedById;
        return (
          <div
            key={request.id}
            className={`border ${isPending ? 'border-orange-200 bg-orange-50' : 'border-gray-200'} rounded-md p-4`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-sm">{request.email}</h4>
                <p className="text-xs text-gray-500">Work ID: {request.workId || 'Not provided'}</p>
              </div>
              <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                {isPending ? (
                  <span className="flex items-center text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                ) : (
                  <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3 mr-1" />
                    Resolved
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words">
              {request.message}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </div>
            {isPending && (
              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(request.id)}
                  disabled={deleteRequest.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleResolve(request.id)}
                  disabled={resolveRequest.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HelpRequestList;
