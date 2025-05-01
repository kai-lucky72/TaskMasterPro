import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { roleColors } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { 
  LayoutDashboard, Users, HelpCircle, BarChart3, Settings, LogOut,
  Clock, UserCheck, FileText, MessageSquare, UserPlus, User, Briefcase
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuItems, setMenuItems] = useState<Array<{ icon: React.ReactNode; label: string; href: string }>>([]);

  useEffect(() => {
    if (!user) return;

    const items = [];
    
    // Common item for all roles
    items.push({ 
      icon: <LayoutDashboard className="w-5 h-5" />, 
      label: "Dashboard", 
      href: "/" 
    });

    // Role-specific menu items
    switch (user.role) {
      case "admin":
        items.push({ 
          icon: <Users className="w-5 h-5" />, 
          label: "Manage Managers", 
          href: "/managers" 
        });
        items.push({ 
          icon: <HelpCircle className="w-5 h-5" />, 
          label: "Help Requests", 
          href: "/help-requests" 
        });
        items.push({ 
          icon: <BarChart3 className="w-5 h-5" />, 
          label: "User Activities", 
          href: "/activities" 
        });
        break;
        
      case "manager":
        items.push({ 
          icon: <Users className="w-5 h-5" />, 
          label: "Sales Staff", 
          href: "/sales-staff" 
        });
        items.push({ 
          icon: <UserCheck className="w-5 h-5" />, 
          label: "Attendance", 
          href: "/attendance" 
        });
        items.push({ 
          icon: <BarChart3 className="w-5 h-5" />, 
          label: "Performance", 
          href: "/performance" 
        });
        items.push({ 
          icon: <FileText className="w-5 h-5" />, 
          label: "Reports", 
          href: "/reports" 
        });
        items.push({ 
          icon: <MessageSquare className="w-5 h-5" />, 
          label: "Messages", 
          href: "/messages" 
        });
        break;
        
      case "sales_staff":
        items.push({ 
          icon: <Users className="w-5 h-5" />, 
          label: "Agents", 
          href: "/agents" 
        });
        items.push({ 
          icon: <Clock className="w-5 h-5" />, 
          label: "Attendance", 
          href: "/attendance" 
        });
        items.push({ 
          icon: <BarChart3 className="w-5 h-5" />, 
          label: "Performance", 
          href: "/performance" 
        });
        items.push({ 
          icon: <FileText className="w-5 h-5" />, 
          label: "Reports", 
          href: "/reports" 
        });
        items.push({ 
          icon: <MessageSquare className="w-5 h-5" />, 
          label: "Messages", 
          href: "/messages" 
        });
        break;
        
      case "individual_agent":
        items.push({ 
          icon: <Clock className="w-5 h-5" />, 
          label: "Attendance", 
          href: "/attendance" 
        });
        items.push({ 
          icon: <Briefcase className="w-5 h-5" />, 
          label: "Clients", 
          href: "/clients" 
        });
        items.push({ 
          icon: <BarChart3 className="w-5 h-5" />, 
          label: "Performance", 
          href: "/performance" 
        });
        items.push({ 
          icon: <FileText className="w-5 h-5" />, 
          label: "Reports", 
          href: "/reports" 
        });
        items.push({ 
          icon: <MessageSquare className="w-5 h-5" />, 
          label: "Messages", 
          href: "/messages" 
        });
        break;
        
      case "team_leader":
        items.push({ 
          icon: <Clock className="w-5 h-5" />, 
          label: "Attendance", 
          href: "/attendance" 
        });
        items.push({ 
          icon: <Briefcase className="w-5 h-5" />, 
          label: "Clients", 
          href: "/clients" 
        });
        items.push({ 
          icon: <Users className="w-5 h-5" />, 
          label: "Team", 
          href: "/team" 
        });
        items.push({ 
          icon: <BarChart3 className="w-5 h-5" />, 
          label: "Performance", 
          href: "/performance" 
        });
        items.push({ 
          icon: <FileText className="w-5 h-5" />, 
          label: "Reports", 
          href: "/reports" 
        });
        items.push({ 
          icon: <MessageSquare className="w-5 h-5" />, 
          label: "Messages", 
          href: "/messages" 
        });
        break;
        
      case "sales_agent":
        items.push({ 
          icon: <Clock className="w-5 h-5" />, 
          label: "Attendance", 
          href: "/attendance" 
        });
        items.push({ 
          icon: <Briefcase className="w-5 h-5" />, 
          label: "Clients", 
          href: "/clients" 
        });
        items.push({ 
          icon: <BarChart3 className="w-5 h-5" />, 
          label: "Performance", 
          href: "/performance" 
        });
        items.push({ 
          icon: <FileText className="w-5 h-5" />, 
          label: "Reports", 
          href: "/reports" 
        });
        items.push({ 
          icon: <MessageSquare className="w-5 h-5" />, 
          label: "Messages", 
          href: "/messages" 
        });
        break;
    }

    // Common settings menu item
    items.push({ 
      icon: <Settings className="w-5 h-5" />, 
      label: "Settings", 
      href: "/settings" 
    });

    setMenuItems(items);
  }, [user]);

  if (!user) return null;

  const roleColor = roleColors[user.role];
  const headerGradient = { background: roleColor.gradient };

  return (
    <aside className={cn("flex flex-col bg-white border-r border-slate-200 w-64 h-full", className)}>
      <div className="p-4 text-white" style={headerGradient}>
        <h1 className="font-bold text-xl">OrganizationPro</h1>
        <p className="text-xs opacity-80 mt-1">
          {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard
        </p>
      </div>
      
      <div className="flex items-center px-4 py-4 border-b border-slate-200">
        <UserAvatar user={user} />
        <div className="ml-3">
          <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200",
                    location === item.href ? 
                      `${roleColor.background} text-${user.role === "admin" ? "blue" : user.role === "manager" ? "purple" : user.role === "sales_staff" ? "green" : "orange"}-700` : 
                      "hover:bg-slate-100"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start hover:bg-slate-100 px-4 py-3" 
          onClick={async () => await logout()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
