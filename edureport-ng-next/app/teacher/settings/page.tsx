"use client";
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Save, 
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  });

export default function TeacherSettings() {
  const { data, isLoading, mutate } = useSWR('/api/me', fetcher);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const d = data as any;
    if (d?.user) {
      setProfile({
        name: d.user.displayName || '',
        email: d.user.email || '',
        phone: d.user.phone || '',
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'personal') {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            displayName: profile.name,
            email: profile.email,
            phone: profile.phone,
          }),
        });
        if (!res.ok) {
          const err = await res.json() as any;
          throw new Error(err.error?.message || err.message || 'Failed to update profile');
        }
        mutate();
      } else if (activeTab === 'security') {
        if (!security.currentPassword || !security.newPassword) {
          toast.error("All password fields are required.");
          setSaving(false);
          return;
        }
        if (security.newPassword !== security.confirmPassword) {
          toast.error("New passwords do not match.");
          setSaving(false);
          return;
        }
        if (security.newPassword.length < 8) {
          toast.error("Password must be at least 8 characters long.");
          setSaving(false);
          return;
        }
        
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            oldPassword: security.currentPassword,
            newPassword: security.newPassword,
          }),
        });
        
        if (!res.ok) {
          const err = await res.json() as any;
          throw new Error(err.error?.message || err.message || 'Failed to change password');
        }
        
        setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      toast.success('Settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="TEACHER" title="Settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Details', icon: User },
    { id: 'security', label: 'Security & Password', icon: Lock },
  ];

  return (
    <DashboardLayout role="TEACHER" title="Account Settings">
      <div className="space-y-10">
        {/* Header with Save Button */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-[800] tracking-tight text-[#0b1c30]">Profile Settings</h2>
            <p className="text-lg font-medium text-[#464555]/70">Manage your personal information and account security.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white rounded-2xl px-8 py-4 text-sm font-bold shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-100 transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Navigation Tabs */}
          <aside className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
                  activeTab === tab.id 
                    ? "bg-white text-indigo-600 shadow-sm border border-[#0b1c30]/5" 
                    : "text-[#464555] hover:bg-white/50"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-indigo-600" : "text-[#464555]/40")} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-9 glass p-10 rounded-[2.5rem] shadow-elite min-h-[500px]">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'personal' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0b1c30]">Personal Details</h3>
                      <p className="text-sm font-medium text-[#464555]/60">Update your name and contact information.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#464555]/40">
                          <User className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                          placeholder="E.g. Jane Doe"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#464555]/40">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input 
                          type="email" 
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                          placeholder="jane.doe@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Phone Number</label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#464555]/40">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[#0b1c30]">Security</h3>
                      <p className="text-sm font-medium text-[#464555]/60">Update your password to keep your account safe.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Current Password</label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#464555]/40">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input 
                          type="password" 
                          value={security.currentPassword}
                          onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">New Password</label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#464555]/40">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input 
                          type="password" 
                          value={security.newPassword}
                          onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-[#464555]/50 uppercase tracking-widest ml-1">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#464555]/40">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input 
                          type="password" 
                          value={security.confirmPassword}
                          onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                          className="w-full pl-14 pr-5 py-4 bg-[#f8f9ff] border border-[#0b1c30]/5 rounded-2xl text-sm font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
