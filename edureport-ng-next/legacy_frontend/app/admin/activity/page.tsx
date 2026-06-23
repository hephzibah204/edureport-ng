"use client";

import React, { useState, useEffect } from 'react';

export default function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json() as any;
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Activity Log
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Platform events and actions</small>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadLogs}>🔄 Refresh</button>
      </div>
      <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-x-auto">
        <table className="w-full text-left border-collapse text-[0.85rem]">
          <thead className="bg-panel border-b border-border">
            <tr>
              <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Date</th>
              <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">User</th>
              <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Action</th>
              <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted">Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted">No activity found.</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="border-b border-border hover:bg-panel/50 transition-colors">
                <td className="p-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-3 font-bold">{l.userEmail || 'System'}</td>
                <td className="p-3"><span className="inline-flex px-2 py-0.5 rounded-full bg-panel border border-border text-ink font-bold text-[0.7rem] uppercase tracking-tight">{l.action}</span></td>
                <td className="p-3 text-muted max-w-[400px] truncate" title={l.data}>{l.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
