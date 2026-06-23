"use client";

import React, { useState, useEffect } from 'react';

export default function AdminMaintenance() {
  const [maint, setMaint] = useState({ enabled: false, message: '', allowedIps: [] as string[] });
  const [loading, setLoading] = useState(true);

  const loadMaintenance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/maintenance');
      const data = await res.json() as any;
      setMaint({
        enabled: !!data.enabled,
        message: data.message || '',
        allowedIps: Array.isArray(data.allowedIps) ? data.allowedIps : []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaintenance();
  }, []);

  const saveMaintenance = async () => {
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maint)
      });
      if (res.ok) alert('Maintenance mode updated');
      else alert('Failed to update maintenance mode');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading maintenance status...</div>;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Maintenance Mode
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">System-wide access control</small>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={loadMaintenance}>🔄 Reload</button>
          <button className="btn btn-primary btn-sm" onClick={saveMaintenance}>💾 Save</button>
        </div>
      </div>
      <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-w-[800px]">
        <div className="mb-4">
          <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Status</label>
          <select 
            value={maint.enabled ? 'true' : 'false'} 
            onChange={e => setMaint({ ...maint, enabled: e.target.value === 'true' })}
            className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-white"
          >
            <option value="false">Disabled (Site is Live)</option>
            <option value="true">Enabled (Maintenance active)</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Message</label>
          <input 
            value={maint.message}
            onChange={e => setMaint({ ...maint, message: e.target.value })}
            placeholder="Displayed to users during maintenance" 
            className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
          />
        </div>
        <div className="mb-4">
          <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Allowed IPs (one per line)</label>
          <textarea 
            rows={5} 
            value={maint.allowedIps.join('\n')}
            onChange={e => setMaint({ ...maint, allowedIps: e.target.value.split('\n').filter(Boolean) })}
            placeholder="127.0.0.1" 
            className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg font-mono text-[0.78rem] leading-[1.5] outline-none focus:border-green"
          ></textarea>
        </div>
        <div className="text-[0.8rem] text-muted p-3 bg-panel rounded-lg border border-border">
          <strong>Note:</strong> When enabled, only users visiting from the "Allowed IPs" can access the platform. All others will see the maintenance message.
        </div>
      </div>
    </div>
  );
}
