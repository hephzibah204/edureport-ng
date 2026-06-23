"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  BookOpen,
  Award
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

import useSWR from 'swr';
import { TeacherStatsResponse } from '@/src/types/api';

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

export default function TeacherAnalytics() {
  const { data: statsData, isLoading } = useSWR<TeacherStatsResponse>('/api/teacher/api/stats', fetcher);

  const stats = statsData?.stats || [];
  const avgGrade = stats.find(s => s.label === 'Average Grade')?.val || '--';
  const attendance = stats.find(s => s.label === 'Avg Attendance')?.val || '--';

  return (
    <DashboardLayout role="TEACHER" title="Class Performance Analytics">
      <div className="space-y-6">
        
        {/* Overview Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass p-6 rounded-[2rem] shadow-elite flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Average Class Score</span>
              <div className="flex items-end gap-3">
                 <span className="text-4xl font-[800] tracking-tighter text-[#0b1c30]">{isLoading ? '...' : avgGrade}</span>
                 <span className="text-sm font-bold text-emerald-600 flex items-center mb-1"><TrendingUp className="w-4 h-4 mr-1"/> Stable</span>
              </div>
           </div>
           <div className="glass p-6 rounded-[2rem] shadow-elite flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Attendance Rate</span>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-xl font-[800] tracking-tight text-[#0b1c30]">{isLoading ? '...' : attendance}</div>
                   <div className="text-xs font-bold text-[#464555]/70">Term Average</div>
                 </div>
              </div>
           </div>
           <div className="glass p-6 rounded-[2rem] shadow-elite flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Performance Insights</span>
              <div className="flex items-end gap-3">
                 <span className="text-4xl font-[800] tracking-tighter text-indigo-600">Active</span>
                 <span className="text-sm font-bold text-[#464555]/70 mb-1">AI-Powered</span>
              </div>
           </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="glass p-8 rounded-[2.5rem] shadow-elite">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight">Score Distribution</h3>
             </div>
             
             {/* Simple Bar Chart Mockup */}
             <div className="h-64 flex items-end justify-between gap-2 px-4 pb-8 border-b border-[#0b1c30]/5 relative">
               {/* Y-axis lines */}
               <div className="absolute inset-0 flex flex-col justify-between pb-8 z-0 opacity-10 pointer-events-none">
                 <div className="w-full border-t border-[#0b1c30]"></div>
                 <div className="w-full border-t border-[#0b1c30]"></div>
                 <div className="w-full border-t border-[#0b1c30]"></div>
                 <div className="w-full border-t border-[#0b1c30]"></div>
               </div>
               
               {[
                 { label: '90-100', h: 80, c: 'bg-emerald-500' },
                 { label: '80-89', h: 100, c: 'bg-emerald-400' },
                 { label: '70-79', h: 60, c: 'bg-indigo-400' },
                 { label: '60-69', h: 40, c: 'bg-amber-400' },
                 { label: '<60', h: 15, c: 'bg-rose-400' },
               ].map((bar, i) => (
                 <div key={i} className="flex flex-col items-center gap-3 relative z-10 w-full group">
                   <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${bar.h}%` }}
                     className={cn("w-full max-w-[3rem] rounded-t-xl transition-all duration-300 group-hover:opacity-80", bar.c)}
                   />
                   <span className="text-[10px] font-bold text-[#464555] absolute -bottom-6">{bar.label}</span>
                 </div>
               ))}
             </div>
           </div>

           <div className="glass p-8 rounded-[2.5rem] shadow-elite">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-2">
                 <Award className="w-5 h-5 text-indigo-600" />
                 Top Achievers
               </h3>
               <button className="text-sm font-bold text-indigo-600 hover:underline">View Full Rank</button>
             </div>
             
             <div className="space-y-4">
               {(statsData?.topAchievers && statsData.topAchievers.length > 0 ? statsData.topAchievers : [
                 { name: 'Sarah Jenkins', score: 98.5, trend: '+1.2', pos: 1 },
                 { name: 'David Okafor', score: 96.0, trend: '+3.4', pos: 2 },
                 { name: 'Aisha Bello', score: 95.2, trend: '-0.5', pos: 3 },
                 { name: 'Chuks Emmanuel', score: 92.8, trend: '+2.1', pos: 4 },
               ]).map((student, i) => (
                 <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/50 transition-colors">
                   <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs",
                     student.pos === 1 ? "bg-amber-100 text-amber-600" :
                     student.pos === 2 ? "bg-slate-200 text-slate-600" :
                     student.pos === 3 ? "bg-orange-100 text-orange-600" :
                     "bg-[#f8f9ff] text-[#464555]"
                   )}>
                     #{student.pos}
                   </div>
                   <div className="flex-1 font-bold text-[#0b1c30] text-sm">{student.name}</div>
                   <div className="text-right">
                     <div className="font-extrabold text-indigo-600">{student.score}%</div>
                     <div className={cn(
                       "text-[10px] font-bold",
                       student.trend.startsWith('+') ? "text-emerald-600" : "text-rose-600"
                     )}>{student.trend}%</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
