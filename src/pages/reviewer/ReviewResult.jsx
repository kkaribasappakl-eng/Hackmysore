// src/pages/reviewer/ReviewResult.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function ReviewResult() {
  const location = useLocation();
  const state = location.state || {};

  const finalScore = state.finalScore || 4.3;
  const rubrics = state.rubrics || {
    correctness: 4.5,
    architecture: 4.2,
    codeQuality: 4.0,
    tradeOffs: 4.5
  };
  const feedback = state.feedback || "Solid implementation of pessimistic inventory reservation with robust idempotency guarantees.";
  const candidateName = state.submission?.candidateName || state.submission?.builder_name || "Engineering Candidate";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-purple-500/30 text-center space-y-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto text-3xl font-bold">
          ✓
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold mb-2">
            Authoritative Review Submitted ✓
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Evaluation Recorded for {candidateName}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
            The candidate's reusable 2-year technical scorecard has been sealed and published for discovery by participating employers.
          </p>
        </div>

        {/* Final Score Banner */}
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Final Authoritative Reviewer Score
          </span>
          <div className="flex items-baseline justify-center gap-3 mt-1">
            <span className="text-5xl font-black text-purple-400 font-mono">
              {finalScore} <span className="text-xl text-slate-500 font-normal">/ 5.0</span>
            </span>
            <span className="text-sm px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold">
              {Math.round((finalScore / 5) * 100)} / 100
            </span>
          </div>
          <div className="mt-3 text-xs text-emerald-400 font-mono flex items-center justify-center gap-1.5">
            <span>✓</span>
            <span>Reviewer score is authoritative • 2-Year Scorecard Generated</span>
          </div>
        </div>

        {/* Four Rubric Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Correctness</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {rubrics.correctness || 4.5} <span className="text-xs text-slate-500">/ 5</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Architecture</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {rubrics.architecture || 4.2} <span className="text-xs text-slate-500">/ 5</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Code Quality</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {rubrics.codeQuality || 4.0} <span className="text-xs text-slate-500">/ 5</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Trade-off Awareness</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">
              {rubrics.tradeOffs || 4.5} <span className="text-xs text-slate-500">/ 5</span>
            </span>
          </div>
        </div>

        {/* Qualitative Feedback Quote */}
        {feedback && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs text-slate-300">
            <span className="font-semibold text-slate-400 block mb-1 font-mono uppercase text-[10px]">
              Recorded Reviewer Feedback:
            </span>
            <p className="italic text-slate-300 leading-relaxed font-mono">
              "{feedback}"
            </p>
          </div>
        )}

        {/* Return Button */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/builder/scorecard"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>View Generated Scorecard</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </Link>

          <Link
            to="/reviewer/queue"
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
          >
            <span>Back to Review Queue</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link
            to="/recruiter/candidates"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
          >
            See in Candidate Discovery →
          </Link>
        </div>

      </div>
    </div>
  );
}
