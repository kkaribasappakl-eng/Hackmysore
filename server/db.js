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
      starter_code TEXT,
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
  try { db.exec("ALTER TABLE assessment_questions ADD COLUMN starter_code TEXT;"); } catch {}

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

    // 7. Ensure All 5 Resume-Matched Intermediate Challenges exist
    const challengeList = [
      {
        id: 1,
        title: 'Backend Order Management API',
        description: 'Review and fix an intermediate-level Java & Spring Boot Order REST API service containing concurrency race conditions, missing payload validations, and incorrect HTTP response statuses.',
        domain: 'Backend Engineering',
        difficulty: 'Intermediate',
        skills: JSON.stringify(['Java', 'SQL', 'REST API', 'Spring Boot', 'Debugging']),
        prerequisites: JSON.stringify(['Java 17+', 'Spring Boot Basics', 'SQL Concurrency', 'REST Semantics'])
      },
      {
        id: 2,
        title: 'Production API Debugging & Concurrency',
        description: 'Pinpoint and resolve thread deadlocks, Hikari connection starvation, and query latency spikes in a high-volume financial ledger service.',
        domain: 'Backend Engineering',
        difficulty: 'Advanced',
        skills: JSON.stringify(['Java', 'Debugging', 'Performance']),
        prerequisites: JSON.stringify(['Java Concurrency', 'Database Locks', 'HikariCP'])
      },
      {
        id: 3,
        title: 'Frontend Dashboard & State Management',
        description: 'Review and fix an intermediate-level React & WebSocket telemetry dashboard containing state mutations, stale closure memory leaks, and infinite re-render loops.',
        domain: 'Frontend Engineering',
        difficulty: 'Intermediate',
        skills: JSON.stringify(['React', 'JavaScript', 'REST API', 'Tailwind CSS', 'Debugging']),
        prerequisites: JSON.stringify(['React Hooks', 'State Immutability', 'WebSocket Lifecycle', 'Memoization'])
      },
      {
        id: 4,
        title: 'Python Data Pipeline & Microservice API',
        description: 'Review and fix an intermediate-level Python & FastAPI data ingestion service with blocking event-loop operations, mutable default arguments, and Pandas data transformation bugs.',
        domain: 'Machine Learning',
        difficulty: 'Intermediate',
        skills: JSON.stringify(['Python', 'FastAPI', 'Pandas', 'REST API', 'SQL', 'Debugging']),
        prerequisites: JSON.stringify(['Python 3.11', 'AsyncIO Event Loops', 'FastAPI Routes', 'Pandas Aggregations'])
      },
      {
        id: 5,
        title: 'Fullstack Microservice & Event Platform',
        description: 'Review and fix an intermediate-level Node.js, Express, and React fullstack ordering service with unhandled async promise rejections, header collisions, and inventory validation bugs.',
        domain: 'Fullstack Engineering',
        difficulty: 'Intermediate',
        skills: JSON.stringify(['Node.js', 'Express', 'React', 'TypeScript', 'MongoDB', 'Debugging']),
        prerequisites: JSON.stringify(['Node.js Event Loop', 'Express Middleware', 'React Lifecycle', 'Async/Await'])
      }
    ];

    for (const c of challengeList) {
      const existing = db.prepare('SELECT id FROM challenges WHERE id = ?').get(c.id);
      if (existing) {
        db.prepare(`
          UPDATE challenges
          SET title = ?, description = ?, domain = ?, difficulty = ?, skills = ?, prerequisites = ?
          WHERE id = ?
        `).run(c.title, c.description, c.domain, c.difficulty, c.skills, c.prerequisites, c.id);
      } else {
        db.prepare(`
          INSERT INTO challenges (id, title, description, domain, difficulty, skills, prerequisites, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(c.id, c.title, c.description, c.domain, c.difficulty, c.skills, c.prerequisites, now);
      }
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
        assessment_id, question_type, question_text, options, correct_answer, points, skill, difficulty, starter_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (isPython) {
      // Python Medium-Level Practical Assessment (FastAPI, Pandas, AsyncIO)
      const pythonBuggyCode = `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np

app = FastAPI()

class TelemetryRecord(BaseModel):
    device_id: str
    latency_ms: float
    error_flag: bool

# BUG 1: Mutable default argument seen_ids=set() persists state across ALL client requests!
def compute_metrics(events: List[TelemetryRecord], seen_ids=set()):
    unique_latencies = []
    for e in events:
        if e.device_id not in seen_ids:
            seen_ids.add(e.device_id)
            unique_latencies.append(e.latency_ms)

    # BUG 2: ZeroDivisionError if all duplicates or empty list!
    mean_val = sum(unique_latencies) / len(unique_latencies)
    df = pd.DataFrame({"latency": unique_latencies})
    p95 = float(np.percentile(df["latency"], 95))
    return {"count": len(unique_latencies), "mean": round(mean_val, 2), "p95": round(p95, 2)}

# BUG 3: Synchronous heavy CPU calculation in async route blocks the entire asyncio event loop!
@app.post("/api/v1/telemetry/process", status_code=status.HTTP_200_OK) # BUG: should be 201 Created
async def process_telemetry(payload: List[TelemetryRecord]):
    # Heavy CPU computation runs on main loop thread, blocking 500 concurrent connections
    result = compute_metrics(payload)
    return result`;

      insertQ.run(
        assessmentId,
        'CODING',
        `### Intermediate Python Coding Challenge: Fix Async FastAPI Batch Metrics Pipeline

Review the provided intermediate-level Python FastAPI route handler below. It contains **3 deliberate production bugs**:
1. **Event Loop Blocking**: Executes a synchronous, CPU-intensive Pandas/NumPy matrix transformation directly inside \`async def\` without \`asyncio.to_thread\` or an executor, completely freezing all concurrent request handling.
2. **Mutable Default Argument**: \`def compute_metrics(events, seen_ids=set()):\` shares the mutable \`set\` across all incoming HTTP requests, creating data leaks between different users.
3. **Unhandled Zero/Empty Division**: \`mean = total / count\` throws \`ZeroDivisionError\` when processing an empty or all-duplicate batch, crashing with HTTP 500 instead of returning HTTP 201 with zero-valued summary.

**Task**: Identify the bugs, fix the code, and write the complete, corrected asynchronous FastAPI endpoint and metric calculation logic.

\`\`\`python
${pythonBuggyCode}
\`\`\``,
        null,
        `import asyncio
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np

app = FastAPI()

class TelemetryRecord(BaseModel):
    device_id: str
    latency_ms: float
    error_flag: bool

def compute_metrics(events: List[TelemetryRecord], seen_ids: Optional[set] = None):
    if seen_ids is None:
        seen_ids = set()
    unique_latencies = []
    for e in events:
        if e.device_id not in seen_ids:
            seen_ids.add(e.device_id)
            unique_latencies.append(e.latency_ms)

    if not unique_latencies:
        return {"count": 0, "mean": 0.0, "p95": 0.0}

    mean_val = sum(unique_latencies) / len(unique_latencies)
    df = pd.DataFrame({"latency": unique_latencies})
    p95 = float(np.percentile(df["latency"], 95))
    return {"count": len(unique_latencies), "mean": round(mean_val, 2), "p95": round(p95, 2)}

@app.post("/api/v1/telemetry/process", status_code=status.HTTP_201_CREATED)
async def process_telemetry(payload: List[TelemetryRecord]):
    result = await asyncio.to_thread(compute_metrics, payload, None)
    return result`,
        25,
        'Python',
        'Intermediate',
        pythonBuggyCode
      );

      const pythonDebugCode = `@app.get("/analytics")
async def get_analytics(payload: list[int]):
    # Synchronous CPU-intensive matrix calculation blocks event loop!
    res = heavy_cpu_matrix_transform(payload)
    return {"result": res}`;

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        `### Intermediate Python Debugging Challenge: Asynchronous Event Loop Block

Diagnose the latency and blocking bug in this Python asynchronous service under 200 concurrent requests:

\`\`\`python
${pythonDebugCode}
\`\`\`

Explain why \`async def\` does not prevent request blocking and provide the fix using \`asyncio.to_thread\` or an executor.`,
        null,
        'Because asyncio runs on a single event loop thread, synchronous CPU-intensive operations block the entire loop and freeze all incoming concurrent connections. Fix by delegating the CPU-bound operation to a thread or process pool executor: `res = await asyncio.to_thread(heavy_cpu_matrix_transform, payload)` or using `loop.run_in_executor(None, heavy_cpu_matrix_transform, payload)`.',
        25,
        'Debugging',
        'Intermediate',
        pythonDebugCode
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query for SQLite/PostgreSQL to calculate the daily average response time and total error count (status_code >= 400) from an `api_logs` table for the last 14 days, grouped by day and sorted chronologically.',
        null,
        'SELECT date(created_at) as log_date, COUNT(*) as total_requests, AVG(latency_ms) as avg_latency, SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count FROM api_logs WHERE created_at >= date("now", "-14 days") GROUP BY log_date ORDER BY log_date ASC;',
        20,
        'SQL',
        'Intermediate',
        '-- Write SQL query to calculate daily avg response time and error count\nSELECT date(created_at) as log_date, ...'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'Explain the trade-offs between asynchronous event loops (FastAPI / asyncio) and multi-process WSGI architectures (Gunicorn with Django/Flask) for high-throughput microservices. Under what conditions does the Python Global Interpreter Lock (GIL) become a throughput bottleneck?',
        null,
        'Asyncio excels at high-concurrency I/O-bound workflows (network, database, HTTP) with minimal memory footprint per connection. However, due to Python Global Interpreter Lock (GIL), CPU-bound tasks saturate a single thread and block the event loop. Multi-process architectures like Gunicorn fork independent Python processes across multiple CPU cores, bypassing GIL contention at the cost of higher per-process memory consumption.',
        15,
        'Problem Solving',
        'Intermediate',
        null
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
        'Intermediate',
        null
      );

    } else if (isFrontend) {
      // Frontend Medium-Level Practical Assessment (React, Hooks, WebSockets)
      const reactBuggyCode = `import React, { useState, useEffect, useMemo } from 'react';

export default function LiveOrderFeed({ socketUrl }) {
  const [orders, setOrders] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(socketUrl);
    ws.onopen = () => setConnected(true);

    // BUG 1: Direct state mutation! orders.push does not trigger re-render in React
    ws.onmessage = (event) => {
      const newOrder = JSON.parse(event.data);
      orders.push(newOrder); // Direct mutation!
      setOrders(orders);     // Same reference, React skips render
    };

    // BUG 2: Missing ws.close() cleanup function, leaking open connections!
  }, [orders]); // BUG 2: Depending on orders creates an infinite reconnection loop!

  // BUG 3: Crashes if orders is empty or elements lack amount
  const totalVolume = orders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Live Stream ({orders.length} orders)</h2>
        <span className={connected ? "text-emerald-400" : "text-amber-400"}>
          {connected ? "● Connected" : "○ Connecting"}
        </span>
      </div>
      <div className="text-xl font-mono mb-4">Total Volume: \${totalVolume.toFixed(2)}</div>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {orders.slice(-5).map((order) => (
          <li key={order.id} className="p-2 bg-slate-800 rounded font-mono text-xs">
            #{order.id} - \${order.amount} ({order.status})
          </li>
        ))}
      </ul>
    </div>
  );
}`;

      insertQ.run(
        assessmentId,
        'CODING',
        `### Intermediate React Coding Challenge: Fix Live Orders & Metrics Dashboard

Review the provided intermediate-level React component below. It contains **3 deliberate production bugs**:
1. **Direct State Mutation**: Mutates \`orders\` directly using \`orders.push(data)\` instead of creating a new array reference with functional state updates (\`setOrders(prev => [...prev, data])\`), breaking React re-renders.
2. **Stale Closure & WebSocket Connection Leak in \`useEffect\`**: The effect hook depends on \`[orders]\` without a cleanup function (\`ws.close()\`), triggering new socket connections on every message and causing a memory leak.
3. **Missing Loading / Empty State Boundary**: Directly computes summary metrics without checking for null/empty feed data, triggering \`TypeError: Cannot read properties of undefined\`.

**Task**: Identify the bugs, fix the code, and provide the fully corrected React component using \`useMemo\`, proper cleanup, and safe state updates.

\`\`\`jsx
${reactBuggyCode}
\`\`\``,
        null,
        `import React, { useState, useEffect, useMemo } from 'react';

export default function LiveOrderFeed({ socketUrl }) {
  const [orders, setOrders] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socketUrl) return;
    const ws = new WebSocket(socketUrl);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const newOrder = JSON.parse(event.data);
        setOrders(prev => [...prev.slice(-99), newOrder]);
      } catch (err) {
        console.error("Malformed feed message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [socketUrl]);

  const totalVolume = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return 0;
    return orders.reduce((sum, o) => sum + (Number(o?.amount) || 0), 0);
  }, [orders]);

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Live Stream ({orders.length} orders)</h2>
        <span className={connected ? "text-emerald-400" : "text-amber-400"}>
          {connected ? "● Connected" : "○ Connecting"}
        </span>
      </div>
      <div className="text-xl font-mono mb-4">Total Volume: \${totalVolume.toFixed(2)}</div>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {orders.slice(-5).map((order) => (
          <li key={order.id || Math.random()} className="p-2 bg-slate-800 rounded font-mono text-xs">
            #{order.id} - \${order.amount} ({order.status || 'PROCESSED'})
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        25,
        'React',
        'Intermediate',
        reactBuggyCode
      );

      const reactDebugCode = `function useLiveFeed(socketUrl) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const ws = new WebSocket(socketUrl);
    ws.onmessage = (msg) => setEvents([...events, JSON.parse(msg.data)]);
  }, [events]); // BUG: Depending on events creates infinite reconnect loop!
  return events;
}`;

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        `### Intermediate React Debugging Challenge: Infinite Re-render Loop & Memory Leak

