"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';

export default function AdminOverview() {
  const [metrics, setMetrics] = useState({
    schools: 0,
    active: 0,
    students: 0,
    revenue: 0,
  });

  const [recentSchools, setRecentSchools] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json() as any;
        if (statsData?.stats) {
          setMetrics({
            schools: statsData.stats.schoolsTotal,
            active: statsData.stats.schoolsActive,
            students: statsData.stats.studentsTotal,
            revenue: statsData.stats.revenue,
          });
        }

        const schoolsRes = await fetch('/api/admin/schools');
        const schoolsData = await schoolsRes.json() as any;
        if (schoolsData?.schools) {
          setRecentSchools(schoolsData.schools.slice(0, 10));
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-[1.5rem] font-black text-foreground leading-[1.15]">Overview</h1>
          <p className="font-sans text-[0.77rem] font-normal text-muted-foreground mt-[3px]">Platform metrics and health</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} leftIcon="🔄">
            Refresh
          </Button>
          <Link href="/admin/schools" className="no-underline">
            <Button variant="primary" size="sm" rightIcon="→">
              View All Schools
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="metric" hoverLift>
          <div className="text-[0.69rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Total Schools</div>
          <div className="font-display text-[2rem] font-black text-primary mt-1 leading-none">{metrics.schools}</div>
          <div className="text-[0.73rem] text-muted-foreground mt-[3px]">registered accounts</div>
        </Card>
        <Card variant="metric" hoverLift>
          <div className="text-[0.69rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Active Schools</div>
          <div className="font-display text-[2rem] font-black text-primary mt-1 leading-none">{metrics.active}</div>
          <div className="text-[0.73rem] text-muted-foreground mt-[3px]">with students entered</div>
        </Card>
        <Card variant="metric" hoverLift>
          <div className="text-[0.69rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Total Students</div>
          <div className="font-display text-[2rem] font-black text-primary mt-1 leading-none">{metrics.students.toLocaleString()}</div>
          <div className="text-[0.73rem] text-muted-foreground mt-[3px]">across all schools</div>
        </Card>
        <Card variant="metric" hoverLift>
          <div className="text-[0.69rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Revenue (Est.)</div>
          <div className="font-display text-[2rem] font-black text-primary mt-1 leading-none">₦{metrics.revenue.toLocaleString()}</div>
          <div className="text-[0.73rem] text-muted-foreground mt-[3px]">lifetime licenses</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.4rem]">
        <Card className="!p-0 border border-border">
          <div className="font-bold text-[1.1rem] px-6 py-4 border-b border-border">📊 Plan Distribution</div>
          <div className="text-muted-foreground text-[0.85rem] p-8 text-center">
            Chart Data Loading...
          </div>
        </Card>
        <Card className="!p-0 border border-border">
          <div className="font-bold text-[1.1rem] px-6 py-4 border-b border-border">🕐 Recent Registrations</div>
          <div className="text-muted-foreground text-[0.85rem] p-8 text-center">
            Chart Data Loading...
          </div>
        </Card>
      </div>

      <Card className="!p-0 border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-background">
          <strong className="text-[0.88rem] text-foreground">Recent Schools</strong>
          <Link href="/admin/schools" className="no-underline">
            <Button variant="ghost" size="xs">View All</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">#</th>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">School Name</th>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">Email</th>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">Plan</th>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">Students</th>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">Status</th>
                <th className="text-left p-3 bg-surface-container-low text-[0.7rem] font-extrabold uppercase text-muted-foreground border-b border-border">Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentSchools.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading schools...</td></tr>
              )}
              {recentSchools.map((s, i) => (
                <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                  <td className="p-3 border-b border-border text-[0.88rem] text-foreground">{i + 1}</td>
                  <td className="p-3 border-b border-border text-[0.88rem] text-foreground"><strong>{s.name}</strong></td>
                  <td className="p-3 border-b border-border text-[0.88rem] text-foreground">{s.email}</td>
                  <td className="p-3 border-b border-border text-[0.88rem]">
                    <Badge variant={s.plan === 'pro' ? 'submitted' : 'gray'}>{s.plan.toUpperCase()}</Badge>
                  </td>
                  <td className="p-3 border-b border-border text-[0.88rem] text-foreground">{s.students}</td>
                  <td className="p-3 border-b border-border text-[0.88rem]">
                    <Badge variant={s.status === 'active' ? 'submitted' : 'red'}>{s.status.toUpperCase()}</Badge>
                  </td>
                  <td className="p-3 border-b border-border text-[0.88rem] text-foreground">{s.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

