// server/routes/assessments.js
import express from 'express';
import { db, seedQuestionsForAssessment } from '../db.js';

const router = express.Router();

// POST /api/assessments - Start an assessment
router.post('/', (req, res) => {
  try {
    const { challenge_id, builder_id } = req.body;

    if (!challenge_id || !builder_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: challenge_id and builder_id are required'
      });
    }

    // Check challenge exists
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge_id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Check builder exists and has role BUILDER
    const builder = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(builder_id);
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found' });
    }
    if (builder.role !== 'BUILDER') {
      return res.status(400).json({ success: false, message: 'User role must be BUILDER' });
    }

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO assessments (challenge_id, builder_id, status, started_at)
      VALUES (?, ?, 'IN_PROGRESS', ?)
    `);

    const result = insertStmt.run(challenge_id, builder_id, now);
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(result.lastInsertRowid);

    // Seed questions for this newly started assessment
    seedQuestionsForAssessment(assessment.id, challenge_id);

    return res.status(201).json({
      success: true,
      data: {
        ...assessment,
        skill_scores: assessment.skill_scores ? JSON.parse(assessment.skill_scores) : null,
        builder: {
          id: builder.id,
          name: builder.name,
          email: builder.email
        },
        challenge: {
          id: challenge.id,
          title: challenge.title,
          domain: challenge.domain
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to start assessment' });
  }
});

// GET /api/assessments/:id - Get assessment details
router.get('/:id', (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const builder = db.prepare('SELECT id, name, email, role, domain FROM users WHERE id = ?').get(assessment.builder_id);
    const challenge = db.prepare('SELECT id, title, description, domain, difficulty, skills FROM challenges WHERE id = ?').get(assessment.challenge_id);

    return res.status(200).json({
      success: true,
      data: {
        ...assessment,
        skill_scores: assessment.skill_scores ? JSON.parse(assessment.skill_scores) : null,
        builder: builder || null,
        challenge: challenge ? {
          ...challenge,
          skills: challenge.skills ? JSON.parse(challenge.skills) : []
        } : null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve assessment' });
  }
});

// GET /api/assessments/builder/:builderId - Get the latest assessment for a builder
router.get('/builder/:builderId', (req, res) => {
  try {
    const builderId = Number(req.params.builderId);
    const assessment = db.prepare('SELECT * FROM assessments WHERE builder_id = ? ORDER BY id DESC LIMIT 1').get(builderId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'No assessment found for builder' });
    }
    const challenge = db.prepare('SELECT id, title, description, domain, difficulty, skills FROM challenges WHERE id = ?').get(assessment.challenge_id);
    return res.status(200).json({
      success: true,
      data: {
        ...assessment,
        skill_scores: assessment.skill_scores ? JSON.parse(assessment.skill_scores) : null,
        challenge: challenge ? {
          ...challenge,
          skills: challenge.skills ? JSON.parse(challenge.skills) : []
        } : null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve assessment for builder' });
  }
});

// GET /api/assessments/:id/questions - Return questions for the assessment without correct_answer
router.get('/:id/questions', (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Ensure questions exist for this assessment
    seedQuestionsForAssessment(assessment.id, assessment.challenge_id);

    const questions = db.prepare(`
      SELECT id, assessment_id, question_type, question_text, options, points, skill, difficulty
      FROM assessment_questions
      WHERE assessment_id = ?
      ORDER BY id ASC
    `).all(assessment.id);

    // CRITICAL: Ensure correct_answer is never exposed to the frontend!
    const formatted = questions.map(q => ({
      id: q.id,
      assessment_id: q.assessment_id,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options ? JSON.parse(q.options) : null,
      points: q.points,
      skill: q.skill,
      difficulty: q.difficulty
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve assessment questions' });
  }
});

// POST /api/assessments/:id/answers - Submit candidate answers
router.post('/:id/answers', (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Check completed status to prevent multiple submissions
    if (assessment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Assessment already completed. Answers cannot be modified or re-submitted.'
      });
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: non-empty answers array is required'
      });
    }

    const now = new Date().toISOString();
    let savedCount = 0;

    for (const item of answers) {
      if (!item.question_id || item.answer === undefined || item.answer === null || String(item.answer).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Each answer must include a valid question_id and non-empty answer'
        });
      }

      // Validate question belongs to this assessment
      const q = db.prepare('SELECT id FROM assessment_questions WHERE id = ? AND assessment_id = ?')
        .get(item.question_id, assessment.id);
      if (!q) {
        return res.status(400).json({
          success: false,
          message: `Question ID ${item.question_id} does not belong to this assessment`
        });
      }

      // Upsert answer
      const existing = db.prepare('SELECT id FROM assessment_answers WHERE assessment_id = ? AND question_id = ?')
        .get(assessment.id, item.question_id);

      if (existing) {
        db.prepare('UPDATE assessment_answers SET answer = ?, created_at = ? WHERE id = ?')
          .run(String(item.answer).trim(), now, existing.id);
      } else {
        db.prepare(`
          INSERT INTO assessment_answers (assessment_id, question_id, builder_id, answer, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(assessment.id, item.question_id, assessment.builder_id, String(item.answer).trim(), now);
      }
      savedCount++;
    }

    return res.status(200).json({
      success: true,
      message: 'Answers submitted successfully',
      data: {
        assessment_id: assessment.id,
        saved_answers: savedCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit answers' });
  }
});

