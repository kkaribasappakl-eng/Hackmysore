// server/routes/resume.js
import express from 'express';
import { db, seedQuestionsForAssessment } from '../db.js';

import zlib from 'zlib';

const router = express.Router();

// Known technical skills dictionary with categories and aliases
const SKILL_TAXONOMY = {
  // Python & Data / ML
  'Python': { domain: 'Machine Learning', weight: 1.0, aliases: ['python', 'python3', 'py'] },
  'FastAPI': { domain: 'Backend Engineering', weight: 1.0, aliases: ['fastapi', 'fast-api'] },
  'Django': { domain: 'Backend Engineering', weight: 0.9, aliases: ['django'] },
  'Flask': { domain: 'Backend Engineering', weight: 0.8, aliases: ['flask'] },
  'Pandas': { domain: 'Data Engineering', weight: 0.8, aliases: ['pandas'] },
  'NumPy': { domain: 'Data Engineering', weight: 0.8, aliases: ['numpy'] },
  'PyTorch': { domain: 'Machine Learning', weight: 0.9, aliases: ['pytorch', 'torch'] },
  'Machine Learning': { domain: 'Machine Learning', weight: 0.9, aliases: ['machine learning', 'ml', 'deep learning'] },

  // Node & JavaScript / TypeScript / Frontend
  'React': { domain: 'Frontend Engineering', weight: 1.2, aliases: ['react', 'react.js', 'reactjs'] },
  'Next.js': { domain: 'Frontend Engineering', weight: 1.0, aliases: ['next.js', 'nextjs', 'next'] },
  'Tailwind CSS': { domain: 'Frontend Engineering', weight: 0.9, aliases: ['tailwind', 'tailwindcss'] },
  'Redux': { domain: 'Frontend Engineering', weight: 0.8, aliases: ['redux', 'redux toolkit'] },
  'HTML5/CSS3': { domain: 'Frontend Engineering', weight: 0.8, aliases: ['html', 'css', 'html5', 'css3', 'web ui'] },
  'JavaScript': { domain: 'Frontend Engineering', weight: 0.9, aliases: ['javascript', 'js', 'es6'] },
  'TypeScript': { domain: 'Fullstack Engineering', weight: 0.9, aliases: ['typescript', 'ts'] },
  'Node.js': { domain: 'Fullstack Engineering', weight: 1.0, aliases: ['node.js', 'nodejs', 'node'] },
  'Express': { domain: 'Fullstack Engineering', weight: 0.9, aliases: ['express', 'express.js', 'expressjs'] },
  'NestJS': { domain: 'Backend Engineering', weight: 0.9, aliases: ['nestjs'] },

  // Java & Systems Backend
  'Java': { domain: 'Backend Engineering', weight: 1.0, aliases: ['java', 'jdk', 'jvm'] },
  'Spring Boot': { domain: 'Backend Engineering', weight: 1.0, aliases: ['spring boot', 'springboot', 'spring'] },
  'SQL': { domain: 'Backend Engineering', weight: 0.9, aliases: ['sql', 'rdbms', 'queries'] },
  'PostgreSQL': { domain: 'Backend Engineering', weight: 0.9, aliases: ['postgresql', 'postgres', 'psql'] },
  'MySQL': { domain: 'Backend Engineering', weight: 0.8, aliases: ['mysql'] },
  'MongoDB': { domain: 'Fullstack Engineering', weight: 0.8, aliases: ['mongodb', 'mongo', 'nosql'] },
  'REST API': { domain: 'Backend Engineering', weight: 0.9, aliases: ['rest api', 'restful', 'rest apis', 'rest'] },
  'Microservices': { domain: 'Backend Engineering', weight: 0.9, aliases: ['microservices', 'microservice'] },
  'Kafka': { domain: 'Backend Engineering', weight: 0.9, aliases: ['kafka', 'apache kafka'] },
  'Redis': { domain: 'Backend Engineering', weight: 0.8, aliases: ['redis'] },
  'Docker': { domain: 'DevOps / Cloud', weight: 0.8, aliases: ['docker', 'container', 'containers'] },
  'Kubernetes': { domain: 'DevOps / Cloud', weight: 0.8, aliases: ['kubernetes', 'k8s'] },
  'Go': { domain: 'Systems & Backend', weight: 1.0, aliases: ['go', 'golang'] },
  'Debugging': { domain: 'Engineering Core', weight: 0.9, aliases: ['debugging', 'troubleshooting', 'profiling'] },
  'Concurrency': { domain: 'Backend Engineering', weight: 0.9, aliases: ['concurrency', 'multithreading', 'locking'] }
};

