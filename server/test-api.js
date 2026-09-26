// server/test-api.js
import app from './index.js';

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Test tracking
const testResults = [];

function recordTest(name, passed, error = null) {
  testResults.push({ name, passed, error });
}

async function runTests() {
  let serverInstance = null;

  // Check if server is already running on PORT; if not, start it
  try {
    const checkRes = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!checkRes || !checkRes.ok) {
      serverInstance = await new Promise((resolve) => {
        const s = app.listen(PORT, () => {
          resolve(s);
        });
      });
    }
  } catch (err) {
    serverInstance = await new Promise((resolve) => {
      const s = app.listen(PORT, () => {
        resolve(s);
      });
    });
  }

  // State shared between sequential tests
  let createdAssessmentId = null;
  let assessmentQuestions = [];
  let createdSubmissionId = null;
  let createdReviewId = null;
  let generatedScorecardId = null;
  let evaluatedData = null;

  try {
    // TEST 1: Health API
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.message === 'SignalCraft API is running') {
        recordTest('Health API', true);
      } else {
        recordTest('Health API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Health API', false, e.message);
    }

    // TEST 2: Users API
    try {
      const res = await fetch(`${BASE_URL}/api/users`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data) && body.data.length >= 5) {
        recordTest('Users API', true);
      } else {
        recordTest('Users API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Users API', false, e.message);
    }

    // TEST 3: Builder Role API
    try {
      const res = await fetch(`${BASE_URL}/api/users/role/BUILDER`);
      const body = await res.json();
      const allBuilders = Array.isArray(body.data) && body.data.every(u => u.role === 'BUILDER');
      if (res.status === 200 && body.success === true && allBuilders && body.data.length >= 3) {
        recordTest('Builder Role API', true);
      } else {
        recordTest('Builder Role API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Builder Role API', false, e.message);
    }

    // TEST 4: Jobs API
    try {
      const res = await fetch(`${BASE_URL}/api/jobs`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data) && body.data.length >= 1) {
        recordTest('Jobs API', true);
      } else {
        recordTest('Jobs API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Jobs API', false, e.message);
    }

    // TEST 5: Challenges API
    try {
      const res = await fetch(`${BASE_URL}/api/challenges`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data) && body.data.length >= 3) {
        recordTest('Challenges API', true);
      } else {
        recordTest('Challenges API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Challenges API', false, e.message);
    }

    // TEST 6: Assessment creation
    try {
      const res = await fetch(`${BASE_URL}/api/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: 1, builder_id: 1 })
      });
      const body = await res.json();
      if (res.status === 201 && body.success === true && body.data && body.data.id) {
        createdAssessmentId = body.data.id;
        recordTest('Assessment creation', true);
      } else {
        recordTest('Assessment creation', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Assessment creation', false, e.message);
    }

    // TEST 7: Question generation/retrieval
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/questions`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data) && body.data.length >= 4) {
        assessmentQuestions = body.data;
        const hasTypes = body.data.some(q => q.question_type === 'CODING') &&
                         body.data.some(q => q.question_type === 'DEBUGGING') &&
                         body.data.some(q => q.question_type === 'SQL') &&
                         body.data.some(q => q.question_type === 'REASONING');
        if (hasTypes) {
          recordTest('Question generation/retrieval', true);
        } else {
          recordTest('Question generation/retrieval', false, 'Missing required question types');
        }
      } else {
        recordTest('Question generation/retrieval', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Question generation/retrieval', false, e.message);
    }

    // TEST 8: Correct answers are NOT exposed
    try {
      const anyAnswerExposed = assessmentQuestions.some(q => q.correct_answer !== undefined);
      if (!anyAnswerExposed && assessmentQuestions.length > 0) {
        recordTest('Correct answers are NOT exposed', true);
      } else {
        recordTest('Correct answers are NOT exposed', false, 'Security violation: correct_answer field returned to client');
      }
    } catch (e) {
      recordTest('Correct answers are NOT exposed', false, e.message);
    }

    // TEST 9: Missing answer handling
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [] })
      });
      const body = await res.json();
      if (res.status === 400 && body.success === false) {
        recordTest('Missing answer handling', true);
      } else {
        recordTest('Missing answer handling', false, `Expected 400, got ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Missing answer handling', false, e.message);
    }

    // TEST 10: Invalid question handling
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: [{ question_id: 999999, answer: 'Fake answer' }]
        })
      });
      const body = await res.json();
      if (res.status === 400 && body.success === false) {
        recordTest('Invalid question handling', true);
      } else {
        recordTest('Invalid question handling', false, `Expected 400, got ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Invalid question handling', false, e.message);
    }

    // TEST 11: Answer submission
    try {
      const singleQ = assessmentQuestions[0] || { id: 1 };
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              question_id: singleQ.id,
              answer: 'public OrderResponse createOrder(OrderRequest req) { return orderService.create(req); }'
            }
          ]
        })
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data.saved_answers >= 1) {
        recordTest('Answer submission', true);
      } else {
        recordTest('Answer submission', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Answer submission', false, e.message);
    }

    // TEST 12: Multiple question answers
    try {
      const mockAnswers = [
        {
          question_id: assessmentQuestions[0]?.id || 1,
          answer: '@PostMapping public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest req) { Order o = orderService.create(req); return ResponseEntity.status(HttpStatus.CREATED).body(o); }'
        },
        {
          question_id: assessmentQuestions[1]?.id || 2,
          answer: 'The stock deduction lacks pessimistic row-locking, causing concurrent oversell. Fix by applying SELECT ... FOR UPDATE or atomic database decrements.'
        },
        {
          question_id: assessmentQuestions[2]?.id || 3,
          answer: 'SELECT c.id, c.name, SUM(o.total_amount) AS total_value FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_value DESC LIMIT 5;'
        },
        {
          question_id: assessmentQuestions[3]?.id || 4,
          answer: 'REST was chosen for stateless horizontal scaling and robust HTTP caching. Trade-offs include potential over-fetching vs GraphQL, which is mitigated via targeted DTOs.'
        },
        {
          question_id: assessmentQuestions[4]?.id || 5,
          answer: 'Idempotency-Key header returning 200 OK with cached original response payload'
        }
      ].filter(a => assessmentQuestions.some(q => q.id === a.question_id));

      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: mockAnswers })
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data.saved_answers >= 4) {
        recordTest('Multiple question answers', true);
      } else {
        recordTest('Multiple question answers', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Multiple question answers', false, e.message);
    }

    // TEST 13: Assessment evaluation
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/evaluate`, {
        method: 'POST'
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data && body.data.overall_score !== undefined) {
        evaluatedData = body.data;
        recordTest('Assessment evaluation', true);
      } else {
        recordTest('Assessment evaluation', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Assessment evaluation', false, e.message);
    }

    // TEST 14: Overall score
    try {
      if (evaluatedData && typeof evaluatedData.overall_score === 'number' && evaluatedData.overall_score >= 80) {
        recordTest('Overall score', true);
      } else {
        recordTest('Overall score', false, `Expected overall score >= 80, got ${evaluatedData?.overall_score}`);
      }
    } catch (e) {
      recordTest('Overall score', false, e.message);
    }

    // TEST 15: Skill scores
    try {
      if (evaluatedData && evaluatedData.skill_scores && typeof evaluatedData.skill_scores === 'object') {
        const skills = evaluatedData.skill_scores;
        const hasRequiredSkills = skills['Java'] && skills['SQL'] && skills['REST API'] && skills['Debugging'] && skills['Problem Solving'];
        if (hasRequiredSkills) {
          recordTest('Skill scores', true);
        } else {
          recordTest('Skill scores', false, `Missing required skills in: ${JSON.stringify(skills)}`);
        }
      } else {
        recordTest('Skill scores', false, 'skill_scores object missing from evaluation response');
      }
    } catch (e) {
      recordTest('Skill scores', false, e.message);
    }

    // TEST 16: Completed status
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data.status === 'COMPLETED' && body.data.completed_at) {
        recordTest('Completed status', true);
      } else {
        recordTest('Completed status', false, `Status: ${body.data?.status}, completed_at: ${body.data?.completed_at}`);
      }
    } catch (e) {
      recordTest('Completed status', false, e.message);
    }

    // TEST 17: Duplicate submission prevention
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${createdAssessmentId || 1}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: [{ question_id: assessmentQuestions[0]?.id || 1, answer: 'Attempt to overwrite after completion' }]
        })
      });
      const body = await res.json();
      if (res.status === 400 && body.success === false && body.message.includes('completed')) {
        recordTest('Duplicate submission prevention', true);
      } else {
        recordTest('Duplicate submission prevention', false, `Expected 400 for completed assessment, got ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Duplicate submission prevention', false, e.message);
    }

    // TEST 18: Submission Creation (ADR Submission)
    try {
      const res = await fetch(`${BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: createdAssessmentId || 1,
          builder_id: 1,
          repository_url: 'https://github.com/rahul/signalcraft-order-api',
          project_url: 'https://signalcraft-demo.example.com',
          adr_content: {
            what: 'Built an order management REST API with atomic stock decrement',
            why: 'REST architecture with relational locks guarantees zero oversell',
            alternatives: 'Considered GraphQL and optimistic retry loops',
            tradeoffs: 'Chose pessimistic row-level locking over distributed 2PC',
            scaling: 'Partition by region and stream fulfillment events via Kafka'
          }
        })
      });
      const body = await res.json();
      if (res.status === 201 && body.success === true && body.data && body.data.id) {
        createdSubmissionId = body.data.id;
        recordTest('Submission Creation (ADR)', true);
      } else {
        recordTest('Submission Creation (ADR)', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Submission Creation (ADR)', false, e.message);
    }

    // TEST 19: Reviewer can access assessment evidence
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId || 1}`);
      const body = await res.json();
      const hasAssessment = body.data && body.data.assessment && body.data.assessment.score !== undefined;
      const hasAnswers = (body.data && Array.isArray(body.data.assessment_answers) && body.data.assessment_answers.length > 0) ||
                         (body.data && body.data.assessment && Array.isArray(body.data.assessment.answers) && body.data.assessment.answers.length > 0);
      const hasSkillScores = body.data && body.data.assessment && body.data.assessment.skill_scores;

      if (res.status === 200 && body.success === true && hasAssessment && hasAnswers && hasSkillScores) {
        recordTest('Reviewer can access assessment evidence', true);
      } else {
        recordTest('Reviewer can access assessment evidence', false, `hasAssessment: ${hasAssessment}, hasAnswers: ${hasAnswers}, hasSkillScores: ${!!hasSkillScores}`);
      }
    } catch (e) {
      recordTest('Reviewer can access assessment evidence', false, e.message);
    }

    // TEST 20: Integrity Check
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId || 1}/integrity-check`, {
        method: 'POST'
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data.status === 'PASSED') {
        recordTest('Integrity Check', true);
      } else {
        recordTest('Integrity Check', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Integrity Check', false, e.message);
    }

    // TEST 21: AI Analysis
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId || 1}/ai-analysis`, {
        method: 'POST'
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data.status === 'COMPLETED' && body.data.adr_consistency === 88) {
        recordTest('AI Analysis', true);
      } else {
        recordTest('AI Analysis', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('AI Analysis', false, e.message);
    }

    // TEST 22: Reviewer Queue & Required Fields (Phase 5 Requirement 1)
    try {
      const res = await fetch(`${BASE_URL}/api/reviews/queue`);
      const body = await res.json();
      const inQueue = Array.isArray(body.data) && body.data.some(item => item.submission_id === (createdSubmissionId || 1));
      
      const item = inQueue ? body.data.find(i => i.submission_id === (createdSubmissionId || 1)) : body.data[0];
      const hasRequiredFields = item &&
        item.submission_id !== undefined &&
        item.builder_id !== undefined &&
        item.builder_name !== undefined &&
        item.challenge !== undefined &&
        item.domain !== undefined &&
        Array.isArray(item.skills) &&
        item.difficulty !== undefined &&
        item.assessment_score !== undefined &&
        item.integrity_status !== undefined &&
        item.ai_analysis !== undefined &&
        item.submitted_date !== undefined &&
        item.review_status !== undefined;

      if (res.status === 200 && body.success === true && inQueue && hasRequiredFields) {
        recordTest('Reviewer Queue & Required Fields', true);
      } else {
        recordTest('Reviewer Queue & Required Fields', false, `inQueue: ${inQueue}, hasRequiredFields: ${hasRequiredFields}`);
      }
    } catch (e) {
      recordTest('Reviewer Queue & Required Fields', false, e.message);
    }

    // TEST 23: Expertise-Matched Reviewer Queue (Phase 5 Requirement 2)
    try {
      // Reviewer 4 has expertise: Java, Backend, SQL
      const res = await fetch(`${BASE_URL}/api/reviews/queue?reviewer_id=4`);
      const body = await res.json();
      const matchFound = Array.isArray(body.data) && body.data.some(item => item.is_expertise_matched === true);
      if (res.status === 200 && body.success === true && matchFound) {
        recordTest('Expertise-Matched Reviewer Queue', true);
      } else {
        recordTest('Expertise-Matched Reviewer Queue', false, `Match not found in ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Expertise-Matched Reviewer Queue', false, e.message);
    }

    // TEST 24: Reviewer Rubric Validation (Phase 5 Requirement 3)
    try {
      // Score > 5 should be rejected with 400
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: createdSubmissionId || 1,
          reviewer_id: 4,
          correctness: 6, // Invalid > 5
          architecture: 4,
          code_quality: 4,
          tradeoff_awareness: 4,
          comments: 'Testing invalid rubric score'
        })
      });
      const body = await res.json();
      if (res.status === 400 && body.success === false) {
        recordTest('Reviewer Rubric Validation (1-5 range)', true);
      } else {
        recordTest('Reviewer Rubric Validation (1-5 range)', false, `Expected 400, got ${res.status}`);
      }
    } catch (e) {
      recordTest('Reviewer Rubric Validation (1-5 range)', false, e.message);
    }

    // TEST 24B: Role Separation - Builder Cannot Submit Review (HTTP 403)
    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: createdSubmissionId || 1,
          reviewer_id: 1, // Builder ID (Rahul Sharma)
          correctness: 4,
          architecture: 4,
          code_quality: 4,
          tradeoff_awareness: 4,
          comments: 'Builder attempting to submit evaluation'
        })
      });
      if (res.status === 403) {
        recordTest('Role Separation: Builder Cannot Submit Review', true);
      } else {
        recordTest('Role Separation: Builder Cannot Submit Review', false, `Expected 403, got ${res.status}`);
      }
    } catch (e) {
      recordTest('Role Separation: Builder Cannot Submit Review', false, e.message);
    }

    // TEST 25: Authoritative Review Submission & Score Calculation (Phase 5 Requirements 3, 4, 5)
    let reviewResultData = null;
    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: createdSubmissionId || 1,
          reviewer_id: 4, // Ananya Rao (REVIEWER)
          correctness: 5,
          architecture: 4,
          code_quality: 4,
          tradeoff_awareness: 5,
          comments: 'Strong implementation with clear architectural reasoning.',
          strengths: 'Pessimistic row-locking eliminates race conditions cleanly.',
          weaknesses: 'Consider connection pool timeout alerts.',
          recommendation: 'VERIFIED'
        })
      });
      const body = await res.json();
      if (res.status === 201 && body.success === true && body.data && body.data.id) {
        createdReviewId = body.data.id;
        reviewResultData = body.data;
        // Average: (5 + 4 + 4 + 5) / 4 = 4.5; Review score: (4.5 / 5) * 100 = 90
        const correctAverage = body.data.overall_score === 4.5;
        const correctReviewScore = body.data.review_score === 90;
        const isAuthoritative = body.data.authoritative === true && body.data.reviewer_notice.includes('authoritative');
        
        if (correctAverage && correctReviewScore && isAuthoritative) {
          recordTest('Authoritative Review Submission & Rubric Scoring', true);
        } else {
          recordTest('Authoritative Review Submission & Rubric Scoring', false, `Average: ${body.data.overall_score}, Score: ${body.data.review_score}, Authoritative: ${isAuthoritative}`);
        }
      } else {
        recordTest('Authoritative Review Submission & Rubric Scoring', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Authoritative Review Submission & Rubric Scoring', false, e.message);
    }

    // TEST 26: AI Pre-Score Reference Only Notice (Phase 5 Requirement 4)
    try {
      if (reviewResultData && reviewResultData.ai_notice && reviewResultData.ai_notice.includes('AI Reference Only')) {
        recordTest('AI Pre-Score Reference Only Notice', true);
      } else {
        recordTest('AI Pre-Score Reference Only Notice', false, `Missing or invalid AI notice: ${reviewResultData?.ai_notice}`);
      }
    } catch (e) {
      recordTest('AI Pre-Score Reference Only Notice', false, e.message);
    }

    // TEST 27: Scorecard Generation (Phase 5 Verified Scorecard)
    try {
      const res = await fetch(`${BASE_URL}/api/scorecards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_id: 1,
          assessment_id: createdAssessmentId || 1,
          review_id: createdReviewId || 1
        })
      });
      const body = await res.json();
      if ((res.status === 201 || res.status === 200) && body.success === true && body.data && body.data.id) {
        generatedScorecardId = body.data.id;
        recordTest('Scorecard Generation', true);
      } else {
        recordTest('Scorecard Generation', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Scorecard Generation', false, e.message);
    }

    // TEST 28: Scorecard Retrieval
    let retrievedScorecard = null;
    try {
      const res = await fetch(`${BASE_URL}/api/scorecards/${generatedScorecardId || 'SC-BE-2026-001'}`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data && body.data.id) {
        retrievedScorecard = body.data;
        recordTest('Scorecard Retrieval', true);
      } else {
        recordTest('Scorecard Retrieval', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Scorecard Retrieval', false, e.message);
    }

    // TEST 29: 2-Year Validity Verification
    try {
      if (retrievedScorecard && retrievedScorecard.issued_at && retrievedScorecard.valid_until) {
        const issued = new Date(retrievedScorecard.issued_at);
        const validUntil = new Date(retrievedScorecard.valid_until);

        const yearDiff = validUntil.getFullYear() - issued.getFullYear();
        const monthMatch = validUntil.getMonth() === issued.getMonth();
        const dayMatch = validUntil.getDate() === issued.getDate();

        if (yearDiff === 2 && monthMatch && dayMatch && retrievedScorecard.status === 'VALID') {
          recordTest('2-Year Validity Verification', true);
        } else {
          recordTest('2-Year Validity Verification', false, `Issued: ${retrievedScorecard.issued_at}, ValidUntil: ${retrievedScorecard.valid_until}, YearDiff: ${yearDiff}`);
        }
      } else {
        recordTest('2-Year Validity Verification', false, 'Missing scorecard date fields');
      }
    } catch (e) {
      recordTest('2-Year Validity Verification', false, e.message);
    }

    // TEST 30: Scorecard workflow still works
    try {
      if (retrievedScorecard && retrievedScorecard.status === 'VALID' && retrievedScorecard.assessment_id) {
        recordTest('Scorecard workflow still works', true);
      } else {
        recordTest('Scorecard workflow still works', false, 'Scorecard workflow state inconsistent');
      }
    } catch (e) {
      recordTest('Scorecard workflow still works', false, e.message);
    }

    // TEST 31: Builder Scorecards
    try {
      const res = await fetch(`${BASE_URL}/api/scorecards/builder/1`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data) && body.data.length >= 1) {
        recordTest('Builder Scorecards', true);
      } else {
        recordTest('Builder Scorecards', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Builder Scorecards', false, e.message);
    }

    // TEST 32: Scorecard Verification
    try {
      const res = await fetch(`${BASE_URL}/api/scorecards/verify/${generatedScorecardId || 'SC-BE-2026-001'}`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data && body.data.status === 'VALID') {
        recordTest('Scorecard Verification', true);
      } else {
        recordTest('Scorecard Verification', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Scorecard Verification', false, e.message);
    }

    // TEST 33: Candidate Ranking & Discovery (Phase 5 Ranking)
    try {
      const res = await fetch(`${BASE_URL}/api/candidates`);
      const body = await res.json();
      const hasRank = Array.isArray(body.data) && body.data.length >= 1 && body.data.every((c, i) => c.rank === i + 1);
      const isSortedDesc = Array.isArray(body.data) && body.data.every((c, i, arr) => i === 0 || arr[i - 1].overall_score >= c.overall_score);

      if (res.status === 200 && body.success === true && hasRank && isSortedDesc) {
        recordTest('Candidate Ranking & Sorting', true);
      } else {
        recordTest('Candidate Ranking & Sorting', false, `hasRank: ${hasRank}, isSortedDesc: ${isSortedDesc}`);
      }
    } catch (e) {
      recordTest('Candidate Ranking & Sorting', false, e.message);
    }

    // TEST 34: Verified Leaderboard & Rankings Endpoint (Phase 5 Leaderboard)
    try {
      const res = await fetch(`${BASE_URL}/api/rankings`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data && Array.isArray(body.data.leaderboard) && body.data.total_verified >= 1) {
        recordTest('Verified Leaderboard & Rankings API', true);
      } else {
        recordTest('Verified Leaderboard & Rankings API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Verified Leaderboard & Rankings API', false, e.message);
    }

    // TEST 34B: Ranking Events & Audit History API
    try {
      const res = await fetch(`${BASE_URL}/api/rankings/events`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data) && body.data.length >= 1) {
        recordTest('Ranking Events & Audit History API', true);
      } else {
        recordTest('Ranking Events & Audit History API', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Ranking Events & Audit History API', false, e.message);
    }

    // TEST 35: Skill Filtering
    try {
      const res = await fetch(`${BASE_URL}/api/candidates?skill=Java`);
      const body = await res.json();
      const allHaveJava = Array.isArray(body.data) && body.data.length >= 1 && body.data.every(c =>
        (c.verified_skills && c.verified_skills.some(s => s.toLowerCase().includes('java'))) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes('java')))
      );
      if (res.status === 200 && body.success === true && allHaveJava) {
        recordTest('Skill Filtering', true);
      } else {
        recordTest('Skill Filtering', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Skill Filtering', false, e.message);
    }

    // TEST 36: Score Filtering
    try {
      const res = await fetch(`${BASE_URL}/api/candidates?minScore=80`);
      const body = await res.json();
      const allMeetScore = Array.isArray(body.data) && body.data.length >= 1 && body.data.every(c => c.overall_score >= 80);
      if (res.status === 200 && body.success === true && allMeetScore) {
        recordTest('Score Filtering', true);
      } else {
        recordTest('Score Filtering', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Score Filtering', false, e.message);
    }

    // TEST 37: Candidate Shortlisting
    try {
      const res = await fetch(`${BASE_URL}/api/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: 1,
          builder_id: 1,
          recruiter_id: 5 // Meera Kapoor (RECRUITER)
        })
      });
      const body = await res.json();
      if ((res.status === 201 || res.status === 200) && body.success === true && body.message === 'Candidate shortlisted') {
        recordTest('Candidate Shortlisting', true);
      } else {
        recordTest('Candidate Shortlisting', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Candidate Shortlisting', false, e.message);
    }

    // TEST 38: Shortlist Retrieval
    try {
      const res = await fetch(`${BASE_URL}/api/shortlist/job/1`);
      const body = await res.json();
      const foundCandidate = Array.isArray(body.data) && body.data.some(item => item.builder.id === 1);
      if (res.status === 200 && body.success === true && foundCandidate) {
        recordTest('Shortlist Retrieval', true);
      } else {
        recordTest('Shortlist Retrieval', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Shortlist Retrieval', false, e.message);
    }

    // TEST 39: Phase 6 - Anti-Gaming Integrity Analysis Engine
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId || 1}/integrity-check`, {
        method: 'POST'
      });
      const body = await res.json();
      const data = body.data;
      const validIntegrity = data &&
        typeof data.similarity_score === 'number' &&
        typeof data.originality_score === 'number' &&
        typeof data.adr_consistency_score === 'number' &&
        typeof data.reasoning_quality_score === 'number' &&
        Array.isArray(data.flags) &&
        (data.status === 'PASSED' || data.status === 'FLAGGED');

      if (res.status === 200 && body.success === true && validIntegrity) {
        recordTest('Anti-Gaming Integrity Analysis Engine', true);
      } else {
        recordTest('Anti-Gaming Integrity Analysis Engine', false, `Invalid integrity payload: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Anti-Gaming Integrity Analysis Engine', false, e.message);
    }

    // TEST 40: Phase 6 - Claude AI Reference Assistance Layer
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId || 1}/ai-analysis`, {
        method: 'POST'
      });
      const body = await res.json();
      const data = body.data;
      const rubrics = data?.suggested_rubrics;
      const validClaudeAdvisory = data &&
        data.notice === 'AI Reference Only' &&
        data.authoritative === false &&
        rubrics &&
        typeof rubrics.correctness === 'number' &&
        typeof rubrics.architecture === 'number' &&
        typeof rubrics.code_quality === 'number' &&
        typeof rubrics.tradeoff_awareness === 'number' &&
        Array.isArray(data.detected_strengths) &&
        Array.isArray(data.detected_weaknesses) &&
        typeof data.overall_suggested_score === 'number';

      if (res.status === 200 && body.success === true && validClaudeAdvisory) {
        recordTest('Claude AI Reference Assistance Layer', true);
      } else {
        recordTest('Claude AI Reference Assistance Layer', false, `Invalid AI advisory payload: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Claude AI Reference Assistance Layer', false, e.message);
    }

    // TEST 41: Phase 6 - Reviewer Authoritative Scoring (AI Never Overwrites)
    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: createdSubmissionId || 1,
          reviewer_id: 4,
          correctness: 4.8,
          architecture: 4.6,
          code_quality: 4.4,
          tradeoff_awareness: 4.8,
          comments: 'Independent human reviewer authoritative judgment confirms strong transactional integrity.',
          recommendation: 'VERIFIED'
        })
      });
      const body = await res.json();
      const data = body.data;
      const isAuthoritative = data?.authoritative === true &&
        data?.reviewer_notice === 'Reviewer score is authoritative.' &&
        data?.ai_notice === 'AI Reference Only';

      if (res.status === 201 && body.success === true && isAuthoritative) {
        recordTest('Reviewer Authoritative Scoring (AI Never Overwrites)', true);
      } else {
        recordTest('Reviewer Authoritative Scoring (AI Never Overwrites)', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Reviewer Authoritative Scoring (AI Never Overwrites)', false, e.message);
    }

    // TEST 42: Phase 6 - Submission Details with Anti-Gaming & AI Reports
    try {
      const res = await fetch(`${BASE_URL}/api/submissions/${createdSubmissionId || 1}`);
      const body = await res.json();
      const data = body.data;
      const hasReports = data &&
        'anti_gaming_report' in data &&
        'ai_advisory_rubric' in data;

      if (res.status === 200 && body.success === true && hasReports) {
        recordTest('Submission Details with Anti-Gaming & AI Reports', true);
      } else {
        recordTest('Submission Details with Anti-Gaming & AI Reports', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Submission Details with Anti-Gaming & AI Reports', false, e.message);
    }

    // TEST 45: Role-Based Authentication & Cryptographic Token Generation
    let testToken = null;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul@example.com', password: 'password123', role: 'BUILDER' })
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data?.token && body.data?.user?.role === 'BUILDER') {
        testToken = body.data.token;
        recordTest('Role-Based Auth Login (Builder/Reviewer/Recruiter)', true);
      } else {
        recordTest('Role-Based Auth Login (Builder/Reviewer/Recruiter)', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Role-Based Auth Login (Builder/Reviewer/Recruiter)', false, e.message);
    }

    // TEST 46: Role Mismatch Protection (Enforces strict portal separation)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rahul@example.com', password: 'password123', role: 'REVIEWER' })
      });
      if (res.status === 403) {
        recordTest('Role Mismatch Protection (Strict Portal Separation)', true);
      } else {
        recordTest('Role Mismatch Protection (Strict Portal Separation)', false, `Expected 403 got ${res.status}`);
      }
    } catch (e) {
      recordTest('Role Mismatch Protection (Strict Portal Separation)', false, e.message);
    }

    // TEST 47: Protected /api/auth/me Endpoint
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data?.email === 'rahul@example.com') {
        recordTest('Protected Session Verification (/api/auth/me)', true);
      } else {
        recordTest('Protected Session Verification (/api/auth/me)', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Protected Session Verification (/api/auth/me)', false, e.message);
    }

    // TEST 48: Resume Skill Extraction & Tailored Assessment Generation
    try {
      const samplesRes = await fetch(`${BASE_URL}/api/resume/samples`);
      const samples = await samplesRes.json();
      const sampleText = samples.data?.[0]?.sampleText || "Java, Spring Boot, SQL, PostgreSQL, REST API, Microservices, Kafka";

      const res = await fetch(`${BASE_URL}/api/resume/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify({
          builder_id: 1,
          filename: 'rahul_backend_resume.pdf',
          resume_text: sampleText
        })
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && Array.isArray(body.data?.extracted_skills) && body.data?.assessment_id) {
        recordTest('Resume Skill Extraction & Tailored Assessment Generation', true);
      } else {
        recordTest('Resume Skill Extraction & Tailored Assessment Generation', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Resume Skill Extraction & Tailored Assessment Generation', false, e.message);
    }

    // TEST 49: Builder Resume Record Retrieval
    try {
      const res = await fetch(`${BASE_URL}/api/resume/builder/1`);
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data?.extracted_skills) {
        recordTest('Builder Resume & Assessment Match Retrieval', true);
      } else {
        recordTest('Builder Resume & Assessment Match Retrieval', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Builder Resume & Assessment Match Retrieval', false, e.message);
    }

    // TEST 50: Manual Account Registration (Database Persistence)
    const testRegEmail = `candidate_${Date.now()}@testcraft.example`;
    const testRegPassword = 'customSecurePassword123';
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nayana Sharma',
          email: testRegEmail,
          password: testRegPassword,
          role: 'BUILDER',
          domain: 'Backend Engineering'
        })
      });
      const body = await res.json();
      if (res.status === 201 && body.success === true && body.data?.user?.email === testRegEmail && body.data?.user?.role === 'BUILDER') {
        recordTest('Manual User Registration & Database Saving', true);
      } else {
        recordTest('Manual User Registration & Database Saving', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Manual User Registration & Database Saving', false, e.message);
    }

    // TEST 51: Manual Login with Newly Registered Credentials
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testRegEmail,
          password: testRegPassword
        })
      });
      const body = await res.json();
      if (res.status === 200 && body.success === true && body.data?.user?.role === 'BUILDER' && body.data?.token) {
        recordTest('Manual Login & Role-Based Token Issuance', true);
      } else {
        recordTest('Manual Login & Role-Based Token Issuance', false, `Status ${res.status}: ${JSON.stringify(body)}`);
      }
    } catch (e) {
      recordTest('Manual Login & Role-Based Token Issuance', false, e.message);
    }

    // TEST 52: Duplicate Registration Rejection (409 Conflict)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Candidate',
          email: testRegEmail,
          password: 'anotherPassword123',
          role: 'BUILDER'
        })
      });
      if (res.status === 409) {
        recordTest('Duplicate Email Registration Rejection (409)', true);
      } else {
        recordTest('Duplicate Email Registration Rejection (409)', false, `Expected 409 got ${res.status}`);
      }
    } catch (e) {
      recordTest('Duplicate Email Registration Rejection (409)', false, e.message);
    }

    // TEST 53: Real Builder Dashboard Data for Newly Registered User
    try {
      const res = await fetch(`${BASE_URL}/api/users/${newUserId}/builder-dashboard`);
      const body = await res.json();
      if (
        res.status === 200 &&
        body.success === true &&
        body.data.user.name === 'Nayana NewBuilder' &&
        body.data.profile_completion.percentage === 25 &&
        body.data.ranking.rank === null &&
        body.data.scorecard === null &&
        Array.isArray(body.data.stages) &&
        body.data.stages.length === 6 &&
        body.data.stages[0].state === 'PENDING'
      ) {
        recordTest('Real Builder Dashboard State for New Registered User', true);
      } else {
        recordTest('Real Builder Dashboard State for New Registered User', false, `Invalid state: ${JSON.stringify(body.data)}`);
      }
    } catch (e) {
      recordTest('Real Builder Dashboard State for New Registered User', false, e.message);
    }

    // TEST 54: Real Builder Dashboard Data for Verified User (ID 1)
    try {
      const res = await fetch(`${BASE_URL}/api/users/1/builder-dashboard`);
      const body = await res.json();
      if (
        res.status === 200 &&
        body.success === true &&
        body.data.user.id === 1 &&
        body.data.profile_completion.percentage === 100 &&
        body.data.scorecard !== null &&
        body.data.scorecard.id === 'SC-BE-2026-001' &&
        body.data.ranking.rank !== null
      ) {
        recordTest('Real Builder Dashboard State for Verified User', true);
      } else {
        recordTest('Real Builder Dashboard State for Verified User', false, `Invalid state: ${JSON.stringify(body.data)}`);
      }
    } catch (e) {
      recordTest('Real Builder Dashboard State for Verified User', false, e.message);
    }

  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  // Print exact formatted output as required
  console.log(`========================================`);
  console.log(`SignalCraft Phase 6 Claude AI & Anti-Gaming Tests`);
  console.log(`========================================\n`);

  let passedCount = 0;
  let failedCount = 0;

  for (const t of testResults) {
    if (t.passed) {
      console.log(`✓ ${t.name}`);
      passedCount++;
    } else {
      console.log(`✗ ${t.name} (Error: ${t.error})`);
      failedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total: ${testResults.length}`);
  console.log(`========================================\n`);

  if (failedCount === 0 && testResults.length > 0) {
    console.log(`ALL TESTS PASSED`);
    process.exit(0);
  } else {
    console.log(`SOME TESTS FAILED`);
    process.exit(1);
  }
}

runTests();
