import {
  users, agentGroups, groupMembers, attendanceTimeframes, attendance,
  clients, reports, messages, loginHelpRequests, activityLogs,
  type User, type InsertUser, type AgentGroup, type InsertAgentGroup,
  type GroupMember, type InsertGroupMember, type AttendanceTimeframe,
  type InsertAttendanceTimeframe, type Attendance, type InsertAttendance,
  type Client, type InsertClient, type Report, type InsertReport,
  type Message, type InsertMessage, type LoginHelpRequest,
  type InsertLoginHelpRequest, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByWorkId(workId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByManagerId(managerId: number): Promise<User[]>;
  getUsersBySalesStaffId(salesStaffId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  disableUser(id: number): Promise<User | undefined>;
  enableUser(id: number): Promise<User | undefined>;

  // Agent group operations
  getAgentGroupById(id: number): Promise<AgentGroup | undefined>;
  getAgentGroupsBySalesStaffId(salesStaffId: number): Promise<AgentGroup[]>;
  createAgentGroup(group: InsertAgentGroup): Promise<AgentGroup>;
  updateAgentGroup(id: number, group: Partial<InsertAgentGroup>): Promise<AgentGroup | undefined>;
  deleteAgentGroup(id: number): Promise<boolean>;

  // Group member operations
  addMemberToGroup(member: InsertGroupMember): Promise<GroupMember>;
  removeMemberFromGroup(groupId: number, userId: number): Promise<boolean>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  getUserGroups(userId: number): Promise<GroupMember[]>;

  // Attendance timeframe operations
  createAttendanceTimeframe(timeframe: InsertAttendanceTimeframe): Promise<AttendanceTimeframe>;
  getAttendanceTimeframesBySalesStaffId(salesStaffId: number): Promise<AttendanceTimeframe[]>;
  updateAttendanceTimeframe(id: number, timeframe: Partial<InsertAttendanceTimeframe>): Promise<AttendanceTimeframe | undefined>;
  deleteAttendanceTimeframe(id: number): Promise<boolean>;

  // Attendance operations
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getUserAttendance(userId: number): Promise<Attendance[]>;
  getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined>;
  excuseAbsence(id: number, excusedById: number, reason: string): Promise<Attendance | undefined>;
  getAttendanceBySalesStaffId(salesStaffId: number): Promise<Attendance[]>;

  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getClientsByAgentId(agentId: number): Promise<Client[]>;
  getClientsByTeamLeaderId(teamLeaderId: number): Promise<Client[]>;
  getClientsBySalesStaffId(salesStaffId: number): Promise<Client[]>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: number): Promise<Report[]>;
  getReportsByTeamLeaderId(teamLeaderId: number): Promise<Report[]>;
  getReportsBySalesStaffId(salesStaffId: number): Promise<Report[]>;
  getReportsByManagerId(managerId: number): Promise<Report[]>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;

  // Message operations
  sendMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySenderId(senderId: number): Promise<Message[]>;
  getMessagesByReceiverId(receiverId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Login help request operations
  createLoginHelpRequest(request: InsertLoginHelpRequest): Promise<LoginHelpRequest>;
  getLoginHelpRequests(): Promise<LoginHelpRequest[]>;
  resolveLoginHelpRequest(id: number, resolvedById: number): Promise<LoginHelpRequest | undefined>;
  deleteLoginHelpRequest(id: number): Promise<boolean>;

  // Activity log operations
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByUserId(userId: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agentGroups: Map<number, AgentGroup>;
  private groupMembers: Map<number, GroupMember>;
  private attendanceTimeframes: Map<number, AttendanceTimeframe>;
  private attendanceRecords: Map<number, Attendance>;
  private clients: Map<number, Client>;
  private reports: Map<number, Report>;
  private messages: Map<number, Message>;
  private loginHelpRequests: Map<number, LoginHelpRequest>;
  private activityLogs: Map<number, ActivityLog>;

  private currentUserId: number;
  private currentAgentGroupId: number;
  private currentGroupMemberId: number;
  private currentAttendanceTimeframeId: number;
  private currentAttendanceId: number;
  private currentClientId: number;
  private currentReportId: number;
  private currentMessageId: number;
  private currentLoginHelpRequestId: number;
  private currentActivityLogId: number;

  constructor() {
    this.users = new Map();
    this.agentGroups = new Map();
    this.groupMembers = new Map();
    this.attendanceTimeframes = new Map();
    this.attendanceRecords = new Map();
    this.clients = new Map();
    this.reports = new Map();
    this.messages = new Map();
    this.loginHelpRequests = new Map();
    this.activityLogs = new Map();

    this.currentUserId = 1;
    this.currentAgentGroupId = 1;
    this.currentGroupMemberId = 1;
    this.currentAttendanceTimeframeId = 1;
    this.currentAttendanceId = 1;
    this.currentClientId = 1;
    this.currentReportId = 1;
    this.currentMessageId = 1;
    this.currentLoginHelpRequestId = 1;
    this.currentActivityLogId = 1;
    
    // Create initial users
    this.createInitialUsers();
  }

  // User operations
  // Create initial users for testing
  private createInitialUsers() {
    // Create an admin user
    this.users.set(1, {
      id: 1,
      workId: 'ADMIN-001',
      email: 'admin@example.com',
      firstName: 'System',
      lastName: 'Admin',
      nationalId: 'ADM12345678',
      phoneNumber: '+250781234567',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      createdById: null,
      managerId: null,
      salesStaffId: null
    });
    this.currentUserId = 2;

    // Create a manager
    this.users.set(2, {
      id: 2,
      workId: 'MGR-001',
      email: 'manager@example.com',
      firstName: 'John',
      lastName: 'Manager',
      nationalId: 'MGR12345678',
      phoneNumber: '+250782345678',
      role: 'manager',
      status: 'active',
      createdAt: new Date(),
      createdById: 1,
      managerId: null,
      salesStaffId: null
    });
    this.currentUserId = 3;

    // Create a sales staff
    this.users.set(3, {
      id: 3,
      workId: 'STAFF-001',
      email: 'sales@example.com',
      firstName: 'Sarah',
      lastName: 'Sales',
      nationalId: 'SLS12345678',
      phoneNumber: '+250783456789',
      role: 'sales_staff',
      status: 'active',
      createdAt: new Date(),
      createdById: 2,
      managerId: 2,
      salesStaffId: null
    });
    this.currentUserId = 4;

    // Create a team leader
    this.users.set(4, {
      id: 4,
      workId: 'LEAD-001',
      email: 'leader@example.com',
      firstName: 'Tom',
      lastName: 'Leader',
      nationalId: 'LDR12345678',
      phoneNumber: '+250784567890',
      role: 'team_leader',
      status: 'active',
      createdAt: new Date(),
      createdById: 3,
      managerId: null,
      salesStaffId: 3
    });
    this.currentUserId = 5;

    // Create sales agents
    this.users.set(5, {
      id: 5,
      workId: 'AGENT-001',
      email: 'agent1@example.com',
      firstName: 'Alan',
      lastName: 'Agent',
      nationalId: 'AGT12345678',
      phoneNumber: '+250785678901',
      role: 'sales_agent',
      status: 'active',
      createdAt: new Date(),
      createdById: 4,
      managerId: null,
      salesStaffId: 3
    });
    this.currentUserId = 6;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByWorkId(workId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.workId === workId
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }

  async getUsersByManagerId(managerId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.managerId === managerId
    );
  }

  async getUsersBySalesStaffId(salesStaffId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.salesStaffId === salesStaffId
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async disableUser(id: number): Promise<User | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    const updatedUser = { ...user, status: 'disabled' as const };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async enableUser(id: number): Promise<User | undefined> {
    const user = await this.getUserById(id);
    if (!user) return undefined;

    const updatedUser = { ...user, status: 'active' as const };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Agent group operations
  async getAgentGroupById(id: number): Promise<AgentGroup | undefined> {
    return this.agentGroups.get(id);
  }

  async getAgentGroupsBySalesStaffId(salesStaffId: number): Promise<AgentGroup[]> {
    return Array.from(this.agentGroups.values()).filter(
      (group) => group.salesStaffId === salesStaffId
    );
  }

  async createAgentGroup(groupData: InsertAgentGroup): Promise<AgentGroup> {
    const id = this.currentAgentGroupId++;
    const group: AgentGroup = { ...groupData, id, createdAt: new Date() };
    this.agentGroups.set(id, group);
    return group;
  }

  async updateAgentGroup(id: number, groupData: Partial<InsertAgentGroup>): Promise<AgentGroup | undefined> {
    const group = await this.getAgentGroupById(id);
    if (!group) return undefined;

    const updatedGroup = { ...group, ...groupData };
    this.agentGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteAgentGroup(id: number): Promise<boolean> {
    return this.agentGroups.delete(id);
  }

  // Group member operations
  async addMemberToGroup(memberData: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const member: GroupMember = { ...memberData, id };
    this.groupMembers.set(id, member);
    return member;
  }

  async removeMemberFromGroup(groupId: number, userId: number): Promise<boolean> {
    const memberToRemove = Array.from(this.groupMembers.values()).find(
      (member) => member.groupId === groupId && member.userId === userId
    );
    if (!memberToRemove) return false;
    return this.groupMembers.delete(memberToRemove.id);
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(
      (member) => member.groupId === groupId
    );
  }

  async getUserGroups(userId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(
      (member) => member.userId === userId
    );
  }

  // Attendance timeframe operations
  async createAttendanceTimeframe(timeframeData: InsertAttendanceTimeframe): Promise<AttendanceTimeframe> {
    const id = this.currentAttendanceTimeframeId++;
    const timeframe: AttendanceTimeframe = { ...timeframeData, id, createdAt: new Date() };
    this.attendanceTimeframes.set(id, timeframe);
    return timeframe;
  }

  async getAttendanceTimeframesBySalesStaffId(salesStaffId: number): Promise<AttendanceTimeframe[]> {
    return Array.from(this.attendanceTimeframes.values()).filter(
      (timeframe) => timeframe.salesStaffId === salesStaffId
    );
  }

  async updateAttendanceTimeframe(id: number, timeframeData: Partial<InsertAttendanceTimeframe>): Promise<AttendanceTimeframe | undefined> {
    const timeframe = this.attendanceTimeframes.get(id);
    if (!timeframe) return undefined;

    const updatedTimeframe = { ...timeframe, ...timeframeData };
    this.attendanceTimeframes.set(id, updatedTimeframe);
    return updatedTimeframe;
  }

  async deleteAttendanceTimeframe(id: number): Promise<boolean> {
    return this.attendanceTimeframes.delete(id);
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const attendanceRecord: Attendance = { ...attendanceData, id };
    this.attendanceRecords.set(id, attendanceRecord);
    return attendanceRecord;
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => record.userId === userId
    );
  }

  async getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return Array.from(this.attendanceRecords.values()).find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return record.userId === userId && recordDate.getTime() === targetDate.getTime();
    });
  }

  async excuseAbsence(id: number, excusedById: number, reason: string): Promise<Attendance | undefined> {
    const attendance = this.attendanceRecords.get(id);
    if (!attendance) return undefined;

    const updatedAttendance = { 
      ...attendance, 
      isExcused: true, 
      excusedById, 
      excuseReason: reason 
    };
    this.attendanceRecords.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async getAttendanceBySalesStaffId(salesStaffId: number): Promise<Attendance[]> {
    const agents = await this.getUsersBySalesStaffId(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => agentIds.includes(record.userId)
    );
  }

  // Client operations
  async createClient(clientData: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = { ...clientData, id, createdAt: new Date() };
    this.clients.set(id, client);
    return client;
  }

  async getClientsByAgentId(agentId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.agentId === agentId
    );
  }

  async getClientsByTeamLeaderId(teamLeaderId: number): Promise<Client[]> {
    // Get all agent groups where this user is a team leader
    const agentGroups = Array.from(this.agentGroups.values()).filter(
      (group) => group.teamLeaderId === teamLeaderId
    );
    
    // Get all group members in these groups
    const groupIds = agentGroups.map(group => group.id);
    const groupMembersArray = Array.from(this.groupMembers.values()).filter(
      (member) => groupIds.includes(member.groupId)
    );
    
    // Get all agent IDs
    const agentIds = groupMembersArray.map(member => member.userId);
    
    // Get all clients for these agents
    return Array.from(this.clients.values()).filter(
      (client) => agentIds.includes(client.agentId)
    );
  }

  async getClientsBySalesStaffId(salesStaffId: number): Promise<Client[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaffId(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    // Get all clients for these agents
    return Array.from(this.clients.values()).filter(
      (client) => agentIds.includes(client.agentId)
    );
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = { ...reportData, id, submissionDate: new Date() };
    this.reports.set(id, report);
    return report;
  }

  async getReportsByUserId(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.userId === userId
    );
  }

  async getReportsByTeamLeaderId(teamLeaderId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.teamLeaderId === teamLeaderId
    );
  }

  async getReportsBySalesStaffId(salesStaffId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.salesStaffId === salesStaffId
    );
  }

  async getReportsByManagerId(managerId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.managerId === managerId
    );
  }

  async updateReport(id: number, reportData: Partial<InsertReport>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport = { ...report, ...reportData };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  // Message operations
  async sendMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { ...messageData, id, createdAt: new Date(), isRead: false };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBySenderId(senderId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === senderId
    );
  }

  async getMessagesByReceiverId(receiverId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.receiverId === receiverId
    );
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Login help request operations
  async createLoginHelpRequest(requestData: InsertLoginHelpRequest): Promise<LoginHelpRequest> {
    const id = this.currentLoginHelpRequestId++;
    const request: LoginHelpRequest = { 
      ...requestData, 
      id, 
      status: 'pending', 
      createdAt: new Date(),
      resolvedById: null as any,
      resolvedAt: null as any
    };
    this.loginHelpRequests.set(id, request);
    return request;
  }

  async getLoginHelpRequests(): Promise<LoginHelpRequest[]> {
    return Array.from(this.loginHelpRequests.values());
  }

  async resolveLoginHelpRequest(id: number, resolvedById: number): Promise<LoginHelpRequest | undefined> {
    const request = this.loginHelpRequests.get(id);
    if (!request) return undefined;

    const updatedRequest = { 
      ...request, 
      status: 'resolved', 
      resolvedById, 
      resolvedAt: new Date() 
    };
    this.loginHelpRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteLoginHelpRequest(id: number): Promise<boolean> {
    return this.loginHelpRequests.delete(id);
  }

  // Activity log operations
  async logActivity(logData: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const log: ActivityLog = { ...logData, id, createdAt: new Date() };
    this.activityLogs.set(id, log);
    return log;
  }

  async getActivityLogsByUserId(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { eq, and, desc, asc, isNull, or, inArray } from 'drizzle-orm';
import { db, pool } from './db';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWorkId(workId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.workId, workId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getUsersByManagerId(managerId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.managerId, managerId));
  }

  async getUsersBySalesStaffId(salesStaffId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.salesStaffId, salesStaffId));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  async disableUser(id: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ status: 'disabled' })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async enableUser(id: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ status: 'active' })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Agent group operations
  async getAgentGroupById(id: number): Promise<AgentGroup | undefined> {
    const [group] = await db.select().from(agentGroups).where(eq(agentGroups.id, id));
    return group;
  }

  async getAgentGroupsBySalesStaffId(salesStaffId: number): Promise<AgentGroup[]> {
    return await db.select().from(agentGroups).where(eq(agentGroups.salesStaffId, salesStaffId));
  }

  async createAgentGroup(groupData: InsertAgentGroup): Promise<AgentGroup> {
    const [group] = await db.insert(agentGroups).values(groupData).returning();
    return group;
  }

  async updateAgentGroup(id: number, groupData: Partial<InsertAgentGroup>): Promise<AgentGroup | undefined> {
    const [updatedGroup] = await db
      .update(agentGroups)
      .set(groupData)
      .where(eq(agentGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteAgentGroup(id: number): Promise<boolean> {
    const result = await db.delete(agentGroups).where(eq(agentGroups.id, id));
    return result.count > 0;
  }

  // Group member operations
  async addMemberToGroup(memberData: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db.insert(groupMembers).values(memberData).returning();
    return member;
  }

  async removeMemberFromGroup(groupId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      );
    return result.count > 0;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async getUserGroups(userId: number): Promise<GroupMember[]> {
    return await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
  }

  // Attendance timeframe operations
  async createAttendanceTimeframe(timeframeData: InsertAttendanceTimeframe): Promise<AttendanceTimeframe> {
    const [timeframe] = await db.insert(attendanceTimeframes).values(timeframeData).returning();
    return timeframe;
  }

  async getAttendanceTimeframesBySalesStaffId(salesStaffId: number): Promise<AttendanceTimeframe[]> {
    return await db
      .select()
      .from(attendanceTimeframes)
      .where(eq(attendanceTimeframes.salesStaffId, salesStaffId));
  }

  async updateAttendanceTimeframe(id: number, timeframeData: Partial<InsertAttendanceTimeframe>): Promise<AttendanceTimeframe | undefined> {
    const [updatedTimeframe] = await db
      .update(attendanceTimeframes)
      .set(timeframeData)
      .where(eq(attendanceTimeframes.id, id))
      .returning();
    return updatedTimeframe;
  }

  async deleteAttendanceTimeframe(id: number): Promise<boolean> {
    const result = await db.delete(attendanceTimeframes).where(eq(attendanceTimeframes.id, id));
    return result.count > 0;
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(attendanceData).returning();
    return record;
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.userId, userId));
  }

  async getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const [record] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          eq(attendance.date, targetDate)
        )
      );
    return record;
  }

  async excuseAbsence(id: number, excusedById: number, reason: string): Promise<Attendance | undefined> {
    const [updatedRecord] = await db
      .update(attendance)
      .set({
        isExcused: true,
        excusedById,
        excuseReason: reason
      })
      .where(eq(attendance.id, id))
      .returning();
    return updatedRecord;
  }

  async getAttendanceBySalesStaffId(salesStaffId: number): Promise<Attendance[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaffId(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    if (agentIds.length === 0) return [];
    
    return await db
      .select()
      .from(attendance)
      .where(inArray(attendance.userId, agentIds));
  }

  // Client operations
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async getClientsByAgentId(agentId: number): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.agentId, agentId));
  }

  async getClientsByTeamLeaderId(teamLeaderId: number): Promise<Client[]> {
    // Get all agent groups where this user is a team leader
    const teamGroups = await db
      .select()
      .from(agentGroups)
      .where(eq(agentGroups.teamLeaderId, teamLeaderId));
    
    if (teamGroups.length === 0) return [];
    
    // Get all group members in these groups
    const groupIds = teamGroups.map(group => group.id);
    const members = await db
      .select()
      .from(groupMembers)
      .where(inArray(groupMembers.groupId, groupIds));
    
    if (members.length === 0) return [];
    
    // Get all agent IDs
    const agentIds = members.map(member => member.userId);
    
    // Get all clients for these agents
    return await db
      .select()
      .from(clients)
      .where(inArray(clients.agentId, agentIds));
  }

  async getClientsBySalesStaffId(salesStaffId: number): Promise<Client[]> {
    // Get all agents under this sales staff
    const agents = await this.getUsersBySalesStaffId(salesStaffId);
    const agentIds = agents.map(agent => agent.id);
    
    if (agentIds.length === 0) return [];
    
    // Get all clients for these agents
    return await db
      .select()
      .from(clients)
      .where(inArray(clients.agentId, agentIds));
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.count > 0;
  }

  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(reportData).returning();
    return report;
  }

  async getReportsByUserId(userId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.userId, userId));
  }

  async getReportsByTeamLeaderId(teamLeaderId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.teamLeaderId, teamLeaderId));
  }

  async getReportsBySalesStaffId(salesStaffId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.salesStaffId, salesStaffId));
  }

  async getReportsByManagerId(managerId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.managerId, managerId));
  }

  async updateReport(id: number, reportData: Partial<InsertReport>): Promise<Report | undefined> {
    const [updatedReport] = await db
      .update(reports)
      .set(reportData)
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.count > 0;
  }

  // Message operations
  async sendMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getMessagesBySenderId(senderId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.senderId, senderId));
  }

  async getMessagesByReceiverId(receiverId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.receiverId, receiverId));
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  // Login help request operations
  async createLoginHelpRequest(requestData: InsertLoginHelpRequest): Promise<LoginHelpRequest> {
    const [request] = await db.insert(loginHelpRequests).values(requestData).returning();
    return request;
  }

  async getLoginHelpRequests(): Promise<LoginHelpRequest[]> {
    return await db
      .select()
      .from(loginHelpRequests)
      .where(isNull(loginHelpRequests.resolvedById));
  }

  async resolveLoginHelpRequest(id: number, resolvedById: number): Promise<LoginHelpRequest | undefined> {
    const [updatedRequest] = await db
      .update(loginHelpRequests)
      .set({
        resolvedById,
        resolvedAt: new Date()
      })
      .where(eq(loginHelpRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteLoginHelpRequest(id: number): Promise<boolean> {
    const result = await db.delete(loginHelpRequests).where(eq(loginHelpRequests.id, id));
    return result.count > 0;
  }

  // Activity log operations
  async logActivity(logData: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    return log;
  }

  async getActivityLogsByUserId(userId: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
