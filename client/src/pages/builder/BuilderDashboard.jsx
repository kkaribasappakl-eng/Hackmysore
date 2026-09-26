// client/src/pages/builder/BuilderDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getBuilderDashboardData } from '../../services/api';

export default function BuilderDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setActiveScorecardId } = useApp();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isUnauthorized = new URLSearchParams(location.search).get('unauthorized') === 'true';

  // Helper to compute initials from real user name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'SC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchDashboard = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getBuilderDashboardData(currentUser.id);
      if (res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.scorecard?.id) {
          setActiveScorecardId(res.data.scorecard.id);
        }
      } else {
        setError(res.message || 'Unable to load real builder dashboard state.');
      }
    } catch (err) {
      setError('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // If user is not authenticated, show sign-in prompt
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-sm text-slate-400">
          Please sign in to access your personal Builder Dashboard.
        </p>
        <Link
          to="/login"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  const user = dashboardData?.user || currentUser;
  const skills = user.skills || [];
  const ranking = dashboardData?.ranking || {
    rank: null,
    rank_tier: 'Verification Pending',
    rank_badge: 'Unranked',
    description: 'Complete an assessment and peer review to receive an official ranking.'
  };
  const profileCompletion = dashboardData?.profile_completion || {
    percentage: 25,
    message: 'Step 1 complete. Upload your resume to extract skills & unlock assessment.'
  };
  const scorecard = dashboardData?.scorecard || null;
  const stages = dashboardData?.stages || [];
  const assessment = dashboardData?.assessment || null;
  const resume = dashboardData?.resume || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Role Mismatch Redirection Notice */}
      {isUnauthorized && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold">Role Restricted Portal:</span>
            <span>You attempted to access a Reviewer or Recruiter page. Dashboards are strictly isolated by your registered role.</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
            Builder Mode Active
          </span>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* HEADER BANNER - REAL USER DATA */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {loading ? "Loading builder data..." : user.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Builder ({user.email})
              </span>
            </div>
            
            <p className="text-slate-400 text-sm mt-0.5">
              {user.domain || 'Engineering Builder'} • {user.created_at ? `Member since ${new Date(user.created_at).toLocaleDateString()}` : 'Active Account'}
            </p>

            {/* REAL EXTRACTED SKILLS */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 italic">
                    No skills extracted yet — upload resume to calibrate your competencies.
                  </span>
                  <Link
                    to="/builder/resume"
                    className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Upload Resume →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
          <Link
            to="/builder/resume"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm text-center shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>{resume ? 'Update Resume' : 'Upload Resume'}</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            to="/builder/scorecard"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm text-center transition-all"
          >
            View Scorecard
          </Link>
        </div>
      </div>

      {/* RESUME & TAILORED ASSESSMENT FLOW BANNER */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
              Step 1 of Verification Journey
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
              {resume ? `${resume.challenge_difficulty || 'Medium'} Assessment Ready` : 'Resume Upload Required'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">
            {resume ? `Calibrated Challenge: ${resume.challenge_title || 'Tailored Practical Assessment'}` : 'Resume-Based Practical Assessment'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {resume
              ? `Extracted skills: ${skills.join(', ') || 'Domain verified'}. Your assessment questions are tailored directly to your declared tech stack.`
              : 'Upload your resume or paste experience claims. SignalCraft extracts verified competencies and automatically calibrates a medium-level practical assessment testing those exact skills.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Link
            to="/builder/resume"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs text-center shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>{resume ? 'Change Resume' : 'Upload Resume'}</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            to="/builder/assessment"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium text-center transition-all"
          >
            {assessment?.status === 'COMPLETED' ? 'Review Assessment →' : assessment?.status === 'IN_PROGRESS' ? 'Continue Assessment →' : 'Start Assessment →'}
          </Link>
        </div>
      </div>

      {/* METRICS ROW - REAL COMPUTED DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Metric 1: Real Profile Completion */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Profile Completion</span>
            <span className="font-mono text-blue-400 font-semibold">{profileCompletion.percentage}%</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{profileCompletion.percentage}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion.percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {profileCompletion.message}
          </p>
        </div>

        {/* Metric 2: Real System Ranking */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Current Rank</span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
              ranking.rank
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {ranking.rank_tier}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {ranking.rank ? `#${ranking.rank}` : 'Unranked'}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {ranking.description}
          </p>
        </div>

        {/* Metric 3: Scorecard Reusability / Validity */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Scorecard Reusability</span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
              scorecard?.status === 'VALID'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {scorecard ? scorecard.status : 'Pending'}
            </span>
          </div>
          <div className={`text-3xl font-extrabold font-mono ${scorecard?.status === 'VALID' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {scorecard ? '2 Years' : 'Not Issued'}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {scorecard
              ? `Scorecard ${scorecard.id} valid until ${scorecard.valid_until}. Replaces preliminary technical rounds.`
              : 'A 2-year verified credential is generated upon completion of peer review.'}
          </p>
        </div>

      </div>

      {/* CORE ASSESSMENT PROGRESS & VERIFIED SCORECARD STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Verification Progress Card - REAL STAGES */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
                Verification Pipeline
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                scorecard
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {scorecard ? 'Verified' : 'Pipeline Active'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-3">
              {resume?.challenge_title || assessment?.challenge_title || 'Engineering Verification Pipeline'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end milestone progress from tailored assessment to official 2-year technical scorecard.
            </p>

            {/* 6-Stage Prominent Verification Progress List - REAL DB STATE */}
            <div className="mt-5 space-y-2.5">
              {stages.map((stage) => {
                const isCompleted = stage.state === 'COMPLETED';
                const isInProgress = stage.state === 'IN_PROGRESS';
                const isFlagged = stage.state === 'FLAGGED';

                return (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isInProgress
                          ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                          : isFlagged
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isCompleted ? '✓' : isInProgress ? '⏳' : isFlagged ? '⚠' : '○'}
                      </span>
                      <span className={`font-semibold ${isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                        {stage.title}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isInProgress
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : isFlagged
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {stage.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {scorecard ? `Scorecard ID: ${scorecard.id}` : profileCompletion.message}
            </span>
            <Link
              to={scorecard ? "/builder/scorecard" : assessment ? "/builder/assessment" : "/builder/resume"}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <span>{scorecard ? 'View Scorecard →' : assessment ? 'Continue Pipeline →' : 'Upload Resume →'}</span>
            </Link>
          </div>
        </div>

        {/* Verified Scorecard Card (Real Backend Source of Truth) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                Verified Technical Scorecard
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                scorecard?.status === 'VALID'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : scorecard?.status === 'EXPIRED'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {scorecard ? (
                  scorecard.status === 'VALID'
                    ? 'Valid — Can be reused'
                    : 'Expired — New assessment required'
                ) : 'Not Available Yet'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-3">
              {scorecard ? `${scorecard.domain} Scorecard` : 'Scorecard Pending Verification'}
            </h2>

            {scorecard ? (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scorecard ID:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{scorecard.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Overall Verified Score:</span>
                  <span className="text-lg font-bold text-white font-mono">{scorecard.overall_score} / 100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Backend Validity Status:</span>
                  <span className={`font-semibold font-mono ${scorecard.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {scorecard.status === 'VALID' ? 'VALID ✓ (Reusable across companies)' : 'EXPIRED'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="text-slate-300 font-mono">{scorecard.valid_until}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">ℹ</span>
                  <p className="leading-relaxed">
                    No verified scorecard has been issued yet. Complete the assessment and submit your code & ADR to receive an authoritative scorecard.
                  </p>
                </div>
                <p className="text-slate-400 leading-relaxed pl-5">
                  Once your code repository and Architecture Decision Record (ADR) are verified by an authoritative human reviewer, your official scorecard will be published with a cryptographic ID valid for 2 years.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                <span>Proves ability directly through submitted repository code</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                <span>Includes technical trade-off evaluation from reviewer</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">✓</span>
                <span>Accepted by participating companies for direct shortlisting</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {scorecard ? '1 Verified Scorecard Active' : '0 Scorecards Active'}
            </span>
            <Link
              to="/builder/scorecard"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all"
            >
              Open Full Scorecard View →
            </Link>
          </div>
        </div>

      </div>

      {/* QUICK WORKFLOW NAVIGATION CARDS */}
      <div className="border-t border-slate-800/80 pt-8">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Builder Workflow Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Link
            to="/builder/challenges"
            className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all block text-left"
          >
            <div className="text-xs font-mono text-blue-400 font-semibold">Step 01</div>
            <div className="font-medium text-white text-sm mt-1">Challenges</div>
            <div className="text-xs text-slate-400 mt-1">Browse and select engineering problems</div>
          </Link>

          <Link
            to="/builder/assessment"
            className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all block text-left"
          >
            <div className="text-xs font-mono text-indigo-400 font-semibold">Step 02</div>
            <div className="font-medium text-white text-sm mt-1">Assessment</div>
            <div className="text-xs text-slate-400 mt-1">Solve coding, debugging, and SQL sections</div>
          </Link>

          <Link
            to="/builder/submission"
            className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all block text-left"
          >
            <div className="text-xs font-mono text-purple-400 font-semibold">Step 03</div>
            <div className="font-medium text-white text-sm mt-1">Submission & ADR</div>
            <div className="text-xs text-slate-400 mt-1">Submit repo and view verification status</div>
          </Link>

          <Link
            to="/builder/scorecard"
            className="p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all block text-left"
          >
            <div className="text-xs font-mono text-emerald-400 font-semibold">Step 04</div>
            <div className="font-medium text-white text-sm mt-1">Technical Scorecard</div>
            <div className="text-xs text-slate-400 mt-1">Inspect your reusable 2-year scorecard</div>
          </Link>
        </div>
      </div>

    </div>
  );
}
