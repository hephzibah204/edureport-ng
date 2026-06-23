"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner, SkeletonRow } from '../components/LoadingSpinner';

export default function ParentsPage() {
  const { students } = useSchool();
  const [parents, setParents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showLink, setShowLink] = useState<string | null>(null); // parent userId
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null); // linkId
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', studentId: '' });
  const [linkForm, setLinkForm] = useState({ studentId: '' });

  const loadParents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parents', { credentials: 'include' });
      const data = await res.json() as any;
      setParents(Array.isArray(data.parents) ? data.parents : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Required fields missing');
    setSaving(true);
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        await loadParents();
        setShowAdd(false);
        setForm({ name: '', email: '', password: '', phone: '', studentId: '' });
        toast.success('Parent account created');
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

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.studentId || !showLink) return toast.error('Select a student');
    setSaving(true);
    try {
      const res = await fetch('/api/student-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: showLink, studentId: linkForm.studentId, linkType: 'PARENT' })
      });
      if (res.ok) {
        await loadParents();
        setShowLink(null);
        setLinkForm({ studentId: '' });
        toast.success('Student linked successfully');
      } else {
        toast.error('Failed to link student');
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
      const res = await fetch(`/api/parents/${encodeURIComponent(isDeleting)}`, { method: 'DELETE' });
      if (res.ok) {
        loadParents();
        toast.success('Parent access revoked');
      }
    } catch (err) {
      toast.error('Deletion failed');
    } finally {
      setIsDeleting(null);
    }
  };

  const confirmUnlink = async () => {
    if (!isUnlinking) return;
    try {
      const res = await fetch(`/api/student-links/${encodeURIComponent(isUnlinking)}`, { method: 'DELETE' });
      if (res.ok) {
        loadParents();
        toast.success('Student unlinked');
      }
    } catch (err) {
      toast.error('Unlink failed');
    } finally {
      setIsUnlinking(null);
    }
  };

  const filtered = parents.filter(p => 
    p.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Parent Access</h1>
          <p className="text-muted text-sm mt-1">Manage parent accounts and link them to student results.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Parent</button>
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
          <button className="btn btn-ghost btn-xs" onClick={loadParents}>↻ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Linked Students</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length > 0 ? (
                filtered.map((p, i) => (
                  <tr key={p.id} className="group hover:bg-panel/50 transition-colors">
                    <td className="text-muted font-mono text-[10px]">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px] font-black border border-gold/20">
                          {p.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-ink">{p.displayName}</div>
                      </div>
                    </td>
                    <td className="text-xs text-muted font-medium">{p.email}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(p.linkedStudents) && p.linkedStudents.length > 0 ? (
                          p.linkedStudents.map((s: any) => (
                            <span key={s.linkId} className="badge badge-blue !text-[9px] flex items-center gap-1">
                              {s.name} ({s.cls})
                              <button onClick={() => setIsUnlinking(s.linkId)} className="hover:text-red transition-colors font-bold ml-1">×</button>
                            </span>
                          ))
                        ) : <span className="text-[10px] text-muted italic">No students linked</span>}
                        <button onClick={() => setShowLink(p.id)} className="badge !bg-panel !text-muted hover:!bg-border transition-colors !text-[9px]">+ Link</button>
                      </div>
                    </td>
                    <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : 'badge-gold'}`}>{p.status || 'ACTIVE'}</span></td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-ghost btn-xs text-red hover:bg-red/10" title="Revoke Access" onClick={() => setIsDeleting(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row"><td colSpan={6}>No parent accounts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Parent Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[1000] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card-bg rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-border bg-panel flex justify-between items-center">
                <div><h3 className="font-display font-black text-lg text-ink">New Parent Account</h3><p className="text-xs text-muted">Create access for guardians</p></div>
                <button className="w-8 h-8 rounded-full hover:bg-border flex items-center justify-center transition-colors" onClick={() => setShowAdd(false)}>✕</button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div className="field"><label>Parent/Guardian Name *</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Mr. John Doe" /></div>
                <div className="field"><label>Email Address *</label><input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="e.g. parent@example.com" /></div>
                <div className="field"><label>Initial Password *</label><input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Temporary password" /></div>
                <div className="field"><label>Initial Student Link (Optional)</label><select value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} className="bg-card-bg"><option value="">— Select Student —</option>{students.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.cls})</option>))}</select></div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoadingSpinner size="sm" color="white" /> : 'Create Account'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Link Student Modal */}
      <AnimatePresence>
        {showLink && (
          <div className="fixed inset-0 z-[1000] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card-bg rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-border bg-panel flex justify-between items-center">
                <h3 className="font-display font-black text-lg text-ink">Link Student</h3>
                <button className="w-8 h-8 rounded-full hover:bg-border flex items-center justify-center transition-colors" onClick={() => setShowLink(null)}>✕</button>
              </div>
              <form onSubmit={handleLink} className="p-6 space-y-4">
                <div className="field">
                  <label>Select Student</label>
                  <select required value={linkForm.studentId} onChange={e => setLinkForm({ studentId: e.target.value })} className="bg-card-bg">
                    <option value="">— Choose —</option>
                    {students.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.cls})</option>))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowLink(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoadingSpinner size="sm" color="white" /> : 'Link Student'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!isDeleting}
        title="Revoke Parent Access?"
        message="This will permanently delete the parent's account. They will lose access to all linked student results immediately."
        confirmLabel="Yes, Revoke"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleting(null)}
      />

      <ConfirmModal 
        isOpen={!!isUnlinking}
        title="Unlink Student?"
        message="The parent will no longer have access to this student's result portal."
        confirmLabel="Yes, Unlink"
        variant="danger"
        onConfirm={confirmUnlink}
        onCancel={() => setIsUnlinking(null)}
      />
    </div>
  );
}
