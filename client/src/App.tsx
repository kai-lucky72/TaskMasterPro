import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import RoleGuard from "@/components/common/RoleGuard";

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
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      
      {/* Dashboard route */}
      <Route path="/">
        <RoleGuard redirect="/login">
          <Dashboard />
        </RoleGuard>
      </Route>

      {/* Admin routes */}
      <Route path="/managers">
        <RoleGuard allowedRoles={["admin"]} redirect="/">
          <Managers />
        </RoleGuard>
      </Route>
      <Route path="/help-requests">
        <RoleGuard allowedRoles={["admin"]} redirect="/">
          <HelpRequests />
        </RoleGuard>
      </Route>
      <Route path="/activities">
        <RoleGuard allowedRoles={["admin"]} redirect="/">
          <Activities />
        </RoleGuard>
      </Route>

      {/* Manager routes */}
      <Route path="/sales-staff">
        <RoleGuard allowedRoles={["manager"]} redirect="/">
          <SalesStaff />
        </RoleGuard>
      </Route>

      {/* Sales Staff routes */}
      <Route path="/agents">
        <RoleGuard allowedRoles={["sales_staff"]} redirect="/">
          <Agents />
        </RoleGuard>
      </Route>

      {/* Team Leader routes */}
      <Route path="/team">
        <RoleGuard allowedRoles={["team_leader"]} redirect="/">
          <Team />
        </RoleGuard>
      </Route>

      {/* Common routes with role-specific content */}
      <Route path="/performance">
        <RoleGuard allowedRoles={["manager", "sales_staff", "team_leader", "individual_agent", "sales_agent"]} redirect="/">
          <Performance />
        </RoleGuard>
      </Route>
      <Route path="/reports">
        <RoleGuard allowedRoles={["manager", "sales_staff", "team_leader", "individual_agent", "sales_agent"]} redirect="/">
          <Reports />
        </RoleGuard>
      </Route>
      <Route path="/attendance">
        <RoleGuard allowedRoles={["manager", "sales_staff", "team_leader", "individual_agent", "sales_agent"]} redirect="/">
          <Attendance />
        </RoleGuard>
      </Route>
      <Route path="/messages">
        <RoleGuard allowedRoles={["manager", "sales_staff", "team_leader", "individual_agent", "sales_agent"]} redirect="/">
          <Messages />
        </RoleGuard>
      </Route>
      <Route path="/clients">
        <RoleGuard allowedRoles={["sales_staff", "team_leader", "individual_agent", "sales_agent"]} redirect="/">
          <Clients />
        </RoleGuard>
      </Route>
      <Route path="/settings">
        <RoleGuard redirect="/login">
          <Settings />
        </RoleGuard>
      </Route>

      {/* 404 route */}
      <Route>
        <NotFound />
      </Route>
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
