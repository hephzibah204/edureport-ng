"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentIdParam = searchParams.get('id') || '';

  const { students, school, scores, refreshScores } = useSchool();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [extras, setExtras] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceForm, setAttendanceModal] = useState({ present: '', total: '' });
  const [editingComments, setEditingComments] = useState({ teacher: '', principal: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadExtras = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/report-extras/${encodeURIComponent(sid)}`);
      const data = await res.json() as any;
      setExtras(data.extras || null);
      if (data.extras?.comments) {
        setEditingComments({
          teacher: data.extras.comments.teacher || '',
          principal: data.extras.comments.principal || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (studentIdParam) {
      const s = students.find(x => x.id === studentIdParam);
      if (s) {
        setSelectedStudent(s);
        loadExtras(s.id);
      }
    }
  }, [studentIdParam, students, loadExtras]);

  const handleStudentSelect = (id: string) => {
    const s = students.find(x => x.id === id);
    setSelectedStudent(s);
    if (s) loadExtras(s.id);
    router.push(`/app/report?id=${encodeURIComponent(id)}`);
  };

  const saveExtras = async (updatedExtras: any) => {
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/report-extras/${encodeURIComponent(selectedStudent.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExtras)
      });
      if (res.ok) {
        toast.success('Report updated');
        loadExtras(selectedStudent.id);
      }
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const generateAiRemarks = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    toast.loading('Generating AI remarks...');
    try {
      const resT = await fetch('/api/ai/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id, type: 'teacher' })
      });
      const dataT: any = await resT.json();
      
      const resP = await fetch('/api/ai/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id, type: 'principal' })
      });
      const dataP: any = await resP.json();

      setEditingComments({
        teacher: dataT.remark,
        principal: dataP.remark
      });
      toast.dismiss();
      toast.success('Remarks generated! Review and save.');
    } catch (err) {
      toast.dismiss();
      toast.error('AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const getGrade = (pct: number) => {
    if (!school?.grades) return { grade: '—', color: '#aaa', remark: '—' };
    const g = school.grades.find((g: any) => pct >= g.min && pct <= g.max);
    return g || { grade: 'F', color: 'var(--red)', remark: 'Fail' };
  };

  const getStudentAvg = (sid: string) => {
    const sc = scores[sid] || {};
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

  const getPositionSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

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
      pdf.save(`Report_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Download complete');
    } catch (err) {
      toast.error('PDF generation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const renderReport = () => {
    if (!selectedStudent || !school) return null;
    const sc = scores[selectedStudent.id] || {};
    const subjects = school.subjects || [];
    const totalMax = (school.ca1Max || 10) + (school.ca2Max || 10) + (school.examMax || 80);
    const avgVal = getStudentAvg(selectedStudent.id);
    
    const classMates = students.filter(s => s.cls === selectedStudent.cls);
    const allAvgs = classMates.map(s => getStudentAvg(s.id)).sort((a, b) => b - a);
    const position = allAvgs.indexOf(avgVal) + 1;
    
    return (
      <div className="flex justify-center p-4 print:p-0 bg-panel dark:bg-ink/20 rounded-3xl border border-border print:bg-white print:border-none">
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
              { label: 'Student Name', value: selectedStudent.name },
              { label: 'Admission No', value: selectedStudent.admNo || '---' },
              { label: 'Class', value: selectedStudent.cls },
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

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Average Score', value: `${avgVal.toFixed(1)}%`, color: 'text-green' },
              { label: 'Class Position', value: getPositionSuffix(position), color: 'text-gold' },
              { label: 'Class Size', value: classMates.length, color: 'text-blue' }
            ].map((item, i) => (
              <div key={i} className="border-2 border-border p-4 rounded-2xl text-center shadow-sm">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{item.label}</div>
                <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Remarks */}
          <div className="space-y-4">
            <div className="border border-border p-4 rounded-2xl bg-panel/30">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 border-b border-border pb-1">Form Teacher's Remark</div>
              <div className="text-sm italic text-ink leading-relaxed font-serif">
                {extras?.comments?.teacher || '____________________________________________________________________________________________________'}
              </div>
            </div>
            <div className="border border-border p-4 rounded-2xl bg-panel/30">
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 border-b border-border pb-1">Principal's Remark</div>
              <div className="text-sm italic text-ink leading-relaxed font-serif">
                {extras?.comments?.principal || '____________________________________________________________________________________________________'}
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
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <h1 className="pg-title">Report Center</h1>
          <p className="text-muted text-sm mt-1">Preview, customize, and batch-print academic results.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            className="field !mb-0 py-2 px-3 border border-border rounded-lg outline-none focus:border-green bg-white dark:bg-card-bg text-sm font-bold shadow-sm min-w-[200px]" 
            value={selectedStudent?.id || ''} 
            onChange={e => handleStudentSelect(e.target.value)}
          >
            <option value="">— Select Student —</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.cls})</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" disabled={!selectedStudent} onClick={() => window.print()}>🖨️ Print</button>
          <button className="btn btn-primary btn-sm" disabled={!selectedStudent || isSaving} onClick={downloadPdf}>
            {isSaving ? <LoadingSpinner size="sm" color="white" /> : '⬇️ Download'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Panel */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="card space-y-6 sticky top-24">
            <h3 className="font-display font-black text-ink uppercase tracking-wider text-sm border-b border-border pb-3 flex items-center gap-2">
              🛠️ Customize Report
            </h3>
            
            <div className="space-y-4">
              <div className="field">
                <label>Attendance <span className="text-blue text-xs ml-1">(Auto-Calculated)</span></label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="w-full p-2 border-[1.5px] border-border rounded-[8px] outline-none bg-gray-50" 
                    placeholder="e.g. 95% (40/42)"
                    value={extras?.attendance || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-muted tracking-widest">Remarks</label>
                  <button 
                    onClick={generateAiRemarks}
                    disabled={isGenerating}
                    className="text-[10px] font-black text-green hover:underline flex items-center gap-1"
                  >
                    {isGenerating ? <LoadingSpinner size="sm" /> : '✨ Auto-Generate'}
                  </button>
                </div>
                <textarea 
                  placeholder="Teacher's comment..." 
                  className="w-full text-xs h-24"
                  value={editingComments.teacher}
                  onChange={e => setEditingComments({...editingComments, teacher: e.target.value})}
                />
                <textarea 
                  placeholder="Principal's comment..." 
                  className="w-full text-xs h-24"
                  value={editingComments.principal}
                  onChange={e => setEditingComments({...editingComments, principal: e.target.value})}
                />
                <button 
                  className="btn btn-primary btn-full btn-sm" 
                  onClick={() => saveExtras({...extras, comments: editingComments})}
                  disabled={isSaving}
                >
                  Save All Remarks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          {!selectedStudent ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-panel/30 border-2 border-dashed border-border rounded-[32px] print:hidden">
              <div className="text-5xl opacity-20">📄</div>
              <div>
                <h3 className="font-display font-black text-xl text-ink">Preview will appear here</h3>
                <p className="text-muted text-sm max-w-xs mx-auto">Select a student from the dropdown above to view their term report.</p>
              </div>
            </div>
          ) : (
            <motion.div 
              key={selectedStudent.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              {renderReport()}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center"><LoadingSpinner /></div>}>
      <ReportContent />
    </Suspense>
  );
}
