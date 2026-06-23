"use client";

import React from 'react';
import Link from 'next/link';
import { useSchool } from './SchoolContext';

export default function SchoolDashboard() {
  const { school, students, scores, loading } = useSchool();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const scoresEnteredCount = Object.keys(scores).length;
  const totalStudentsCount = students.length;
  const completionRate = totalStudentsCount > 0 ? Math.round((scoresEnteredCount / totalStudentsCount) * 100) : 0;

  const avgs = Object.keys(scores).map(id => {
    const sc = scores[id] || {};
    const subs = school?.subjects || [];
    if (!subs.length) return null;
    const max = (school?.ca1Max || 10) + (school?.ca2Max || 10) + (school?.examMax || 80);
    let totalPct = 0;
    subs.forEach((sub: string) => {
      const s = sc[sub] || { ca1: 0, ca2: 0, exam: 0 };
      const tot = (+s.ca1 || 0) + (+s.ca2 || 0) + (+s.exam || 0);
      totalPct += max > 0 ? (tot / max) * 100 : 0;
    });
    return totalPct / subs.length;
  }).filter(a => a !== null) as number[];

  const classAvgNum = avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;

  return (
    <div className="px-4 md:px-8 py-8">
      {/* Hero Title */}
      <div className="mb-unit-xl">
        <h2 className="text-display-lg font-display-lg text-on-surface">Institutional Overview</h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mt-unit-xs">Manage your campus operations with high-fidelity analytics and automated reporting tools.</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl">person</span>
          </div>
          <p className="text-label-md font-label-md text-on-surface-variant mb-1">Total Students</p>
          <div className="flex items-end gap-3">
            <h3 className="text-headline-lg font-headline-lg">{totalStudentsCount}</h3>
            <span className="text-secondary font-label-md mb-2 flex items-center">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              Active
            </span>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl">verified_user</span>
          </div>
          <p className="text-label-md font-label-md text-on-surface-variant mb-1">Scores Coverage</p>
          <div className="flex items-end gap-3">
            <h3 className="text-headline-lg font-headline-lg">{completionRate}%</h3>
            <span className="text-secondary font-label-md mb-2 flex items-center">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              On Target
            </span>
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl">payments</span>
          </div>
          <p className="text-label-md font-label-md text-on-surface-variant mb-1">Average Score</p>
          <div className="flex items-end gap-3">
            <h3 className="text-headline-lg font-headline-lg">{classAvgNum.toFixed(1)}%</h3>
            <span className="text-primary font-label-md mb-2 flex items-center">
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Institution
            </span>
          </div>
        </div>
      </div>

      {/* Bento Layout Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Performance Trends (Main Chart) */}
        <div className="lg:col-span-8 glass-card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-headline-md font-headline-md">Term Performance Trends</h4>
              <p className="text-label-md font-label-md text-on-surface-variant">Aggregate academic scoring across all departments</p>
            </div>
            <select className="bg-surface-container-low border-none rounded-lg text-label-md py-2 px-4 focus:ring-primary outline-none">
              <option>Current Term</option>
              <option>Previous Term</option>
            </select>
          </div>
          <div className="h-64 w-full relative">
            <div className="absolute inset-0 flex items-end gap-4 px-4">
              <div className="flex-1 bg-primary/20 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '40%' }}></div>
              <div className="flex-1 bg-primary/20 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '55%' }}></div>
              <div className="flex-1 bg-primary/30 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '75%' }}></div>
              <div className="flex-1 bg-primary/20 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '60%' }}></div>
              <div className="flex-1 bg-primary/50 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '85%' }}></div>
              <div className="flex-1 bg-primary/30 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '65%' }}></div>
              <div className="flex-1 bg-primary/40 rounded-t-xl transition-all hover:bg-primary/40" style={{ height: '90%' }}></div>
            </div>
            <div className="absolute inset-0 border-b-2 border-outline-variant/20 flex flex-col justify-between py-2 pointer-events-none">
              <div className="w-full border-t border-outline-variant/10"></div>
              <div className="w-full border-t border-outline-variant/10"></div>
              <div className="w-full border-t border-outline-variant/10"></div>
              <div className="w-full border-t border-outline-variant/10"></div>
            </div>
          </div>
          <div className="flex justify-between mt-4 px-4 text-label-sm text-on-surface-variant font-label-sm">
            <span>WK 01</span>
            <span>WK 02</span>
            <span>WK 03</span>
            <span>WK 04</span>
            <span>WK 05</span>
            <span>WK 06</span>
            <span>WK 07</span>
          </div>
        </div>

        {/* Quick Actions & Operations */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <div className="glass-card p-unit-lg">
            <h4 className="text-headline-md font-headline-md mb-unit-md">Quick Actions</h4>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/app/students" className="w-full flex items-center justify-between p-4 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all active:scale-95">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">person_add</span>
                  <span className="font-label-md">Manage Students</span>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
              <Link href="/app/scores" className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">edit_square</span>
                  <span className="font-label-md">Enter Scores</span>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
              <Link href="/app/report" className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all active:scale-95">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-label-md">Generate Batch Report</span>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            </div>
          </div>

          <div className="glass-card p-unit-lg bg-secondary-container/10 border-secondary-container/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <span className="text-label-sm font-label-sm bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full">Live</span>
            </div>
            <h5 className="text-headline-md font-headline-md mb-1">Score Entry</h5>
            <p className="text-body-md font-body-md text-on-surface-variant">Continuous Assessment entry is {completionRate}% complete.</p>
            <div className="mt-4 w-full bg-white/50 rounded-full h-2">
              <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Roster Updates */}
      <div className="glass-card overflow-hidden mb-unit-xl">
        <div className="p-unit-lg border-b border-white/40 flex justify-between items-center">
          <h4 className="text-headline-md font-headline-md">Recent Enrollments</h4>
          <Link href="/app/students" className="text-primary font-label-md hover:underline">View All Records</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low/50">
              <tr>
                <th className="px-unit-lg py-4 text-label-md font-label-md text-on-surface-variant">Full Name</th>
                <th className="px-unit-lg py-4 text-label-md font-label-md text-on-surface-variant">ID Number</th>
                <th className="px-unit-lg py-4 text-label-md font-label-md text-on-surface-variant">Class</th>
                <th className="px-unit-lg py-4 text-label-md font-label-md text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {students.slice(0, 5).map(student => (
                <tr key={student.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-unit-lg py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <span className="text-body-md font-body-md font-medium">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-unit-lg py-4 text-body-md font-body-md text-on-surface-variant">{student.admNo || '-'}</td>
                  <td className="px-unit-lg py-4 text-body-md font-body-md">{student.cls}</td>
                  <td className="px-unit-lg py-4">
                    <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-on-secondary-container text-label-sm font-label-sm border border-secondary-container/30">Enrolled</span>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-unit-lg py-8 text-center text-on-surface-variant font-label-md">No students enrolled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
