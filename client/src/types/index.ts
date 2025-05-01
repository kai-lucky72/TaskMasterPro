export type UserRole = 
  | 'admin'
  | 'manager'
  | 'sales_staff'
  | 'individual_agent'
  | 'team_leader'
  | 'sales_agent';

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: number;
  workId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  managerId?: number | null;
  salesStaffId?: number | null;
}

export interface AuthUser extends User {
  // Additional properties that might be included in auth context
}

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
