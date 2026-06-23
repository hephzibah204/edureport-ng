"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';

export default function SchoolSetup() {
  const { school, refreshSchool } = useSchool();
  const [form, setSchoolForm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [newSubj, setNewSubj] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialLoad = useRef(true);

  useEffect(() => {
    if (school && initialLoad.current) {
      setSchoolForm({ ...school });
      initialLoad.current = false;
    }
  }, [school]);

  const updateForm = (updates: any) => {
    setSchoolForm((prev: any) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const saveSetup = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
        refreshSchool();
        setIsDirty(false);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const addSubject = () => {
    const val = newSubj.trim();
    if (!val || form.subjects?.includes(val)) return;
    updateForm({ subjects: [...(form.subjects || []), val] });
    setNewSubj('');
  };

  const removeSubject = (index: number) => {
    const subs = [...(form.subjects || [])];
    subs.splice(index, 1);
    updateForm({ subjects: subs });
  };

  const [newClass, setNewClass] = useState('');

  const addClassTemplate = () => {
    const val = newClass.trim();
    if (!val || form.classTemplates?.includes(val)) return;
    updateForm({ classTemplates: [...(form.classTemplates || []), val] });
    setNewClass('');
  };

  const removeClassTemplate = (index: number) => {
    const tpls = [...(form.classTemplates || [])];
    tpls.splice(index, 1);
    updateForm({ classTemplates: tpls });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.8);
          updateForm({ logoUrl: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  const tabs = [
    { id: 'info', label: 'School Info', icon: '🏫' },
    { id: 'academic', label: 'Academic', icon: '📅' },
    { id: 'classes', label: 'Classes', icon: '📝' },
    { id: 'structure', label: 'Score Structure', icon: '📊' },
    { id: 'grades', label: 'Grading', icon: '🎓' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
  ];

  if (!form) return <div className="p-16 text-center"><LoadingSpinner /></div>;

  const totalMarks = (form.ca1Max || 0) + (form.ca2Max || 0) + (form.examMax || 0);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">School Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your branding, academic sessions, and grading systems.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tab Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-sm font-black uppercase tracking-widest ${activeTab === tab.id ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]' : 'bg-background text-muted-foreground border-border hover:bg-surface-container-low'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="min-h-[500px]"
            >
              <Card>
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl text-foreground border-b border-border pb-4">School Information</h2>
                    
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="field">
                          <label>School Name *</label>
                          <input type="text" value={form.name || ''} onChange={e => updateForm({ name: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="field">
                            <label>Abbreviation</label>
                            <input type="text" value={form.abbr || ''} onChange={e => updateForm({ abbr: e.target.value.toUpperCase() })} maxLength={4} className="uppercase w-full bg-background border border-border rounded-xl px-4 py-2" />
                          </div>
                          <div className="field">
                            <label>Principal's Name</label>
                            <input type="text" value={form.principal || ''} onChange={e => updateForm({ principal: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                          </div>
                        </div>
                        <div className="field">
                          <label>School Motto</label>
                          <input type="text" value={form.motto || ''} onChange={e => updateForm({ motto: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                        </div>
                      </div>
                      
                      <div className="w-full md:w-64 space-y-4">
                        <div className="field">
                          <label>Logo Upload</label>
                          <div className="w-full aspect-square rounded-3xl bg-surface-container-low border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-primary transition-colors group">
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            {form.logoUrl ? (
                              <div className="w-full h-full relative">
                                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-4 group-hover:opacity-50 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <span className="bg-[var(--ink)] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider">Change Logo</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-3xl opacity-20 group-hover:opacity-60 transition-opacity group-hover:scale-110 duration-300">📷</span>
                                <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold text-center px-4 group-hover:text-primary transition-colors">Click or drop to upload</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="field">
                          <label>Theme Color</label>
                          <div className="flex gap-2">
                            <input type="color" value={form.reportColor || '#1a6b3c'} onChange={e => updateForm({ reportColor: e.target.value })} className="w-10 h-10 p-0 border-none rounded-lg cursor-pointer" />
                            <input type="text" value={form.reportColor || '#1a6b3c'} onChange={e => updateForm({ reportColor: e.target.value })} className="flex-1 text-xs font-mono uppercase bg-background border border-border rounded-xl px-4 py-2" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label>Address</label>
                      <textarea value={form.address || ''} onChange={e => updateForm({ address: e.target.value })} className="h-20 w-full bg-background border border-border rounded-xl px-4 py-2" />
                    </div>
                  </div>
                )}

                {activeTab === 'academic' && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl text-foreground border-b border-border pb-4">Academic Period</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="field">
                        <label>Current Session</label>
                        <select value={form.session || ''} onChange={e => updateForm({ session: e.target.value })} className="bg-background w-full border border-border rounded-xl px-4 py-2">
                          <option>2023/2024</option>
                          <option>2024/2025</option>
                          <option>2025/2026</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Current Term</label>
                        <select value={form.term || ''} onChange={e => updateForm({ term: e.target.value })} className="bg-background w-full border border-border rounded-xl px-4 py-2">
                          <option>First</option>
                          <option>Second</option>
                          <option>Third</option>
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label>Next Term Resumption</label>
                      <input type="text" value={form.nextTerm || ''} onChange={e => updateForm({ nextTerm: e.target.value })} placeholder="e.g. 15th Sept, 2024" className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                    </div>
                  </div>
                )}

                {activeTab === 'structure' && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl text-foreground border-b border-border pb-4">Score Weights</h2>
                    <div className="p-6 bg-surface-container-low rounded-[24px] border border-border flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Score Capacity</div>
                        <div className={`text-4xl font-black ${totalMarks === 100 ? 'text-primary' : 'text-orange-500'}`}>{totalMarks} <span className="text-sm font-bold opacity-50">Marks</span></div>
                      </div>
                      <div className="text-right">
                        {totalMarks !== 100 && <Badge variant="orange">Recommended: 100</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="field text-center">
                        <label>1st CA</label>
                        <input type="number" value={form.ca1Max || 0} onChange={e => updateForm({ ca1Max: +e.target.value })} className="text-center text-xl h-14 w-full bg-background border border-border rounded-xl" />
                      </div>
                      <div className="field text-center">
                        <label>2nd CA</label>
                        <input type="number" value={form.ca2Max || 0} onChange={e => updateForm({ ca2Max: +e.target.value })} className="text-center text-xl h-14 w-full bg-background border border-border rounded-xl" />
                      </div>
                      <div className="field text-center">
                        <label>Exam</label>
                        <input type="number" value={form.examMax || 0} onChange={e => updateForm({ examMax: +e.target.value })} className="text-center text-xl h-14 w-full bg-background border border-border rounded-xl" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'grades' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h2 className="font-display font-black text-xl text-foreground">Grading Scale</h2>
                      <Button 
                        onClick={() => updateForm({ grades: [...(form.grades || []), { grade: '?', min: 0, max: 0, remark: '' }] })}
                        variant="ghost" size="xs"
                      >+ Add Grade</Button>
                    </div>
                    <div className="space-y-3">
                      {form.grades?.map((g: any, i: number) => (
                        <div key={i} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-surface-container-low border border-border rounded-2xl group transition-all hover:border-primary/20">
                          <input 
                            value={g.grade} 
                            onChange={e => {
                              const ng = [...form.grades]; ng[i].grade = e.target.value; updateForm({ grades: ng });
                            }}
                            className="w-14 h-14 text-center text-xl font-black text-primary bg-white dark:bg-background border border-border rounded-xl"
                          />
                          <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                            <div className="field !mb-0">
                              <label className="!text-[9px]">Min %</label>
                              <input type="number" value={g.min} onChange={e => { const ng = [...form.grades]; ng[i].min = +e.target.value; updateForm({ grades: ng }); }} className="!py-1.5 h-10 text-center w-full bg-background border border-border rounded-lg" />
                            </div>
                            <div className="field !mb-0">
                              <label className="!text-[9px]">Max %</label>
                              <input type="number" value={g.max} onChange={e => { const ng = [...form.grades]; ng[i].max = +e.target.value; updateForm({ grades: ng }); }} className="!py-1.5 h-10 text-center w-full bg-background border border-border rounded-lg" />
                            </div>
                            <div className="field !mb-0">
                              <label className="!text-[9px]">Remark</label>
                              <input type="text" value={g.remark} onChange={e => { const ng = [...form.grades]; ng[i].remark = e.target.value; updateForm({ grades: ng }); }} className="!py-1.5 h-10 w-full bg-background border border-border rounded-lg px-2" />
                            </div>
                          </div>
                          <button 
                            onClick={() => { const ng = [...form.grades]; ng.splice(i, 1); updateForm({ grades: ng }); }}
                            className="w-8 h-8 flex items-center justify-center text-[var(--red)] opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-[var(--red)]/10"
                          >🗑️</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'subjects' && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl text-foreground border-b border-border pb-4">Curriculum Subjects</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {form.subjects?.map((s: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-container-low border border-border rounded-xl py-3 px-4 group hover:border-primary/20">
                          <span className="flex-1 text-sm font-black text-foreground/70 truncate">{s}</span>
                          <button onClick={() => removeSubject(i)} className="text-[var(--red)] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <input 
                        type="text" 
                        value={newSubj} 
                        onChange={e => setNewSubj(e.target.value)} 
                        placeholder="Enter subject name..." 
                        className="flex-1 bg-background border border-border rounded-xl px-4"
                        onKeyDown={e => e.key === 'Enter' && addSubject()} 
                      />
                      <Button variant="primary" size="sm" onClick={addSubject}>Add Subject</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'classes' && (
                  <div className="space-y-6">
                    <h2 className="font-display font-black text-xl text-foreground border-b border-border pb-4">School Classes</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {form.classTemplates?.map((c: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-container-low border border-border rounded-xl py-3 px-4 group hover:border-primary/20">
                          <span className="flex-1 text-sm font-black text-foreground/70 truncate">{c}</span>
                          <button onClick={() => removeClassTemplate(i)} className="text-[var(--red)] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <input 
                        type="text" 
                        value={newClass} 
                        onChange={e => setNewClass(e.target.value)} 
                        placeholder="e.g. JSS 1, SS 3" 
                        className="flex-1 bg-background border border-border rounded-xl px-4"
                        onKeyDown={e => e.key === 'Enter' && addClassTemplate()} 
                      />
                      <Button variant="primary" size="sm" onClick={addClassTemplate}>Add Class</Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
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
            <div className="glass !bg-[var(--ink)]/90 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl border border-white/10">
              <div className="flex items-center gap-3 ml-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-widest">Modified Settings</span>
              </div>
              <div className="flex gap-3 items-center">
                <button 
                  onClick={() => { setSchoolForm({ ...school }); setIsDirty(false); }}
                  className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={saveSetup}
                  isLoading={saving}
                  leftIcon={!saving && '💾'}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

