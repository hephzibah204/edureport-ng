"use client";

import React, { useState, useEffect } from 'react';
import { usePortal } from '../PortalContext';

interface AttendanceDay {
  date: string;
  mark: string;
  note: string;
}

export default function AttendancePage() {
  const { studentId } = usePortal();
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const daysAgoISO = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());

  const loadAttendance = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/api/attendance/days?studentId=${encodeURIComponent(studentId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { credentials: 'include' });
      const data = await res.json() as any;
      setDays(Array.isArray(data.days) ? data.days : []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [studentId]);

  const pill = (mark: string) => {
    const m = String(mark || '').toUpperCase();
    if (m === 'PRESENT') return <span className="inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-extrabold bg-green4 text-green tracking-wider">PRESENT</span>;
    if (m === 'LATE') return <span className="inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-extrabold bg-gold/10 text-gold tracking-wider">LATE</span>;
    if (m === 'ABSENT') return <span className="inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-extrabold bg-red/10 text-red tracking-wider">ABSENT</span>;
    return <span className="text-muted">—</span>;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Attendance
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">View attendance history</small>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green text-[0.85rem] bg-white" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green text-[0.85rem] bg-white" />
          <button className="btn btn-ghost btn-sm bg-white border border-border hover:bg-panel transition-colors" onClick={loadAttendance}>Load</button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border bg-panel">
          <strong className="text-[0.88rem] font-bold">History</strong>
        </div>
        <div className="flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-[0.85rem] text-muted">Loading…</div>
          ) : days.length === 0 ? (
            <div className="p-8 text-center text-[0.85rem] text-muted">No attendance records in range.</div>
          ) : (
            days.map((d, i) => (
              <div key={i} className="flex justify-between items-center p-4 border-b border-border last:border-b-0 hover:bg-panel/50 transition-colors">
                <div>
                  <strong className="text-[0.9rem] font-bold text-ink">{d.date}</strong>
                  {d.note && <div className="text-muted text-[0.78rem] mt-0.5">{d.note}</div>}
                </div>
                <div>{pill(d.mark)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
