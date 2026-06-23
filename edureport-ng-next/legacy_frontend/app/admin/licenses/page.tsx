"use client";

import React, { useState, useEffect } from 'react';

export default function AdminLicenses() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/schools');
      const data = await res.json() as any;
      setSchools(data.schools || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const updatePlan = async (schoolId: string, plan: string) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, plan })
      });
      if (res.ok) {
        alert('Plan updated');
        loadSchools();
      }
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="pg-licenses">
      <div className="pg-hdr">
        <div className="pg-title">License Management<small>Review and override school plans</small></div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>School Name</th>
              <th>Owner</th>
              <th>Current Plan</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted">Loading…</td></tr>
            ) : schools.map((s: any) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.ownerEmail}</td>
                <td><span className="badge badge-green">{s.plan}</span></td>
                <td className="text-[0.78rem] text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <select 
                      defaultValue={s.plan}
                      id={`plan-${s.id}`}
                      className="py-1 px-2 border border-border rounded outline-none focus:border-green bg-white text-[0.8rem]"
                    >
                      <option value="TRIAL">Trial</option>
                      <option value="STARTER">Starter</option>
                      <option value="LIFETIME">Lifetime</option>
                      <option value="PRO">Pro</option>
                    </select>
                    <button 
                      className="btn btn-primary btn-xs"
                      onClick={() => {
                        const sel = document.getElementById(`plan-${s.id}`) as any;
                        updatePlan(s.id, sel.value);
                      }}
                    >Save</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
