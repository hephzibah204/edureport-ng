"use client";

import React, { useState, useEffect } from 'react';
import { usePortal } from './PortalContext';
import Link from 'next/link';

import { motion } from 'framer-motion';
import { LoadingSpinner } from '../app/components/LoadingSpinner';

export default function PortalDashboard() {
  const { studentId, students, school } = usePortal();
  const student = students.find(s => s.id === studentId);
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
    presentRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!studentId) return;
      setLoading(true);
      try {
        const from = new Date();
        from.setMonth(from.getMonth() - 3); // last 3 months
        const to = new Date();
        
        const res = await fetch(`/api/portal/api/attendance/summary?studentId=${encodeURIComponent(studentId)}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);
        if (res.ok) {
          const data = await res.json() as any;
          setStats(data.summary || { present: 0, late: 0, absent: 0, total: 0, presentRate: 0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [studentId]);

  if (loading) return <div className="p-16 text-center animate-in fade-in"><LoadingSpinner /></div>;
  
  if (!student) return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-panel/30 border-2 border-dashed border-border rounded-[32px]">
      <div className="text-5xl opacity-20">👤</div>
      <div>
        <h3 className="font-display font-black text-xl text-ink">No student selected</h3>
        <p className="text-muted text-sm max-w-xs mx-auto">Please select a student from the sidebar to view their academic records.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Viewing academic progress for <span className="font-bold text-ink">{student.name}</span></p>
        </div>
        <Link href="/portal/report" className="btn btn-primary btn-sm">View Full Report</Link>
      </div>

      {/* Stats Cards */}
      <div className="metric-grid">
        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Attendance Rate</div>
            <div className="w-8 h-8 rounded-lg bg-green/10 text-green flex items-center justify-center text-sm">📈</div>
          </div>
          <div className="metric-val">{(stats.presentRate * 100).toFixed(1)}%</div>
          <div className="metric-sub font-bold text-ink2">Average this term</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Total Absences</div>
            <div className="w-8 h-8 rounded-lg bg-red/10 text-red flex items-center justify-center text-sm">⚠️</div>
          </div>
          <div className="metric-val text-red">{stats.absent}</div>
          <div className="metric-sub font-bold text-ink2">Days missed</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Current Term</div>
            <div className="w-8 h-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center text-sm">📅</div>
          </div>
          <div className="metric-val text-lg leading-tight mt-1">{school?.term || '---'}</div>
          <div className="metric-sub font-bold text-ink2">{school?.session || '---'} Session</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Result Status</div>
            <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center text-sm">📄</div>
          </div>
          <div className="metric-val text-lg leading-tight mt-1">Ready</div>
          <div className="metric-sub font-bold text-ink2">Available for download</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="card">
            <h3 className="card-title">Recent Term Report</h3>
            <div className="flex items-center justify-between p-4 bg-panel rounded-2xl border border-border group hover:border-green/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-card-bg flex items-center justify-center text-2xl shadow-sm">📄</div>
                <div>
                  <div className="font-black text-ink">{school?.term} Term Report</div>
                  <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{school?.session} Academic Year</div>
                </div>
              </div>
              <Link href="/portal/report" className="btn btn-ghost btn-sm group-hover:bg-green group-hover:text-white">Open</Link>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Attendance Insights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold text-muted">Progress to perfect attendance</span>
                <span className="text-xs font-black text-ink">{(stats.presentRate * 100).toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-panel rounded-full overflow-hidden border border-border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.presentRate * 100}%` }}
                  className="h-full bg-green"
                />
              </div>
              <p className="text-[10px] text-muted font-medium leading-relaxed">
                Regular attendance is crucial for academic success. This student has missed <span className="font-bold text-ink">{stats.absent} days</span> out of <span className="font-bold text-ink">{stats.total} total</span> school days recorded.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="card bg-panel border-border shadow-none">
            <h3 className="card-title">Student Profile</h3>
            <div className="text-center pb-6 border-b border-border/50">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-card-bg flex items-center justify-center text-3xl font-black shadow-sm mx-auto mb-3 border border-border">
                {student.name[0]}
              </div>
              <div className="font-black text-xl text-ink leading-tight">{student.name}</div>
              <div className="badge badge-blue mt-1">Class: {student.cls}</div>
            </div>
            
            <div className="pt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-black uppercase text-muted tracking-widest">Admission No</span>
                <span className="text-sm font-bold text-ink">{(student as any).admNo || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black uppercase text-muted tracking-widest">School</span>
                <span className="text-sm font-bold text-ink truncate max-w-[180px]">{school?.name || '---'}</span>
              </div>
              <Link href="/portal/profile" className="btn btn-outline btn-full btn-sm mt-4">Full Profile Info</Link>
            </div>
          </div>

          <div className="card bg-green3 text-white border-none relative overflow-hidden shadow-lg">
            <h3 className="card-title !text-gold2 !border-gold2/20">Portal Help</h3>
            <p className="text-xs opacity-70 leading-relaxed">
              If you notice any discrepancies in your child's data or results, please contact the school administration office.
            </p>
            <button className="btn btn-outline btn-white btn-xs mt-4 !bg-white/10">Report Issue</button>
          </div>
        </div>
      </div>
    </div>
  );
}
