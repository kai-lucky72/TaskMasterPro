import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginSchema,
  helpRequestSchema,
  insertUserSchema,
  insertAgentGroupSchema,
  insertGroupMemberSchema,
  insertAttendanceTimeframeSchema,
  insertAttendanceSchema,
  insertClientSchema,
  insertReportSchema,
  insertMessageSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";



export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with passport
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.session && req.session.user) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized: Please log in' });
  };

  // Middleware to check role authorization
  const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: 'Unauthorized: Please log in' });
      }
      
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      
      next();
    };
  };

  // Error handler function
  const handleZodError = (error: unknown) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return { message: validationError.message };
    }
    return { message: 'An unexpected error occurred' };
  };

  // ==================== AUTH ROUTES ====================
  
  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      // Find user by work ID
      const user = await storage.getUserByWorkId(credentials.workId);
      
      // Check if user exists and email matches
      if (!user || user.email !== credentials.email) {
        // Log failed login attempt
        if (user) {
          await storage.logActivity({
            userId: user.id,
            action: 'LOGIN_FAILED',
            details: 'Email mismatch'
          });
        }
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check if user is disabled
      if (user.status === 'disabled') {
        await storage.logActivity({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: 'Account disabled'
        });
        return res.status(403).json({ message: 'Your account has been disabled. Please contact an administrator.' });
      }
      
      // Create session with user info (excluding sensitive data)
      req.session.user = {
        id: user.id,
        workId: user.workId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      };

      // Save the session before responding
      req.session.save(async (err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Session error' });
        }

        // Log successful login
        await storage.logActivity({
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          details: 'User logged in successfully'
        });
        
        // Send user info back to client
        return res.status(200).json({
          message: 'Login successful',
          user: {
            id: user.id,
            workId: user.workId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status
          }
        });
      });
    } catch (error) {
      return res.status(400).json(handleZodError(error));
    }
  });
  
  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    if (req.session.user) {
      const userId = req.session.user.id;
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to logout' });
        }
        
        // Log logout activity
        storage.logActivity({
          userId,
          action: 'LOGOUT',
          details: 'User logged out'
        }).catch(console.error);
        
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } else {
      res.status(200).json({ message: 'Already logged out' });
    }
  });
  
  // Get current user
  app.get('/api/auth/me', isAuthenticated, (req, res) => {
    res.status(200).json({ user: req.session.user });
  });
  
  // Submit help request
  app.post('/api/auth/help-request', async (req, res) => {
    try {
      const helpRequestData = helpRequestSchema.parse(req.body);
      
      const helpRequest = await storage.createLoginHelpRequest(helpRequestData);
      
      res.status(201).json({
        message: 'Help request submitted successfully',
        helpRequest
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // ==================== USER MANAGEMENT ROUTES ====================
  
  // Get users by role
  app.get('/api/users/by-role/:role', isAuthenticated, async (req, res) => {
    const { role } = req.params;
    const currentUser = req.session.user;
    
    // Apply role-specific filters
    try {
      let users;
      
      switch (currentUser.role) {
        case 'admin':
          // Admin can see all users of any role
          users = await storage.getUsersByRole(role);
          break;
          
        case 'manager':
          // Managers can only see their own sales staff and associated agents
          if (role === 'sales_staff') {
            users = await storage.getUsersByManagerId(currentUser.id);
          } else if (['individual_agent', 'team_leader', 'sales_agent'].includes(role)) {
            const salesStaff = await storage.getUsersByManagerId(currentUser.id);
            const salesStaffIds = salesStaff.map(staff => staff.id);
            
            // Get all agents under these sales staff
            users = (await Promise.all(
              salesStaffIds.map(id => storage.getUsersBySalesStaffId(id))
            )).flat().filter(user => user.role === role);
          } else {
            return res.status(403).json({ message: 'Forbidden: You cannot view users with this role' });
          }
          break;
          
        case 'sales_staff':
          // Sales staff can only see their agents
          if (['individual_agent', 'team_leader', 'sales_agent'].includes(role)) {
            users = await storage.getUsersBySalesStaffId(currentUser.id);
            users = users.filter(user => user.role === role);
          } else {
            return res.status(403).json({ message: 'Forbidden: You cannot view users with this role' });
          }
          break;
          
        default:
          return res.status(403).json({ message: 'Forbidden: Insufficient permissions to view users' });
      }
      
      res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve users' });
    }
  });
  
  // Create user
  app.post('/api/users', isAuthenticated, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Check role-based permissions for user creation
      let canCreate = false;
      
      switch (currentUser.role) {
        case 'admin':
          // Admin can only create managers
          canCreate = userData.role === 'manager';
          userData.createdById = currentUser.id;
          break;
          
        case 'manager':
          // Managers can only create sales staff
          canCreate = userData.role === 'sales_staff';
          userData.createdById = currentUser.id;
          userData.managerId = currentUser.id;
          break;
          
        case 'sales_staff':
          // Sales staff can only create agents
          canCreate = ['individual_agent', 'team_leader', 'sales_agent'].includes(userData.role);
          userData.createdById = currentUser.id;
          userData.salesStaffId = currentUser.id;
          break;
          
        default:
          canCreate = false;
      }
      
      if (!canCreate) {
        return res.status(403).json({ message: 'Forbidden: You cannot create users with this role' });
      }
      
      // Check if user with same workId or email already exists
      const existingUserByWorkId = await storage.getUserByWorkId(userData.workId);
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      
      if (existingUserByWorkId) {
        return res.status(400).json({ message: 'A user with this Work ID already exists' });
      }
      
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
      
      const user = await storage.createUser(userData);
      
      // Log user creation
      await storage.logActivity({
        userId: currentUser.id,
        action: 'USER_CREATED',
        details: `Created ${userData.role} (${userData.firstName} ${userData.lastName})`
      });
      
      res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Update user
  app.put('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userData = req.body;
      const currentUser = req.session.user;
      
      // Get the user to update
      const userToUpdate = await storage.getUserById(parseInt(id));
      
      if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check permissions for user update
      let canUpdate = false;
      
      switch (currentUser.role) {
        case 'admin':
          // Admin can update managers
          canUpdate = userToUpdate.role === 'manager';
          break;
          
        case 'manager':
          // Managers can update their own sales staff
          canUpdate = userToUpdate.role === 'sales_staff' && userToUpdate.managerId === currentUser.id;
          break;
          
        case 'sales_staff':
          // Sales staff can update their agents
          canUpdate = ['individual_agent', 'team_leader', 'sales_agent'].includes(userToUpdate.role) && 
                      userToUpdate.salesStaffId === currentUser.id;
          break;
          
        default:
          canUpdate = false;
      }
      
      if (!canUpdate) {
        return res.status(403).json({ message: 'Forbidden: You cannot update this user' });
      }
      
      // Cannot change role, workId, email after creation
      delete userData.role;
      delete userData.workId;
      delete userData.email;
      
      const updatedUser = await storage.updateUser(parseInt(id), userData);
      
      // Log user update
      await storage.logActivity({
        userId: currentUser.id,
        action: 'USER_UPDATED',
        details: `Updated ${userToUpdate.role} (${userToUpdate.firstName} ${userToUpdate.lastName})`
      });
      
      res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Disable user
  app.put('/api/users/:id/disable', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.session.user;
      
      // Get the user to disable
      const userToDisable = await storage.getUserById(parseInt(id));
      
      if (!userToDisable) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check permissions for user disable
      let canDisable = false;
      
      switch (currentUser.role) {
        case 'admin':
          // Admin can disable any user
          canDisable = true;
          break;
          
        case 'manager':
          // Managers can disable their own sales staff
          canDisable = userToDisable.role === 'sales_staff' && userToDisable.managerId === currentUser.id;
          break;
          
        case 'sales_staff':
          // Sales staff can disable their agents
          canDisable = ['individual_agent', 'team_leader', 'sales_agent'].includes(userToDisable.role) && 
                       userToDisable.salesStaffId === currentUser.id;
          break;
          
        default:
          canDisable = false;
      }
      
      if (!canDisable) {
        return res.status(403).json({ message: 'Forbidden: You cannot disable this user' });
      }
      
      const disabledUser = await storage.disableUser(parseInt(id));
      
      // Log user disable
      await storage.logActivity({
        userId: currentUser.id,
        action: 'USER_DISABLED',
        details: `Disabled ${userToDisable.role} (${userToDisable.firstName} ${userToDisable.lastName})`
      });
      
      res.status(200).json({
        message: 'User disabled successfully',
        user: disabledUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to disable user' });
    }
  });
  
  // Enable user
  app.put('/api/users/:id/enable', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.session.user;
      
      // Get the user to enable
      const userToEnable = await storage.getUserById(parseInt(id));
      
      if (!userToEnable) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check permissions for user enable (same as disable)
      let canEnable = false;
      
      switch (currentUser.role) {
        case 'admin':
          // Admin can enable any user
          canEnable = true;
          break;
          
        case 'manager':
          // Managers can enable their own sales staff
          canEnable = userToEnable.role === 'sales_staff' && userToEnable.managerId === currentUser.id;
          break;
          
        case 'sales_staff':
          // Sales staff can enable their agents
          canEnable = ['individual_agent', 'team_leader', 'sales_agent'].includes(userToEnable.role) && 
                      userToEnable.salesStaffId === currentUser.id;
          break;
          
        default:
          canEnable = false;
      }
      
      if (!canEnable) {
        return res.status(403).json({ message: 'Forbidden: You cannot enable this user' });
      }
      
      const enabledUser = await storage.enableUser(parseInt(id));
      
      // Log user enable
      await storage.logActivity({
        userId: currentUser.id,
        action: 'USER_ENABLED',
        details: `Enabled ${userToEnable.role} (${userToEnable.firstName} ${userToEnable.lastName})`
      });
      
      res.status(200).json({
        message: 'User enabled successfully',
        user: enabledUser
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to enable user' });
    }
  });
  
  // ==================== AGENT GROUP ROUTES ====================
  
  // Create agent group
  app.post('/api/agent-groups', isAuthenticated, checkRole(['sales_staff']), async (req, res) => {
    try {
      const groupData = insertAgentGroupSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Sales staff can only create groups for themselves
      groupData.salesStaffId = currentUser.id;
      
      // Validate team leader exists and is a team leader
      if (groupData.teamLeaderId) {
        const teamLeader = await storage.getUserById(groupData.teamLeaderId);
        
        if (!teamLeader || teamLeader.role !== 'team_leader') {
          return res.status(400).json({ message: 'Invalid team leader' });
        }
        
        if (teamLeader.salesStaffId !== currentUser.id) {
          return res.status(403).json({ message: 'Forbidden: Team leader must be under your supervision' });
        }
      }
      
      const group = await storage.createAgentGroup(groupData);
      
      // Log group creation
      await storage.logActivity({
        userId: currentUser.id,
        action: 'GROUP_CREATED',
        details: `Created agent group (${groupData.name})`
      });
      
      res.status(201).json({
        message: 'Agent group created successfully',
        group
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Get agent groups by sales staff
  app.get('/api/agent-groups', isAuthenticated, checkRole(['sales_staff', 'manager']), async (req, res) => {
    try {
      const currentUser = req.session.user;
      let groups = [];
      
      if (currentUser.role === 'sales_staff') {
        // Sales staff can see their own groups
        groups = await storage.getAgentGroupsBySalesStaffId(currentUser.id);
      } else if (currentUser.role === 'manager') {
        // Managers can see groups of their sales staff
        const salesStaff = await storage.getUsersByManagerId(currentUser.id);
        groups = (await Promise.all(
          salesStaff.map(staff => storage.getAgentGroupsBySalesStaffId(staff.id))
        )).flat();
      }
      
      res.status(200).json({ groups });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve agent groups' });
    }
  });
  
  // Add member to group
  app.post('/api/agent-groups/:groupId/members', isAuthenticated, checkRole(['sales_staff']), async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;
      const currentUser = req.session.user;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Verify group exists and belongs to current sales staff
      const group = await storage.getAgentGroupById(parseInt(groupId));
      
      if (!group) {
        return res.status(404).json({ message: 'Agent group not found' });
      }
      
      if (group.salesStaffId !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot modify this group' });
      }
      
      // Verify user exists and is an agent under current sales staff
      const user = await storage.getUserById(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.salesStaffId !== currentUser.id || !['team_leader', 'sales_agent'].includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: User must be an agent under your supervision' });
      }
      
      // Check if user is already in the group
      const groupMembers = await storage.getGroupMembers(parseInt(groupId));
      
      if (groupMembers.some(member => member.userId === parseInt(userId))) {
        return res.status(400).json({ message: 'User is already a member of this group' });
      }
      
      // Check group size limit (2-5 members including team leader)
      if (groupMembers.length >= 5) {
        return res.status(400).json({ message: 'Group size limit reached (maximum 5 members)' });
      }
      
      const memberData = {
        groupId: parseInt(groupId),
        userId: parseInt(userId)
      };
      
      const member = await storage.addMemberToGroup(memberData);
      
      // Log member addition
      await storage.logActivity({
        userId: currentUser.id,
        action: 'GROUP_MEMBER_ADDED',
        details: `Added ${user.firstName} ${user.lastName} to group ${group.name}`
      });
      
      res.status(201).json({
        message: 'Member added to group successfully',
        member
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to add member to group' });
    }
  });
  
  // Get group members
  app.get('/api/agent-groups/:groupId/members', isAuthenticated, async (req, res) => {
    try {
      const { groupId } = req.params;
      const currentUser = req.session.user;
      
      // Verify group exists
      const group = await storage.getAgentGroupById(parseInt(groupId));
      
      if (!group) {
        return res.status(404).json({ message: 'Agent group not found' });
      }
      
      // Check permissions
      let canView = false;
      
      switch (currentUser.role) {
        case 'admin':
          canView = true;
          break;
          
        case 'manager':
          // Check if group belongs to sales staff under this manager
          const salesStaff = await storage.getUsersByManagerId(currentUser.id);
          canView = salesStaff.some(staff => staff.id === group.salesStaffId);
          break;
          
        case 'sales_staff':
          canView = group.salesStaffId === currentUser.id;
          break;
          
        case 'team_leader':
          canView = group.teamLeaderId === currentUser.id;
          break;
          
        case 'sales_agent':
        case 'individual_agent':
          // Check if user is a member of the group
          const groupMembers = await storage.getGroupMembers(parseInt(groupId));
          canView = groupMembers.some(member => member.userId === currentUser.id);
          break;
          
        default:
          canView = false;
      }
      
      if (!canView) {
        return res.status(403).json({ message: 'Forbidden: You cannot view this group' });
      }
      
      // Get group members
      const groupMembers = await storage.getGroupMembers(parseInt(groupId));
      
      // Get detailed user information for each member
      const members = await Promise.all(
        groupMembers.map(async (member) => {
          const user = await storage.getUserById(member.userId);
          return {
            id: member.id,
            userId: member.userId,
            groupId: member.groupId,
            user: user ? {
              id: user.id,
              workId: user.workId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
              status: user.status
            } : null
          };
        })
      );
      
      res.status(200).json({ members });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve group members' });
    }
  });
  
  // ==================== ATTENDANCE ROUTES ====================
  
  // Create attendance timeframe
  app.post('/api/attendance/timeframes', isAuthenticated, checkRole(['sales_staff']), async (req, res) => {
    try {
      const timeframeData = insertAttendanceTimeframeSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Sales staff can only create timeframes for themselves
      timeframeData.salesStaffId = currentUser.id;
      
      const timeframe = await storage.createAttendanceTimeframe(timeframeData);
      
      // Log timeframe creation
      await storage.logActivity({
        userId: currentUser.id,
        action: 'TIMEFRAME_CREATED',
        details: `Created attendance timeframe (${new Date(timeframeData.startTime).toLocaleString()} - ${new Date(timeframeData.endTime).toLocaleString()})`
      });
      
      res.status(201).json({
        message: 'Attendance timeframe created successfully',
        timeframe
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Get attendance timeframes
  app.get('/api/attendance/timeframes', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.session.user;
      let timeframes = [];
      
      if (currentUser.role === 'sales_staff') {
        // Sales staff can see their own timeframes
        timeframes = await storage.getAttendanceTimeframesBySalesStaffId(currentUser.id);
      } else if (['individual_agent', 'team_leader', 'sales_agent'].includes(currentUser.role)) {
        // Agents can see timeframes of their sales staff
        const user = await storage.getUserById(currentUser.id);
        if (user && user.salesStaffId) {
          timeframes = await storage.getAttendanceTimeframesBySalesStaffId(user.salesStaffId);
        }
      }
      
      res.status(200).json({ timeframes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve attendance timeframes' });
    }
  });
  
  // Mark attendance
  app.post('/api/attendance', isAuthenticated, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Only agents can mark attendance
      if (!['individual_agent', 'team_leader', 'sales_agent'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Forbidden: Only agents can mark attendance' });
      }
      
      // Agents can only mark their own attendance
      attendanceData.userId = currentUser.id;
      
      // Check if attendance already marked for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingAttendance = await storage.getUserAttendanceByDate(currentUser.id, today);
      
      if (existingAttendance) {
        return res.status(400).json({ message: 'Attendance already marked for today' });
      }
      
      // Get user's sales staff
      const user = await storage.getUserById(currentUser.id);
      
      if (!user || !user.salesStaffId) {
        return res.status(400).json({ message: 'User has no assigned sales staff' });
      }
      
      // Check if within timeframe
      const timeframes = await storage.getAttendanceTimeframesBySalesStaffId(user.salesStaffId);
      const now = new Date();
      
      const withinTimeframe = timeframes.some(timeframe => {
        const start = new Date(timeframe.startTime);
        const end = new Date(timeframe.endTime);
        return now >= start && now <= end;
      });
      
      attendanceData.isPresent = true;
      
      if (!withinTimeframe) {
        // Mark as absent if outside timeframe
        attendanceData.isPresent = false;
      }
      
      const attendance = await storage.markAttendance(attendanceData);
      
      // Log attendance marking
      await storage.logActivity({
        userId: currentUser.id,
        action: 'ATTENDANCE_MARKED',
        details: `Marked attendance as ${attendance.isPresent ? 'present' : 'absent'}`
      });
      
      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Get user attendance
  app.get('/api/attendance/user/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = req.session.user;
      
      // Check permissions
      let canView = false;
      const targetUser = await storage.getUserById(parseInt(userId));
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      switch (currentUser.role) {
        case 'admin':
          canView = true;
          break;
          
        case 'manager':
          // Managers can view attendance of their sales staff and agents under them
          if (targetUser.role === 'sales_staff') {
            canView = targetUser.managerId === currentUser.id;
          } else if (['individual_agent', 'team_leader', 'sales_agent'].includes(targetUser.role)) {
            const salesStaff = await storage.getUserById(targetUser.salesStaffId);
            canView = salesStaff && salesStaff.managerId === currentUser.id;
          }
          break;
          
        case 'sales_staff':
          // Sales staff can view attendance of their agents
          if (['individual_agent', 'team_leader', 'sales_agent'].includes(targetUser.role)) {
            canView = targetUser.salesStaffId === currentUser.id;
          }
          break;
          
        case 'team_leader':
          // Team leaders can view attendance of agents in their group
          if (targetUser.role === 'sales_agent') {
            // Get all groups where current user is team leader
            const agentGroups = await storage.getAgentGroupsBySalesStaffId(targetUser.salesStaffId);
            const leadingGroups = agentGroups.filter(group => group.teamLeaderId === currentUser.id);
            
            // Check if target user is a member of any of these groups
            for (const group of leadingGroups) {
              const members = await storage.getGroupMembers(group.id);
              if (members.some(member => member.userId === parseInt(userId))) {
                canView = true;
                break;
              }
            }
          }
          break;
          
        default:
          // Users can view their own attendance
          canView = parseInt(userId) === currentUser.id;
      }
      
      if (!canView) {
        return res.status(403).json({ message: 'Forbidden: You cannot view this user\'s attendance' });
      }
      
      const attendanceRecords = await storage.getUserAttendance(parseInt(userId));
      
      res.status(200).json({ attendance: attendanceRecords });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve attendance records' });
    }
  });
  
  // Excuse absence
  app.put('/api/attendance/:id/excuse', isAuthenticated, checkRole(['sales_staff']), async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const currentUser = req.session.user;
      
      if (!reason) {
        return res.status(400).json({ message: 'Excuse reason is required' });
      }
      
      // Get the attendance record
      const attendance = await storage.getUserAttendance(parseInt(id));
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      
      // Verify the user belongs to current sales staff
      const user = await storage.getUserById(attendance[0].userId);
      
      if (!user || user.salesStaffId !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden: You can only excuse absences for your agents' });
      }
      
      const excusedAttendance = await storage.excuseAbsence(parseInt(id), currentUser.id, reason);
      
      // Log excuse activity
      await storage.logActivity({
        userId: currentUser.id,
        action: 'ABSENCE_EXCUSED',
        details: `Excused absence for ${user.firstName} ${user.lastName}`
      });
      
      res.status(200).json({
        message: 'Absence excused successfully',
        attendance: excusedAttendance
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to excuse absence' });
    }
  });
  
  // ==================== CLIENT ROUTES ====================
  
  // Create client
  app.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Only agents can add clients
      if (!['individual_agent', 'team_leader', 'sales_agent'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Forbidden: Only agents can add clients' });
      }
      
      // Agents can only add clients for themselves
      clientData.agentId = currentUser.id;
      
      // Check if agent is present for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await storage.getUserAttendanceByDate(currentUser.id, today);
      
      if (!attendance) {
        return res.status(403).json({ message: 'You must mark your attendance before adding clients' });
      }
      
      if (!attendance.isPresent && !attendance.isExcused) {
        return res.status(403).json({ message: 'You are marked as absent today. You cannot add clients unless your absence is excused.' });
      }
      
      const client = await storage.createClient(clientData);
      
      // Log client addition
      await storage.logActivity({
        userId: currentUser.id,
        action: 'CLIENT_ADDED',
        details: `Added client ${clientData.name}`
      });
      
      res.status(201).json({
        message: 'Client added successfully',
        client
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Get clients
  app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.session.user;
      let clients = [];
      
      switch (currentUser.role) {
        case 'admin':
          // Admin cannot view individual clients directly
          return res.status(403).json({ message: 'Please view clients through managers or sales staff' });
          
        case 'manager':
          // Managers view aggregated clients through sales staff
          const salesStaff = await storage.getUsersByManagerId(currentUser.id);
          clients = (await Promise.all(
            salesStaff.map(staff => storage.getClientsBySalesStaffId(staff.id))
          )).flat();
          break;
          
        case 'sales_staff':
          // Sales staff view clients of their agents
          clients = await storage.getClientsBySalesStaffId(currentUser.id);
          break;
          
        case 'team_leader':
          // Team leaders view clients of their team and own clients
          const teamClients = await storage.getClientsByTeamLeaderId(currentUser.id);
          const ownClients = await storage.getClientsByAgentId(currentUser.id);
          clients = [...teamClients, ...ownClients];
          break;
          
        case 'individual_agent':
        case 'sales_agent':
          // Agents view their own clients
          clients = await storage.getClientsByAgentId(currentUser.id);
          break;
          
        default:
          return res.status(403).json({ message: 'Forbidden: You cannot view clients' });
      }
      
      res.status(200).json({ clients });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve clients' });
    }
  });
  
  // ==================== REPORT ROUTES ====================
  
  // Create report
  app.post('/api/reports', isAuthenticated, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Set creator ID
      reportData.userId = currentUser.id;
      
      // Handle routing based on role
      switch (currentUser.role) {
        case 'individual_agent':
          // Route to sales staff
          const agent = await storage.getUserById(currentUser.id);
          if (agent && agent.salesStaffId) {
            reportData.salesStaffId = agent.salesStaffId;
          }
          break;
          
        case 'sales_agent':
          // Route to team leader
          reportData.teamLeaderId = req.body.teamLeaderId;
          break;
          
        case 'team_leader':
          // Consolidate group reports and route to sales staff
          const teamLeader = await storage.getUserById(currentUser.id);
          if (teamLeader && teamLeader.salesStaffId) {
            reportData.salesStaffId = teamLeader.salesStaffId;
          }
          break;
          
        case 'sales_staff':
          // Route to manager
          const salesStaff = await storage.getUserById(currentUser.id);
          if (salesStaff && salesStaff.managerId) {
            reportData.managerId = salesStaff.managerId;
          }
          break;
          
        default:
          return res.status(403).json({ message: 'Forbidden: You cannot submit reports' });
      }
      
      const report = await storage.createReport(reportData);
      
      // Log report submission
      await storage.logActivity({
        userId: currentUser.id,
        action: 'REPORT_SUBMITTED',
        details: `Submitted report: ${reportData.title}`
      });
      
      res.status(201).json({
        message: 'Report submitted successfully',
        report
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Get reports
  app.get('/api/reports', isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.session.user;
      let reports = [];
      
      switch (currentUser.role) {
        case 'admin':
          // Admins don't directly view reports
          return res.status(403).json({ message: 'Please view reports through managers' });
          
        case 'manager':
          // Managers see reports addressed to them
          reports = await storage.getReportsByManagerId(currentUser.id);
          break;
          
        case 'sales_staff':
          // Sales staff see reports addressed to them and their own reports
          const addressedReports = await storage.getReportsBySalesStaffId(currentUser.id);
          const ownReports = await storage.getReportsByUserId(currentUser.id);
          reports = [...addressedReports, ...ownReports];
          break;
          
        case 'team_leader':
          // Team leaders see reports addressed to them and their own reports
          const teamReports = await storage.getReportsByTeamLeaderId(currentUser.id);
          const leaderReports = await storage.getReportsByUserId(currentUser.id);
          reports = [...teamReports, ...leaderReports];
          break;
          
        case 'individual_agent':
        case 'sales_agent':
          // Agents see their own reports
          reports = await storage.getReportsByUserId(currentUser.id);
          break;
          
        default:
          return res.status(403).json({ message: 'Forbidden: You cannot view reports' });
      }
      
      res.status(200).json({ reports });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve reports' });
    }
  });
  
  // ==================== MESSAGE ROUTES ====================
  
  // Send message
  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const currentUser = req.session.user;
      
      // Sender is current user
      messageData.senderId = currentUser.id;
      
      // Verify receiver exists
      const receiver = await storage.getUserById(messageData.receiverId);
      
      if (!receiver) {
        return res.status(404).json({ message: 'Receiver not found' });
      }
      
      // Check messaging permissions
      let canMessage = false;
      
      switch (currentUser.role) {
        case 'admin':
          // Admin can message managers
          canMessage = receiver.role === 'manager';
          break;
          
        case 'manager':
          // Managers can message admin and their sales staff
          canMessage = 
            receiver.role === 'admin' || 
            (receiver.role === 'sales_staff' && receiver.managerId === currentUser.id);
          break;
          
        case 'sales_staff':
          // Sales staff can message their manager, individual agents, and team leaders
          canMessage = 
            (receiver.role === 'manager' && receiver.id === (await storage.getUserById(currentUser.id)).managerId) ||
            (['individual_agent', 'team_leader'].includes(receiver.role) && receiver.salesStaffId === currentUser.id);
          break;
          
        case 'team_leader':
          // Team leaders can message their sales staff and sales agents in their group
          if (receiver.role === 'sales_staff' && receiver.id === (await storage.getUserById(currentUser.id)).salesStaffId) {
            canMessage = true;
          } else if (receiver.role === 'sales_agent') {
            // Check if receiver is in a group led by this team leader
            const agentGroups = await storage.getAgentGroupsBySalesStaffId(receiver.salesStaffId);
            const leadingGroups = agentGroups.filter(group => group.teamLeaderId === currentUser.id);
            
            for (const group of leadingGroups) {
              const members = await storage.getGroupMembers(group.id);
              if (members.some(member => member.userId === receiver.id)) {
                canMessage = true;
                break;
              }
            }
          }
          break;
          
        case 'individual_agent':
          // Individual agents can message their sales staff
          canMessage = 
            receiver.role === 'sales_staff' && 
            receiver.id === (await storage.getUserById(currentUser.id)).salesStaffId;
          break;
          
        case 'sales_agent':
          // Sales agents can message their team leader
          const agent = await storage.getUserById(currentUser.id);
          if (agent && agent.salesStaffId) {
            const agentGroups = await storage.getAgentGroupsBySalesStaffId(agent.salesStaffId);
            const memberGroups = [];
            
            for (const group of agentGroups) {
              const members = await storage.getGroupMembers(group.id);
              if (members.some(member => member.userId === currentUser.id)) {
                memberGroups.push(group);
              }
            }
            
            canMessage = memberGroups.some(group => group.teamLeaderId === receiver.id);
          }
          break;
          
        default:
          canMessage = false;
      }
      
      if (!canMessage) {
        return res.status(403).json({ message: 'Forbidden: You cannot message this user' });
      }
      
      const message = await storage.sendMessage(messageData);
      
      res.status(201).json({
        message: 'Message sent successfully',
        messageData: message
      });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Get conversation
  app.get('/api/messages/:userId', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = req.session.user;
      
      // Verify user exists
      const otherUser = await storage.getUserById(parseInt(userId));
      
      if (!otherUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check messaging permissions (same as send message)
      let canViewConversation = false;
      
      switch (currentUser.role) {
        case 'admin':
          canViewConversation = otherUser.role === 'manager';
          break;
          
        case 'manager':
          canViewConversation = 
            otherUser.role === 'admin' || 
            (otherUser.role === 'sales_staff' && otherUser.managerId === currentUser.id);
          break;
          
        case 'sales_staff':
          canViewConversation = 
            (otherUser.role === 'manager' && otherUser.id === (await storage.getUserById(currentUser.id)).managerId) ||
            (['individual_agent', 'team_leader'].includes(otherUser.role) && otherUser.salesStaffId === currentUser.id);
          break;
          
        case 'team_leader':
          if (otherUser.role === 'sales_staff' && otherUser.id === (await storage.getUserById(currentUser.id)).salesStaffId) {
            canViewConversation = true;
          } else if (otherUser.role === 'sales_agent') {
            const agentGroups = await storage.getAgentGroupsBySalesStaffId(otherUser.salesStaffId);
            const leadingGroups = agentGroups.filter(group => group.teamLeaderId === currentUser.id);
            
            for (const group of leadingGroups) {
              const members = await storage.getGroupMembers(group.id);
              if (members.some(member => member.userId === otherUser.id)) {
                canViewConversation = true;
                break;
              }
            }
          }
          break;
          
        case 'individual_agent':
          canViewConversation = 
            otherUser.role === 'sales_staff' && 
            otherUser.id === (await storage.getUserById(currentUser.id)).salesStaffId;
          break;
          
        case 'sales_agent':
          const agent = await storage.getUserById(currentUser.id);
          if (agent && agent.salesStaffId) {
            const agentGroups = await storage.getAgentGroupsBySalesStaffId(agent.salesStaffId);
            const memberGroups = [];
            
            for (const group of agentGroups) {
              const members = await storage.getGroupMembers(group.id);
              if (members.some(member => member.userId === currentUser.id)) {
                memberGroups.push(group);
              }
            }
            
            canViewConversation = memberGroups.some(group => group.teamLeaderId === otherUser.id);
          }
          break;
          
        default:
          canViewConversation = false;
      }
      
      if (!canViewConversation) {
        return res.status(403).json({ message: 'Forbidden: You cannot view messages with this user' });
      }
      
      const conversation = await storage.getConversation(currentUser.id, parseInt(userId));
      
      // Mark messages as read
      for (const message of conversation) {
        if (message.receiverId === currentUser.id && !message.isRead) {
          await storage.markMessageAsRead(message.id);
        }
      }
      
      res.status(200).json({ messages: conversation });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve conversation' });
    }
  });
  
  // ==================== HELP REQUEST ROUTES ====================
  
  // Get login help requests (Admin only)
  app.get('/api/help-requests', isAuthenticated, checkRole(['admin']), async (req, res) => {
    try {
      const helpRequests = await storage.getLoginHelpRequests();
      
      res.status(200).json({ helpRequests });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve help requests' });
    }
  });
  
  // Resolve help request (Admin only)
  app.put('/api/help-requests/:id/resolve', isAuthenticated, checkRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.session.user;
      
      const resolvedRequest = await storage.resolveLoginHelpRequest(parseInt(id), currentUser.id);
      
      if (!resolvedRequest) {
        return res.status(404).json({ message: 'Help request not found' });
      }
      
      // Log help request resolution
      await storage.logActivity({
        userId: currentUser.id,
        action: 'HELP_REQUEST_RESOLVED',
        details: `Resolved login help request from ${resolvedRequest.email}`
      });
      
      res.status(200).json({
        message: 'Help request resolved successfully',
        helpRequest: resolvedRequest
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to resolve help request' });
    }
  });
  
  // ==================== ACTIVITY LOG ROUTES ====================
  
  // Get recent activity logs (Admin only)
  app.get('/api/activity-logs', isAuthenticated, checkRole(['admin']), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const activityLogs = await storage.getRecentActivityLogs(limit);
      
      // Enrich logs with user info
      const enrichedLogs = await Promise.all(
        activityLogs.map(async log => {
          const user = log.userId ? await storage.getUserById(log.userId) : null;
          
          return {
            ...log,
            user: user ? {
              id: user.id,
              workId: user.workId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role
            } : null
          };
        })
      );
      
      res.status(200).json({ activityLogs: enrichedLogs });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to retrieve activity logs' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
