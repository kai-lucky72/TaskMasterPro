import { pgTable, text, serial, integer, timestamp, boolean, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'sales_staff', 'individual_agent', 'team_leader', 'sales_agent']);
export const userStatusEnum = pgEnum('user_status', ['active', 'disabled']);
export const sectorEnum = pgEnum('sector', ['health', 'admin_staff', 'private_sectors', 'other']);
export const insuranceTypeEnum = pgEnum('insurance_type', [
  'education', 'intego', 'family_insurance', 'epi', 'nkunganire_shoferi', 
  'umurage_amashuri', 'ikimina', 'others'
]);
export const paymentMethodEnum = pgEnum('payment_method', ['salary_deduction', 'bank', 'momo']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  workId: text('work_id').notNull().unique(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  nationalId: text('national_id').notNull(),
  phoneNumber: text('phone_number').notNull(),
  role: userRoleEnum('role').notNull(),
  status: userStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  createdById: integer('created_by_id').references(() => users.id),
  managerId: integer('manager_id').references(() => users.id),
  salesStaffId: integer('sales_staff_id').references(() => users.id),
});

// Agent groups table
export const agentGroups = pgTable('agent_groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  teamLeaderId: integer('team_leader_id').references(() => users.id),
});

// Group members table (joins agent groups and users)
export const groupMembers = pgTable('group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => agentGroups.id),
  userId: integer('user_id').notNull().references(() => users.id),
});

// Attendance timeframes
export const attendanceTimeframes = pgTable('attendance_timeframes', {
  id: serial('id').primaryKey(),
  salesStaffId: integer('sales_staff_id').notNull().references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Attendance records
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  date: timestamp('date').defaultNow(),
  sector: sectorEnum('sector'),
  location: text('location'),
  isPresent: boolean('is_present').default(false),
  isExcused: boolean('is_excused').default(false),
  excusedById: integer('excused_by_id').references(() => users.id),
  excuseReason: text('excuse_reason'),
});

// Clients
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nationalId: text('national_id').notNull(),
  phoneNumber: text('phone_number').notNull(),
  email: text('email'),
  insuranceType: insuranceTypeEnum('insurance_type').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  amount: real('amount').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  agentId: integer('agent_id').notNull().references(() => users.id),
});

// Reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  teamLeaderId: integer('team_leader_id').references(() => users.id),
  salesStaffId: integer('sales_staff_id').references(() => users.id),
  managerId: integer('manager_id').references(() => users.id),
  submissionDate: timestamp('submission_date').defaultNow(),
  status: text('status').notNull().default('pending'),
});

// Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  isRead: boolean('is_read').default(false),
});

// Login help requests
export const loginHelpRequests = pgTable('login_help_requests', {
  id: serial('id').primaryKey(),
  workId: text('work_id').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedById: integer('resolved_by_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
});

// Activity logs
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const insertAgentGroupSchema = createInsertSchema(agentGroups)
  .omit({ id: true, createdAt: true });

export const insertGroupMemberSchema = createInsertSchema(groupMembers)
  .omit({ id: true });

export const insertAttendanceTimeframeSchema = createInsertSchema(attendanceTimeframes)
  .omit({ id: true, createdAt: true });

export const insertAttendanceSchema = createInsertSchema(attendance)
  .omit({ id: true });

export const insertClientSchema = createInsertSchema(clients)
  .omit({ id: true, createdAt: true });

export const insertReportSchema = createInsertSchema(reports)
  .omit({ id: true, submissionDate: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, createdAt: true, isRead: true });

export const insertLoginHelpRequestSchema = createInsertSchema(loginHelpRequests)
  .omit({ id: true, createdAt: true, status: true, resolvedById: true, resolvedAt: true });

export const insertActivityLogSchema = createInsertSchema(activityLogs)
  .omit({ id: true, createdAt: true });

// Auth schema
export const loginSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
});

export const helpRequestSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  message: z.string().min(1, "Message is required"),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AgentGroup = typeof agentGroups.$inferSelect;
export type InsertAgentGroup = z.infer<typeof insertAgentGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type AttendanceTimeframe = typeof attendanceTimeframes.$inferSelect;
export type InsertAttendanceTimeframe = z.infer<typeof insertAttendanceTimeframeSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type LoginHelpRequest = typeof loginHelpRequests.$inferSelect;
export type InsertLoginHelpRequest = z.infer<typeof insertLoginHelpRequestSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type Login = z.infer<typeof loginSchema>;
export type HelpRequest = z.infer<typeof helpRequestSchema>;
