"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { 
  FileText, 
  Calendar,
  CheckCircle2,
  Award,
  BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import useSWR from "swr";
import { User, School, Student } from "@/src/types/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

interface PortalData {
  user: User;
  school: School;
  students: Student[];
}

export default function StudentResults() {
  const { data: portalData, isLoading: portalLoading } = useSWR<PortalData>('/api/portal/api/me', fetcher);
  const students = portalData?.students || [];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Set default student when data loads
  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const { data: scoreData, isLoading: scoresLoading } = useSWR(
    selectedStudentId ? `/api/portal/api/scores/${selectedStudentId}` : null,
    fetcher
  );

  const selectedStudent = students.find((s: any) => s.id === selectedStudentId);
  const rawScores = scoreData?.scores?.[selectedStudentId || ''] || {};

  const subjectsWithScores = Object.keys(rawScores).map(subjectName => {
    const s = rawScores[subjectName];
    const total = (Number(s.ca1) || 0) + (Number(s.ca2) || 0) + (Number(s.exam) || 0);
    
    // Simple grading scale
    let grade = 'F';
    if (total >= 75) grade = 'A';
    else if (total >= 65) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 40) grade = 'D';

    return {
      subject: subjectName,
      ca1: s.ca1 ?? '-',
      ca2: s.ca2 ?? '-',
      exam: s.exam ?? '-',
      total,
      grade
    };
  });

  const calculateCGPA = () => {
    if (subjectsWithScores.length === 0) return "0.00";
    let totalPoints = 0;
    subjectsWithScores.forEach(s => {
      if (s.grade === 'A') totalPoints += 4.0;
      else if (s.grade === 'B') totalPoints += 3.0;
      else if (s.grade === 'C') totalPoints += 2.0;
      else if (s.grade === 'D') totalPoints += 1.0;
    });
    return (totalPoints / subjectsWithScores.length).toFixed(2);
  };

  const isLoading = portalLoading || (selectedStudentId && scoresLoading);

  return (
    <DashboardLayout role="PARENT" title="Academic Results">
      <div className="space-y-8">
        
        {/* Header Info */}
        <section className="glass p-8 rounded-[2.5rem] shadow-elite flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
             <h2 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight mb-2">My Children's Report Cards</h2>
             <p className="text-sm font-medium text-[#464555]/70">View and track official academic score records.</p>
           </div>
           {students.length > 1 && (
             <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-gray-500">Student:</span>
               <select 
                 value={selectedStudentId || ''} 
                 onChange={(e) => setSelectedStudentId(e.target.value)}
                 className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
               >
                 {students.map((s: any) => (
                   <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
               </select>
             </div>
           )}
           <div className="flex items-center gap-3">
             <div className="px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-600" />
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Est. GPA</div>
                  <div className="text-lg font-extrabold text-emerald-900 leading-none mt-0.5">{isLoading ? "..." : calculateCGPA()}</div>
                </div>
             </div>
           </div>
        </section>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass shadow-elite rounded-[2.5rem] p-8 min-h-[220px] animate-pulse bg-white/70" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="glass shadow-elite rounded-3xl p-20 text-center bg-white/70">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">No Students Linked</h3>
            <p className="text-gray-500 mt-2">Could not find any student accounts linked to your parent portal.</p>
          </div>
        ) : subjectsWithScores.length === 0 ? (
          <div className="glass shadow-elite rounded-3xl p-20 text-center bg-white/70">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">No Report Released</h3>
            <p className="text-gray-500 mt-2">Scores have not been recorded or released yet for {selectedStudent?.name}.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectsWithScores.map((result, i) => (
              <motion.div 
                key={result.subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 rounded-[2.5rem] shadow-elite transition-all duration-500 glass hover:bg-white hover:-translate-y-2 hover:shadow-2xl"
              >
                 <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Released
                    </span>
                 </div>
                 
                 <h3 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight mb-1">{result.subject}</h3>
                 <div className="flex items-center gap-2 text-sm font-bold text-[#464555]/60 mb-8">
                    <Calendar className="w-4 h-4" />
                    Continuous Assessment
                 </div>

                 <div className="grid grid-cols-3 gap-2 text-center mb-6 pt-4 border-t border-[#0b1c30]/5">
                   <div>
                     <div className="text-[9px] font-extrabold text-[#464555]/50 uppercase">CA 1</div>
                     <div className="text-sm font-bold text-[#0b1c30]">{result.ca1}</div>
                   </div>
                   <div>
                     <div className="text-[9px] font-extrabold text-[#464555]/50 uppercase">CA 2</div>
                     <div className="text-sm font-bold text-[#0b1c30]">{result.ca2}</div>
                   </div>
                   <div>
                     <div className="text-[9px] font-extrabold text-[#464555]/50 uppercase">Exam</div>
                     <div className="text-sm font-bold text-[#0b1c30]">{result.exam}</div>
                   </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-[#0b1c30]/5">
                   <div className="flex items-center gap-4">
                     <div>
                       <div className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Total</div>
                       <div className="text-lg font-extrabold text-[#0b1c30]">{result.total}</div>
                     </div>
                     <div className="w-px h-8 bg-[#0b1c30]/5" />
                     <div>
                       <div className="text-[10px] font-extrabold text-[#464555]/50 uppercase tracking-widest">Grade</div>
                       <div className="text-lg font-extrabold text-indigo-600">{result.grade}</div>
                     </div>
                   </div>
                 </div>
              </motion.div>
            ))}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
