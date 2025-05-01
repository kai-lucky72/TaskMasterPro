import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Redirect, Route } from 'wouter';
import { UserRole } from '@/types';

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  allowedRoles?: UserRole[];
};

/**
 * Protected route component that checks if the user is authenticated
 * and has the required role(s) before rendering the component
 */
export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state while authentication status is being determined
  if (loading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // If allowedRoles is specified, check if the user has the required role(s)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. This area is restricted to
            {allowedRoles.length === 1
              ? ` ${allowedRoles[0]} users.`
              : ` ${allowedRoles.slice(0, -1).join(', ')} or ${allowedRoles[allowedRoles.length - 1]} users.`}
          </p>
          <Redirect to="/" />
        </div>
      </Route>
    );
  }

  // If the user is authenticated and has the required role(s), render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
