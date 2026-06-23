"use client";

import { useState } from "react";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Building2, MoreVertical, X, Loader2, Key, Ban, ArrowUpCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";

export default function SchoolsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeActionSchool, setActiveActionSchool] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      alert("School successfully onboarded. Admin credentials have been sent to their email.");
    }, 1500);
  };

  const executeAction = (action: string, schoolName: string) => {
    setActiveActionSchool(null);
    alert(`System Override: Executed [${action}] on ${schoolName}.`);
  };

  const schools = [
    { id: 1, name: "Royal Academy", plan: "Enterprise", students: 1240, status: "Active" },
    { id: 2, name: "Springfield High", plan: "Pro", students: 850, status: "Active" },
    { id: 3, name: "St. John's College", plan: "Basic", students: 320, status: "Suspended" },
  ];

  return (
    <DashboardLayout role="ADMIN" title="School Network Control">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl shadow-elite">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
            <input 
              type="text" 
              placeholder="Search institutions by name or ID..."
              className="w-full pl-12 pr-4 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-extrabold shadow-xl shadow-indigo-600/20 flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Onboard New School
          </motion.button>
        </div>

        <div className="glass rounded-[2.5rem] shadow-elite overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest border-b border-[#0b1c30]/5 bg-[#f8f9ff]/50">
                  <th className="px-8 py-6">Institution Name</th>
                  <th className="px-8 py-6">Subscription Plan</th>
                  <th className="px-8 py-6">User Base (Students)</th>
                  <th className="px-8 py-6">System Status</th>
                  <th className="px-8 py-6 text-right">Absolute Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0b1c30]/5">
                {schools.map((school, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={school.id} 
                    className="hover:bg-indigo-50/30 transition-colors group relative"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-[#0b1c30]">{school.name}</span>
                          <div className="text-[10px] font-bold text-[#464555]/50 mt-0.5 uppercase tracking-widest">ID: SCH_{school.id}9382</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border border-[#0b1c30]/5 bg-white text-[#464555]">
                        {school.plan}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[#0b1c30] font-extrabold">{school.students.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold",
                        school.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      )}>
                        {school.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <button 
                        onClick={() => setActiveActionSchool(activeActionSchool === school.id ? null : school.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#464555]/30 hover:text-indigo-600 hover:bg-white transition-all ml-auto"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      <AnimatePresence>
                        {activeActionSchool === school.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute right-12 top-10 w-56 glass p-2 rounded-2xl shadow-2xl border-white/60 z-50 text-left flex flex-col gap-1"
                          >
                            <button onClick={() => executeAction("Force Password Reset", school.name)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0b1c30] hover:bg-white transition-colors w-full">
                              <Key className="w-4 h-4 text-indigo-600" /> Reset Admin Auth
                            </button>
                            <button onClick={() => executeAction("Override Subscription", school.name)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0b1c30] hover:bg-white transition-colors w-full">
                              <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> Override Plan
                            </button>
                            <div className="w-full h-px bg-[#0b1c30]/5 my-1" />
                            <button onClick={() => executeAction("Suspend Institution", school.name)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors w-full">
                              <Ban className="w-4 h-4" /> Suspend School
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-[#0b1c30]/20 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[101]"
            >
              <div className="glass p-8 rounded-[2.5rem] shadow-elite border-white/60 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">Onboard Institution</h2>
                    <p className="text-sm font-medium text-[#464555]/70 mt-1">Provision a new dedicated school environment.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#464555] hover:text-rose-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Official School Name</label>
                    <input required type="text" className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all" placeholder="e.g. Royal Academy International" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Platform Tier</label>
                      <select className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all appearance-none cursor-pointer">
                        <option>Basic Plan</option>
                        <option>Pro Plan</option>
                        <option>Enterprise Suite</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Subdomain URL</label>
                      <div className="relative">
                        <input required type="text" className="w-full pl-4 pr-24 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all" placeholder="royal" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#464555]/40 tracking-tighter">.reportsheet.ng</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Master Admin Email</label>
                     <input required type="email" className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all" placeholder="admin@royalacademy.edu.ng" />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Provision Institution Environment"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
