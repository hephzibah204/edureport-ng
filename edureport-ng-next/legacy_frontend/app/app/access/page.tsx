"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../SchoolContext';
import { toast } from '../components/Toast';
import { LoadingSpinner, SkeletonRow } from '../components/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/Card';

export default function AccessPage() {
  const { school, teachers, students } = useSchool();
  const [activeTab, setActiveTab] = useState<'teachers' | 'parents'>('teachers');
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadParents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parents', { credentials: 'include' });
      const data = await res.json() as any;
      setParents(Array.isArray(data.parents) ? data.parents : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'parents') loadParents();
    else setLoading(false);
  }, [activeTab]);

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    }
  };

  const getBrandedUrl = (email?: string) => {
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'reportsheet.com.ng';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    
    // If we have a subdomain, use it. Otherwise fallback to current origin.
    const baseUrl = school?.subdomain 
      ? `${protocol}//${school.subdomain}.${mainDomain}`
      : (mounted && typeof window !== 'undefined') ? window.location.origin : '';
      
    const path = email ? `/login?email=${encodeURIComponent(email)}` : '/login';
    return `${baseUrl}${path}`;
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="pg-title">Access Control</h1>
          <p className="text-muted text-sm mt-1">Generate login credentials and manage portal invitations for your school community.</p>
        </div>
        
        <div className="flex bg-panel p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'teachers' ? 'bg-white dark:bg-card-bg shadow-sm text-green' : 'text-muted'}`}
          >
            Staff Access
          </button>
          <button 
            onClick={() => setActiveTab('parents')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'parents' ? 'bg-white dark:bg-card-bg shadow-sm text-green' : 'text-muted'}`}
          >
            Parent/Student Access
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="tbl-wrap">
            <div className="tbl-toolbar">
              <h2 className="font-display font-black text-ink text-lg capitalize">{activeTab} Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email / Login</th>
                    <th>Link Status</th>
                    <th className="text-right">Portal Link</th>
                  </tr>
                </thead>
                <tbody>
                  {!mounted || loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} columns={4} />)
                  ) : activeTab === 'teachers' ? (
                    teachers.length > 0 ? teachers.map(t => (
                      <tr key={t.id}>
                        <td className="font-bold text-ink">{t.displayName}</td>
                        <td className="text-xs text-muted font-mono">{t.email}</td>
                        <td><span className="badge badge-green">ACTIVE</span></td>
                        <td className="text-right">
                          <button 
                            className="btn btn-ghost btn-xs text-blue"
                            onClick={() => copyToClipboard(getBrandedUrl(), 'Portal URL')}
                          >
                            📋 Copy Login URL
                          </button>
                        </td>
                      </tr>
                    )) : <tr className="empty-row"><td colSpan={4}>No teachers added yet. Go to Teachers tab.</td></tr>
                  ) : (
                    parents.length > 0 ? parents.map(p => (
                      <tr key={p.id}>
                        <td className="font-bold text-ink">{p.displayName}</td>
                        <td className="text-xs text-muted font-mono">{p.email}</td>
                        <td>
                          <div className="flex gap-1">
                            {p.linkedStudents?.map((s: any) => (
                              <span key={s.id} className="badge badge-blue !text-[8px]">{s.name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="text-right">
                          <button 
                            className="btn btn-ghost btn-xs text-blue"
                            onClick={() => copyToClipboard(getBrandedUrl(p.email), 'Login Link')}
                          >
                            📋 Copy Invite
                          </button>
                        </td>
                      </tr>
                    )) : <tr className="empty-row"><td colSpan={4}>No parent accounts. Go to Parents tab to create one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="relative overflow-hidden bg-card border-border">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10 rotate-12">🔑</div>
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-bold text-foreground">Login Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground font-medium px-5 pb-5">
              <p>Staff and Parents use the same login portal but see different dashboards based on their role.</p>
              <div className="p-3 bg-muted border border-border rounded-lg">
                <div className="font-bold text-foreground uppercase tracking-wider mb-1 text-[9px]">Branded Portal URL</div>
                <div className="font-mono text-foreground font-bold break-all select-all">{getBrandedUrl()}</div>
              </div>
              <p>When you create an account, provide the temporary password you set. Users will be prompted to change it on first login.</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-bold text-foreground">Portal Gating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 text-[10px]">🛡️</div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  <strong className="text-foreground block mb-0.5">Multitenancy</strong>
                  Users are locked to <span className="font-bold text-foreground">{school?.name}</span> and cannot see data from other schools.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 text-green-700 flex items-center justify-center shrink-0 text-[10px]">🔒</div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  <strong className="text-foreground block mb-0.5">Role Isolation</strong>
                  Teachers only see assigned classes. Parents only see linked students.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
