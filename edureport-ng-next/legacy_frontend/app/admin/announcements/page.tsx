"use client";

import React, { useState, useEffect } from 'react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'SCHOOL',
    priority: 'NORMAL'
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json() as any;
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.content) return alert('Title and Content required');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', content: '', targetRole: 'SCHOOL', priority: 'NORMAL' });
        loadAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pg-announcements">
      <div className="pg-hdr">
        <div className="pg-title">Global Announcements<small>Send messages to all schools and teachers</small></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ New Message</button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Target</th>
              <th>Priority</th>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted">Loading…</td></tr>
            ) : announcements.length > 0 ? (
              announcements.map((a: any) => (
                <tr key={a.id}>
                  <td className="text-[0.78rem] text-muted">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td><span className="badge badge-blue">{a.targetRole}</span></td>
                  <td>
                    <span className={`badge ${a.priority === 'URGENT' ? 'badge-red' : a.priority === 'HIGH' ? 'badge-gold' : 'badge-gray'}`}>
                      {a.priority}
                    </span>
                  </td>
                  <td><strong>{a.title}</strong></td>
                  <td><span className="badge badge-green">{a.status}</span></td>
                  <td>
                    <button className="btn btn-red btn-xs" onClick={() => handleDelete(a.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="p-8 text-center text-muted">No messages sent yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="overlay open" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📢 New Announcement</div>
            <div className="field">
              <label>Message Title *</label>
              <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. System Maintenance" />
            </div>
            <div className="field">
              <label>Target Audience</label>
              <select value={formData.targetRole} onChange={e => setFormData({ ...formData, targetRole: e.target.value })}>
                <option value="SCHOOL">School Admins</option>
                <option value="TEACHER">Teachers Only</option>
                <option value="ALL">Everyone</option>
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="field">
              <label>Message Content *</label>
              <textarea 
                rows={5} 
                value={formData.content} 
                onChange={e => setFormData({ ...formData, content: e.target.value })} 
                placeholder="Write your message here..."
                className="w-full p-3 border border-border rounded-lg font-sans resize-y outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-background text-foreground"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Broadcast Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
