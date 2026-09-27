// server/routes/resume.js
import express from 'express';
import { db, seedQuestionsForAssessment } from '../db.js';

const router = express.Router();

// Known technical skills dictionary with categories
const SKILL_TAXONOMY = {
  // Python & Data / ML
  'Python': { domain: 'Backend Engineering', weight: 1.0, tags: ['language', 'backend', 'data'] },
  'FastAPI': { domain: 'Backend Engineering', weight: 1.0, tags: ['api', 'async', 'python'] },
  'Django': { domain: 'Backend Engineering', weight: 0.9, tags: ['framework', 'mvc', 'python'] },
  'Flask': { domain: 'Backend Engineering', weight: 0.8, tags: ['microframework', 'python', 'api'] },
  'Pandas': { domain: 'Data Engineering', weight: 0.8, tags: ['data', 'analytics', 'python'] },
  'NumPy': { domain: 'Data Engineering', weight: 0.8, tags: ['math', 'arrays', 'python'] },
  'PyTorch': { domain: 'Machine Learning', weight: 0.9, tags: ['ai', 'deep-learning', 'python'] },
  'Machine Learning': { domain: 'Machine Learning', weight: 0.9, tags: ['ai', 'models', 'algorithms'] },

  // Node & JavaScript / TypeScript
  'Node.js': { domain: 'Backend Engineering', weight: 1.0, tags: ['runtime', 'backend', 'async'] },
  'Express': { domain: 'Backend Engineering', weight: 0.9, tags: ['framework', 'http', 'api'] },
  'NestJS': { domain: 'Backend Engineering', weight: 0.9, tags: ['framework', 'typescript', 'backend'] },
  'JavaScript': { domain: 'Frontend Engineering', weight: 0.9, tags: ['language', 'web', 'es6'] },
  'TypeScript': { domain: 'Fullstack Engineering', weight: 0.9, tags: ['type-safety', 'frontend', 'backend'] },
  'React': { domain: 'Frontend Engineering', weight: 1.0, tags: ['ui', 'components', 'spa'] },
  'Next.js': { domain: 'Frontend Engineering', weight: 0.9, tags: ['ssr', 'react', 'fullstack'] },
  'Tailwind CSS': { domain: 'Frontend Engineering', weight: 0.8, tags: ['css', 'styling', 'responsive'] },
  'Redux': { domain: 'Frontend Engineering', weight: 0.8, tags: ['state', 'flux', 'ui'] },
  'HTML5/CSS3': { domain: 'Frontend Engineering', weight: 0.8, tags: ['web', 'markup', 'styling'] },

  // Go
  'Go': { domain: 'Systems & Backend', weight: 1.0, tags: ['language', 'concurrency', 'systems'] },
  'Golang': { domain: 'Systems & Backend', weight: 1.0, tags: ['language', 'concurrency', 'systems'] },
  'Gin': { domain: 'Systems & Backend', weight: 0.9, tags: ['framework', 'http', 'go'] },

  // Java & Backend Core
  'Java': { domain: 'Backend Engineering', weight: 1.0, tags: ['core', 'oop', 'jvm'] },
  'Spring Boot': { domain: 'Backend Engineering', weight: 1.0, tags: ['framework', 'backend', 'microservices'] },
  'SQL': { domain: 'Backend Engineering', weight: 0.9, tags: ['database', 'queries', 'rdbms'] },
  'PostgreSQL': { domain: 'Backend Engineering', weight: 0.9, tags: ['database', 'acid', 'sql'] },
  'MySQL': { domain: 'Backend Engineering', weight: 0.8, tags: ['database', 'sql'] },
  'MongoDB': { domain: 'Backend Engineering', weight: 0.8, tags: ['nosql', 'document', 'database'] },
  'REST API': { domain: 'Backend Engineering', weight: 0.9, tags: ['api', 'http', 'architecture'] },
  'Microservices': { domain: 'Backend Engineering', weight: 0.9, tags: ['distributed', 'cloud', 'architecture'] },
  'Kafka': { domain: 'Backend Engineering', weight: 0.9, tags: ['streaming', 'events', 'concurrency'] },
  'Redis': { domain: 'Backend Engineering', weight: 0.8, tags: ['cache', 'in-memory', 'performance'] },
  'Docker': { domain: 'DevOps / Cloud', weight: 0.8, tags: ['containerization', 'infrastructure'] },
  'Kubernetes': { domain: 'DevOps / Cloud', weight: 0.8, tags: ['orchestration', 'cloud'] },
  'Debugging': { domain: 'Engineering Core', weight: 0.9, tags: ['troubleshooting', 'performance'] },
  'Concurrency': { domain: 'Backend Engineering', weight: 0.9, tags: ['threads', 'locking', 'parallel'] }
};

