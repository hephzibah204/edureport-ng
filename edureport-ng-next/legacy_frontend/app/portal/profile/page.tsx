"use client";

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { usePortal } from '../PortalContext';

export default function ProfilePage() {
  const { studentId } = usePortal();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/api/student/${encodeURIComponent(studentId)}`, { credentials: 'include' });
      const data = await res.json() as any;
      setProfile(data.student || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  const downloadPdf = async () => {
    if (!profile) return alert('Profile not loaded');
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.setTextColor(13, 69, 38); // Report green
      pdf.text('Student Profile Card', 105, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 26, { align: 'center' });
      
      const rows = fields.map(([k, v]) => [k, v || 'Not provided']);
      
      (pdf as any).autoTable({
        startY: 40,
        head: [['Field', 'Detail']],
        body: rows,
        theme: 'striped',
        headStyles: { fillStyle: 'dark', fillColor: [13, 69, 38] }
      });
      
      pdf.save(`Profile_${profile.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('PDF generation failed');
    }
  };
  const fields = [
    ['Full Name', profile?.name],
    ['Admission No', profile?.admNo],
    ['Class', profile?.cls],
    ['Gender', profile?.gender],
    ['Date of Birth', profile?.dob],
    ['House', profile?.house],
    ['Address', profile?.address],
    ['Guardian', profile?.guardianName],
    ['Guardian Phone', profile?.guardianPhone]
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between mb-[1.6rem] gap-4">
        <div className="font-display text-[1.55rem] font-black text-ink leading-[1.15]">
          Student Profile
          <small className="block font-sans text-[0.78rem] font-normal text-muted mt-[3px]">Details shared by your school</small>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={downloadPdf}>⬇️ Download PDF</button>
          <button className="btn btn-ghost btn-sm bg-white border border-border hover:bg-panel transition-colors" onClick={loadProfile}>↻ Refresh</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[12px] border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="font-bold text-[1.1rem] mb-6 border-b border-border pb-3">Profile Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="text-[0.85rem] text-muted p-4 bg-panel rounded-lg w-full md:col-span-2 text-center">Loading…</div>
          ) : !profile ? (
            <div className="text-[0.85rem] text-muted p-4 bg-panel rounded-lg w-full md:col-span-2 text-center">No profile details available.</div>
          ) : (
            fields.map(([k, v], i) => (
              <div key={i} className="flex flex-col">
                <label className="text-[0.72rem] uppercase font-extrabold text-muted tracking-[0.05em] mb-1">{k}</label>
                <div className="font-bold text-[0.95rem] text-ink bg-panel/50 px-3 py-2 rounded-lg border border-border/50">{v || <span className="text-muted italic font-normal">Not provided</span>}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
