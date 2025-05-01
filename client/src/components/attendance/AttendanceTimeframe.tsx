import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { AttendanceTimeframe as TimeframeType } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
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
import { Clock, Trash2, Edit } from "lucide-react";

interface AttendanceTimeframeProps {
  timeframes?: TimeframeType[];
  isLoading?: boolean;
}

export default function AttendanceTimeframe({ timeframes, isLoading }: AttendanceTimeframeProps) {
  const { toast } = useToast();
  const [timeframeToDelete, setTimeframeToDelete] = useState<TimeframeType | null>(null);

  // Delete timeframe mutation
  const deleteTimeframeMutation = useMutation({
    mutationFn: (timeframeId: number) => 
      apiRequest('DELETE', `/api/attendance/timeframes/${timeframeId}`, {}),
    onSuccess: () => {
      toast({
        title: "Timeframe Deleted",
        description: "The attendance timeframe has been deleted successfully.",
      });
      // Refresh the timeframes list
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/timeframes'] });
      setTimeframeToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Timeframe",
        description: error.message || "There was a problem deleting the timeframe.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-slate-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!timeframes || timeframes.length === 0) {
    return (
      <div className="text-center py-10">
        <Clock className="mx-auto h-10 w-10 text-slate-400 mb-3" />
        <h3 className="text-lg font-medium text-slate-700 mb-1">No Timeframes Set</h3>
        <p className="text-sm text-slate-500 mb-4">
          Set timeframes for agents to mark their attendance.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Timeframe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Attendance Timeframe</DialogTitle>
            </DialogHeader>
            <TimeframeForm />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Check if a timeframe is currently active
  const isTimeframeActive = (timeframe: TimeframeType) => {
    const now = new Date();
    const start = new Date(timeframe.startTime);
    const end = new Date(timeframe.endTime);
    return now >= start && now <= end;
  };

  // Format dates for display
  const formatTimeframe = (timeframe: TimeframeType) => {
    const start = new Date(timeframe.startTime);
    const end = new Date(timeframe.endTime);
    return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <div className="space-y-4">
      {timeframes.map((timeframe) => (
        <Card key={timeframe.id} className={`border ${isTimeframeActive(timeframe) ? 'border-green-300 bg-green-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                  isTimeframeActive(timeframe) ? 'bg-green-500' : 'bg-slate-300'
                }`}></div>
                <div>
                  <p className="font-medium text-slate-800">
                    {formatTimeframe(timeframe)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isTimeframeActive(timeframe) ? 'Currently Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Timeframe</DialogTitle>
                    </DialogHeader>
                    <TimeframeForm timeframe={timeframe} />
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => setTimeframeToDelete(timeframe)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Timeframe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this timeframe?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => deleteTimeframeMutation.mutate(timeframe.id)}
                      >
                        {deleteTimeframeMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="text-center mt-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Timeframe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Attendance Timeframe</DialogTitle>
            </DialogHeader>
            <TimeframeForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Timeframe Form Component
function TimeframeForm({ timeframe }: { timeframe?: TimeframeType }) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(timeframe ? new Date(timeframe.startTime) : new Date());
  const [startTime, setStartTime] = useState(
    timeframe ? format(new Date(timeframe.startTime), 'HH:mm') : '09:00'
  );
  const [endDate, setEndDate] = useState(timeframe ? new Date(timeframe.endTime) : new Date());
  const [endTime, setEndTime] = useState(
    timeframe ? format(new Date(timeframe.endTime), 'HH:mm') : '17:00'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create or update timeframe mutation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Combine date and time for start and end
      const startDateTime = new Date(startDate);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);
      
      const endDateTime = new Date(endDate);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);
      
      if (endDateTime <= startDateTime) {
        toast({
          title: "Invalid Timeframe",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const timeframeData = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      };
      
      if (timeframe) {
        // Update existing timeframe
        await apiRequest('PUT', `/api/attendance/timeframes/${timeframe.id}`, timeframeData);
        toast({
          title: "Timeframe Updated",
          description: "The attendance timeframe has been updated successfully.",
        });
      } else {
        // Create new timeframe
        await apiRequest('POST', '/api/attendance/timeframes', timeframeData);
        toast({
          title: "Timeframe Added",
          description: "The attendance timeframe has been added successfully.",
        });
      }
      
      // Refresh the timeframes list
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/timeframes'] });
      
      // Close dialog
      const closeBtn = document.querySelector('[data-close-dialog]') as HTMLElement;
      if (closeBtn) closeBtn.click();
    } catch (error: any) {
      toast({
        title: "Failed to Save Timeframe",
        description: error.message || "There was a problem saving the timeframe.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            value={format(endDate, 'yyyy-MM-dd')}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" data-close-dialog>Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : timeframe ? "Update Timeframe" : "Add Timeframe"}
        </Button>
      </div>
    </form>
  );
}