/**
 * Intelligent skill extraction from unstructured resume text
 */
function extractSkillsFromText(text) {
  if (!text || typeof text !== 'string') return { skills: ['Software Engineering', 'Problem Solving', 'Data Structures', 'REST API'], confidenceScores: {}, domain: 'Backend Engineering', experienceYears: 2.5 };

  const lower = text.toLowerCase();
  const detected = [];
  const confidenceScores = {};
  const domainCounts = {};

  for (const [skill, meta] of Object.entries(SKILL_TAXONOMY)) {
    const skillLower = skill.toLowerCase();
    // Regular expression match with word boundaries
    const escaped = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');

    if (regex.test(lower)) {
      // Calculate realistic confidence score (86 - 98%)
      const matchCount = (lower.match(new RegExp(escaped, 'gi')) || []).length;
      const baseConfidence = 85 + Math.min(13, matchCount * 3);
      confidenceScores[skill] = baseConfidence;
      detected.push(skill);

      domainCounts[meta.domain] = (domainCounts[meta.domain] || 0) + meta.weight;
    }
  }

  // Fallback if no skills detected
  if (detected.length === 0) {
    detected.push('Software Engineering', 'Problem Solving', 'Data Structures', 'REST API');
    confidenceScores['Software Engineering'] = 90;
    confidenceScores['Problem Solving'] = 92;
    confidenceScores['Data Structures'] = 88;
    confidenceScores['REST API'] = 89;
    domainCounts['Backend Engineering'] = 3.0;
  }

  // Determine primary domain
  let primaryDomain = 'Backend Engineering';
  let maxWeight = 0;
  for (const [dom, weight] of Object.entries(domainCounts)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      primaryDomain = dom;
    }
  }

  // Estimate experience from text mentions like "X years", "2021-2024", etc.
  let experienceYears = 2.5;
  const expMatch = lower.match(/(\d+)\+?\s*years?(?:\s+of)?\s+experience/i);
  if (expMatch && expMatch[1]) {
    experienceYears = Math.min(10, Math.max(1, parseFloat(expMatch[1])));
  }

  return {
    skills: detected,
    confidenceScores,
    domain: primaryDomain,
    experienceYears
  };
}

/**
 * Match extracted skills to a Medium-level practical challenge
 */
function matchChallengeForSkills(skills, domain) {
  const challenges = db.prepare('SELECT * FROM challenges').all();

  // Prefer Intermediate / Medium challenges
  const intermediateChallenges = challenges.filter(c => c.difficulty.toLowerCase() === 'intermediate');
  const pool = intermediateChallenges.length > 0 ? intermediateChallenges : challenges;

  // Score match against challenge required skills
  let bestChallenge = pool[0];
  let highestScore = -1;

  for (const ch of pool) {
    let chSkills = [];
    try {
      chSkills = typeof ch.skills === 'string' ? JSON.parse(ch.skills) : (ch.skills || []);
    } catch {
      chSkills = [];
    }

    let matchCount = 0;
    for (const s of skills) {
      if (chSkills.some(cs => cs.toLowerCase() === s.toLowerCase())) {
        matchCount += 2;
      }
    }

    if (ch.domain.toLowerCase() === domain.toLowerCase()) {
      matchCount += 1;
    }

    if (matchCount > highestScore) {
      highestScore = matchCount;
      bestChallenge = ch;
    }
  }

  return bestChallenge || challenges[0];
}

