"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { Megaphone, Mail, MessageSquare, Send, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';

export default function CommunicationsBroadcast() {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    target: 'all_schools',
    subject: '',
    message: ''
  });

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Broadcast sent successfully to ${formData.target} via ${activeTab.toUpperCase()}.`);
      setFormData({ ...formData, subject: '', message: '' });
    }, 2000);
  };

  return (
    <DashboardLayout role="ADMIN" title="Sitewide Broadcasts">
      <div className="space-y-6">
        {/* Header */}
        <section className="glass p-8 rounded-[2.5rem] shadow-elite flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight">Omnichannel Communications</h2>
            <p className="text-sm font-medium text-[#464555]/70">Send platform-wide alerts, emails, and SMS to all stakeholders.</p>
          </div>
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Megaphone className="w-8 h-8" />
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Composer */}
          <div className="flex-1 glass p-8 rounded-[2.5rem] shadow-elite">
            <div className="flex items-center gap-4 mb-8 bg-[#f8f9ff] p-2 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('email')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'email' ? "bg-white text-indigo-600 shadow-sm" : "text-[#464555] hover:text-[#0b1c30]"
                )}
              >
                <Mail className="w-4 h-4" />
                Email Broadcast
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'sms' ? "bg-white text-indigo-600 shadow-sm" : "text-[#464555] hover:text-[#0b1c30]"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                SMS Alert
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Target Audience</label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555]/40 group-focus-within:text-indigo-600 transition-colors" />
                  <select 
                    value={formData.target}
                    onChange={e => setFormData({...formData, target: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all_schools">All School Admins</option>
                    <option value="all_teachers">All Teachers</option>
                    <option value="all_parents">All Parents</option>
                    <option value="all_students">All Students</option>
                    <option value="active_subscriptions">Active Subscriptions Only</option>
                    <option value="expired_subscriptions">Expired Subscriptions</option>
                  </select>
                </div>
              </div>

              {activeTab === 'email' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Subject Line</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Platform Maintenance Update"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3.5 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#0b1c30] uppercase tracking-widest ml-1">Message Content</label>
                <textarea 
                  required
                  rows={activeTab === 'email' ? 8 : 4}
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full p-4 bg-white/50 border border-[#0b1c30]/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all resize-none"
                />
                {activeTab === 'sms' && (
                  <div className="text-right text-[10px] font-bold text-[#464555]/50">
                    {formData.message.length} / 160 characters
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading || !formData.message || (activeTab === 'email' && !formData.subject)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {loading ? 'Dispatching...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="glass p-6 rounded-[2rem] shadow-elite">
              <h3 className="text-sm font-extrabold text-[#0b1c30] mb-4 uppercase tracking-widest">Broadcast Rules</h3>
              <ul className="space-y-4 text-xs font-medium text-[#464555]/80">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 flex-shrink-0" />
                  SMS messages are billed at $0.05 per segment (160 chars).
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 flex-shrink-0" />
                  Emails bypass promotional filters and are sent via transactional IPs.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1 flex-shrink-0" />
                  "All Users" broadcasts reach 125,000+ accounts. Use with extreme caution.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
