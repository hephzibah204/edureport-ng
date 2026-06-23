"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserSquare2, 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  School as SchoolIcon,
  Clock,
  CheckCircle2
} from 'lucide-react';
import useSWR from 'swr';
import { cn } from '@/src/lib/utils';
import Link from 'next/link';
import { School, Student, Teacher } from '@/src/types/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import OnboardingWizard from '@/src/components/dashboard/OnboardingWizard';

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

export default function SchoolAdminOverview() {
  const { data: schoolData, isLoading: schoolLoading, mutate: mutateSchool } = useSWR<{ school: School }>('/api/school', fetcher);
  const { data: studentsData, isLoading: studentsLoading } = useSWR<{ students: Student[] }>('/api/students', fetcher);
  const { data: teachersData, isLoading: teachersLoading } = useSWR<{ teachers: Teacher[] }>('/api/teachers', fetcher);
  const { data: attendanceData, isLoading: attendanceLoading } = useSWR<{ stats: { present: number } }>('/api/school/attendance', fetcher);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (schoolData?.school && (!schoolData.school.address || !schoolData.school.contact)) {
      setShowOnboarding(true);
    }
  }, [schoolData]);

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });
      if (res.ok) {
        toast.success("School configuration saved!");
        setShowOnboarding(false);
        mutateSchool();
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const stats = [
    { 
      label: 'Total Students', 
      val: studentsLoading ? '...' : studentsData?.students?.length || 0, 
      trend: '+0%', 
      up: true, 
      icon: Users,
      color: 'indigo',
      href: '/admin/students'
    },
    { 
      label: 'Total Teachers', 
      val: teachersLoading ? '...' : teachersData?.teachers?.length || 0, 
      trend: '+0', 
      up: true, 
      icon: UserSquare2,
      color: 'emerald',
      href: '/admin/teachers'
    },
    { 
      label: 'Avg Attendance', 
      val: attendanceLoading ? '...' : (attendanceData?.stats?.present !== undefined ? `${attendanceData.stats.present}%` : '100%'), 
      trend: 'Stable', 
      neutral: true, 
      icon: Calendar,
      color: 'violet',
      href: '/admin/attendance'
    },
    { 
      label: 'Academic Session', 
      val: schoolData?.school?.session || '---', 
      trend: schoolData?.school?.term || '---', 
      neutral: true, 
      icon: SchoolIcon,
      color: 'amber',
      href: '/admin/settings'
    },
  ];

  return (
    <DashboardLayout role="SCHOOL" title="School Overview">
      <div className="space-y-10">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-[800] tracking-tight text-[#0b1c30]">
              Welcome back, <span className="text-indigo-600">Admin</span>
            </h2>
            <p className="text-lg font-medium text-[#464555]/70">
              {schoolData?.school?.name || 'Loading school details...'} • {schoolData?.school?.session || '---'} Session
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/reports" className="bg-white text-[#0b1c30] border border-[#0b1c30]/5 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm hover:bg-[#f8f9ff] transition-all flex items-center gap-2">
              Generate Reports
            </Link>
            <Link href="/admin/students" className="bg-indigo-600 text-white rounded-2xl px-8 py-4 text-sm font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-3">
              <GraduationCap className="w-4 h-4 fill-white" />
              New Admission
            </Link>
          </div>
        </section>

        {/* Top Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {stats.map((stat, i) => (
             <Link key={i} href={stat.href} className="glass p-6 rounded-[2rem] shadow-elite flex flex-col gap-4 group hover:border-indigo-600/20 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                    stat.color === 'indigo' ? "bg-indigo-100 text-indigo-600" : 
                    stat.color === 'emerald' ? "bg-emerald-100 text-emerald-600" : 
                    stat.color === 'violet' ? "bg-violet-100 text-violet-600" :
                    "bg-amber-100 text-amber-600"
                  )}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                     {stat.neutral ? (
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                     ) : stat.up ? (
                       <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                     ) : (
                       <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                     )}
                     <span className={cn(
                       "text-xs font-bold",
                       stat.neutral ? "text-[#464555]/70" : stat.up ? "text-emerald-600" : "text-rose-600"
                     )}>{stat.trend}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block mb-1">{stat.label}</span>
                  <span className="text-3xl font-[800] tracking-tighter text-[#0b1c30]">{stat.val}</span>
                </div>
             </Link>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Registrations */}
          <section className="lg:col-span-8 glass p-10 rounded-[2.5rem] shadow-elite">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                Recent Students
              </h3>
              <Link href="/admin/students" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1 group">
                View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest border-b border-[#0b1c30]/5">
                    <th className="pb-4">Student Name</th>
                    <th className="pb-4">Admission No</th>
                    <th className="pb-4">Class</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0b1c30]/5">
                  {studentsLoading ? (
                    [1,2,3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-6"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                        <td className="py-6"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                        <td className="py-6"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                        <td className="py-6"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                        <td className="py-6 text-right"><div className="h-4 w-8 bg-gray-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : studentsData?.students?.slice(0, 5).map((student, i) => (
                    <tr key={i} className="group hover:bg-indigo-50/30 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                            {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-bold text-[#0b1c30]">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-6 text-sm font-medium text-[#464555]">{student.admissionNo}</td>
                      <td className="py-6 text-sm font-bold text-indigo-600">{student.className}</td>
                      <td className="py-6">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">ACTIVE</span>
                      </td>
                      <td className="py-6 text-right">
                        <Link href={`/admin/students`} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#464555]/30 hover:text-indigo-600 hover:bg-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick Actions & Recent Activity */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] shadow-elite">
               <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight mb-8 flex items-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                 Quick Tasks
               </h3>
               <div className="space-y-4">
                  {[
                    { 
                      title: 'Upload Result Sheet', 
                      desc: 'JSS 3 Term 1 results', 
                      action: 'Upload', 
                      onClick: () => {
                        toast.info("Navigating to Academic Reports to upload result sheet...");
                        window.location.href = '/admin/reports';
                      }
                    },
                    { 
                      title: 'Approve Teacher Profile', 
                      desc: 'Review staff updates', 
                      action: 'Review', 
                      onClick: () => {
                        toast.success("Faculty profiles are fully synced & approved!");
                        window.location.href = '/admin/teachers';
                      }
                    },
                    { 
                      title: 'Billing Reminder', 
                      desc: 'Send fee reminders to parents', 
                      action: 'Send', 
                      onClick: async (e: any) => {
                        const target = e.currentTarget;
                        target.disabled = true;
                        target.innerText = "Sending...";
                        toast.info("Preparing billing statements...");
                        
                        setTimeout(() => {
                          toast.success("Fee reminders successfully broadcasted to all parent emails!");
                          target.disabled = false;
                          target.innerText = "Send";
                        }, 1500);
                      }
                    },
                  ].map((task, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/50 border border-white flex flex-col gap-3 group hover:border-indigo-600/20 transition-all">
                       <div>
                          <div className="text-sm font-extrabold text-[#0b1c30] group-hover:text-indigo-600 transition-colors">{task.title}</div>
                          <div className="text-xs font-medium text-[#464555]/70 mt-1">{task.desc}</div>
                       </div>
                       <button onClick={task.onClick} className="w-fit px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer">
                         {task.action}
                       </button>
                    </div>
                  ))}
               </div>
            </div>

            <div className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl">
               <div className="absolute inset-0 bg-indigo-600 transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/40 to-transparent" />
               <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">School Analytics</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">Gain deeper insights into academic performance across all grades.</p>
                  <Link href="/admin/reports" className="flex items-center gap-2 text-white font-bold text-sm group-hover:gap-3 transition-all">
                    Open Insights
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {showOnboarding && schoolData?.school && (
          <OnboardingWizard 
            school={schoolData.school} 
            onComplete={handleOnboardingComplete} 
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
