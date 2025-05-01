/**
 * Type definitions for the application
 */

/**
 * User roles in the organization
 */
export type UserRole =
  | 'admin'
  | 'manager'
  | 'sales_staff'
  | 'team_leader'
  | 'individual_agent'
  | 'sales_agent';

/**
 * User status options
 */
export type UserStatus = 'active' | 'disabled';

/**
 * User information
 */
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

/**
 * Agent group information
 */
export interface AgentGroup {
  id: number;
  name: string;
  salesStaffId: number;
  teamLeaderId: number | null;
  createdAt: Date;
}

/**
 * Group member information
 */
export interface GroupMember {
  id: number;
  groupId: number;
  agentId: number;
  createdAt: Date;
}

/**
 * Attendance timeframe for scheduling
 */
export interface AttendanceTimeframe {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: Date;
  createdById: number;
  isActive: boolean;
}

/**
 * Attendance record for tracking user presence
 */
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

/**
 * Client information
 */
export interface Client {
  id: number;
  name: string;
  email: string | null;
  nationalId: string;
  phoneNumber: string;
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
  createdAt: Date;
  status: 'pending' | 'active' | 'rejected' | 'canceled';
}

/**
 * Report information
 */
export interface Report {
  id: number;
  title: string;
  content: string;
  submissionDate: Date;
  userId: number;
  managerId: number | null;
  salesStaffId: number | null;
  teamLeaderId: number | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

/**
 * Message information for internal communication
 */
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date;
  isRead: boolean;
  readAt: Date | null;
}

/**
 * Help request for login issues
 */
export interface HelpRequest {
  id: number;
  workId: string;
  email: string;
  message: string;
  createdAt: Date;
  resolvedById: number | null;
  resolvedAt: Date | null;
}

/**
 * Activity log for auditing
 */
export interface ActivityLog {
  id: number;
  userId: number | null;
  user?: User;
  action: string;
  details: string | null;
  createdAt: Date;
}

/**
 * Stats display data for dashboard cards
 */
export interface StatsData {
  title: string;
  value: number | string;
  icon: React.ReactNode | string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'red';
  change?: number;
  changeText?: string;
}