Identify the memory leak and infinite re-render loop in this React dashboard hook snippet and explain how you would resolve it:

\`\`\`jsx
${reactDebugCode}
\`\`\``,
        null,
        'Two major bugs: 1) Dependency array includes `events`, causing the WebSocket connection to disconnect and reconnect on every single incoming message. 2) No cleanup function closing `ws.close()`. Fix by using functional state updater `setEvents(prev => [...prev, JSON.parse(msg.data)])` and changing the dependency array to `[socketUrl]`, plus returning a cleanup `return () => ws.close();`.',
        25,
        'Debugging',
        'Intermediate',
        reactDebugCode
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a JavaScript data transformation function that takes an array of raw telemetry events `[{ id, timestamp, status, latencyMs, endpoint }]` and returns an object summarizing: total requests, error rate percentage (status >= 400), and top 3 slowest endpoints by p95 latency.',
        null,
        'function aggregateTelemetry(events) { const total = events.length; const errors = events.filter(e => e.status >= 400).length; const errorRate = total ? (errors / total) * 100 : 0; const byEndpoint = {}; events.forEach(e => { (byEndpoint[e.endpoint] = byEndpoint[e.endpoint] || []).push(e.latencyMs); }); const slowest = Object.entries(byEndpoint).map(([ep, latencies]) => ({ endpoint: ep, p95: latencies.sort((a,b)=>a-b)[Math.floor(latencies.length * 0.95)] || 0 })).sort((a,b)=>b.p95 - a.p95).slice(0, 3); return { total, errorRate, slowest }; }',
        20,
        'JavaScript',
        'Intermediate',
        'function aggregateTelemetry(events) {\n  // Transform raw telemetry events into summary\n}'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'When building a high-frequency real-time dashboard receiving 50 events/second, explain your architectural trade-offs between local React state, context API, and an external store (e.g. Zustand or Redux). How do you prevent excessive re-renders and frame drops?',
        null,
        'React Context triggers full-tree re-renders for all consumer components on every update, causing serious frame drops under 50 events/sec. An external store with selector subscriptions (like Zustand) allows individual widgets to subscribe only to their specific slice of state. Additionally, batching updates with requestAnimationFrame or throttling state commits to 60fps preserves smooth 60Hz UI rendering without CPU saturation.',
        15,
        'Problem Solving',
        'Intermediate',
        null
      );

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
        'Intermediate',
        null
      );

    } else if (isNode) {
      // Node.js & JavaScript Medium-Level Practical Assessment (Express, Async, MongoDB)
      const nodeBuggyCode = `import express from 'express';
const router = express.Router();

// BUG 1: Missing try/catch or async wrapper allows unhandled promise rejections to crash Node!
router.post('/orders', async (req, res, next) => {
  const { customerId, items } = req.body;

  // BUG 2: Missing return statement! Code continues executing and throws ERR_HTTP_HEADERS_SENT!
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Order must contain at least one item' });
  }

  // BUG 3: No validation on negative quantities or price tampering!
  let totalAmount = 0;
  for (const item of items) {
    totalAmount += item.price * item.quantity;
  }

  const newOrder = await orderDatabase.create({
    customerId,
    items,
    totalAmount,
    status: 'PENDING',
    createdAt: new Date()
  });

  // BUG 4: Returns 200 instead of 201 Created
  res.status(200).json(newOrder);
});

export default router;`;

      insertQ.run(
        assessmentId,
        'CODING',
        `### Intermediate Fullstack Coding Challenge: Fix Express.js Order Router & Middleware

Review the provided intermediate-level Node.js / Express.js router below. It contains **3 deliberate production bugs**:
1. **Missing \`return\` on Validation Failure**: \`res.status(400).json(...)\` does not return, allowing execution to fall through into database insertion and causing \`Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client\`.
2. **Unhandled Promise Rejections in Async Handler**: Async route lacks \`try/catch\` or an async error wrapper, causing unhandled promise rejections to crash the Node process under database disconnections.
3. **Negative Quantity & Missing Price Boundary Checks**: Does not validate that \`quantity > 0\` and \`price >= 0\`, enabling malicious clients to submit negative order amounts and drain store balances.

**Task**: Identify the bugs, fix the code, and write the complete, corrected, robust Express.js router with transactional integrity and proper error propagation.

\`\`\`javascript
${nodeBuggyCode}
\`\`\``,
        null,
        `import express from 'express';
const router = express.Router();

router.post('/orders', async (req, res, next) => {
  try {
    const { customerId, items } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0 || typeof item.price !== 'number' || item.price < 0) {
        return res.status(400).json({ error: 'Each item must have a valid productId, positive quantity, and non-negative price' });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder = await orderDatabase.create({
      customerId,
      items,
      totalAmount,
      status: 'CONFIRMED',
      createdAt: new Date()
    });

    return res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
});

export default router;`,
        25,
        'JavaScript',
        'Intermediate',
        nodeBuggyCode
      );

      const nodeDebugCode = `app.get("/data", async (req, res) => {
  // Synchronous file read blocks the single-threaded Node.js event loop
  const raw = fs.readFileSync("./large-catalog.json", "utf-8");
  const parsed = JSON.parse(raw);
  res.json({ count: parsed.length });
});`;

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        `### Intermediate Node.js Debugging Challenge: Event Loop Latency Spike

Diagnose the latency issue in this Node.js endpoint where event loop lag climbs under 500 concurrent connections:

\`\`\`javascript
${nodeDebugCode}
\`\`\`

Explain why \`fs.readFileSync\` blocks the single-threaded Node.js event loop and provide the non-blocking asynchronous streaming or cached solution.`,
        null,
        'Synchronous file I/O `fs.readFileSync` completely blocks the single JavaScript main thread on the event loop, pausing all concurrent HTTP request processing and socket I/O. Fix by using asynchronous promises `fs.promises.readFile` with memory caching, or streaming via `fs.createReadStream` piped to JSON stream parsers.',
        25,
        'Debugging',
        'Intermediate',
        nodeDebugCode
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query to find the top 5 customers by total order spend for completed orders in the last 30 days. Return customer_name, total_orders count, and total_spent, ordered descending by total_spent.',
        null,
        'SELECT c.name as customer_name, COUNT(o.id) as total_orders, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = "COMPLETED" GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 5;',
        20,
        'SQL',
        'Intermediate',
        '-- Write SQL query to find top 5 customers by spend\nSELECT c.name ...'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'What are the key architectural trade-offs between REST APIs and GraphQL for data retrieval across microservices? How does Node.js handle backpressure when streaming large payloads over HTTP?',
        null,
        'REST provides straightforward HTTP caching, predictable network boundaries, and established status code semantics, but can suffer from over-fetching or under-fetching. GraphQL eliminates over-fetching by letting clients request precise fields, but complicates HTTP-layer caching and introduces N+1 query vulnerability. In Node.js, streams handle backpressure via the `.pipe()` method or `pipeline()`, pausing the readable stream when the downstream writable stream buffer is full.',
        15,
        'Problem Solving',
        'Intermediate',
        null
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
        'Intermediate',
        null
      );

    } else if (isGo) {
      // Go Systems Practical Assessment
      const goBuggyCode = `type SafeCache struct {
    mu sync.RWMutex
    store map[string]interface{}
}

func (c *SafeCache) Set(k string, v interface{}) {
    // BUG: Missing mu.Lock() causes concurrent map read/write runtime crash!
    c.store[k] = v
}

func (c *SafeCache) Get(k string) (interface{}, bool) {
    // BUG: Missing mu.RLock() causes fatal data race!
    val, ok := c.store[k]
    return val, ok
}`;

      insertQ.run(
        assessmentId,
        'CODING',
        `### Intermediate Go Coding Challenge: Fix Thread-Safe In-Memory Cache

Review the provided Go cache struct below. It contains **2 deliberate concurrency bugs**:
1. \`Set\` writes to the underlying map without acquiring an exclusive write lock (\`c.mu.Lock()\`), causing a fatal runtime panic under concurrent writes: \`fatal error: concurrent map writes\`.
2. \`Get\` reads from the map without a shared read lock (\`c.mu.RLock()\`), resulting in data races.

**Task**: Fix the implementation to make it strictly thread-safe using \`sync.RWMutex\`.

\`\`\`go
${goBuggyCode}
\`\`\``,
        null,
        'type SafeCache struct { mu sync.RWMutex; store map[string]interface{} }\nfunc NewCache() *SafeCache { return &SafeCache{store: make(map[string]interface{})} }\nfunc (c *SafeCache) Set(k string, v interface{}) { c.mu.Lock(); defer c.mu.Unlock(); c.store[k] = v }\nfunc (c *SafeCache) Get(k string) (interface{}, bool) { c.mu.RLock(); defer c.mu.RUnlock(); val, ok := c.store[k]; return val, ok }',
        25,
        'Go',
        'Intermediate',
        goBuggyCode
      );

      const goDebugCode = `func queryService(ctx context.Context) string {
    ch := make(chan string) // BUG: Unbuffered channel leaks worker goroutine on context timeout!
    go func() { ch <- fetchRemote() }()
    select {
    case res := <-ch: return res
    case <-ctx.Done(): return "timeout"
    }
}`;

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        `### Intermediate Go Debugging Challenge: Goroutine Leak on Context Timeout

Identify the goroutine leak in this Go snippet where worker goroutines block indefinitely when client context times out:

\`\`\`go
${goDebugCode}
\`\`\`

Explain root cause and provide the fix using a buffered channel.`,
        null,
        'Because `ch` is an unbuffered channel (`make(chan string)`), when `ctx.Done()` fires first, the receiving select exits. The worker goroutine attempting `ch <- fetchRemote()` blocks forever waiting for a receiver, leaking goroutines. Fix by creating a buffered channel `ch := make(chan string, 1)` so the goroutine can write and exit without blocking.',
        25,
        'Debugging',
        'Intermediate',
        goDebugCode
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query to find top 5 slowest endpoints by p95 response time over the last 24 hours, returning endpoint, request count, and p95 latency.',
        null,
        'SELECT endpoint, COUNT(*) as req_count, AVG(latency_ms) as avg_latency FROM api_logs WHERE created_at >= datetime("now", "-24 hours") GROUP BY endpoint ORDER BY avg_latency DESC LIMIT 5;',
        20,
        'SQL',
        'Intermediate',
        'SELECT endpoint, ...'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'Explain the trade-offs between goroutines and OS threads in high-concurrency network servers. How does Go\'s M:N runtime scheduler manage thread context switching efficiently?',
        null,
        'Goroutines are user-space threads with small 2KB stack frames that grow dynamically, whereas OS threads require 1MB+ and involve kernel context switches. Go uses an M:N work-stealing scheduler where M goroutines run across N OS threads. When a goroutine blocks on a network socket, the runtime suspends it without blocking the underlying OS thread, allowing other goroutines to execute seamlessly.',
        15,
        'Problem Solving',
        'Intermediate',
        null
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
        'Intermediate',
        null
      );

    } else if (isDebugging) {
      // High-volume Debugging & Performance Tasks (Intermediate / Advanced)
      const rateLimiterBuggyCode = `class TokenBucketRateLimiter {
    private long capacity;
    private long tokens; // BUG: Non-atomic primitive causes race conditions under concurrent threads!

    public TokenBucketRateLimiter(long capacity) {
        this.capacity = capacity;
        this.tokens = capacity;
    }

    // BUG: Non-thread-safe check-then-decrement allows multiple threads to bypass the limit!
    public boolean allowRequest() {
        if (tokens > 0) {
            tokens--;
            return true;
        }
        return false;
    }
}`;

      insertQ.run(
        assessmentId,
        'CODING',
        `### Intermediate Java Coding Challenge: Fix Thread-Safe Token Bucket Rate Limiter

Review the Java class below. It contains **2 deliberate concurrency bugs**:
1. **Thread Contention / Non-Atomic State**: Uses primitive \`long tokens\` without synchronization or \`AtomicLong\`, causing race conditions and lost decrements.
2. **Missing Refill Timing**: Has no replenishment timestamp calculation, permanently depleting after initial tokens are consumed.

**Task**: Fix the implementation to make it thread-safe and non-blocking using \`AtomicLong\` and atomic token replenishment.

\`\`\`java
${rateLimiterBuggyCode}
\`\`\``,
        null,
        'class TokenBucketRateLimiter { private final long capacity; private final AtomicLong tokens; private final AtomicLong lastRefill; public TokenBucketRateLimiter(long capacity) { this.capacity = capacity; this.tokens = new AtomicLong(capacity); this.lastRefill = new AtomicLong(System.currentTimeMillis()); } public boolean allowRequest() { refill(); return tokens.getAndUpdate(t -> t > 0 ? t - 1 : 0) > 0; } }',
        25,
        'Performance',
        'Intermediate',
        rateLimiterBuggyCode
      );

      const hikariBuggyCode = `hikari.maximumPoolSize=10
hikari.connectionTimeout=30000
hikari.leakDetectionThreshold=2000`;

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        `### Intermediate Java Debugging Challenge: Connection Pool Starvation Under 5k RPS

Diagnose the latency spike in this database connection pool configuration where threads enter TIMED_WAITING under 5,000 concurrent requests:

\`\`\`properties
${hikariBuggyCode}
\`\`\`

Explain root cause and optimal configuration adjustments.`,
        null,
        'Connection starvation caused by pool size of 10 being heavily undersized for 5000 concurrent requests with long transactions. Threads queue up and time out after 30 seconds. Solution: Increase Hikari pool size based on CPU cores * 2 + effective spindle count (e.g. 30-50), reduce transaction hold times, and add read-replicas.',
        25,
        'Debugging',
        'Intermediate',
        hikariBuggyCode
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write an EXPLAIN ANALYZE-optimized SQL query that scans transactions to retrieve hourly throughput and average execution time, utilizing composite indexes on `(tenant_id, created_at)`.',
        null,
        'SELECT strftime("%Y-%m-%d %H:00:00", created_at) as hour, COUNT(*) as tx_count, AVG(execution_time_ms) as avg_time FROM transactions WHERE tenant_id = ? AND created_at >= datetime("now", "-24 hours") GROUP BY hour ORDER BY hour ASC;',
        20,
        'SQL',
        'Intermediate',
        'SELECT strftime("%Y-%m-%d %H:00:00", created_at) as hour, ...'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'What are the trade-offs between distributed tracing (e.g. OpenTelemetry with Jaeger) and log aggregation (e.g. ELK) when identifying p99 tail latency spikes across microservices?',
        null,
        'Distributed tracing provides causal request context across network hops with span timings, isolating the specific bottleneck service. Log aggregation provides verbose localized details but lacks unified request DAG visualization and suffers high storage costs under heavy traffic.',
        15,
        'Problem Solving',
        'Intermediate',
        null
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
        'Intermediate',
        null
      );

    } else {
      // Standard Backend Engineering Tasks (Java, Spring Boot, SQL, REST API) - Intermediate Level
      const javaBuggyCode = `@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    @Autowired private OrderService orderService;

    // BUG 1: Missing @RequestBody and @Valid annotations; returns 200 instead of 201 Created
    @PostMapping
    public ResponseEntity<Order> placeOrder(OrderRequest request) {
        Order order = orderService.processOrder(request);
        return ResponseEntity.ok(order);
    }
}

@Service
public class OrderService {
    @Autowired private ProductRepository productRepo;
    @Autowired private OrderRepository orderRepo;

    // BUG 2: Race condition! Non-atomic check-then-act allows concurrent requests to oversell stock
    @Transactional
    public Order processOrder(OrderRequest req) {
        Product product = productRepo.findById(req.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStock() >= req.getQuantity()) {
            product.setStock(product.getStock() - req.getQuantity());
            productRepo.save(product);

            Order order = new Order();
            order.setCustomerId(req.getCustomerId());
            order.setProductId(req.getProductId());
            order.setQuantity(req.getQuantity());
            order.setStatus(OrderStatus.CONFIRMED);
            return orderRepo.save(order);
        }
        throw new InsufficientStockException("Out of stock");
    }
}`;

      insertQ.run(
        assessmentId,
        'CODING',
        `### Intermediate Java Coding Challenge: Fix Order Processing Service & Controller

Review the provided intermediate-level Java Spring Boot service below. It contains **3 deliberate production bugs**:
1. **Missing \`@RequestBody\` / \`@Valid\` annotations**: Incoming JSON payloads are not bound or validated, causing null pointer exceptions.
2. **Concurrency Race Condition**: Inventory check-and-decrement (\`product.getStock() >= quantity\` followed by \`product.setStock(...)\`) lacks pessimistic locking (\`SELECT ... FOR UPDATE\`), causing overselling and negative inventory under concurrent checkout requests.
3. **Incorrect HTTP Response Status**: The controller returns \`200 OK\` with an empty or improperly formatted response instead of \`201 Created\` with the persisted order details.

**Task**: Identify the bugs, fix the code, and write the complete, corrected, thread-safe Spring Boot controller and service implementation below.

\`\`\`java
${javaBuggyCode}
\`\`\``,
        null,
        `@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    @Autowired private OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> placeOrder(@Valid @RequestBody OrderRequest request) {
        Order order = orderService.processOrder(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(order.getId()).toUri();
        return ResponseEntity.created(location).body(order);
    }
}

@Service
public class OrderService {
    @Autowired private ProductRepository productRepo;
    @Autowired private OrderRepository orderRepo;

    @Transactional
    public Order processOrder(OrderRequest req) {
        Product product = productRepo.findByIdWithLock(req.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product " + req.getProductId() + " not found"));

        if (product.getStock() < req.getQuantity()) {
            throw new InsufficientStockException("Requested quantity exceeds available stock");
        }

        product.setStock(product.getStock() - req.getQuantity());
        productRepo.save(product);

        Order order = new Order();
        order.setCustomerId(req.getCustomerId());
        order.setProductId(req.getProductId());
        order.setQuantity(req.getQuantity());
        order.setStatus(OrderStatus.CONFIRMED);
        return orderRepo.save(order);
    }
}`,
        25,
        'Java',
        'Intermediate',
        javaBuggyCode
      );

      const javaDebugCode = `@Transactional
public OrderResult placeOrder(Long productId, int quantity) {
    Product product = productRepository.findById(productId).orElseThrow();
    // Non-atomic check-then-act without row-level write locks causes overselling!
    if (product.getStock() >= quantity) {
        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
        return OrderResult.success();
    }
    return OrderResult.outOfStock();
}`;

      insertQ.run(
        assessmentId,
        'DEBUGGING',
        `### Intermediate Java Debugging Challenge: Concurrent Stock Race Condition

Identify the issue in this backend concurrent order service snippet and explain how you would fix it. Two simultaneous requests for the last available inventory item both succeed, resulting in negative inventory:

\`\`\`java
${javaDebugCode}
\`\`\`

Explain why the race condition occurs under transaction isolation levels and provide the fix using pessimistic write locks (\`PessimisticLockType.PESSIMISTIC_WRITE\`) or atomic database decrements.`,
        null,
        'Race condition / lost update caused by non-atomic check-then-act. Fix by using SELECT ... FOR UPDATE (pessimistic write locking) or atomic database decrement: UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?.',
        25,
        'Debugging',
        'Intermediate',
        javaDebugCode
      );

      insertQ.run(
        assessmentId,
        'SQL',
        'Write a SQL query to find the top 5 customers by total order value for completed orders in the last 30 days. Return customer_name, total_orders count, and total_spent, ordered descending by total_spent.',
        null,
        'SELECT c.name as customer_name, COUNT(o.id) as total_orders, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = "COMPLETED" GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 5;',
        20,
        'SQL',
        'Intermediate',
        'SELECT c.name as customer_name, ...'
      );

      insertQ.run(
        assessmentId,
        'REASONING',
        'Why did you choose REST for this system? What trade-offs did you consider between synchronous REST APIs and asynchronous message queuing (e.g. Kafka/RabbitMQ) for checkout initiation vs inventory reservation and billing fulfillment?',
        null,
        'Synchronous REST provides immediate feedback and predictable ACID consistency for order creation, but couples client latency. Asynchronous message queuing (e.g. Kafka outbox) decouples downstream fulfillment and prevents catastrophic backpressure, but introduces eventual consistency and requires idempotent retry handlers.',
        15,
        'Problem Solving',
        'Intermediate',
        null
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
        'Intermediate',
        null
      );
    }
  } catch (err) {
    console.error(`Failed to seed questions for assessment ${assessmentId}:`, err);
  }
}
