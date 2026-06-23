"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function ProfileSettings() {
  const [profile, setProfile] = useState({ displayName: '', email: '', phone: '', totpEnabled: false });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      const data = await res.json() as any;
      if (data.user) {
        setProfile({
          displayName: data.user.displayName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          totpEnabled: data.user.totpEnabled || false
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: profile.displayName, email: profile.email, phone: profile.phone }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) toast.success('Profile settings updated');
      else toast.error((data as any).message || 'Update failed');
    } catch (err: any) {
      toast.error('Network error');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!passwords.oldPassword || passwords.newPassword !== passwords.confirmPassword || passwords.newPassword.length < 12) {
      toast.error('Check password requirements');
      return;
    }
    setUpdatingPwd(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: passwords.oldPassword, newPassword: passwords.newPassword }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Password updated successfully');
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const out = await res.json() as any;
        toast.error(out.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUpdatingPwd(false);
    }
  };

  if (loading) return <div className="p-16 text-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Security & Account</h1>
          <p className="text-muted text-sm mt-1">Manage your administrative profile and platform security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center text-lg">👤</div>
            <h2 className="font-display font-black text-xl text-ink">Personal Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div className="field">
              <label>Full Display Name</label>
              <input type="text" value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} placeholder="e.g. Admin User" />
            </div>
            <div className="field">
              <label>Email Address *</label>
              <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Direct Phone Number</label>
              <input type="text" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="e.g. +234..." />
            </div>
            <div className="pt-2">
              <button className="btn btn-primary btn-full btn-sm" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? <LoadingSpinner size="sm" color="white" /> : '💾 Save Profile Details'}
              </button>
            </div>
          </div>
        </div>

        <div className="card space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-xl bg-red/10 text-red flex items-center justify-center text-lg">🔒</div>
            <h2 className="font-display font-black text-xl text-ink">Access Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="field">
              <label>Current Password</label>
              <input type="password" value={passwords.oldPassword} onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label>New (Min 12 chars)</label>
                <input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
              </div>
              <div className="field">
                <label>Confirm New</label>
                <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
              </div>
            </div>
            <div className="pt-2">
              <button className="btn btn-outline btn-full btn-sm !border-gold !text-gold hover:!bg-gold hover:!text-white" onClick={changePassword} disabled={updatingPwd}>
                {updatingPwd ? <LoadingSpinner size="sm" /> : '🔑 Update Account Password'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-panel flex items-center justify-center text-2xl">🛡️</div>
          <div className="flex-1 min-w-[280px]">
            <div className="font-black text-ink">Multi-Factor Authentication</div>
            <div className="text-xs text-muted font-medium leading-relaxed">
              Add an additional layer of security to your administrative account using TOTP.
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`badge ${profile.totpEnabled ? 'badge-green' : 'badge-gold'} !text-[10px] font-black`}>
              {profile.totpEnabled ? 'PROTECTED' : 'NOT ENABLED'}
            </span>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => toast.info('2FA setup is handled via the login flow (v1.2)')}
            >
              {profile.totpEnabled ? 'Manage' : 'Configure'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
