import React from 'react';
import { cn } from '@/src/lib/utils';

interface ScoreEntry {
  ca1?: number;
  ca2?: number;
  exam?: number;
  total?: number;
  grade?: string;
  remark?: string;
  position?: string;
}

interface ReportData {
  school: {
    name: string;
    logoUrl?: string;
    address?: string;
    motto?: string;
    session: string;
    term: string;
    contact?: string;
    email?: string;
    principal?: string;
  };
  student: {
    name: string;
    admissionNo: string;
    className: string;
    gender?: string;
    photoUrl?: string;
  };
  scores: Record<string, ScoreEntry>;
  extras?: {
    attendance?: string;
    traits?: Record<string, string>;
    comments?: {
      teacher?: string;
      principal?: string;
    };
  };
  grades: Array<{
    grade: string;
    min: number;
    max: number;
    remark: string;
  }>;
}

export const EliteModernTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  const { school, student, scores, extras, grades } = data;

  return (
    <div className="bg-[#f8f9ff] w-[21cm] h-[29.7cm] p-[1cm] font-['Plus_Jakarta_Sans',sans-serif] text-[#0b1c30] mx-auto overflow-hidden print:m-0 print:shadow-none print:bg-white relative">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Glass Header Card */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[2rem] p-8 shadow-2xl shadow-[#0b1c30]/5 flex items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-indigo-50 p-3 flex items-center justify-center border border-indigo-100/50">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-3xl font-black text-indigo-600">RS</div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-[800] tracking-tighter leading-none mb-1.5">{school.name}</h1>
            {school.motto && <p className="text-[11px] font-bold text-indigo-600/60 italic mb-2 tracking-wide uppercase">{school.motto}</p>}
            <p className="text-[11px] font-medium text-[#464555]/70 max-w-xs leading-relaxed">{school.address}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[9px] font-black tracking-[0.2em] uppercase mb-3">
            Official Report Card
          </div>
          <div className="text-xl font-[800] tracking-tight leading-none mb-1">{school.term}</div>
          <div className="text-[11px] font-bold text-[#464555]/60">{school.session} Academic Session</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Student Profile Card */}
        <div className="col-span-12 bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[2rem] p-6 shadow-xl shadow-[#0b1c30]/5 flex items-center gap-6">
           <div className="w-16 h-16 rounded-xl bg-[#f8f9ff] border-2 border-white overflow-hidden shadow-inner flex-shrink-0">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300 font-bold text-xl uppercase">
                  {student.name.charAt(0)}
                </div>
              )}
           </div>
           <div className="grid grid-cols-4 gap-6 flex-grow">
              <div>
                <div className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-1">Full Name</div>
                <div className="text-sm font-extrabold text-[#0b1c30] truncate">{student.name}</div>
              </div>
              <div>
                <div className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-1">Admission ID</div>
                <div className="text-sm font-extrabold text-[#0b1c30]">{student.admissionNo}</div>
              </div>
              <div>
                <div className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-1">Class Level</div>
                <div className="text-sm font-extrabold text-indigo-600">{student.className}</div>
              </div>
              <div>
                <div className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-1">Gender</div>
                <div className="text-sm font-extrabold text-[#0b1c30]">{student.gender}</div>
              </div>
           </div>
        </div>
      </div>

      {/* Scores Table Card */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[2rem] overflow-hidden shadow-xl shadow-[#0b1c30]/5 mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="px-6 py-3 text-[10px] font-[800] uppercase tracking-widest">Subject</th>
              <th className="px-4 py-3 text-center text-[10px] font-[800] uppercase tracking-widest">CA 1</th>
              <th className="px-4 py-3 text-center text-[10px] font-[800] uppercase tracking-widest">CA 2</th>
              <th className="px-4 py-3 text-center text-[10px] font-[800] uppercase tracking-widest">Exam</th>
              <th className="px-4 py-3 text-center text-[10px] font-[800] uppercase tracking-widest">Total</th>
              <th className="px-4 py-3 text-center text-[10px] font-[800] uppercase tracking-widest">Grade</th>
              <th className="px-6 py-3 text-right text-[10px] font-[800] uppercase tracking-widest">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0b1c30]/5">
            {Object.entries(scores).map(([subject, score]) => (
              <tr key={subject} className="hover:bg-indigo-50/10 transition-colors break-inside-avoid">
                <td className="px-6 py-2.5 text-xs font-extrabold text-[#0b1c30]">{subject}</td>
                <td className="px-4 py-2.5 text-center text-xs font-bold text-[#464555]">{score.ca1 ?? '-'}</td>
                <td className="px-4 py-2.5 text-center text-xs font-bold text-[#464555]">{score.ca2 ?? '-'}</td>
                <td className="px-4 py-2.5 text-center text-xs font-bold text-[#464555]">{score.exam ?? '-'}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-black text-xs">
                    {score.total ?? (Number(score.ca1 || 0) + Number(score.ca2 || 0) + Number(score.exam || 0))}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-sm font-black text-indigo-600">{score.grade ?? '-'}</span>
                </td>
                <td className="px-6 py-2.5 text-right text-[10px] font-bold text-[#464555]/70 italic">{score.remark ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Remarks & Attendance */}
        <div className="space-y-4">
           <div className="bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[1.5rem] p-5 shadow-xl shadow-[#0b1c30]/5 break-inside-avoid">
              <h3 className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-600" />
                Teacher's Observation
              </h3>
              <p className="text-[11px] font-bold text-[#0b1c30] leading-relaxed italic">
                "{extras?.comments?.teacher}"
              </p>
           </div>
           <div className="bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[1.5rem] p-5 shadow-xl shadow-[#0b1c30]/5 break-inside-avoid">
              <h3 className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-600" />
                Principal's Remark
              </h3>
              <p className="text-[11px] font-bold text-[#0b1c30] leading-relaxed italic">
                "{extras?.comments?.principal}"
              </p>
           </div>
        </div>

        {/* Traits & Grading Key */}
        <div className="bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[1.5rem] p-5 shadow-xl shadow-[#0b1c30]/5 break-inside-avoid">
           <h3 className="text-[9px] font-black text-[#464555]/40 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-600" />
              Grading Interpretation
           </h3>
           <div className="grid grid-cols-1 gap-2">
              {grades.map((g) => (
                <div key={g.grade} className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-black text-indigo-600 text-[10px] shadow-sm">{g.grade}</div>
                      <div className="text-[10px] font-extrabold text-[#0b1c30]">{g.remark}</div>
                   </div>
                   <div className="text-[9px] font-black text-[#464555]/50 tracking-widest">{g.min} - {g.max}</div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-12 px-6">
         <div className="text-center">
            <div className="h-12 flex items-center justify-center mb-2 border-b border-indigo-600/20">
               {/* Signature Space */}
            </div>
            <div className="text-[10px] font-black text-[#0b1c30] uppercase tracking-widest">Class Teacher</div>
         </div>
         <div className="text-center">
            <div className="h-12 flex items-center justify-center mb-2 border-b border-indigo-600/20 text-indigo-600 font-['Dancing_Script',cursive] text-2xl">
               {school.principal}
            </div>
            <div className="text-[10px] font-black text-[#0b1c30] uppercase tracking-widest">School Principal</div>
         </div>
      </div>

      <div className="absolute bottom-[0.8cm] left-0 right-0 text-center text-[9px] font-black text-[#464555]/30 uppercase tracking-[0.3em]">
        Generated via ReportSheet Enterprise • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};
