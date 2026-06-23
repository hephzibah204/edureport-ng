import React from 'react';

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

export const ClassicProfessionalTemplate: React.FC<{ data: ReportData }> = ({ data }) => {
  const { school, student, scores, extras, grades } = data;

  return (
    <div className="bg-white w-[21cm] h-[29.7cm] p-[0.8cm] font-serif text-black border-[10px] border-double border-gray-800 mx-auto overflow-hidden print:m-0 print:border-[10px] relative">
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
      
      <div className="border border-black p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <div className="w-20 h-20 border border-black p-1.5 flex items-center justify-center">
             {school.logoUrl ? (
               <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <div className="text-xl font-bold">LOGO</div>
             )}
          </div>
          <div className="text-center flex-grow px-4">
            <h1 className="text-2xl font-bold uppercase mb-0.5 leading-tight">{school.name}</h1>
            {school.motto && <p className="text-[10px] italic mb-1">"{school.motto}"</p>}
            <p className="text-[9px] uppercase font-bold tracking-wider leading-relaxed">{school.address}</p>
          </div>
          <div className="w-20 h-20 border border-black flex flex-col items-center justify-center text-center p-1 bg-gray-50">
             <div className="text-[8px] font-bold uppercase leading-tight text-gray-400">Student<br/>Photo</div>
          </div>
        </div>

        <div className="text-center mb-6">
           <h2 className="text-lg font-bold underline uppercase tracking-widest">Terminal Report Card</h2>
           <p className="text-xs font-bold mt-0.5">{school.term}, {school.session} Session</p>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-xs border border-black p-3 bg-gray-50/50">
           <div className="flex gap-2 items-end"><span className="font-bold whitespace-nowrap">Name:</span> <span className="border-b border-dotted border-black flex-grow truncate pb-0.5">{student.name}</span></div>
           <div className="flex gap-2 items-end"><span className="font-bold whitespace-nowrap">Adm No:</span> <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.admissionNo}</span></div>
           <div className="flex gap-2 items-end"><span className="font-bold whitespace-nowrap">Class:</span> <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.className}</span></div>
           <div className="flex gap-2 items-end"><span className="font-bold whitespace-nowrap">Gender:</span> <span className="border-b border-dotted border-black flex-grow pb-0.5">{student.gender}</span></div>
        </div>

        {/* Scores Table */}
        <div className="flex-grow">
          <table className="w-full border-collapse border border-black text-[11px] mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-3 py-1.5 text-left uppercase font-bold tracking-wider">Subjects</th>
                <th className="border border-black px-1 py-1.5 text-center w-12 font-bold">CA 1</th>
                <th className="border border-black px-1 py-1.5 text-center w-12 font-bold">CA 2</th>
                <th className="border border-black px-1 py-1.5 text-center w-12 font-bold">Exam</th>
                <th className="border border-black px-1 py-1.5 text-center w-12 font-bold">Total</th>
                <th className="border border-black px-1 py-1.5 text-center w-12 font-bold">Grade</th>
                <th className="border border-black px-3 py-1.5 text-left font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scores).map(([subject, score]) => (
                <tr key={subject} className="break-inside-avoid">
                  <td className="border border-black px-3 py-1 font-bold uppercase truncate max-w-[150px]">{subject}</td>
                  <td className="border border-black px-1 py-1 text-center">{score.ca1 ?? '-'}</td>
                  <td className="border border-black px-1 py-1 text-center">{score.ca2 ?? '-'}</td>
                  <td className="border border-black px-1 py-1 text-center">{score.exam ?? '-'}</td>
                  <td className="border border-black px-1 py-1 text-center font-bold">
                    {score.total ?? (Number(score.ca1 || 0) + Number(score.ca2 || 0) + Number(score.exam || 0))}
                  </td>
                  <td className="border border-black px-1 py-1 text-center font-bold">{score.grade ?? '-'}</td>
                  <td className="border border-black px-3 py-1 text-[10px] italic truncate max-w-[150px]">{score.remark ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grading Key & Comments */}
        <div className="grid grid-cols-12 gap-4 text-xs mt-auto">
           <div className="col-span-4 border border-black p-3">
              <h3 className="font-bold underline mb-1.5 uppercase text-[9px]">Grading Key</h3>
              <div className="space-y-0.5 text-[8px]">
                 {grades.map(g => (
                   <div key={g.grade} className="flex justify-between border-b border-gray-100 pb-0.5">
                      <span className="font-bold w-4">{g.grade}</span>
                      <span className="w-12 text-center">{g.min}-{g.max}</span>
                      <span className="italic flex-grow text-right truncate pl-2">{g.remark}</span>
                   </div>
                 ))}
              </div>
           </div>
           <div className="col-span-8 border border-black p-3 space-y-3">
              <div className="break-inside-avoid">
                 <h3 className="font-bold underline mb-0.5 uppercase text-[9px]">Class Teacher's Comment:</h3>
                 <p className="italic border-b border-dotted border-black min-h-[1.2rem] text-[10px] leading-relaxed">
                   {extras?.comments?.teacher ? `"${extras.comments.teacher}"` : '..................................................................................................'}
                 </p>
              </div>
              <div className="break-inside-avoid">
                 <h3 className="font-bold underline mb-0.5 uppercase text-[9px]">Principal's Comment:</h3>
                 <p className="italic border-b border-dotted border-black min-h-[1.2rem] text-[10px] leading-relaxed">
                   {extras?.comments?.principal ? `"${extras.comments.principal}"` : '..................................................................................................'}
                 </p>
              </div>
           </div>
        </div>

        {/* Signatures */}
        <div className="mt-10 grid grid-cols-2 gap-16 text-center text-[10px] font-bold uppercase pb-4">
           <div className="space-y-1.5 break-inside-avoid">
              <div className="border-b border-black h-8" />
              <p className="tracking-widest">Class Teacher's Signature</p>
           </div>
           <div className="space-y-1.5 break-inside-avoid">
              <div className="border-b border-black h-8 flex items-center justify-center italic font-serif lowercase text-lg leading-none">
                 {school.principal}
              </div>
              <p className="tracking-widest">Principal's Signature & Stamp</p>
           </div>
        </div>

        <div className="absolute bottom-[1.2cm] left-0 right-0 text-center text-[7px] font-bold text-gray-400 uppercase tracking-[0.4em]">
           Official Academic Record • Printed via ReportSheet
        </div>
      </div>
    </div>
  );
};
