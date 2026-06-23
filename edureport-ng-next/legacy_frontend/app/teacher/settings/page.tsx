"use client";

import React, { useState, useEffect } from 'react';

export default function TeacherSettings() {
  const [profile, setProfile] = useState({ displayName: '', email: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        const data = await res.json() as any;
        if (data.user) {
          setProfile({
            displayName: data.user.displayName || '',
            email: data.user.email || ''
          });
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    }
    fetchMe();
  }, []);

  const handleProfileSave = async () => {
    try {
      const res = await fetch('/api/teacher/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) alert('Profile updated');
      else alert('Failed to update profile');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      alert('Please fill both fields');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords)
      });
      if (res.ok) {
        alert('Password changed');
        setPasswords({ oldPassword: '', newPassword: '' });
      } else {
        const data = await res.json() as any;
        alert(data.error?.message || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Settings
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Update your profile and password</small>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.6rem]">
        <div className="bg-white p-6 rounded-[12px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1.1rem] mb-4">Profile Settings</div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">Display Name</label>
              <input 
                value={profile.displayName} 
                onChange={e => setProfile({ ...profile, displayName: e.target.value })} 
                placeholder="Full Name"
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
              />
            </div>
            <div>
              <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">Email Address</label>
              <input 
                type="email"
                value={profile.email} 
                onChange={e => setProfile({ ...profile, email: e.target.value })} 
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
              />
            </div>
            <button className="btn btn-primary self-start" onClick={handleProfileSave}>Save Profile</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[12px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="font-bold text-[1.1rem] mb-4">Security</div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">Current Password</label>
              <input 
                type="password"
                value={passwords.oldPassword} 
                onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })} 
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
              />
            </div>
            <div>
              <label className="text-[0.75rem] font-bold text-muted uppercase tracking-wider block mb-1">New Password</label>
              <input 
                type="password"
                value={passwords.newPassword} 
                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} 
                className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green"
              />
            </div>
            <button className="btn btn-primary self-start" onClick={handlePasswordChange}>Update Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
