"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTeacher } from '../TeacherContext';

function ScoresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classNameParam = searchParams.get('className') || '';
  
  const { classes, school } = useTeacher();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentClass, setCurrentClass] = useState(classNameParam);
  const [currentSubject, setCurrentSubject] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [maxScores, setMaxScores] = useState({ ca1: 10, ca2: 10, exam: 80 });

  useEffect(() => {
    if (school) {
      if (school.subjects) setSubjects(school.subjects);
      setMaxScores({
        ca1: school.ca1Max || 10,
        ca2: school.ca2Max || 10,
        exam: school.examMax || 80
      });
    }
  }, [school]);

  const loadScores = useCallback(async (cls: string) => {
    if (!cls) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/api/scores?className=${encodeURIComponent(cls)}`, { credentials: 'include' });
      const data = await res.json() as any;
      setStudents(data.students || []);
      
      const scoresMap: Record<string, any> = {};
      if (Array.isArray(data.scores)) {
        data.scores.forEach((s: any) => {
          try {
            scoresMap[s.studentId] = JSON.parse(s.data);
          } catch (e) {
            scoresMap[s.studentId] = {};
          }
        });
      }
      setScoreData(scoresMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (classNameParam) {
      setCurrentClass(classNameParam);
    }
  }, [classNameParam]);

  useEffect(() => {
    if (currentClass) loadScores(currentClass);
  }, [currentClass, loadScores]);

  const handleScoreChange = (studentId: string, type: 'ca1' | 'ca2' | 'exam', val: string) => {
    if (!currentSubject) return;
    const num = parseInt(val) || 0;
    
    setScoreData(prev => {
      const studentScores = prev[studentId] || {};
      const subjectScores = studentScores[currentSubject] || { ca1: 0, ca2: 0, exam: 0 };
      
      return {
        ...prev,
        [studentId]: {
          ...studentScores,
          [currentSubject]: {
            ...subjectScores,
            [type]: num
          }
        }
      };
    });
  };

  const saveAll = async () => {
    if (!currentClass) return;
    try {
      const payload = Object.entries(scoreData).map(([studentId, data]) => ({
        studentId,
        data
      }));
      
      const res = await fetch('/api/teacher/api/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: payload }),
        credentials: 'include'
      });
      if (res.ok) alert('Scores saved');
      else alert('Failed to save scores');
    } catch (err) {
      console.error(err);
    }
  };

  const getGrade = (total: number) => {
    if (!school?.grades) return '—';
    const g = school.grades.find((g: any) => total >= g.min && total <= g.max);
    return g ? g.grade : 'F';
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.2rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Subject Grading
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Enter scores for your class</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={currentClass} 
            onChange={e => {
              setCurrentClass(e.target.value);
              router.push(`/teacher/scores?className=${encodeURIComponent(e.target.value)}`);
            }}
            className="py-2 px-3 border-[1.5px] border-border rounded-[9px] font-sans outline-none bg-white focus:border-green"
          >
            <option value="">Select Class...</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={currentSubject} 
            onChange={e => setCurrentSubject(e.target.value)}
            className="py-2 px-3 border-[1.5px] border-border rounded-[9px] font-sans outline-none bg-white focus:border-green"
          >
            <option value="">Select Subject...</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={saveAll} disabled={!currentClass}>Save All</button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[200px_repeat(3,80px)_60px_80px] gap-2.5 items-center p-3 border-b border-border bg-panel font-bold text-[0.7rem] uppercase">
              <div>Student Name</div>
              <div className="text-center">CA1 ({maxScores.ca1})</div>
              <div className="text-center">CA2 ({maxScores.ca2})</div>
              <div className="text-center">Exam ({maxScores.exam})</div>
              <div className="text-center">Total</div>
              <div className="text-center">Grade</div>
            </div>
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted">Loading scores...</div>
              ) : students.length > 0 ? (
                students.map(s => {
                  const sData = (scoreData[s.id] || {})[currentSubject] || { ca1: 0, ca2: 0, exam: 0 };
                  const total = (sData.ca1 || 0) + (sData.ca2 || 0) + (sData.exam || 0);
                  return (
                    <div key={s.id} className="grid grid-cols-[200px_repeat(3,80px)_60px_80px] gap-2.5 items-center p-3 border-b border-border bg-white hover:bg-panel">
                      <div className="font-semibold">{s.name}</div>
                      <div>
                        <input 
                          type="number" 
                          value={sData.ca1 || ''} 
                          onChange={e => handleScoreChange(s.id, 'ca1', e.target.value)} 
                          disabled={!currentSubject}
                          className="w-full p-2 border-[1.5px] border-border rounded-[8px] text-center outline-none focus:border-green"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={sData.ca2 || ''} 
                          onChange={e => handleScoreChange(s.id, 'ca2', e.target.value)} 
                          disabled={!currentSubject}
                          className="w-full p-2 border-[1.5px] border-border rounded-[8px] text-center outline-none focus:border-green"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={sData.exam || ''} 
                          onChange={e => handleScoreChange(s.id, 'exam', e.target.value)} 
                          disabled={!currentSubject}
                          className="w-full p-2 border-[1.5px] border-border rounded-[8px] text-center outline-none focus:border-green"
                        />
                      </div>
                      <div className="text-center font-black text-green">{total}</div>
                      <div className="text-center font-black">{getGrade(total)}</div>
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

export default function ScoresPage() {
  return (
    <Suspense fallback={<div>Loading scores...</div>}>
      <ScoresContent />
    </Suspense>
  );
}
