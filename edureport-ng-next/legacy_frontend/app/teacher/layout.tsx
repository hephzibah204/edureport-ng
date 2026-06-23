"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TeacherProvider, useTeacher } from './TeacherContext';

import { motion, AnimatePresence } from 'framer-motion';
import { ToastProvider } from '../app/components/Toast';

function TeacherLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, school, classes } = useTeacher();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Sync dark mode class
  React.useEffect(() => {
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem("edu_session");
    window.location.href = "/login";
  };

  const navItems = [
    { label: 'Dashboard', path: '/teacher', icon: '📊' },
    { label: 'Attendance', path: '/teacher/roster', icon: '🗓️' },
    { label: 'Scores', path: '/teacher/scores', icon: '📝' },
    { label: 'Comments', path: '/teacher/comments', icon: '💬' },
    { label: 'Settings', path: '/teacher/settings', icon: '⚙️' },
  ];

  return (
    <div className={`flex flex-col min-h-screen bg-background selection:bg-green selection:text-white transition-colors duration-300`}>
      <ToastProvider />
      
      {/* Top Bar */}
      <header className="topbar no-print !bg-white/80 dark:!bg-white/5 backdrop-blur-md border-b border-border z-[300]">
        <div className="flex items-center gap-6">
          <div className="tb-brand !text-ink">
            Report<span className="font-sans font-normal opacity-40">Sheet</span>
            <span className="ml-2 text-[10px] font-black uppercase text-gold bg-gold/10 px-2 py-0.5 rounded tracking-widest">Teacher</span>
          </div>
          <nav className="hidden lg:flex items-center text-[10px] font-bold text-muted uppercase tracking-tighter">
            <span>Staff Portal</span>
            <span className="mx-2 opacity-30">/</span>
            <span className="text-ink">{pathname === '/teacher' ? 'Overview' : pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
          </nav>
        </div>

        <div className="tb-right">
          <button 
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-panel hover:bg-border transition-colors text-lg"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          
          <div className="h-8 w-[1px] bg-border mx-1"></div>

          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-panel border border-border">
            <div className="w-7 h-7 rounded-lg bg-blue flex items-center justify-center text-white font-black text-[10px]">
              {user?.displayName?.charAt(0) || 'T'}
            </div>
            <div className="text-left leading-tight">
              <div className="text-[11px] font-black text-ink truncate max-w-[120px]">{user?.displayName || 'Loading…'}</div>
              <div className="text-[9px] font-bold text-muted uppercase tracking-wider">{school?.name || 'School Account'}</div>
            </div>
          </div>

          <button className="tb-btn !bg-red/5 !text-red !border-red/10 hover:!bg-red hover:!text-white" onClick={handleLogout}>
            <span className="text-sm">🚪</span>
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <aside className={`sidebar no-print glass dark:!bg-white/5 !border-r !border-border transition-all duration-300 ${isSidebarCollapsed ? 'w-[70px]' : 'w-[240px]'}`}>
          <div className="sb-section !pt-4">
            {!isSidebarCollapsed && <div className="sb-lbl !mb-3">Staff Menu</div>}
            <nav className="flex flex-col gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`nav-item !mx-2 !w-[calc(100%-1rem)] relative group ${pathname === item.path ? 'active' : ''}`}
                >
                  <span className="ni !text-lg">{item.icon}</span> 
                  {!isSidebarCollapsed && <span className="flex-1">{item.label}</span>}
                  
                  {pathname === item.path && (
                    <motion.div 
                      layoutId="active-nav-teacher"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}

                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-ink text-white text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[400]">
                      {item.label}
                    </div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="sb-divider !opacity-50"></div>
          
          {!isSidebarCollapsed && (
            <div className="sb-section">
              <div className="sb-lbl !mb-3">My Classes</div>
              <nav className="flex flex-col gap-1">
                {classes.length > 0 ? (
                  classes.map(cls => (
                    <Link
                      key={cls}
                      href={`/teacher/roster?className=${encodeURIComponent(cls)}`}
                      className={`nav-item !mx-2 !w-[calc(100%-1rem)] ${pathname === '/teacher/roster' && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('className') === cls ? 'active' : ''}`}
                    >
                      <span className="ni">🏷️</span> {cls}
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-2 text-[0.7rem] text-muted italic opacity-60 font-bold uppercase">No assignments</div>
                )}
              </nav>
            </div>
          )}

          <div className="mt-auto p-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full py-2 flex items-center justify-center rounded-xl bg-panel hover:bg-border transition-colors text-muted border border-border"
            >
              {isSidebarCollapsed ? '➡️' : '⬅️ Collapse'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main !bg-transparent">
          <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherProvider>
      <TeacherLayoutContent>
        {children}
      </TeacherLayoutContent>
    </TeacherProvider>
  );
}
