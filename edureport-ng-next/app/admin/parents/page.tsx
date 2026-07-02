"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  Users, 
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
  Phone,
  GraduationCap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ParentsList() {
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    studentId: ''
  });
  const [classFilter, setClassFilter] = useState('');

  // Extract unique classes
  const classes = Array.from(new Set(students.map(s => s.className).filter(Boolean))).sort();

  // Filter students by class
  const filteredStudentsForSelect = classFilter
    ? students.filter(s => s.className === classFilter)
    : students;

  const fetchData = async () => {
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        fetch('/api/parents'),
        fetch('/api/students')
      ]);
      
      const parentsData = await parentsRes.json() as any;
      const studentsData = await studentsRes.json() as any;
      
      setParents(parentsData.parents || []);
      setStudents(studentsData.students || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        await fetchData();
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', phone: '', studentId: '' });
        setClassFilter('');
      } else {
        const error = await res.json() as any;
        toast.error(error.error?.message || 'Failed to invite parent');
      }
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const filteredParents = parents.filter(p => 
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="SCHOOL" title="Parent Directory">
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
              Invite Parent
            </button>
          </div>
        </section>

        {/* Parents Table */}
        <section className="glass rounded-[2.5rem] shadow-elite overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
              <thead>
                <tr className="text-[10px] font-extrabold text-[#464555]/40 uppercase tracking-widest border-b border-[#0b1c30]/5 bg-[#f8f9ff]/50">
                  <th className="px-3 py-3 md:px-8 md:py-6">Parent / Guardian</th>
                  <th className="px-3 py-3 md:px-8 md:py-6">Contact Info</th>
                  <th className="px-3 py-3 md:px-8 md:py-6">Linked Students</th>
                  <th className="px-3 py-3 md:px-8 md:py-6">Account Status</th>
                  <th className="px-3 py-3 md:px-8 md:py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0b1c30]/5">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-3 md:px-8 md:py-6"><div className="h-10 w-32 md:w-48 bg-gray-200 rounded-xl" /></td>
                      <td className="px-3 py-3 md:px-8 md:py-6"><div className="h-4 w-24 md:w-32 bg-gray-200 rounded" /></td>
                      <td className="px-3 py-3 md:px-8 md:py-6"><div className="h-4 w-24 md:w-32 bg-gray-200 rounded" /></td>
                      <td className="px-3 py-3 md:px-8 md:py-6"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
                      <td className="px-3 py-3 md:px-8 md:py-6 text-right"><div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 md:px-8 py-12 md:py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10 md:w-12 md:h-12 text-[#464555]/20" />
                        <p className="text-base md:text-lg font-bold text-[#0b1c30]">No parents found</p>
                        <p className="text-xs md:text-sm text-[#464555]/60">Try adjusting your search or invite a new parent</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredParents.map((parent, i) => (
                  <tr key={parent.id} className="group hover:bg-indigo-50/30 transition-colors">
                    <td className="px-3 py-3 md:px-8 md:py-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-[10px] md:text-sm uppercase group-hover:scale-110 transition-transform duration-500">
                          {parent.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'PR'}
                        </div>
                        <div>
                          <div className="text-xs md:text-sm font-bold text-[#0b1c30] group-hover:text-indigo-600 transition-colors leading-tight">{parent.displayName}</div>
                          <div className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-[#464555]/50 mt-0.5">
                            ID: {parent.id.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-8 md:py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-medium text-[#464555]">
                          <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#464555]/30" />
                          <span className="truncate max-w-[120px] md:max-w-none">{parent.email}</span>
                        </div>
                        {parent.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium text-[#464555]/70">
                            <Phone className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#464555]/30" />
                            {parent.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-8 md:py-6">
                      <div className="flex flex-col gap-1 md:gap-1.5">
                        {parent.linkedStudents && parent.linkedStudents.length > 0 ? (
                          parent.linkedStudents.map((student: any) => (
                            <div key={student.id} className="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-bold text-[#0b1c30]">
                              <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-indigo-600" />
                              <span className="truncate max-w-[100px] md:max-w-none">{student.name}</span>
                              <span className="text-[8px] md:text-[10px] font-medium text-[#464555]/50 px-1 md:px-2 py-0.5 rounded-md bg-[#0b1c30]/5 whitespace-nowrap">{student.cls}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] md:text-xs font-medium text-[#464555]/40 italic">No students linked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 md:px-8 md:py-6">
                      <span className={cn(
                        "px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold whitespace-nowrap",
                        parent.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {parent.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-3 py-3 md:px-8 md:py-6 text-right">
                      <button className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[#464555]/30 hover:text-indigo-600 hover:bg-white transition-all min-tap">
                        <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 md:px-8 py-4 md:py-6 border-t border-[#0b1c30]/5 flex items-center justify-between bg-[#f8f9ff]/30">
            <p className="text-xs font-bold text-[#464555]/60">
              Showing <span className="text-[#0b1c30]">{filteredParents.length}</span> of <span className="text-[#0b1c30]">{parents.length}</span> parents
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-[#0b1c30]/5 bg-white text-[#464555]/40 hover:text-[#0b1c30] disabled:opacity-50 transition-all" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold">1</button>
              <button className="p-2 rounded-lg border border-[#0b1c30]/5 bg-white text-[#464555]/40 hover:text-[#0b1c30] transition-all">
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
              onClick={() => { setIsModalOpen(false); setClassFilter(''); }}
              onKeyDown={(e) => { if (e.key === 'Escape') { setIsModalOpen(false); setClassFilter(''); } }}
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
                    <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">Invite Parent</h3>
                    <p className="text-sm font-medium text-[#464555]/70">Send portal access credentials</p>
                  </div>
                  <button 
                    onClick={() => { setIsModalOpen(false); setClassFilter(''); }}
                    className="w-10 h-10 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#464555] hover:text-rose-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleInvite} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Parent Full Name</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Michael Jenkins"
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
                        placeholder="parent@email.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="tel" 
                        placeholder="+234..."
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Filter by Class</label>
                      <select 
                        value={classFilter}
                        onChange={e => {
                          setClassFilter(e.target.value);
                          setFormData(prev => ({ ...prev, studentId: '' }));
                        }}
                        className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      >
                        <option value="">All Classes</option>
                        {classes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Link to Student</label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                        <select 
                          value={formData.studentId}
                          onChange={e => setFormData({...formData, studentId: e.target.value})}
                          className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all appearance-none"
                        >
                          <option value="">Select a student...</option>
                          {filteredStudentsForSelect.map(student => (
                            <option key={student.id} value={student.id}>{student.name} ({student.admNo})</option>
                          ))}
                        </select>
                      </div>
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
