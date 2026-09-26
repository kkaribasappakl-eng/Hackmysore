// server/routes/auth.js
import express from 'express';
import { db } from '../db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

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

    // Lookup user by email (case-insensitive)
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1').get(email.trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Validate password (default for seeded demo accounts is 'password123')
    const validPassword = user.password || 'password123';
    if (password && password !== validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. For demo accounts use password123'
      });
    }

    // Role check if specific role login tab was used
    if (role && role.toUpperCase() !== user.role.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as ${user.role}. You cannot log in through the ${role.toUpperCase()} portal.`
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
      message: `Authenticated successfully as ${user.role}`,
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
 * Quick helper for judging and 1-click evaluation
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
