"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import useSWR from "swr";
import { User, School, Student } from "@/src/types/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

interface PortalData {
  user: User;
  school: School;
  students: Student[];
}

export default function AttendancePage() {
  const { data: portalData, isLoading: portalLoading } = useSWR<PortalData>('/api/portal/api/me', fetcher);
  const students = portalData?.students || [];

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Date range covering last 1 year to now
  const [fromDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: summaryRes, isLoading: summaryLoading } = useSWR(
    selectedStudentId ? `/api/portal/api/attendance/summary?studentId=${selectedStudentId}&from=${fromDate}&to=${toDate}` : null,
    fetcher
  );

  const { data: daysRes, isLoading: daysLoading } = useSWR(
    selectedStudentId ? `/api/portal/api/attendance/days?studentId=${selectedStudentId}&from=${fromDate}&to=${toDate}` : null,
    fetcher
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const summary = summaryRes?.summary || { present: 0, absent: 0, late: 0, total: 0 };
  const records = daysRes?.days || [];

  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <DashboardLayout role="PARENT" title="Attendance Logs">
      <div className="max-w-7xl mx-auto space-y-8 text-[#0b1c30]">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 mt-2 text-lg">Detailed attendance records for the academic term.</p>
          </div>
          {students.length > 0 && (
            <div className="flex items-center gap-3 bg-white/50 border border-white/60 p-1.5 px-3 rounded-2xl shadow-sm">
              <span className="text-sm font-extrabold text-[#464555]/60 uppercase tracking-wider text-[10px]">Select Student:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-white border border-[#0b1c30]/5 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-600/10 focus:outline-none transition-all"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {portalLoading || summaryLoading || daysLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass p-6 rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
            <div className="glass rounded-2xl h-64 animate-pulse" />
          </div>
        ) : students.length === 0 ? (
          <div className="glass shadow-elite rounded-3xl p-20 bg-white/70 backdrop-blur-xl border border-white/60 text-center">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">No Students Linked</h3>
            <p className="text-gray-500 mt-2">Please contact the school to link your children's profiles.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass shadow-elite p-6 rounded-2xl bg-white/80 border border-white">
                <p className="text-gray-500 font-medium">Total Present Days</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{summary.present}</p>
              </div>
              <div className="glass shadow-elite p-6 rounded-2xl bg-white/80 border border-white">
                <p className="text-gray-500 font-medium">Total Absences</p>
                <p className="text-3xl font-bold text-rose-600 mt-2">{summary.absent}</p>
              </div>
              <div className="glass shadow-elite p-6 rounded-2xl bg-white/80 border border-white">
                <p className="text-gray-500 font-medium">Late Arrivals</p>
                <p className="text-3xl font-bold text-amber-500 mt-2">{summary.late}</p>
              </div>
            </div>

            <div className="glass shadow-elite rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden">
              {records.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No attendance logs found for {selectedStudent?.name || "the selected student"}.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white/50 border-b border-gray-100">
                    <tr>
                      <th className="p-5 font-semibold text-gray-600">Date</th>
                      <th className="p-5 font-semibold text-gray-600">Student</th>
                      <th className="p-5 font-semibold text-gray-600">Status</th>
                      <th className="p-5 font-semibold text-gray-600">Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((record: any, i: number) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-white/40 transition-colors"
                      >
                        <td className="p-5 font-medium">{formatDate(record.date)}</td>
                        <td className="p-5 text-gray-600">{selectedStudent?.name}</td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                            record.mark === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                            record.mark === 'LATE' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {record.mark === 'PRESENT' && <CheckCircle2 className="w-4 h-4" />}
                            {record.mark === 'LATE' && <Clock className="w-4 h-4" />}
                            {record.mark === 'ABSENT' && <XCircle className="w-4 h-4" />}
                            {record.mark}
                          </span>
                        </td>
                        <td className="p-5 text-gray-500 text-sm">{record.note || '-'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
