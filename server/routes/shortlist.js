// server/routes/shortlist.js
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// POST /api/shortlist - Shortlist a candidate for a job
router.post('/', (req, res) => {
  try {
    const { job_id, builder_id, recruiter_id } = req.body;

    if (!job_id || !builder_id || !recruiter_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: job_id, builder_id, and recruiter_id are required'
      });
    }

    // Validate job exists
    const job = db.prepare('SELECT id, title, company FROM jobs WHERE id = ?').get(job_id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Validate builder exists
    const builder = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(builder_id);
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found' });
    }
    if (builder.role !== 'BUILDER') {
      return res.status(400).json({ success: false, message: 'Candidate user must have role BUILDER' });
    }

    // Validate recruiter exists and has role RECRUITER
    const recruiter = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(recruiter_id);
    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }
    if (recruiter.role !== 'RECRUITER') {
      return res.status(400).json({ success: false, message: 'User role must be RECRUITER' });
    }

    const now = new Date().toISOString();

    // Check if already shortlisted
    const existing = db.prepare('SELECT * FROM shortlist WHERE job_id = ? AND builder_id = ?').get(job_id, builder_id);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Candidate shortlisted',
        data: existing
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO shortlist (job_id, builder_id, recruiter_id, status, created_at)
      VALUES (?, ?, ?, 'SHORTLISTED', ?)
    `);

    const result = insertStmt.run(job_id, builder_id, recruiter_id, now);
    const created = db.prepare('SELECT * FROM shortlist WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Candidate shortlisted',
      data: created
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to shortlist candidate' });
  }
});

// GET /api/shortlist/job/:jobId - Return shortlisted candidates for a job
router.get('/job/:jobId', (req, res) => {
  try {
    const job = db.prepare('SELECT id, title, company FROM jobs WHERE id = ?').get(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const items = db.prepare(`
      SELECT s.id as shortlist_id, s.status, s.created_at,
             u.id as builder_id, u.name as builder_name, u.email as builder_email, u.domain, u.skills
      FROM shortlist s
      INNER JOIN users u ON s.builder_id = u.id
      WHERE s.job_id = ?
    `).all(req.params.jobId);

    const formatted = items.map(item => ({
      shortlist_id: item.shortlist_id,
      status: item.status,
      created_at: item.created_at,
      builder: {
        id: item.builder_id,
        name: item.builder_name,
        email: item.builder_email,
        domain: item.domain,
        skills: item.skills ? JSON.parse(item.skills) : []
      }
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve shortlisted candidates' });
  }
});

export default router;
