"use client";

import React, { useState, useEffect } from 'react';

export default function AdminSchools() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', plan: 'TRIAL', subdomain: '' });

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      const data = await res.json() as any;
      if (data?.schools) setSchools(data.schools);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/schools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName: form.name, email: form.email, plan: form.plan, subdomain: form.subdomain })
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: '', email: '', plan: 'TRIAL', subdomain: '' });
        loadSchools();
      } else {
        alert('Failed to add school');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.ownerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = !filterPlan || s.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-6 gap-4">
        <div className="text-2xl font-black text-foreground leading-tight">
          All Schools
          <small className="block text-xs font-normal text-muted-foreground mt-1">Manage registered school accounts</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-opacity" onClick={() => setShowAdd(true)}>+ Add School</button>
          <button className="px-4 py-2 text-sm rounded-lg hover:bg-surface-container-low transition-colors" onClick={loadSchools}>🔄 Refresh</button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface-container-low flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search name or email…" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-background text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select 
              className="py-2 px-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-background text-sm"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="STARTER">Starter</option>
              <option value="LIFETIME">Lifetime</option>
              <option value="PRO">Pro</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-surface-container-low border-b border-border">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">#</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">School Name</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Owner Email</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Plan</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Joined</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading schools...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No schools found.</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className="border-b border-border hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-3 text-foreground">{i + 1}</td>
                  <td className="p-3 font-bold text-foreground">{s.name}</td>
                  <td className="p-3 text-foreground">{s.ownerEmail}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-extrabold ${s.plan === 'PRO' ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-muted-foreground'}`}>
                      {s.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button className="px-3 py-1 text-xs border border-border rounded hover:bg-surface-container-low transition-colors text-foreground">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowAdd(false)}>
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div className="font-bold text-foreground">Add New School<small className="block text-xs text-muted-foreground font-normal">Setup a manually managed account</small></div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-foreground">School Name *</label>
                <input className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Hephzibah College" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-foreground">Owner Email *</label>
                <input className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value.toLowerCase()})} placeholder="e.g. admin@school.com" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Plan</label>
                  <select className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
                    <option value="TRIAL">Trial</option>
                    <option value="STARTER">Starter</option>
                    <option value="LIFETIME">Lifetime</option>
                    <option value="PRO">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Subdomain</label>
                  <input className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" type="text" value={form.subdomain} onChange={e => setForm({...form, subdomain: e.target.value.toLowerCase()})} placeholder="e.g. hephzibah" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" className="px-4 py-2 text-sm rounded-lg hover:bg-surface-container-low transition-colors" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
