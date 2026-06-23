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
    principal?: string;
    contact?: string;
    email?: string;
  };
  student: {
    name: string;
    admissionNo: string;
    className: string;
    gender?: string;
    photoUrl?: string;
    position?: string;
    classSize?: number;
  };
  scores: Record<string, ScoreEntry>;
  extras?: {
    attendance?: {
      opened?: number;
      present?: number;
      absent?: number;
    } | string;
    traits?: Record<string, number | string>;
    comments?: {
      teacher?: string;
      principal?: string;
    };
    nextTermBegins?: string;
  };
  grades: Array<{
    grade: string;
    min: number;
    max: number;
    remark: string;
  }>;
}

export const PrimarySchoolTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  const { school, student, scores, extras, grades } = data;

  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  const attendanceObj = typeof extras?.attendance === 'string' 
    ? (() => {
        try { return JSON.parse(extras.attendance); } 
        catch { return { opened: 0, present: 0, absent: 0 }; }
      })()
    : (extras?.attendance || { opened: 0, present: 0, absent: 0 });

  return (
    <div className="bg-[#f0f9ff] w-[21cm] h-[29.7cm] p-[0.8cm] font-sans text-slate-800 mx-auto overflow-hidden print:m-0 print:shadow-none print:bg-white relative border-[8px] border-sky-400/20 rounded-[2rem]">
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

      {/* Header Section */}
      <div className="flex flex-col items-center justify-center text-center border-b-4 border-sky-400 pb-4 mb-4 relative">
        <div className="flex items-center gap-4 w-full">
          <div className="w-20 h-20 rounded-full border-4 border-sky-300 bg-white shadow-md p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-sky-600 font-black text-xl leading-none">{school.name.substring(0, 2).toUpperCase()}</div>
            )}
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-black text-sky-800 uppercase tracking-tight leading-none mb-1">{school.name}</h1>
            {school.motto && <p className="text-[10px] font-bold text-sky-600/70 uppercase tracking-widest mb-1.5 italic">"{school.motto}"</p>}
            <p className="text-[9px] font-semibold text-slate-500 max-w-sm mx-auto leading-tight">{school.address}</p>
            <p className="text-[8px] font-semibold text-slate-500 mt-0.5">{school.contact || 'Tel: Contact School'} | {school.email || 'Email: info@school.edu'}</p>
          </div>
          <div className="w-16 h-20 rounded-xl border-2 border-slate-200 bg-slate-50 shadow-inner flex-shrink-0 flex items-center justify-center overflow-hidden">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-300 text-[8px] font-bold text-center">PHOTO</div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-3 bg-sky-500 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-md border-2 border-white">
          Pupil's Performance Report
        </div>
      </div>

      <div className="text-center font-black text-sky-900 mb-3 text-sm">
        {school.term.toUpperCase()} - {school.session} SESSION
      </div>

      {/* Pupil Info Grid */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-sky-100 mb-4 grid grid-cols-4 gap-2 text-[9px] font-bold text-slate-600">
        <div className="col-span-2 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-16">Name:</span> <span className="text-slate-900 text-[11px] truncate uppercase">{student.name}</span></div>
        <div className="col-span-1 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-12">Adm No:</span> <span className="text-slate-900">{student.admissionNo}</span></div>
        <div className="col-span-1 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-12">Gender:</span> <span className="text-slate-900 uppercase">{student.gender}</span></div>
        <div className="col-span-1 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-16">Class:</span> <span className="text-sky-700 font-black">{student.className}</span></div>
        <div className="col-span-1 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-12">Position:</span> <span className="text-sky-700 font-black">{student.position || '-'}</span></div>
        <div className="col-span-1 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-12">Average:</span> <span className="text-sky-700 font-black">{percentage}%</span></div>
        <div className="col-span-1 flex items-center gap-1.5"><span className="text-sky-500 uppercase tracking-wider text-[8px] w-12">Total:</span> <span className="text-slate-900 font-black">{totalScoreObtained}/{totalObtainable}</span></div>
      </div>

      {/* Main Scores Table */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-100 mb-4">
        <table className="w-full text-left border-collapse text-[9px]">
          <thead>
            <tr className="bg-sky-50 text-sky-800">
              <th className="px-3 py-2 font-black uppercase tracking-wider border-b border-sky-100 border-r w-1/3">Subject</th>
              <th className="px-2 py-2 font-black uppercase tracking-wider border-b border-sky-100 border-r text-center w-10">CA 1</th>
              <th className="px-2 py-2 font-black uppercase tracking-wider border-b border-sky-100 border-r text-center w-10">CA 2</th>
              <th className="px-2 py-2 font-black uppercase tracking-wider border-b border-sky-100 border-r text-center w-10">Exam</th>
              <th className="px-2 py-2 font-black uppercase tracking-wider border-b border-sky-100 border-r text-center w-12">Total</th>
              <th className="px-2 py-2 font-black uppercase tracking-wider border-b border-sky-100 border-r text-center w-12">Grade</th>
              <th className="px-3 py-2 font-black uppercase tracking-wider border-b border-sky-100">Teacher's Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {subjectKeys.map((sub, idx) => {
              const score = scores[sub];
              return (
                <tr key={sub} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-3 py-1.5 border-r border-slate-100 font-bold uppercase truncate max-w-[120px] text-slate-900">{sub}</td>
                  <td className="px-2 py-1.5 border-r border-slate-100 text-center">{score?.ca1 ?? '-'}</td>
                  <td className="px-2 py-1.5 border-r border-slate-100 text-center">{score?.ca2 ?? '-'}</td>
                  <td className="px-2 py-1.5 border-r border-slate-100 text-center">{score?.exam ?? '-'}</td>
                  <td className="px-2 py-1.5 border-r border-slate-100 text-center font-black text-sky-700 bg-sky-50/30">
                    {score?.total ?? '-'}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-100 text-center font-black text-sky-600">{score?.grade ?? '-'}</td>
                  <td className="px-3 py-1.5 italic text-slate-500 text-[8px] truncate">{score?.remark ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Attendance & Grading */}
        <div className="col-span-5 space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden">
            <div className="bg-sky-50 text-sky-800 text-center font-black uppercase tracking-widest text-[8px] py-1 border-b border-sky-100">Attendance</div>
            <div className="p-2 flex justify-between text-[9px] font-bold text-slate-600">
              <div className="text-center"><div className="text-[12px] font-black text-slate-900 mb-0.5">{attendanceObj.opened || 0}</div><div>Opened</div></div>
              <div className="text-center"><div className="text-[12px] font-black text-emerald-600 mb-0.5">{attendanceObj.present || 0}</div><div>Present</div></div>
              <div className="text-center"><div className="text-[12px] font-black text-rose-500 mb-0.5">{attendanceObj.absent || 0}</div><div>Absent</div></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sky-100 overflow-hidden">
            <div className="bg-sky-50 text-sky-800 text-center font-black uppercase tracking-widest text-[8px] py-1 border-b border-sky-100">Grading Key</div>
            <div className="p-2 space-y-1 text-[8px]">
              {grades.map(g => (
                <div key={g.grade} className="flex items-center justify-between font-bold text-slate-600">
                  <div className="flex items-center gap-1.5 w-16">
                    <span className="w-4 h-4 rounded bg-sky-100 text-sky-700 flex items-center justify-center font-black">{g.grade}</span>
                    <span>{g.min}-{g.max}%</span>
                  </div>
                  <span className="uppercase text-slate-500">{g.remark}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="col-span-7 space-y-3">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-sky-100 h-20">
            <h3 className="text-[8px] font-black uppercase text-sky-500 mb-1 tracking-widest">Class Teacher's Remark</h3>
            <p className="text-[10px] font-bold text-slate-800 leading-relaxed italic border-b border-dashed border-slate-200 pb-1">
              "{extras?.comments?.teacher || '...'}"
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-sky-100 h-20">
            <h3 className="text-[8px] font-black uppercase text-sky-500 mb-1 tracking-widest">Head Teacher's Remark</h3>
            <p className="text-[10px] font-bold text-slate-800 leading-relaxed italic border-b border-dashed border-slate-200 pb-1">
              "{extras?.comments?.principal || '...'}"
            </p>
          </div>
        </div>
      </div>

      {/* Signatures & Footer */}
      <div className="mt-auto pt-4 border-t-2 border-dashed border-sky-200 grid grid-cols-3 gap-6 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
        <div className="space-y-2">
          <div className="border-b-2 border-slate-300 h-8"></div>
          <div>Class Teacher's Sign</div>
        </div>
        <div className="space-y-2 relative">
          {/* Stamp overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 -rotate-12">
            <div className="border-4 border-emerald-500 text-emerald-500 font-black text-lg p-2 rounded-lg uppercase">Official</div>
          </div>
          <div className="border-b-2 border-slate-300 h-8 flex items-end justify-center pb-1 text-slate-900 text-[10px] font-bold">{school.principal}</div>
          <div>Head Teacher's Sign</div>
        </div>
        <div className="space-y-2">
          <div className="border-b-2 border-slate-300 h-8 flex items-end justify-center pb-1 text-slate-900 font-bold">{extras?.nextTermBegins || 'TBA'}</div>
          <div>Next Term Begins</div>
        </div>
      </div>
      
    </div>
  );
};
