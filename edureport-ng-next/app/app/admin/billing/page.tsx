"use client";

import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { CreditCard, TrendingUp, Download, CheckCircle2, ArrowUpRight, AlertCircle, Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BillingPage() {
  const chartData = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 5200 },
    { name: "Mar", revenue: 6800 },
    { name: "Apr", revenue: 8400 },
    { name: "May", revenue: 9900 },
    { name: "Jun", revenue: 12500 },
    { name: "Jul", revenue: 15400 },
  ];

  const plans = [
    { name: "Basic", price: "$499/mo", active: 45, features: ["Up to 500 students", "Standard support", "Basic reporting"] },
    { name: "Pro", price: "$999/mo", active: 28, features: ["Up to 2000 students", "Priority support", "Advanced analytics", "Custom domain"] },
    { name: "Enterprise", price: "Custom", active: 12, features: ["Unlimited students", "Dedicated success manager", "White-labeling", "API access"] },
  ];

  const recentInvoices = [
    { id: "INV-2024-001", school: "Royal Academy", amount: "$999.00", status: "Paid", date: "Oct 1, 2024" },
    { id: "INV-2024-002", school: "Springfield High", amount: "$499.00", status: "Paid", date: "Sep 28, 2024" },
    { id: "INV-2024-003", school: "St. John's College", amount: "$999.00", status: "Overdue", date: "Sep 15, 2024" },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#f8f9ff] min-h-screen text-[#0b1c30]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Revenue</h1>
            <p className="text-gray-500 mt-1">Platform financial overview and plan management</p>
          </div>
          <button className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monthly Recurring Revenue</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">$54,200</h3>
                  <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 12.5%</span>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">85</h3>
                  <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md"><ArrowUpRight className="w-3 h-3 mr-0.5" /> 4 new</span>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Payments</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">$2,450</h3>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">3 invoices</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chart */}
        <div className="glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Growth (YTD)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#0b1c30', fontWeight: 'bold' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plans and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Active Plans Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan, i) => (
                <motion.div key={plan.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="border border-gray-100 rounded-2xl p-6 bg-white relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-transparent -mr-10 -mt-10 rounded-full transition-transform group-hover:scale-[2] duration-700"></div>
                  <h3 className="font-bold text-gray-900 text-lg relative z-10">{plan.name}</h3>
                  <div className="mt-2 mb-4 relative z-10">
                    <span className="text-2xl font-black text-indigo-600">{plan.price}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-500 mb-5 pb-5 border-b border-gray-50 relative z-10">
                    <span className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded-md mr-1">{plan.active}</span> active schools
                  </div>
                  <ul className="space-y-3 relative z-10">
                    {plan.features.slice(0, 3).map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass shadow-elite rounded-2xl p-6 border border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Invoices</h2>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
            </div>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm bg-gray-50/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${invoice.status === 'Paid' ? 'bg-white text-emerald-600' : 'bg-white text-amber-600'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{invoice.school}</p>
                      <p className="text-xs text-gray-500 font-medium">{invoice.id} • {invoice.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">{invoice.amount}</p>
                    <p className={`text-xs font-bold mt-0.5 ${invoice.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
