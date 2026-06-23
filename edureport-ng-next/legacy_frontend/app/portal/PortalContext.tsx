"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  cls: string;
  admNo?: string;
}

interface PortalState {
  user: any;
  school: any;
  students: Student[];
  studentId: string;
  setStudentId: (id: string) => void;
  refreshMe: () => Promise<void>;
}

const PortalContext = createContext<PortalState | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string>('');

  const refreshMe = async () => {
    try {
      const apiBaseUrl = "/api";
      const res = await fetch(`${apiBaseUrl}/portal/api/me`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch user data');
      const out = await res.json() as any;
      
      setUser(out.user);
      setSchool(out.school);
      setStudents(out.students || []);
      if (!studentId && out.students?.length) {
        setStudentId(out.students[0].id);
      }
    } catch (err) {
      console.error('PortalProvider init failed:', err);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  return (
    <PortalContext.Provider value={{ user, school, students, studentId, setStudentId, refreshMe }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
