"use client";

import React, { useState, useEffect } from 'react';

export default function AdminReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json() as any;
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Reports & Alerts
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Revenue, exports, and platform health</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.4rem] mb-[1.4rem]">
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">Platform Statistics</div>
          <div className="grid grid-cols-2 gap-[10px] mt-2.5">
            <div className="bg-panel rounded-lg p-3 border border-border">
              <div className="text-[0.75rem] font-semibold text-muted uppercase tracking-wider mb-1">Total Schools</div>
              <div className="font-display text-[1.4rem] font-black text-ink">{loading ? '...' : stats?.schoolsTotal || 0}</div>
            </div>
            <div className="bg-panel rounded-lg p-3 border border-border">
              <div className="text-[0.75rem] font-semibold text-muted uppercase tracking-wider mb-1">Active (Paid)</div>
              <div className="font-display text-[1.4rem] font-black text-ink">{loading ? '...' : stats?.schoolsActive || 0}</div>
            </div>
            <div className="bg-panel rounded-lg p-3 border border-border">
              <div className="text-[0.75rem] font-semibold text-muted uppercase tracking-wider mb-1">Total Students</div>
              <div className="font-display text-[1.4rem] font-black text-ink">{loading ? '...' : stats?.studentsTotal || 0}</div>
            </div>
            <div className="bg-panel rounded-lg p-3 border border-border">
              <div className="text-[0.75rem] font-semibold text-muted uppercase tracking-wider mb-1">Revenue (Total)</div>
              <div className="font-display text-[1.4rem] font-black text-ink text-green">₦{loading ? '...' : (stats?.revenue || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">System Health</div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-panel rounded-lg border border-border">
              <span className="text-[0.85rem] font-semibold">Database Connection</span>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-green4 text-green font-extrabold text-[0.7rem]">ONLINE</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-panel rounded-lg border border-border">
              <span className="text-[0.85rem] font-semibold">AI Services</span>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-green4 text-green font-extrabold text-[0.7rem]">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-panel rounded-lg border border-border">
              <span className="text-[0.85rem] font-semibold">Background Jobs</span>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-gold/10 text-gold font-extrabold text-[0.7rem]">IDLE</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.4rem]">
        <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1rem] mb-[1.2rem]">Jobs Runner</div>
          <div className="text-[0.82rem] text-muted mb-4">Manual trigger for platform-wide maintenance tasks.</div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => alert('Cleanup job triggered')}>Run Session Cleanup</button>
            <button className="btn btn-outline btn-sm" onClick={() => alert('Backup job started')}>Run Database Backup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
