"use client";
import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Save, 
  Loader2,
  Search,
  Check,
  Trophy,
  AlertCircle,
  ChevronDown,
  User,
  GraduationCap,
  Percent
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
}

interface ScoreData {
  ca1?: number;
  ca2?: number;
  exam?: number;
}

interface ScoreSheet {
  studentId: string;
  data: Record<string, ScoreData>;
}

export default function ScoresPage() {
  const [classes, setClasses] = useState<{ name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxScores, setMaxScores] = useState({ ca1: 20, ca2: 20, exam: 60 });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchScores();
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      const [classesRes, meRes] = await Promise.all([
        fetch("/api/teacher/api/classes"),
        fetch("/api/auth/me")
      ]);
      
      const classesData = await classesRes.json() as any;
      if (classesData.classes) {
        setClasses(classesData.classes);
        if (classesData.classes.length > 0) setSelectedClass(classesData.classes[0].name);
      }

      const meData = await meRes.json() as any;
      if (meData.school) {
        setMaxScores({
          ca1: Number(meData.school.ca1Max) || 20,
          ca2: Number(meData.school.ca2Max) || 20,
          exam: Number(meData.school.examMax) || 60,
        });
      }
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    }
  };

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/api/scores?className=${encodeURIComponent(selectedClass)}`);
      const data = await res.json() as any;
      
      if (data.students) {
        setStudents(data.students);
      }

      const allSubjects = new Set<string>();
      const initialScores: Record<string, ScoreData> = {};

      if (data.scores) {
        data.scores.forEach((sheet: any) => {
          const sheetData = typeof sheet.data === 'string' ? JSON.parse(sheet.data) : sheet.data;
          Object.keys(sheetData).forEach(sub => allSubjects.add(sub));
          
          if (selectedSubject && sheetData[selectedSubject]) {
            initialScores[sheet.studentId] = sheetData[selectedSubject];
          }
        });
      }

      const subjectList = Array.from(allSubjects);
      setSubjects(subjectList);
      if (subjectList.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectList[0]);
        // Update scores for the newly selected subject
        const updatedScores: Record<string, ScoreData> = {};
        data.scores.forEach((sheet: any) => {
          const sheetData = typeof sheet.data === 'string' ? JSON.parse(sheet.data) : sheet.data;
          if (sheetData[subjectList[0]]) {
            updatedScores[sheet.studentId] = sheetData[subjectList[0]];
          }
        });
        setScores(updatedScores);
      } else {
        setScores(initialScores);
      }
    } catch (err: any) {
      console.error("Failed to fetch scores", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-filter scores when subject changes
  useEffect(() => {
    if (selectedSubject) {
       refreshScoresForSubject();
    }
  }, [selectedSubject]);

  const refreshScoresForSubject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/api/scores?className=${encodeURIComponent(selectedClass)}`);
      const data = await res.json() as any;
      const updatedScores: Record<string, ScoreData> = {};
      if (data.scores) {
        data.scores.forEach((sheet: any) => {
          const sheetData = typeof sheet.data === 'string' ? JSON.parse(sheet.data) : sheet.data;
          if (sheetData[selectedSubject]) {
            updatedScores[sheet.studentId] = sheetData[selectedSubject];
          }
        });
      }
      setScores(updatedScores);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleScoreChange = (studentId: string, field: keyof ScoreData, value: string) => {
    const numValue = value === "" ? undefined : Math.min(Number(value), maxScores[field]);
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: numValue
      }
    }));
  };

  const saveScores = async () => {
    setSaving(true);
    try {
      // We need to get ALL scores for these students across ALL subjects 
      // to avoid overwriting other subjects' data.
      const res = await fetch(`/api/teacher/api/scores?className=${encodeURIComponent(selectedClass)}`);
      const data = await res.json() as any;
      
      const payload = students.map(student => {
        // Find existing score sheet for this student
        const existingSheet = data.scores.find((s: any) => s.studentId === student.id);
        const existingData = existingSheet ? (typeof existingSheet.data === 'string' ? JSON.parse(existingSheet.data) : existingSheet.data) : {};
        
        // Merge current subject's scores into existing data
        const studentData = {
          ...existingData,
          [selectedSubject]: scores[student.id] || {}
        };

        return {
          studentId: student.id,
          data: studentData
        };
      });

      const saveRes = await fetch("/api/teacher/api/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: payload })
      });

      if (saveRes.ok) {
        // Toast or success feedback
      }
    } catch (err: any) {
      console.error("Failed to save scores", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const stats = useMemo(() => {
    const total = students.length;
    let sum = 0;
    let count = 0;
    let pass = 0;

    Object.values(scores).forEach(s => {
      const totalScore = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
      if (totalScore > 0) {
        sum += totalScore;
        count++;
        if (totalScore >= 40) pass++;
      }
    });

    return {
      average: count > 0 ? Math.round(sum / count) : 0,
      passRate: count > 0 ? Math.round((pass / count) * 100) : 0,
      completion: total > 0 ? Math.round((count / total) * 100) : 0
    };
  }, [students, scores]);

  return (
    <DashboardLayout role="TEACHER" title="Score Management">
      <div className="space-y-6">
        {/* Selection Bar */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass p-6 rounded-[2rem] shadow-elite">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest px-1">Class</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="block w-40 bg-white border border-[#0b1c30]/5 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
              >
                {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest px-1">Subject</label>
              <div className="relative">
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="block w-56 bg-white border border-[#0b1c30]/5 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all appearance-none"
                >
                  {subjects.length === 0 && <option value="">No subjects found</option>}
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 pointer-events-none" />
              </div>
            </div>

            <div className="pt-5 pl-2">
                <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Configure Max Scores
                </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={saveScores} 
              isLoading={saving}
              className="rounded-2xl px-10 py-6 font-bold shadow-xl shadow-indigo-600/20"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: 'Class Average', val: `${stats.average}%`, color: 'indigo', icon: Trophy, trend: 'Overall performance' },
             { label: 'Pass Rate', val: `${stats.passRate}%`, color: 'emerald', icon: Percent, trend: 'Students above 40%' },
             { label: 'Data Entry', val: `${stats.completion}%`, color: 'amber', icon: GraduationCap, trend: 'Completion status' },
           ].map((stat, i) => (
             <div key={i} className="glass p-6 rounded-[2rem] shadow-elite flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", 
                   stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                   stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                   "bg-amber-50 text-amber-600"
                )}>
                   <stat.icon className="w-7 h-7" />
                </div>
                <div>
                   <div className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">{stat.label}</div>
                   <div className="text-3xl font-[800] tracking-tight text-[#0b1c30]">{stat.val}</div>
                   <div className="text-[10px] font-bold text-[#464555]/40 mt-1">{stat.trend}</div>
                </div>
             </div>
           ))}
        </section>

        {/* Main Table Card */}
        <Card className="rounded-[2.5rem] border-none shadow-elite overflow-hidden">
          <CardHeader className="bg-white/50 border-b border-[#0b1c30]/5 p-8 flex flex-row items-center justify-between">
            <div className="flex items-center gap-6 flex-1">
              <CardTitle className="text-xl font-extrabold text-[#0b1c30]">Score Sheet</CardTitle>
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40" />
                <input 
                  type="text" 
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0b1c30]/5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff]/50 border-b border-[#0b1c30]/5">
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">CA 1 ({maxScores.ca1})</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">CA 2 ({maxScores.ca2})</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">Exam ({maxScores.exam})</th>
                    <th className="px-8 py-5 text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest text-center">Total</th>
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
                           <td className="px-8 py-6 text-center"><div className="h-8 w-16 bg-gray-200 rounded-lg mx-auto" /></td>
                           <td className="px-8 py-6 text-center"><div className="h-8 w-16 bg-gray-200 rounded-lg mx-auto" /></td>
                           <td className="px-8 py-6 text-center"><div className="h-8 w-16 bg-gray-200 rounded-lg mx-auto" /></td>
                           <td className="px-8 py-6 text-center"><div className="h-4 w-10 bg-gray-200 rounded mx-auto" /></td>
                         </tr>
                       ))
                    ) : filteredStudents.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-8 py-20 text-center">
                            <AlertCircle className="w-8 h-8 text-[#464555]/20 mx-auto mb-4" />
                            <p className="text-sm font-bold text-[#464555]/60 tracking-tight">No students found.</p>
                         </td>
                       </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const s = scores[student.id] || {};
                        const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
                        
                        return (
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
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-extrabold text-[#0b1c30] tracking-tight">{student.name}</div>
                                  <div className="text-[10px] font-bold text-[#464555]/50 uppercase tracking-widest">{student.admissionNo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max={maxScores.ca1}
                                  value={s.ca1 ?? ""}
                                  onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
                                  className="w-20 text-center bg-white border border-[#0b1c30]/10 rounded-xl py-2 font-bold text-[#0b1c30] focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                                />
                            </td>
                            <td className="px-8 py-6 text-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max={maxScores.ca2}
                                  value={s.ca2 ?? ""}
                                  onChange={(e) => handleScoreChange(student.id, 'ca2', e.target.value)}
                                  className="w-20 text-center bg-white border border-[#0b1c30]/10 rounded-xl py-2 font-bold text-[#0b1c30] focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                                />
                            </td>
                            <td className="px-8 py-6 text-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max={maxScores.exam}
                                  value={s.exam ?? ""}
                                  onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                                  className="w-24 text-center bg-white border border-[#0b1c30]/10 rounded-xl py-2 font-bold text-[#0b1c30] focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
                                />
                            </td>
                            <td className="px-8 py-6 text-center">
                                <span className={cn(
                                    "inline-block w-12 py-2 rounded-xl text-sm font-black tracking-tighter",
                                    total >= 40 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                )}>
                                    {total}
                                </span>
                            </td>
                          </motion.tr>
                        );
                      })
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
