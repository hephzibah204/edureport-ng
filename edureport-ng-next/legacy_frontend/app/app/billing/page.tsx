"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function BillingPage() {
  const { school, students, loading: schoolLoading, planLimits } = useSchool();
  const [loading, setLoading] = useState(false);

  const plans = [
    { 
      slug: 'TRIAL', 
      name: 'Free Trial', 
      price: '₦0', 
      limit: '50 Students', 
      features: ['Basic Reports', 'Continuous Assessment', '7-Day Access'],
      color: 'bg-gold',
      border: 'border-gold/20'
    },
    { 
      slug: 'STARTER', 
      name: 'Starter', 
      price: '₦25,000', 
      limit: '250 Students', 
      features: ['Unlimited Reports', 'Attendance Tracking', 'Priority Support'],
      color: 'bg-blue',
      border: 'border-blue/20'
    },
    { 
      slug: 'PRO', 
      name: 'Pro + AI', 
      price: '₦55,000', 
      limit: 'Unlimited', 
      features: ['AI Remark Generator', 'Custom Report Templates', 'Multiple Staff'],
      color: 'bg-purple-600',
      border: 'border-purple-600/20'
    }
  ];

  if (schoolLoading) return <div className="p-16 text-center"><LoadingSpinner /></div>;

  const currentPlan = plans.find(p => p.slug === (school?.plan || 'TRIAL')) || plans[0];
  const usagePct = planLimits.maxStudents === Infinity ? 0 : Math.min(100, (students.length / planLimits.maxStudents) * 100);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Billing & Subscription</h1>
          <p className="text-muted text-sm mt-1">Manage your school's licensing and service limits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Plan & Usage */}
        <div className="lg:col-span-8 space-y-6">
          <div className={`card relative overflow-hidden border-2 ${currentPlan.border}`}>
            <div className={`absolute top-0 right-0 px-6 py-1.5 ${currentPlan.color} text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl`}>
              Active Now
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Your Current Plan</div>
                  <h2 className="text-3xl font-black text-ink">{currentPlan.name}</h2>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] font-black text-muted uppercase tracking-widest">Student Usage</div>
                    <div className="text-sm font-black text-ink">{students.length} / {planLimits.maxStudents === Infinity ? 'Unlimited' : planLimits.maxStudents}</div>
                  </div>
                  <div className="h-3 bg-panel rounded-full overflow-hidden border border-border">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePct}%` }}
                      className={`h-full ${usagePct > 90 ? 'bg-red' : usagePct > 70 ? 'bg-gold' : 'bg-green'}`}
                    />
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-px h-px md:h-24 bg-border opacity-50" />
              
              <div className="space-y-2">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest">Billing Period</div>
                <div className="text-lg font-black text-ink">Active</div>
                <div className="text-xs text-muted font-bold">Valid until {school?.expiryDate ? new Date(school.expiryDate).toLocaleDateString() : 'Lifetime'}</div>
              </div>
            </div>
          </div>

          <div className="tbl-wrap">
            <div className="tbl-toolbar">
              <h3 className="font-display font-black text-ink text-sm uppercase tracking-wider">💳 Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="empty-row"><td colSpan={5}>No recent transactions found</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-black text-muted uppercase tracking-widest ml-1">Available Upgrades</h3>
          {plans.filter(p => p.slug !== school?.plan).map(p => (
            <div key={p.slug} className="card group hover:border-green transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-display font-black text-lg text-ink">{p.name}</h4>
                  <div className="text-xl font-black text-green">{p.price}<span className="text-[10px] text-muted ml-1 uppercase">/ Session</span></div>
                </div>
                <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center text-white text-xs`}>
                  {p.slug === 'PRO' ? '🚀' : '⭐'}
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs font-bold text-muted">
                    <span className="text-green text-[10px]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary btn-full btn-sm group-hover:scale-[1.02] transition-transform">Upgrade to {p.name}</button>
            </div>
          ))}
          
          <div className="p-6 bg-panel rounded-2xl border border-border">
            <h4 className="text-xs font-black text-ink uppercase tracking-widest mb-2">Support</h4>
            <p className="text-[10px] text-muted font-bold leading-relaxed mb-4">Need help choosing a plan or have custom requirements for your school?</p>
            <button className="btn btn-outline btn-full btn-xs">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  );
}