/**
 * POST /api/resume/upload
 * Analyzes resume, extracts skills, creates a tailored medium assessment
 */
router.post('/upload', (req, res) => {
  try {
    const { builder_id, resume_text, filename = 'resume.pdf' } = req.body;

    if (!builder_id) {
      return res.status(400).json({
        success: false,
        message: 'builder_id is required'
      });
    }

    const builderIdNum = Number(builder_id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(builderIdNum);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Builder with ID ${builderIdNum} not found`
      });
    }

    // 1. Extract skills from text
    const extraction = extractSkillsFromText(resume_text);

    // 2. Match challenge
    const matchedChallenge = matchChallengeForSkills(extraction.skills, extraction.domain);

    // 3. Find or create an IN_PROGRESS assessment for this builder and matched challenge
    let assessment = db.prepare(`
      SELECT * FROM assessments 
      WHERE builder_id = ? AND challenge_id = ?
      ORDER BY id DESC LIMIT 1
    `).get(builderIdNum, matchedChallenge.id);

    const now = new Date().toISOString();

    if (!assessment || assessment.status === 'COMPLETED') {
      const insertAss = db.prepare(`
        INSERT INTO assessments (challenge_id, builder_id, status, started_at)
        VALUES (?, ?, 'IN_PROGRESS', ?)
      `).run(matchedChallenge.id, builderIdNum, now);

      const assessmentId = insertAss.lastInsertRowid;
      assessment = { id: assessmentId, challenge_id: matchedChallenge.id, builder_id: builderIdNum, status: 'IN_PROGRESS', score: null };
    } else {
      // If it exists, ensure status is IN_PROGRESS and clean previous answers/score
      db.prepare(`
        UPDATE assessments SET status = 'IN_PROGRESS', score = NULL, skill_scores = NULL WHERE id = ?
      `).run(assessment.id);
    }

    // Force seed fresh questions tailored to the candidate's exact extracted resume skills (Intermediate/Medium level)
    seedQuestionsForAssessment(assessment.id, matchedChallenge.id, extraction.skills, true);

    // 4. Save resume entry
    const insertResume = db.prepare(`
      INSERT INTO resumes (
        builder_id, filename, raw_text, extracted_skills, confidence_scores,
        experience_years, domain, matched_challenge_id, assessment_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      builderIdNum,
      filename,
      resume_text ? resume_text.substring(0, 5000) : '',
      JSON.stringify(extraction.skills),
      JSON.stringify(extraction.confidenceScores),
      extraction.experienceYears,
      extraction.domain,
      matchedChallenge.id,
      assessment.id,
      now
    );

    // 5. Update user profile skills & domain
    db.prepare(`
      UPDATE users 
      SET skills = ?, domain = ?, resume_data = ?
      WHERE id = ?
    `).run(
      JSON.stringify(extraction.skills),
      extraction.domain,
      JSON.stringify({
        resume_id: insertResume.lastInsertRowid,
        filename,
        experience_years: extraction.experienceYears,
        uploaded_at: now
      }),
      builderIdNum
    );

    return res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully. Tailored medium-level assessment generated.',
      data: {
        resume_id: insertResume.lastInsertRowid,
        filename,
        extracted_skills: extraction.skills,
        confidence_scores: extraction.confidenceScores,
        domain: extraction.domain,
        experience_years: extraction.experienceYears,
        matched_challenge: {
          id: matchedChallenge.id,
          title: matchedChallenge.title,
          difficulty: matchedChallenge.difficulty,
          domain: matchedChallenge.domain,
          skills: typeof matchedChallenge.skills === 'string' ? JSON.parse(matchedChallenge.skills) : matchedChallenge.skills
        },
        assessment_id: assessment.id
      }
    });
  } catch (err) {
    console.error('[Resume Upload Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process resume upload and skill extraction'
    });
  }
});

