import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import { Bell, Search, User, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { AICommandCenter } from './AICommandCenter';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'ADMIN' | 'TEACHER' | 'SCHOOL' | 'PARENT' | 'STUDENT';
  title?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

export const DashboardLayout = ({ children, role, title }: DashboardLayoutProps) => {
  const { data: schoolData } = useSWR(role === 'SCHOOL' || role === 'TEACHER' ? '/api/school' : null, fetcher);
  const school = schoolData?.school;
  const isTrial = school?.plan === 'TRIAL';
  
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (isTrial && school?.trialEndsAt) {
      const diff = new Date(school.trialEndsAt).getTime() - Date.now();
      const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      setTrialDaysLeft(days);
      setIsExpired(new Date(school.trialEndsAt) < new Date());
    }
  }, [isTrial, school?.trialEndsAt]);

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar role={role} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Trial Alert Banner */}
        {isTrial && (
          <div className={`px-10 py-3.5 flex items-center justify-between text-sm font-bold border-b transition-all ${
            isExpired 
              ? 'bg-rose-50 text-rose-700 border-rose-100' 
              : 'bg-amber-50 text-amber-800 border-amber-100'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${isExpired ? 'text-rose-600' : 'text-amber-600'}`} />
              <span>
                {isExpired 
                  ? `Your 7-day free trial has expired. Full administrative features are locked until you upgrade.` 
                  : `You are on a 7-day free trial (${trialDaysLeft} days remaining). Upgrade to unlock unlimited records & features.`}
              </span>
            </div>
            <Link 
              href="/admin/billing" 
              className={`flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all hover:scale-105 active:scale-100 ${
                isExpired 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700' 
                  : 'bg-amber-600 text-white shadow-md shadow-amber-600/20 hover:bg-amber-700'
              }`}
            >
              Upgrade Now
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-10">
          <div>
            <h1 className="text-2xl font-[800] tracking-tight text-[#0b1c30]">{title || 'Dashboard'}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
               <input 
                 type="text" 
                 placeholder="Search records..."
                 className="pl-10 pr-4 py-2 bg-white/50 border border-[#0b1c30]/5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:bg-white transition-all w-64"
               />
            </div>
            
            <button className="relative w-10 h-10 rounded-xl glass flex items-center justify-center text-[#464555] hover:text-indigo-600 transition-colors">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-[#0b1c30]/5">
               <div className="text-right hidden sm:block">
                  <div className="text-sm font-extrabold text-[#0b1c30]">Academic Admin</div>
                  <div className="text-[10px] font-bold text-[#464555]/50 uppercase tracking-widest">{role}</div>
               </div>
               <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                  <User className="w-5 h-5" />
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-10 pb-10 overflow-auto">
          {isExpired && role === 'SCHOOL' ? (
            <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-[#0b1c30]">Trial Has Expired</h2>
              <p className="text-sm font-semibold text-[#464555]/60 leading-relaxed">
                Your school administration workspace is locked because the 7-day free trial has ended. Upgrade to a premium plan now to restore full access to reports, student scores, and management.
              </p>
              <Link
                href="/admin/billing"
                className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all block"
              >
                Upgrade to Premium
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </main>

      {/* AI Assistant for Admins */}
      {role === 'SCHOOL' && <AICommandCenter />}
    </div>
  );
};
