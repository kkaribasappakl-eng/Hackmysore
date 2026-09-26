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

// Seed questions for an assessment based on challenge
export function seedQuestionsForAssessment(assessmentId, challengeId = 1) {
  try {
    const existing = db.prepare('SELECT COUNT(*) as count FROM assessment_questions WHERE assessment_id = ?').get(assessmentId);
    if (existing && existing.count > 0) {
      return; // Already seeded for this assessment
    }

    const insertQ = db.prepare(`
      INSERT INTO assessment_questions (
        assessment_id, question_type, question_text, options, correct_answer, points, skill, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Coding Question (Java)
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

    // 2. Debugging Question (Debugging)
    insertQ.run(
      assessmentId,
      'DEBUGGING',
      'Identify the issue in this backend concurrent order service snippet and explain how you would fix it. Two simultaneous requests for the last available inventory item both succeed, resulting in negative inventory:\n\n```java\n@Transactional\npublic OrderResult placeOrder(Long productId, int quantity) {\n    Product product = productRepository.findById(productId).orElseThrow();\n    if (product.getStock() >= quantity) {\n        product.setStock(product.getStock() - quantity);\n        productRepository.save(product);\n        return OrderResult.success();\n    }\n    return OrderResult.outOfStock();\n}\n```',
      null,
      'Race condition / lost update caused by non-atomic check-then-act. Fix by using SELECT ... FOR UPDATE (pessimistic write locking) or atomic database decrement: UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?.',
      25,
      'Debugging',
      'Advanced'
    );

    // 3. SQL Question (SQL)
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

    // 4. Reasoning Question (Problem Solving)
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

    // 5. MCQ Question (REST API)
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
  } catch (err) {
    console.error(`Failed to seed questions for assessment ${assessmentId}:`, err);
  }
}
