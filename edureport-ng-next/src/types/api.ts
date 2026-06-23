export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: 'ADMIN' | 'SCHOOL' | 'TEACHER' | 'PARENT' | 'STAFF';
  status: 'ACTIVE' | 'SUSPENDED';
  phone: string | null;
  schoolId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface School {
  id: string;
  ownerId: string;
  name: string;
  abbr: string;
  address: string | null;
  contact: string | null;
  motto: string | null;
  principal: string | null;
  session: string | null;
  term: string | null;
  schoolLevel: string;
  classTemplates: any; // JSON array of class names
  classArms: any; // JSON array of class arms
  nextTerm: string | null;
  ca1Max: number;
  ca2Max: number;
  examMax: number;
  subjects: any; // JSON array of subjects
  grades: any; // JSON array of grade objects
  plan: string;
  subdomain: string | null;
  logoUrl: string | null;
  reportColor: string;
  reportTemplate: string;
  currency: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  admissionNo: string;
  gender: string | null;
  className: string | null;
  dob: string | null;
  house: string | null;
  parent: string | null;
  photoUrl: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  profileExtra: any;
  createdAt: string;
  updatedAt: string | null;
}

export interface Teacher {
  id: string;
  displayName: string;
  email: string;
  status: string;
  classes: string[];
}

export interface TeacherProfile {
  id: string;
  userId: string;
  schoolId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Exam {
  id: string;
  schoolId: string;
  subject: string;
  classLevel: string;
  topic: string | null;
  questions: any; // JSON
  term: string | null;
  session: string | null;
  examType: string | null;
  questionType: string | null;
  duration: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SchoolResponse {
  school: School;
}

export interface StudentsResponse {
  students: Student[];
}

export interface TeachersResponse {
  teachers: Teacher[];
}

export interface TeacherStats {
  stats: {
    label: string;
    val: string | number;
    trend: string;
    up?: boolean;
    neutral?: boolean;
    info?: boolean;
  }[];
}

export interface TeacherStatsResponse {
  stats: TeacherStats['stats'];
  topAchievers?: {
    name: string;
    score: number;
    trend: string;
    pos: number;
  }[];
}
