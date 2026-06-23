"use client";

import React, { useState, useEffect } from 'react';

export default function AdminAccess() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json() as any;
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Access Control
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Manage platform users and roles</small>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => alert('Add User feature coming soon')}>+ New Staff</button>
      </div>

      <div className="bg-white border border-border rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div className="m-0 flex-1 min-w-[200px]">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Search Email</label>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="email@example.com" 
              className="w-full py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green" 
            />
          </div>
          <div className="m-0">
            <label className="block text-[0.82rem] font-bold text-ink2 mb-1.5">Role</label>
            <select 
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="py-2 px-3 border-[1.5px] border-border rounded-lg outline-none focus:border-green bg-white min-w-[140px]"
            >
              <option value="">All Roles</option>
              <option>ADMIN</option>
              <option>STAFF</option>
              <option>SCHOOL</option>
              <option>TEACHER</option>
              <option>PARENT</option>
            </select>
          </div>
          <button className="btn btn-ghost btn-sm h-[38px]" onClick={loadUsers}>Refresh</button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse text-[0.85rem]">
            <thead className="bg-panel border-b border-border">
              <tr>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Email</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Role</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Status</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Last Login</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">2FA</th>
                <th className="p-3 font-semibold text-muted text-[0.75rem] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b border-border hover:bg-panel/50 transition-colors">
                  <td className="p-3 font-bold">{u.email}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-extrabold ${u.role === 'ADMIN' ? 'bg-red/10 text-red' : 'bg-panel text-muted'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-extrabold ${u.status === 'ACTIVE' ? 'bg-green4 text-green' : 'bg-red/10 text-red'}`}>{u.status}</span></td>
                  <td className="p-3 text-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[0.7rem] font-extrabold ${u.totpEnabled ? 'bg-green4 text-green' : 'bg-panel text-muted'}`}>
                      {u.totpEnabled ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button className="btn btn-outline btn-xs" onClick={() => alert('Manage User feature coming soon')}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
