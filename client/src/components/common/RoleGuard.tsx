import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirect: string;
}

const RoleGuard = ({ children, allowedRoles, redirect }: RoleGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Redirect to={redirect} />;
  }

  // If allowedRoles is defined, check if user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  // User has permission, render the children
  return <>{children}</>;
};

export default RoleGuard;
