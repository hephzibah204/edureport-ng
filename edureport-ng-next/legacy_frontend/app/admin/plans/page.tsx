"use client";

import React, { useState, useEffect } from 'react';

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedVal, setSelectedVal] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json() as any;
      setPlans(data.settings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const selectPlan = (p: any) => {
    setSelectedKey(p.k);
    setSelectedVal(p.v);
  };

  const savePlan = async () => {
    if (!selectedKey) return;
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: selectedKey, v: selectedVal })
      });
      if (res.ok) {
        alert('Plan updated successfully');
        loadPlans();
      } else {
        alert('Failed to update plan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Plans
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Versioned subscription plans</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={loadPlans}>🔄 Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedKey('plan_' + Date.now()); setSelectedVal('{}'); }}>+ New Plan</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-[1.4rem]">
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">All Plans</div>
          <div className="flex flex-col gap-2">
            {loading ? 'Loading...' : plans.length === 0 ? 'No plans found' : plans.map(p => (
              <div 
                key={p.k} 
                onClick={() => selectPlan(p)}
                className={`p-3 border border-border rounded-lg cursor-pointer transition-colors ${selectedKey === p.k ? 'bg-green4 border-green' : 'hover:bg-panel'}`}
              >
                <div className="font-bold text-[0.9rem]">{p.k.replace('plan_', '').toUpperCase()}</div>
                <div className="text-[0.75rem] text-muted">Updated: {new Date(p.updatedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">Plan Editor</div>
          <div className="text-[0.82rem] text-muted mb-4">Select a plan to edit its current config. Saving updates the global setting.</div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Plan Key</label>
            <input 
              value={selectedKey} 
              onChange={e => setSelectedKey(e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
          <div className="mb-4">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Config (JSON)</label>
            <textarea 
              rows={14} 
              value={selectedVal}
              onChange={e => setSelectedVal(e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg font-mono text-[0.78rem] leading-[1.5] outline-none focus:border-green"
            ></textarea>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary btn-sm" onClick={savePlan} disabled={!selectedKey}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