/**
 * Extract clean printable text from PDF streams or binary representations
 */
function extractTextFromPdfOrBinary(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let text = '';

  // 1. Decompress PDF streams if present
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(raw)) !== null) {
    const rawStream = match[1];
    try {
      const buffer = Buffer.from(rawStream, 'binary');
      const decompressed = zlib.inflateSync(buffer).toString('utf-8');
      text += ' ' + decompressed;
    } catch {
      text += ' ' + rawStream;
    }
  }

  // 2. Extract parenthesized strings: (Hello World) Tj or [(Hello) 10 (World)] TJ
  const stringRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  while ((match = stringRegex.exec(raw)) !== null) {
    text += ' ' + match[1];
  }

  // 3. Extract bracketed arrays: [(React) -20 (Developer)] TJ
  const arrayRegex = /\[(.*?)\]\s*TJ/g;
  while ((match = arrayRegex.exec(raw)) !== null) {
    const inner = match[1];
    const subMatch = inner.match(/\(([^)]+)\)/g);
    if (subMatch) {
      text += ' ' + subMatch.map(s => s.slice(1, -1)).join(' ');
    }
  }

  // 4. Extract all printable ASCII word tokens
  const printable = raw.replace(/[^\x20-\x7E\r\n\t]/g, ' ');
  text += ' ' + printable;

  return text;
}

/**
 * Intelligent skill extraction from unstructured resume text & file metadata
 */
