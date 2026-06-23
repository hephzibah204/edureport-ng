"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  School,
  FileText,
  Activity,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SidebarProps {
  role: 'ADMIN' | 'TEACHER' | 'SCHOOL' | 'PARENT' | 'STUDENT';
  collapsed?: boolean;
}

const menuItems = {
  ADMIN: [
    { icon: LayoutDashboard, label: 'Platform Overview', href: '/app/admin' },
    { icon: School, label: 'School Network', href: '/app/admin/schools' },
    { icon: Users, label: 'Platform Users', href: '/app/admin/users' },
    { icon: BarChart3, label: 'Revenue & Plans', href: '/app/admin/billing' },
    { icon: Megaphone, label: 'Broadcasts', href: '/app/admin/communications' },
    { icon: Activity, label: 'Audit Logs', href: '/app/admin/audit' },
    { icon: Settings, label: 'System Settings', href: '/app/admin/settings' },
  ],
  SCHOOL: [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
    { icon: Users, label: 'Students', href: '/admin/students' },
    { icon: Users, label: 'Parents', href: '/admin/parents' },
    { icon: School, label: 'Teachers', href: '/admin/teachers' },
    { icon: BookOpen, label: 'Score Entry', href: '/admin/scores' },
    { icon: Calendar, label: 'Attendance', href: '/admin/attendance' },
    { icon: FileText, label: 'Reports', href: '/admin/reports' },
    { icon: Sparkles, label: 'Exam Generator', href: '/exammaker' },
    { icon: BarChart3, label: 'Billing', href: '/admin/billing' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ],
  TEACHER: [
    { icon: LayoutDashboard, label: 'My Classes', href: '/teacher' },
    { icon: Calendar, label: 'Attendance', href: '/teacher/attendance' },
    { icon: BookOpen, label: 'Score Entry', href: '/teacher/scores' },
    { icon: Sparkles, label: 'Exam Generator', href: '/exammaker' },
    { icon: BarChart3, label: 'Performance', href: '/teacher/analytics' },
    { icon: Settings, label: 'My Profile', href: '/teacher/settings' },
  ],
  PARENT: [
    { icon: LayoutDashboard, label: 'Overview', href: '/portal' },
    { icon: GraduationCap, label: 'My Children', href: '/portal/children' },
    { icon: Calendar, label: 'Attendance', href: '/portal/attendance' },
    { icon: BarChart3, label: 'Performance', href: '/portal/performance' },
    { icon: Settings, label: 'Settings', href: '/portal/settings' },
  ],
  STUDENT: [
    { icon: LayoutDashboard, label: 'My Portal', href: '/portal' },
    { icon: Calendar, label: 'Attendance', href: '/portal/attendance' },
    { icon: BookOpen, label: 'My Results', href: '/portal/results' },
    { icon: BarChart3, label: 'Performance', href: '/portal/performance' },
    { icon: Settings, label: 'My Profile', href: '/portal/settings' },
  ],
};

export const Sidebar = ({ role, collapsed = false }: SidebarProps) => {
  const pathname = usePathname();
  const items = menuItems[role as keyof typeof menuItems] || menuItems.SCHOOL;

  return (
    <div className={cn(
      "h-screen flex flex-col glass border-r-0 rounded-r-[2.5rem] shadow-elite transition-all duration-500 z-50",
      collapsed ? "w-24" : "w-72"
    )}>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 flex-shrink-0">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          {!collapsed && (
            <span className="text-lg font-[800] tracking-tighter text-[#0b1c30]">ReportSheet</span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={cn(
                "group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden",
                isActive ? "text-indigo-600 bg-white shadow-sm" : "text-[#464555] hover:bg-white/50"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-full"
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive ? "text-indigo-600" : "text-[#464555]/60"
              )} />
              {!collapsed && (
                <span className={cn(
                  "text-sm font-bold tracking-tight",
                  isActive ? "text-[#0b1c30]" : "text-[#464555]"
                )}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <button className={cn(
          "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm",
          collapsed && "justify-center"
        )}>
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};
