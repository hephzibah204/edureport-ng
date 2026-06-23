"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner, SkeletonRow } from '../components/LoadingSpinner';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', classes: [] as string[] });

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teachers', { credentials: 'include' });
      const data = await res.json() as any;
      setTeachers(Array.isArray(data.teachers) ? data.teachers : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Required fields missing');
    setSaving(true);
    try {
      const payload = {
        ...form,
        classes: form.classes.filter(Boolean)
      };
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadTeachers();
        setShowAdd(false);
        setForm({ name: '', email: '', password: '', classes: [] });
        toast.success('Teacher account created');
      } else {
        const data: any = await res.json();
        toast.error(data.error?.message || 'Failed to create account');
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
      const res = await fetch(`/api/teachers/${encodeURIComponent(isDeleting)}`, { method: 'DELETE' });
      if (res.ok) {
        loadTeachers();
        toast.success('Teacher account revoked');
      }
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setIsDeleting(null);
    }
  };

  const filtered = teachers.filter(t => 
    t.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Teaching Staff</h1>
          <p className="text-muted text-sm mt-1">Manage staff accounts and assign classroom permissions.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Teacher</button>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-toolbar">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">🔍</span>
            <input 
              type="text" 
              placeholder="Find by name or email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-[300px] pl-9 pr-3 py-2 border border-border rounded-lg outline-none focus:border-green text-sm bg-white dark:bg-card-bg shadow-sm"
            />
          </div>
          <button className="btn btn-ghost btn-xs" onClick={loadTeachers}>↻ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Assigned Classes</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length > 0 ? (
                filtered.map((t, i) => (
                  <tr key={t.id} className="group hover:bg-panel/50 transition-colors cursor-pointer" onClick={() => setSelectedTeacher(t)}>
                    <td className="text-muted font-mono text-[10px]">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue/10 text-blue flex items-center justify-center text-[10px] font-black border border-blue/20">
                          {t.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-ink group-hover:text-green transition-colors">{t.displayName}</div>
                      </div>
                    </td>
                    <td className="text-xs text-muted font-medium">{t.email}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(t.classes) && t.classes.length > 0 ? (
                          t.classes.slice(0, 2).map((c: string) => <span key={c} className="badge badge-blue !text-[9px]">{c}</span>)
                        ) : <span className="text-[10px] text-muted italic">Unassigned</span>}
                        {Array.isArray(t.classes) && t.classes.length > 2 && <span className="text-[9px] font-black opacity-40">+{t.classes.length - 2} more</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${t.status === 'ACTIVE' ? 'badge-green' : 'badge-gold'}`}>{t.status || 'ACTIVE'}</span></td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-xs text-red hover:bg-red/10" title="Delete Account" onClick={() => setIsDeleting(t.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row"><td colSpan={6}>No teaching staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
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
                  <h3 className="font-display font-black text-lg text-ink">New Staff Member</h3>
                  <p className="text-xs text-muted">Access will be granted immediately</p>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-border flex items-center justify-center transition-colors" onClick={() => setShowAdd(false)}>✕</button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div className="field">
                  <label>Full Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Mrs. Smith" />
                </div>
                <div className="field">
                  <label>Email Address *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. smith@school.com" />
                </div>
                <div className="field">
                  <label>Initial Password *</label>
                  <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Temporary password" />
                </div>
                <div className="field">
                  <label>Assigned Classes</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {school?.classTemplates?.length > 0 ? (
                      school.classTemplates.map((c: string) => (
                        <label key={c} className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-border cursor-pointer hover:border-primary">
                          <input 
                            type="checkbox" 
                            checked={form.classes.includes(c)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({...form, classes: [...form.classes, c]});
                              } else {
                                setForm({...form, classes: form.classes.filter(cls => cls !== c)});
                              }
                            }}
                            className="accent-[var(--green)]"
                          />
                          <span className="text-sm font-bold text-foreground">{c}</span>
                        </label>
                      ))
                    ) : (
                      <span className="text-xs text-muted italic">No classes defined in School Setup</span>
                    )}
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" color="white" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher Detail Drawer */}
      <AnimatePresence>
        {selectedTeacher && (
          <div className="fixed inset-0 z-[1000] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTeacher(null)} className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-card-bg h-full shadow-2xl border-l border-border flex flex-col">
              <div className="p-6 border-b border-border bg-panel flex items-center justify-between">
                <h3 className="font-display font-black text-xl text-ink">Staff Profile</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTeacher(null)}>✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-3xl bg-blue/10 text-blue flex items-center justify-center text-3xl font-black border border-blue/20 mx-auto mb-4">
                    {selectedTeacher.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="font-display font-black text-2xl text-ink">{selectedTeacher.displayName}</h4>
                  <p className="text-muted font-bold text-sm">{selectedTeacher.email}</p>
                </div>

                <div className="space-y-4">
                  <h5 className="font-display font-black text-ink border-b border-border pb-2 uppercase text-[10px] tracking-widest text-muted">Responsibilities</h5>
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black uppercase text-muted mb-2">Assigned Classes</div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(selectedTeacher.classes) && selectedTeacher.classes.length > 0 ? (
                          selectedTeacher.classes.map((c: string) => <span key={c} className="badge badge-blue text-[10px] font-black">{c}</span>)
                        ) : <span className="text-sm text-muted italic">No classes assigned</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-panel rounded-2xl border border-border">
                  <h6 className="text-[10px] font-black text-ink uppercase tracking-widest mb-3">Security Actions</h6>
                  <button className="btn btn-outline btn-full btn-sm" onClick={() => toast.info('Password reset email sent (simulated)')}>Reset Password</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!isDeleting}
        title="Revoke Access?"
        message="This will permanently delete the teacher's account. They will lose access to all classes and subjects immediately."
        confirmLabel="Yes, Revoke"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
}

