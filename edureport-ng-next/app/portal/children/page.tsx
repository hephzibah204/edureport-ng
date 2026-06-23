"use client";

import { motion } from "framer-motion";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { GraduationCap, Award, Calendar } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { User, School, Student } from "@/src/types/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<any>);

interface PortalData {
  user: User;
  school: School;
  students: Student[];
}

export default function ChildrenPage() {
  const { data: portalData, isLoading } = useSWR<PortalData>('/api/portal/api/me', fetcher);
  const students = portalData?.students || [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout role="PARENT" title="My Children">
      <div className="max-w-7xl mx-auto space-y-8 text-[#0b1c30]">
        <header className="mb-10">
          <p className="text-gray-500 mt-2 text-lg">Manage and view profiles for your linked students.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="glass shadow-elite rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-white/60 min-h-[300px] animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="glass shadow-elite rounded-3xl p-20 bg-white/70 backdrop-blur-xl border border-white/60 text-center">
            <GraduationCap className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">No Children Linked</h3>
            <p className="text-gray-500 mt-2">Please contact the school to link your child to your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {students.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass shadow-elite rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-white/60 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <GraduationCap className="w-32 h-32 text-indigo-600" />
                </div>
                
                <div className="relative z-10 flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-200">
                    {getInitials(student.name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0b1c30]">{student.name}</h2>
                    <p className="text-indigo-600 font-medium mt-1">Class: {student.className || "Unassigned"}</p>
                    <p className="text-gray-500 text-xs font-semibold mt-0.5">Adm No: {student.admissionNo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-white/50 p-4 rounded-xl border border-white/50">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Award className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Evaluation</span>
                    </div>
                    <p className="text-lg font-bold text-[#0b1c30]">Active</p>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl border border-white/50">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Gender</span>
                    </div>
                    <p className="text-lg font-bold text-[#0b1c30]">{student.gender === 'F' ? 'Female' : 'Male'}</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4 relative z-10">
                  <Link href="/portal/performance" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-center font-medium transition-colors shadow-md shadow-indigo-200">
                    View Performance
                  </Link>
                  <Link href="/portal/attendance" className="flex-1 bg-white hover:bg-gray-50 text-[#0b1c30] py-3 px-4 rounded-xl text-center font-medium transition-colors border border-gray-200 shadow-sm">
                    Attendance Log
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
