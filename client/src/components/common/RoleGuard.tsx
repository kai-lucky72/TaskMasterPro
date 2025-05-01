import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirect?: string;
}

const RoleGuard = ({
  children,
  allowedRoles,
  redirect = '/login',
}: RoleGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Redirect to={redirect} />;
  }

  // If specific roles are required, check if the user has one of them
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user.role as UserRole);
    
    if (!hasRequiredRole) {
      // Redirect to dashboard if they don't have permission
      return <Redirect to="/" />;
    }
  }

  return <>{children}</>;
};

export default RoleGuard;
