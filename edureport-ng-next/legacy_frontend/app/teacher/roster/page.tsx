"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTeacher } from '../TeacherContext';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classNameParam = searchParams.get('className') || '';
  
  const { classes } = useTeacher();
  const [currentClass, setCurrentClass] = useState(classNameParam);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { mark: string; note: string }>>({});
  const [sessionStatus, setSessionStatus] = useState('DRAFT');
  const [lastSaved, setLastSaved] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyRange, setHistoryRange] = useState({
    from: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const loadAttendance = useCallback(async (cls: string, dt: string) => {
    if (!cls || !dt) return;
    setLoading(true);
    try {
      // Load Students
      const studentsRes = await fetch(`/api/teacher/api/students?className=${encodeURIComponent(cls)}`, { credentials: 'include' });
      const studentsData = await studentsRes.json() as any;
      const students = Array.isArray(studentsData?.students) ? studentsData.students : [];
      setRoster(students);

      // Load Session
      const sessRes = await fetch(`/api/teacher/api/attendance/session?className=${encodeURIComponent(cls)}&date=${encodeURIComponent(dt)}`, { credentials: 'include' });
      const sessData: any = await sessRes.json();
      
      const newMarks: Record<string, { mark: string; note: string }> = {};
      if (Array.isArray(sessData?.marks)) {
        sessData.marks.forEach((m: any) => {
          newMarks[String(m.studentId)] = { mark: m.mark, note: m.note || '' };
        });
      }
      setMarks(newMarks);
      setSessionStatus(sessData?.session?.status || 'DRAFT');
      setLastSaved(sessData?.session?.updatedAt ? `Last saved: ${sessData.session.updatedAt}` : '');
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!currentClass) return;
    try {
      const res = await fetch(`/api/teacher/api/attendance/history?className=${encodeURIComponent(currentClass)}&from=${encodeURIComponent(historyRange.from)}&to=${encodeURIComponent(historyRange.to)}`, { credentials: 'include' });
      const data = await res.json() as any;
      setHistory(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, [currentClass, historyRange]);

  useEffect(() => {
    if (classNameParam) {
      setCurrentClass(classNameParam);
    }
  }, [classNameParam]);

  useEffect(() => {
    if (currentClass) {
      loadAttendance(currentClass, date);
      loadHistory();
    }
  }, [currentClass, date, loadAttendance, loadHistory]);

  const handleMark = (studentId: string, mark: string) => {
    if (sessionStatus === 'SUBMITTED') return;
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], mark }
    }));
  };

  const handleNote = (studentId: string, note: string) => {
    if (sessionStatus === 'SUBMITTED') return;
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
  };

  const markAll = (mark: string) => {
    if (sessionStatus === 'SUBMITTED') return;
    const newMarks: Record<string, { mark: string; note: string }> = {};
    roster.forEach(s => {
      newMarks[String(s.id)] = { mark, note: marks[String(s.id)]?.note || '' };
    });
    setMarks(newMarks);
  };

  const saveAttendance = async (silent = false) => {
    if (sessionStatus === 'SUBMITTED' || !currentClass) return;
    try {
      const payload = Object.entries(marks)
        .filter(([_, v]) => v.mark)
        .map(([id, v]) => ({ studentId: id, mark: v.mark, note: v.note }));

      const res = await fetch('/api/teacher/api/attendance/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className: currentClass, date, marks: payload }),
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      if (!silent) {
        alert('Draft saved');
      }
      setLastSaved(`Last saved: ${new Date().toISOString()}`);
    } catch (err) {
      console.error(err);
    }
  };

  const submitAttendance = async () => {
    if (sessionStatus === 'SUBMITTED' || !currentClass) return;
    if (!confirm('Submit attendance? You will not be able to edit afterwards.')) return;
    
    await saveAttendance(true);
    
    try {
      const sessRes = await fetch(`/api/teacher/api/attendance/session?className=${encodeURIComponent(currentClass)}&date=${encodeURIComponent(date)}`, { credentials: 'include' });
      const sessData: any = await sessRes.json();
      const sid = sessData?.session?.id;
      if (!sid) throw new Error('Missing session ID');

      const res = await fetch(`/api/teacher/api/attendance/submit/${encodeURIComponent(sid)}`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to submit');
      
      setSessionStatus('SUBMITTED');
      alert('Attendance submitted');
    } catch (err) {
      console.error(err);
    }
  };

  const openStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/teacher/api/student/${encodeURIComponent(id)}`, { credentials: 'include' });
      const data = await res.json() as any;
      setSelectedStudent(data.student);
    } catch (err) {
      console.error(err);
    }
  };

  const summary = {
    present: Object.values(marks).filter(m => m.mark === 'PRESENT').length,
    late: Object.values(marks).filter(m => m.mark === 'LATE').length,
    absent: Object.values(marks).filter(m => m.mark === 'ABSENT').length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.2rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Attendance
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Mark daily attendance per class</small>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-[1.2rem]">
          <select 
            value={currentClass} 
            onChange={(e) => {
              const cls = e.target.value;
              setCurrentClass(cls);
              router.push(`/teacher/roster?className=${encodeURIComponent(cls)}`);
            }}
            className="py-2 px-3 border-[1.5px] border-border rounded-[9px] font-sans outline-none bg-white focus:border-green"
          >
            <option value="">Select class…</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="py-2 px-3 border-[1.5px] border-border rounded-[9px] font-sans outline-none bg-white focus:border-green"
          />
          <span className={`inline-flex px-2.5 py-1 rounded-full font-extrabold text-[0.7rem] ${sessionStatus === 'SUBMITTED' ? 'bg-green4 text-green' : 'bg-gold3 text-gold'}`}>
            {sessionStatus}
          </span>
          <span className="text-[0.75rem] text-muted">{lastSaved}</span>
          <button className="btn btn-outline btn-sm" onClick={() => markAll('PRESENT')} disabled={sessionStatus === 'SUBMITTED'}>Mark all present</button>
          <button className="btn btn-outline btn-sm" onClick={() => saveAttendance()} disabled={sessionStatus === 'SUBMITTED'}>Save draft</button>
          <button className="btn btn-primary btn-sm" onClick={() => submitAttendance()} disabled={sessionStatus === 'SUBMITTED'}>Submit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="bg-white border border-border rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-h-[calc(100vh-220px)] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 bg-panel text-left p-[10px_12px] text-[0.72rem] tracking-[0.08em] uppercase text-muted border-b border-border w-[40%]">Student</th>
                <th className="sticky top-0 bg-panel text-left p-[10px_12px] text-[0.72rem] tracking-[0.08em] uppercase text-muted border-b border-border w-[30%]">Mark</th>
                <th className="sticky top-0 bg-panel text-left p-[10px_12px] text-[0.72rem] tracking-[0.08em] uppercase text-muted border-b border-border">Note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center p-8 text-muted">Loading roster...</td></tr>
              ) : roster.length > 0 ? (
                roster.map(s => {
                  const id = String(s.id);
                  const cur = marks[id]?.mark || '';
                  const note = marks[id]?.note || '';
                  return (
                    <tr key={id}>
                      <td className="p-[10px_12px] border-b border-border text-[0.86rem]">
                        <button className="btn btn-ghost btn-sm" onClick={() => openStudent(id)}>
                          {s.name} <span className="font-semibold text-muted">· {s.admNo}</span>
                        </button>
                      </td>
                      <td className="p-[10px_12px] border-b border-border text-[0.86rem]">
                        <div className="inline-flex border border-border rounded-[10px] overflow-hidden">
                          <button className={`border-none bg-white p-[7px_10px] font-extrabold text-[0.74rem] cursor-pointer text-muted ${cur === 'PRESENT' ? '!bg-green !text-white' : ''}`} onClick={() => handleMark(id, 'PRESENT')}>Present</button>
                          <button className={`border-none bg-white p-[7px_10px] font-extrabold text-[0.74rem] cursor-pointer text-muted ${cur === 'LATE' ? '!bg-gold !text-white' : ''}`} onClick={() => handleMark(id, 'LATE')}>Late</button>
                          <button className={`border-none bg-white p-[7px_10px] font-extrabold text-[0.74rem] cursor-pointer text-muted ${cur === 'ABSENT' ? '!bg-red !text-white' : ''}`} onClick={() => handleMark(id, 'ABSENT')}>Absent</button>
                        </div>
                      </td>
                      <td className="p-[10px_12px] border-b border-border text-[0.86rem]">
                        <input 
                          value={note} 
                          placeholder="optional" 
                          className="w-full py-2 px-2.5 border-[1.5px] border-border rounded-[9px] font-sans outline-none focus:border-green"
                          onChange={(e) => handleNote(id, e.target.value)}
                          disabled={sessionStatus === 'SUBMITTED'}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={3} className="text-center p-8 text-muted">Select a class and date.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-4">
            <div className="font-bold text-[1rem] mb-[1.2rem]">Quick Summary</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-border rounded-[12px] p-[0.8rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] m-0">
                <div className="text-[0.68rem] font-bold uppercase tracking-[0.05em] text-muted">Present</div>
                <div className="font-display text-[1.4rem] font-black text-green mt-1">{summary.present}</div>
              </div>
              <div className="bg-white border border-border rounded-[12px] p-[0.8rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] m-0">
                <div className="text-[0.68rem] font-bold uppercase tracking-[0.05em] text-muted">Late</div>
                <div className="font-display text-[1.4rem] font-black text-green mt-1">{summary.late}</div>
              </div>
              <div className="bg-white border border-border rounded-[12px] p-[0.8rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] m-0">
                <div className="text-[0.68rem] font-bold uppercase tracking-[0.05em] text-muted">Absent</div>
                <div className="font-display text-[1.4rem] font-black text-green mt-1">{summary.absent}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="font-bold text-[1rem] mb-[1.2rem]">History</div>
            <div className="flex flex-wrap gap-2 mb-[10px]">
              <input type="date" value={historyRange.from} onChange={(e) => setHistoryRange(prev => ({ ...prev, from: e.target.value }))} className="p-2 rounded-lg border border-border text-[0.85rem] focus:outline-none focus:border-green" />
              <input type="date" value={historyRange.to} onChange={(e) => setHistoryRange(prev => ({ ...prev, to: e.target.value }))} className="p-2 rounded-lg border border-border text-[0.85rem] focus:outline-none focus:border-green" />
              <button className="btn btn-ghost btn-sm" onClick={loadHistory}>Load</button>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {history.length > 0 ? (
                history.map(s => (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-[10px_12px] border border-border rounded-[12px] mb-2 bg-white">
                    <div>
                      <strong className="text-[0.9rem]">{s.sessionDate}</strong>
                      <div className="text-[0.78rem] text-muted">{currentClass}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2.5 py-1 rounded-full font-extrabold text-[0.7rem] ${s.status === 'SUBMITTED' ? 'bg-green4 text-green' : 'bg-gold3 text-gold'}`}>{s.status}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDate(s.sessionDate)}>Open</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[0.82rem] text-muted">No history found for this range.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-8 backdrop-blur-[2px]" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-[16px] w-[min(100%,600px)] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-4 border-b border-border bg-panel">
              <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">{selectedStudent.name}<small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">{selectedStudent.admNo} · {selectedStudent.cls}</small></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-6 p-[1.4rem]">
              <div className="flex flex-col gap-1"><label className="text-[0.8rem] font-bold text-muted uppercase tracking-[0.05em]">Gender</label><div className="font-bold">{selectedStudent.gender || '—'}</div></div>
              <div className="flex flex-col gap-1"><label className="text-[0.8rem] font-bold text-muted uppercase tracking-[0.05em]">Date of Birth</label><div className="font-bold">{selectedStudent.dob || '—'}</div></div>
              <div className="flex flex-col gap-1"><label className="text-[0.8rem] font-bold text-muted uppercase tracking-[0.05em]">House</label><div className="font-bold">{selectedStudent.house || '—'}</div></div>
              <div className="flex flex-col gap-1"><label className="text-[0.8rem] font-bold text-muted uppercase tracking-[0.05em]">Guardian</label><div className="font-bold">{selectedStudent.guardianName || '—'}</div></div>
              <div className="flex flex-col gap-1"><label className="text-[0.8rem] font-bold text-muted uppercase tracking-[0.05em]">Guardian Phone</label><div className="font-bold">{selectedStudent.guardianPhone || '—'}</div></div>
              <div className="flex flex-col gap-1"><label className="text-[0.8rem] font-bold text-muted uppercase tracking-[0.05em]">Address</label><div className="font-bold">{selectedStudent.address || '—'}</div></div>
            </div>
            <div className="flex justify-end p-4 border-t border-border">
              <button className="btn btn-ghost" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading attendance...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
