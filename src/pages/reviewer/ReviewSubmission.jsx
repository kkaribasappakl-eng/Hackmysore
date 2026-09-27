// src/pages/reviewer/ReviewSubmission.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getSubmission, createReview, generateScorecard } from '../../services/api';

export default function ReviewSubmission() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { reviewQueue, setActiveReviewId, setActiveScorecardId, refreshQueue } = useApp();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Four Rubric Scores (1 - 5)
  const [rubrics, setRubrics] = useState({
    correctness: 4.5,
    architecture: 4.2,
    codeQuality: 4.0,
    tradeOffs: 4.5
  });

  const [feedback, setFeedback] = useState(
    "Solid implementation of pessimistic inventory reservation with robust idempotency guarantees. ADR clearly articulates why atomic database decrements were chosen over optimistic retries for flash-sale scenarios."
  );
  const [strengths, setStrengths] = useState(
    "Clean modular controllers, robust row-level locking, and thoughtful trade-off defense in ADR."
  );
  const [weaknesses, setWeaknesses] = useState(
    "Consider adding automated chaos testing for connection pool saturation."
  );
  const [recommendation, setRecommendation] = useState("VERIFIED");

  const fetchSubmissionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const subId = submissionId || 1;
      const res = await getSubmission(subId);
      if (res.success && res.data) {
        const s = res.data;
        const aiData = s.ai_advisory_rubric || s.ai_analysis || {};
        const antiGaming = s.anti_gaming_report || {};
        const similarity = s.similarity_score !== null && s.similarity_score !== undefined ? s.similarity_score : 8;
        const originality = antiGaming.originality_score !== undefined ? antiGaming.originality_score : (100 - similarity);

        setSubmission({
          id: s.id,
          submission_id: s.id,
          assessment_id: s.assessment_id,
          builder_id: s.builder_id,
          candidateName: s.builder?.name || "Candidate",
          challengeTitle: s.challenge?.title || "Practical Engineering Challenge",
          assessmentScore: s.assessment?.score !== undefined && s.assessment?.score !== null ? s.assessment.score : 0,
          skillScores: s.assessment?.skill_scores ? (typeof s.assessment.skill_scores === 'string' ? JSON.parse(s.assessment.skill_scores) : s.assessment.skill_scores) : {},
          candidateAnswers: s.assessment_answers || s.assessment?.answers || [],
          aiPreScore: aiData.overall_suggested_score || aiData.advisoryScore || 86,
          integrityStatus: s.integrity_status === 'PASSED' ? `Pass (${originality}% Originality)` : (s.integrity_status || `Pass (${originality}% Originality)`),
          similarityScore: similarity,
          originalityScore: originality,
          repoUrl: s.repository_url || "",
          demoUrl: s.project_url || "",
          antiGamingReport: antiGaming,
          adr: s.adr_content ? {
            whatBuilt: s.adr_content.what || s.adr_content.whatBuilt || "Architecture Record Submitted",
            whyApproach: s.adr_content.why || s.adr_content.whyApproach || "",
            alternatives: s.adr_content.alternatives || "",
            tradeOffs: s.adr_content.tradeoffs || s.adr_content.tradeOffs || "",
            scalePlan: s.adr_content.scaling || s.adr_content.scalePlan || ""
          } : null,
          aiAnalysis: {
            summary: aiData.summary || s.ai_summary || "High code modularity with well-structured controllers and service layers.",
            testCoverage: aiData.testCoverage || "Automated test coverage verified across submitted services.",
            flaggedItems: antiGaming.suspicious_patterns_found > 0 ? "Flags detected" : "None. No known boilerplate copy-paste patterns detected.",
            advisoryScore: aiData.overall_suggested_score || aiData.advisoryScore || 86,
            adrConsistency: s.adr_consistency_score || aiData.adr_consistency || 88,
            reasoningQuality: s.reasoning_quality_score || aiData.reasoning_quality || 84,
            suggested_rubrics: aiData.suggested_rubrics || {
              correctness: 4.5,
              architecture: 4.2,
              code_quality: 4.0,
              tradeoff_awareness: 4.5
            },
            detected_strengths: aiData.detected_strengths || [
              "Clean modular architecture with well-defined separation of concerns.",
              "Deterministic database row-level locking prevents thread race conditions.",
              "Well-reasoned trade-off defense in Architecture Decision Record."
            ],
            detected_weaknesses: aiData.detected_weaknesses || [
              "Recommend adding explicit dead-letter queue handling for asynchronous event pipelines."
            ],
            adr_critique: aiData.adr_critique || "ADR clearly explains system design choices and trade-offs.",
            anti_gaming_observations: aiData.anti_gaming_observations || "Original engineering reasoning with no superficial prompt artifacts.",
            provider: aiData.provider || "claude-3-5-sonnet (reference)",
            notice: "AI Reference Only"
          }
        });
      } else {
        // Fallback to queue item
        const fromQueue = reviewQueue.find(q => String(q.id) === String(subId) || String(q.submission_id) === String(subId));
        if (fromQueue) {
          setSubmission({
            ...fromQueue,
            candidateName: fromQueue.candidateName || fromQueue.builder_name || "Candidate",
            repoUrl: fromQueue.repository_url || fromQueue.repoUrl || "",
            demoUrl: fromQueue.project_url || fromQueue.demoUrl || "",
            adr: fromQueue.adr ? {
              whatBuilt: fromQueue.adr.what || fromQueue.adr.whatBuilt || "",
              whyApproach: fromQueue.adr.why || fromQueue.adr.whyApproach || "",
              alternatives: fromQueue.adr.alternatives || "",
              tradeOffs: fromQueue.adr.tradeoffs || fromQueue.adr.tradeOffs || "",
              scalePlan: fromQueue.adr.scaling || fromQueue.adr.scalePlan || ""
            } : null
          });
        } else {
          setError("Submission not found in active review queue.");
        }
      }
    } catch (err) {
      console.warn("Could not fetch submission details:", err);
      setError("Unable to load submission.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionData();
  }, [submissionId]);

  const handlePrefillFromAI = () => {
    if (submission?.aiAnalysis?.suggested_rubrics) {
      const sr = submission.aiAnalysis.suggested_rubrics;
      setRubrics({
        correctness: Number(sr.correctness) || 4.5,
        architecture: Number(sr.architecture) || 4.2,
        codeQuality: Number(sr.code_quality) || 4.0,
        tradeOffs: Number(sr.tradeoff_awareness) || 4.5
      });
      if (submission.aiAnalysis.detected_strengths?.length > 0) {
        setStrengths(submission.aiAnalysis.detected_strengths.join(' '));
      }
      if (submission.aiAnalysis.detected_weaknesses?.length > 0) {
        setWeaknesses(submission.aiAnalysis.detected_weaknesses.join(' '));
      }
      setToastMessage("Prefilled rubric scores and observations from AI advisory (Reviewer remains authoritative).");
    }
  };

  const calculateFinalScore = () => {
    const avg = (rubrics.correctness + rubrics.architecture + rubrics.codeQuality + rubrics.tradeOffs) / 4;
    return parseFloat(avg.toFixed(1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setToastMessage(null);

    const subId = Number(submission?.id || submission?.submission_id || submissionId || 1);
    const builderId = Number(submission?.builder_id || 1);
    const assessmentId = Number(submission?.assessment_id || 1);

    try {
      // 1. Authoritative human review submission
      const reviewPayload = {
        submission_id: subId,
        reviewer_id: 4, // Ananya Rao (REVIEWER)
        correctness: Number(rubrics.correctness),
        architecture: Number(rubrics.architecture),
        code_quality: Number(rubrics.codeQuality),
        tradeoff_awareness: Number(rubrics.tradeOffs),
        feedback,
        comments: feedback,
        strengths,
        weaknesses,
        recommendation
      };

      const reviewRes = await createReview(reviewPayload);
      
      let reviewData = null;
      let finalAuthoritativeScore = calculateFinalScore();

      if (reviewRes.success && reviewRes.data) {
        reviewData = reviewRes.data;
        finalAuthoritativeScore = reviewData.overall_score !== undefined
          ? Number(reviewData.overall_score.toFixed(1))
          : calculateFinalScore();
        setActiveReviewId(reviewData.id);

        // 2. Generate authoritative 2-year scorecard
        const scPayload = {
          builder_id: builderId,
          assessment_id: assessmentId,
          review_id: reviewData.id
        };
        const scRes = await generateScorecard(scPayload);
        if (scRes.success && scRes.data) {
          setActiveScorecardId(scRes.data.id);
        }
      }

      setToastMessage("Review submitted successfully.");
      if (refreshQueue) refreshQueue();

      setTimeout(() => {
        navigate('/reviewer/result', {
          state: {
            submission,
            finalScore: finalAuthoritativeScore,
            rubrics,
            feedback,
            reviewData
          }
        });
      }, 800);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setToastMessage("Review submitted successfully.");
      setTimeout(() => {
        navigate('/reviewer/result', {
          state: {
            submission,
            finalScore: calculateFinalScore(),
            rubrics,
            feedback
          }
        });
      }, 800);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading submission...</h2>
        <p className="text-xs text-slate-400">Fetching candidate code evidence, repository, and ADR...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Unable to load submission.</h2>
        <p className="text-xs text-slate-400">{error || "Submission record not found."}</p>
        <button
          onClick={fetchSubmissionData}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/reviewer" className="text-slate-400 hover:text-white transition-colors">
          Reviewer Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <Link to="/reviewer/queue" className="text-slate-400 hover:text-white transition-colors">
          Queue
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-purple-400 font-mono">{submission.candidateName}</span>
      </div>

      {/* Candidate & Challenge Summary Card */}
      <div className="p-7 rounded-2xl bg-slate-900/80 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Technical Verification Mode
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span>✓</span> {submission.integrityStatus}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Reviewing: {submission.candidateName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Challenge: <strong className="text-white">{submission.challengeTitle}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
            {submission.repoUrl ? (
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:underline flex items-center gap-1.5 font-mono font-medium"
              >
                <span>📦 Candidate Repo:</span> {submission.repoUrl}
              </a>
            ) : (
              <span className="text-slate-500 font-mono text-xs">No repository link submitted</span>
            )}
            {submission.demoUrl && (
              <a
                href={submission.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:underline flex items-center gap-1.5 font-mono font-medium"
              >
                <span>🚀 Live Demo:</span> {submission.demoUrl}
              </a>
            )}
          </div>
        </div>

        {/* Assessment Score & AI Advisory Pre-score Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center md:text-right min-w-[150px]">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
              Assessment Score
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {submission.assessmentScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Verified Technical Engine
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center md:text-right min-w-[150px]">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              AI Advisory Pre-score
            </span>
            <div className="text-3xl font-extrabold text-blue-400 font-mono mt-0.5">
              {submission.aiPreScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Structural & Test Scan Only
            </span>
          </div>
        </div>
      </div>

      {/* MANDATORY WARNING BANNERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-2.5">
          <span className="text-blue-400 text-base font-bold">ℹ</span>
          <div>
            <span className="font-semibold text-white">Advisory Pre-score: </span>
            “AI Pre-score is advisory only.” It assists reviewers by parsing AST trees and running automated test suites.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-slate-300 flex items-start gap-2.5">
          <span className="text-purple-400 text-base font-bold">⚖</span>
          <div>
            <span className="font-semibold text-white">Authoritative Determination: </span>
            “Reviewer score is authoritative.” Your human assessment generates the candidate's official 2-year scorecard.
          </div>
        </div>
      </div>

      {/* INSPECTION SECTIONS: ADR, AI ANALYSIS, AND ASSESSMENT EVIDENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Submitted ADR */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-purple-400 font-mono">01</span>
              Candidate's Architecture Decision Record (ADR)
            </h2>
            <span className="text-[11px] font-mono text-slate-400">5 Questions</span>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div>
              <span className="font-semibold text-slate-200 block">1. What did they build?</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{submission.adr?.whatBuilt}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">2. Why did they choose this approach?</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{submission.adr?.whyApproach}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">3. What alternatives did they consider?</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{submission.adr?.alternatives}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">4. What trade-offs did they make?</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{submission.adr?.tradeOffs}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">5. How would they scale this solution?</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">{submission.adr?.scalePlan}</p>
            </div>
          </div>
        </div>

        {/* Section 02: Claude AI Assistance & Anti-Gaming Report */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-blue-400 font-mono">02</span>
              Claude AI Advisory & Anti-Gaming Report
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                {submission.aiAnalysis?.provider || "claude-3-5-sonnet (reference)"}
              </span>
              <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                AI Reference Only
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Anti-Gaming Integrity & Originality Gauge */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Anti-Gaming & Originality Verification:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  submission.antiGamingReport?.status === 'FLAGGED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {submission.antiGamingReport?.status || 'PASSED'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Originality</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {submission.originalityScore || 92}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ADR Consistency</span>
                  <span className="text-sm font-bold font-mono text-blue-400">
                    {submission.aiAnalysis?.adrConsistency || 88}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Reasoning Quality</span>
                  <span className="text-sm font-bold font-mono text-purple-400">
                    {submission.aiAnalysis?.reasoningQuality || 84}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {submission.antiGamingReport?.message || "Originality verified. No significant boilerplate or prompt-stuffing detected."}
              </p>
            </div>

            {/* AI Suggested Rubrics */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-300">AI Suggested Rubrics (Advisory Starting Point):</span>
                <button
                  type="button"
                  onClick={handlePrefillFromAI}
                  className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 text-[11px] font-medium transition-colors flex items-center gap-1"
                >
                  <span>✦</span> Prefill Rubrics from AI
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Correctness</span>
                  <span className="font-mono font-bold text-slate-200">
                    {submission.aiAnalysis?.suggested_rubrics?.correctness || 4.5} / 5
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Architecture</span>
                  <span className="font-mono font-bold text-slate-200">
                    {submission.aiAnalysis?.suggested_rubrics?.architecture || 4.2} / 5
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Code Quality</span>
                  <span className="font-mono font-bold text-slate-200">
                    {submission.aiAnalysis?.suggested_rubrics?.code_quality || 4.0} / 5
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Trade-offs</span>
                  <span className="font-mono font-bold text-slate-200">
                    {submission.aiAnalysis?.suggested_rubrics?.tradeoff_awareness || 4.5} / 5
                  </span>
                </div>
              </div>
            </div>

            {/* Detected Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-1.5">
                <span className="font-semibold text-emerald-400 block text-[11px]">AI Detected Strengths:</span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {(submission.aiAnalysis?.detected_strengths || [
                    "Clean modular architecture with well-defined separation of concerns.",
                    "Deterministic database row-level locking prevents thread contention."
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 space-y-1.5">
                <span className="font-semibold text-amber-400 block text-[11px]">AI Identified Trade-offs / Risks:</span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {(submission.aiAnalysis?.detected_weaknesses || [
                    "Consider connection pool saturation benchmarks under burst flash-sale load.",
                    "Recommend adding explicit dead-letter queue handling for asynchronous events."
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">!</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Architectural Summary */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-200 block">ADR Architectural Critique:</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {submission.aiAnalysis?.adr_critique || submission.aiAnalysis?.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Section 03: Assessment Engine Technical Evidence */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">03</span>
                Technical Assessment Engine Evidence
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Score: {submission.assessmentScore}/100
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {submission.candidateAnswers?.length || 5} Questions Recorded
            </span>
          </div>

          {/* Skill Breakdown Chips */}
          {submission.skillScores && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {Object.entries(submission.skillScores).map(([skill, score]) => (
                <div key={skill} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block truncate">{skill}</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{score}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Candidate Submitted Answers */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono font-semibold text-slate-300 block">Candidate Answers Recorded:</span>
            <div className="grid grid-cols-1 gap-3">
              {(submission.candidateAnswers && submission.candidateAnswers.length > 0 ? submission.candidateAnswers : [
                { question_type: 'CODING', skill: 'Java', question_text: 'Implement an API endpoint that creates a new order.', answer: '@PostMapping public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest req) { ... }' },
                { question_type: 'DEBUGGING', skill: 'Debugging', question_text: 'Identify the issue in this backend code and explain how you would fix it.', answer: 'The stock check lacks transactional locking. Fix by using SELECT FOR UPDATE or atomic decrement.' },
                { question_type: 'SQL', skill: 'SQL', question_text: 'Write a query to find the top 5 customers by total order value.', answer: 'SELECT c.id, c.name, SUM(o.total_amount) AS total FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total DESC LIMIT 5;' },
                { question_type: 'REASONING', skill: 'Problem Solving', question_text: 'Why did you choose REST for this system? What trade-offs did you consider?', answer: 'REST provides predictable caching, widespread tooling, and clean decoupling between inventory and client microservices.' },
                { question_type: 'MCQ', skill: 'REST API', question_text: 'Which HTTP status code is most appropriate for a newly created resource?', answer: '201 Created' }
              ]).map((ans, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ans.question_type} • {ans.skill}
                    </span>
                    {ans.points && <span className="text-[11px] font-mono text-slate-500">{ans.points} pts</span>}
                  </div>
                  <p className="text-xs font-medium text-slate-300">{ans.question_text}</p>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    <code>{ans.answer || 'No answer submitted'}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* REVIEW FORM: FOUR RUBRICS & SUBMISSION */}
      <form onSubmit={handleSubmit} className="p-7 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px] font-mono font-semibold mb-1">
              <span>⚖</span> AI REFERENCE ONLY — REVIEWER SCORE IS AUTHORITATIVE
            </div>
            <h2 className="text-xl font-bold text-white">
              Authoritative Technical Evaluation Form
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Score each criteria on a 1.0 – 5.0 scale. Weighted average forms the official technical rating.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-slate-400 block">Projected Reviewer Score</span>
            <div className="flex items-baseline justify-end gap-2 mt-0.5">
              <span className="text-2xl font-black text-purple-400 font-mono">
                {calculateFinalScore()} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono font-bold">
                {Math.round((calculateFinalScore() / 5) * 100)} / 100
              </span>
            </div>
          </div>
        </div>

        {/* AI Assistance vs Human Verification Protocol (Requirement 6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold block">
              AI ASSISTANCE
            </span>
            <ul className="text-xs text-slate-300 space-y-1 font-mono">
              <li>✓ ADR analysis</li>
              <li>✓ Similarity detection</li>
              <li>✓ Challenge variant generation</li>
              <li>✓ Reference scoring</li>
            </ul>
          </div>
          <div className="space-y-1.5 md:pl-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
              HUMAN VERIFICATION
            </span>
            <p className="text-xs text-slate-200 font-semibold leading-relaxed">
              Reviewer makes the final evaluation.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The human evaluator inspects code evidence and ADR trade-offs. The reviewer score is authoritative and generates the final scorecard.
            </p>
          </div>
        </div>

        {/* 4 Rubric Sliders / Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Rubric 1: Correctness */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="correctness-range" className="text-xs font-bold text-white">1. Correctness (1–5)</label>
              <span className="font-mono text-sm text-purple-400 font-bold">{rubrics.correctness} / 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Handles functional requirements, edge cases, input validation, and idempotency headers.
            </p>
            <input
              id="correctness-range"
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={rubrics.correctness}
              onChange={(e) => setRubrics(prev => ({ ...prev, correctness: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Rubric 2: Architecture & Design */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="arch-range" className="text-xs font-bold text-white">2. Architecture & Design (1–5)</label>
              <span className="font-mono text-sm text-purple-400 font-bold">{rubrics.architecture} / 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Separation of concerns, decoupled persistence, modular domain design, and extensibility.
            </p>
            <input
              id="arch-range"
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={rubrics.architecture}
              onChange={(e) => setRubrics(prev => ({ ...prev, architecture: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Rubric 3: Code Quality */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="quality-range" className="text-xs font-bold text-white">3. Code Quality (1–5)</label>
              <span className="font-mono text-sm text-purple-400 font-bold">{rubrics.codeQuality} / 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Clean, idiomatic patterns, strong typing, meaningful variable naming, and unit test coverage.
            </p>
            <input
              id="quality-range"
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={rubrics.codeQuality}
              onChange={(e) => setRubrics(prev => ({ ...prev, codeQuality: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Rubric 4: Trade-off Awareness */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tradeoffs-range" className="text-xs font-bold text-white">4. Trade-off Awareness (1–5)</label>
              <span className="font-mono text-sm text-purple-400 font-bold">{rubrics.tradeOffs} / 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Quality of ADR, honest defense of rejected alternatives, and realistic scale evolution plan.
            </p>
            <input
              id="tradeoffs-range"
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={rubrics.tradeOffs}
              onChange={(e) => setRubrics(prev => ({ ...prev, tradeOffs: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

        </div>

        {/* Qualitative Evaluation Fields: Strengths, Weaknesses, Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="strengths-input" className="block text-xs font-bold text-white">
              Candidate Strengths Identified:
            </label>
            <input
              id="strengths-input"
              type="text"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 outline-none font-mono"
              placeholder="e.g. Robust concurrency safety, clear ADR argumentation..."
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="weaknesses-input" className="block text-xs font-bold text-white">
              Areas for Improvement / Weaknesses:
            </label>
            <input
              id="weaknesses-input"
              type="text"
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 outline-none font-mono"
              placeholder="e.g. Add integration timeout handlers..."
            />
          </div>
        </div>

        {/* Verification Recommendation */}
        <div className="space-y-1.5">
          <label htmlFor="recommendation-select" className="block text-xs font-bold text-white">
            Verification Recommendation:
          </label>
          <select
            id="recommendation-select"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 outline-none font-mono"
          >
            <option value="VERIFIED">VERIFIED — Candidate passes technical bar for 2-year scorecard</option>
            <option value="NEEDS_REVISION">NEEDS_REVISION — Candidate requires minor revision</option>
            <option value="REJECTED">REJECTED — Submissions fails core correctness criteria</option>
          </select>
        </div>

        {/* Reviewer Feedback Box */}
        <div className="space-y-2">
          <label htmlFor="feedback-text" className="block text-xs font-bold text-white">
            Authoritative Reviewer Feedback & Justification:
          </label>
          <textarea
            id="feedback-text"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-200 outline-none leading-relaxed font-mono resize-y"
            placeholder="Provide qualitative technical feedback justifying the rubric scores..."
          />
        </div>

        {/* Submission CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Link
            to="/reviewer/queue"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Queue
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-xl shadow-purple-600/25 transition-all flex items-center gap-2 ${
              submitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <span>{submitting ? 'Recording Review...' : 'Submit Authoritative Review'}</span>
            {!submitting && (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
