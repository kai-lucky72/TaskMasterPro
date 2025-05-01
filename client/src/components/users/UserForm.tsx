import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { User, UserRole } from "@/types";

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

interface UserFormProps {
  user?: User;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
}

export default function UserForm({ user, onSubmit, isSubmitting, isEditing = false }: UserFormProps) {
  const { user: currentUser } = useAuth();

  // User role options based on current user's role
  const getRoleOptions = (): { value: UserRole; label: string }[] => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'admin':
        return [{ value: 'manager', label: 'Manager' }];
      case 'manager':
        return [{ value: 'sales_staff', label: 'Sales Staff' }];
      case 'sales_staff':
        return [
          { value: 'individual_agent', label: 'Individual Agent' },
          { value: 'team_leader', label: 'Team Leader' },
          { value: 'sales_agent', label: 'Sales Agent' }
        ];
      default:
        return [];
    }
  };

  // Form schema
  const formSchema = z.object({
    workId: z.string().min(1, "Work ID is required"),
    email: z.string().email("Invalid email format"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    nationalId: z.string().min(1, "National ID is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    role: isEditing ? z.string().optional() : z.enum(['manager', 'sales_staff', 'individual_agent', 'team_leader', 'sales_agent'])
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workId: user?.workId || '',
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      nationalId: user?.nationalId || '',
      phoneNumber: user?.phoneNumber || '',
      role: user?.role || (currentUser?.role === 'admin' ? 'manager' : 
             currentUser?.role === 'manager' ? 'sales_staff' : 'individual_agent')
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="workId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work ID</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Enter work ID" 
                    disabled={isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="email" 
                    placeholder="Enter email address"
                    disabled={isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter last name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nationalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter national ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter phone number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {!isEditing && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getRoleOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
