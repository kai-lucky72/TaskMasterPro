import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
import { User, insertUserSchema } from '@shared/schema';
import { generateId } from './utils';

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'organization-management-system-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }
  };

  app.set('trust proxy', 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure login strategy
  passport.use(new LocalStrategy({
    usernameField: 'workId',
    passwordField: 'email',
  }, async (workId, email, done) => {
    try {
      // For this simple login, we're using workId and email instead of passwords
      const user = await storage.getUserByWorkId(workId);
      if (!user) {
        return done(null, false, { message: 'Invalid work ID or email' });
      }
      
      if (user.email !== email) {
        return done(null, false, { message: 'Invalid work ID or email' });
      }

      if (user.status === 'disabled') {
        return done(null, false, { message: 'Account is disabled' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Define authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: Error, user: User, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }

      req.logIn(user, async (err) => {
        if (err) return next(err);
        
        // Log activity
        await storage.logActivity({
          userId: user.id,
          action: 'login',
          details: `User logged in from ${req.ip}`,
          createdAt: new Date()
        });

        // Return the user in the expected format for the client
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
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res, next) => {
    const userId = req.user?.id;

    req.logout((err) => {
      if (err) return next(err);

      if (userId) {
        // Log activity asynchronously (don't wait for it)
        storage.logActivity({
          userId,
          action: 'logout',
          details: `User logged out`,
          createdAt: new Date()
        }).catch(console.error);
      }

      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
    // Match the response format expected by the client
    res.json({ user: req.user });
  });

  app.post('/api/auth/help-request', async (req, res, next) => {
    try {
      const { workId, email, message } = req.body;

      // Validate inputs
      if (!workId || !email || !message) {
        return res.status(400).json({ message: 'Work ID, email, and message are required' });
      }

      const request = await storage.createLoginHelpRequest({
        workId,
        email,
        message,
        createdAt: new Date(),
        resolvedById: null,
        resolvedAt: null
      });

      res.status(201).json({
        message: 'Help request submitted successfully',
        requestId: request.id
      });
    } catch (err) {
      next(err);
    }
  });

  // Admin routes for user management
  app.post('/api/auth/users', async (req, res, next) => {
    try {
      // Check if user is admin or manager
      if (!req.isAuthenticated() || 
         (req.user.role !== 'admin' && req.user.role !== 'manager')) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      const userData = req.body;
      
      // Generate a work ID if not provided
      if (!userData.workId) {
        const role = userData.role.toUpperCase();
        userData.workId = generateId(role);
      }
      
      // Hash the password if provided
      if (userData.password) {
        userData.password = await storage.hashPassword(userData.password);
      } else {
        // Set a default password if none is provided
        userData.password = await storage.hashPassword('password123');
      }
      
      // Validate user data with Zod schema
      const validationResult = insertUserSchema.safeParse(userData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid user data', 
          errors: validationResult.error.errors 
        });
      }

      // Store the user's creator
      userData.createdById = req.user.id;
      userData.createdAt = new Date();

      const createdUser = await storage.createUser(userData);

      // Log activity
      await storage.logActivity({
        userId: req.user.id,
        action: 'create_user',
        details: `Created new user: ${createdUser.workId} (${createdUser.role})`,
        createdAt: new Date()
      });

      res.status(201).json(createdUser);
    } catch (err) {
      next(err);
    }
  });

  app.put('/api/auth/users/:id', async (req, res, next) => {
    try {
      // Check if user is admin or manager
      if (!req.isAuthenticated() || 
         (req.user.role !== 'admin' && req.user.role !== 'manager')) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Don't allow changing work ID through this endpoint
      delete userData.workId;
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Log activity
      await storage.logActivity({
        userId: req.user.id,
        action: 'update_user',
        details: `Updated user: ${updatedUser.workId}`,
        createdAt: new Date()
      });

      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/users/:id/disable', async (req, res, next) => {
    try {
      // Check if user is admin or manager
      if (!req.isAuthenticated() || 
         (req.user.role !== 'admin' && req.user.role !== 'manager')) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      const userId = parseInt(req.params.id);
      const disabledUser = await storage.disableUser(userId);
      
      if (!disabledUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Log activity
      await storage.logActivity({
        userId: req.user.id,
        action: 'disable_user',
        details: `Disabled user: ${disabledUser.workId}`,
        createdAt: new Date()
      });

      res.json(disabledUser);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/users/:id/enable', async (req, res, next) => {
    try {
      // Check if user is admin or manager
      if (!req.isAuthenticated() || 
         (req.user.role !== 'admin' && req.user.role !== 'manager')) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      const userId = parseInt(req.params.id);
      const enabledUser = await storage.enableUser(userId);
      
      if (!enabledUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Log activity
      await storage.logActivity({
        userId: req.user.id,
        action: 'enable_user',
        details: `Enabled user: ${enabledUser.workId}`,
        createdAt: new Date()
      });

      res.json(enabledUser);
    } catch (err) {
      next(err);
    }
  });
}
