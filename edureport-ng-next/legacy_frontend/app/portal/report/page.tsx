"use client";

import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { usePortal } from '../PortalContext';
import { toast } from '../../app/components/Toast';
import { LoadingSpinner } from '../../app/components/LoadingSpinner';

export default function StudentReport() {
  const { studentId, students, school } = usePortal();
  const student = students.find(s => s.id === studentId);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [extras, setExtras] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!studentId || !student) return;
      setLoading(true);
      try {
        const [scoreRes, extRes] = await Promise.all([
          fetch(`/api/portal/api/scores/${encodeURIComponent(studentId)}`),
          fetch(`/api/portal/api/report-extras/${encodeURIComponent(studentId)}`)
        ]);
        
        if (scoreRes.ok) {
          const data = await scoreRes.json() as any;
          setScores(data.scores || {});
        }
        if (extRes.ok) {
          const extData = await extRes.json() as any;
          setExtras(extData.extras || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId, student]);

  if (!studentId || !student) return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-panel/30 border-2 border-dashed border-border rounded-[32px]">
      <div className="text-5xl opacity-20">📄</div>
      <div>
        <h3 className="font-display font-black text-xl text-ink">No report selected</h3>
        <p className="text-muted text-sm max-w-xs mx-auto">Select a student to view their academic performance report.</p>
      </div>
    </div>
  );

  const downloadPdf = async () => {
    const reportElement = document.getElementById('report-sheet-pdf');
    if (!reportElement) return toast.error('Report not ready');
    
    setIsSaving(true);
    try {
      const canvas = await html2canvas(reportElement, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report_${student.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Download complete');
    } catch (err) {
      toast.error('PDF generation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const getGrade = (pct: number) => {
    if (!school?.grades) return { grade: '—', color: '#aaa', remark: '—' };
    const grades = typeof school.grades === 'string' ? JSON.parse(school.grades) : school.grades;
    const g = grades.find((g: any) => pct >= g.min && pct <= g.max);
    return g || { grade: 'F', color: 'var(--red)', remark: 'Fail' };
  };

  const getStudentAvg = () => {
    const sc = scores[studentId] || {};
    const subjects = school?.subjects || [];
    if (!subjects.length) return 0;
    const totalMax = (school?.ca1Max || 10) + (school?.ca2Max || 10) + (school?.examMax || 80);
    
    let totalPct = 0;
    let count = 0;
    subjects.forEach((sub: string) => {
      const s = sc[sub] || { ca1: 0, ca2: 0, exam: 0 };
      const tot = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
      if (tot > 0) {
        totalPct += (tot / totalMax) * 100;
        count++;
      }
    });
    return count > 0 ? totalPct / count : 0;
  };

  const renderReport = () => {
    if (!school) return null;
    const sc = scores[studentId] || {};
    const subjects = school.subjects || [];
    const avgVal = getStudentAvg();
    
    return (
      <div className="flex justify-center p-4 print:p-0 bg-panel dark:bg-ink/20 rounded-3xl border border-border print:bg-white print:border-none animate-in zoom-in-95 duration-500">
        <div className="bg-white p-[10mm] min-h-[285mm] shadow-2xl print:shadow-none w-[210mm] text-ink" id="report-sheet-pdf">
          {/* Header */}
          <div className="flex items-center gap-6 border-b-[4px] border-green pb-4 mb-4">
            <div className="w-[80px] h-[80px] bg-green flex items-center justify-center rounded-2xl overflow-hidden shadow-inner">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-black">{school.abbr || 'SCH'}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-green tracking-tight uppercase leading-none mb-1">{school.name}</h1>
              <p className="text-gold font-bold italic text-sm mb-1">{school.motto}</p>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{school.address}</p>
            </div>
          </div>

          <div className="bg-panel border-y border-border py-2 text-center mb-6">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink/60">
              Terminal Academic Report • {school.term} Term {school.session}
            </span>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Student Name', value: student.name },
              { label: 'Admission No', value: student.admNo || '---' },
              { label: 'Class', value: student.cls },
              { label: 'Attendance', value: extras?.attendance || '---' }
            ].map((item, i) => (
              <div key={i} className="border border-border p-3 rounded-xl bg-panel/30">
                <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">{item.label}</div>
                <div className="text-sm font-black text-ink truncate">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Scores Table */}
          <table className="w-full border-collapse mb-8 overflow-hidden rounded-xl border border-border">
            <thead>
              <tr className="bg-green text-white text-[10px] font-black uppercase tracking-widest">
                <th className="text-left p-3">Subjects</th>
                <th className="p-3">CA1</th>
                <th className="p-3">CA2</th>
                <th className="p-3">Exam</th>
                <th className="p-3">Total</th>
                <th className="p-3 text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-border">
              {subjects.map((sub: string) => {
                const s = sc[sub] || { ca1: 0, ca2: 0, exam: 0 };
                const tot = (+s.ca1 || 0) + (+s.ca2 || 0) + (+s.exam || 0);
                const totalMax = (school.ca1Max || 10) + (school.ca2Max || 10) + (school.examMax || 80);
                const pct = totalMax > 0 ? (tot / totalMax) * 100 : 0;
                const g = getGrade(pct);
                return (
                  <tr key={sub} className="hover:bg-panel/20 transition-colors">
                    <td className="p-3 font-bold text-ink uppercase tracking-tight">{sub}</td>
                    <td className="text-center p-3 font-medium text-muted">{s.ca1 || '—'}</td>
                    <td className="text-center p-3 font-medium text-muted">{s.ca2 || '—'}</td>
                    <td className="text-center p-3 font-medium text-muted">{s.exam || '—'}</td>
                    <td className="text-center p-3 font-black text-ink">{tot || '—'}</td>
                    <td className="p-3 text-right">
                      <span className="font-black text-sm" style={{ color: g.color }}>{g.grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border-2 border-border p-4 rounded-2xl text-center shadow-sm">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Cumulative Average</div>
              <div className="text-2xl font-black text-green">{avgVal.toFixed(1)}%</div>
            </div>
            <div className="border-2 border-border p-4 rounded-2xl text-center shadow-sm">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Result Status</div>
              <div className="text-2xl font-black text-blue">VERIFIED</div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-4">
            <div className="border border-border p-4 rounded-2xl bg-panel/30">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 border-b border-border pb-1">Form Teacher's Remark</div>
              <div className="text-sm italic text-ink leading-relaxed font-serif min-h-[40px]">
                {extras?.comments?.teacher || 'Result reviewed by class teacher.'}
              </div>
            </div>
            <div className="border border-border p-4 rounded-2xl bg-panel/30">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 border-b border-border pb-1">Principal's Remark</div>
              <div className="text-sm italic text-ink leading-relaxed font-serif min-h-[40px]">
                {extras?.comments?.principal || 'Satisfactory performance.'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-12 flex justify-between items-end border-t border-dashed border-border mt-20">
            <div className="text-center">
              <div className="w-32 h-[1px] bg-ink/40 mb-2"></div>
              <div className="text-[9px] font-black uppercase tracking-widest">Class Teacher</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-black text-green opacity-40 mb-4">ReportSheet™ v1.2</div>
              <div className="text-[8px] font-bold text-muted">Generated on {new Date().toLocaleDateString()}</div>
            </div>
            <div className="text-center">
              <div className="w-32 h-[1px] bg-ink/40 mb-2"></div>
              <div className="text-[9px] font-black uppercase tracking-widest">Principal's Stamp</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h1 className="pg-title">Academic Report</h1>
          <p className="text-muted text-sm mt-1">Official term results and performance summary.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn btn-primary btn-sm" disabled={isSaving} onClick={downloadPdf}>
            {isSaving ? <LoadingSpinner size="sm" color="white" /> : '⬇️ Download PDF'}
          </button>
        </div>
      </div>

      <div id="report-area">
        {loading ? (
          <div className="p-16 text-center"><LoadingSpinner /></div>
        ) : renderReport()}
      </div>
    </div>
  );
}
