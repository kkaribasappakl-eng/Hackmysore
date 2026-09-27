// server/routes/scorecards.js
import express from 'express';
import { db, computeScorecardStatus, addTwoYears, formatDate } from '../db.js';

const router = express.Router();

// Helper to format scorecard output with dynamic status calculation
function formatScorecard(sc) {
  const dynamicStatus = computeScorecardStatus(sc.valid_until);
  const builder = db.prepare('SELECT id, name, email, domain FROM users WHERE id = ?').get(sc.builder_id);
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(sc.review_id);
  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(sc.assessment_id);

  return {
    id: sc.id,
    builder_id: sc.builder_id,
    assessment_id: sc.assessment_id,
    review_id: sc.review_id,
    builder: builder ? builder.name : 'Unknown',
    builder_name: builder ? builder.name : 'Unknown',
    domain: sc.domain,
    overall_score: sc.overall_score,
    assessment_score: assessment?.score ?? 0,
    review_score: sc.review_score,
    skill_scores: sc.skill_scores ? JSON.parse(sc.skill_scores) : {},
    issued_at: sc.issued_at,
    valid_until: sc.valid_until,
    status: dynamicStatus,
    reviewer_comments: review?.comments || review?.feedback || null,
    rubric_scores: review ? {
      correctness: review.correctness,
      architecture: review.architecture,
      code_quality: review.code_quality,
      tradeoff_awareness: review.tradeoff_awareness
    } : null,
    authoritative: true,
    verification_hash: `0x${Buffer.from(sc.id + sc.builder_id + sc.issued_at).toString('hex').slice(0, 16)}`
  };
}

// POST /api/scorecards/generate - Generate 2-year verified scorecard
router.post('/generate', (req, res) => {
  try {
    const { builder_id, assessment_id, review_id } = req.body;

    if (!builder_id || !assessment_id || !review_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: builder_id, assessment_id, and review_id are required'
      });
    }

    // Validate builder
    const builder = db.prepare('SELECT id, name, domain FROM users WHERE id = ?').get(builder_id);
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found' });
    }

    // Validate assessment
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessment_id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    if (assessment.builder_id !== builder_id) {
      return res.status(400).json({ success: false, message: 'Assessment does not belong to the specified builder' });
    }

    // Validate review
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(review_id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Review must be completed before generating a scorecard' });
    }

    // Validate review belongs to a submission for that assessment
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(review.submission_id);
    if (!submission || submission.assessment_id !== assessment_id) {
      return res.status(400).json({ success: false, message: 'Review does not match the assessment submission' });
    }

    // Determine domain and unique ID
    const challenge = db.prepare('SELECT id, domain FROM challenges WHERE id = ?').get(assessment.challenge_id);
    const domain = challenge ? challenge.domain : (builder.domain || 'Backend Engineering');
    
    // Check if scorecard already generated for this assessment
    const existing = db.prepare('SELECT * FROM scorecards WHERE assessment_id = ?').get(assessment_id);
    if (existing) {
      return res.status(200).json({
        success: true,
        data: formatScorecard(existing),
        message: 'Scorecard already exists for this assessment'
      });
    }

    // Domain code for scorecard ID
    const domainCode = domain.toLowerCase().includes('frontend') ? 'FE' : 'BE';
    const now = new Date();
    const currentYear = now.getFullYear();

    const countRow = db.prepare("SELECT COUNT(*) as count FROM scorecards WHERE id LIKE ?").get(`SC-${domainCode}-${currentYear}-%`);
    const nextSeq = String((countRow ? countRow.count : 0) + 1).padStart(3, '0');
    const scorecardId = `SC-${domainCode}-${currentYear}-${nextSeq}`;

    const issued_at = formatDate(now);
    const valid_until = addTwoYears(issued_at);
    const assessment_score = assessment.score !== undefined && assessment.score !== null ? assessment.score : 0;
    const review_score = Math.round((review.overall_score / 5) * 100);
    // Composite verified score combines assessment performance (40%) and authoritative reviewer score (60%)
    const composite_score = Math.round(assessment_score * 0.4 + review_score * 0.6);
    const overall_score = composite_score;

    const skill_scores = assessment.skill_scores || JSON.stringify({});

    const insertStmt = db.prepare(`
      INSERT INTO scorecards (
        id, builder_id, assessment_id, review_id, domain,
        overall_score, skill_scores, review_score, issued_at, valid_until, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALID')
    `);

    insertStmt.run(
      scorecardId,
      builder_id,
      assessment_id,
      review_id,
      domain,
      overall_score,
      skill_scores,
      review_score,
      issued_at,
      valid_until
    );

    try {
      db.prepare(`
        INSERT INTO ranking_events (builder_id, scorecard_id, event_type, score, details, created_at)
        VALUES (?, ?, 'SCORECARD_VERIFIED', ?, ?, ?)
      `).run(builder_id, scorecardId, overall_score, `Scorecard ${scorecardId} generated with composite score ${overall_score}`, issued_at);
    } catch {}

    const created = db.prepare('SELECT * FROM scorecards WHERE id = ?').get(scorecardId);

    return res.status(201).json({
      success: true,
      data: formatScorecard(created)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate scorecard' });
  }
});

// GET /api/scorecards/:id - Retrieve scorecard with dynamic validity check
router.get('/:id', (req, res) => {
  try {
    const sc = db.prepare('SELECT * FROM scorecards WHERE id = ?').get(req.params.id);
    if (!sc) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    return res.status(200).json({
      success: true,
      data: formatScorecard(sc)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve scorecard' });
  }
});

// GET /api/scorecards/builder/:builderId - Return all scorecards for a builder
router.get('/builder/:builderId', (req, res) => {
  try {
    const scorecards = db.prepare('SELECT * FROM scorecards WHERE builder_id = ?').all(req.params.builderId);
    const formatted = scorecards.map(formatScorecard);
    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve builder scorecards' });
  }
});

// GET /api/scorecards/verify/:scorecardId - Recruiter verification endpoint
router.get('/verify/:scorecardId', (req, res) => {
  try {
    const sc = db.prepare('SELECT * FROM scorecards WHERE id = ?').get(req.params.scorecardId);
    if (!sc) {
      return res.status(404).json({ success: false, message: 'Scorecard not found' });
    }

    const builder = db.prepare('SELECT name FROM users WHERE id = ?').get(sc.builder_id);
    const dynamicStatus = computeScorecardStatus(sc.valid_until);

    return res.status(200).json({
      success: true,
      data: {
        scorecard_id: sc.id,
        status: dynamicStatus,
        valid_until: sc.valid_until,
        builder: builder ? builder.name : 'Unknown',
        domain: sc.domain,
        overall_score: sc.overall_score
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify scorecard' });
  }
});

export default router;