/**
 * GET /api/resume/builder/:builderId
 * Get latest resume and extraction record for a builder
 */
router.get('/builder/:builderId', (req, res) => {
  try {
    const builderId = Number(req.params.builderId);
    const resume = db.prepare(`
      SELECT r.*, c.title as challenge_title, c.difficulty as challenge_difficulty
      FROM resumes r
      LEFT JOIN challenges c ON r.matched_challenge_id = c.id
      WHERE r.builder_id = ?
      ORDER BY r.id DESC LIMIT 1
    `).get(builderId);

    if (!resume) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No resume on file for this builder'
      });
    }

    let skills = [];
    let confidenceScores = {};
    try { skills = JSON.parse(resume.extracted_skills); } catch {}
    try { confidenceScores = JSON.parse(resume.confidence_scores); } catch {}

    return res.status(200).json({
      success: true,
      data: {
        ...resume,
        extracted_skills: skills,
        confidence_scores: confidenceScores
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve builder resume'
    });
  }
});

/**
 * GET /api/resume/samples
 * Pre-formatted real engineering resumes for instant demo testing
 */
router.get('/samples', (req, res) => {
  const samples = [
    {
      id: 'sample-backend',
      title: 'Backend Systems Engineer Resume (Java / Spring / SQL)',
      filename: 'rahul_sharma_backend_resume.pdf',
      domain: 'Backend Engineering',
      sampleText: `Rahul Sharma
Senior Software Engineer - Backend Systems
Bengaluru, India • rahul@example.com

SUMMARY:
Results-driven Backend Engineer with 3+ years experience engineering distributed transactional APIs using Java, Spring Boot, PostgreSQL, and Apache Kafka. Proven track record optimizing high-throughput REST APIs and database queries under 10k RPS.

CORE SKILLS:
- Languages: Java 17, SQL, Bash
- Frameworks: Spring Boot, Spring Cloud, Hibernate ORM
- Databases: PostgreSQL, MySQL, Redis (caching & locks)
- Distributed Systems: Apache Kafka, REST APIs, Microservices, Concurrency
- Tools & Infra: Docker, Git, Maven, JUnit, Prometheus

EXPERIENCE:
Software Engineer | FinFlow Systems (2022 - Present)
- Engineered Order Management REST API processing 15M transactions monthly with deterministic ACID row locks.
- Reduced database transaction deadlocks by 40% via index optimization and query refactoring.
- Built event-driven Kafka messaging pipelines for order dispatch state machines.`
    },
    {
      id: 'sample-frontend',
      title: 'Frontend Web Engineer Resume (React / TypeScript / Tailwind)',
      filename: 'priya_nair_frontend_resume.pdf',
      domain: 'Frontend Engineering',
      sampleText: `Priya Nair
Frontend Engineer • Bengaluru, India • priya@example.com

SUMMARY:
Frontend Engineer with 3 years of building responsive, performant single-page applications with React, TypeScript, and modern CSS frameworks.

SKILLS:
- Frontend: React 18, JavaScript ES6+, TypeScript, Next.js, Redux Toolkit
- UI & Styling: Tailwind CSS, CSS3, Responsive Design, Web Accessibility
- APIs & Tools: REST API integration, WebSocket streaming, Vite, Webpack, Git

EXPERIENCE:
Frontend Developer | DashScale Labs (2022 - Present)
- Architected live analytics dashboard visualizing real-time financial metrics using React and WebSockets.
- Optimized bundle sizes by 35% using code splitting and lazy loading.`
    }
  ];

  return res.status(200).json({
    success: true,
    data: samples
  });
});

export default router;
