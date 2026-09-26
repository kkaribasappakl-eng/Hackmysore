// server/routes/candidates.js
import express from 'express';
import { db, computeScorecardStatus } from '../db.js';

const router = express.Router();

// Helper to query and assemble ranked candidates
export function getRankedCandidatesList(filters = {}) {
  const { skill, domain, minScore, sort } = filters;

  // Join builders with their scorecards
  const rows = db.prepare(`
    SELECT 
      u.id as builder_id,
      u.name,
      u.email,
      u.domain as user_domain,
      u.skills as user_skills,
      s.id as scorecard_id,
      s.domain as scorecard_domain,
      s.overall_score,
      s.review_score,
      s.skill_scores,
      s.issued_at,
      s.valid_until
    FROM users u
    INNER JOIN scorecards s ON u.id = s.builder_id
    WHERE u.role = 'BUILDER'
  `).all();

  // Deduplicate by builder (keep highest overall_score)
  const builderMap = new Map();
  for (const r of rows) {
    if (!builderMap.has(r.builder_id) || r.overall_score > builderMap.get(r.builder_id).overall_score) {
      builderMap.set(r.builder_id, r);
    }
  }

  // Format candidate records
  let candidates = Array.from(builderMap.values()).map(r => {
    let parsedSkillScores = {};
    try {
      parsedSkillScores = r.skill_scores ? JSON.parse(r.skill_scores) : {};
    } catch {
      parsedSkillScores = {};
    }

    const verifiedSkills = Object.keys(parsedSkillScores);
    let userSkills = [];
    try {
      userSkills = r.user_skills ? JSON.parse(r.user_skills) : [];
    } catch {
      userSkills = [];
    }

    // Deterministic ranking formula:
    // ranking_score = difficulty_weight * review_score * reviewer_credibility_weight * recency_decay
    const difficulty_weight = 1.0; // Intermediate challenge baseline
    const reviewer_credibility_weight = 1.0; // Authoritative human reviewer baseline
    const issuedDate = new Date(r.issued_at || Date.now());
    const daysSinceIssued = Math.max(0, Math.floor((Date.now() - issuedDate.getTime()) / (1000 * 60 * 60 * 24)));
    // Recency decay over 2-year validity period (730 days) from 1.0 down to a minimum of 0.85
    const recency_decay = Number(Math.max(0.85, 1.0 - (daysSinceIssued / 730) * 0.15).toFixed(4));
    const effectiveReviewScore = r.review_score || r.overall_score || 85;
    const ranking_score = Number((difficulty_weight * effectiveReviewScore * reviewer_credibility_weight * recency_decay).toFixed(2));

    return {
      id: r.builder_id,
      builder_id: r.builder_id,
      name: r.name,
      email: r.email,
      domain: r.scorecard_domain || r.user_domain || 'Backend Engineering',
      skills: userSkills,
      overall_score: r.overall_score,
      score: r.overall_score,
      review_score: r.review_score,
      difficulty_weight,
      reviewer_credibility_weight,
      recency_decay,
      ranking_score,
      skill_scores: parsedSkillScores,
      verified_skills: verifiedSkills.length > 0 ? verifiedSkills : userSkills,
      scorecard_id: r.scorecard_id,
      scorecard_status: computeScorecardStatus(r.valid_until),
      issued_at: r.issued_at,
      valid_until: r.valid_until
    };
  });

  // Apply filters
  if (skill && skill !== 'All') {
    const targetSkill = String(skill).toLowerCase();
    candidates = candidates.filter(c =>
      c.verified_skills.some(s => s.toLowerCase() === targetSkill || s.toLowerCase().includes(targetSkill)) ||
      c.skills.some(s => s.toLowerCase() === targetSkill || s.toLowerCase().includes(targetSkill))
    );
  }

  if (domain && domain !== 'All') {
    const targetDomain = decodeURIComponent(String(domain)).toLowerCase();
    candidates = candidates.filter(c =>
      c.domain && c.domain.toLowerCase() === targetDomain
    );
  }

  if (minScore !== undefined && minScore !== null && minScore !== '') {
    const min = parseFloat(minScore);
    if (!isNaN(min)) {
      candidates = candidates.filter(c => c.overall_score >= min);
    }
  }

  // Sort candidates
  if (sort === 'recent') {
    candidates.sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at));
  } else {
    // Default: Sort by overall_score descending (Ranking order)
    candidates.sort((a, b) => {
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }
      return (b.ranking_score || b.review_score || 0) - (a.ranking_score || a.review_score || 0);
    });
  }

  // Assign ranks
  return candidates.map((c, idx) => ({
    ...c,
    rank: idx + 1,
    rank_badge: `#${idx + 1} Ranked`,
    rank_tier: idx === 0 ? 'Top 1%' : idx < 3 ? 'Top 5%' : 'Top 10%'
  }));
}

export function getRankingsSummary(filters = {}) {
  const candidates = getRankedCandidatesList(filters);
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + c.overall_score, 0) / candidates.length)
    : 85;

  return {
    leaderboard: candidates,
    top_candidate: candidates[0] || null,
    total_verified: candidates.length,
    average_score: avgScore
  };
}

export function getRankingEventsList() {
  return db.prepare(`
    SELECT r.*, u.name as candidate_name, u.domain as candidate_domain
    FROM ranking_events r
    LEFT JOIN users u ON r.builder_id = u.id
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all();
}

// GET /api/candidates/rankings/events - Ranking history and verified events
router.get('/rankings/events', (req, res) => {
  try {
    const events = getRankingEventsList();
    return res.status(200).json({
      success: true,
      data: events
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ranking events' });
  }
});

// GET /api/candidates/rankings - Official verified talent leaderboard
router.get('/rankings', (req, res) => {
  try {
    const data = getRankingsSummary(req.query);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve rankings' });
  }
});

// GET /api/candidates - Discover verified candidates with optional filtering and ranking
router.get('/', (req, res) => {
  try {
    const candidates = getRankedCandidatesList(req.query);
    return res.status(200).json({
      success: true,
      data: candidates
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve candidates' });
  }
});

export default router;
