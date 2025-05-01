export type UserRole = 
  | 'admin' 
  | 'manager' 
  | 'sales_staff' 
  | 'team_leader' 
  | 'individual_agent' 
  | 'sales_agent';

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  workId: string;
  email: string;
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

export interface Client {
  id: number;
  name: string;
  email: string | null;
  nationalId: string;
  phoneNumber: string;
  createdAt: Date;
  insuranceType: 
    | 'education' 
    | 'intego' 
    | 'family_insurance' 
    | 'epi' 
    | 'nkunganire_shoferi' 
    | 'umurage_amashuri' 
    | 'ikimina' 
    | 'others';
  paymentMethod: 'salary_deduction' | 'momo';
  amount: number;
  agentId: number;
  notes: string | null;
}

export interface Attendance {
  id: number;
  userId: number;
  date: Date;
  sector: 'health' | 'admin_staff' | 'private_sectors' | 'other' | null;
  location: string | null;
  isPresent: boolean | null;
  isExcused: boolean | null;
  excusedById: number | null;
  excuseReason: string | null;
}

export interface HelpRequest {
  id: number;
  userId: number;
  submissionDate: Date;
  title: string;
  content: string;
  status: string;
  managerId: number | null;
  salesStaffId: number | null;
  teamLeaderId: number | null;
}

export interface Report {
  id: number;
  userId: number;
  reportDate: Date;
  title: string;
  content: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: string | null;
}

export interface Activity {
  id: number;
  userId: number | null;
  createdAt: Date;
  action: string;
  details: string | null;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Performance {
  id: number;
  userId: number;
  period: string;
  targets: number;
  achieved: number;
  rating: number | null;
  comments: string | null;
  evaluatorId: number | null;
}
