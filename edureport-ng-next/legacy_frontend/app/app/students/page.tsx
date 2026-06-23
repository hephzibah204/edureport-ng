"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner, SkeletonRow } from '../components/LoadingSpinner';

function StudentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classFilter = searchParams.get('className') || '';
  
  const { students, scores, school, refreshStudents, loading, planLimits } = useSchool();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', admNo: '', cls: classFilter, gender: 'Male', dob: '', address: '', guardianName: '', guardianPhone: '' });

  useEffect(() => {
    if (classFilter) setForm(prev => ({ ...prev, cls: classFilter }));
  }, [classFilter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addStep < 2) return setAddStep(2);
    
    if (!form.name || !form.cls) return toast.error('Name and Class are required');
    if (planLimits.isOverLimit) return toast.error('Student limit reached. Upgrade your plan to add more.');
    
    setSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        await refreshStudents();
        toast.success('Student added successfully');
        setShowAdd(false);
        setAddStep(1);
        setForm({ name: '', admNo: '', cls: classFilter, gender: 'Male', dob: '', address: '', guardianName: '', guardianPhone: '' });
      } else {
        const out = await res.json() as any;
        toast.error(out.error?.message || 'Failed to add student');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!isDeleting) return;
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(isDeleting)}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshStudents();
        toast.success('Student removed from roster');
      }
    } catch (err) {
      toast.error('Failed to delete student');
    } finally {
      setIsDeleting(null);
    }
  };

  const filtered = students.filter(s => {
    const matchesClass = !classFilter || s.cls === classFilter;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.admNo && s.admNo.toLowerCase().includes(search.toLowerCase()));
    return matchesClass && matchesSearch;
  });

  const getAvg = (id: string) => {
    const sc = scores[id] || {};
    const subs = school?.subjects || [];
    if (!subs.length) return null;
    const max = (school?.ca1Max || 10) + (school?.ca2Max || 10) + (school?.examMax || 80);
    let totalPct = 0;
    subs.forEach((sub: string) => {
      const s = sc[sub] || { ca1: 0, ca2: 0, exam: 0 };
      const tot = (+s.ca1 || 0) + (+s.ca2 || 0) + (+s.exam || 0);
      totalPct += max > 0 ? (tot / max) * 100 : 0;
    });
    return totalPct / subs.length;
  };

  const classes = [...new Set(students.map(s => s.cls).filter(Boolean))].sort();

  const [showPortalAccess, setShowPortalAccess] = useState(false);
  const [portalForm, setPortalForm] = useState({ email: '', password: '' });
  const [creatingPortal, setCreatingPortal] = useState(false);

  const handleCreatePortalAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !portalForm.email || !portalForm.password) return;
    setCreatingPortal(true);
    try {
      const res = await fetch('/api/student-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.id, ...portalForm })
      });
      if (res.ok) {
        toast.success('Portal access created');
        setShowPortalAccess(false);
        setPortalForm({ email: '', password: '' });
      } else {
        const out = await res.json() as any;
        toast.error(out.error?.message || 'Failed to create access');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setCreatingPortal(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Students Roster</h1>
          <p className="text-muted text-sm mt-1">Manage enrollment and view academic summaries.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={classFilter} 
            onChange={e => router.push(`/app/students?className=${encodeURIComponent(e.target.value)}`)}
            className="field !mb-0 py-2 px-3 border border-border rounded-lg outline-none focus:border-green bg-white dark:bg-card-bg text-sm font-bold shadow-sm"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => setShowAdd(true)}
            disabled={planLimits.isOverLimit}
          >
            + Add Student
          </button>
        </div>
      </div>

      {planLimits.isOverLimit && (
        <div className="p-4 bg-red/10 border border-red/20 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div className="text-sm">
              <span className="font-black text-red">Limit Reached!</span> You've hit the 50 student limit for your trial.
            </div>
          </div>
          <Link href="/app/billing" className="btn btn-red btn-xs">Upgrade Plan</Link>
        </div>
      )}

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-lbl">Listed Students</div>
          <div className="metric-val">{filtered.length}</div>
          <div className="metric-sub">{classFilter || 'Across all classes'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-lbl">Scores Completed</div>
          <div className="metric-val">{filtered.filter(s => scores[s.id]).length}</div>
          <div className="metric-sub">of {filtered.length} students</div>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name or admission number..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-[300px] pl-9 pr-3 py-2 border border-border rounded-lg outline-none focus:border-green text-sm bg-white dark:bg-card-bg shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-xs" onClick={() => toast.info('Import feature coming soon')}>📂 Import CSV</button>
            <button className="btn btn-ghost btn-xs" onClick={() => toast.info('Export started...')}>⬇️ Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Adm. No.</th>
                <th>Class</th>
                <th>Result</th>
                <th>Average</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length > 0 ? (
                filtered.map((s, i) => {
                  const avg = getAvg(s.id);
                  return (
                    <tr key={s.id} className="group hover:bg-panel/50 transition-colors cursor-pointer" onClick={() => setSelectedStudent(s)}>
                      <td className="text-muted font-mono text-[10px]">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green/10 text-green flex items-center justify-center text-[10px] font-black border border-green/20">
                            {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-ink group-hover:text-green transition-colors">{s.name}</div>
                            <div className="text-[10px] text-muted font-bold uppercase tracking-wider">{s.gender || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{s.admNo || '---'}</td>
                      <td><span className="badge badge-blue">{s.cls}</span></td>
                      <td>
                        {scores[s.id] ? (
                          <span className="badge badge-green">✓ Ready</span>
                        ) : (
                          <span className="badge badge-gold">Pending</span>
                        )}
                      </td>
                      <td className="font-black text-ink">{avg !== null ? `${avg.toFixed(1)}%` : '—'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-xs" title="Edit Results" onClick={() => router.push(`/app/scores?studentId=${s.id}`)}>📝</button>
                          <button className="btn btn-ghost btn-xs text-red hover:bg-red/10" title="Delete Student" onClick={() => setIsDeleting(s.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="empty-row"><td colSpan={8}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[1000] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-bg rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-border bg-panel flex justify-between items-center">
                <div>
                  <h3 className="font-display font-black text-lg text-ink">Add New Student</h3>
                  <div className="flex gap-1 mt-1">
                    <div className={`h-1 flex-1 rounded-full ${addStep >= 1 ? 'bg-green' : 'bg-border'}`} />
                    <div className={`h-1 flex-1 rounded-full ${addStep >= 2 ? 'bg-green' : 'bg-border'}`} />
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-border flex items-center justify-center transition-colors" onClick={() => { setShowAdd(false); setAddStep(1); }}>✕</button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                {addStep === 1 ? (
                  <>
                    <div className="field">
                      <label>Full Name *</label>
                      <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" autoFocus />
                    </div>
                    <div className="field">
                      <label>Admission No</label>
                      <input type="text" value={form.admNo} onChange={e => setForm({...form, admNo: e.target.value})} placeholder="Leave blank for auto" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="field">
                        <label>Class *</label>
                        <input type="text" required value={form.cls} onChange={e => setForm({...form, cls: e.target.value})} placeholder="e.g. JSS 1" />
                      </div>
                      <div className="field">
                        <label>Gender</label>
                        <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="bg-card-bg">
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="field">
                      <label>Guardian Name</label>
                      <input type="text" value={form.guardianName} onChange={e => setForm({...form, guardianName: e.target.value})} placeholder="e.g. Mr. Smith" />
                    </div>
                    <div className="field">
                      <label>Guardian Phone</label>
                      <input type="tel" value={form.guardianPhone} onChange={e => setForm({...form, guardianPhone: e.target.value})} placeholder="e.g. 08012345678" />
                    </div>
                    <div className="field">
                      <label>Residential Address</label>
                      <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Home address..." className="h-20 bg-card-bg" />
                    </div>
                  </>
                )}
                
                <div className="pt-4 flex justify-between gap-3">
                  <button type="button" className="btn btn-ghost" onClick={() => addStep === 1 ? setShowAdd(false) : setAddStep(1)}>
                    {addStep === 1 ? 'Cancel' : 'Back'}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" color="white" /> : addStep === 1 ? 'Next' : 'Create Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Detail Drawer */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[1000] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-card-bg h-full shadow-2xl border-l border-border flex flex-col"
            >
              <div className="p-6 border-b border-border bg-panel flex items-center justify-between">
                <h3 className="font-display font-black text-xl text-ink">Student Profile</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-3xl bg-green/10 text-green flex items-center justify-center text-3xl font-black border border-green/20 mx-auto mb-4">
                    {selectedStudent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="font-display font-black text-2xl text-ink">{selectedStudent.name}</h4>
                  <div className="badge badge-blue mt-2">Class: {selectedStudent.cls}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card !p-4">
                    <div className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Adm Number</div>
                    <div className="text-sm font-bold text-ink">{selectedStudent.admNo || '---'}</div>
                  </div>
                  <div className="card !p-4">
                    <div className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Gender</div>
                    <div className="text-sm font-bold text-ink">{selectedStudent.gender || 'N/A'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-display font-black text-ink border-b border-border pb-2">Academic Summary</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted">Total Average</span>
                      <span className="font-black text-green text-lg">{getAvg(selectedStudent.id)?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted">Status</span>
                      {scores[selectedStudent.id] ? <span className="text-green font-bold">✓ Results Ready</span> : <span className="text-gold font-bold">⚠️ Pending Scores</span>}
                    </div>
                  </div>
                </div>

                {selectedStudent.guardianName && (
                  <div className="space-y-4">
                    <h5 className="font-display font-black text-ink border-b border-border pb-2 uppercase text-[10px] tracking-widest text-muted">Guardian Info</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted">Name:</span> <span className="font-bold text-ink2">{selectedStudent.guardianName}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Phone:</span> <span className="font-bold text-ink2">{selectedStudent.guardianPhone || 'N/A'}</span></div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  {!showPortalAccess ? (
                    <button 
                      className="btn btn-ghost btn-full btn-sm !text-blue hover:!bg-blue/5"
                      onClick={() => setShowPortalAccess(true)}
                    >
                      🔑 Provision Portal Access
                    </button>
                  ) : (
                    <form onSubmit={handleCreatePortalAccess} className="p-4 bg-panel rounded-2xl border border-blue/20 space-y-3">
                      <div className="text-[10px] font-black uppercase text-blue tracking-widest mb-1">Create Student User</div>
                      <div className="field !mb-0">
                        <input 
                          type="email" 
                          required 
                          placeholder="Student Email (Login)" 
                          value={portalForm.email}
                          onChange={e => setPortalForm({...portalForm, email: e.target.value})}
                          className="!py-2 !text-xs"
                        />
                      </div>
                      <div className="field !mb-0">
                        <input 
                          type="password" 
                          required 
                          placeholder="Temporary Password" 
                          value={portalForm.password}
                          onChange={e => setPortalForm({...portalForm, password: e.target.value})}
                          className="!py-2 !text-xs"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" className="btn btn-ghost btn-xs flex-1" onClick={() => setShowPortalAccess(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-xs flex-1" disabled={creatingPortal}>
                          {creatingPortal ? '...' : 'Create Access'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
              <div className="p-6 bg-panel border-t border-border grid grid-cols-2 gap-3">
                <button className="btn btn-outline btn-sm" onClick={() => router.push(`/app/scores?studentId=${selectedStudent.id}`)}>Edit Scores</button>
                <button className="btn btn-primary btn-sm" onClick={() => toast.info('Full profile editing coming soon')}>Edit Profile</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!isDeleting}
        title="Delete Student?"
        message="This will permanently remove the student and all their academic records. This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-muted bg-white dark:bg-card-bg rounded-2xl border border-border shadow-sm">Loading students...</div>}>
      <StudentsContent />
    </Suspense>
  );
}
