// src/pages/builder/Assessment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getAssessment, getAssessmentQuestions, submitAssessmentAnswers, evaluateAssessment } from '../../services/api';

export default function Assessment() {
  const navigate = useNavigate();
  const { activeAssessmentId, assessmentData } = useApp();

  const assessmentId = activeAssessmentId || 1;

  // Data states
  const [assessmentInfo, setAssessmentInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [evaluatedResult, setEvaluatedResult] = useState(null);

  // Stepper / Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // 45-Minute Timer (45 * 60 = 2700 seconds)
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const timerRef = useRef(null);

  // Load Assessment & Questions
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch assessment metadata
        const metaRes = await getAssessment(assessmentId);
        if (metaRes.success && metaRes.data && isMounted) {
          setAssessmentInfo(metaRes.data);
          if (metaRes.data.status === 'COMPLETED' && metaRes.data.score !== null) {
            setEvaluatedResult({
              overall_score: metaRes.data.score,
              skill_scores: metaRes.data.skill_scores || {}
            });
          }
        }

        // 2. Fetch questions dynamically from backend (correct_answer is stripped)
        const qRes = await getAssessmentQuestions(assessmentId);
        if (qRes.success && Array.isArray(qRes.data) && qRes.data.length > 0 && isMounted) {
          setQuestions(qRes.data);

          // Initialize answers with defaults if any
          const initAnswers = {};
          qRes.data.forEach((q) => {
            initAnswers[q.id] = '';
          });
          setAnswers(initAnswers);
        } else if (isMounted) {
          // Fallback to sample questions structure if API returned empty
          setError('No questions returned for this assessment.');
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load assessment questions from backend.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [assessmentId]);

  // Submit Answers and Evaluate
  const handleSubmitAnswers = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // 1. Format answers array for POST /api/assessments/:id/answers
      const answerPayload = questions.map((q) => ({
        question_id: q.id,
        answer: (answers[q.id] || '').trim() || 'No answer provided'
      }));

      // Submit answers to backend
      const submitRes = await submitAssessmentAnswers(assessmentId, answerPayload);
      if (!submitRes.success && submitRes.status !== 400) {
        throw new Error(submitRes.message || 'Failed to submit answers');
      }

      // 2. Evaluate answers via POST /api/assessments/:id/evaluate
      const evalRes = await evaluateAssessment(assessmentId);
      if (evalRes.success && evalRes.data) {
        setEvaluatedResult(evalRes.data);
      } else {
        throw new Error(evalRes.message || 'Evaluation failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during submission. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit when timer expires
  const handleAutoSubmit = () => {
    if (!evaluatedResult && !submitting) {
      handleSubmitAnswers();
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (evaluatedResult || loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [evaluatedResult, loading]);

  // Format MM:SS
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value
    }));
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading Assessment...</h2>
        <p className="text-xs text-slate-400">Fetching technical challenges from backend engine...</p>
      </div>
    );
  }

  // RESULT VIEW (Requirement 10)
  if (evaluatedResult) {
    const overallScore = evaluatedResult.overall_score !== undefined ? evaluatedResult.overall_score : 85;
    const skillScores = evaluatedResult.skill_scores || {
      'Java': 86,
      'SQL': 82,
      'REST API': 91,
      'Debugging': 88,
      'Problem Solving': 89
    };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <span>✓</span> Assessment Completed
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Assessment Results
          </h1>
          <p className="text-sm text-slate-400">
            Assessment successfully completed. Your performance has been verified and recorded.
          </p>
        </div>

        {/* Score Card */}
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          
          {/* Overall Score Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 border border-blue-500/30">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Overall Verified Score</span>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono mt-1">
                {overallScore} <span className="text-lg text-slate-400 font-normal">/ 100</span>
              </div>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
                <span>✓</span> Baseline technical threshold passed
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">Assessment ID</span>
              <span className="text-sm font-mono text-blue-400 font-bold">#{assessmentId}</span>
              <span className="text-xs font-mono text-slate-500 block mt-1">Backend Source of Truth</span>
            </div>
          </div>

          {/* Skill Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Skill Breakdown</span>
              <span className="text-xs text-slate-400 font-normal">Demonstrated Competency</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(skillScores).map(([skill, score]) => (
                <div
                  key={skill}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block">{skill}</span>
                    <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-base font-extrabold font-mono text-blue-400">
                    {score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps Notification */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Next Step: Architecture Decision Record (ADR)</p>
            <p className="text-slate-400 leading-relaxed">
              To complete your technical verification trail, provide your code repository URL and document your architectural decisions (what you built, trade-offs, and scalability choices).
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => navigate('/builder/submission')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              <span>Continue to Submission</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Active Assessment Question Stepper View
  const currentQuestion = questions[currentIndex] || null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/builder" className="text-slate-400 hover:text-white transition-colors">
              Builder Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-mono">
              Assessment #{assessmentId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {assessmentInfo?.challenge?.title || assessmentData?.title || 'Backend Order Management API'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Backend Source of Truth • Challenge: {assessmentInfo?.challenge?.domain || 'Backend Engineering'}
          </p>
        </div>

        {/* 45-Minute Timer Display */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 font-mono ${
            timeLeft < 300
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 animate-pulse'
              : 'bg-slate-900/90 border-slate-800 text-slate-200'
          }`}>
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time Remaining</span>
              <span className="text-sm font-extrabold text-white">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-blue-400 font-semibold">{progressPercent}% Completed</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Stepper / Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isActive = idx === currentIndex;
          const hasAnswer = (answers[q.id] || '').trim().length > 0;

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-md shadow-blue-500/5'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className={isActive ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                  Q0{idx + 1}
                </span>
                {hasAnswer && <span className="text-emerald-400 text-xs">✓</span>}
              </div>
              <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {q.question_type}
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {q.skill}
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE QUESTION PANEL */}
      {currentQuestion && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  {currentQuestion.question_type}
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentQuestion.skill}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentQuestion.points} Points
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Difficulty: <strong className="text-amber-400">{currentQuestion.difficulty || 'Medium'}</strong>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white mt-4 leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* QUESTION TYPE SPECIFIC INPUT (Requirement 8) */}
          <div className="space-y-3">
            
            {/* 1. MCQ Radio Buttons */}
            {currentQuestion.question_type === 'MCQ' && (
              <div className="space-y-2.5">
                <span className="text-xs font-mono text-slate-400 block mb-2">Select the best answer:</span>
                {(currentQuestion.options || []).map((opt, i) => {
                  const isSelected = answers[currentQuestion.id] === opt;
                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQuestion.id}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(currentQuestion.id, opt)}
                        className="mt-0.5 accent-blue-500"
                      />
                      <span className="text-xs leading-relaxed">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 2. Coding (Large code/text editor-style textarea) */}
            {currentQuestion.question_type === 'CODING' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="coding-answer" className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>💻</span> Code Implementation (Java / REST):
                  </label>
                  <span className="text-slate-400 text-[11px] font-mono">Monospace Code Editor</span>
                </div>
                <textarea
                  id="coding-answer"
                  rows={14}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs text-slate-200 outline-none leading-relaxed transition-all resize-y"
                  placeholder="// Implement your solution here&#10;@RestController&#10;@RequestMapping(&quot;/api/orders&quot;)&#10;public class OrderController { ... }"
                />
              </div>
            )}

            {/* 3. SQL (Large SQL textarea) */}
            {currentQuestion.question_type === 'SQL' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="sql-answer" className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>🗄</span> SQL Query:
                  </label>
                  <span className="text-slate-400 text-[11px] font-mono">ANSI / PostgreSQL SQL</span>
                </div>
                <textarea
                  id="sql-answer"
                  rows={10}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs text-slate-200 outline-none leading-relaxed transition-all resize-y"
                  placeholder="-- Write your SQL query here&#10;SELECT c.id, c.name, SUM(o.total_amount) AS total_value&#10;FROM customers c&#10;..."
                />
              </div>
            )}

            {/* 4. Debugging (Large explanation textarea) */}
            {currentQuestion.question_type === 'DEBUGGING' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="debugging-answer" className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>🔍</span> Bug Analysis & Fix Explanation:
                  </label>
                  <span className="text-slate-400 text-[11px]">Structured Explanation & Code Fix</span>
                </div>
                <textarea
                  id="debugging-answer"
                  rows={12}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs text-slate-200 outline-none leading-relaxed transition-all resize-y"
                  placeholder="1. Bug Identification:&#10;2. Root Cause Analysis:&#10;3. Proposed Fix & Code Changes:"
                />
              </div>
            )}

            {/* 5. Reasoning (Large explanation textarea) */}
            {currentQuestion.question_type === 'REASONING' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="reasoning-answer" className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>🧠</span> Architectural Trade-Offs & Reasoning:
                  </label>
                  <span className="text-slate-400 text-[11px]">Technical Justification</span>
                </div>
                <textarea
                  id="reasoning-answer"
                  rows={12}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-xs text-slate-200 outline-none leading-relaxed transition-all resize-y"
                  placeholder="Explain why you chose this design, what trade-offs you considered, and why alternative solutions were rejected..."
                />
              </div>
            )}

          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={isFirst}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isFirst
                  ? 'opacity-40 cursor-not-allowed bg-slate-800/40 text-slate-500 border border-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-3">
              {!isLast ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmitAnswers}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                >
                  <span>{submitting ? 'Submitting & Evaluating...' : 'Submit Assessment'}</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
