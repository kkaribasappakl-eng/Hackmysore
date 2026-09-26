// src/pages/builder/BuilderDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getUser, getBuilderScorecards } from '../../services/api';

export default function BuilderDashboard() {
  const location = useLocation();
  const { builderProfile, setActiveScorecardId, currentUser, uploadedResume } = useApp();
  const [profile, setProfile] = useState(builderProfile);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isUnauthorized = new URLSearchParams(location.search).get('unauthorized') === 'true';

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const bId = currentUser?.id || 1;
      const userRes = await getUser(bId);
      if (userRes.success && userRes.data) {
        setProfile({
          ...builderProfile,
          name: userRes.data.name,
          role: userRes.data.domain,
          skills: userRes.data.skills || builderProfile.skills
        });
      }

      const scRes = await getBuilderScorecards(bId);
      if (scRes.success && Array.isArray(scRes.data)) {
        setScorecards(scRes.data);
        if (scRes.data.length > 0) {
          setActiveScorecardId(scRes.data[0].id);
        }
      }
    } catch (err) {
      setError('Unable to load builder profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const latestScorecard = scorecards.length > 0 ? scorecards[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Role Mismatch Redirection Notice */}
      {isUnauthorized && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold">Role Restricted Portal:</span>
            <span>You attempted to access a Reviewer or Recruiter page. SignalCraft strictly isolates dashboards by authenticated persona.</span>
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
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
            {profile.avatar || "RS"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {loading ? "Loading builder..." : profile.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Builder ({currentUser?.email || 'rahul@example.com'})
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{profile.role} • Bengaluru, India</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
          <Link
            to="/builder/resume"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm text-center shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Resume & Assessment</span>
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
              Tailored Medium Challenge
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Resume-Based Practical Assessment
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Upload your resume or paste experience claims. SignalCraft extracts verified competencies and automatically calibrates a medium-level practical assessment testing those exact skills.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Link
            to="/builder/resume"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs text-center shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>Upload / Update Resume</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            to="/builder/assessment"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium text-center transition-all"
          >
            Take Assessment →
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Metric 1: Profile Completion */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Profile Completion</span>
            <span className="font-mono text-blue-400 font-semibold">{profile.profileCompletion || 85}%</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{profile.profileCompletion || 85}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${profile.profileCompletion || 85}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Add portfolio projects and complete 1 challenge to reach 100%.
          </p>
        </div>

        {/* Metric 2: Current Rank */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Current Rank</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Top 5%</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{profile.currentRank || "#24"}</div>
          <p className="text-xs text-slate-400 mt-3">
            Ranked amongst 820+ verified backend engineers across India.
          </p>
        </div>

        {/* Metric 3: Scorecard Validity Period */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Scorecard Reusability</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Standard</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">2 Years</div>
          <p className="text-xs text-slate-400 mt-3">
            Valid across all participating companies without retaking preliminary coding interviews.
          </p>
        </div>

      </div>

      {/* CORE ASSESSMENT PROGRESS & VERIFIED SCORECARD STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Verification Progress Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
                Verification Progress
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Pipeline Active
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-3">
              Backend Engineering Challenge
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end verification pipeline progress from assessment to official 2-year scorecard.
            </p>

            {/* 6-Stage Prominent Verification Progress List */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="font-semibold text-slate-200">Assessment</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Completed (85/100)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="font-semibold text-slate-200">Submission</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Submitted (Repo + ADR)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="font-semibold text-slate-200">Integrity</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Passed (94% Original)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="font-semibold text-slate-200">AI Analysis</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Completed (Reference Only)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="font-semibold text-slate-200">Reviewer</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Verified (Ananya Rao)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="font-semibold text-slate-200">Scorecard</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Generated (2-Yr Valid)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Scorecard ID: SC-BE-2026-001</span>
            <Link
              to="/builder/scorecard"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <span>View Scorecard →</span>
            </Link>
          </div>
        </div>

        {/* Verified Scorecard Card (Live Backend Source of Truth) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                Verified Technical Scorecard
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                latestScorecard?.status === 'VALID'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : latestScorecard?.status === 'EXPIRED'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {latestScorecard ? (
                  latestScorecard.status === 'VALID'
                    ? 'Valid — Can be reused'
                    : 'Expired — New assessment required'
                ) : 'Not Available Yet'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mt-3">
              {latestScorecard ? `${latestScorecard.domain} Scorecard` : 'Scorecard Pending Verification'}
            </h2>

            {latestScorecard ? (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scorecard ID:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{latestScorecard.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Overall Verified Score:</span>
                  <span className="text-lg font-bold text-white font-mono">{latestScorecard.overall_score} / 100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Backend Validity Status:</span>
                  <span className={`font-semibold font-mono ${latestScorecard.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {latestScorecard.status === 'VALID' ? 'VALID ✓ (Reusable across companies)' : 'EXPIRED'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Valid Until:</span>
                  <span className="text-slate-300 font-mono">{latestScorecard.valid_until}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">ℹ</span>
                  <p className="leading-relaxed">
                    Complete a verified assessment to receive your reusable 2-year scorecard.
                  </p>
                </div>
                <p className="text-slate-400 leading-relaxed pl-5">
                  Once your code and Architecture Decision Record (ADR) are reviewed by an authoritative human reviewer, your verified scorecard will be issued with a cryptographic ID valid for 2 years.
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
              {scorecards.length} Scorecard{scorecards.length === 1 ? '' : 's'} On File
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
