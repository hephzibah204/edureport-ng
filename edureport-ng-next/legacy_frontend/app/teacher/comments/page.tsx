"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTeacher } from '../TeacherContext';

function CommentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classNameParam = searchParams.get('className') || '';
  
  const { classes } = useTeacher();
  const [students, setStudents] = useState<any[]>([]);
  const [extrasData, setExtrasData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [currentClass, setCurrentClass] = useState(classNameParam);

  const loadExtras = useCallback(async (cls: string) => {
    if (!cls) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/api/comments?className=${encodeURIComponent(cls)}`, { credentials: 'include' });
      const data = await res.json() as any;
      setStudents(data.students || []);
      
      const extrasMap: Record<string, any> = {};
      if (Array.isArray(data.extras)) {
        data.extras.forEach((e: any) => {
          extrasMap[e.studentId] = {
            attendance: e.attendance,
            traits: typeof e.traits === 'string' ? JSON.parse(e.traits || '{}') : (e.traits || {}),
            comments: typeof e.comments === 'string' ? JSON.parse(e.comments || '{}') : (e.comments || {}),
            promotion: e.promotion
          };
        });
      }
      setExtrasData(extrasMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classNameParam) setCurrentClass(classNameParam);
  }, [classNameParam]);

  useEffect(() => {
    if (currentClass) loadExtras(currentClass);
  }, [currentClass, loadExtras]);

  const handleDataChange = (studentId: string, field: string, val: any) => {
    setExtrasData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { attendance: '0', traits: {}, comments: {}, promotion: '' }),
        [field]: val
      }
    }));
  };

  const handleCommentChange = (studentId: string, type: string, val: string) => {
    const current = extrasData[studentId] || { attendance: '0', traits: {}, comments: {}, promotion: '' };
    const newComments = { ...(current.comments || {}), [type]: val };
    handleDataChange(studentId, 'comments', newComments);
  };

  const saveAll = async () => {
    if (!currentClass) return;
    try {
      const payload = Object.entries(extrasData).map(([studentId, data]) => ({
        studentId,
        ...data
      }));
      
      const res = await fetch('/api/teacher/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: payload }),
        credentials: 'include'
      });
      if (res.ok) alert('Comments saved');
      else alert('Failed to save comments');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.2rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Form Teacher Remarks
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Comments, Traits, and Promotion</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={currentClass} 
            onChange={e => {
              setCurrentClass(e.target.value);
              router.push(`/teacher/comments?className=${encodeURIComponent(e.target.value)}`);
            }}
            className="py-2 px-3 border-[1.5px] border-border rounded-[9px] font-sans outline-none bg-white focus:border-green"
          >
            <option value="">Select Class...</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={saveAll} disabled={!currentClass}>Save All</button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[180px_80px_1fr_1fr_120px] gap-2.5 items-center p-3 border-b border-border bg-panel font-bold text-[0.7rem] uppercase">
              <div>Student Name</div>
              <div className="text-center">Att.</div>
              <div>Teacher's Comment</div>
              <div>Principal's Comment</div>
              <div>Promotion</div>
            </div>
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted">Loading...</div>
              ) : students.length > 0 ? (
                students.map(s => {
                  const data = extrasData[s.id] || { attendance: '0', traits: {}, comments: {}, promotion: '' };
                  return (
                    <div key={s.id} className="grid grid-cols-[180px_80px_1fr_1fr_120px] gap-2.5 items-start p-3 border-b border-border bg-white hover:bg-panel">
                      <div className="font-semibold">{s.name}<div className="text-[0.7rem] text-muted font-normal">{s.admNo}</div></div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          className="w-full bg-[#f8f9ff] border border-[#0b1c30]/10 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                          placeholder="e.g. 95% (40/42)"
                          value={data.attendance} 
                          disabled
                        />
                      </div>
                      <div>
                        <textarea 
                          value={data.comments.teacher || ''} 
                          onChange={e => handleCommentChange(s.id, 'teacher', e.target.value)} 
                          placeholder="Teacher's remark..."
                          className="w-full p-2 border-[1.5px] border-border rounded-[8px] min-h-[80px] text-[0.82rem] outline-none focus:border-green resize-y"
                        />
                      </div>
                      <div>
                        <textarea 
                          value={data.comments.principal || ''} 
                          onChange={e => handleCommentChange(s.id, 'principal', e.target.value)} 
                          placeholder="Principal's remark..."
                          className="w-full p-2 border-[1.5px] border-border rounded-[8px] min-h-[80px] text-[0.82rem] outline-none focus:border-green resize-y"
                        />
                      </div>
                      <div>
                        <select 
                          value={data.promotion} 
                          onChange={e => handleDataChange(s.id, 'promotion', e.target.value)}
                          className="w-full p-2 border-[1.5px] border-border rounded-[8px] text-[0.85rem] outline-none focus:border-green"
                        >
                          <option value="">—</option>
                          <option value="Promoted">Promoted</option>
                          <option value="Promoted on Trial">Trial</option>
                          <option value="Advised to Repeat">Repeat</option>
                          <option value="Withdrawn">Withdrawn</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted">Select a class to begin.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentsPage() {
  return (
    <Suspense fallback={<div>Loading comments...</div>}>
      <CommentsContent />
    </Suspense>
  );
}
