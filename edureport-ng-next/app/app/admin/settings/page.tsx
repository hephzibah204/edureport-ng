"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck, Mail, Save, Loader2, Database } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully.');
    }, 1500);
  };

  return (
    <DashboardLayout role="ADMIN" title="System Settings">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex flex-col gap-2">
            {[
              { id: 'general', label: 'Platform Details', icon: Settings },
              { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
              { id: 'smtp', label: 'Email / SMTP', icon: Mail },
              { id: 'database', label: 'Database Config', icon: Database },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left",
                  activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "glass text-[#464555] hover:bg-white/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 glass p-8 rounded-[2.5rem] shadow-elite">
            <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight mb-8">
              {activeTab === 'general' ? 'Platform Configuration' : 
               activeTab === 'security' ? 'Global Security Policies' : 
               activeTab === 'smtp' ? 'SMTP Provider Settings' : 'Database Connection'}
            </h3>

            <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
              {activeTab === 'general' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Platform Name</label>
                    <input type="text" defaultValue="ReportSheet Academic Systems" className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Support Email</label>
                    <input type="email" defaultValue="support@reportsheet.com.ng" className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all" />
                  </div>
                </>
              )}

              <div className="pt-6 border-t border-[#0b1c30]/5 flex justify-end">
                <button type="submit" disabled={loading} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-70 flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
