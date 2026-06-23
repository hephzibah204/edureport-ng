"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

export default function CampusAttendance() {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    present: 100,
    absent: 0,
    late: 0,
    total: 0
  });
  const [classBreakdown, setClassBreakdown] = useState<{ name: string; p: number; a: number; l: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/school/attendance?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data.stats) setStats(data.stats);
          if (data.classBreakdown) setClassBreakdown(data.classBreakdown);
        }
      } catch (err) {
        console.error("Failed to load admin attendance statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDate]);

  return (
    <DashboardLayout role="SCHOOL" title="Campus Attendance">
      <div className="space-y-6">
        
        {/* Date Selector Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 pointer-events-none" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/70 backdrop-blur-md border border-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all shadow-sm"
                />
             </div>
          </div>
          <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
            Download Daily Log
          </button>
        </div>

        {/* High-Level Overview Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass p-6 rounded-[2rem] shadow-elite h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="glass p-6 rounded-[2rem] shadow-elite relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-[#0b1c30]/5">
                   <UsersIcon className="w-16 h-16" />
                </div>
                <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest relative z-10">Total Students</span>
                <div className="text-4xl font-[800] tracking-tighter text-[#0b1c30] mt-2 relative z-10">{stats.total}</div>
             </div>
             
             <div className="glass p-6 rounded-[2rem] shadow-elite relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-transparent border-emerald-100">
                <span className="text-[10px] font-extrabold text-emerald-800/50 uppercase tracking-widest relative z-10 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> Present
                </span>
                <div className="text-4xl font-[800] tracking-tighter text-emerald-600 mt-2 relative z-10">{stats.present}%</div>
             </div>

             <div className="glass p-6 rounded-[2rem] shadow-elite relative overflow-hidden bg-gradient-to-br from-rose-50/50 to-transparent border-rose-100">
                <span className="text-[10px] font-extrabold text-rose-800/50 uppercase tracking-widest relative z-10 flex items-center gap-1.5">
                  <XCircle className="w-3 h-3" /> Absent
                </span>
                <div className="text-4xl font-[800] tracking-tighter text-rose-600 mt-2 relative z-10">{stats.absent}%</div>
             </div>

             <div className="glass p-6 rounded-[2rem] shadow-elite relative overflow-hidden bg-gradient-to-br from-amber-50/50 to-transparent border-amber-100">
                <span className="text-[10px] font-extrabold text-amber-800/50 uppercase tracking-widest relative z-10 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Late
                </span>
                <div className="text-4xl font-[800] tracking-tighter text-amber-600 mt-2 relative z-10">{stats.late}%</div>
             </div>
          </section>
        )}

        {/* Class Breakdown List */}
        <section className="glass rounded-[2.5rem] shadow-elite p-8">
           <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight mb-8">Class Breakdown</h3>
           
           {loading ? (
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
               ))}
             </div>
           ) : classBreakdown.length === 0 ? (
             <p className="text-gray-500 text-center py-6 font-medium">No students or classes defined yet.</p>
           ) : (
             <div className="space-y-4">
                {classBreakdown.map((cls, i) => (
                  <div key={i} className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-white/50 transition-colors border border-transparent hover:border-[#0b1c30]/5">
                     <div className="w-32">
                       <span className="text-sm font-extrabold text-[#0b1c30]">{cls.name}</span>
                     </div>
                     
                     <div className="flex-1 h-3 bg-[#f8f9ff] rounded-full overflow-hidden flex shadow-inner">
                        <motion.div initial={{width:0}} animate={{width:`${cls.p}%`}} className="h-full bg-emerald-500" title={`Present: ${cls.p}%`} />
                        <motion.div initial={{width:0}} animate={{width:`${cls.a}%`}} className="h-full bg-rose-500" title={`Absent: ${cls.a}%`} />
                        <motion.div initial={{width:0}} animate={{width:`${cls.l}%`}} className="h-full bg-amber-500" title={`Late: ${cls.l}%`} />
                     </div>
                     
                     <div className="w-48 flex justify-end gap-4 text-xs font-bold">
                       <span className="text-emerald-600">{cls.p}% P</span>
                       <span className="text-rose-600">{cls.a}% A</span>
                       <span className="text-amber-600">{cls.l}% L</span>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