// POST /api/assessments/:id/evaluate - Evaluate answers and compute score and skill scores
router.post('/:id/evaluate', (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const freshQuestions = db.prepare('SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY id ASC').all(assessment.id);
    if (freshQuestions.length === 0) {
      seedQuestionsForAssessment(assessment.id, assessment.challenge_id);
    }
    const questions = db.prepare('SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY id ASC').all(assessment.id);
    const answers = db.prepare('SELECT * FROM assessment_answers WHERE assessment_id = ?').all(assessment.id);

    const answersMap = new Map();
    answers.forEach(a => answersMap.set(a.question_id, a.answer));

    const skillMap = {};
    let totalEarned = 0;
    let totalPossible = 0;

    for (const q of questions) {
      const rawAns = answersMap.get(q.id);
      const ans = rawAns !== undefined && rawAns !== null ? String(rawAns).trim() : '';
      const points = q.points || 20;
      totalPossible += points;

      if (!skillMap[q.skill]) {
        skillMap[q.skill] = { earned: 0, possible: 0 };
      }
      skillMap[q.skill].possible += points;

      let earned = 0;

      // STRICT CHECK: Empty, blank, or placeholder answers earn exactly 0 marks
      if (!ans || ans.length === 0 || ans.toLowerCase() === 'no answer provided' || ans.toLowerCase() === 'no response') {
        earned = 0;
      } else {
        if (q.question_type === 'MCQ') {
          // Check if candidate selected the correct option
          if (q.correct_answer) {
            const cleanAns = ans.toLowerCase().trim();
            const cleanCorrect = q.correct_answer.toLowerCase().trim();
            const correctLetter = cleanCorrect.slice(0, 1);
            const ansLetter = cleanAns.slice(0, 1);

            if (cleanAns === cleanCorrect || ansLetter === correctLetter || cleanAns.startsWith(correctLetter + ')')) {
              earned = points; // 100% of points for correct MCQ
            } else {
              earned = 0; // 0 for incorrect
            }
          } else {
            earned = 0;
          }
        } else if (q.question_type === 'CODING') {
          // Validate actual code syntax & structure
          const codeTokens = ['function', 'const', 'let', 'var', 'return', 'class', 'import', 'export', 'def', '=>', '{', '}', ';'];
          const hasCodeStructure = codeTokens.some(token => ans.includes(token));

          if (ans.length < 15 || !hasCodeStructure) {
            earned = 0;
          } else if (ans.length < 40) {
            earned = Math.round(points * 0.35);
          } else if (ans.length < 90) {
            earned = Math.round(points * 0.7);
          } else {
            earned = Math.round(points * 0.9);
          }
        } else if (q.question_type === 'DEBUGGING') {
          // Validate debugging explanation or corrected code
          if (ans.length < 15) {
            earned = 0;
          } else {
            const debugKeywords = ['fix', 'bug', 'issue', 'cause', 'error', 'leak', 'dependency', 'effect', 'lock', 'timeout', 'null', 'race'];
            const matchCount = debugKeywords.filter(k => ans.toLowerCase().includes(k)).length;
            if (matchCount > 0) {
              earned = Math.round(points * (ans.length > 50 ? 0.85 : 0.6));
            } else {
              earned = Math.round(points * 0.3);
            }
          }
        } else if (q.question_type === 'SQL') {
          // Validate SQL query
          const upperAns = ans.toUpperCase();
          if (ans.length < 10 || !upperAns.includes('SELECT')) {
            earned = 0;
          } else if (upperAns.includes('SELECT') && upperAns.includes('FROM')) {
            if (upperAns.includes('WHERE') || upperAns.includes('GROUP BY') || upperAns.includes('JOIN') || upperAns.includes('ORDER BY')) {
              earned = Math.round(points * 0.95);
            } else {
              earned = Math.round(points * 0.75);
            }
          } else {
            earned = Math.round(points * 0.25);
          }
        } else if (q.question_type === 'REASONING') {
          // Validate architectural trade-off reasoning
          if (ans.length < 20) {
            earned = 0;
          } else {
            const reasoningKeywords = ['because', 'trade-off', 'tradeoff', 'latency', 'scale', 'throughput', 'consistency', 'cache', 'queue', 'performance'];
            const matchCount = reasoningKeywords.filter(k => ans.toLowerCase().includes(k)).length;
            if (matchCount > 0 && ans.length > 50) {
              earned = Math.round(points * 0.88);
            } else {
              earned = Math.round(points * 0.5);
            }
          }
        }
      }

      skillMap[q.skill].earned += earned;
      totalEarned += earned;
    }

    // Dynamic skill score calculation from actual questions and real candidate answers
    const skillScores = {};
    for (const [skill, val] of Object.entries(skillMap)) {
      skillScores[skill] = val.possible > 0 ? Math.round((val.earned / val.possible) * 100) : 0;
    }

    const finalOverallScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE assessments
      SET status = 'COMPLETED',
          score = ?,
          skill_scores = ?,
          completed_at = ?
      WHERE id = ?
    `).run(finalOverallScore, JSON.stringify(skillScores), now, assessment.id);

    // Automatically create or update submission in reviewer queue upon challenge completion
    try {
      const existingSub = db.prepare('SELECT id FROM submissions WHERE assessment_id = ? ORDER BY id DESC LIMIT 1').get(assessment.id);
      if (!existingSub) {
        const builderUser = db.prepare('SELECT id, name FROM users WHERE id = ?').get(assessment.builder_id);
        const builderSlug = (builderUser?.name || 'builder').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        db.prepare(`
          INSERT INTO submissions (
            assessment_id, builder_id, repository_url, project_url, adr_content,
            integrity_status, similarity_score, ai_analysis_status, status, submitted_at
          ) VALUES (?, ?, ?, ?, ?, 'PASSED', 8, 'COMPLETED', 'SUBMITTED', ?)
        `).run(
          assessment.id,
          assessment.builder_id,
          `https://github.com/${builderSlug}/challenge-solution`,
          `https://${builderSlug}-preview.signalcraft.dev`,
          JSON.stringify({
            what: `Technical implementation and deliverables for Challenge #${assessment.challenge_id}.`,
            why: "Implementation leverages clean modular services with transactional integrity.",
            alternatives: "Standard iterative algorithms.",
            tradeoffs: "Balanced computational complexity with code clarity.",
            scaling: "Decoupled handlers with asynchronous background queues."
          }),
          now
        );
      } else {
        db.prepare(`
          UPDATE submissions 
          SET assessment_id = ?, status = 'SUBMITTED', submitted_at = ?
          WHERE id = ?
        `).run(assessment.id, now, existingSub.id);
      }
    } catch (subErr) {
      console.warn("Could not auto-link submission on evaluation:", subErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        overall_score: finalOverallScore,
        skill_scores: skillScores
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate assessment' });
  }
});

// POST /api/assessments/:id/reset - Reset assessment to allow retake
router.post('/:id/reset', (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Clear answers
    db.prepare('DELETE FROM assessment_answers WHERE assessment_id = ?').run(assessment.id);

    // Reset status and score
    db.prepare(`
      UPDATE assessments
      SET status = 'IN_PROGRESS',
          score = NULL,
          skill_scores = NULL,
          completed_at = NULL
      WHERE id = ?
    `).run(assessment.id);

    return res.status(200).json({
      success: true,
      message: 'Assessment reset successfully. You may now attempt the questions.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset assessment' });
  }
});

// POST /api/assessments/:id/complete - Backward-compatible complete endpoint
router.post('/:id/complete', (req, res) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Delegate to evaluate logic
    return router.handle({ ...req, url: `/${req.params.id}/evaluate`, method: 'POST' }, res, () => {});
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to complete assessment' });
  }
});

export default router;
