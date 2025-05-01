import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AttendanceTimeframe } from "@/types";
import { format } from "date-fns";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AttendanceFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  isWithinTimeframe: boolean;
  timeframes?: AttendanceTimeframe[];
}

export default function AttendanceForm({ 
  onSubmit, 
  isSubmitting, 
  isWithinTimeframe,
  timeframes
}: AttendanceFormProps) {
  // Form schema
  const formSchema = z.object({
    sector: z.enum(['health', 'admin_staff', 'private_sectors', 'other']),
    location: z.string().min(1, "Location is required")
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sector: 'health',
      location: ''
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  // Format timeframe for display
  const formatTimeframe = (timeframe: AttendanceTimeframe) => {
    const start = new Date(timeframe.startTime);
    const end = new Date(timeframe.endTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };
  
  return (
    <div className="space-y-4">
      {!isWithinTimeframe && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Outside Timeframe</AlertTitle>
          <AlertDescription>
            You are outside the attendance marking timeframe. Your attendance will be marked as absent.
          </AlertDescription>
        </Alert>
      )}
      
      {timeframes && timeframes.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-1" /> Attendance Timeframes
          </h3>
          <div className="space-y-1 text-sm">
            {timeframes.map((timeframe) => (
              <div key={timeframe.id} className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isTimeframeActive(timeframe) ? 'bg-green-500' : 'bg-slate-300'
                }`}></div>
                <span>{formatTimeframe(timeframe)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sector</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sector" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="admin_staff">Admin Staff</SelectItem>
                    <SelectItem value="private_sectors">Private Sectors</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your current location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Mark Attendance"}
            </Button>
          </div>
        </form>
      </Form>
      
      <p className="text-sm text-slate-500 italic mt-4">
        Note: Your attendance will be recorded based on the current time. 
        {!isWithinTimeframe ? ' You will be marked as absent since you are outside the allowed timeframe.' : ''}
      </p>
    </div>
  );
}

// Helper to check if timeframe is currently active
function isTimeframeActive(timeframe: AttendanceTimeframe): boolean {
  const now = new Date();
  const start = new Date(timeframe.startTime);
  const end = new Date(timeframe.endTime);
  return now >= start && now <= end;
}
