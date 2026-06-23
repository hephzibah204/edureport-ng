"use client";

import React, { useState, useEffect } from 'react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: '0', status: 'ACTIVE' });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json() as any;
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ code: '', type: 'PERCENT', value: '0', status: 'ACTIVE' });
        loadCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-6 gap-4">
        <div className="text-2xl font-black text-foreground leading-tight">
          Coupons
          <small className="block text-xs font-normal text-muted-foreground mt-1">Discount codes and redemption limits</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="px-4 py-2 text-sm rounded-lg hover:bg-surface-container-low transition-colors" onClick={loadCoupons}>🔄 Refresh</button>
          <button className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-opacity" onClick={() => setShowAdd(true)}>+ New Coupon</button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-surface-container-low border-b border-border">
              <tr>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Value</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading coupons...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons found.</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-3 font-bold text-primary">{c.code}</td>
                  <td className="p-3 text-foreground">{c.type}</td>
                  <td className="p-3 text-foreground">{c.type === 'PERCENT' ? `${c.value}%` : `₦${Number(c.value).toLocaleString()}`}</td>
                  <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-full font-extrabold text-xs ${c.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-muted-foreground'}`}>{c.status}</span></td>
                  <td className="p-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
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
              <div className="font-bold text-foreground">New Coupon<small className="block text-xs text-muted-foreground font-normal">Create a discount code</small></div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-foreground">Coupon Code *</label>
                <input className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. SAVE50" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Type</label>
                  <select className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Value</label>
                  <input className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" type="number" required value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" className="px-4 py-2 text-sm rounded-lg hover:bg-surface-container-low transition-colors" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
