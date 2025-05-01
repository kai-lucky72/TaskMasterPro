import { useLocation, Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import {
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

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Define navigation items based on user role
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
    <aside className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo and Title */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">H</div>
        <div className="ml-3">
          <h1 className="font-bold text-lg">OrganizeHQ</h1>
          <p className="text-xs text-gray-500">{user?.role && user.role.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={`flex items-center px-4 py-2.5 text-sm rounded-lg transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
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
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => logout()}
          className="flex w-full items-center px-4 py-2.5 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
