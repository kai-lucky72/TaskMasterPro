import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, Link } from 'wouter';
import {
  Menu,
  X,
  Bell,
  User,
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  BarChart2,
  FileText,
  HelpCircle,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavItemsProps {
  toggleSidebar: () => void;
}

// Mobile navigation items component
const MobileNavItems = ({ toggleSidebar }: MobileNavItemsProps) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Define navigation items based on user role (same logic as in Sidebar)
  const getNavItems = () => {
    // Common items for all roles
    const commonItems = [
      {
        name: 'Dashboard',
        href: '/',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        name: 'Performance',
        href: '/performance',
        icon: <BarChart2 className="h-5 w-5" />,
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        name: 'Attendance',
        href: '/attendance',
        icon: <Calendar className="h-5 w-5" />,
      },
      {
        name: 'Messages',
        href: '/messages',
        icon: <MessageSquare className="h-5 w-5" />,
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: <Settings className="h-5 w-5" />,
      },
    ];

    // Role-specific items
    const roleItems: Record<string, Array<{ name: string; href: string; icon: JSX.Element }>> = {
      admin: [
        {
          name: 'Managers',
          href: '/managers',
          icon: <Users className="h-5 w-5" />,
        },
        {
          name: 'Help Requests',
          href: '/help-requests',
          icon: <HelpCircle className="h-5 w-5" />,
        },
        {
          name: 'Activities',
          href: '/activities',
          icon: <Activity className="h-5 w-5" />,
        },
      ],
      manager: [
        {
          name: 'Sales Staff',
          href: '/sales-staff',
          icon: <Users className="h-5 w-5" />,
        },
      ],
      sales_staff: [
        {
          name: 'Agents',
          href: '/agents',
          icon: <Users className="h-5 w-5" />,
        },
      ],
      team_leader: [
        {
          name: 'Team',
          href: '/team',
          icon: <Users className="h-5 w-5" />,
        },
      ],
    };

    // Include clients for relevant roles
    if (['sales_staff', 'team_leader', 'individual_agent', 'sales_agent'].includes(user?.role || '')) {
      commonItems.push({
        name: 'Clients',
        href: '/clients',
        icon: <ClipboardList className="h-5 w-5" />,
      });
    }

    return [...commonItems, ...(roleItems[user?.role || ''] || [])];
  };

  const navItems = getNavItems();

  return (
    <div className="px-3">
      <nav className="space-y-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    onClick={toggleSidebar}
                  >
                    <span className={`${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className="ml-3">{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout button */}
      <div className="mt-6 px-3">
        <button
          onClick={() => {
            logout();
            toggleSidebar();
          }}
          className="flex w-full items-center px-4 py-3 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
};

interface MobileNavProps {
  title?: string;
}

const MobileNav = ({ title }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 md:hidden flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex-1 px-4">
          {title && <h1 className="text-lg font-semibold text-gray-800">{title}</h1>}
        </div>

        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-60"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <div className="ml-3">
              <h1 className="font-bold text-lg">OrganizeHQ</h1>
              <p className="text-xs text-gray-500">{user?.role && user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="py-4">
          <MobileNavItems toggleSidebar={toggleSidebar} />
        </div>
      </div>
    </>
  );
};

export default MobileNav;