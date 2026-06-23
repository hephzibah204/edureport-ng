import React from 'react';
import { cn } from '@/src/lib/utils';

interface ScoreEntry {
  ca1?: number;
  ca2?: number;
  exam?: number;
  total?: number;
  grade?: string;
  remark?: string;
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

export const NurseryColorfulTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  const { school, student, scores, extras, grades } = data;

  const colors = ['bg-rose-100 text-rose-700 border-rose-200', 'bg-amber-100 text-amber-700 border-amber-200', 'bg-emerald-100 text-emerald-700 border-emerald-200', 'bg-sky-100 text-sky-700 border-sky-200', 'bg-violet-100 text-violet-700 border-violet-200'];

  return (
    <div className="bg-white w-[21cm] h-[29.7cm] p-[0.8cm] font-sans text-gray-800 mx-auto overflow-hidden print:m-0 relative">
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
      
      <div className="border-[6px] border-amber-400 rounded-[2.5rem] p-6 h-full relative overflow-hidden flex flex-col">
        {/* Decorations */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-200 rounded-full blur-3xl opacity-30" />
        
        {/* Header */}
        <div className="text-center mb-6">
           <div className="w-20 h-20 bg-white rounded-full shadow-md mx-auto mb-3 flex items-center justify-center border-4 border-amber-400 p-1.5 overflow-hidden">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl">🏫</span>
              )}
           </div>
           <h1 className="text-3xl font-black text-amber-600 tracking-tight uppercase leading-none mb-1">{school.name}</h1>
           {school.motto && <p className="text-[10px] font-bold text-gray-400 italic mb-3">{school.motto}</p>}
           <div className="inline-block px-6 py-1.5 bg-sky-500 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-md mb-2">
             My Progress Report
           </div>
           <p className="text-[11px] font-bold text-gray-500">{school.term} • {school.session}</p>
        </div>

        {/* Student Info */}
        <div className="bg-white rounded-[1.5rem] p-4 shadow-lg shadow-gray-100 border-2 border-dashed border-gray-200 mb-6 flex items-center gap-6">
           <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center text-3xl shadow-inner">
              {student.gender === 'Female' ? '👧' : '👦'}
           </div>
           <div className="grid grid-cols-2 gap-x-8 gap-y-1 flex-grow">
              <div>
                 <span className="text-[9px] font-black text-gray-300 uppercase block leading-none mb-1">Superstar Name</span>
                 <span className="text-lg font-black text-gray-700 leading-none truncate block">{student.name}</span>
              </div>
              <div>
                 <span className="text-[9px] font-black text-gray-300 uppercase block leading-none mb-1">Class Room</span>
                 <span className="text-lg font-black text-amber-500 leading-none truncate block">{student.className}</span>
              </div>
           </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 flex-grow content-start">
           {Object.entries(scores).map(([subject, score], idx) => (
             <div key={subject} className={cn("p-4 rounded-[1.5rem] border-2 flex items-center justify-between break-inside-avoid", colors[idx % colors.length])}>
                <div className="flex-grow pr-2">
                   <h3 className="font-black text-sm uppercase leading-tight truncate">{subject}</h3>
                   <p className="text-[9px] font-bold opacity-70 mt-0.5 truncate">{score.remark}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                   <span className="text-[8px] font-black opacity-30 leading-none mb-0.5">GRADE</span>
                   <span className="text-base font-black leading-none">{score.grade}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Remarks */}
        <div className="space-y-4 mb-6 mt-auto">
           <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[1.5rem] p-5 break-inside-avoid">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 flex items-center gap-2">
                 <span>🌟</span> Teacher's High Five
              </h3>
              <p className="text-sm font-bold text-emerald-900 leading-relaxed italic">
                 "{extras?.comments?.teacher}"
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between mt-auto pt-6 border-t-2 border-dashed border-gray-100">
           <div className="text-left">
              <div className="text-[9px] font-black text-gray-300 uppercase mb-2">Teacher's Stamp</div>
              <div className="w-16 h-16 rounded-full border-4 border-rose-400/30 flex items-center justify-center text-rose-500 font-black text-[9px] rotate-12 uppercase text-center p-1 leading-tight">
                 Approved<br/>With Love
              </div>
           </div>
           <div className="text-right pb-2">
              <p className="text-[11px] font-black text-gray-400 uppercase leading-none mb-1">{school.principal}</p>
              <p className="text-[9px] font-bold text-gray-300 leading-none uppercase">Principal</p>
           </div>
        </div>
      </div>
    </div>
  );
};
