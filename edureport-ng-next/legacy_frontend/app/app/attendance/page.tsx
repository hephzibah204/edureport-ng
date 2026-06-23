"use client";

import React from 'react';
import Link from 'next/link';

export default function AttendancePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="pg-title">Attendance Management</h1>
          <p className="text-muted text-sm mt-1">Track daily presence for all students and classes.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm">History</button>
          <button className="btn btn-primary btn-sm">Take Attendance</button>
        </div>
      </div>

      <div className="card py-16 text-center space-y-4">
        <div className="text-6xl">🚧</div>
        <h2 className="font-display font-black text-2xl text-ink">Feature Coming Soon</h2>
        <p className="text-muted max-w-md mx-auto">
          We are currently building a robust attendance tracking system that integrates with your school roster and automatically notifies parents.
        </p>
        <div className="pt-4">
          <Link href="/app" className="btn btn-outline btn-sm">Back to Dashboard</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-50 pointer-events-none">
        <div className="metric-card">
          <div className="metric-lbl">Daily Average</div>
          <div className="metric-val">--%</div>
        </div>
        <div className="metric-card">
          <div className="metric-lbl">Present Today</div>
          <div className="metric-val">0</div>
        </div>
        <div className="metric-card">
          <div className="metric-lbl">Absent Today</div>
          <div className="metric-val">0</div>
        </div>
      </div>
    </div>
  );
}
