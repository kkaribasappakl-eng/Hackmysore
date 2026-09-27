import express from 'express';
import { db, ensureDemoData } from '../db.js';

const router = express.Router();

// GET /api/jobs - Return all jobs
router.get('/', (req, res) => {
  try {
    ensureDemoData();
    const jobs = db.prepare('SELECT * FROM jobs').all();
    const formatted = jobs.map(j => ({
      ...j,
      required_skills: j.required_skills ? (typeof j.required_skills === 'string' ? JSON.parse(j.required_skills) : j.required_skills) : []
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve jobs' });
  }
});

// GET /api/jobs/:id - Return one job
router.get('/:id', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const formatted = {
      ...job,
      required_skills: job.required_skills ? JSON.parse(job.required_skills) : []
    };
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve job' });
  }
});

// POST /api/jobs - Create a job
router.post('/', (req, res) => {
  try {
    const { company, title, description, required_skills, difficulty, created_by } = req.body;

    if (!company || !title || !required_skills || !created_by) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: company, title, required_skills, and created_by are mandatory'
      });
    }

    if (!Array.isArray(required_skills)) {
      return res.status(400).json({
        success: false,
        message: 'required_skills must be an array of strings'
      });
    }

    // Check creator exists and is a RECRUITER
    const creator = db.prepare('SELECT id, role FROM users WHERE id = ?').get(created_by);
    if (!creator) {
      return res.status(404).json({ success: false, message: 'User specified in created_by does not exist' });
    }
    if (creator.role !== 'RECRUITER') {
      return res.status(400).json({ success: false, message: 'Only users with role RECRUITER can create jobs' });
    }

    const now = new Date().toISOString();
    const skillsJson = JSON.stringify(required_skills);
    const diff = difficulty || 'Intermediate';

    const insertStmt = db.prepare(`
      INSERT INTO jobs (company, title, description, required_skills, difficulty, created_by, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `);

    const result = insertStmt.run(company, title, description || '', skillsJson, diff, created_by, now);
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      data: {
        ...newJob,
        required_skills: JSON.parse(newJob.required_skills)
      },
      message: 'SignalCraft will map required skills to suitable technical challenges.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create job' });
  }
});

export default router;
