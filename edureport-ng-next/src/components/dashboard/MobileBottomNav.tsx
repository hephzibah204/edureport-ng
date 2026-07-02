"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  Menu,
  School,
  Sparkles,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NavItem {
  icon: any;
  label: string;
  href: string;
}

const bottomNavItems: Record<string, NavItem[]> = {
  ADMIN: [
    { icon: LayoutDashboard, label: 'Overview', href: '/app/admin' },
    { icon: School, label: 'Schools', href: '/app/admin/schools' },
    { icon: Users, label: 'Users', href: '/app/admin/users' },
    { icon: BarChart3, label: 'Revenue', href: '/app/admin/billing' },
  ],
  SCHOOL: [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Users, label: 'Students', href: '/admin/students' },
    { icon: School, label: 'Teachers', href: '/admin/teachers' },
    { icon: BookOpen, label: 'Scores', href: '/admin/scores' },
    { icon: FileText, label: 'Reports', href: '/admin/reports' },
  ],
  TEACHER: [
    { icon: LayoutDashboard, label: 'Classes', href: '/teacher' },
    { icon: Calendar, label: 'Attendance', href: '/teacher/attendance' },
    { icon: BookOpen, label: 'Scores', href: '/teacher/scores' },
    { icon: Sparkles, label: 'Exams', href: '/exammaker' },
    { icon: BarChart3, label: 'Analytics', href: '/teacher/analytics' },
  ],
  PARENT: [
    { icon: LayoutDashboard, label: 'Overview', href: '/portal' },
    { icon: GraduationCap, label: 'Children', href: '/portal/children' },
    { icon: Calendar, label: 'Attendance', href: '/portal/attendance' },
    { icon: BarChart3, label: 'Performance', href: '/portal/performance' },
  ],
  STUDENT: [
    { icon: LayoutDashboard, label: 'Portal', href: '/portal' },
    { icon: Calendar, label: 'Attend.', href: '/portal/attendance' },
    { icon: BookOpen, label: 'Results', href: '/portal/results' },
    { icon: BarChart3, label: 'Perf.', href: '/portal/performance' },
  ],
};

interface MobileBottomNavProps {
  role: 'ADMIN' | 'TEACHER' | 'SCHOOL' | 'PARENT' | 'STUDENT';
  onMenuClick: () => void;
}

export const MobileBottomNav = ({ role, onMenuClick }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const items = bottomNavItems[role] || bottomNavItems.SCHOOL;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[150] lg:hidden bottom-nav-safe bg-white/90 backdrop-blur-2xl border-t border-[#0b1c30]/5 shadow-2xl shadow-black/10">
      <div className="flex items-center justify-around h-[64px] px-2">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-tap"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-0 w-8 h-[3px] bg-indigo-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-indigo-600" : "text-[#464555]/50"
              )} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors",
                isActive ? "text-indigo-600" : "text-[#464555]/40"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Menu button to open full sidebar */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-tap text-[#464555]/50"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#464555]/40">Menu</span>
        </button>
      </div>
    </nav>
  );
};