function extractSkillsFromText(text, filename = '') {
  let combined = (text || '') + ' ' + (filename || '');

  // If text is binary or starts with %PDF, extract text first
  if (text && (text.includes('%PDF') || /[\x00-\x08\x0E-\x1F]/.test(text.substring(0, 1000)))) {
    combined = extractTextFromPdfOrBinary(text) + ' ' + (filename || '');
  }

  const lower = combined.toLowerCase();
  const detected = [];
  const confidenceScores = {};
  const domainCounts = {};

  for (const [skill, meta] of Object.entries(SKILL_TAXONOMY)) {
    const aliases = meta.aliases || [skill.toLowerCase()];
    let matched = false;
    let matchCount = 0;

    for (const alias of aliases) {
      const escaped = alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lower)) {
        matched = true;
        const matches = (lower.match(new RegExp(escaped, 'gi')) || []).length;
        matchCount += matches;
      }
    }

    if (matched) {
      const baseConfidence = 85 + Math.min(13, matchCount * 3);
      confidenceScores[skill] = baseConfidence;
      detected.push(skill);
      domainCounts[meta.domain] = (domainCounts[meta.domain] || 0) + meta.weight * (matchCount > 0 ? 1 : 0.8);
    }
  }

  // Domain-aware fallback if no known keywords matched
  if (detected.length === 0) {
    if (lower.includes('react') || lower.includes('front') || lower.includes('ui') || lower.includes('css') || lower.includes('web')) {
      detected.push('React', 'JavaScript', 'HTML5/CSS3', 'REST API');
      confidenceScores['React'] = 92;
      confidenceScores['JavaScript'] = 90;
      confidenceScores['HTML5/CSS3'] = 88;
      confidenceScores['REST API'] = 89;
      domainCounts['Frontend Engineering'] = 4.0;
    } else if (lower.includes('python') || lower.includes('data') || lower.includes('ml') || lower.includes('ai') || lower.includes('django')) {
      detected.push('Python', 'FastAPI', 'Pandas', 'SQL');
      confidenceScores['Python'] = 93;
      confidenceScores['FastAPI'] = 90;
      confidenceScores['Pandas'] = 88;
      confidenceScores['SQL'] = 89;
      domainCounts['Machine Learning'] = 4.0;
    } else if (lower.includes('node') || lower.includes('fullstack') || lower.includes('ts') || lower.includes('express')) {
      detected.push('Node.js', 'Express', 'JavaScript', 'REST API');
      confidenceScores['Node.js'] = 92;
      confidenceScores['Express'] = 90;
      confidenceScores['JavaScript'] = 91;
      confidenceScores['REST API'] = 89;
      domainCounts['Fullstack Engineering'] = 4.0;
    } else {
      detected.push('Software Engineering', 'Problem Solving', 'Data Structures', 'REST API');
      confidenceScores['Software Engineering'] = 90;
      confidenceScores['Problem Solving'] = 92;
      confidenceScores['Data Structures'] = 88;
      confidenceScores['REST API'] = 89;
      domainCounts['Backend Engineering'] = 3.0;
    }
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

  // Score match against challenge required skills and domain
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
        matchCount += 3;
      }
    }

    // High domain match weight so Frontend always gets Frontend, Backend gets Backend
    if (ch.domain.toLowerCase().includes(domain.toLowerCase()) || domain.toLowerCase().includes(ch.domain.toLowerCase())) {
      matchCount += 6;
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

    // 1. Extract skills from text and filename
    const extraction = extractSkillsFromText(resume_text, filename);

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
      title: 'Backend Systems Engineer (Java / Spring / SQL / Kafka)',
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
      title: 'Frontend Web Engineer (React / TypeScript / Tailwind / Next.js)',
      filename: 'priya_nair_frontend_resume.pdf',
      domain: 'Frontend Engineering',
      sampleText: `Priya Nair
Frontend Engineer • Bengaluru, India • priya@example.com

SUMMARY:
Frontend Engineer with 3 years of building responsive, performant single-page applications with React, TypeScript, and modern CSS frameworks.

SKILLS:
- Frontend: React 18, JavaScript ES6+, TypeScript, Next.js, Redux Toolkit
- UI & Styling: Tailwind CSS, CSS3, Responsive Design, Web Accessibility, HTML5/CSS3
- APIs & Tools: REST API integration, WebSocket streaming, Vite, Webpack, Git

EXPERIENCE:
Frontend Developer | DashScale Labs (2022 - Present)
- Architected live analytics dashboard visualizing real-time financial metrics using React and WebSockets.
- Optimized bundle sizes by 35% using code splitting and lazy loading.
- Engineered modular design systems with Tailwind CSS and responsive UI components.`
    },
    {
      id: 'sample-python',
      title: 'Python & AI Data Engineer (Python / FastAPI / PyTorch / Pandas)',
      filename: 'vikram_malhotra_python_resume.pdf',
      domain: 'Machine Learning',
      sampleText: `Vikram Malhotra
Python & Machine Learning Engineer • Bengaluru, India • vikram@example.com

SUMMARY:
Python Developer with 3+ years experience engineering asynchronous REST microservices and high-throughput data processing pipelines using Python, FastAPI, Pandas, PyTorch, and SQL.

SKILLS:
- Languages & Frameworks: Python 3.11, FastAPI, Django, Flask, PyTorch, Pandas, NumPy
- Databases & APIs: PostgreSQL, SQL, Redis, REST API, AsyncIO
- AI & Data: Machine Learning model inference pipelines, vector embeddings, NumPy array operations
- Tools & Cloud: Docker, Kubernetes, Git, pytest

EXPERIENCE:
Machine Learning Engineer | ApexData AI (2022 - Present)
- Built asynchronous FastAPI microservice serving real-time embedding queries at 5,000 QPS with sub-15ms latency.
- Engineered Pandas ETL pipeline cleaning 20M records daily with optimized NumPy vectorized operations.`
    },
    {
      id: 'sample-fullstack',
      title: 'Fullstack Software Engineer (Node.js / Express / React / TypeScript / MongoDB)',
      filename: 'sneha_patel_fullstack_resume.pdf',
      domain: 'Fullstack Engineering',
      sampleText: `Sneha Patel
Fullstack Software Engineer • Bengaluru, India • sneha@example.com

SUMMARY:
Fullstack Engineer with 3 years experience building end-to-end web applications across React frontend and Node.js/Express backend microservices with MongoDB and TypeScript.

SKILLS:
- Frontend: React, TypeScript, JavaScript, Next.js, Redux, Tailwind CSS, HTML5/CSS3
- Backend & APIs: Node.js, Express, REST API, Microservices, WebSocket
- Databases & Tools: MongoDB, PostgreSQL, SQL, Docker, Git, Jest

EXPERIENCE:
Fullstack Developer | CloudSync Tech (2022 - Present)
- Architected fullstack collaborative dashboard with React on frontend and Node.js Express on backend.
- Implemented secure JWT authentication and REST API endpoints handling transactional state machines.`
    }
  ];

  return res.status(200).json({
    success: true,
    data: samples
  });
});

export default router;
