import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { authService, loginSchema, helpRequestSchema } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      workId: '',
      email: '',
    },
  });

  const helpForm = useForm<z.infer<typeof helpRequestSchema>>({
    resolver: zodResolver(helpRequestSchema),
    defaultValues: {
      workId: '',
      email: '',
      message: '',
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values.workId, values.email);
      setLocation('/');
    } catch (error) {
      // Error is handled in the auth context
      console.error('Login submission error:', error);
    }
  };

  const onHelpSubmit = async (values: z.infer<typeof helpRequestSchema>) => {
    try {
      await authService.submitHelpRequest(values);
      setIsHelpModalOpen(false);
      helpForm.reset();
      
      toast({
        title: "Help request submitted",
        description: "An administrator will contact you shortly.",
      });
    } catch (error) {
      console.error('Help request submission error:', error);
      toast({
        title: "Request failed",
        description: "Failed to submit help request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div style={{ background: 'linear-gradient(to right, #2563eb, #1e40af)' }} className="p-6 text-white text-center">
            <h1 className="text-xl font-bold mb-2">OrganizationPro</h1>
            <p className="text-sm opacity-90">Hierarchical Management System</p>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-center">Sign In</h2>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="workId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your Work ID" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-4 text-center">
              <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Need help logging in?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Login Help</DialogTitle>
                    <DialogDescription>
                      Provide your details and describe the issue you're experiencing.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...helpForm}>
                    <form onSubmit={helpForm.handleSubmit(onHelpSubmit)} className="space-y-4">
                      <FormField
                        control={helpForm.control}
                        name="workId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your Work ID" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={helpForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={helpForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your issue" 
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-3">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          type="submit"
                          disabled={helpForm.formState.isSubmitting}
                        >
                          {helpForm.formState.isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
