// client/src/pages/recruiter/RecruiterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getUser, getJobs } from '../../services/api';

export default function RecruiterDashboard() {
  const location = useLocation();
  const { companyData: mockCompany, jobs: contextJobs, shortlistCount, currentUser } = useApp();
  const [recruiter, setRecruiter] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isUnauthorized = new URLSearchParams(location.search).get('unauthorized') === 'true';

  const fetchRecruiterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, jRes] = await Promise.all([
        getUser(5),
        getJobs()
      ]);

      if (uRes.success && uRes.data) {
        setRecruiter(uRes.data);
      }
      if (jRes.success && Array.isArray(jRes.data) && jRes.data.length > 0) {
        setJobs(jRes.data);
      } else {
        setJobs(contextJobs);
      }
    } catch (err) {
      console.warn("Could not load recruiter data from backend:", err);
      setJobs(contextJobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading recruiter dashboard...</h2>
        <p className="text-xs text-slate-400">Fetching active jobs and recruiter profile from backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Unable to load recruiter dashboard.</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchRecruiterData}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const companyName = recruiter?.domain || mockCompany.company;
  const recruiterName = recruiter?.name || "Meera Kapoor";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Role Mismatch Redirection Notice */}
      {isUnauthorized && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold">Role Restricted Portal:</span>
            <span>You attempted to access a Builder or Reviewer route. SignalCraft strictly enforces persona isolation.</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
            Recruiter Mode Active
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-600/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
            {mockCompany.logo || "TN"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{recruiterName} ({companyName})</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Verified Recruiter
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{mockCompany.tagline}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Evidence-Based Technical Discovery Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
          <Link
            to="/recruiter/create-job"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm text-center shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Job</span>
          </Link>

          <Link
            to="/recruiter/candidates"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm text-center transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Find Candidates</span>
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1: Open Roles */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Open Engineering Roles</span>
            <span className="text-emerald-400 font-mono text-[11px]">Active</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {jobs.length}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Matched directly against standardized SignalCraft challenges.
          </p>
        </div>

        {/* Metric 2: Verified Candidates */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Verified Talent Pool</span>
            <span className="text-blue-400 font-mono text-[11px]">2-Year Valid</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {mockCompany.verifiedCandidatesCount || 24}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Candidates holding sealed, human-verified engineering scorecards.
          </p>
        </div>

        {/* Metric 3: Shortlisted Candidates */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-emerald-300 font-semibold">Shortlisted Candidates</span>
            <span className="text-emerald-400 font-mono text-[11px]">Pipeline</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {shortlistCount}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Candidates prioritized based on verified code and ADR evidence.
          </p>
        </div>

      </div>

      {/* FEATURED ROLE & RECRUITER ACTIONS */}
      <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Active Open Positions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Requirements mapped automatically to standardized technical challenges.
            </p>
          </div>
          <Link
            to="/recruiter/create-job"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>+ Add New Role</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((role) => {
            const roleSkills = Array.isArray(role.required_skills)
              ? role.required_skills
              : (Array.isArray(role.skills) ? role.skills : ["Java", "SQL"]);
            const matchesCount = role.matchedCandidatesCount || 12;

            return (
              <div
                key={role.id}
                className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-emerald-400 font-medium">{role.difficulty || "Intermediate"}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{role.experience || "2-4 years"}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{role.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{role.description}</p>

                  <div className="mt-4">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                      Required Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {roleSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    {matchesCount} Verified Matches
                  </span>
                  <Link
                    to="/recruiter/candidates"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                  >
                    View Matches →
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
