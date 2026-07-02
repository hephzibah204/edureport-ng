"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  School,
  FileText,
  Activity,
  Megaphone,
  Sparkles,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const menuItems: Record<string, { icon: any; label: string; href: string }[]> = {
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

interface MobileSidebarProps {
  role: 'ADMIN' | 'TEACHER' | 'SCHOOL' | 'PARENT' | 'STUDENT';
  open: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ role, open, onClose }: MobileSidebarProps) => {
  const pathname = usePathname();
  const items = menuItems[role] || menuItems.SCHOOL;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm z-[200] lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-[280px] z-[201] flex flex-col glass border-r border-white/40 shadow-2xl lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 safe-top">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 flex-shrink-0">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <span className="text-lg font-[800] tracking-tighter text-[#0b1c30]">ReportSheet</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#464555] hover:bg-white/60 transition-colors min-tap"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto scroll-native pb-4">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all min-tap",
                      isActive
                        ? "text-indigo-600 bg-white shadow-sm"
                        : "text-[#464555] hover:bg-white/50"
                    )}
                  >
                    <span className={cn(
                      "w-1 h-6 rounded-full flex-shrink-0 transition-all",
                      isActive ? "bg-indigo-600" : "bg-transparent"
                    )} />
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-indigo-600" : "text-[#464555]/60"
                    )} />
                    <span className={cn(
                      "text-sm font-bold tracking-tight",
                      isActive ? "text-[#0b1c30]" : "text-[#464555]"
                    )}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sign Out */}
            <div className="p-6 border-t border-[#0b1c30]/5 safe-bottom">
              <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm min-tap">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
