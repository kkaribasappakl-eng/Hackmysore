// server/routes/auth.js
import express from 'express';
import { db } from '../db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, domain, skills }
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role, domain, skills } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required (minimum 2 characters)'
      });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required (minimum 6 characters)'
      });
    }

    const normalizedRole = (role || '').toUpperCase();
    if (!['BUILDER', 'REVIEWER', 'RECRUITER'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be one of: BUILDER, REVIEWER, RECRUITER'
      });
    }

    // Check if user already exists
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1').get(cleanEmail);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Default domain & skills based on registered role
    let defaultDomain = domain || (normalizedRole === 'BUILDER' ? 'Engineering' : normalizedRole === 'REVIEWER' ? 'System Architecture' : 'Technical Recruiting');
    let defaultSkills = skills && skills.length > 0 ? skills : [];

    const now = new Date().toISOString();

    const insertResult = db.prepare(`
      INSERT INTO users (name, email, password, role, domain, skills, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      cleanEmail,
      password,
      normalizedRole,
      defaultDomain,
      JSON.stringify(defaultSkills),
      now
    );

    const newUser = {
      id: insertResult.lastInsertRowid,
      name: name.trim(),
      email: cleanEmail,
      role: normalizedRole,
      domain: defaultDomain,
      skills: defaultSkills
    };

    // Also issue auth token immediately so user can auto-session if desired
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: `Account created successfully as ${normalizedRole}!`,
      data: {
        token,
        user: newUser
      }
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to register account'
    });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password, role }
 */
router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Lookup user by email (case-insensitive)
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1').get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password
    const validPassword = user.password || 'password123';
    if (password !== validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // If specific role requested, ensure account matches
    if (role && role.toUpperCase() !== user.role.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: `This account is registered as ${user.role}. You cannot log in through the ${role.toUpperCase()} portal.`
      });
    }

    // Parse JSON fields
    let skills = [];
    try {
      skills = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);
    } catch {
      skills = [];
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domain: user.domain,
      skills
    };

    // Issue cryptographic auth token
    const token = generateToken(userData);

    return res.status(200).json({
      success: true,
      message: `Signed in successfully as ${user.role}`,
      data: {
        token,
        user: userData
      }
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process login request'
    });
  }
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user details
 */
router.get('/me', verifyToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, domain, skills, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    let skills = [];
    try {
      skills = typeof user.skills === 'string' ? JSON.parse(user.skills) : (user.skills || []);
    } catch {
      skills = [];
    }

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        skills
      }
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile'
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Successfully logged out session'
  });
});

/**
 * GET /api/auth/demo-users
 */
router.get('/demo-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, domain FROM users').all();
    return res.status(200).json({
      success: true,
      data: {
        builder: users.find(u => u.role === 'BUILDER') || { email: 'rahul@example.com', name: 'Rahul Sharma', role: 'BUILDER' },
        reviewer: users.find(u => u.role === 'REVIEWER') || { email: 'ananya@example.com', name: 'Ananya Rao', role: 'REVIEWER' },
        recruiter: users.find(u => u.role === 'RECRUITER') || { email: 'meera@technova.example', name: 'Meera Kapoor', role: 'RECRUITER' }
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve demo users'
    });
  }
});

export default router;
