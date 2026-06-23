"use client";

import { motion } from "framer-motion";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import useSWR from "swr";
import { useState } from "react";
import { TrendingUp, Award, BookOpen } from "lucide-react";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json() as Promise<any>);

export default function PerformancePage() {
  const { data: portalData, isLoading: portalLoading } = useSWR('/api/portal/api/me', fetcher);
  const students = portalData?.students || [];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Set default student
  if (!selectedStudentId && students.length > 0) {
    setSelectedStudentId(students[0].id);
  }

  const { data: scoreData, isLoading: scoresLoading } = useSWR(
    selectedStudentId ? `/api/portal/api/scores/${selectedStudentId}` : null,
    fetcher
  );

  const selectedStudent = students.find((s: any) => s.id === selectedStudentId);
  const rawScores = scoreData?.scores?.[selectedStudentId || ''] || {};
  
  const chartData = Object.keys(rawScores).map(subject => {
    const s = rawScores[subject];
    const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
    return { label: subject, value: total };
  });

  const topSubject = chartData.length > 0 
    ? chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : null;

  const isLoading = portalLoading || (selectedStudentId && scoresLoading);

  return (
    <DashboardLayout role="PARENT" title="Academic Performance">
      <div className="max-w-7xl mx-auto space-y-8 text-[#0b1c30]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-gray-500 mt-2 text-lg">Trend charts and grade analysis across subjects.</p>
          </div>
          {students.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-500">View performance for:</span>
              <select 
                value={selectedStudentId || ''} 
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="glass shadow-elite rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-white/60 min-h-[400px] space-y-8 animate-pulse">
            <div className="flex justify-between items-end">
              <div className="space-y-3">
                <div className="h-8 w-64 bg-gray-200 rounded-xl" />
                <div className="h-4 w-48 bg-gray-100 rounded-lg" />
              </div>
              <div className="h-8 w-40 bg-gray-100 rounded-full" />
            </div>
            <div className="h-64 flex items-end justify-between gap-4 px-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-1 h-full flex flex-col items-center gap-4">
                  <div className="w-full bg-gray-100 rounded-t-xl" style={{ height: `${20 + i * 12}%` }} />
                  <div className="h-3 w-12 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="glass shadow-elite rounded-3xl p-20 bg-white/70 backdrop-blur-xl border border-white/60 text-center">
            <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">No Students Linked</h3>
            <p className="text-gray-500 mt-2">Please contact the school to link your child to your account.</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="glass shadow-elite rounded-3xl p-20 bg-white/70 backdrop-blur-xl border border-white/60 text-center">
            <TrendingUp className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">No Scores Yet</h3>
            <p className="text-gray-500 mt-2">Academic performance data for {selectedStudent?.name} will appear here once recorded.</p>
          </div>
        ) : (
          <div className="glass shadow-elite rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-white/60">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-2xl font-bold text-[#0b1c30]">Subject Averages ({selectedStudent?.name})</h2>
                <p className="text-gray-500 mt-1">Current term evaluation scores</p>
              </div>
              {topSubject && (
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Top Class: {topSubject.label}
                  </p>
                </div>
              )}
            </div>

            <div className="h-64 flex items-end justify-between gap-4 sm:gap-8 px-4">
              {chartData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="relative w-full h-full flex items-end justify-center rounded-t-xl overflow-hidden bg-gray-50/50 border-x border-t border-gray-100/50">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${data.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl group-hover:opacity-90 transition-opacity"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity font-black text-indigo-600">
                        {data.value}%
                      </div>
                    </motion.div>
                  </div>
                  <span className="font-bold text-gray-600 text-[10px] uppercase tracking-wider">{data.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {students.length > 0 && chartData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="glass shadow-elite p-8 rounded-3xl bg-white/70 border border-white/60">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                Academic Summary
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <p className="font-bold text-indigo-900">{selectedStudent?.name}</p>
                  <p className="text-indigo-700 mt-1 text-sm leading-relaxed">
                    Overall average across {chartData.length} subjects is {(chartData.reduce((a,b)=>a+b.value, 0) / chartData.length).toFixed(1)}%.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="glass shadow-elite p-8 rounded-3xl bg-white/70 border border-white/60">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                Key Achievements
              </h3>
              <ul className="space-y-4">
                {chartData.filter(d => d.value >= 80).map((d, i) => (
                  <li key={i} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <span className="font-medium">{d.label} Distinction</span>
                    <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">{d.value}%</span>
                  </li>
                ))}
                {chartData.filter(d => d.value >= 80).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No distinctions recorded yet for this term.</p>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
