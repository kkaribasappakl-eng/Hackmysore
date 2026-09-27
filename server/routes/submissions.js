// server/routes/submissions.js
import express from 'express';
import { db } from '../db.js';
import { runIntegrityCheck } from '../services/antiGamingService.js';
import { runClaudeAnalysis } from '../services/claudeService.js';

const router = express.Router();

// POST /api/submissions - Create or update a submission with repository and ADR
router.post('/', async (req, res) => {
  try {
    const { assessment_id, builder_id, repository_url, project_url, adr_content } = req.body;

    if (!builder_id || !repository_url || !adr_content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: builder_id, repository_url, and adr_content are required'
      });
    }

    const builderIdNum = Number(builder_id);

    // Validate builder exists
    const builder = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(builderIdNum);
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found' });
    }

    // Resolve builder's assessment
    let assIdNum = assessment_id ? Number(assessment_id) : null;
    let assessment = assIdNum ? db.prepare('SELECT * FROM assessments WHERE id = ?').get(assIdNum) : null;

    if (!assessment || Number(assessment.builder_id) !== builderIdNum) {
      // Find the latest assessment for this builder
      assessment = db.prepare('SELECT * FROM assessments WHERE builder_id = ? ORDER BY id DESC LIMIT 1').get(builderIdNum);
    }

    const now = new Date().toISOString();

    // If still no assessment, create one so the client submission is never blocked
    if (!assessment) {
      const insAss = db.prepare(`
        INSERT INTO assessments (challenge_id, builder_id, status, started_at, completed_at)
        VALUES (1, ?, 'COMPLETED', ?, ?)
      `).run(builderIdNum, now, now);
      assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(insAss.lastInsertRowid);
    } else {
      // Mark assessment completed
      db.prepare(`UPDATE assessments SET status = 'COMPLETED', completed_at = ? WHERE id = ?`).run(now, assessment.id);
    }

    const adrJson = typeof adr_content === 'string' ? adr_content : JSON.stringify(adr_content);

    // Check if a submission already exists for this builder or assessment (support updates)
    const existingSub = db.prepare(`
      SELECT * FROM submissions 
      WHERE builder_id = ? OR assessment_id = ? 
      ORDER BY id DESC LIMIT 1
    `).get(builderIdNum, assessment.id);

    let subRowId;
    if (existingSub) {
      db.prepare(`
        UPDATE submissions
        SET assessment_id = ?,
            builder_id = ?,
            repository_url = ?,
            project_url = ?,
            adr_content = ?,
            integrity_status = 'PASSED',
            ai_analysis_status = 'COMPLETED',
            status = 'SUBMITTED',
            submitted_at = ?
        WHERE id = ?
      `).run(
        assessment.id,
        builderIdNum,
        repository_url,
        project_url || null,
        adrJson,
        now,
        existingSub.id
      );
      subRowId = existingSub.id;
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO submissions (
          assessment_id, builder_id, repository_url, project_url, adr_content,
          integrity_status, similarity_score, ai_analysis_status, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, 'PASSED', NULL, 'COMPLETED', 'SUBMITTED', ?)
      `);

      const result = insertStmt.run(
        assessment.id,
        builderIdNum,
        repository_url,
        project_url || null,
        adrJson,
        now
      );
      subRowId = result.lastInsertRowid;
    }

    // Run integrity check and Claude/AI analysis
    try {
      runIntegrityCheck(subRowId);
    } catch (e) {
      console.warn("Background integrity check note:", e.message);
    }

    try {
      await runClaudeAnalysis(subRowId);
    } catch (e) {
      console.warn("Background Claude analysis note:", e.message);
    }

    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subRowId);

    return res.status(201).json({
      success: true,
      data: {
        ...submission,
        adr_content: JSON.parse(submission.adr_content)
      }
    });
  } catch (err) {
    console.error("Submission creation/update error:", err);
    return res.status(500).json({ success: false, message: 'Failed to create or update submission: ' + err.message });
  }
});

// GET /api/submissions/builder/:builderId - Get latest submission for a builder
router.get('/builder/:builderId', (req, res) => {
  try {
    const builderId = Number(req.params.builderId);
    const submission = db.prepare('SELECT * FROM submissions WHERE builder_id = ? ORDER BY id DESC LIMIT 1').get(builderId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'No submission found for builder' });
    }
    return res.status(200).json({
      success: true,
      data: {
        ...submission,
        adr_content: submission.adr_content ? JSON.parse(submission.adr_content) : null,
        anti_gaming_report: submission.anti_gaming_report ? JSON.parse(submission.anti_gaming_report) : null,
        ai_advisory_rubric: submission.ai_advisory_rubric ? JSON.parse(submission.ai_advisory_rubric) : null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve submission for builder' });
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
