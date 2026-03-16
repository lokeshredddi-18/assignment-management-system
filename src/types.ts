export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'MENTOR';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  department?: string;
  grade?: string;
  rollNumber?: string;
  parentsNumber?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: string;
  deadline: string;
  total_marks: number;
  teacher_id: number;
  created_at: string;
  // Extended fields for student view
  marks?: number;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  submission_id?: number;
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  file_path: string;
  file_name: string;
  submitted_at: string;
  marks: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}
