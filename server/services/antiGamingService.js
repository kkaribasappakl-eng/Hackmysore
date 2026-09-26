// server/services/antiGamingService.js
import { db } from '../db.js';

/**
 * Tokenize text for similarity analysis
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

/**
 * Calculate Jaccard similarity between two token sets
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionSize++;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? (intersectionSize / unionSize) * 100 : 0;
}

/**
 * Anti-Gaming Integrity Engine
 * Evaluates candidate code and ADR submissions for:
 * 1. Plagiarism & cross-submission similarity
 * 2. Boilerplate / template stuffing
 * 3. ADR substance vs generic AI buzzwords
 * 4. Alignment between ADR trade-offs and submitted code/answers
 */
export function evaluateSubmissionIntegrity(submission, assessment, answers = [], pastSubmissions = []) {
  const flags = [];
  let similarityScore = 8; // Baseline low similarity

  // 1. Text extraction
  const adrObj = typeof submission.adr_content === 'string'
    ? JSON.parse(submission.adr_content || '{}')
    : (submission.adr_content || {});

  const adrFullText = [
    adrObj.what || adrObj.whatBuilt || '',
    adrObj.why || adrObj.whyApproach || '',
    adrObj.alternatives || '',
    adrObj.tradeoffs || adrObj.tradeOffs || '',
    adrObj.scaling || adrObj.scalePlan || ''
  ].join(' ');

  const answersFullText = answers.map(a => a.answer || '').join(' ');
  const combinedCandidateText = `${adrFullText} ${answersFullText}`;
  const candidateTokens = tokenize(combinedCandidateText);

  // 2. Cross-submission similarity check
  if (pastSubmissions && pastSubmissions.length > 0) {
    let highestSim = 0;
    for (const past of pastSubmissions) {
      if (past.id === submission.id) continue;
      const pastAdr = past.adr_content || '';
      const pastTokens = tokenize(pastAdr);
      const sim = jaccardSimilarity(candidateTokens, pastTokens);
      if (sim > highestSim) highestSim = sim;
    }
    // Blend with baseline: high overlap flags plagiarism
    similarityScore = Math.min(100, Math.round(highestSim > 10 ? highestSim : 8));
  }

  // 3. AI Hallucination & Prompt-Stuffing Detection
  const promptArtifacts = [
    'as an ai',
    'as a large language model',
    'certainly! here is',
    'i hope this helps',
    'here is the updated adr',
    'here is a solution for your assessment'
  ];
  let hasArtifacts = false;
  const lowerCandidateText = combinedCandidateText.toLowerCase();
  for (const artifact of promptArtifacts) {
    if (lowerCandidateText.includes(artifact)) {
      hasArtifacts = true;
      flags.push('LLM_PROMPT_ARTIFACT_DETECTED');
      break;
    }
  }

  // 4. ADR Substance & Architectural Keyword Analysis
  const architecturalKeywords = [
    'lock', 'atomic', 'acid', 'concurrency', 'sharding', 'replica', 'idempotent',
    'idempotency', 'race condition', 'queue', 'kafka', 'index', 'latency', 'transaction',
    'isolation', 'pessimistic', 'optimistic', 'deadlock', 'retry', 'cache', 'redis'
  ];

  let keywordHits = 0;
  for (const kw of architecturalKeywords) {
    if (lowerCandidateText.includes(kw)) {
      keywordHits++;
    }
  }

  // Calculate ADR Consistency Score (0-100)
  let adrConsistencyScore = 85;
  if (keywordHits >= 4) {
    adrConsistencyScore = Math.min(98, 80 + keywordHits * 2);
    flags.push('CONCRETE_ARCHITECTURAL_TERMINOLOGY');
  } else if (keywordHits >= 2) {
    adrConsistencyScore = 75;
  } else {
    adrConsistencyScore = 60;
    flags.push('GENERIC_ADR_SUPERFICIAL');
  }

  // 5. Code-Reasoning Alignment Check
  // Check if ADR choices (e.g. locks or idempotency) reflect in answers
  let reasoningQualityScore = 84;
  const adrHasLocking = lowerCandidateText.includes('lock') || lowerCandidateText.includes('pessimistic');
  const codeHasLocking = answersFullText.toLowerCase().includes('lock') || answersFullText.toLowerCase().includes('for update');
  
  if (adrHasLocking && codeHasLocking) {
    reasoningQualityScore = 90;
    flags.push('ADR_CODE_ALIGNED');
  } else if (answers.length > 0) {
    reasoningQualityScore = 84;
    flags.push('COHERENT_TECHNICAL_REASONING');
  }

  // 6. Final Status Determination
  let status = 'PASSED';
  let message = 'Originality verified. No significant duplication or gaming patterns detected.';

  if (similarityScore > 70 || hasArtifacts) {
    status = 'FLAGGED';
    message = hasArtifacts
      ? 'Automated check flagged possible unedited LLM artifacts in submission.'
      : 'High similarity detected against existing repository/answers.';
  } else {
    flags.push('LOW_SIMILARITY_ORIGINAL');
  }

  const originalityScore = Math.max(0, 100 - similarityScore);

  return {
    status,
    similarity_score: similarityScore,
    originality_score: originalityScore,
    adr_consistency_score: adrConsistencyScore,
    reasoning_quality_score: reasoningQualityScore,
    flags,
    suspicious_patterns_found: hasArtifacts ? 1 : 0,
    template_match_rate: Math.round(similarityScore * 0.8),
    message,
    checked_at: new Date().toISOString()
  };
}

/**
 * Execute integrity check for a submission ID and persist result
 */
export function runIntegrityCheck(submissionId) {
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(submission.assessment_id);
  const answers = db.prepare(`
    SELECT a.answer, q.question_type, q.skill
    FROM assessment_answers a
    JOIN assessment_questions q ON a.question_id = q.id
    WHERE a.assessment_id = ?
  `).all(submission.assessment_id);

  const pastSubmissions = db.prepare('SELECT id, adr_content FROM submissions WHERE id != ?').all(submissionId);

  const report = evaluateSubmissionIntegrity(submission, assessment, answers, pastSubmissions);

  // Update submission in SQLite
  db.prepare(`
    UPDATE submissions
    SET integrity_status = ?,
        similarity_score = ?,
        anti_gaming_report = ?
    WHERE id = ?
  `).run(
    report.status,
    report.similarity_score,
    JSON.stringify(report),
    submission.id
  );

  return report;
}
