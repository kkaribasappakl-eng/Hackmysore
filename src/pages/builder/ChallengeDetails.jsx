// src/pages/builder/ChallengeDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getChallenge, startAssessment } from '../../services/api';

export default function ChallengeDetails() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { setActiveAssessmentId, challenges: cachedChallenges } = useApp();

  const idToFetch = challengeId || 1;
  const [challenge, setChallenge] = useState(
    cachedChallenges.find(c => String(c.id) === String(idToFetch)) || cachedChallenges[0] || null
  );
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const fetchChallengeDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getChallenge(idToFetch);
      if (res.success && res.data) {
        setChallenge(res.data);
      }
    } catch (err) {
      setError('Unable to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetails();
  }, [idToFetch]);

  const handleStartAssessment = async () => {
    setStarting(true);
    try {
      const res = await startAssessment(challenge?.id || 1, 1);
      if (res.success && res.data?.id) {
        setActiveAssessmentId(res.data.id);
      }
      navigate('/builder/assessment');
    } catch (err) {
      console.warn("Failed to create assessment on backend, using local mode:", err);
      navigate('/builder/assessment');
    } finally {
      setStarting(false);
    }
  };

  if (loading && !challenge) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading challenge details...
      </div>
    );
  }

  const currentChallenge = challenge || {
    id: 1,
    title: "Backend Order Management API",
    description: "Build an Order Management REST API capable of processing transactions, stock reservation, and idempotent payment webhooks.",
    domain: "Backend Engineering",
    difficulty: "Intermediate",
    skills: ["Java", "SQL", "REST API"],
    prerequisites: ["Java Basics", "SQL Basics", "REST Fundamentals"]
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/builder" className="text-slate-400 hover:text-white transition-colors">
          Builder Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <Link to="/builder/challenges" className="text-slate-400 hover:text-white transition-colors">
          Challenges
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-blue-400 font-mono">{currentChallenge.title}</span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchChallengeDetails}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Challenge Header Card */}
      <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Difficulty: {currentChallenge.difficulty}
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Domain: {currentChallenge.domain}
            </span>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Verification Ready
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {currentChallenge.title}
        </h1>
        <p className="mt-3 text-base text-slate-300 leading-relaxed max-w-3xl">
          {currentChallenge.description}
        </p>

        {/* Required Skills Badges */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
            Required Technical Skills:
          </span>
          <div className="flex flex-wrap gap-2">
            {(currentChallenge.skills || []).map((skill) => (
              <span
                key={skill}
                className="text-xs px-3 py-1 rounded-lg bg-slate-800 text-blue-300 border border-slate-700 font-mono font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PROBLEM STATEMENT & DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Problem Statement & Context */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-blue-400 font-mono text-base">§</span>
              Problem Statement
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed space-y-3">
              <p>
                {currentChallenge.description}
              </p>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="text-slate-500">// Example Expected API Contract:</div>
                <div className="text-blue-400">POST /api/v1/orders</div>
                <div className="text-slate-400">Headers: Idempotency-Key: &lt;uuid&gt;</div>
                <div className="text-slate-400">Body: &#123; "customerId": "c-108", "items": [&#123; "productId": 42, "qty": 2 &#125;] &#125;</div>
                <div className="text-emerald-400">Response 201: &#123; "orderId": "ord-881", "status": "CREATED", "total": 120.00 &#125;</div>
              </div>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-purple-400 font-mono text-base">§</span>
              Prerequisites & Verification Criteria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-white block">Prerequisites:</span>
                <ul className="text-slate-400 mt-1 space-y-1">
                  {(currentChallenge.prerequisites || []).map((p, idx) => (
                    <li key={idx}>• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-semibold text-white block">Reviewer Rubric:</span>
                <span className="text-slate-400 mt-1 block">Correctness (1-5), Architecture (1-5), Code Quality (1-5), and Trade-off Awareness (1-5).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Expected Deliverables & Start CTA */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-blue-400">
              Expected Deliverables
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 font-mono text-[10px]">1</span>
                <span>Working implementation with validation and error contracts</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 font-mono text-[10px]">2</span>
                <span>Repository link with test coverage</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 font-mono text-[10px]">3</span>
                <span>Technical explanation of concurrency handling</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 font-mono text-[10px]">4</span>
                <span>5-question Architecture Decision Record (ADR)</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleStartAssessment}
                disabled={starting}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>{starting ? "Starting Assessment..." : "Start Assessment"}</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <span className="font-semibold text-slate-200 block">Assessment Architecture:</span>
            <p className="leading-relaxed">
              Clicking Start Assessment creates a verified backend assessment record in SQLite for Builder ID 1 and initializes the evaluation workflow.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
