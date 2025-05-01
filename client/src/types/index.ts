export type UserRole = 'admin' | 'manager' | 'sales_staff' | 'team_leader' | 'individual_agent' | 'sales_agent';

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  email: string;
  workId: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  createdById: number | null;
  managerId: number | null;
  salesStaffId: number | null;
}

export interface Team {
  id: number;
  name: string;
  createdAt: Date;
  salesStaffId: number;
  teamLeaderId: number | null;
}

export type AttendanceSector = 'health' | 'admin_staff' | 'private_sectors' | 'other';

export interface Attendance {
  id: number;
  userId: number;
  date: Date;
  sector: AttendanceSector | null;
  location: string | null;
  isPresent: boolean | null;
  isExcused: boolean | null;
  excusedById: number | null;
  excuseReason: string | null;
}

export type InsuranceType = 
  | 'education'
  | 'intego'
  | 'family_insurance'
  | 'epi'
  | 'nkunganire_shoferi'
  | 'umurage_amashuri'
  | 'ikimina'
  | 'others';

export type PaymentMethod = 'salary_deduction' | 'momo';

export interface Client {
  id: number;
  name: string;
  email: string | null;
  nationalId: string;
  phoneNumber: string;
  createdAt: Date;
  insuranceType: InsuranceType;
  paymentMethod: PaymentMethod;
  amount: number;
  agentId: number;
  notes: string | null;
}

export interface HelpRequest {
  id: number;
  userId: number;
  title: string;
  content: string;
  submissionDate: Date;
  status: string;
  managerId: number | null;
  salesStaffId: number | null;
  teamLeaderId: number | null;
}

export interface Activity {
  id: number;
  userId: number | null;
  action: string;
  details: string | null;
  createdAt: Date;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface PerformanceMetric {
  id: number;
  userId: number;
  metricType: string;
  value: number;
  date: Date;
  notes: string | null;
}
