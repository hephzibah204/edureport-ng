"use client";

import React, { useState, useEffect } from 'react';
import { usePortal } from '../PortalContext';

export default function SettingsPage() {
  const { user, refreshMe } = usePortal();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const updateProfile = async () => {
    try {
      const res = await fetch(`/api/portal/api/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email })
      });
      if (!res.ok) throw new Error('Failed to update details');
      alert('Account details updated successfully');
      refreshMe();
    } catch (e: any) {
      alert(e?.message || 'Failed to update details');
    }
  };

  const updatePassword = async () => {
    if (!oldPassword || !newPassword) {
      alert('Please enter both current and new password');
      return;
    }
    try {
      const res = await fetch(`/api/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (!res.ok) throw new Error('Failed to change password');
      alert('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (e: any) {
      alert(e?.message || 'Failed to change password');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Settings
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Update your account details and password</small>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[12px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-[1.5rem] max-w-[600px]">
        <div className="font-bold text-[1.1rem] mb-4">Account Details</div>
        <div className="flex flex-col gap-[15px]">
          <div>
            <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">Display Name</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
            />
          </div>
          <button className="btn btn-primary self-start" onClick={updateProfile}>Save Account Details</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[12px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] max-w-[600px]">
        <div className="font-bold text-[1.1rem] mb-4">Change Password</div>
        <div className="flex flex-col gap-[15px]">
          <div>
            <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">Current Password</label>
            <input 
              type="password" 
              value={oldPassword} 
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
            />
          </div>
          <button className="btn btn-primary self-start" onClick={updatePassword}>Change Password</button>
        </div>
      </div>
    </div>
  );
}
