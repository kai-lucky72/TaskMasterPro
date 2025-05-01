import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

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
          {/* Add mobile navigation items here - can be the same as Sidebar but
          with click handlers to close the sidebar after navigation */}
        </div>
      </div>
    </>
  );
};

export default MobileNav;
