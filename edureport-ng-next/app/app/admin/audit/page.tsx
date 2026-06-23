"use client";

import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Search, Filter, Activity, Settings, UserPlus, FileText, Database, Download } from "lucide-react";

export default function AuditPage() {
  const auditLogs = [
    { id: "LOG-001", user: "Alice Freeman", action: "School Created", details: "Royal Academy onboarded with Enterprise plan", time: "10 mins ago", type: "system" },
    { id: "LOG-002", user: "System", action: "Invoice Paid", details: "Payment of $999.00 received for INV-2024-001", time: "1 hour ago", type: "billing" },
    { id: "LOG-003", user: "Bob Chen", action: "Settings Updated", details: "Global password policy updated", time: "3 hours ago", type: "settings" },
    { id: "LOG-004", user: "Carol Davis", action: "User Invited", details: "Invited new support staff member (david@edureport.com)", time: "Yesterday", type: "user" },
    { id: "LOG-005", user: "System", action: "Database Backup", details: "Automated daily backup completed successfully", time: "Yesterday", type: "system" },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'system': return <Database className="w-4 h-4" />;
      case 'billing': return <FileText className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4" />;
      case 'user': return <UserPlus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'system': return 'bg-indigo-50 text-indigo-600 ring-indigo-100';
      case 'billing': return 'bg-emerald-50 text-emerald-600 ring-emerald-100';
      case 'settings': return 'bg-gray-100 text-gray-600 ring-gray-200';
      case 'user': return 'bg-blue-50 text-blue-600 ring-blue-100';
      default: return 'bg-purple-50 text-purple-600 ring-purple-100';
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#f8f9ff] min-h-screen text-[#0b1c30]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-gray-500 mt-1">System-wide activity and security tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-elite hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-[400px]">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search logs by user, action, or ID..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              />
            </div>
            <div className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              Showing <span className="font-bold text-gray-900">50</span> of <span className="font-bold text-gray-900">12,405</span> events
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-sm font-bold text-gray-600">
                  <th className="py-4 pl-5 w-32">Log ID</th>
                  <th className="py-4 w-48">Actor</th>
                  <th className="py-4 w-56">Action</th>
                  <th className="py-4">Details</th>
                  <th className="py-4 text-right pr-5 w-40">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {auditLogs.map((log, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={log.id} 
                    className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-4 pl-5 font-mono text-xs font-semibold text-gray-400">{log.id}</td>
                    <td className="py-4">
                      <span className="font-bold text-gray-900">{log.user}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ring-1 ${getColorForType(log.type)}`}>
                          {getIconForType(log.type)}
                        </div>
                        <span className="font-bold text-gray-800">{log.action}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 font-medium">{log.details}</td>
                    <td className="py-4 text-right pr-5 font-semibold text-gray-500 whitespace-nowrap">{log.time}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm font-medium text-gray-500">Page 1 of 249</p>
            <div className="flex items-center gap-1.5">
              <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50" disabled>Previous</button>
              <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold shadow-sm">1</button>
              <button className="w-10 h-10 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">2</button>
              <button className="w-10 h-10 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">3</button>
              <span className="text-gray-400 font-bold px-2">...</span>
              <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
