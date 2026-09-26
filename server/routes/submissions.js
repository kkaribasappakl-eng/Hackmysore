// server/routes/submissions.js
import express from 'express';
import { db } from '../db.js';
import { runIntegrityCheck } from '../services/antiGamingService.js';
import { runClaudeAnalysis } from '../services/claudeService.js';

const router = express.Router();

// POST /api/submissions - Create a submission with repository and ADR
router.post('/', (req, res) => {
  try {
    const { assessment_id, builder_id, repository_url, project_url, adr_content } = req.body;

    if (!assessment_id || !builder_id || !repository_url || !adr_content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: assessment_id, builder_id, repository_url, and adr_content are required'
      });
    }

    // Validate assessment exists
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessment_id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Validate builder exists
    const builder = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(builder_id);
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found' });
    }

    // Validate builder owns assessment
    if (assessment.builder_id !== builder_id) {
      return res.status(400).json({ success: false, message: 'Builder does not own this assessment' });
    }

    const now = new Date().toISOString();
    const adrJson = typeof adr_content === 'string' ? adr_content : JSON.stringify(adr_content);

    const insertStmt = db.prepare(`
      INSERT INTO submissions (
        assessment_id, builder_id, repository_url, project_url, adr_content,
        integrity_status, similarity_score, ai_analysis_status, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', NULL, 'PENDING', 'SUBMITTED', ?)
    `);

    const result = insertStmt.run(
      assessment_id,
      builder_id,
      repository_url,
      project_url || null,
      adrJson,
      now
    );

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      data: {
        ...submission,
        adr_content: JSON.parse(submission.adr_content)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create submission' });
  }
});

// GET /api/submissions/:id - Get submission details
router.get('/:id', (req, res) => {
  try {
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const builder = db.prepare('SELECT id, name, email, domain FROM users WHERE id = ?').get(submission.builder_id);
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(submission.assessment_id);
    const challenge = assessment ? db.prepare('SELECT id, title, domain, difficulty FROM challenges WHERE id = ?').get(assessment.challenge_id) : null;

    const candidateAnswers = assessment ? db.prepare(`
      SELECT a.id, a.question_id, a.answer, a.created_at,
             q.question_type, q.question_text, q.points, q.skill, q.difficulty
      FROM assessment_answers a
      JOIN assessment_questions q ON a.question_id = q.id
      WHERE a.assessment_id = ?
      ORDER BY q.id ASC
    `).all(assessment.id) : [];

    return res.status(200).json({
      success: true,
      data: {
        ...submission,
        adr_content: submission.adr_content ? JSON.parse(submission.adr_content) : null,
        anti_gaming_report: submission.anti_gaming_report ? JSON.parse(submission.anti_gaming_report) : null,
        ai_advisory_rubric: submission.ai_advisory_rubric ? JSON.parse(submission.ai_advisory_rubric) : null,
        builder: builder || null,
        assessment: assessment ? {
          ...assessment,
          skill_scores: assessment.skill_scores ? JSON.parse(assessment.skill_scores) : null,
          answers: candidateAnswers
        } : null,
        assessment_answers: candidateAnswers,
        challenge: challenge || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve submission' });
  }
});

// GET /api/submissions/status/:status - Return submissions by status
router.get('/status/:status', (req, res) => {
  try {
    const status = req.params.status.toUpperCase();
    const submissions = db.prepare('SELECT * FROM submissions WHERE status = ?').all(status);
    const formatted = submissions.map(s => ({
      ...s,
      adr_content: s.adr_content ? JSON.parse(s.adr_content) : null,
      anti_gaming_report: s.anti_gaming_report ? JSON.parse(s.anti_gaming_report) : null,
      ai_advisory_rubric: s.ai_advisory_rubric ? JSON.parse(s.ai_advisory_rubric) : null
    }));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve submissions by status' });
  }
});

// POST /api/submissions/:id/integrity-check - Run Anti-Gaming integrity analysis
router.post('/:id/integrity-check', (req, res) => {
  try {
    const report = runIntegrityCheck(req.params.id);
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('Integrity check error:', err);
    if (err.message === 'Submission not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to perform integrity check', error: err.message });
  }
});

// POST /api/submissions/:id/ai-analysis - Run Claude AI reference analysis
router.post('/:id/ai-analysis', async (req, res) => {
  try {
    const analysis = await runClaudeAnalysis(req.params.id);
    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (err) {
    console.error('AI analysis error:', err);
    if (err.message === 'Submission not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to perform AI analysis', error: err.message });
  }
});

export default router;
