"use client";
import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  Send,
  Loader2,
  Search,
  Check,
  Filter,
  AlertCircle
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Student {
  id: string;
  name: string;
  admNo: string;
  cls: string;
}

interface AttendanceMark {
  studentId: string;
  mark: 'PRESENT' | 'ABSENT' | 'LATE';
  note?: string;
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<{ name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'NONE'>('NONE');
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchSession();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/teacher/api/classes");
      const data = await res.json() as any;
      if (data.classes) {
        setClasses(data.classes);
        if (data.classes.length > 0) setSelectedClass(data.classes[0].name);
      }
    } catch (err: any) {
      console.error("Failed to fetch classes", err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/api/students?className=${encodeURIComponent(selectedClass)}`);
      const data = await res.json() as any;
      if (data.students) {
        setStudents(data.students);
      }
    } catch (err: any) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/teacher/api/attendance/session?className=${encodeURIComponent(selectedClass)}&date=${selectedDate}`);
      const data = await res.json() as any;
      if (data.session) {
        setSessionId(data.session.id);
        setStatus(data.session.status);
        const newMarks: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
        data.marks.forEach((m: any) => {
          newMarks[m.studentId] = m.mark;
        });
        setMarks(newMarks);
      } else {
        setSessionId(null);
        setStatus('NONE');
        setMarks({});
      }
    } catch (err: any) {
      console.error("Failed to fetch session", err);
    }
  };

  const toggleMark = (studentId: string) => {
    setMarks((prev) => {
      const current = prev[studentId];
      let next: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT';
      if (current === 'PRESENT') next = 'ABSENT';
      else if (current === 'ABSENT') next = 'LATE';
      return { ...prev, [studentId]: next };
    });
  };

  const handleMarkChange = (studentId: string, mark: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (status === 'SUBMITTED') return;
    setMarks(prev => ({ ...prev, [studentId]: mark }));
  };

  const markAll = (mark: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (status === 'SUBMITTED') return;
    const newMarks: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
    students.forEach(s => {
      newMarks[s.id] = mark;
    });
    setMarks(newMarks);
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        className: selectedClass,
        date: selectedDate,
        marks: Object.entries(marks).map(([studentId, mark]) => ({
          studentId,
          mark
        }))
      };
      const res = await fetch("/api/teacher/api/attendance/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json() as any;
        setSessionId(data.session.id);
        setStatus('DRAFT');
      }
    } catch (err: any) {
      console.error("Failed to save draft", err);
    } finally {
      setSaving(false);
    }
  };

  const submitAttendance = async () => {
    if (!sessionId && Object.keys(marks).length > 0) {
        await saveDraft();
    }
    
    setSubmitting(true);
    try {
      // Re-fetch session ID if it was just created by saveDraft
      let currentSessionId = sessionId;
      if (!currentSessionId) {
          const res = await fetch(`/api/teacher/api/attendance/session?className=${encodeURIComponent(selectedClass)}&date=${selectedDate}`);
          const data = await res.json() as any;
          currentSessionId = data.session?.id;
      }

      if (!currentSessionId) throw new Error("No session found");

      const res = await fetch(`/api/teacher/api/attendance/submit/${currentSessionId}`, {
        method: "POST"
      });
      if (res.ok) {
        setStatus('SUBMITTED');
      }
      } catch (err) {
      console.error("Failed to submit attendance", err);
      } finally {
      setSubmitting(false);
      }
      };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.admNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(marks).filter(m => m === 'PRESENT' || m === 'LATE').length;
    const absent = Object.values(marks).filter(m => m === 'ABSENT').length;
    const unmark = total - Object.keys(marks).length;
    return { total, present, absent, unmark };
  }, [students, marks]);

  return (
    <DashboardLayout role="TEACHER" title="Daily Attendance">
      <div className="space-y-6">
        {/* Header Filters */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-[2rem] shadow-elite">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest px-1">Select Class</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="block w-48 bg-white border border-[#0b1c30]/5 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
              >
                {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest px-1">Session Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === 'SUBMITTED' ? (
              <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Submitted
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={saveDraft} 
                  isLoading={saving}
                  className="rounded-2xl px-6 py-6 font-bold"
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Draft
                </Button>
                <Button 
                  onClick={submitAttendance} 
                  isLoading={submitting}
                  className="rounded-2xl px-8 py-6 font-bold shadow-xl shadow-indigo-600/20"
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Submit Roll Call
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Students', val: stats.total, color: 'indigo', icon: Users },
             { label: 'Present/Late', val: stats.present, color: 'emerald', icon: CheckCircle2 },
             { label: 'Absent', val: stats.absent, color: 'rose', icon: XCircle },
             { label: 'Unmarked', val: stats.unmark, color: 'amber', icon: Clock },
           ].map((stat, i) => (
             <div key={i} className="glass p-5 rounded-3xl shadow-elite flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", 
                   stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                   stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                   stat.color === 'rose' ? "bg-rose-50 text-rose-600" :
                   "bg-amber-50 text-amber-600"
                )}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div>
                   <div className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">{stat.label}</div>
                   <div className="text-2xl font-[800] tracking-tight text-[#0b1c30]">{stat.val}</div>
                </div>
             </div>
           ))}
        </section>

        {/* Main Content */}
        <Card className="rounded-[2.5rem] border-none shadow-elite overflow-hidden">
          <CardHeader className="bg-white/50 border-b border-[#0b1c30]/5 p-8 flex flex-row items-center justify-between">
            <div className="flex items-center gap-6 flex-1">
              <CardTitle className="text-xl font-extrabold text-[#0b1c30]">Student List</CardTitle>
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
                <input 
                  type="text" 
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-[#464555]/60 mr-2">Quick Mark:</span>
               <button onClick={() => markAll('PRESENT')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-100">All Present</button>
               <button onClick={() => markAll('ABSENT')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100">All Absent</button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff]/50 border-b border-[#0b1c30]/5">
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Student Details</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0b1c30]/5">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                       [1, 2, 3, 4, 5].map(i => (
                         <tr key={i} className="animate-pulse">
                           <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-gray-200" />
                               <div className="space-y-2">
                                 <div className="h-4 w-32 bg-gray-200 rounded" />
                                 <div className="h-3 w-20 bg-gray-100 rounded" />
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-6">
                             <div className="flex justify-center gap-2">
                               <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                               <div className="h-8 w-16 bg-gray-200 rounded-lg" />
                               <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                             </div>
                           </td>
                         </tr>
                       ))
                    ) : filteredStudents.length === 0 ? (
                       <tr>
                         <td colSpan={2} className="px-8 py-20 text-center">
                            <AlertCircle className="w-8 h-8 text-[#464555]/20 mx-auto mb-4" />
                            <p className="text-sm font-bold text-[#464555]/60 tracking-tight">No students found for this selection.</p>
                         </td>
                       </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={student.id} 
                          className="group hover:bg-[#f8f9ff]/50 transition-colors"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-extrabold text-[#0b1c30] tracking-tight">{student.name}</div>
                                <div className="text-[10px] font-bold text-[#464555]/50 uppercase tracking-widest">{student.admNo}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-2">
                              {[
                                { id: 'PRESENT', label: 'Present', color: 'emerald', icon: CheckCircle2 },
                                { id: 'LATE', label: 'Late', color: 'amber', icon: Clock },
                                { id: 'ABSENT', label: 'Absent', color: 'rose', icon: XCircle },
                              ].map((option) => (
                                <button
                                  key={option.id}
                                  disabled={status === 'SUBMITTED'}
                                  onClick={() => handleMarkChange(student.id, option.id as any)}
                                  className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold transition-all border",
                                    marks[student.id] === option.id 
                                      ? option.color === 'emerald' ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20" :
                                        option.color === 'amber' ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" :
                                        "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/20"
                                      : "bg-white text-[#464555]/60 border-[#0b1c30]/10 hover:border-[#0b1c30]/20 hover:text-[#0b1c30]"
                                  )}
                                >
                                  <option.icon className={cn("w-3.5 h-3.5", marks[student.id] === option.id ? "text-white" : "")} />
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
