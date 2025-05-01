import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, workId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch current user
  const { data: user, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/auth/me');
        const data = await res.json();
        return data.user as User;
      } catch (error) {
        // If not logged in, just return null without an error
        if ((error as Response)?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    // Don't refetch on window focus to avoid disrupting user flow
    refetchOnWindowFocus: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, workId }: { email: string; workId: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', { email, workId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      // Refetch user data after successful login
      refetch();
      toast({
        title: 'Login successful',
        description: 'You are now logged in',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout');
      return res.json();
    },
    onSuccess: () => {
      // Clear user data after logout
      queryClient.setQueryData(['/api/auth/me'], null);
      toast({
        title: 'Logout successful',
        description: 'You have been logged out',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Login function
  const login = async (email: string, workId: string) => {
    await loginMutation.mutateAsync({ email, workId });
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Function to refresh user data
  const refreshUser = () => refetch();

  // Update loading state when user data is fetched
  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  const value = {
    user: user || null,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
