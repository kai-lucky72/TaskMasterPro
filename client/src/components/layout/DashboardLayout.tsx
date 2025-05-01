import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when switching to desktop view
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      
      if (
        mobileMenuOpen &&
        mobileMenu &&
        !mobileMenu.contains(event.target as Node) &&
        mobileMenuButton &&
        !mobileMenuButton.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />
      
      {/* Mobile Header */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-0 md:pt-0 pb-16 md:pb-0 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  );
}
