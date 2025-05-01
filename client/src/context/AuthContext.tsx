import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn, queryClient } from '@/lib/queryClient';
import { User } from '@/types';
import { useApi } from '@/hooks/use-api';

type LoginCredentials = {
  email: string;
  workId: string;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { createMutation } = useApi();
  const [loading, setLoading] = useState(true);

  // Get the current authenticated user
  const {
    data: user,
    error,
    isLoading: queryLoading,
    refetch: refetchUser,
  } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    initialData: null, // Ensure user is never undefined
  });

  // Handle login mutation
  const loginMutation = createMutation<LoginCredentials, { user: User }>(
    'POST',
    '/api/auth/login',
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['/api/auth/me'], data.user);
      },
      successMessage: `Welcome back, ${user?.firstName || 'User'}`,
    }
  );

  // Handle logout mutation
  const logoutMutation = createMutation<void, void>(
    'POST',
    '/api/auth/logout',
    {
      onSuccess: () => {
        queryClient.setQueryData(['/api/auth/me'], null);
      },
      successMessage: 'You have been successfully logged out',
    }
  );

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  useEffect(() => {
    if (!queryLoading) {
      setLoading(false);
    }
  }, [queryLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || queryLoading || loginMutation.isPending || logoutMutation.isPending,
        error: error || loginMutation.error || logoutMutation.error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
