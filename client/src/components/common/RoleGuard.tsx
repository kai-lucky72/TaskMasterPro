import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirect?: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirect = "/login" 
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if user is not authenticated
      setLocation(redirect);
    } else if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to home if user is not authorized for this role
      setLocation("/");
    }
  }, [user, loading, allowedRoles, redirect, setLocation]);

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // If no user or not authorized, show nothing (redirect happens in useEffect)
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
