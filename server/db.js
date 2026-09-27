// server/db.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path from env or default
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(__dirname, process.env.DATABASE_PATH)
  : path.resolve(__dirname, 'signalcraft.db');

// Support both better-sqlite3 (if native build exists) and native node:sqlite DatabaseSync
let Database;
try {
  const betterSqlite = await import('better-sqlite3');
  Database = betterSqlite.default || betterSqlite;
} catch {
  const { DatabaseSync } = await import('node:sqlite');
  Database = DatabaseSync;
}

export const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize schema and tables
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('BUILDER', 'REVIEWER', 'RECRUITER')),
      domain TEXT,
      skills TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      required_skills TEXT NOT NULL,
      difficulty TEXT,
      created_by INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      domain TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      skills TEXT NOT NULL,
      prerequisites TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      builder_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
      score REAL,
      skill_scores TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id),
      FOREIGN KEY (builder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      builder_id INTEGER NOT NULL,
      repository_url TEXT NOT NULL,
      project_url TEXT,
      adr_content TEXT NOT NULL,
      integrity_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(integrity_status IN ('PENDING', 'PASSED', 'FLAGGED')),
      similarity_score REAL,
      ai_analysis_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(ai_analysis_status IN ('PENDING', 'COMPLETED')),
      adr_consistency_score REAL,
      reasoning_quality_score REAL,
      ai_summary TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'FLAGGED')),
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (builder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      correctness REAL NOT NULL,
      architecture REAL NOT NULL,
      code_quality REAL NOT NULL,
      tradeoff_awareness REAL NOT NULL,
      overall_score REAL NOT NULL,
      feedback TEXT NOT NULL,
      comments TEXT,
      strengths TEXT,
      weaknesses TEXT,
      recommendation TEXT DEFAULT 'VERIFIED',
      status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('PENDING', 'COMPLETED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (submission_id) REFERENCES submissions(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id TEXT PRIMARY KEY,
      builder_id INTEGER NOT NULL,
      assessment_id INTEGER NOT NULL,
      review_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      overall_score REAL NOT NULL,
      skill_scores TEXT NOT NULL,
      review_score REAL NOT NULL,
      issued_at TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('VALID', 'EXPIRED')),
      FOREIGN KEY (builder_id) REFERENCES users(id),
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (review_id) REFERENCES reviews(id)
    );

    CREATE TABLE IF NOT EXISTS shortlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      builder_id INTEGER NOT NULL,
      recruiter_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'SHORTLISTED' CHECK(status IN ('SHORTLISTED', 'REJECTED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (builder_id) REFERENCES users(id),
      FOREIGN KEY (recruiter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_type TEXT NOT NULL CHECK(question_type IN ('MCQ', 'CODING', 'DEBUGGING', 'SQL', 'REASONING')),
      question_text TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT,
      points INTEGER NOT NULL DEFAULT 20,
      skill TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Intermediate',
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      builder_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES assessment_questions(id),
      FOREIGN KEY (builder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ranking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      builder_id INTEGER NOT NULL,
      scorecard_id TEXT,
      event_type TEXT NOT NULL DEFAULT 'SCORECARD_VERIFIED',
      previous_rank INTEGER,
      new_rank INTEGER,
      score REAL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (builder_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS challenge_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      variant_name TEXT NOT NULL,
      domain TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Intermediate',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (challenge_id) REFERENCES challenges(id)
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      builder_id INTEGER NOT NULL,
      filename TEXT,
      raw_text TEXT,
      extracted_skills TEXT NOT NULL,
      confidence_scores TEXT,
      experience_years REAL DEFAULT 2.5,
      domain TEXT DEFAULT 'Backend Engineering',
      matched_challenge_id INTEGER DEFAULT 1,
      assessment_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (builder_id) REFERENCES users(id)
    );
  `);

  // Run safe schema migrations for existing databases
  try { db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'password123';"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN resume_data TEXT;"); } catch {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN comments TEXT;"); } catch {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN strengths TEXT;"); } catch {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN weaknesses TEXT;"); } catch {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN recommendation TEXT DEFAULT 'VERIFIED';"); } catch {}
  try { db.exec("ALTER TABLE submissions ADD COLUMN anti_gaming_report TEXT;"); } catch {}
  try { db.exec("ALTER TABLE submissions ADD COLUMN ai_advisory_rubric TEXT;"); } catch {}

  seedInitialData();

  // Ensure seeded assessment (id 1) has questions
  seedQuestionsForAssessment(1, 1);

  // Ensure demo data for complete end-to-end hackathon flows
  ensureDemoData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount && userCount.count > 0) {
    return; // Already seeded, do not duplicate
  }

  const now = new Date().toISOString();

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, role, domain, skills, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'Rahul Sharma',
    'rahul@example.com',
    'BUILDER',
    'Backend Engineering',
    JSON.stringify(['Java', 'SQL', 'REST API', 'Spring Boot']),
    now
  );

  insertUser.run(
    'Priya Nair',
    'priya@example.com',
    'BUILDER',
    'Frontend Engineering',
    JSON.stringify(['React', 'JavaScript', 'CSS', 'REST API']),
    now
  );

  insertUser.run(
    'Arjun Kumar',
    'arjun@example.com',
    'BUILDER',
    'Backend Engineering',
    JSON.stringify(['Java', 'Python', 'SQL', 'REST API']),
    now
  );

  insertUser.run(
    'Ananya Rao',
    'ananya@example.com',
    'REVIEWER',
    'Backend Engineering',
    JSON.stringify(['Java', 'Backend', 'SQL', 'System Design']),
    now
  );

  insertUser.run(
    'Meera Kapoor',
    'meera@technova.example',
    'RECRUITER',
    'Software Engineering',
    JSON.stringify(['Hiring', 'Technical Discovery', 'Recruiting']),
    now
  );

  // 2. Seed Job
  const insertJob = db.prepare(`
    INSERT INTO jobs (company, title, description, required_skills, difficulty, created_by, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(
    'TechNova Solutions',
    'Backend Developer',
    'Backend engineering role requiring strong Java, SQL and REST API skills.',
    JSON.stringify(['Java', 'SQL', 'REST API', 'Spring Boot']),
    'Intermediate',
    5, // Meera Kapoor (Recruiter)
    'OPEN',
    now
  );

  // 3. Seed Challenges
  const insertChallenge = db.prepare(`
    INSERT INTO challenges (title, description, domain, difficulty, skills, prerequisites, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertChallenge.run(
    'Backend Order Management API',
    'Build an Order Management REST API capable of processing transactions, stock reservation, and idempotent payment webhooks.',
    'Backend Engineering',
    'Intermediate',
    JSON.stringify(['Java', 'SQL', 'REST API']),
    JSON.stringify(['Java Basics', 'SQL Basics', 'REST Fundamentals']),
    now
  );

  insertChallenge.run(
    'Production API Debugging',
    'Pinpoint thread deadlocks and query latency spikes under 10k RPS in a high-volume financial ledger service.',
    'Backend Engineering',
    'Advanced',
    JSON.stringify(['Java', 'Debugging', 'Performance']),
    JSON.stringify(['Java Basics', 'REST Fundamentals']),
    now
  );

  insertChallenge.run(
    'Frontend Dashboard Challenge',
    'Design a responsive, high-performance data dashboard visualizing live websocket analytics.',
    'Frontend Engineering',
    'Intermediate',
    JSON.stringify(['React', 'JavaScript', 'REST API']),
    JSON.stringify(['JavaScript Basics', 'React Basics']),
    now
  );
}

// Ensure demo data for complete end-to-end hackathon flows
export function ensureDemoData() {
  try {
    const now = new Date().toISOString();

    // 1. Ensure Rahul Sharma (builder_id 1) has Assessment 1 & Scorecard SC-BE-2026-001
    let rahulAssessment = db.prepare('SELECT id FROM assessments WHERE builder_id = 1 LIMIT 1').get();
    if (!rahulAssessment) {
      const res = db.prepare(`
        INSERT INTO assessments (challenge_id, builder_id, status, score, skill_scores, started_at, completed_at)
        VALUES (1, 1, 'COMPLETED', 85, ?, ?, ?)
      `).run(
        JSON.stringify({ 'Java': 86, 'SQL': 82, 'REST API': 91, 'Debugging': 88, 'Problem Solving': 89 }),
        now, now
      );
      rahulAssessment = { id: res.lastInsertRowid };
    }
    seedQuestionsForAssessment(rahulAssessment.id, 1);

    // Ensure Rahul has a verified submission
    let rahulSub = db.prepare('SELECT id FROM submissions WHERE builder_id = 1 LIMIT 1').get();
    if (!rahulSub) {
      const res = db.prepare(`
        INSERT INTO submissions (
          assessment_id, builder_id, repository_url, project_url, adr_content,
          integrity_status, similarity_score, ai_analysis_status, adr_consistency_score,
          reasoning_quality_score, ai_summary, status, submitted_at
        ) VALUES (?, 1, 'https://github.com/rahul-sharma/signalcraft-order-service', 'https://order-service-demo.signalcraft.dev', ?, 'PASSED', 8, 'COMPLETED', 88, 84, 'Consistent ADR with explicit database locks.', 'VERIFIED', ?)
      `).run(
        rahulAssessment.id,
        JSON.stringify({
          what: "Order Management API with deterministic stock reservation.",
          why: "Row-level write locks prevent race conditions under load.",
          alternatives: "Evaluated optimistic locking; rejected due to retry storms.",
          tradeoffs: "Higher write lock duration for guaranteed ACID integrity.",
          scaling: "Scale via Kafka transactional outbox and read replicas."
        }),
        now
      );
      rahulSub = { id: res.lastInsertRowid };
    }

    // Ensure Rahul has a review
    let rahulReview = db.prepare('SELECT id FROM reviews WHERE submission_id = ? LIMIT 1').get(rahulSub.id);
    if (!rahulReview) {
      const res = db.prepare(`
        INSERT INTO reviews (
          submission_id, reviewer_id, correctness, architecture, code_quality, tradeoff_awareness,
          overall_score, feedback, comments, strengths, weaknesses, recommendation, status, created_at
        ) VALUES (?, 4, 5, 4, 4, 5, 4.5, ?, ?, ?, ?, 'VERIFIED', 'COMPLETED', ?)
      `).run(
        rahulSub.id,
        "Strong implementation with clear architectural reasoning and robust trade-off awareness.",
        "Strong implementation with clear architectural reasoning and robust trade-off awareness.",
        JSON.stringify(["Deterministic concurrency handling", "Thorough ADR documentation"]),
        JSON.stringify(["Could benefit from connection pool tuning"]),
        now
      );
      rahulReview = { id: res.lastInsertRowid };
    }

    // Ensure Rahul has a scorecard SC-BE-2026-001
    const rahulSc = db.prepare("SELECT id FROM scorecards WHERE builder_id = 1 LIMIT 1").get();
    if (!rahulSc) {
      db.prepare(`
        INSERT INTO scorecards (
          id, builder_id, assessment_id, review_id, domain, overall_score,
          skill_scores, review_score, issued_at, valid_until, status
        ) VALUES ('SC-BE-2026-001', 1, ?, ?, 'Backend Engineering', 88, ?, 90, ?, ?, 'VALID')
      `).run(
        rahulAssessment.id,
        rahulReview.id,
        JSON.stringify({ 'Java': 86, 'SQL': 82, 'REST API': 91, 'Debugging': 88, 'Problem Solving': 89 }),
        formatDate(now),
        addTwoYears(now)
      );
    }

    // 2. Ensure Priya Nair (builder_id 2) has Assessment & Pending Submission in Queue
    let priyaSub = db.prepare('SELECT id FROM submissions WHERE builder_id = 2 LIMIT 1').get();
    if (!priyaSub) {
      const pAss = db.prepare(`
        INSERT INTO assessments (challenge_id, builder_id, status, score, skill_scores, started_at, completed_at)
        VALUES (1, 2, 'COMPLETED', 92, ?, ?, ?)
      `).run(
        JSON.stringify({ 'Java': 90, 'SQL': 88, 'REST API': 94, 'Debugging': 92, 'Problem Solving': 94 }),
        now, now
      );
      seedQuestionsForAssessment(pAss.lastInsertRowid, 1);

      db.prepare(`
        INSERT INTO submissions (
          assessment_id, builder_id, repository_url, project_url, adr_content,
          integrity_status, similarity_score, ai_analysis_status, adr_consistency_score,
          reasoning_quality_score, ai_summary, ai_advisory_rubric, anti_gaming_report, status, submitted_at
        ) VALUES (?, 2, 'https://github.com/priya-nair/order-dispatch-service', 'https://order-dispatch.signalcraft.dev', ?, 'PASSED', 6, 'COMPLETED', 94, 92, 'Exceptional non-blocking reactive stream pipeline handling high event velocity.', ?, ?, 'SUBMITTED', ?)
      `).run(
        pAss.lastInsertRowid,
        JSON.stringify({
          what: "Reactive Order Dispatch Service with Kafka Event Streaming",
          why: "Non-blocking event streams prevent worker thread starvation under 20k concurrent dispatch events.",
          alternatives: "Considered RabbitMQ and synchronous polling. Chose Kafka for distributed replayability.",
          tradeoffs: "Eventual consistency across read models in exchange for linear write scalability.",
          scaling: "Scale horizontally via partition key distribution on customer_id."
        }),
        JSON.stringify({
          status: "COMPLETED",
          provider: "claude-3-5-sonnet (reference)",
          notice: "AI Reference Only",
          authoritative: false,
          suggested_rubrics: { correctness: 4.8, architecture: 4.6, code_quality: 4.5, tradeoff_awareness: 4.7 },
          overall_suggested_score: 93,
          adr_consistency: 94,
          reasoning_quality: 92,
          detected_strengths: [
            "Exceptional non-blocking reactive stream pipeline handling high event velocity.",
            "Clear architectural justification of Kafka log partitions over synchronous polling."
          ],
          detected_weaknesses: [
            "Ensure consumer lag alert thresholds are monitored under backpressure spikes."
          ],
          adr_critique: "Solid architectural reasoning demonstrating practical awareness of distributed state consistency.",
          anti_gaming_observations: "Completely authentic engineering artifact with zero similarity or prompt-stuffing flags.",
          summary: "High code modularity with well-structured reactive pipeline and verified ADR consistency."
        }),
        JSON.stringify({
          status: "PASSED",
          similarity_score: 6,
          originality_score: 94,
          adr_consistency_score: 94,
          reasoning_quality_score: 92,
          flags: ["LOW_SIMILARITY_ORIGINAL", "ADR_CODE_ALIGNED", "CONCRETE_ARCHITECTURAL_TERMINOLOGY"],
          suspicious_patterns_found: 0,
          template_match_rate: 5,
          message: "Originality verified with 94% unique syntax."
        }),
        now
      );
    }

    // 3. Ensure Arjun Kumar (builder_id 3) has Assessment & Flagged Submission in Queue
    let arjunSub = db.prepare('SELECT id FROM submissions WHERE builder_id = 3 LIMIT 1').get();
    if (!arjunSub) {
      const aAss = db.prepare(`
        INSERT INTO assessments (challenge_id, builder_id, status, score, skill_scores, started_at, completed_at)
        VALUES (1, 3, 'COMPLETED', 72, ?, ?, ?)
      `).run(
        JSON.stringify({ 'Java': 70, 'SQL': 68, 'REST API': 75, 'Debugging': 72, 'Problem Solving': 74 }),
        now, now
      );
      seedQuestionsForAssessment(aAss.lastInsertRowid, 1);

      db.prepare(`
        INSERT INTO submissions (
          assessment_id, builder_id, repository_url, project_url, adr_content,
          integrity_status, similarity_score, ai_analysis_status, adr_consistency_score,
          reasoning_quality_score, ai_summary, ai_advisory_rubric, anti_gaming_report, status, submitted_at
        ) VALUES (?, 3, 'https://github.com/arjun-kumar/basic-order-api', NULL, ?, 'FLAGGED', 78, 'COMPLETED', 52, 48, 'Superficial ADR with generic filler phrases.', ?, ?, 'FLAGGED', ?)
      `).run(
        aAss.lastInsertRowid,
        JSON.stringify({
          what: "As an AI language model, here is the order management system.",
          why: "It uses database queries and web frameworks.",
          alternatives: "None considered.",
          tradeoffs: "Standard trade-offs in software development.",
          scaling: "Scale by getting a bigger server."
        }),
        JSON.stringify({
          status: "COMPLETED",
          provider: "claude-3-5-sonnet (reference)",
          notice: "AI Reference Only",
          authoritative: false,
          suggested_rubrics: { correctness: 3.0, architecture: 2.5, code_quality: 3.0, tradeoff_awareness: 2.0 },
          overall_suggested_score: 52,
          adr_consistency: 52,
          reasoning_quality: 48,
          detected_strengths: ["Basic CRUD endpoint structure is present."],
          detected_weaknesses: [
            "Detected raw AI prompt preamble in ADR without original technical reasoning.",
            "Lacks concurrency safety and transactional guarantees under load."
          ],
          adr_critique: "ADR contains generic boilerplate without concrete architectural trade-offs.",
          anti_gaming_observations: "Flagged: Detected raw LLM disclaimer artifacts and generic non-architectural claims.",
          summary: "Flagged: Potential prompt stuffing and superficial architectural reasoning."
        }),
        JSON.stringify({
          status: "FLAGGED",
          similarity_score: 78,
          originality_score: 22,
          adr_consistency_score: 52,
          reasoning_quality_score: 48,
          flags: ["LLM_PROMPT_ARTIFACT_DETECTED", "GENERIC_ADR_SUPERFICIAL", "HIGH_SIMILARITY_FLAGGED"],
          suspicious_patterns_found: 2,
          template_match_rate: 74,
          message: "Flagged: Detected raw LLM disclaimer artifacts and generic non-architectural claims."
        }),
        now
      );
    }

    // 4. Ensure Challenge Variants exist
    const variantCount = db.prepare('SELECT COUNT(*) as count FROM challenge_variants').get();
    if (!variantCount || variantCount.count === 0) {
      const insertVar = db.prepare(`
        INSERT INTO challenge_variants (challenge_id, variant_name, domain, difficulty)
        VALUES (?, ?, ?, ?)
      `);
      insertVar.run(1, 'Variant A: High-Throughput Pessimistic Locking', 'Backend Engineering', 'Intermediate');
      insertVar.run(1, 'Variant B: Event-Driven Kafka Outbox Pattern', 'Backend Engineering', 'Advanced');
      insertVar.run(2, 'Variant A: State Management & Virtualized Feeds', 'Frontend Engineering', 'Intermediate');
    }

    // 5. Ensure Ranking Events exist
    const eventCount = db.prepare('SELECT COUNT(*) as count FROM ranking_events').get();
    if (!eventCount || eventCount.count === 0) {
      db.prepare(`
        INSERT INTO ranking_events (builder_id, scorecard_id, event_type, previous_rank, new_rank, score, details, created_at)
        VALUES (1, 'SC-BE-2026-001', 'SCORECARD_VERIFIED', NULL, 1, 88, 'Initial verified credential issued for Backend Engineering domain', ?)
      `).run(now);
    }

    // 6. Ensure Multiple Distinct Jobs exist for Evidence-Based Proof Mapping
    db.prepare(`UPDATE jobs SET title = 'Backend Developer', required_skills = ? WHERE id = 1`).run(
      JSON.stringify(['Java', 'SQL', 'REST API', 'Spring Boot', 'Debugging'])
    );

    const job2 = db.prepare('SELECT id FROM jobs WHERE id = 2').get();
    if (job2) {
      db.prepare(`UPDATE jobs SET title = 'Full Stack Engineer', required_skills = ? WHERE id = 2`).run(
        JSON.stringify(['React', 'JavaScript', 'REST API', 'SQL', 'Node.js'])
      );
    } else {
      db.prepare(`
        INSERT INTO jobs (company, title, description, required_skills, difficulty, created_by, status, created_at)
        VALUES ('TechNova Solutions', 'Full Stack Engineer', 'Build scalable micro-frontend architectures and reactive REST/GraphQL interfaces.', ?, 'Intermediate', 5, 'OPEN', ?)
      `).run(
        JSON.stringify(['React', 'JavaScript', 'REST API', 'SQL', 'Node.js']),
        now
      );
    }

    const job3 = db.prepare('SELECT id FROM jobs WHERE id = 3').get();
    if (job3) {
      db.prepare(`UPDATE jobs SET title = 'Cloud & DevOps Engineer', required_skills = ? WHERE id = 3`).run(
        JSON.stringify(['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS'])
      );
    } else {
      db.prepare(`
        INSERT INTO jobs (company, title, description, required_skills, difficulty, created_by, status, created_at)
        VALUES ('CloudScale Systems', 'Cloud & DevOps Engineer', 'Deploy and automate cloud-native Kubernetes workloads and multi-region CI/CD pipelines.', ?, 'Advanced', 5, 'OPEN', ?)
      `).run(
        JSON.stringify(['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS']),
        now
      );
    }
  } catch (err) {
    console.error('Failed to ensure demo data:', err);
  }
}

// Helper: Calculate scorecard validity status based on current date
export function computeScorecardStatus(validUntilStr) {
  const now = new Date();
  const validUntil = new Date(validUntilStr);
  return now <= validUntil ? 'VALID' : 'EXPIRED';
}

// Helper: Add exactly 2 years to a date string/Date object formatted as YYYY-MM-DD
export function addTwoYears(dateInput) {
  const d = new Date(dateInput);
  const issuedYear = d.getFullYear();
  const issuedMonth = d.getMonth();
  const issuedDay = d.getDate();

  // Create date 2 years in the future
  const expiry = new Date(issuedYear + 2, issuedMonth, issuedDay);
  
  // Format as YYYY-MM-DD
  const yyyy = expiry.getFullYear();
  const mm = String(expiry.getMonth() + 1).padStart(2, '0');
  const dd = String(expiry.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Format date as YYYY-MM-DD
export function formatDate(dateInput) {
  const d = new Date(dateInput);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Seed questions for an assessment dynamically based on matched challenge & resume skills
export function seedQuestionsForAssessment(assessmentId, challengeId = 1, skills = [], forceRecreate = false) {
  try {
    if (forceRecreate) {
      db.prepare('DELETE FROM assessment_answers WHERE assessment_id = ?').run(assessmentId);
      db.prepare('DELETE FROM assessment_questions WHERE assessment_id = ?').run(assessmentId);
    } else {
      const existing = db.prepare('SELECT COUNT(*) as count FROM assessment_questions WHERE assessment_id = ?').get(assessmentId);
      if (existing && existing.count > 0) {
        return; // Already seeded for this assessment
      }
    }

    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId);
    const domain = challenge?.domain || 'Backend Engineering';
    const skillsLower = (skills || []).map(s => String(s).toLowerCase());

    const isPython = skillsLower.some(s => ['python', 'fastapi', 'django', 'flask', 'pandas', 'numpy', 'pytorch', 'machine learning', 'tensorflow'].includes(s));
    const isFrontend = !isPython && (domain.toLowerCase().includes('frontend') || skillsLower.some(s => ['react', 'vue', 'angular', 'next.js', 'tailwind css', 'redux', 'html5/css3', 'frontend'].includes(s)));
    const isNode = !isPython && !isFrontend && skillsLower.some(s => ['node.js', 'express', 'nestjs', 'javascript', 'typescript'].includes(s));
    const isGo = skillsLower.some(s => ['go', 'golang', 'gin'].includes(s));
    const isDebugging = challengeId === 2 || challenge?.title?.toLowerCase().includes('debugging');

    const insertQ = db.prepare(`
      INSERT INTO assessment_questions (
        assessment_id, question_type, question_text, options, correct_answer, points, skill, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (isPython) {
      // Python Medium-Level Practical Assessment
      insertQ.run(
        assessmentId,
        'CODING',
        'Implement an asynchronous FastAPI route handler `POST /api/v1/metrics/batch` in Python. It must parse a list of telemetry events, asynchronously filter out duplicate records using an in-memory set, compute aggregate statistics (min, max, and mean latency), and return HTTP 201 Created with a summary JSON response.',
        null,
        'from fastapi import FastAPI, status\nfrom pydantic import BaseModel\nfrom typing import List\n\napp = FastAPI()\n\nclass Event(BaseModel):\n    id: str\n    latency_ms: float\n\n@app.post("/api/v1/metrics/batch", status_code=status.HTTP_201_CREATED)\nasync def process_batch(events: List[Event]):\n    seen, unique = set(), []\n    for e in events:\n        if e.id not in seen:\n            seen.add(e.id)\n            unique.append(e.latency_ms)\n    if not unique:\n        return {"count": 0, "min": 0, "max": 0, "mean": 0}\n    return {\n        "count": len(unique),\n        "min": min(unique),\n        "max": max(unique),\n        "mean": round(sum(unique) / len(unique), 2)\n    }',
        25,
        'Python',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        'Diagnose the latency and blocking bug in this Python asynchronous service under 200 concurrent requests:\n\n```python\n@app.get("/analytics")\nasync def get_analytics(payload: list[int]):\n    # Synchronous CPU-intensive matrix calculation\n    res = heavy_cpu_matrix_transform(payload)\n    return {"result": res}\n```\nExplain why `async def` does not prevent request blocking and provide the fix using `asyncio.to_thread` or an executor.',
        null,
        'Because asyncio runs on a single event loop thread, synchronous CPU-intensive operations block the entire loop and freeze all incoming concurrent connections. Fix by delegating the CPU-bound operation to a thread or process pool executor: `res = await asyncio.to_thread(heavy_cpu_matrix_transform, payload)` or using `loop.run_in_executor(None, heavy_cpu_matrix_transform, payload)`.',
        25,
        'Debugging',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query for SQLite/PostgreSQL to calculate the daily average response time and total error count (status_code >= 400) from an `api_logs` table for the last 14 days, grouped by day and sorted chronologically.',
        null,
        'SELECT date(created_at) as log_date, COUNT(*) as total_requests, AVG(latency_ms) as avg_latency, SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count FROM api_logs WHERE created_at >= date("now", "-14 days") GROUP BY log_date ORDER BY log_date ASC;',
        20,
        'SQL',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'Explain the trade-offs between asynchronous event loops (FastAPI / asyncio) and multi-process WSGI architectures (Gunicorn with Django/Flask) for high-throughput microservices. Under what conditions does the Python Global Interpreter Lock (GIL) become a throughput bottleneck?',
        null,
        'Asyncio excels at high-concurrency I/O-bound workflows (network, database, HTTP) with minimal memory footprint per connection. However, due to Python Global Interpreter Lock (GIL), CPU-bound tasks saturate a single thread and block the event loop. Multi-process architectures like Gunicorn fork independent Python processes across multiple CPU cores, bypassing GIL contention at the cost of higher per-process memory consumption.',
        15,
        'Problem Solving',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'MCQ',
        'In Python, what is the critical runtime performance and memory difference between a list comprehension and a generator expression when processing large datasets?',
        JSON.stringify([
          'Generator expressions compute items lazily on demand using minimal memory, whereas list comprehensions eagerly allocate the entire list in memory',
          'List comprehensions automatically run concurrently in separate background threads',
          'Generator expressions cannot be consumed inside for loops or iteration helpers',
          'List comprehensions are restricted only to primitive numeric values'
        ]),
        'Generator expressions compute items lazily on demand using minimal memory, whereas list comprehensions eagerly allocate the entire list in memory',
        15,
        'Python',
        'Intermediate'
      );

    } else if (isFrontend) {
      // 1. Coding Task (React / UI Components)
      insertQ.run(
        assessmentId,
        'CODING',
        'Implement an interactive analytics metric card component in React. It must accept a live `feedData` prop, compute average throughput using `useMemo`, display a loading spinner when data is empty, handle an error boundary, and provide a refresh button triggering an `onRefresh` callback.',
        null,
        'export function MetricCard({ feedData, loading, onRefresh }) { const avg = useMemo(() => feedData?.length ? (feedData.reduce((a, b) => a + b.value, 0) / feedData.length).toFixed(1) : 0, [feedData]); if (loading) return <Spinner />; return <div className="metric-card"><h3>Average Throughput: {avg} req/s</h3><button onClick={onRefresh}>Refresh</button></div>; }',
        25,
        'React',
        'Intermediate'
      );

      // 2. Debugging Task (React State & Re-render Loop)
      insertQ.run(
        assessmentId,
        'DEBUGGING',
        'Identify the memory leak and infinite re-render loop in this React dashboard hook snippet and explain how you would resolve it:\n\n```jsx\nfunction useLiveFeed(socketUrl) {\n  const [events, setEvents] = useState([]);\n  useEffect(() => {\n    const ws = new WebSocket(socketUrl);\n    ws.onmessage = (msg) => setEvents([...events, JSON.parse(msg.data)]);\n  }, [events]);\n  return events;\n}\n```',
        null,
        'Two major bugs: 1) Dependency array includes `events`, causing the WebSocket connection to disconnect and reconnect on every single incoming message. 2) No cleanup function closing `ws.close()`. Fix by using functional state updater `setEvents(prev => [...prev, JSON.parse(msg.data)])` and changing the dependency array to `[socketUrl]`, plus returning a cleanup `return () => ws.close();`.',
        25,
        'Debugging',
        'Intermediate'
      );

      // 3. State Management / Data Task (JavaScript / REST API)
      insertQ.run(
        assessmentId,
        'SQL',
        'Write a JavaScript data transformation function that takes an array of raw telemetry events `[{ id, timestamp, status, latencyMs, endpoint }]` and returns an object summarizing: total requests, error rate percentage (status >= 400), and top 3 slowest endpoints by p95 latency.',
        null,
        'function aggregateTelemetry(events) { const total = events.length; const errors = events.filter(e => e.status >= 400).length; const errorRate = total ? (errors / total) * 100 : 0; const byEndpoint = {}; events.forEach(e => { (byEndpoint[e.endpoint] = byEndpoint[e.endpoint] || []).push(e.latencyMs); }); const slowest = Object.entries(byEndpoint).map(([ep, latencies]) => ({ endpoint: ep, p95: latencies.sort((a,b)=>a-b)[Math.floor(latencies.length * 0.95)] || 0 })).sort((a,b)=>b.p95 - a.p95).slice(0, 3); return { total, errorRate, slowest }; }',
        20,
        'JavaScript',
        'Intermediate'
      );

      // 4. Architecture Reasoning Task (State & Rendering Trade-offs)
      insertQ.run(
        assessmentId,
        'REASONING',
        'When building a high-frequency real-time dashboard receiving 50 events/second, explain your architectural trade-offs between local React state, context API, and an external store (e.g. Zustand or Redux). How do you prevent excessive re-renders and frame drops?',
        null,
        'React Context triggers full-tree re-renders for all consumer components on every update, causing serious frame drops under 50 events/sec. An external store with selector subscriptions (like Zustand) allows individual widgets to subscribe only to their specific slice of state. Additionally, batching updates with requestAnimationFrame or throttling state commits to 60fps preserves smooth 60Hz UI rendering without CPU saturation.',
        15,
        'Problem Solving',
        'Intermediate'
      );

      // 5. MCQ Task (React Performance Optimization)
      insertQ.run(
        assessmentId,
        'MCQ',
        'Which React optimization technique is most appropriate to prevent a complex SVG chart component from re-rendering when unrelated sibling state updates in the parent dashboard?',
        JSON.stringify([
          'Wrap the chart component with React.memo() and pass memoized props via useMemo/useCallback',
          'Call forceUpdate() inside the chart render cycle',
          'Use document.getElementById() to directly mutate DOM nodes',
          'Move the chart into a synchronous while loop'
        ]),
        'Wrap the chart component with React.memo() and pass memoized props via useMemo/useCallback',
        15,
        'React',
        'Intermediate'
      );

    } else if (isNode) {
      // Node.js & JavaScript Medium-Level Practical Assessment
      insertQ.run(
        assessmentId,
        'CODING',
        'Implement an Express.js middleware and route handler `POST /api/orders` in Node.js. It must validate that `items` array is non-empty, compute the total price, handle errors asynchronously using `try/catch` with `next(err)`, and return HTTP 201 Created with the created order object.',
        null,
        'import express from "express";\nconst router = express.Router();\nrouter.post("/api/orders", async (req, res, next) => {\n  try {\n    const { items, customerId } = req.body;\n    if (!items || !Array.isArray(items) || items.length === 0) {\n      return res.status(400).json({ error: "Non-empty items array is required" });\n    }\n    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);\n    const order = await orderService.create({ customerId, items, total, status: "PENDING" });\n    res.status(201).json(order);\n  } catch (err) {\n    next(err);\n  }\n});',
        25,
        'JavaScript',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        'Diagnose the latency issue in this Node.js endpoint where event loop lag climbs under 500 concurrent connections:\n\n```javascript\napp.get("/data", async (req, res) => {\n  const raw = fs.readFileSync("./large-catalog.json", "utf-8");\n  const parsed = JSON.parse(raw);\n  res.json({ count: parsed.length });\n});\n```\nExplain why `fs.readFileSync` blocks the single-threaded Node.js event loop and provide the non-blocking asynchronous streaming or cached solution.',
        null,
        'Synchronous file I/O `fs.readFileSync` completely blocks the single JavaScript main thread on the event loop, pausing all concurrent HTTP request processing and socket I/O. Fix by using asynchronous promises `fs.promises.readFile` with memory caching, or streaming via `fs.createReadStream` piped to JSON stream parsers.',
        25,
        'Debugging',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query to find the top 5 customers by total order spend for completed orders in the last 30 days. Return customer_name, total_orders count, and total_spent, ordered descending by total_spent.',
        null,
        'SELECT c.name as customer_name, COUNT(o.id) as total_orders, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = "COMPLETED" GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 5;',
        20,
        'SQL',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'What are the key architectural trade-offs between REST APIs and GraphQL for data retrieval across microservices? How does Node.js handle backpressure when streaming large payloads over HTTP?',
        null,
        'REST provides straightforward HTTP caching, predictable network boundaries, and established status code semantics, but can suffer from over-fetching or under-fetching. GraphQL eliminates over-fetching by letting clients request precise fields, but complicates HTTP-layer caching and introduces N+1 query vulnerability. In Node.js, streams handle backpressure via the `.pipe()` method or `pipeline()`, pausing the readable stream when the downstream writable stream buffer is full.',
        15,
        'Problem Solving',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'MCQ',
        'In the Node.js event loop, when do `process.nextTick` callbacks execute relative to Promise microtasks and timer callbacks?',
        JSON.stringify([
          '`process.nextTick` callbacks run immediately after the current operation finishes, before Promise microtasks and before advancing the event loop phase',
          '`process.nextTick` callbacks only run during the Close Callbacks phase',
          'Promise microtasks always run before `process.nextTick` callbacks',
          '`process.nextTick` callbacks run synchronously every 100 milliseconds'
        ]),
        '`process.nextTick` callbacks run immediately after the current operation finishes, before Promise microtasks and before advancing the event loop phase',
        15,
        'JavaScript',
        'Intermediate'
      );

    } else if (isGo) {
      // Go Systems Practical Assessment
      insertQ.run(
        assessmentId,
        'CODING',
        'Implement a thread-safe in-memory cache in Go with `Set(key string, val interface{})` and `Get(key string) (interface{}, bool)` using `sync.RWMutex` to prevent concurrent map read/write panics.',
        null,
        'type SafeCache struct { mu sync.RWMutex; store map[string]interface{} }\nfunc NewCache() *SafeCache { return &SafeCache{store: make(map[string]interface{})} }\nfunc (c *SafeCache) Set(k string, v interface{}) { c.mu.Lock(); defer c.mu.Unlock(); c.store[k] = v }\nfunc (c *SafeCache) Get(k string) (interface{}, bool) { c.mu.RLock(); defer c.mu.RUnlock(); val, ok := c.store[k]; return val, ok }',
        25,
        'Go',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        'Identify the goroutine leak in this Go snippet where worker goroutines block indefinitely when client context times out:\n\n```go\nfunc queryService(ctx context.Context) string {\n    ch := make(chan string)\n    go func() { ch <- fetchRemote() }()\n    select {\n    case res := <-ch: return res\n    case <-ctx.Done(): return "timeout"\n    }\n}\n```\nExplain root cause and provide the fix using a buffered channel.',
        null,
        'Because `ch` is an unbuffered channel (`make(chan string)`), when `ctx.Done()` fires first, the receiving select exits. The worker goroutine attempting `ch <- fetchRemote()` blocks forever waiting for a receiver, leaking goroutines. Fix by creating a buffered channel `ch := make(chan string, 1)` so the goroutine can write and exit without blocking.',
        25,
        'Debugging',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query to find top 5 slowest endpoints by p95 response time over the last 24 hours, returning endpoint, request count, and p95 latency.',
        null,
        'SELECT endpoint, COUNT(*) as req_count, AVG(latency_ms) as avg_latency FROM api_logs WHERE created_at >= datetime("now", "-24 hours") GROUP BY endpoint ORDER BY avg_latency DESC LIMIT 5;',
        20,
        'SQL',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'Explain the trade-offs between goroutines and OS threads in high-concurrency network servers. How does Go\'s M:N runtime scheduler manage thread context switching efficiently?',
        null,
        'Goroutines are user-space threads with small 2KB stack frames that grow dynamically, whereas OS threads require 1MB+ and involve kernel context switches. Go uses an M:N work-stealing scheduler where M goroutines run across N OS threads. When a goroutine blocks on a network socket, the runtime suspends it without blocking the underlying OS thread, allowing other goroutines to execute seamlessly.',
        15,
        'Problem Solving',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'MCQ',
        'What occurs at runtime in Go when attempting to send a value to a channel that has already been closed?',
        JSON.stringify([
          'A runtime panic is triggered: "send on closed channel"',
          'The sent value is silently dropped without error',
          'The channel automatically reopens to accept the payload',
          'The current goroutine blocks indefinitely without terminating'
        ]),
        'A runtime panic is triggered: "send on closed channel"',
        15,
        'Go',
        'Intermediate'
      );

    } else if (isDebugging) {
      // High-volume Debugging & Performance Tasks (Intermediate)
      insertQ.run(
        assessmentId,
        'CODING',
        'Implement an in-memory Rate Limiter token-bucket class in Java or TypeScript that enforces 100 requests per minute per IP address, with thread-safe atomic token replenishment and non-blocking rejection.',
        null,
        'class TokenBucketRateLimiter { private final long capacity; private final AtomicLong tokens; private final AtomicLong lastRefill; public TokenBucketRateLimiter(long capacity) { this.capacity = capacity; this.tokens = new AtomicLong(capacity); this.lastRefill = new AtomicLong(System.currentTimeMillis()); } public boolean allowRequest() { refill(); return tokens.getAndUpdate(t -> t > 0 ? t - 1 : 0) > 0; } }',
        25,
        'Performance',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        'Diagnose the latency spike in this database connection pool configuration where threads enter TIMED_WAITING under 5,000 concurrent requests:\n\n```properties\nhikari.maximumPoolSize=10\nhikari.connectionTimeout=30000\nhikari.leakDetectionThreshold=2000\n```\nExplain root cause and optimal configuration adjustments.',
        null,
        'Connection starvation caused by pool size of 10 being heavily undersized for 5000 concurrent requests with long transactions. Threads queue up and time out after 30 seconds. Solution: Increase Hikari pool size based on CPU cores * 2 + effective spindle count (e.g. 30-50), reduce transaction hold times, and add read-replicas.',
        25,
        'Debugging',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write an EXPLAIN ANALYZE-optimized SQL query that scans transactions to retrieve hourly throughput and average execution time, utilizing composite indexes on `(tenant_id, created_at)`.',
        null,
        'SELECT strftime("%Y-%m-%d %H:00:00", created_at) as hour, COUNT(*) as tx_count, AVG(execution_time_ms) as avg_time FROM transactions WHERE tenant_id = ? AND created_at >= datetime("now", "-24 hours") GROUP BY hour ORDER BY hour ASC;',
        20,
        'SQL',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'What are the trade-offs between distributed tracing (e.g. OpenTelemetry with Jaeger) and log aggregation (e.g. ELK) when identifying p99 tail latency spikes across microservices?',
        null,
        'Distributed tracing provides causal request context across network hops with span timings, isolating the specific bottleneck service. Log aggregation provides verbose localized details but lacks unified request DAG visualization and suffers high storage costs under heavy traffic.',
        15,
        'Problem Solving',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'MCQ',
        'Which pattern prevents cascading failures when a downstream payment microservice experiences severe latency or downtime?',
        JSON.stringify([
          'Circuit Breaker pattern with graceful fallback or degraded response',
          'Synchronous busy-waiting while loop with no timeout',
          'Increasing connection timeout from 30s to 10 minutes',
          'Sending 10 parallel duplicate requests for redundancy'
        ]),
        'Circuit Breaker pattern with graceful fallback or degraded response',
        15,
        'Debugging',
        'Intermediate'
      );

    } else {
      // Standard Backend Engineering Tasks (Java, Spring Boot, SQL, REST API) - Medium Level
      insertQ.run(
        assessmentId,
        'CODING',
        'Implement an API endpoint in Java/Spring Boot that creates a new order. It must validate order items, calculate the total amount, verify inventory availability, and return a 201 Created status with the newly created Order response body.',
        null,
        '@PostMapping("/api/orders") public ResponseEntity<Order> createOrder(@Valid @RequestBody OrderRequest req) { Order created = orderService.createOrder(req); return ResponseEntity.status(HttpStatus.CREATED).body(created); }',
        25,
        'Java',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        'Identify the issue in this backend concurrent order service snippet and explain how you would fix it. Two simultaneous requests for the last available inventory item both succeed, resulting in negative inventory:\n\n```java\n@Transactional\npublic OrderResult placeOrder(Long productId, int quantity) {\n    Product product = productRepository.findById(productId).orElseThrow();\n    if (product.getStock() >= quantity) {\n        product.setStock(product.getStock() - quantity);\n        productRepository.save(product);\n        return OrderResult.success();\n    }\n    return OrderResult.outOfStock();\n}\n```',
        null,
        'Race condition / lost update caused by non-atomic check-then-act. Fix by using SELECT ... FOR UPDATE (pessimistic write locking) or atomic database decrement: UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?.',
        25,
        'Debugging',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query to find the top 5 customers by total order value for completed orders in the last 30 days. Return customer_name, total_orders count, and total_spent, ordered descending by total_spent.',
        null,
        'SELECT c.name as customer_name, COUNT(o.id) as total_orders, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = "COMPLETED" GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 5;',
        20,
        'SQL',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'Why did you choose REST for this system? What trade-offs did you consider between synchronous REST APIs and asynchronous message queuing (e.g. Kafka/RabbitMQ) for checkout initiation vs inventory reservation and billing fulfillment?',
        null,
        'Synchronous REST provides immediate feedback and predictable ACID consistency for order creation, but couples client latency. Asynchronous message queuing (e.g. Kafka outbox) decouples downstream fulfillment and prevents catastrophic backpressure, but introduces eventual consistency and requires idempotent retry handlers.',
        15,
        'Problem Solving',
        'Intermediate'
      );

      insertQ.run(
        assessmentId,
        'MCQ',
        'Which HTTP header and status code combination should be implemented on the order creation endpoint to guarantee idempotency and prevent duplicate billing upon network retries?',
        JSON.stringify([
          'Idempotency-Key header returning 200 OK with cached original response payload',
          'ETag header returning 412 Precondition Failed on replay',
          'Authorization header returning 401 Unauthorized',
          'Cache-Control header returning 304 Not Modified'
        ]),
        'Idempotency-Key header returning 200 OK with cached original response payload',
        15,
        'REST API',
        'Intermediate'
      );
    }
  } catch (err) {
    console.error(`Failed to seed questions for assessment ${assessmentId}:`, err);
  }
}
