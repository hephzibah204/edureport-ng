"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SchoolState {
  school: any;
  students: any[];
  teachers: any[];
  scores: Record<string, any>;
  loading: boolean;
  refreshSchool: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  refreshTeachers: () => Promise<void>;
  refreshScores: () => Promise<void>;
  syncAll: () => Promise<void>;
  planLimits: {
    maxStudents: number;
    isOverLimit: boolean;
  };
}

const SchoolContext = createContext<SchoolState | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = "/api";

  const refreshSchool = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/school`, { credentials: 'include' });
      const data = await res.json() as any;
      if (data.school) {
        setSchool(data.school);
      }
    } catch (err) {
      console.error('Failed to refresh school:', err);
    }
  }, []);

  const refreshStudents = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/students`, { credentials: 'include' });
      const data = await res.json() as any;
      if (Array.isArray(data.students)) setStudents(data.students);
    } catch (err) {
      console.error('Failed to refresh students:', err);
    }
  }, []);

  const refreshTeachers = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/teachers`, { credentials: 'include' });
      const data = await res.json() as any;
      if (Array.isArray(data.teachers)) setTeachers(data.teachers);
    } catch (err) {
      console.error('Failed to refresh teachers:', err);
    }
  }, []);

  const refreshScores = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/scores`, { credentials: 'include' });
      const data = await res.json() as any;
      if (data.scores) setScores(data.scores);
    } catch (err) {
      console.error('Failed to refresh scores:', err);
    }
  }, []);

  const syncAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshSchool(), refreshStudents(), refreshTeachers(), refreshScores()]);
    setLoading(false);
  }, [refreshSchool, refreshStudents, refreshTeachers, refreshScores]);

  const planLimits = {
    maxStudents: school?.plan === 'TRIAL' ? 50 : school?.plan === 'STARTER' ? 250 : Infinity,
    isOverLimit: school?.plan === 'TRIAL' && students.length >= 50,
  };

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  return (
    <SchoolContext.Provider value={{ 
      school, students, teachers, scores, loading, 
      refreshSchool, refreshStudents, refreshTeachers, refreshScores, syncAll,
      planLimits
    }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
