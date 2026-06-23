"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  School, 
  Users, 
  CreditCard, 
  Activity, 
  ArrowUpRight, 
  ArrowRight,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';

export default function SuperAdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    schoolsTotal: 0,
    schoolsActive: 0,
    studentsTotal: 0,
    revenue: 0
  });
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/audit')
        ]);

        const statsData = await statsRes.json() as any;
        const logsData = await logsRes.json() as any;

        if (statsData.stats) setStats(statsData.stats);
        if (logsData.logs) setLogs(logsData.logs);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load system stats');
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Schools', val: stats.schoolsTotal, sub: `${stats.schoolsActive} Active Licenses`, icon: School, color: 'indigo' },
    { label: 'Platform Revenue', val: `$${stats.revenue.toLocaleString()}`, sub: 'Total processed', icon: CreditCard, color: 'emerald' },
    { label: 'Total Students', val: stats.studentsTotal.toLocaleString(), sub: 'Across all institutions', icon: Users, color: 'violet' },
    { label: 'System Health', val: '99.9%', sub: 'All systems operational', icon: Activity, color: 'amber' },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Platform Executive Control">
      <div className="space-y-10">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-[800] tracking-tight text-[#0b1c30]">Platform Overview</h2>
            <p className="text-lg font-medium text-[#464555]/70">Enterprise monitoring and global configuration suite.</p>
          </div>
          <div className="flex gap-3">
             <button className="bg-white text-[#0b1c30] border border-[#0b1c30]/5 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm hover:bg-[#f8f9ff] transition-all flex items-center gap-2">
               Download Audit
             </button>
             <button className="bg-[#0b1c30] text-white rounded-2xl px-8 py-4 text-sm font-bold shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-3">
               <Shield className="w-4 h-4 fill-white" />
               Security Audit
             </button>
          </div>
        </section>

        {/* Top Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {statCards.map((stat, i) => (
             <div key={i} className="glass p-8 rounded-[2.5rem] shadow-elite flex flex-col gap-6 group hover:border-indigo-600/20 transition-all cursor-pointer">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                  stat.color === 'indigo' ? "bg-indigo-100 text-indigo-600" : 
                  stat.color === 'emerald' ? "bg-emerald-100 text-emerald-600" : 
                  stat.color === 'violet' ? "bg-violet-100 text-violet-600" :
                  "bg-amber-100 text-amber-600"
                )}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest block mb-1">{stat.label}</span>
                  <span className="text-3xl font-[800] tracking-tighter text-[#0b1c30]">{loading ? '...' : stat.val}</span>
                  <p className="text-xs font-bold text-[#464555]/40 mt-1">{stat.sub}</p>
                </div>
             </div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* System Audit Logs */}
          <section className="lg:col-span-8 glass p-10 rounded-[2.5rem] shadow-elite">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
                Global Audit Logs
              </h3>
              <div className="flex items-center gap-4">
                 <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#464555]/40" />
                    <input 
                      type="text" 
                      placeholder="Filter logs..."
                      className="pl-9 pr-4 py-2 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all w-48"
                    />
                 </div>
                 <button className="text-sm font-bold text-indigo-600 hover:underline">View Full Log</button>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#f8f9ff] rounded-2xl animate-pulse" />)
              ) : logs.length === 0 ? (
                <p className="text-center py-10 text-[#464555]/40 font-bold italic">No logs found</p>
              ) : logs.slice(0, 10).map((log, i) => (
                <div key={log.id} className="flex items-center gap-6 p-5 rounded-2xl hover:bg-white transition-all group border border-transparent hover:border-[#0b1c30]/5">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                     log.action.includes('DELETE') ? "bg-rose-50 text-rose-500" :
                     log.action.includes('CREATE') ? "bg-emerald-50 text-emerald-500" :
                     "bg-indigo-50 text-indigo-500"
                   )}>
                      {log.action.includes('DELETE') ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                         <span className="text-sm font-extrabold text-[#0b1c30] truncate">{log.action}</span>
                         <span className="text-[10px] font-bold text-[#464555]/30 uppercase whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-medium text-[#464555]/60 truncate">
                        Actor: <span className="text-indigo-600 font-bold">{log.userEmail || 'System'}</span> • Data: {JSON.stringify(log.data).slice(0, 100)}...
                      </p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-[#464555]/10 group-hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </section>

          {/* Platform Performance */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="glass p-8 rounded-[2.5rem] shadow-elite">
               <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight mb-8 flex items-center gap-3">
                 <CreditCard className="w-5 h-5 text-emerald-600" />
                 Recent Payments
               </h3>
               <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f9ff]/50 border border-white">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">PAY</div>
                          <div>
                             <div className="text-xs font-extrabold text-[#0b1c30]">School License #492{i}</div>
                             <div className="text-[10px] font-bold text-[#464555]/50">Oct 2{i}, 2024</div>
                          </div>
                       </div>
                       <div className="text-xs font-black text-emerald-600">+$120.00</div>
                    </div>
                  ))}
               </div>
               <button className="w-full mt-6 py-4 bg-[#f8f9ff] text-[#464555] rounded-xl text-xs font-bold hover:bg-white transition-all border border-[#0b1c30]/5">
                 View All Transactions
               </button>
            </div>

            <div className="glass p-8 rounded-[2.5rem] shadow-elite bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10">
                  <h3 className="text-xl font-extrabold tracking-tight mb-2">New Registrations</h3>
                  <p className="text-white/60 text-xs font-medium mb-8 leading-relaxed">4 new schools pending verification and onboarding.</p>
                  <button className="flex items-center gap-2 text-white font-extrabold text-sm group">
                    Onboard Now
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
