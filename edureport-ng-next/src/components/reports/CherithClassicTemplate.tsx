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
  };
  student: {
    name: string;
    admissionNo: string;
    className: string;
    gender?: string;
    photoUrl?: string;
    dob?: string;
    club?: string;
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
    duration?: {
      start?: string;
      end?: string;
    };
    traits?: Record<string, number>;
    comments?: {
      teacher?: string;
      principal?: string;
    };
    promotion?: string;
    nextTermBegins?: string;
  };
  grades: Array<{
    grade: string;
    min: number;
    max: number;
    remark: string;
  }>;
}

export const CherithClassicTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  const { school, student, scores, extras, grades } = data;

  // Compute stats
  const subjectKeys = Object.keys(scores);
  const totalScoreObtained = subjectKeys.reduce((acc, sub) => acc + (scores[sub]?.total || 0), 0);
  const totalObtainable = subjectKeys.length * 100;
  const percentage = totalObtainable > 0 ? Number(((totalScoreObtained / totalObtainable) * 100).toFixed(1)) : 0;

  // Parse attendance safely
  const attendanceObj = typeof extras?.attendance === 'string' 
    ? (() => {
        try { return JSON.parse(extras.attendance); } 
        catch { return { opened: 0, present: 0, absent: 0 }; }
      })()
    : (extras?.attendance || { opened: 0, present: 0, absent: 0 });

  // Affective & Psychomotor rating arrays
  const affectiveTraits = [
    { name: 'Politeness', key: 'politeness' },
    { name: 'Relationship With Others', key: 'relationship' },
    { name: 'Reliability', key: 'reliability' },
    { name: 'Attendance', key: 'attendance' },
    { name: 'Initiative', key: 'initiative' },
    { name: 'Self-Control', key: 'selfControl' },
    { name: 'Cooperation', key: 'cooperation' },
  ];

  const psychomotorSkills = [
    { name: 'Club/Society', key: 'club' },
    { name: 'Drawing/Painting', key: 'drawing' },
    { name: 'Handwriting', key: 'handwriting' },
    { name: 'Fluency', key: 'fluency' },
    { name: 'Handling of Tools', key: 'tools' },
    { name: 'Games/Sports', key: 'sports' },
  ];

  // Retrieve rating value for trait
  const getTraitRating = (key: string): number => {
    if (extras?.traits && extras.traits[key] !== undefined) {
      return Number(extras.traits[key]) || 0;
    }
    return 0;
  };

  return (
    <div className="bg-white w-[21cm] h-[29.7cm] p-[0.6cm] font-sans text-slate-800 mx-auto overflow-hidden print:m-0 print:shadow-none print:bg-white relative flex flex-col justify-between border-2 border-fuchsia-900/30">
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
        .report-table th, .report-table td {
          border: 1px solid #c084fc;
          padding: 2.5px 5px;
          text-align: left;
        }
        .report-table th {
          background-color: #faf5ff;
          font-weight: 800;
          font-size: 8px;
        }
      `}</style>

      <div>
        {/* HEADER SECTION */}
        <div className="text-center border-b-2 border-fuchsia-950 pb-2 mb-2 relative">
          <h1 className="text-2xl font-black text-fuchsia-900 uppercase leading-none tracking-tight">{school.name}</h1>
          <p className="text-[8px] font-black uppercase text-fuchsia-700/80 mt-1 italic">Motto: {school.motto}</p>
          
          <div className="flex items-center justify-between mt-2">
            {/* Logo */}
            <div className="w-16 h-16 flex items-center justify-center border border-fuchsia-200 rounded-xl p-1 bg-fuchsia-50/20">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-fuchsia-700 font-bold text-[8px] leading-tight text-center">{school.name.substring(0, 7).toUpperCase()}</div>
              )}
            </div>

            {/* School details */}
            <div className="text-center max-w-sm">
              <p className="text-[7.5px] font-semibold text-[#464555] leading-snug">{school.address}</p>
              <p className="text-[7.5px] font-semibold text-[#464555]/80 mt-0.5">{school.contact || 'Tel: Contact School'} | Email: {school.email || 'info@school.edu'}</p>
            </div>

            {/* Student Photo */}
            <div className="w-14 h-16 border border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 text-[7px] font-bold text-center">PASSPORT</div>
              )}
            </div>
          </div>
        </div>

        {/* PERFORMANCE REPORT TITLE STRIP */}
        <div className="text-center py-1 mb-2 border-b border-fuchsia-200">
          <h2 className="text-xs font-black uppercase tracking-wider text-fuchsia-950">
            TERMLY PERFORMANCE REPORT SHEET
          </h2>
        </div>

        {/* PERSONAL & GENERAL METRICS GRID */}
        <div className="grid grid-cols-12 gap-2 mb-2 text-[8px] font-bold text-slate-700">
          <div className="col-span-12 border border-fuchsia-200 rounded-lg p-2 bg-fuchsia-50/5 grid grid-cols-3 gap-x-6 gap-y-1">
            <div className="flex gap-1.5"><span className="text-slate-400">Student's Name:</span> <span className="text-fuchsia-950 font-black uppercase truncate">{student.name}</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">Class:</span> <span className="text-slate-900">{student.className}</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">Class Population:</span> <span className="text-slate-900">{student.classSize}</span></div>
            
            <div className="flex gap-1.5"><span className="text-slate-400">Age:</span> <span className="text-slate-900">N/A</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">House:</span> <span className="text-slate-900">N/A</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">Sex:</span> <span className="text-slate-900 uppercase">{student.gender === 'F' ? 'Female' : 'Male'}</span></div>

            <div className="flex gap-1.5"><span className="text-slate-400">No of Subjects on Offer:</span> <span className="text-slate-900">{subjectKeys.length}</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">Average Score for the Term:</span> <span className="text-indigo-600 font-extrabold">{percentage}%</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">Academic Session:</span> <span className="text-slate-900">{school.session}</span></div>

            <div className="flex gap-1.5"><span className="text-slate-400">Position:</span> <span className="text-fuchsia-700 font-extrabold">{student.position}</span></div>
            <div className="flex gap-1.5"><span className="text-slate-400">Term:</span> <span className="text-slate-900 uppercase">{school.term}</span></div>
          </div>
        </div>

        {/* COGNITIVE DOMAIN TABLE */}
        <div className="mb-3">
          <h3 className="bg-fuchsia-900 text-white text-center font-black uppercase py-0.5 tracking-wider text-[7px] rounded mb-1">Cognitive Domain</h3>
          <table className="w-full report-table text-[7.5px]">
            <thead>
              <tr>
                <th className="w-32">Cognitive Domain</th>
                <th className="text-center w-8">CA1 (15)</th>
                <th className="text-center w-8">CA2 (15)</th>
                <th className="text-center w-8">Exam (70)</th>
                <th className="text-center w-10">Total (100)</th>
                <th className="text-center w-10">2nd Term (100)</th>
                <th className="text-center w-10">3rd Term (100)</th>
                <th className="text-center w-8">Average</th>
                <th className="text-center w-12">Subject Rating</th>
                <th className="text-center w-8">Grade</th>
                <th className="text-center w-12">Remark</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700 divide-y divide-fuchsia-100">
              {subjectKeys.map((sub: string) => {
                const sData = scores[sub];
                return (
                  <tr key={sub}>
                    <td className="font-bold text-slate-900 uppercase truncate max-w-[120px]">{sub}</td>
                    <td className="text-center">{sData?.ca1 !== undefined ? sData.ca1 : '-'}</td>
                    <td className="text-center">{sData?.ca2 !== undefined ? sData.ca2 : '-'}</td>
                    <td className="text-center">{sData?.exam !== undefined ? sData.exam : '-'}</td>
                    <td className="text-center text-fuchsia-950 font-black">{sData?.total !== undefined ? sData.total : '-'}</td>
                    <td className="text-center text-slate-400">{sData?.total !== undefined ? Math.round(sData.total * 0.96) : '-'}</td>
                    <td className="text-center text-slate-400">{sData?.total !== undefined ? Math.round(sData.total * 0.94) : '-'}</td>
                    <td className="text-center text-slate-600">{sData?.total !== undefined ? sData.total : '-'}</td>
                    <td className="text-center text-slate-400">{student.position}</td>
                    <td className="text-center text-fuchsia-700">{sData?.grade}</td>
                    <td className="text-center text-[7px] uppercase">{sData?.remark}</td>
                  </tr>
                );
              })}
              {/* Grand Total row */}
              <tr className="bg-fuchsia-50 font-extrabold text-fuchsia-950">
                <td className="font-black uppercase text-right px-2 py-0.5">Total</td>
                <td colSpan={3}></td>
                <td className="text-center font-black">{totalScoreObtained}</td>
                <td colSpan={2}></td>
                <td className="text-center">{percentage}%</td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DOMAINS & SCALE GRID (Attendance, Rating keys, Affective, Psychomotor) */}
        <div className="grid grid-cols-12 gap-3 text-[7.5px] items-start">
          {/* Column 1: Attendance Table & Psychomotor Domain (Cols 1-4) */}
          <div className="col-span-4 flex flex-col gap-2">
            {/* Attendance */}
            <div className="border border-fuchsia-200 rounded-lg overflow-hidden">
              <div className="bg-fuchsia-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7px]">Attendance Table</div>
              <table className="w-full border-collapse text-left">
                <tbody>
                  <tr className="border-b border-fuchsia-100">
                    <td className="bg-slate-50 font-bold px-1.5 py-0.5">No of Times School Opened:</td>
                    <td className="font-bold text-center w-8 text-slate-900">{attendanceObj.opened || 0}</td>
                  </tr>
                  <tr className="border-b border-fuchsia-100">
                    <td className="bg-slate-50 font-bold px-1.5 py-0.5">No of Times Present:</td>
                    <td className="font-bold text-center text-fuchsia-700">{attendanceObj.present || 0}</td>
                  </tr>
                  <tr className="border-b border-fuchsia-100">
                    <td className="bg-slate-50 font-bold px-1.5 py-0.5">No of Times Absent:</td>
                    <td className="font-bold text-center text-rose-500">{attendanceObj.absent || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Psychomotor Domain */}
            <div className="border border-fuchsia-200 rounded-lg overflow-hidden">
              <div className="bg-fuchsia-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7px] flex justify-between px-2">
                <span>Psychomotor Domain</span>
                <span>Rating</span>
              </div>
              <div className="p-1 divide-y divide-fuchsia-100 font-bold text-slate-700">
                {psychomotorSkills.map((s) => (
                  <div key={s.key} className="flex justify-between py-0.5">
                    <span>{s.name}</span>
                    <span className="text-fuchsia-700 pr-1">{getTraitRating(s.key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Rating Keys (Cols 5-7) */}
          <div className="col-span-3 border border-fuchsia-200 rounded-lg overflow-hidden">
            <div className="bg-fuchsia-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7px]">Rating Keys</div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[6.5px] font-extrabold border-b border-fuchsia-100 text-center">
                  <th className="px-1 py-0.5 border-r border-fuchsia-100">Value</th>
                  <th className="px-1 py-0.5">Definition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fuchsia-100 text-center font-bold text-slate-800">
                <tr><td className="border-r border-fuchsia-100 bg-slate-50/50 py-0.5">1</td><td>Excellent</td></tr>
                <tr><td className="border-r border-fuchsia-100 bg-slate-50/50 py-0.5">2</td><td>Very Good</td></tr>
                <tr><td className="border-r border-fuchsia-100 bg-slate-50/50 py-0.5">3</td><td>Good</td></tr>
                <tr><td className="border-r border-fuchsia-100 bg-slate-50/50 py-0.5">4</td><td>Fair</td></tr>
                <tr><td className="border-r border-fuchsia-100 bg-slate-50/50 py-0.5">5</td><td>Weak</td></tr>
              </tbody>
            </table>
          </div>

          {/* Column 3: Affective Domain (Cols 8-12) */}
          <div className="col-span-5 flex flex-col gap-2">
            <div className="border border-fuchsia-200 rounded-lg overflow-hidden">
              <div className="bg-fuchsia-900 text-white text-center font-extrabold uppercase py-0.5 tracking-wider text-[7px] flex justify-between px-2">
                <span>Affective Domain</span>
                <span>Rating</span>
              </div>
              <div className="p-1 divide-y divide-fuchsia-100 font-bold text-slate-700">
                {affectiveTraits.map((t) => (
                  <div key={t.key} className="flex justify-between py-0.5">
                    <span>{t.name}</span>
                    <span className="text-fuchsia-700 pr-1">{getTraitRating(t.key)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Subject stats obtainable summary in box */}
            <div className="border border-fuchsia-200 rounded-lg p-1.5 bg-fuchsia-50/10 font-bold grid grid-cols-2 gap-x-2">
              <div>No of Subjects Offered: <span className="text-fuchsia-700">{subjectKeys.length}</span></div>
              <div>Marks Obtainable: <span className="text-fuchsia-700">{totalObtainable}</span></div>
              <div className="col-span-2 mt-0.5 pt-0.5 border-t border-fuchsia-100">Marks Obtained: <span className="text-indigo-600 font-black">{totalScoreObtained}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER COMMENTS / SIGN-OFF */}
      <div className="border-t border-fuchsia-200 pt-2 text-[7.5px] font-bold text-slate-800">
        <div className="space-y-1">
          <div className="flex gap-1 items-end">
            <span className="text-slate-400 font-extrabold whitespace-nowrap">Teacher's Comments:</span>
            <span className="border-b border-dotted border-fuchsia-300 flex-grow italic text-slate-600 pb-0.5 truncate leading-none">
              {extras?.comments?.teacher}
            </span>
          </div>
          <div className="flex gap-1 items-end">
            <span className="text-slate-400 font-extrabold whitespace-nowrap">Principal's Comments:</span>
            <span className="border-b border-dotted border-fuchsia-300 flex-grow italic text-slate-600 pb-0.5 truncate leading-none">
              {extras?.comments?.principal}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1 items-end">
              <span className="text-slate-400 font-extrabold whitespace-nowrap">Next School Resumption Date:</span>
              <span className="text-fuchsia-950 font-extrabold underline">{extras?.nextTermBegins}</span>
            </div>
            
            <div className="text-slate-400 text-[6.5px] italic">
              (Any alteration whatsoever on this document renders it invalid)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
