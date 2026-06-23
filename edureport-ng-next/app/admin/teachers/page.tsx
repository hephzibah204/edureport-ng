"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  UserSquare2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Plus,
  Mail,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Loader2,
  BookOpen,
  Trash2
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Teacher } from '@/src/types/api';

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

export default function TeachersList() {
  const { data, isLoading } = useSWR<{ teachers: Teacher[] }>('/api/teachers', fetcher);
  const teachers = data?.teachers || [];
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    classes: ''
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const classesArray = formData.classes.split(',').map(c => c.trim()).filter(Boolean);
      
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          classes: classesArray
        })
      });
      
      if (res.ok) {
        mutate('/api/teachers');
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', classes: '' });
        toast.success("Teacher invited successfully");
      } else {
        const error = await res.json() as any;
        toast.error(error.error?.message || 'Failed to invite teacher');
      }
    } catch (error) {
      console.error('Invite error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this faculty member?")) return;
    
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mutate('/api/teachers');
        toast.success("Teacher deleted successfully");
      } else {
        toast.error("Failed to delete teacher");
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="SCHOOL" title="Faculty Directory">
      <div className="space-y-6">
        {/* Actions Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl shadow-elite">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => toast.info("Filter options coming soon")}
              className="p-3 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-xl text-[#464555] hover:text-indigo-600 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Teacher
            </button>
          </div>
        </section>

        {/* Teachers Table */}
        <section className="glass rounded-[2.5rem] shadow-elite overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest border-b border-[#0b1c30]/5 bg-[#f8f9ff]/50">
                  <th className="px-8 py-6">Faculty Member</th>
                  <th className="px-8 py-6">Contact Info</th>
                  <th className="px-8 py-6">Assigned Classes</th>
                  <th className="px-8 py-6">Account Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0b1c30]/5">
                {isLoading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-6"><div className="h-10 w-48 bg-gray-200 rounded-xl" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                      <td className="px-8 py-6"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
                      <td className="px-8 py-6 text-right"><div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <UserSquare2 className="w-12 h-12 text-[#464555]/20" />
                        <p className="text-lg font-bold text-[#0b1c30]">No teachers found</p>
                        <p className="text-sm text-[#464555]/60">Try adjusting your search or add a new faculty member</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="group hover:bg-emerald-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-extrabold text-sm uppercase group-hover:scale-110 transition-transform duration-500">
                          {teacher.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-[#0b1c30] group-hover:text-emerald-600 transition-colors">{teacher.displayName}</div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            STAFF ID: {teacher.id.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#464555]">
                          <Mail className="w-3.5 h-3.5 text-[#464555]/30" />
                          {teacher.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {teacher.classes && teacher.classes.length > 0 ? (
                          teacher.classes.map((cls: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded-lg bg-white border border-[#0b1c30]/5 text-[#464555] text-[10px] font-bold whitespace-nowrap">
                              {cls}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-[#464555]/40 italic">No classes assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold",
                        teacher.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {teacher.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Teacher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#464555]/30 hover:text-emerald-600 hover:bg-white transition-all">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-8 py-6 border-t border-[#0b1c30]/5 flex items-center justify-between bg-[#f8f9ff]/30">
            <p className="text-xs font-bold text-[#464555]/60">
              Showing <span className="text-[#0b1c30]">{filteredTeachers.length}</span> of <span className="text-[#0b1c30]">{teachers.length}</span> faculty members
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toast.info("Pagination coming soon")}
                className="p-2 rounded-lg border border-[#0b1c30]/5 bg-white text-[#464555]/40 hover:text-[#0b1c30] disabled:opacity-50 transition-all" 
                disabled
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold">1</button>
              <button 
                onClick={() => toast.info("Pagination coming soon")}
                className="p-2 rounded-lg border border-[#0b1c30]/5 bg-white text-[#464555]/40 hover:text-[#0b1c30] transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Invite Modal */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
            >
              <div className="glass p-8 rounded-[2.5rem] shadow-elite border-white/60 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500" />
                
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">Invite Teacher</h3>
                    <p className="text-sm font-medium text-[#464555]/70">Send portal access credentials</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#464555] hover:text-rose-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleInvite} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <UserSquare2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Sarah Jenkins"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required
                        type="email" 
                        placeholder="teacher@school.edu"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Temporary Password</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Assign Classes (Comma separated)</label>
                    <div className="relative group">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="JSS 1A, SSS 2 Science"
                        value={formData.classes}
                        onChange={e => setFormData({...formData, classes: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isInviting || !formData.name || !formData.email || !formData.password}
                    className="w-full py-4 mt-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Invitation Email'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
