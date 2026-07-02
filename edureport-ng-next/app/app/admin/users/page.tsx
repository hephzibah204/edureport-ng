"use client";

import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Search, UserPlus, Shield, Mail, MoreVertical } from "lucide-react";

export default function UsersPage() {
  const users = [
    { id: 1, name: "Alice Freeman", email: "alice@reportsheet.com.ng", role: "Super Admin", lastActive: "2 mins ago" },
    { id: 2, name: "Bob Chen", email: "bob@reportsheet.com.ng", role: "Support Staff", lastActive: "1 hr ago" },
    { id: 3, name: "Carol Davis", email: "carol@reportsheet.com.ng", role: "Super Admin", lastActive: "Yesterday" },
    { id: 4, name: "David Kim", email: "david@reportsheet.com.ng", role: "Support Staff", lastActive: "3 days ago" },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#f8f9ff] min-h-screen text-[#0b1c30]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Users</h1>
            <p className="text-gray-500 mt-1">Manage system administrators and support staff</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-elite flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Invite User
          </motion.button>
        </div>

        <div className="glass shadow-elite rounded-2xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-80">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
              />
            </div>
            <div className="flex gap-2 text-sm font-medium bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm">All Users</button>
              <button className="px-4 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">Admins</button>
              <button className="px-4 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">Support</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={user.id}
                className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative"
              >
                <button className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-indigo-50">
                  <MoreVertical className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-4 ring-indigo-50">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${user.role === 'Super Admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    <Shield className="w-3.5 h-3.5" />
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Active {user.lastActive}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
