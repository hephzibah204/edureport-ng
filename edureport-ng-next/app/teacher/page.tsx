"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  BookOpen, 
  Edit, 
  TrendingUp, 
  TrendingDown, 
  Smile, 
  ChevronRight, 
  ClipboardList,
  AlertCircle,
  History,
  Zap,
  ArrowRight
} from 'lucide-react';
import useSWR from 'swr';
import { cn } from '@/src/lib/utils';
import { TeacherStatsResponse } from '@/src/types/api';
import { toast } from 'sonner';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json() as Promise<any>);

export default function TeacherOverview() {
  const { data: statsData } = useSWR<TeacherStatsResponse>('/api/teacher/api/stats', fetcher);
  const { data: classesData, isLoading: classesLoading } = useSWR<{ classes: { name: string }[] }>('/api/teacher/api/classes', fetcher);

  const stats = statsData?.stats || [
    { label: 'Average Grade', val: '--', trend: 'Updating...', neutral: true },
    { label: 'Avg Attendance', val: '--', trend: 'Updating...', neutral: true },
    { label: 'Engagement', val: '--', trend: 'Updating...', neutral: true },
    { label: 'Next Deadline', val: '--', trend: 'Check schedule', info: true },
  ];

  return (
    <DashboardLayout role="TEACHER" title="Academic Overview">
      <div className="space-y-10">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-[800] tracking-tight text-indigo-600">Good Morning, Professor.</h2>
            <p className="text-lg font-medium text-[#464555]/70">Here is a summary of your academic responsibilities for today.</p>
          </div>
          <Link href="/teacher/scores" className="bg-indigo-600 text-white rounded-2xl px-8 py-4 text-sm font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-3">
            <Edit className="w-4 h-4 fill-white" />
            Quick Score Entry
          </Link>
        </section>

        {/* Top Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {stats.map((stat: any, i: number) => (
             <div key={i} className="glass p-6 rounded-[2rem] shadow-elite flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">{stat.label}</span>
                <span className={cn("text-3xl font-[800] tracking-tighter", stat.info ? "text-indigo-600" : "text-[#0b1c30]")}>{stat.val}</span>
                <div className="flex items-center gap-1.5">
                   {stat.neutral ? (
                     <Smile className="w-3.5 h-3.5 text-indigo-600" />
                   ) : stat.info ? (
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                   ) : stat.up ? (
                     <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                   ) : (
                     <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                   )}
                   <span className={cn(
                     "text-xs font-bold",
                     stat.neutral || stat.info ? "text-[#464555]/70" : stat.up ? "text-emerald-600" : "text-rose-600"
                   )}>{stat.trend}</span>
                </div>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Classes Roster */}
          <section className="lg:col-span-8 glass p-10 rounded-[2.5rem] shadow-elite">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                Assigned Classes
              </h3>
              <Link href="/teacher/attendance" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
            </div>

            <div className="space-y-4">
              {classesLoading ? (
                [1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white/50 animate-pulse">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                      <div className="h-3 w-48 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))
              ) : classesData?.classes?.length ? (
                classesData.classes.map((cls, i) => (
                  <Link 
                    key={i}
                    href={`/teacher/scores?className=${encodeURIComponent(cls.name)}`}
                    className="group flex items-center gap-6 p-6 rounded-3xl hover:bg-white transition-all duration-300 cursor-pointer border border-transparent hover:border-[#0b1c30]/5 hover:shadow-xl hover:shadow-black/5"
                  >
                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 bg-indigo-100 text-indigo-600">
                        <BookOpen className="w-6 h-6" />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-lg font-extrabold text-[#0b1c30] tracking-tight">{cls.name}</span>
                           <span className="text-xs font-bold text-indigo-600">Active</span>
                        </div>
                        <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: "100%" }}
                             transition={{ duration: 1.5, ease: "easeOut" }}
                             className="h-full rounded-full bg-indigo-600" 
                           />
                        </div>
                        <p className="text-xs font-medium text-[#464555]/60 mt-3">Click to manage scores and attendance</p>
                     </div>
                     <ChevronRight className="w-5 h-5 text-[#464555]/20 group-hover:text-indigo-600 transition-colors" />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-[#f8f9ff]/50 rounded-[2rem] border border-dashed border-[#0b1c30]/10">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
                    <BookOpen className="w-8 h-8 text-[#464555]/20" />
                  </div>
                  <p className="text-lg font-bold text-[#0b1c30]">No Classes Assigned</p>
                  <p className="text-sm font-medium text-[#464555]/60 max-w-xs text-center mt-2">
                    You haven&apos;t been assigned to any classes yet. Please contact the school administrator.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Sidebar Area: Tasks & Action */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] shadow-elite">
               <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight mb-8 flex items-center gap-3">
                 <ClipboardList className="w-5 h-5 text-indigo-600" />
                 Pending Tasks
               </h3>
               <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white/50 border border-white flex gap-4">
                     <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                     <div>
                        <div className="text-sm font-extrabold text-[#0b1c30]">Final Term Grading</div>
                        <div className="text-xs font-medium text-[#464555]/70 mt-1">Check papers for your sections</div>
                        <div className="mt-4 flex gap-2">
                           <Link href="/teacher/scores" className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors">Grade Now</Link>
                           <button 
                             onClick={() => toast.info("Task snoozed for later.")}
                             className="px-4 py-2 bg-white border border-[#0b1c30]/5 text-[#464555] text-[10px] font-bold rounded-lg hover:bg-[#f8f9ff] transition-colors"
                           >
                             Later
                           </button>
                        </div>
                     </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/30 opacity-60 flex gap-4">
                     <History className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                     <div>
                        <div className="text-sm font-extrabold text-[#0b1c30]">Lesson Plan Approval</div>
                        <div className="text-xs font-medium text-[#464555]/70 mt-1">Review upcoming curriculum</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl">
               <div className="absolute inset-0 bg-indigo-600 transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/40 to-transparent" />
               <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
                     <Zap className="w-6 h-6 fill-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">Batch Score Entry</h3>
                  <p className="text-white/70 text-sm font-medium leading-relaxed mb-6">Input semester grades for all sections in minutes.</p>
                  <Link href="/teacher/scores" className="flex items-center gap-2 text-white font-bold text-sm group-hover:gap-3 transition-all">
                    Launch Spreadsheet
                    <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

