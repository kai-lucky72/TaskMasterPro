import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  role: UserRole;
  report?: {
    title: string;
    content: string;
    teamLeaderId?: number;
  };
}

export default function ReportForm({ onSubmit, isSubmitting, role, report }: ReportFormProps) {
  const { user } = useAuth();
  
  // Fetch team leaders if the current user is a sales agent
  const { data: teamLeadersData } = useQuery({
    queryKey: ['/api/users/by-role/team_leader'],
    enabled: role === 'sales_agent'
  });

  // Form schema
  const formSchema = z.object({
    title: z.string().min(1, "Report title is required"),
    content: z.string().min(10, "Report content must be at least 10 characters"),
    teamLeaderId: role === 'sales_agent' 
      ? z.string().min(1, "Team leader is required")
      : z.string().optional()
  });

  // Setup form with conditional field based on role
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: report?.title || '',
      content: report?.content || '',
      teamLeaderId: report?.teamLeaderId?.toString() || ''
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert teamLeaderId to number if present
    const submissionData = {
      ...values,
      teamLeaderId: values.teamLeaderId ? parseInt(values.teamLeaderId) : undefined
    };
    
    onSubmit(submissionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter report title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {role === 'sales_agent' && (
          <FormField
            control={form.control}
            name="teamLeaderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Leader</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team leader" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teamLeadersData?.users?.map((leader: any) => (
                      <SelectItem key={leader.id} value={leader.id.toString()}>
                        {leader.firstName} {leader.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Content</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter report details here" 
                  rows={8}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : report ? "Update Report" : "Submit Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
