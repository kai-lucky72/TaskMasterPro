import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsuranceType, PaymentMethod } from "@/types";

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

interface ClientFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  client?: {
    name: string;
    nationalId: string;
    phoneNumber: string;
    email?: string;
    insuranceType: InsuranceType;
    paymentMethod: PaymentMethod;
    amount: number;
  };
}

export default function ClientForm({ onSubmit, isSubmitting, client }: ClientFormProps) {
  // Form schema
  const formSchema = z.object({
    name: z.string().min(1, "Client name is required"),
    nationalId: z.string().min(1, "National ID is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal('')),
    insuranceType: z.enum([
      'education', 'intego', 'family_insurance', 'epi', 
      'nkunganire_shoferi', 'umurage_amashuri', 'ikimina', 'others'
    ]),
    paymentMethod: z.enum(['salary_deduction', 'bank', 'momo']),
    amount: z.coerce.number().min(1, "Amount must be greater than 0")
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || '',
      nationalId: client?.nationalId || '',
      phoneNumber: client?.phoneNumber || '',
      email: client?.email || '',
      insuranceType: client?.insuranceType || 'education',
      paymentMethod: client?.paymentMethod || 'bank',
      amount: client?.amount || 0
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter client name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Enter email address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="insuranceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="intego">Intego</SelectItem>
                  <SelectItem value="family_insurance">Family Insurance</SelectItem>
                  <SelectItem value="epi">EPI</SelectItem>
                  <SelectItem value="nkunganire_shoferi">Nkunganire Shoferi</SelectItem>
                  <SelectItem value="umurage_amashuri">Umurage Amashuri</SelectItem>
                  <SelectItem value="ikimina">Ikimina</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="salary_deduction">Salary Deduction</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="momo">MoMo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (RWF)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" placeholder="Enter amount" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : client ? "Update Client" : "Add Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
