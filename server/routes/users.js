// server/routes/users.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/users - Return all users
router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, domain, skills, created_at FROM users').all();
    const formatted = users.map(u => ({
      ...u,
      skills: u.skills ? JSON.parse(u.skills) : []
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

// GET /api/users/:id - Return one user
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, domain, skills, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const formatted = {
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : []
    };
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve user' });
  }
});

// GET /api/users/role/:role - Return users with that role
router.get('/role/:role', (req, res) => {
  try {
    const role = req.params.role.toUpperCase();
    const validRoles = ['BUILDER', 'REVIEWER', 'RECRUITER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const users = db.prepare('SELECT id, name, email, role, domain, skills, created_at FROM users WHERE role = ?').all(role);
    const formatted = users.map(u => ({
      ...u,
      skills: u.skills ? JSON.parse(u.skills) : [],
      ...(role === 'REVIEWER' ? { reviewer_credibility: 92 } : {})
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users by role' });
  }
});

export default router;
