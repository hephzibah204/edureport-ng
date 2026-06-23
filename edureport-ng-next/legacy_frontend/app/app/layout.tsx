"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SchoolProvider, useSchool } from './SchoolContext';
import { ToastProvider } from './components/Toast';
import { 
  LayoutDashboard, BarChart3, GraduationCap, Users, 
  Library, FileEdit, FileText, Settings, LogOut, 
  Search, Bell, Plus, User, Rocket, School as SchoolIcon 
} from 'lucide-react';

function SchoolLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { school } = useSchool();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem("edu_session");
    window.location.href = "/login";
  };

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: <LayoutDashboard size={20} /> },
    { label: 'Analytics', path: '/app/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Academic Records', path: '/app/students', icon: <GraduationCap size={20} /> },
    { label: 'User Management', path: '/app/teachers', icon: <Users size={20} /> },
    { label: 'Resources', path: '/app/resources', icon: <Library size={20} /> },
    { label: 'Enter Scores', path: '/app/scores', icon: <FileEdit size={20} /> },
    { label: 'Report Sheet', path: '/app/report', icon: <FileText size={20} /> },
  ];

  return (
    <div className="min-h-screen text-on-surface bg-background font-body-md">
      <ToastProvider />
      
      {/* Global Navigation Shell */}
      <aside className="fixed left-0 top-0 h-screen w-72 p-unit-md flex flex-col gap-unit-md z-[60] bg-white/70 backdrop-blur-2xl border-r border-white/40 shadow-[20px_0_50px_-12px_rgba(0,0,0,0.08)] hidden md:flex">
        <div className="flex items-center gap-3 px-4 mb-unit-lg">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white">
            <SchoolIcon size={24} />
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-extrabold text-primary">ReportSheet</h1>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Enterprise Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`px-4 py-3 flex items-center gap-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary/10 text-primary translate-x-1' 
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {item.icon}
                <span className="font-label-md text-label-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto space-y-1 border-t border-white/40 pt-unit-md">
          <div className="px-4 mb-4">
             <div className="p-3 rounded-2xl bg-secondary-container/20 border border-secondary-container/30 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-primary/10 rotate-12 select-none"><Rocket size={60} /></div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Current Plan</div>
                  <div className="text-sm font-black text-on-surface mb-2">
                    {school?.plan === 'TRIAL' && '7-Day Trial'}
                    {school?.plan === 'STARTER' && 'Starter Plan'}
                    {school?.plan === 'LIFETIME' && 'Lifetime Access'}
                    {school?.plan === 'PRO' && 'Pro + AI'}
                  </div>
                  <Link href="/app/billing" className="text-[9px] font-black text-secondary uppercase tracking-wider underline hover:opacity-70 transition-opacity">Upgrade Now →</Link>
                </div>
              </div>
          </div>
          <Link href="/app/setup" className="text-on-surface-variant px-4 py-3 flex items-center gap-3 hover:bg-surface-container-low rounded-xl transition-all duration-300">
            <Settings size={20} />
            <span className="font-label-md text-label-md">School Setup</span>
          </Link>
          <button onClick={handleLogout} className="w-full text-error px-4 py-3 flex items-center gap-3 hover:bg-error-container/20 rounded-xl transition-all duration-300">
            <LogOut size={20} />
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </div>
      </aside>

      <main className="md:ml-[288px] min-h-screen pb-20">
        {/* Top App Bar */}
        <header className="sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-8 py-4 bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-b border-white/40 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-full border border-white/40 w-full max-w-md">
              <Search size={20} className="text-on-surface-variant" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-full ml-2 outline-none placeholder:text-on-surface-variant/50" 
                placeholder="Search student records, faculty or reports..." 
                type="text"
              />
            </div>
            <div className="md:hidden">
              <h1 className="text-headline-md font-extrabold text-primary">ReportSheet</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold border-2 border-primary/20 shrink-0">
                {school?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden lg:block">
                <p className="text-label-md font-label-md text-on-surface truncate max-w-[150px]">{school?.name || 'Administrator'}</p>
                <p className="text-label-sm font-label-sm text-on-surface-variant">Chief Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Navigation (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-white/40 px-6 py-3 flex justify-between items-center z-[60] pb-safe">
        <Link href="/app" className={`flex flex-col items-center gap-1 ${pathname === '/app' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <LayoutDashboard size={24} strokeWidth={pathname === '/app' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Dash</span>
        </Link>
        <Link href="/app/analytics" className={`flex flex-col items-center gap-1 ${pathname === '/app/analytics' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <BarChart3 size={24} strokeWidth={pathname === '/app/analytics' ? 2.5 : 2} />
          <span className="text-[10px]">Analytics</span>
        </Link>
        <Link href="/app/students" className="w-12 h-12 bg-primary rounded-full -mt-10 shadow-lg flex items-center justify-center text-white ring-4 ring-background transition-transform active:scale-95">
          <Plus size={24} />
        </Link>
        <Link href="/app/scores" className={`flex flex-col items-center gap-1 ${pathname === '/app/scores' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <GraduationCap size={24} strokeWidth={pathname === '/app/scores' ? 2.5 : 2} />
          <span className="text-[10px]">Records</span>
        </Link>
        <Link href="/app/profile" className={`flex flex-col items-center gap-1 ${pathname === '/app/profile' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <User size={24} strokeWidth={pathname === '/app/profile' ? 2.5 : 2} />
          <span className="text-[10px]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <SchoolProvider>
      <SchoolLayoutContent>
        {children}
      </SchoolLayoutContent>
    </SchoolProvider>
  );
}
