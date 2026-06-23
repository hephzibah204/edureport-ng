"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, School, Key, ClipboardList, 
  Megaphone, CreditCard, Puzzle, Users, 
  Tags, LineChart, Wrench, Settings, 
  Download, Moon, Sun, LogOut, ChevronRight, ChevronLeft 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('edu_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('edu_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('edu_theme', 'light');
    }
  };

  const navItems = [
    { label: 'Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'All Schools', path: '/admin/schools', icon: <School size={20} /> },
    { label: 'Licenses', path: '/admin/licenses', icon: <Key size={20} /> },
    { label: 'Activity Log', path: '/admin/activity', icon: <ClipboardList size={20} /> },
    { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={20} /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
    { label: 'Plans', path: '/admin/plans', icon: <Puzzle size={20} /> },
    { label: 'Access', path: '/admin/access', icon: <Users size={20} /> },
    { label: 'Coupons', path: '/admin/coupons', icon: <Tags size={20} /> },
    { label: 'Reports', path: '/admin/reports', icon: <LineChart size={20} /> },
  ];

  const systemItems = [
    { label: 'Maintenance', path: '/admin/maintenance', icon: <Wrench size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface transition-colors duration-300">
      
      {/* Top Bar */}
      <header className="sticky top-0 z-[300] flex justify-between items-center w-full px-6 py-3 bg-white/80 dark:bg-black/50 backdrop-blur-2xl border-b border-border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="font-extrabold text-xl text-primary tracking-tight">
            Report<span className="font-normal opacity-50">Sheet</span>
          </div>
          <nav className="hidden lg:flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
            <span>Admin Console</span>
            <span className="mx-2 opacity-30">/</span>
            <span className="text-foreground">{pathname === '/admin' ? 'Overview' : pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-variant transition-colors text-muted-foreground"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-error border border-error/20 bg-error/10 px-2 py-0.5 rounded-full">Admin</span>
          </div>

          <Link 
            href="/login" 
            aria-label="Sign Out"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-error/5 text-error hover:bg-error hover:text-white transition-colors border border-error/10"
            title="Sign Out"
          >
            <LogOut size={18} />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-58px)]">
        
        {/* Sidebar */}
        <aside className={`flex flex-col border-r border-border bg-card/50 backdrop-blur-md transition-all duration-300 z-50 ${isSidebarCollapsed ? 'w-[70px]' : 'w-[240px]'}`}>
          <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
            <div className="px-3">
              {!isSidebarCollapsed && <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3">Management</div>}
              <nav className="flex flex-col gap-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative group ${
                      pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center min-w-[20px]">
                      {item.icon}
                    </div>
                    {!isSidebarCollapsed && <span className="font-medium text-sm flex-1 truncate">{item.label}</span>}
                    
                    {pathname === item.path && (
                      <motion.div 
                        layoutId="active-admin-nav"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      />
                    )}

                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[400]">
                        {item.label}
                      </div>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="h-px w-full bg-border my-4"></div>
            
            <div className="px-3">
              {!isSidebarCollapsed && <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3">System</div>}
              <nav className="flex flex-col gap-1">
                {systemItems.map(item => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative group ${
                      pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center min-w-[20px]">
                      {item.icon}
                    </div>
                    {!isSidebarCollapsed && <span className="font-medium text-sm flex-1 truncate">{item.label}</span>}
                    
                    {pathname === item.path && (
                      <motion.div 
                        layoutId="active-admin-nav"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      />
                    )}

                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[400]">
                        {item.label}
                      </div>
                    )}
                  </Link>
                ))}
                
                <button className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-surface-container-low hover:text-foreground relative group`}>
                  <div className="flex items-center justify-center min-w-[20px]">
                    <Download size={20} />
                  </div>
                  {!isSidebarCollapsed && <span className="font-medium text-sm flex-1 text-left truncate">Export Data</span>}
                  {isSidebarCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[400]">
                        Export Data
                      </div>
                    )}
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full py-2 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-variant transition-colors text-muted-foreground border border-border"
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : (
                <div className="flex items-center gap-2">
                  <ChevronLeft size={18} />
                  <span className="text-sm font-medium">Collapse</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-background overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
