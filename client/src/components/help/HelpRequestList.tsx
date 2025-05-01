import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { HelpRequest } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

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
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HelpRequestListProps {
  helpRequests?: HelpRequest[];
  isLoading?: boolean;
}

export default function HelpRequestList({ helpRequests, isLoading }: HelpRequestListProps) {
  const { toast } = useToast();
  const [requestToResolve, setRequestToResolve] = useState<HelpRequest | null>(null);

  // Resolve help request mutation
  const resolveRequestMutation = useMutation({
    mutationFn: (requestId: number) => 
      apiRequest('PUT', `/api/help-requests/${requestId}/resolve`, {}),
    onSuccess: () => {
      toast({
        title: "Request Resolved",
        description: "The help request has been resolved successfully.",
      });
      // Refresh the help requests list
      queryClient.invalidateQueries({ queryKey: ['/api/help-requests'] });
      setRequestToResolve(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resolve Request",
        description: error.message || "There was a problem resolving the help request.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!helpRequests || helpRequests.length === 0) {
    return (
      <div className="p-6 text-center">
        <HelpCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-medium text-slate-700 mb-1">No Help Requests</h3>
        <p className="text-sm text-slate-500 mb-4">
          There are no login help requests at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {helpRequests.map((request) => (
        <div key={request.id} className="p-6 hover:bg-slate-50">
          <div className="flex items-start">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-slate-800">
                  {request.workId}
                </h4>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{request.message}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 px-2 py-1">
                  {request.email}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 ${
                    request.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
              {request.status === 'pending' && (
                <div className="mt-4 flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        onClick={() => setRequestToResolve(request)}
                      >
                        Resolve Issue
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resolve Help Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to mark this help request as resolved?
                          This will notify the system that the issue has been addressed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => resolveRequestMutation.mutate(request.id)}
                        >
                          {resolveRequestMutation.isPending ? "Resolving..." : "Resolve Request"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline">
                    Contact User
                  </Button>
                </div>
              )}
              {request.status === 'resolved' && request.resolvedAt && (
                <div className="mt-4 flex items-center text-xs text-slate-500">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  <span>
                    Resolved {formatDistanceToNow(new Date(request.resolvedAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
