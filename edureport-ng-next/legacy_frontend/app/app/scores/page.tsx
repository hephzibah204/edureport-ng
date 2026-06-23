"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

function ScoresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentIdParam = searchParams.get('studentId') || '';
  
  const { students, school, scores, refreshScores } = useSchool();
  const [currentId, setCurrentId] = useState(studentIdParam);
  const [localScores, setLocalScores] = useState<Record<string, any>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'individual' | 'class'>('individual');
  const [search, setSearch] = useState('');
  
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (studentIdParam) setCurrentId(studentIdParam);
  }, [studentIdParam]);

  useEffect(() => {
    if (currentId && scores[currentId]) {
      setLocalScores({ ...scores[currentId] });
      setIsDirty(false);
    } else {
      setLocalScores({});
      setIsDirty(false);
    }
  }, [currentId, scores]);

  const handleScoreChange = (sub: string, type: 'ca1' | 'ca2' | 'exam', val: string) => {
    const num = Math.min(parseInt(val) || 0, type === 'ca1' ? (school?.ca1Max || 10) : type === 'ca2' ? (school?.ca2Max || 10) : (school?.examMax || 80));
    
    setLocalScores(prev => ({
      ...prev,
      [sub]: { ...(prev[sub] || { ca1: 0, ca2: 0, exam: 0 }), [type]: num }
    }));
    setIsDirty(true);
    
    // Auto-save logic
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      autoSave(num, sub, type);
    }, 3000);
  };

  const autoSave = async (val: number, sub: string, type: string) => {
    // Hidden auto-save indicator in UI could be added later
  };

  const saveScores = async () => {
    if (!currentId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/scores/${encodeURIComponent(currentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localScores),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Scores saved successfully');
        refreshScores();
        setIsDirty(false);
      } else {
        toast.error('Failed to save scores');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const stu = students.find(s => s.id === currentId);
  const totalMax = (school?.ca1Max || 10) + (school?.ca2Max || 10) + (school?.examMax || 80);

  const getGrade = (pct: number) => {
    if (!school?.grades) return { grade: '—', color: '#aaa', remark: '—' };
    const g = school.grades.find((g: any) => pct >= g.min && pct <= g.max);
    return g || { grade: 'F', color: 'var(--red)', remark: 'Fail' };
  };

  const navigateStudent = (dir: 'prev' | 'next') => {
    const idx = students.findIndex(s => s.id === currentId);
    if (idx === -1) return;
    const nextIdx = dir === 'next' ? (idx + 1) % students.length : (idx - 1 + students.length) % students.length;
    const nextId = students[nextIdx].id;
    setCurrentId(nextId);
    router.push(`/app/scores?studentId=${encodeURIComponent(nextId)}`);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.admNo && s.admNo.toLowerCase().includes(search.toLowerCase())) ||
    s.cls.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Score Entry</h1>
          <p className="text-muted text-sm mt-1">Record continuous assessment and examination results.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-panel p-1 rounded-xl border border-border">
          <button 
            onClick={() => setViewMode('individual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'individual' ? 'bg-white dark:bg-card-bg shadow-sm text-green' : 'text-muted hover:text-ink'}`}
          >
            Individual
          </button>
          <button 
            onClick={() => setViewMode('class')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'class' ? 'bg-white dark:bg-card-bg shadow-sm text-green' : 'text-muted hover:text-ink'}`}
          >
            Class-wide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-panel">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder="Find student..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-card-bg border border-border rounded-lg outline-none focus:border-green text-sm"
                />
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentId(s.id);
                      router.push(`/app/scores?studentId=${encodeURIComponent(s.id)}`);
                    }}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-all ${currentId === s.id ? 'bg-green/5 border-l-4 border-l-green' : 'hover:bg-panel'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${currentId === s.id ? 'bg-green text-white border-green' : 'bg-panel text-muted border-border'}`}>
                      {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${currentId === s.id ? 'text-green' : 'text-ink'}`}>{s.name}</div>
                      <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{s.cls} • {s.admNo || 'NO ADM'}</div>
                    </div>
                    {scores[s.id] && <span className="text-green text-xs">✓</span>}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-muted text-xs font-bold uppercase tracking-widest">No matches</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Score Grid */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {currentId && stu ? (
              <motion.div 
                key={currentId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Individual Header */}
                <div className="card !bg-green3 border-none text-white relative overflow-hidden shadow-lg">
                  <div className="absolute right-0 top-0 p-4 flex gap-2">
                    <button onClick={() => navigateStudent('prev')} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">⬅️</button>
                    <button onClick={() => navigateStudent('next')} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">➡️</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black border border-white/20">
                      {stu.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gold2 leading-tight">{stu.name}</h2>
                      <p className="text-xs opacity-70 font-bold uppercase tracking-widest">
                        {stu.admNo || 'UNASSIGNED'} • {stu.cls} • {school?.term} TERM {school?.session}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-6 text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>CA1: Max {school?.ca1Max}</span>
                    <span>CA2: Max {school?.ca2Max}</span>
                    <span>Exam: Max {school?.examMax}</span>
                  </div>
                </div>

                {/* Score Table */}
                <div className="tbl-wrap overflow-hidden">
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th className="!py-4">Subject</th>
                          <th className="text-center">CA1</th>
                          <th className="text-center">CA2</th>
                          <th className="text-center">Exam</th>
                          <th className="text-center">Total</th>
                          <th className="text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {school?.subjects?.map((sub: string) => {
                          const sc = localScores[sub] || { ca1: 0, ca2: 0, exam: 0 };
                          const tot = (+sc.ca1 || 0) + (+sc.ca2 || 0) + (+sc.exam || 0);
                          const pct = totalMax > 0 ? (tot / totalMax) * 100 : 0;
                          const g = getGrade(pct);
                          return (
                            <tr key={sub} className="hover:bg-panel/30 transition-colors">
                              <td className="!py-4">
                                <div className="font-bold text-ink">{sub}</div>
                                <div className="w-24 h-1 bg-panel rounded-full mt-1.5 overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    className="h-full bg-green"
                                  />
                                </div>
                              </td>
                              <td className="text-center">
                                <input 
                                  type="number" 
                                  value={sc.ca1 || ''} 
                                  onChange={e => handleScoreChange(sub, 'ca1', e.target.value)}
                                  className="w-14 h-9 text-center bg-panel border border-border rounded-lg outline-none focus:border-green focus:bg-white transition-all text-sm font-bold"
                                />
                              </td>
                              <td className="text-center">
                                <input 
                                  type="number" 
                                  value={sc.ca2 || ''} 
                                  onChange={e => handleScoreChange(sub, 'ca2', e.target.value)}
                                  className="w-14 h-9 text-center bg-panel border border-border rounded-lg outline-none focus:border-green focus:bg-white transition-all text-sm font-bold"
                                />
                              </td>
                              <td className="text-center">
                                <input 
                                  type="number" 
                                  value={sc.exam || ''} 
                                  onChange={e => handleScoreChange(sub, 'exam', e.target.value)}
                                  className="w-14 h-9 text-center bg-panel border border-border rounded-lg outline-none focus:border-green focus:bg-white transition-all text-sm font-bold"
                                />
                              </td>
                              <td className="text-center">
                                <span className={`inline-block px-3 py-1.5 rounded-lg font-black text-sm ${tot ? 'bg-green/10 text-green' : 'bg-panel text-muted'}`}>
                                  {tot || '--'}
                                </span>
                              </td>
                              <td className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-black text-lg" style={{ color: g.color }}>{g.grade}</span>
                                  <span className="text-[8px] font-black uppercase opacity-60 tracking-tighter">{g.remark}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-panel/30 border-2 border-dashed border-border rounded-[32px]">
                <div className="text-5xl opacity-20">📝</div>
                <div>
                  <h3 className="font-display font-black text-xl text-ink">Ready to record?</h3>
                  <p className="text-muted text-sm max-w-xs mx-auto">Select a student from the left panel to begin entering their scores.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-2xl"
          >
            <div className="glass !bg-ink/90 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl border border-white/10">
              <div className="flex items-center gap-3 ml-2">
                <span className="w-2 h-2 rounded-full bg-orange animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-widest">Unsaved Changes</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setLocalScores(scores[currentId] || {}); setIsDirty(false); }}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={saveScores}
                  disabled={saving}
                  className="px-6 py-2 bg-green text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  {saving ? <LoadingSpinner size="sm" color="white" /> : '💾 Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ScoresPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center"><LoadingSpinner /></div>}>
      <ScoresContent />
    </Suspense>
  );
}
