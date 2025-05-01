import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { roleColors } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { 
  LayoutDashboard, Users, HelpCircle, BarChart3, Settings, LogOut,
  Clock, UserCheck, FileText, MessageSquare, UserPlus, User, Briefcase,
  Menu, X
} from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MobileNav({ isOpen, onToggle }: MobileNavProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  if (!user) return null;

  const roleColor = roleColors[user.role];
  const headerGradient = { background: roleColor.gradient };

  let menuItems: Array<{ icon: React.ReactNode; label: string; href: string }> = [];
  
  // Common item for all roles
  menuItems.push({ 
    icon: <LayoutDashboard className="w-5 h-5" />, 
    label: "Dashboard", 
    href: "/" 
  });

  // Role-specific menu items
  switch (user.role) {
    case "admin":
      menuItems.push({ 
        icon: <Users className="w-5 h-5" />, 
        label: "Manage Managers", 
        href: "/managers" 
      });
      menuItems.push({ 
        icon: <HelpCircle className="w-5 h-5" />, 
        label: "Help Requests", 
        href: "/help-requests" 
      });
      menuItems.push({ 
        icon: <BarChart3 className="w-5 h-5" />, 
        label: "User Activities", 
        href: "/activities" 
      });
      break;
      
    case "manager":
      menuItems.push({ 
        icon: <Users className="w-5 h-5" />, 
        label: "Sales Staff", 
        href: "/sales-staff" 
      });
      menuItems.push({ 
        icon: <UserCheck className="w-5 h-5" />, 
        label: "Attendance", 
        href: "/attendance" 
      });
      menuItems.push({ 
        icon: <BarChart3 className="w-5 h-5" />, 
        label: "Performance", 
        href: "/performance" 
      });
      menuItems.push({ 
        icon: <FileText className="w-5 h-5" />, 
        label: "Reports", 
        href: "/reports" 
      });
      menuItems.push({ 
        icon: <MessageSquare className="w-5 h-5" />, 
        label: "Messages", 
        href: "/messages" 
      });
      break;
      
    case "sales_staff":
      menuItems.push({ 
        icon: <Users className="w-5 h-5" />, 
        label: "Agents", 
        href: "/agents" 
      });
      menuItems.push({ 
        icon: <Clock className="w-5 h-5" />, 
        label: "Attendance", 
        href: "/attendance" 
      });
      menuItems.push({ 
        icon: <BarChart3 className="w-5 h-5" />, 
        label: "Performance", 
        href: "/performance" 
      });
      menuItems.push({ 
        icon: <FileText className="w-5 h-5" />, 
        label: "Reports", 
        href: "/reports" 
      });
      menuItems.push({ 
        icon: <MessageSquare className="w-5 h-5" />, 
        label: "Messages", 
        href: "/messages" 
      });
      break;
      
    case "individual_agent":
    case "sales_agent":
      menuItems.push({ 
        icon: <Clock className="w-5 h-5" />, 
        label: "Attendance", 
        href: "/attendance" 
      });
      menuItems.push({ 
        icon: <Briefcase className="w-5 h-5" />, 
        label: "Clients", 
        href: "/clients" 
      });
      menuItems.push({ 
        icon: <BarChart3 className="w-5 h-5" />, 
        label: "Performance", 
        href: "/performance" 
      });
      menuItems.push({ 
        icon: <FileText className="w-5 h-5" />, 
        label: "Reports", 
        href: "/reports" 
      });
      menuItems.push({ 
        icon: <MessageSquare className="w-5 h-5" />, 
        label: "Messages", 
        href: "/messages" 
      });
      break;
      
    case "team_leader":
      menuItems.push({ 
        icon: <Clock className="w-5 h-5" />, 
        label: "Attendance", 
        href: "/attendance" 
      });
      menuItems.push({ 
        icon: <Briefcase className="w-5 h-5" />, 
        label: "Clients", 
        href: "/clients" 
      });
      menuItems.push({ 
        icon: <Users className="w-5 h-5" />, 
        label: "Team", 
        href: "/team" 
      });
      menuItems.push({ 
        icon: <BarChart3 className="w-5 h-5" />, 
        label: "Performance", 
        href: "/performance" 
      });
      menuItems.push({ 
        icon: <FileText className="w-5 h-5" />, 
        label: "Reports", 
        href: "/reports" 
      });
      menuItems.push({ 
        icon: <MessageSquare className="w-5 h-5" />, 
        label: "Messages", 
        href: "/messages" 
      });
      break;
  }

  // Common settings menu item
  menuItems.push({ 
    icon: <Settings className="w-5 h-5" />, 
    label: "Settings", 
    href: "/settings" 
  });

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button 
            id="mobile-menu-button" 
            className="text-slate-700"
            onClick={onToggle}
          >
            <Menu />
          </button>
          <div>
            <h1 className="font-bold" style={{ color: roleColor.primary }}>
              OrganizationPro
            </h1>
          </div>
          <UserAvatar user={user} size="sm" />
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          id="mobile-menu" 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
        >
          <div className="bg-white w-64 h-full overflow-y-auto">
            <div className="p-4 text-white flex items-center justify-between" style={headerGradient}>
              <h1 className="font-bold text-xl">OrganizationPro</h1>
              <button 
                id="close-mobile-menu" 
                className="text-white"
                onClick={onToggle}
              >
                <X />
              </button>
            </div>
            
            <div className="flex items-center px-4 py-4 border-b border-slate-200">
              <UserAvatar user={user} />
              <div className="ml-3">
                <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            
            <nav className="py-4">
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
                        onClick={onToggle}
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
                onClick={async () => {
                  await logout();
                  onToggle();
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-10">
        <div className="flex items-center justify-around p-3">
          {menuItems.slice(0, 4).map((item, index) => (
            <Link key={index} href={item.href}>
              <a className={cn(
                "flex flex-col items-center",
                location === item.href ? 
                  `text-${user.role === "admin" ? "blue" : user.role === "manager" ? "purple" : user.role === "sales_staff" ? "green" : "orange"}-600` : 
                  "text-slate-500"
              )}>
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
