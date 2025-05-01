import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <MobileNav title={title} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {title && (
            <h1 className="text-2xl font-bold text-gray-800 mb-6 hidden md:block">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>

      {/* Toaster notification component */}
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
