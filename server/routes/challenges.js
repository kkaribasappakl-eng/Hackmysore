// server/routes/challenges.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/challenges - Return all challenges
router.get('/', (req, res) => {
  try {
    const challenges = db.prepare('SELECT * FROM challenges').all();
    const formatted = challenges.map(c => ({
      ...c,
      skills: c.skills ? JSON.parse(c.skills) : [],
      prerequisites: c.prerequisites ? JSON.parse(c.prerequisites) : []
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve challenges' });
  }
});

// GET /api/challenges/:id - Return one challenge
router.get('/:id', (req, res) => {
  try {
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    const formatted = {
      ...challenge,
      skills: challenge.skills ? JSON.parse(challenge.skills) : [],
      prerequisites: challenge.prerequisites ? JSON.parse(challenge.prerequisites) : []
    };
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve challenge' });
  }
});

// GET /api/challenges/domain/:domain - Return challenges by domain
router.get('/domain/:domain', (req, res) => {
  try {
    const domain = decodeURIComponent(req.params.domain);
    const challenges = db.prepare('SELECT * FROM challenges WHERE domain = ?').all(domain);
    const formatted = challenges.map(c => ({
      ...c,
      skills: c.skills ? JSON.parse(c.skills) : [],
      prerequisites: c.prerequisites ? JSON.parse(c.prerequisites) : []
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve challenges by domain' });
  }
});

export default router;
