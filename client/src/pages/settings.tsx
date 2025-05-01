import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/common/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  workId: string;
  role: string;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  // Form validation schema
  const profileSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
  });

  // Get profile data
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/profile');
      const data = await response.json();
      return data.user;
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest('PUT', '/api/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      refreshUser(); // Update the user context
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
    },
  });

  // Update form values when profile data loads
  useState(() => {
    if (profile && !isLoadingProfile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
    }
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  if (profileError) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load profile data</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                {profileError instanceof Error
                  ? profileError.message
                  : 'An unexpected error occurred'}
              </p>
              <Button
                className="mt-4"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['/api/profile'] })
                }
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Determine the allowed roles based on the application requirements
  const allowedRoles = [
    'admin',
    'manager',
    'sales_staff',
    'individual_agent',
    'team_leader',
    'sales_agent',
  ];

  return (
    <RoleGuard allowedRoles={allowedRoles} redirect="/">
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          <Tabs
            defaultValue="profile"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4">
                <TabsList className="flex flex-col h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="profile"
                    className="justify-start mb-1 p-3 h-auto data-[state=active]:bg-slate-100"
                  >
                    Profile Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    className="justify-start mb-1 p-3 h-auto data-[state=active]:bg-slate-100"
                  >
                    Change Password
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="justify-start mb-1 p-3 h-auto data-[state=active]:bg-slate-100"
                  >
                    Notification Preferences
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="md:w-3/4">
                <TabsContent value="profile" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information and contact details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingProfile ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Form {...profileForm}>
                          <form
                            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                            className="space-y-6"
                          >
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <FormField
                                  control={profileForm.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter your first name"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <FormField
                                  control={profileForm.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter your last name"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Work ID</Label>
                              <Input
                                value={profile?.workId || ''}
                                disabled
                                className="bg-slate-50"
                              />
                              <p className="text-sm text-muted-foreground">
                                Your Work ID cannot be changed.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Input
                                value={
                                  profile?.role
                                    .replace('_', ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                                  ''
                                }
                                disabled
                                className="bg-slate-50"
                              />
                              <p className="text-sm text-muted-foreground">
                                Your role is assigned by your administrator.
                              </p>
                            </div>

                            <Button
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Changes
                            </Button>
                          </form>
                        </Form>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="password" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center py-8 text-muted-foreground">
                        In this application, authentication uses Work ID and Email for login.
                        Password changes are not applicable.
                      </p>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('profile')}
                      >
                        Back to Profile
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Manage your notification settings and preferences.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center py-8 text-muted-foreground">
                        Notification preferences will be implemented in a future update.
                      </p>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('profile')}
                      >
                        Back to Profile
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
