// src/pages/reviewer/ReviewQueue.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getReviewQueue } from '../../services/api';

export default function ReviewQueue() {
  const { reviewQueue: contextQueue, completedReviews } = useApp();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMatched, setFilterMatched] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      // Reviewer ID 4 is Ananya Rao (Java, Backend, SQL)
      const res = await getReviewQueue({
        reviewer_id: 4,
        matched_only: filterMatched ? true : undefined
      });

      if (res.success && Array.isArray(res.data)) {
        setQueue(res.data);
      } else if (contextQueue && contextQueue.length > 0) {
        setQueue(contextQueue);
      } else {
        setQueue([]);
      }
    } catch (err) {
      console.warn("Failed to load review queue from API:", err);
      if (contextQueue && contextQueue.length > 0) {
        setQueue(contextQueue);
      } else {
        setError("Unable to load review queue.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filterMatched]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading review queue...</h2>
        <p className="text-xs text-slate-400">Fetching candidate submissions pending technical verification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Unable to load review queue.</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchQueue}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs">
          <Link to="/reviewer" className="text-slate-400 hover:text-white transition-colors">
            ← Reviewer Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-purple-400 font-mono">Review Queue</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Submissions Awaiting Verification
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Select a candidate submission to inspect code artifacts, evaluate ADR trade-offs, and submit authoritative scores.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Expertise Match Toggle */}
            <button
              onClick={() => setFilterMatched(!filterMatched)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                filterMatched
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>{filterMatched ? '✓ Filtered:' : 'Filter:'} Expertise Matched</span>
            </button>

            <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono font-medium">
              Queue: {queue.length} Active
            </span>
            {completedReviews && completedReviews.length > 0 && (
              <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-medium">
                {completedReviews.length} Reviewed Today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-slate-300 flex items-start gap-3">
        <span className="text-purple-400 text-base font-bold">⚖</span>
        <div>
          <span className="font-semibold text-white">Reviewer Authority Notice: </span>
          AI reference analysis and pre-scores are purely advisory. You determine the final authoritative score across Correctness, Architecture, Code Quality, and Trade-off Awareness.
        </div>
      </div>

      {/* SUBMISSION CARDS LIST */}
      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
            All pending submissions in your queue have been verified! 🎉
          </div>
        ) : (
          queue.map((raw) => {
            const id = raw.submission_id || raw.id;
            const candidateName = raw.candidate?.name || raw.candidateName || raw.builder_name || 'Rahul Sharma';
            const candidateAvatar = raw.candidateAvatar || (candidateName ? candidateName.split(' ').map(n=>n[0]).join('') : 'RS');
            const challengeTitle = raw.challenge?.title || raw.challengeTitle || 'Backend Order Management API';
            const integrityStatus = raw.integrity_status || raw.integrityStatus || 'PASSED';
            const aiPreScore = raw.ai_analysis?.advisory_score || raw.ai_analysis?.reasoning_quality || raw.aiPreScore || 84;
            const assessmentScore = raw.assessment_score || raw.assessmentScore || 85;
            const submittedAt = raw.submitted_at ? new Date(raw.submitted_at).toLocaleDateString() : (raw.submittedAt || 'Today');
            const skills = raw.skills || raw.challenge?.skills || raw.candidate?.skills || ['Java', 'SQL', 'REST API'];
            const status = raw.status || raw.review_status || 'SUBMITTED';
            const isMatched = raw.is_expertise_matched || raw.isExpertiseMatched;

            return (
              <div
                key={id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Candidate Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold font-mono text-base shrink-0">
                      {candidateAvatar}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{candidateName}</h2>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                          {status}
                        </span>
                        {isMatched && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                            <span>✓</span> Expertise Matched
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Challenge: <span className="text-slate-200 font-medium">{challengeTitle}</span> • Submitted {submittedAt}
                      </p>
                    </div>
                  </div>

                  {/* Skills, Assessment & Integrity Badges */}
                  <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-14">
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
                      Assessment: {assessmentScore}/100
                    </span>
                    <span className="text-slate-600">•</span>
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <span>✓</span> {integrityStatus}
                    </span>
                  </div>
                </div>

                {/* Right: AI Pre-score & Action CTA */}
                <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">AI Advisory (Ref Only)</div>
                    <div className="text-2xl font-extrabold text-blue-400 font-mono">
                      {aiPreScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </div>
                  </div>

                  <Link
                    to={`/reviewer/review/${id}`}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Review Submission</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
