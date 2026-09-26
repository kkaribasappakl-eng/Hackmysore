// src/pages/RoleSelection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { setActiveRole } = useApp();

  const handleSelectRole = (role, path) => {
    setActiveRole(role);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-300">Phase 1 Frontend Prototype • Mock Role Switcher</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Select Your SignalCraft Persona
        </h1>
        <p className="mt-3 text-base text-slate-400 max-w-xl mx-auto">
          Explore how SignalCraft empowers engineers to prove ability, reviewers to verify code, and recruiters to discover verified talent.
        </p>

        {/* 3 Role Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Card 1: Builder */}
          <div className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-2xl p-7 flex flex-col justify-between transition-all group shadow-xl hover:shadow-blue-500/10">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold">Persona 01</div>
              <h2 className="text-2xl font-bold text-white mt-1">Builder</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Prove your technical capabilities.
              </p>
              <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div>• Take Backend Order API Challenge</div>
                <div>• Submit Git Repo & 5-question ADR</div>
                <div>• Receive 2-Year Reusable Scorecard</div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectRole('builder', '/builder')}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Enter as Builder</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 2: Reviewer */}
          <div className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl p-7 flex flex-col justify-between transition-all group shadow-xl hover:shadow-purple-500/10">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold">Persona 02</div>
              <h2 className="text-2xl font-bold text-white mt-1">Reviewer</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Verify engineering evidence.
              </p>
              <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div>• Inspect Candidate Code & ADR</div>
                <div>• Authoritative Rubric Rating (1-5)</div>
                <div>• Earn Reviewer Credibility Calibration</div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectRole('reviewer', '/reviewer')}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Enter as Reviewer</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 3: Recruiter */}
          <div className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-7 flex flex-col justify-between transition-all group shadow-xl hover:shadow-emerald-500/10">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">Persona 03</div>
              <h2 className="text-2xl font-bold text-white mt-1">Recruiter</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Discover verified capabilities.
              </p>
              <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div>• Post Job Requirements</div>
                <div>• Filter Candidates by Verified Skills</div>
                <div>• Inspect Code Evidence & 1-Click Shortlist</div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => handleSelectRole('recruiter', '/recruiter')}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Enter as Recruiter</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

        </div>

        <p className="mt-10 text-xs text-slate-400">
          Note: This is mock role selection for demonstration. No authentication or backend calls exist.
        </p>

      </div>
    </div>
  );
}
