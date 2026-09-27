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

// GET /api/users/:id/builder-dashboard - Full real system state for builder dashboard
router.get('/:id/builder-dashboard', (req, res) => {
  try {
    const builderId = Number(req.params.id);
    const user = db.prepare('SELECT id, name, email, role, domain, skills, created_at FROM users WHERE id = ?').get(builderId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let parsedSkills = [];
    try {
      parsedSkills = user.skills ? JSON.parse(user.skills) : [];
    } catch {
      parsedSkills = [];
    }

    // 1. Resume
    const resume = db.prepare(`
      SELECT r.*, c.title as challenge_title, c.difficulty as challenge_difficulty, c.domain as challenge_domain
      FROM resumes r
      LEFT JOIN challenges c ON r.matched_challenge_id = c.id
      WHERE r.builder_id = ?
      ORDER BY r.id DESC LIMIT 1
    `).get(builderId);

    let extractedSkills = [];
    if (resume) {
      try {
        extractedSkills = resume.extracted_skills ? JSON.parse(resume.extracted_skills) : [];
      } catch {
        extractedSkills = [];
      }
    }

    const activeSkills = parsedSkills.length > 0 ? parsedSkills : extractedSkills;

    // 2. Assessment
    const assessment = db.prepare(`
      SELECT a.*, c.title as challenge_title, c.domain as challenge_domain, c.difficulty as challenge_difficulty
      FROM assessments a
      JOIN challenges c ON a.challenge_id = c.id
      WHERE a.builder_id = ?
      ORDER BY a.id DESC LIMIT 1
    `).get(builderId);

    let assessmentSkillScores = null;
    if (assessment && assessment.skill_scores) {
      try {
        assessmentSkillScores = JSON.parse(assessment.skill_scores);
      } catch {}
    }

    // 3. Submission
    const submission = db.prepare(`
      SELECT * FROM submissions WHERE builder_id = ? ORDER BY id DESC LIMIT 1
    `).get(builderId);

    // 4. Review
    let review = null;
    if (submission) {
      review = db.prepare(`
        SELECT r.*, u.name as reviewer_name 
        FROM reviews r 
        LEFT JOIN users u ON r.reviewer_id = u.id 
        WHERE r.submission_id = ? 
        ORDER BY r.id DESC LIMIT 1
      `).get(submission.id);
    }

    // 5. Scorecards
    const scorecards = db.prepare(`
      SELECT * FROM scorecards WHERE builder_id = ? ORDER BY issued_at DESC
    `).all(builderId);

    const formattedScorecards = scorecards.map(sc => {
      const isExpired = sc.valid_until && new Date(sc.valid_until) < new Date();
      return {
        ...sc,
        status: isExpired ? 'EXPIRED' : 'VALID',
        skill_scores: sc.skill_scores ? JSON.parse(sc.skill_scores) : {}
      };
    });

    const latestScorecard = formattedScorecards[0] || null;

    // 6. Ranking from real candidate leaderboard
    // Join builders with scorecards to compute deterministic ranking
    const candidateRows = db.prepare(`
      SELECT u.id as builder_id, u.name, s.overall_score, s.review_score, s.issued_at
      FROM users u
      INNER JOIN scorecards s ON u.id = s.builder_id
      WHERE u.role = 'BUILDER'
    `).all();

    // Deduplicate keeping highest overall_score
    const builderScoreMap = new Map();
    for (const r of candidateRows) {
      if (!builderScoreMap.has(r.builder_id) || r.overall_score > builderScoreMap.get(r.builder_id).overall_score) {
        builderScoreMap.set(r.builder_id, r);
      }
    }

    const leaderboard = Array.from(builderScoreMap.values()).sort((a, b) => b.overall_score - a.overall_score);
    const rankIndex = leaderboard.findIndex(c => Number(c.builder_id) === builderId);

    let ranking = {
      rank: null,
      rank_tier: 'Verification Pending',
      rank_badge: 'Unranked',
      total_ranked: leaderboard.length,
      description: 'Complete an assessment and peer review to receive an official ranking.'
    };

    if (rankIndex !== -1) {
      const tier = rankIndex === 0 ? 'Top 1%' : rankIndex < 3 ? 'Top 5%' : 'Top 10%';
      ranking = {
        rank: rankIndex + 1,
        rank_tier: tier,
        rank_badge: `#${rankIndex + 1} Ranked`,
        total_ranked: leaderboard.length,
        description: `Ranked #${rankIndex + 1} of ${leaderboard.length} verified builders.`
      };
    }

    // 7. Profile Completion calculation based on real system state
    let completionPct = 25; // Registered
    let completionMessage = 'Step 1 complete. Upload your resume to extract skills & unlock assessment.';
    
    if (resume) {
      completionPct += 25;
      completionMessage = 'Resume analyzed. Solve your practical assessment to advance.';
    }
    const hasCompletedAssessment = assessment?.status === 'COMPLETED' || db.prepare("SELECT id FROM assessments WHERE builder_id = ? AND status = 'COMPLETED' LIMIT 1").get(builderId);
    if (hasCompletedAssessment || latestScorecard) {
      completionPct += 25;
      completionMessage = 'Assessment passed. Submit code & ADR for reviewer verification.';
    }
    if (latestScorecard) {
      completionPct += 25;
      completionMessage = 'All verification stages passed. Your 2-year scorecard is published.';
    }

    // 8. 6-Stage Prominent Verification Pipeline
    const stages = [
      {
        id: 'assessment',
        title: 'Assessment',
        status: assessment?.status === 'COMPLETED'
          ? `Completed (${assessment.score || 0}/100)`
          : assessment?.status === 'IN_PROGRESS'
          ? 'In Progress'
          : 'Not Started',
        state: assessment?.status === 'COMPLETED' ? 'COMPLETED' : assessment?.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING'
      },
      {
        id: 'submission',
        title: 'Submission',
        status: submission
          ? `Submitted (${submission.repository_url ? 'Repo + ADR' : 'ADR on file'})`
          : 'Not Submitted',
        state: submission ? 'COMPLETED' : 'PENDING'
      },
      {
        id: 'integrity',
        title: 'Integrity',
        status: submission?.integrity_status === 'PASSED'
          ? `Passed (${submission.similarity_score !== null ? (100 - submission.similarity_score) + '% Original' : 'No Flags'})`
          : submission?.integrity_status === 'FLAGGED'
          ? 'Flagged for Review'
          : submission ? 'Running Checks' : 'Pending Submission',
        state: submission?.integrity_status === 'PASSED' ? 'COMPLETED' : submission?.integrity_status === 'FLAGGED' ? 'FLAGGED' : 'PENDING'
      },
      {
        id: 'ai_analysis',
        title: 'AI Analysis',
        status: submission?.ai_analysis_status === 'COMPLETED'
          ? 'Completed (Reference Only)'
          : submission ? 'In Queue' : 'Pending Submission',
        state: submission?.ai_analysis_status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'
      },
      {
        id: 'reviewer',
        title: 'Reviewer',
        status: review && review.status === 'COMPLETED'
          ? `Verified (${review.reviewer_name || 'Assigned Reviewer'})`
          : submission ? 'Under Review' : 'Pending Submission',
        state: review && review.status === 'COMPLETED' ? 'COMPLETED' : submission ? 'IN_PROGRESS' : 'PENDING'
      },
      {
        id: 'scorecard',
        title: 'Scorecard',
        status: latestScorecard
          ? `Generated (2-Yr Valid)`
          : 'Pending Verification',
        state: latestScorecard ? 'COMPLETED' : 'PENDING'
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          domain: resume?.challenge_domain || user.domain || 'Engineering',
          skills: activeSkills,
          created_at: user.created_at
        },
        profile_completion: {
          percentage: completionPct,
          message: completionMessage
        },
        ranking,
        resume: resume ? {
          id: resume.id,
          filename: resume.filename,
          extracted_skills: extractedSkills,
          domain: resume.domain,
          experience_years: resume.experience_years,
          challenge_title: resume.challenge_title,
          challenge_difficulty: resume.challenge_difficulty
        } : null,
        assessment: assessment ? {
          id: assessment.id,
          challenge_id: assessment.challenge_id,
          challenge_title: assessment.challenge_title,
          challenge_domain: assessment.challenge_domain,
          challenge_difficulty: assessment.challenge_difficulty,
          status: assessment.status,
          score: assessment.score,
          skill_scores: assessmentSkillScores,
          started_at: assessment.started_at,
          completed_at: assessment.completed_at
        } : null,
        submission: submission ? {
          id: submission.id,
          repository_url: submission.repository_url,
          project_url: submission.project_url,
          integrity_status: submission.integrity_status,
          similarity_score: submission.similarity_score,
          ai_analysis_status: submission.ai_analysis_status,
          status: submission.status,
          submitted_at: submission.submitted_at
        } : null,
        review: review ? {
          id: review.id,
          reviewer_name: review.reviewer_name,
          overall_score: review.overall_score,
          feedback: review.feedback,
          recommendation: review.recommendation,
          status: review.status
        } : null,
        scorecard: latestScorecard,
        scorecards: formattedScorecards,
        stages
      }
    });
  } catch (err) {
    console.error('Builder dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve builder dashboard data' });
  }
});

export default router;
