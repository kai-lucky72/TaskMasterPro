import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Report } from "@/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Edit, Trash2, PlusCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import ReportForm from "./ReportForm";

interface ReportListProps {
  reports?: Report[];
  isLoading?: boolean;
  onAddNew?: () => void;
}

export default function ReportList({ reports, isLoading, onAddNew }: ReportListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [reportToEdit, setReportToEdit] = useState<Report | null>(null);
  const [expandedReports, setExpandedReports] = useState<number[]>([]);

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (reportId: number) => 
      apiRequest('DELETE', `/api/reports/${reportId}`, {}),
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "The report has been deleted successfully.",
      });
      // Refresh the reports list
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setReportToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Report",
        description: error.message || "There was a problem deleting the report.",
        variant: "destructive",
      });
    }
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, reportData }: { id: number; reportData: any }) => 
      apiRequest('PUT', `/api/reports/${id}`, reportData),
    onSuccess: () => {
      toast({
        title: "Report Updated",
        description: "The report has been updated successfully.",
      });
      // Refresh the reports list
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setReportToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Report",
        description: error.message || "There was a problem updating the report.",
        variant: "destructive",
      });
    }
  });

  // Handle report update
  const handleUpdateReport = (data: any) => {
    if (!reportToEdit) return;
    updateReportMutation.mutate({ id: reportToEdit.id, reportData: data });
  };

  // Toggle report expansion
  const toggleExpand = (reportId: number) => {
    setExpandedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId) 
        : [...prev, reportId]
    );
  };

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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

  if (!reports || reports.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-medium text-slate-700 mb-1">No Reports Yet</h3>
        <p className="text-sm text-slate-500 mb-4">
          You haven't submitted any reports yet. Add a report to track your progress.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={onAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            {user && (
              <ReportForm 
                onSubmit={() => {}} 
                isSubmitting={false} 
                role={user.role}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-4 hover:bg-slate-50">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className="font-medium text-slate-800">{report.title}</h3>
                    <div className="ml-3">{getStatusBadge(report.status)}</div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDistanceToNow(new Date(report.submissionDate), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-500" 
                    onClick={() => toggleExpand(report.id)}
                  >
                    {expandedReports.includes(report.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {report.status === 'pending' && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-blue-600" 
                            title="Edit Report"
                            onClick={() => setReportToEdit(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Report</DialogTitle>
                          </DialogHeader>
                          {reportToEdit && user && (
                            <ReportForm 
                              report={reportToEdit} 
                              onSubmit={handleUpdateReport} 
                              isSubmitting={updateReportMutation.isPending}
                              role={user.role}
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
                            title="Delete Report"
                            onClick={() => setReportToDelete(report)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this report?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteReportMutation.mutate(report.id)}
                            >
                              {deleteReportMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
              
              {expandedReports.includes(report.id) && (
                <div className="mt-4 p-3 bg-slate-100 rounded-md">
                  <p className="text-sm text-slate-700 whitespace-pre-line">{report.content}</p>
                  
                  {(report.teamLeaderId || report.salesStaffId || report.managerId) && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500">
                        {report.teamLeaderId && <span>Sent to Team Leader • </span>}
                        {report.salesStaffId && <span>Forwarded to Sales Staff • </span>}
                        {report.managerId && <span>Forwarded to Manager • </span>}
                        Status: {report.status}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={onAddNew}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            {user && (
              <ReportForm 
                onSubmit={() => {}} 
                isSubmitting={false} 
                role={user.role}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
