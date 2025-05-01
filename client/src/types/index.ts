// User types
export type UserRole = 'admin' | 'manager' | 'sales_staff' | 'individual_agent' | 'team_leader' | 'sales_agent';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  workId: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  createdById?: number;
  managerId?: number;
  salesStaffId?: number;
}

export interface AuthUser {
  id: number;
  workId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}

// Group types
export interface AgentGroup {
  id: number;
  name: string;
  createdAt: string;
  salesStaffId: number;
  teamLeaderId?: number;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  user?: User;
}

// Attendance types
export interface AttendanceTimeframe {
  id: number;
  salesStaffId: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export type Sector = 'health' | 'admin_staff' | 'private_sectors' | 'other';

export interface Attendance {
  id: number;
  userId: number;
  date: string;
  sector?: Sector;
  location?: string;
  isPresent: boolean;
  isExcused: boolean;
  excusedById?: number;
  excuseReason?: string;
}

// Client types
export type InsuranceType = 'education' | 'intego' | 'family_insurance' | 'epi' | 
                           'nkunganire_shoferi' | 'umurage_amashuri' | 'ikimina' | 'others';
export type PaymentMethod = 'salary_deduction' | 'bank' | 'momo';

export interface Client {
  id: number;
  name: string;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  insuranceType: InsuranceType;
  paymentMethod: PaymentMethod;
  amount: number;
  createdAt: string;
  agentId: number;
}

// Report types
export interface Report {
  id: number;
  title: string;
  content: string;
  userId: number;
  teamLeaderId?: number;
  salesStaffId?: number;
  managerId?: number;
  submissionDate: string;
  status: string;
}

// Message types
export interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  isRead: boolean;
  sender?: User;
  receiver?: User;
}

// Help Request types
export interface HelpRequest {
  id: number;
  workId: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
  resolvedById?: number;
  resolvedAt?: string;
}

// Activity Log types
export interface ActivityLog {
  id: number;
  userId?: number;
  action: string;
  details?: string;
  createdAt: string;
  user?: Partial<User>;
}

// Form types
export interface UserFormData {
  workId: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
  role: UserRole;
}

export interface ClientFormData {
  name: string;
  nationalId: string;
  phoneNumber: string;
  email?: string;
  insuranceType: InsuranceType;
  paymentMethod: PaymentMethod;
  amount: number;
}

export interface AttendanceFormData {
  sector?: Sector;
  location?: string;
}

export interface ReportFormData {
  title: string;
  content: string;
  teamLeaderId?: number;
}

export interface MessageFormData {
  receiverId: number;
  content: string;
}

// Stats and dashboard data
export interface StatsData {
  icon: string;
  title: string;
  value: number | string;
  change?: number;
  changeText?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'red';
}

// Theme colors
export interface ThemeColors {
  primary: string;
  secondary: string;
  gradient: string;
  background: string;
}

export const roleColors: Record<UserRole, ThemeColors> = {
  admin: {
    primary: '#2563eb',
    secondary: '#1e40af',
    gradient: 'linear-gradient(to right, #2563eb, #1e40af)',
    background: 'bg-blue-50'
  },
  manager: {
    primary: '#9333ea',
    secondary: '#6b21a8',
    gradient: 'linear-gradient(to right, #9333ea, #6b21a8)',
    background: 'bg-purple-50'
  },
  sales_staff: {
    primary: '#16a34a',
    secondary: '#166534',
    gradient: 'linear-gradient(to right, #16a34a, #166534)',
    background: 'bg-green-50'
  },
  individual_agent: {
    primary: '#ea580c',
    secondary: '#9a3412',
    gradient: 'linear-gradient(to right, #ea580c, #9a3412)',
    background: 'bg-orange-50'
  },
  team_leader: {
    primary: '#d97706',
    secondary: '#92400e',
    gradient: 'linear-gradient(to right, #d97706, #92400e)',
    background: 'bg-amber-50'
  },
  sales_agent: {
    primary: '#ea580c',
    secondary: '#9a3412',
    gradient: 'linear-gradient(to right, #ea580c, #9a3412)',
    background: 'bg-orange-50'
  }
};
