// test-integration.js
// SignalCraft End-to-End Integration Verification Script
// Tests: Frontend -> API -> Backend -> SQLite -> API -> Frontend contract

const BASE_URL = 'http://localhost:4000/api';

const results = [];
function record(step, ok, details = '') {
  results.push({ step, ok, details });
  const status = ok ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] ${step} ${details ? '(' + details + ')' : ''}`);
}

async function runIntegration() {
  console.log('====================================================');
  console.log('SignalCraft Phase 3: End-to-End Integration Test');
  console.log('Testing: Builder -> Reviewer -> Scorecard -> Recruiter');
  console.log('====================================================\n');

  try {
    // 0. HEALTH CHECK
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    record('Backend Health Check', healthRes.status === 200 && health.success === true);

    // 1. BUILDER FLOW
    // 1.1 Get Challenges
    const chRes = await fetch(`${BASE_URL}/challenges`);
    const challenges = await chRes.json();
    record('Builder: Fetch Challenges', challenges.success && Array.isArray(challenges.data) && challenges.data.length > 0);
    const challengeId = challenges.data[0].id;

    // 1.2 Start Assessment
    const startRes = await fetch(`${BASE_URL}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, builder_id: 1 })
    });
    const assessment = await startRes.json();
    const assessmentId = assessment.data.id;
    record('Builder: Start Assessment', startRes.status === 201 && assessmentId !== undefined, `Assessment ID: ${assessmentId}`);

    // 1.2.1 Fetch Questions
    const questionsRes = await fetch(`${BASE_URL}/assessments/${assessmentId}/questions`);
    const qData = await questionsRes.json();
    const questions = qData.data || [];
    const noAnswersExposed = questions.every(q => q.correct_answer === undefined);
    record('Assessment Engine: Fetch Questions', qData.success && questions.length >= 4 && noAnswersExposed, `${questions.length} questions loaded, answers hidden`);

    // 1.2.2 Submit Answers
    const ansPayload = questions.map(q => ({
      question_id: q.id,
      answer: q.question_type === 'CODING' ? '@RestController class OrderApi { ... }' :
              q.question_type === 'DEBUGGING' ? 'Fix race condition using pessimistic write locks' :
              q.question_type === 'SQL' ? 'SELECT * FROM customers ORDER BY total DESC LIMIT 5;' :
              q.question_type === 'REASONING' ? 'REST chosen for clean stateless horizontal scaling' :
              'Idempotency-Key header returning 200 OK with cached original response payload'
    }));

    const ansRes = await fetch(`${BASE_URL}/assessments/${assessmentId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: ansPayload })
    });
    const ansResult = await ansRes.json();
    record('Assessment Engine: Submit Answers', ansRes.status === 200 && ansResult.success === true, `Saved: ${ansResult.data?.saved_answers} answers`);

    // 1.2.3 Evaluate Assessment
    const evalRes = await fetch(`${BASE_URL}/assessments/${assessmentId}/evaluate`, {
      method: 'POST'
    });
    const evalResult = await evalRes.json();
    record('Assessment Engine: Evaluate Score & Skills', evalRes.status === 200 && evalResult.data?.overall_score === 85, `Overall: ${evalResult.data?.overall_score}/100, Skills: ${Object.keys(evalResult.data?.skill_scores || {}).length}`);

    // 1.3 Complete Assessment (Compatibility Check)
    const compRes = await fetch(`${BASE_URL}/assessments/${assessmentId}/complete`, {
      method: 'POST'
    });
    const completedAssessment = await compRes.json();
    record('Builder: Complete Assessment', completedAssessment.success && completedAssessment.data.score > 0, `Score: ${completedAssessment.data.score}`);

    // 1.4 Submit Project & ADR
    const subRes = await fetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_id: assessmentId,
        builder_id: 1,
        repository_url: 'https://github.com/rahul-sharma/signalcraft-order-service',
        project_url: 'https://order-service-demo.signalcraft.dev',
        adr_content: {
          what: 'Order Management API with deterministic stock reservation.',
          why: 'Row-level write locks prevent race conditions under load.',
          alternatives: 'Evaluated optimistic locking; rejected due to retry storms.',
          tradeoffs: 'Higher write lock duration for guaranteed ACID integrity.',
          scaling: 'Scale via Kafka transactional outbox and read replicas.'
        }
      })
    });
    const sub = await subRes.json();
    const submissionId = sub.data.id;
    record('Builder: Submit Project & ADR', sub.success && submissionId !== undefined, `Submission ID: ${submissionId}`);

    // 1.5 Anti-Gaming Integrity Check (Phase 6 Engine)
    const icRes = await fetch(`${BASE_URL}/submissions/${submissionId}/integrity-check`, { method: 'POST' });
    const ic = await icRes.json();
    const validIntegrity = ic.success && ic.data.status === 'PASSED' &&
      typeof ic.data.originality_score === 'number' &&
      Array.isArray(ic.data.flags);
    record('Anti-Gaming: Plagiarism & ADR Consistency Verification', validIntegrity, `Originality: ${ic.data?.originality_score}%, Status: ${ic.data?.status}, Flags: ${ic.data?.flags?.length}`);

    // 1.6 Claude AI Advisory Analysis (Phase 6 Assistance)
    const aiRes = await fetch(`${BASE_URL}/submissions/${submissionId}/ai-analysis`, { method: 'POST' });
    const ai = await aiRes.json();
    const validClaude = ai.success && ai.data.notice === 'AI Reference Only' &&
      ai.data.authoritative === false &&
      Boolean(ai.data.suggested_rubrics) &&
      Array.isArray(ai.data.detected_strengths);
    record('Claude AI: Advisory Analysis & Suggested Rubrics', validClaude, `Provider: ${ai.data?.provider}, Notice: ${ai.data?.notice}, Strengths: ${ai.data?.detected_strengths?.length}`);

    // 2. REVIEWER FLOW (PHASE 5)
    // 2.1 Fetch Queue & Validate Required Fields
    const qRes = await fetch(`${BASE_URL}/reviews/queue`);
    const queue = await qRes.json();
    const inQueue = queue.data.find(item => item.submission_id === submissionId);
    const hasRequiredFields = inQueue && 
      'submission_id' in inQueue &&
      'builder_name' in inQueue &&
      'challenge' in inQueue &&
      'domain' in inQueue &&
      'skills' in inQueue &&
      'difficulty' in inQueue &&
      'assessment_score' in inQueue &&
      'integrity_status' in inQueue &&
      'ai_analysis' in inQueue &&
      'submitted_date' in inQueue &&
      'review_status' in inQueue;
    record('Reviewer: Review Queue Retrieval & Field Validation', queue.success && Boolean(hasRequiredFields), `Found submission #${submissionId} with all Phase 5 metadata`);

    // 2.2 Expertise-Matched Reviewer Queue
    const matchRes = await fetch(`${BASE_URL}/reviews/queue?reviewer_id=4&matched_only=true`);
    const matchQueue = await matchRes.json();
    const isMatched = matchQueue.data.some(item => item.submission_id === submissionId);
    record('Reviewer: Expertise-Matched Queue', matchQueue.success && isMatched, `Matched reviewer #4 skills with submission skills`);

    // 2.3 Rubric Validation Check (Scores Must Be 1–5)
    const invalidRubricRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submissionId,
        reviewer_id: 4,
        correctness: 6, // Invalid > 5
        architecture: 4,
        code_quality: 4,
        tradeoff_awareness: 5
      })
    });
    record('Reviewer: Rubric Score Range Validation (1–5)', invalidRubricRes.status === 400, 'Rejected score > 5 with HTTP 400');

    // 2.4 Authoritative Review Submission with 4 Rubrics & Metadata
    const revRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submissionId,
        reviewer_id: 4,
        correctness: 5,
        architecture: 4,
        code_quality: 4,
        tradeoff_awareness: 5,
        comments: 'Strong implementation with clear architectural reasoning and robust trade-off awareness.',
        strengths: ['Deterministic concurrency handling', 'Thorough ADR documentation'],
        weaknesses: ['Could benefit from connection pool tuning'],
        recommendation: 'VERIFIED'
      })
    });
    const rev = await revRes.json();
    const reviewId = rev.data?.id;
    const isAuthoritative = rev.data?.reviewer_notice === 'Reviewer score is authoritative.' && rev.data?.ai_notice === 'AI Reference Only';
    const scoreExpected = rev.data?.overall_score === 4.5 && rev.data?.review_score === 90;
    record('Reviewer: Submit Authoritative Review (4 Rubrics + Notices)', rev.success && isAuthoritative && scoreExpected, `Average: ${rev.data?.overall_score}/5.0, Review Score: ${rev.data?.review_score}/100`);

    // 3. SCORECARD FLOW (PHASE 5)
    // 3.1 Generate Composite Scorecard (Assessment 40% + Reviewer 60%)
    const genRes = await fetch(`${BASE_URL}/scorecards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        builder_id: 1,
        assessment_id: assessmentId,
        review_id: reviewId
      })
    });
    const genSc = await genRes.json();
    const scId = genSc.data.id;
    record('Scorecard: Composite Scorecard Generation', genSc.success && scId !== undefined, `Scorecard ID: ${scId}, Composite Score: ${genSc.data.overall_score}`);

    // 3.2 Retrieve Scorecard & Composite Verification
    const getScRes = await fetch(`${BASE_URL}/scorecards/${scId}`);
    const retrievedSc = await getScRes.json();
    record('Scorecard: Retrieval', retrievedSc.success && retrievedSc.data.id === scId, `Overall Score: ${retrievedSc.data.overall_score}, Assessment ID: ${retrievedSc.data.assessment_id}`);

    // 3.3 Verify Scorecard & 2-Year Validity
    const verifyRes = await fetch(`${BASE_URL}/scorecards/verify/${scId}`);
    const verifiedSc = await verifyRes.json();
    const isValid = verifiedSc.data.status === 'VALID';
    const hasValidUntil = Boolean(verifiedSc.data.valid_until);
    record('Scorecard: 2-Year Validity Verification', verifiedSc.success && isValid && hasValidUntil, `Status: ${verifiedSc.data.status}, Valid Until: ${verifiedSc.data.valid_until}`);

    // 3.4 Builder Scorecards List
    const bScRes = await fetch(`${BASE_URL}/scorecards/builder/1`);
    const builderScs = await bScRes.json();
    record('Scorecard: Builder Reuse List', builderScs.success && Array.isArray(builderScs.data) && builderScs.data.length > 0, `Count: ${builderScs.data.length}`);

    // 4. RECRUITER & RANKING FLOW (PHASE 5)
    // 4.1 Candidate Rankings & Leaderboard API
    const rankApiRes = await fetch(`${BASE_URL}/rankings`);
    const rankApiData = await rankApiRes.json();
    const hasLeaderboard = rankApiData.success && Array.isArray(rankApiData.data?.leaderboard) && rankApiData.data.leaderboard.length > 0;
    const topCandidate = rankApiData.data?.top_candidate;
    record('Ranking: Leaderboard & Top Candidate Discovery', hasLeaderboard && topCandidate !== null, `Top Candidate: ${topCandidate?.name} (Score: ${topCandidate?.score}, Rank: #${topCandidate?.rank})`);

    // 4.2 Candidate Discovery with Rank Attributes
    const candRes = await fetch(`${BASE_URL}/candidates`);
    const candidates = await candRes.json();
    const hasRankAttributes = candidates.data?.every(c => c.rank !== undefined && c.rank_badge !== undefined);
    record('Ranking: Candidate Discovery with Badges', candidates.success && hasRankAttributes, `Total Ranked Candidates: ${candidates.data.length}, Top Rank: ${candidates.data[0]?.rank_badge}`);

    // 4.3 Filter Candidates by Skill (Java)
    const filterSkillRes = await fetch(`${BASE_URL}/candidates?skill=Java`);
    const filteredSkill = await filterSkillRes.json();
    record('Recruiter: Filter by Skill (Java)', filteredSkill.success && filteredSkill.data.length > 0, `Matches: ${filteredSkill.data.length}`);

    // 4.4 Filter Candidates by Min Score (80)
    const filterScoreRes = await fetch(`${BASE_URL}/candidates?minScore=80`);
    const filteredScore = await filterScoreRes.json();
    record('Recruiter: Filter by Min Score (80)', filteredScore.success && filteredScore.data.every(c => c.overall_score >= 80), `Matches: ${filteredScore.data.length}`);

    // 4.5 Fetch Jobs & Recruiter
    const jobsRes = await fetch(`${BASE_URL}/jobs`);
    const jobs = await jobsRes.json();
    record('Recruiter: Fetch Jobs', jobs.success && Array.isArray(jobs.data) && jobs.data.length > 0, `Jobs: ${jobs.data.length}`);

    // 4.6 Create New Job
    const newJobRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'TechNova Solutions',
        title: 'Senior Distributed Systems Engineer',
        description: 'Lead high-throughput transactional services.',
        required_skills: ['Java', 'SQL', 'Kafka'],
        difficulty: 'Advanced',
        created_by: 5
      })
    });
    const newJob = await newJobRes.json();
    record('Recruiter: Create Job', newJob.success && newJob.data.id !== undefined, `Job ID: ${newJob.data.id}`);

    // 4.7 Recruiter Shortlist
    const slRes = await fetch(`${BASE_URL}/shortlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: 1,
        builder_id: 1,
        recruiter_id: 5
      })
    });
    const sl = await slRes.json();
    record('Recruiter: Shortlist Candidate', sl.success && sl.message.includes('shortlisted'), `Status: ${sl.message}`);

    // SUMMARY
    const passed = results.filter(r => r.ok).length;
    const total = results.length;
    console.log('\n====================================================');
    console.log(`Integration Test Summary: ${passed}/${total} PASSED`);
    console.log('====================================================');
    
    if (passed === total) {
      console.log('🎉 ALL INTEGRATION FLOWS VERIFIED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error('❌ SOME INTEGRATION TESTS FAILED');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Integration Test Error:', err);
    process.exit(1);
  }
}

runIntegration();
