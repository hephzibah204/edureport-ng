"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSchool } from '../SchoolContext';

function BroadsheetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classFilter = searchParams.get('className') || '';
  
  const { students, scores, school } = useSchool();
  const [search, setSearch] = useState('');

  const classes = [...new Set(students.map(s => s.cls).filter(Boolean))].sort();
  const subjects = school?.subjects || [];
  const totalMax = (school?.ca1Max || 10) + (school?.ca2Max || 10) + (school?.examMax || 80);

  const filteredStudents = students.filter(s => {
    const matchesClass = !classFilter || s.cls === classFilter;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.admNo.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const getStudentStats = (sid: string) => {
    const sc = scores[sid] || {};
    let totalObtained = 0;
    let count = 0;
    subjects.forEach((sub: string) => {
      const s = sc[sub] || { ca1: 0, ca2: 0, exam: 0 };
      const tot = (+s.ca1 || 0) + (+s.ca2 || 0) + (+s.exam || 0);
      if (tot > 0) {
        totalObtained += tot;
        count++;
      }
    });
    const avg = count > 0 ? (totalObtained / (count * totalMax)) * 100 : 0;
    return { total: totalObtained, avg, count };
  };

  // Ranking logic
  const ranked = filteredStudents.map(s => ({ ...s, ...getStudentStats(s.id) }))
    .sort((a, b) => b.total - a.total);
  
  const getPosition = (total: number) => {
    if (total === 0) return '—';
    return ranked.filter(s => s.total > total).length + 1;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4 print:hidden">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">Broadsheet<small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Class-wide performance overview</small></div>
        <div className="flex gap-2">
          <select 
            value={classFilter} 
            onChange={e => router.push(`/app/broadsheet?className=${encodeURIComponent(e.target.value)}`)}
            className="py-2 px-3 border-[1.5px] border-border rounded-lg outline-none font-sans bg-white focus:border-green"
          >
            <option value="">Select Class…</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="inline-flex items-center justify-center font-bold rounded-lg transition-colors bg-green text-white hover:bg-green2 px-4 py-2 text-[0.85rem]" onClick={() => window.print()}>🖨️ Print Broadsheet</button>
        </div>
      </div>

      {!classFilter ? (
        <div className="text-center p-16 text-muted bg-white rounded-[12px] border border-border">
          Select a class to view the broadsheet.
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[12px] overflow-auto shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-h-[calc(100vh-220px)] print:shadow-none print:border-none print:max-h-none print:overflow-visible">
          <table className="w-full border-collapse text-[0.8rem] print:text-[0.7rem]">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 bg-panel z-[15] p-2.5 border border-border text-[0.65rem] uppercase text-muted text-left w-[200px] print:static">Student Name</th>
                {subjects.map(sub => <th key={sub} className="sticky top-0 bg-panel z-[10] p-2.5 border border-border text-[0.65rem] uppercase text-muted print:static">{sub}</th>)}
                <th className="sticky top-0 bg-panel z-[10] p-2.5 border border-border text-[0.65rem] uppercase text-muted font-extrabold print:static">Total</th>
                <th className="sticky top-0 bg-green4 z-[10] p-2.5 border border-border text-[0.65rem] uppercase text-green font-extrabold print:static">Avg %</th>
                <th className="sticky top-0 bg-panel z-[10] p-2.5 border border-border text-[0.65rem] uppercase text-muted print:static">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(s => (
                <tr key={s.id} className="hover:bg-panel transition-colors">
                  <td className="sticky left-0 bg-white z-[5] p-[8px_10px] border border-border font-bold text-left hover:bg-panel print:static print:bg-transparent">
                    {s.name}<br/><small className="text-muted font-normal text-[0.7rem]">{s.admNo}</small>
                  </td>
                  {subjects.map(sub => {
                    const sc = (scores[s.id] || {})[sub] || { ca1: 0, ca2: 0, exam: 0 };
                    const tot = (+sc.ca1 || 0) + (+sc.ca2 || 0) + (+sc.exam || 0);
                    return <td key={sub} className="p-[8px_10px] border border-border text-center">{tot || '—'}</td>;
                  })}
                  <td className="p-[8px_10px] border border-border text-center font-extrabold bg-panel/50 print:bg-transparent">{s.total || '—'}</td>
                  <td className="p-[8px_10px] border border-border text-center font-extrabold text-green bg-green4/50 print:bg-transparent print:text-black">{s.avg ? s.avg.toFixed(1) : '—'}</td>
                  <td className="p-[8px_10px] border border-border text-center font-extrabold">{getPosition(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function BroadsheetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted bg-white rounded-xl border border-border">Loading broadsheet...</div>}>
      <BroadsheetContent />
    </Suspense>
  );
}
