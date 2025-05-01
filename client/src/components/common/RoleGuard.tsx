import { ReactNode, useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirect: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirect 
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // If the user is not logged in and we're still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  // If the user is not logged in, redirect to the login page
  if (!user) {
    return <Redirect to={redirect} />;
  }

  // If specific roles are required, check if the user has one of them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to dashboard if the user doesn't have the required role
      return <Redirect to="/" />;
    }
  }

  // If the user is logged in and has the required role (or no specific role is required),
  // render the protected content
  return <>{children}</>;
}
