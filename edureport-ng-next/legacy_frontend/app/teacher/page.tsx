"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTeacher } from './TeacherContext';

import { motion } from 'framer-motion';

export default function TeacherDashboard() {
  const { user, school, classes } = useTeacher();
  const [stats, setStats] = useState({
    done: 0,
    pending: 0
  });
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    scoresCompletion: 0
  });
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayISO = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function fetchDashboardData() {
      if (!classes.length) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const date = todayISO();
        
        // Parallel fetch for class statuses and aggregate metrics
        const [checks, statsRes] = await Promise.all([
          Promise.all(classes.map(async (c: string) => {
            try {
              const out = await fetch(`/api/teacher/api/attendance/session?className=${encodeURIComponent(c)}&date=${encodeURIComponent(date)}`, { credentials: 'include' });
              const data = await out.json() as any;
              return { className: c, status: data?.session?.status || 'DRAFT' };
            } catch {
              return { className: c, status: 'DRAFT' };
            }
          })),
          fetch('/api/teacher/api/stats', { credentials: 'include' }).then(r => r.json() as any)
        ]);

        setClassesList(checks);
        if (statsRes) setMetrics(statsRes);
        
        const done = checks.filter(x => x.status === 'SUBMITTED').length;
        setStats({ done, pending: Math.max(0, classes.length - done) });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [classes]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Hello, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-muted text-sm mt-1">Here is an overview of your classroom activities for today.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>↻ Refresh</button>
          <Link href="/teacher/roster" className="btn btn-primary btn-sm">Record Attendance</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="metric-grid">
        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Total Students</div>
            <div className="w-8 h-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center text-sm">👥</div>
          </div>
          <div className="metric-val">{metrics.totalStudents}</div>
          <div className="metric-sub font-bold text-ink2">In {classes.length} assigned classes</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Attendance Rate</div>
            <div className="w-8 h-8 rounded-lg bg-green/10 text-green flex items-center justify-center text-sm">📈</div>
          </div>
          <div className="metric-val">{metrics.attendanceRate}%</div>
          <div className="metric-sub font-bold text-ink2">Average (last 30 days)</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Sessions Today</div>
            <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center text-sm">🗓️</div>
          </div>
          <div className="metric-val">{stats.done} <span className="text-xs text-muted font-normal">/ {classes.length}</span></div>
          <div className="metric-sub font-bold text-ink2">Registers submitted</div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="metric-card">
          <div className="flex justify-between items-start mb-2">
            <div className="metric-lbl">Result Entry</div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm">📝</div>
          </div>
          <div className="metric-val">{metrics.scoresCompletion}%</div>
          <div className="metric-sub font-bold text-ink2">Term score progress</div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="tbl-wrap">
            <div className="tbl-toolbar">
              <div>
                <h2 className="font-display font-black text-ink text-lg">Classroom Registers</h2>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Status for {new Date().toDateString()}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Attendance Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={3} className="p-4"><div className="h-4 bg-panel rounded w-full" /></td>
                      </tr>
                    ))
                  ) : classesList.length > 0 ? (
                    classesList.map(cls => (
                      <tr key={cls.className} className="group">
                        <td>
                          <div className="font-bold text-ink">{cls.className}</div>
                        </td>
                        <td>
                          {cls.status === 'SUBMITTED' ? (
                            <span className="badge badge-green">✓ SUBMITTED</span>
                          ) : (
                            <span className="badge badge-gold">⚠️ DRAFT</span>
                          )}
                        </td>
                        <td className="text-right">
                          <Link href={`/teacher/roster?className=${encodeURIComponent(cls.className)}`} className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {cls.status === 'SUBMITTED' ? 'View' : 'Take Attendance'}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="empty-row"><td colSpan={3}>No classes assigned to your profile.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="card !bg-green3 text-white border-none relative overflow-hidden shadow-lg">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10 rotate-12">📚</div>
            <h3 className="card-title !text-gold2 !border-gold2/20">Term Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-70 uppercase font-black tracking-widest">Academic Year</span>
                <span className="font-bold">{school?.session || '---'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-70 uppercase font-black tracking-widest">Current Term</span>
                <span className="font-bold text-gold2">{school?.term || '---'}</span>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Important Dates</div>
                <div className="text-[11px] font-bold">Resumption: {school?.nextTerm || 'TBA'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Quick Tasks</h3>
            <div className="space-y-2">
              <Link href="/teacher/scores" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-panel transition-all group">
                <span className="text-lg">📝</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink">Enter Scores</div>
                  <div className="text-[10px] text-muted font-bold uppercase">Record results</div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
              <Link href="/teacher/comments" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-panel transition-all group">
                <span className="text-lg">💬</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink">Staff Remarks</div>
                  <div className="text-[10px] text-muted font-bold uppercase">Class teacher comments</div>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
