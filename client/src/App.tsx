import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/lib/protected-route";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { UserRole } from "@/types";

// Admin pages
import Managers from "@/pages/managers";
import HelpRequests from "@/pages/help-requests";
import Activities from "@/pages/activities";

// Manager pages
import SalesStaff from "@/pages/sales-staff";

// Common pages
import Performance from "@/pages/performance";
import Reports from "@/pages/reports";
import Attendance from "@/pages/attendance";
import Messages from "@/pages/messages";
import Clients from "@/pages/clients";
import Team from "@/pages/team";
import Agents from "@/pages/agents";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      
      {/* Protected routes with role-based access */}
      <ProtectedRoute path="/" component={Dashboard} />
      
      {/* Admin routes */}
      <ProtectedRoute 
        path="/managers" 
        component={Managers} 
        allowedRoles={["admin"] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/help-requests" 
        component={HelpRequests} 
        allowedRoles={["admin"] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/activities" 
        component={Activities} 
        allowedRoles={["admin"] as UserRole[]} 
      />

      {/* Manager routes */}
      <ProtectedRoute 
        path="/sales-staff" 
        component={SalesStaff} 
        allowedRoles={["manager"] as UserRole[]} 
      />

      {/* Sales Staff routes */}
      <ProtectedRoute 
        path="/agents" 
        component={Agents} 
        allowedRoles={["sales_staff"] as UserRole[]} 
      />

      {/* Team Leader routes */}
      <ProtectedRoute 
        path="/team" 
        component={Team} 
        allowedRoles={["team_leader"] as UserRole[]} 
      />

      {/* Common routes with role-specific content */}
      <ProtectedRoute 
        path="/performance" 
        component={Performance} 
        allowedRoles={[
          "manager", 
          "sales_staff", 
          "team_leader", 
          "individual_agent", 
          "sales_agent"
        ] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/reports" 
        component={Reports} 
        allowedRoles={[
          "manager", 
          "sales_staff", 
          "team_leader", 
          "individual_agent", 
          "sales_agent"
        ] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/attendance" 
        component={Attendance} 
        allowedRoles={[
          "manager", 
          "sales_staff", 
          "team_leader", 
          "individual_agent", 
          "sales_agent"
        ] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/messages" 
        component={Messages} 
        allowedRoles={[
          "admin",
          "manager", 
          "sales_staff", 
          "team_leader", 
          "individual_agent", 
          "sales_agent"
        ] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/clients" 
        component={Clients} 
        allowedRoles={[
          "sales_staff", 
          "team_leader", 
          "individual_agent", 
          "sales_agent"
        ] as UserRole[]} 
      />
      <ProtectedRoute 
        path="/settings" 
        component={Settings} 
      />

      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
