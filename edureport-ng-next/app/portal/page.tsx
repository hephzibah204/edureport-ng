"use client";

import { motion } from "framer-motion";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import Link from "next/link";
import { Users, Calendar, Activity, TrendingUp } from "lucide-react";
import useSWR from "swr";
import { User, School, Student } from "@/src/types/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

interface PortalData {
  user: User;
  school: School;
  students: Student[];
}

export default function PortalOverview() {
  const { data: portalData, isLoading: portalLoading } = useSWR<PortalData>('/api/portal/api/me', fetcher);
  
  const firstStudentId = portalData?.students?.[0]?.id;
  const { data: attendanceData } = useSWR<{ summary: { presentRate: number } }>(
    firstStudentId ? `/api/portal/api/attendance/summary?studentId=${firstStudentId}&from=2024-01-01&to=2024-12-31` : null, 
    fetcher
  );

  const { data: scoresData } = useSWR<{ scores: Record<string, any> }>(
    firstStudentId ? `/api/portal/api/scores/${firstStudentId}` : null,
    fetcher
  );

  const calculatePerformance = () => {
    if (!scoresData?.scores || !firstStudentId) return "---";
    const studentScores = scoresData.scores[firstStudentId] || {};
    const totalSubjects = Object.keys(studentScores).length;
    if (totalSubjects === 0) return "No Data";

    let totalPercentage = 0;
    Object.values(studentScores).forEach((s: any) => {
      const score = (Number(s.ca1) || 0) + (Number(s.ca2) || 0) + (Number(s.exam) || 0);
      totalPercentage += score;
    });
    
    const average = totalPercentage / totalSubjects;
    if (average >= 75) return "Excellent";
    if (average >= 60) return "Very Good";
    if (average >= 50) return "Good";
    if (average >= 40) return "Pass";
    return "Needs Improvement";
  };

  const stats = [
    { 
      title: "Linked Children", 
      value: portalLoading ? "..." : (portalData?.students?.length || 0).toString(), 
      icon: Users, 
      href: "/portal/children", 
      color: "text-indigo-600", 
      bg: "bg-indigo-50" 
    },
    { 
      title: "Avg. Attendance", 
      value: attendanceData ? `${Math.round(attendanceData.summary.presentRate * 100)}%` : "...", 
      icon: Calendar, 
      href: "/portal/attendance", 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
    { 
      title: "Academic Performance", 
      value: scoresData ? calculatePerformance() : "...", 
      icon: Activity, 
      href: "/portal/results", 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
  ];

  return (
    <DashboardLayout role="PARENT" title="Parent Portal">
      <div className="max-w-7xl mx-auto space-y-8 text-[#0b1c30]">
        <header className="mb-10">
          <p className="text-gray-500 mt-2 text-lg">
            Welcome back, {portalData?.user?.displayName || 'Parent'}! Here is the latest overview of your children's progress.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={stat.href} className="block group">
                <div className="glass shadow-elite rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white/70 backdrop-blur-xl border border-white/50 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-50 rounded-bl-full pointer-events-none`} />
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <TrendingUp className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <h3 className="text-gray-500 font-medium">{stat.title}</h3>
                  <p className="text-3xl font-bold mt-1 text-[#0b1c30]">{stat.value}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 glass shadow-elite rounded-2xl p-8 bg-white/70 backdrop-blur-xl border border-white/50"
        >
          <h2 className="text-2xl font-bold mb-6 text-[#0b1c30]">Recent Activity</h2>
          <div className="space-y-4">
            {portalData?.students?.length ? portalData.students.map((student, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50">
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500" />
                <div>
                  <p className="font-medium text-[#0b1c30]">{student.name} is enrolled in {student.className}</p>
                  <p className="text-sm text-gray-400 mt-1">Student Record Active</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 italic">No recent activity found.</p>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
