import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getReviewQueue } from '../../services/api';

export default function ReviewerDashboard() {
  const location = useLocation();
  const { reviewerProfile, reviewQueue, completedReviews, refreshQueue, currentUser } = useApp();
  const [liveQueue, setLiveQueue] = useState([]);

  const isUnauthorized = new URLSearchParams(location.search).get('unauthorized') === 'true';

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await getReviewQueue();
        if (res.success && Array.isArray(res.data)) {
          setLiveQueue(res.data);
        }
        if (refreshQueue) {
          refreshQueue();
        }
      } catch (err) {
        console.warn("Could not load queue in ReviewerDashboard:", err);
      }
    };
    fetchQueue();
  }, []);

  const queueToDisplay = liveQueue.length > 0 ? liveQueue : reviewQueue;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Role Mismatch Redirection Notice */}
      {isUnauthorized && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold">Role Restricted Portal:</span>
            <span>You attempted to access a Builder or Recruiter route. SignalCraft strictly enforces persona isolation.</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
            Reviewer Mode Active
          </span>
        </div>
      )}
      
      {/* Reviewer Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
            {reviewerProfile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{reviewerProfile.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                Verified Reviewer
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{reviewerProfile.title}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {reviewerProfile.expertise.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-purple-300 border border-slate-700 font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <Link
            to="/reviewer/queue"
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Review Queue</span>
            <span className="w-5 h-5 rounded-full bg-purple-900/60 text-white text-xs flex items-center justify-center font-mono">
              {queueToDisplay.length}
            </span>
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Metric 1: Pending Reviews */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Review Queue</span>
            <span className="font-mono text-purple-400 font-semibold">{queueToDisplay.length} Submissions</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {queueToDisplay.length}
            <span className="text-sm text-slate-500 font-normal"> Pending</span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Submissions with completed automated tests & advisory AI scans waiting for authoritative sign-off.
          </p>
        </div>

        {/* Metric 2: Reviewer Credibility */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-purple-500/30 hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-purple-300 font-semibold">Reviewer Credibility</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">Calibrated</span>
          </div>
          <div className="text-3xl font-extrabold text-purple-400 font-mono">
            {reviewerProfile.credibilityScore}%
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${reviewerProfile.credibilityScore}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            {reviewerProfile.credibilityExplanation}
          </p>
        </div>

        {/* Metric 3: Authoritative Role */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Evaluation Authority</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Decisive</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">Authoritative</div>
          <p className="text-xs text-slate-400 mt-3">
            AI provides advisory pre-scores; only your evaluation produces the official 2-year scorecard.
          </p>
        </div>

      </div>

      {/* QUICK QUEUE PREVIEW */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Active Evaluation Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Prioritized submissions awaiting technical review</p>
          </div>
          <Link
            to="/reviewer/queue"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            View All ({queueToDisplay.length}) →
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {queueToDisplay.slice(0, 10).map((raw) => {
            const id = raw.submission_id || raw.id;
            const candidateName = raw.candidateName || raw.builder_name || raw.builderName || raw.candidate?.name || 'Engineering Candidate';
            const candidateAvatar = raw.candidateAvatar || (candidateName ? candidateName.split(' ').map(n=>n[0]).join('') : 'C');
            const challengeTitle = raw.challenge?.title || raw.challengeTitle || 'Engineering Challenge';
            const integrityStatus = raw.integrity_status || raw.integrityStatus || 'Passed';
            const aiPreScore = raw.ai_analysis?.reasoning_quality || raw.aiPreScore || 84;
            const submittedAt = raw.submitted_at ? new Date(raw.submitted_at).toLocaleDateString() : (raw.submittedAt || 'Today');

            return (
              <div key={id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                    {candidateAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{candidateName}</span>
                      <span className="text-[11px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        AI Advisory: {aiPreScore}/100
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {challengeTitle} • <span className="text-emerald-400">{integrityStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono hidden md:inline">{submittedAt}</span>
                  <Link
                    to={`/reviewer/review/${id}`}
                    className="px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all"
                  >
                    Review Submission →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
