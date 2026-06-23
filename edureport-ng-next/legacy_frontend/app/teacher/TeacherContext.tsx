"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TeacherContextState {
  user: any;
  school: any;
  classes: string[];
  refreshMe: () => Promise<void>;
  refreshClasses: () => Promise<void>;
}

const TeacherContext = createContext<TeacherContextState | undefined>(undefined);

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [classes, setClasses] = useState<string[]>([]);

  const apiBaseUrl = "/api"; // Shared prefix for CF Functions

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/me`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json() as any;
      setUser(data.user);
      setSchool(data.school);
    } catch (err) {
      console.error('TeacherContext me failed:', err);
    }
  }, []);

  const refreshClasses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/teacher/api/classes`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json() as any;
      if (Array.isArray(data?.classes)) {
        setClasses(data.classes.map((c: any) => c.name));
      }
    } catch (err) {
      console.error('TeacherContext classes failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshMe();
    refreshClasses();
  }, [refreshMe, refreshClasses]);

  return (
    <TeacherContext.Provider value={{ user, school, classes, refreshMe, refreshClasses }}>
      {children}
    </TeacherContext.Provider>
  );
}

export function useTeacher() {
  const context = useContext(TeacherContext);
  if (context === undefined) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
}
