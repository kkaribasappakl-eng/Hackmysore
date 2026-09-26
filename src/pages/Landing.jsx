// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const { setActiveRole } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* Background Accent Gradients */}
      <div className="relative overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/20 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-[-5%] w-[400px] h-[350px] bg-emerald-600/10 blur-[120px] pointer-events-none rounded-full" />

        {/* HERO SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center relative z-10">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Technical Verification Layer for Hiring
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">Valid for 2 Years</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            SignalCraft
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            “Show what you can build — not just what you claim.”
          </p>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            An evidence-backed technical verification layer for engineering hiring.
          </p>

          {/* Narrative Chain Banner */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-500">RESUME CLAIM</span>
            <span className="text-blue-500">→</span>
            <span className="text-blue-400 font-semibold">PRACTICAL PROOF</span>
            <span className="text-blue-500">→</span>
            <span className="text-purple-400 font-semibold">VERIFICATION</span>
            <span className="text-purple-500">→</span>
            <span className="text-purple-300 font-semibold">HUMAN REVIEW</span>
            <span className="text-emerald-500">→</span>
            <span className="text-emerald-400 font-semibold">2-YEAR VERIFIED SCORECARD</span>
            <span className="text-emerald-500">→</span>
            <span className="text-slate-300 font-semibold">CAPABILITY HIRING</span>
          </div>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/login?role=BUILDER"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all flex items-center gap-2"
            >
              <span>Enter as Builder</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              to="/login?role=REVIEWER"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm shadow-lg shadow-purple-600/20 hover:shadow-purple-600/35 transition-all flex items-center gap-2"
            >
              <span>Enter as Reviewer</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>

            <Link
              to="/login?role=RECRUITER"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/35 transition-all flex items-center gap-2"
            >
              <span>Enter as Recruiter</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-14 max-w-4xl mx-auto p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-2">
              <div className="text-2xl font-bold text-white font-mono">2 Years</div>
              <div className="text-xs text-slate-400 mt-0.5">Scorecard Validity</div>
            </div>
            <div className="p-2 border-l border-slate-800">
              <div className="text-2xl font-bold text-blue-400 font-mono">100% Human</div>
              <div className="text-xs text-slate-400 mt-0.5">Verified Final Evaluation</div>
            </div>
            <div className="p-2 border-l border-slate-800">
              <div className="text-2xl font-bold text-purple-400 font-mono">ADR-Backed</div>
              <div className="text-xs text-slate-400 mt-0.5">Trade-off Defense</div>
            </div>
            <div className="p-2 border-l border-slate-800">
              <div className="text-2xl font-bold text-emerald-400 font-mono">Reusable</div>
              <div className="text-xs text-slate-400 mt-0.5">Across Companies</div>
            </div>
          </div>

        </div>
      </div>

      {/* CORE FLOW SECTION: BUILD -> EXPLAIN -> VERIFY -> DISCOVER */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-semibold tracking-widest text-blue-400 uppercase">
              The SignalCraft Verification Architecture
            </h2>
            <p className="mt-2 text-3xl font-bold text-white">
              The 4-Step Technical Verification Pipeline
            </p>
            <p className="mt-2 text-sm text-slate-400">
              A transparent protocol connecting builders, expert reviewers, and engineering recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1: BUILD */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all relative group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-base mb-4 group-hover:scale-110 transition-transform">
                01
              </div>
              <div className="text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold">Step 1</div>
              <h3 className="text-xl font-bold text-white mt-1">BUILD</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Complete realistic, prerequisite-based engineering challenges. Build functioning APIs, patch production deadlocks, or write optimized SQL.
              </p>
              <div className="mt-4 text-[11px] text-blue-300/80 font-mono bg-blue-950/30 px-2.5 py-1 rounded border border-blue-900/40">
                Code Artifacts • Git Repositories
              </div>
            </div>

            {/* Step 2: EXPLAIN */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all relative group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-base mb-4 group-hover:scale-110 transition-transform">
                02
              </div>
              <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-semibold">Step 2</div>
              <h3 className="text-xl font-bold text-white mt-1">EXPLAIN</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Submit an Architecture Decision Record (ADR). Defend technical choices, explain trade-offs, and outline how the solution scales under pressure.
              </p>
              <div className="mt-4 text-[11px] text-indigo-300/80 font-mono bg-indigo-950/30 px-2.5 py-1 rounded border border-indigo-900/40">
                ADR Rubric • Trade-off Defense
              </div>
            </div>

            {/* Step 3: VERIFY */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all relative group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-base mb-4 group-hover:scale-110 transition-transform">
                03
              </div>
              <div className="text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold">Step 3</div>
              <h3 className="text-xl font-bold text-white mt-1">VERIFY</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                AI provides advisory analysis and integrity checks, but an authoritative human expert reviewer performs the final 4-point rubric evaluation.
              </p>
              <div className="mt-4 text-[11px] text-purple-300/80 font-mono bg-purple-950/30 px-2.5 py-1 rounded border border-purple-900/40">
                Authoritative Human Sign-off
              </div>
            </div>

            {/* Step 4: DISCOVER */}
            <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all relative group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-base mb-4 group-hover:scale-110 transition-transform">
                04
              </div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">Step 4</div>
              <h3 className="text-xl font-bold text-white mt-1">DISCOVER</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Recruiters discover pre-verified candidates with matching skills, inspect the underlying code & ADR evidence, and shortlist with confidence.
              </p>
              <div className="mt-4 text-[11px] text-emerald-300/80 font-mono bg-emerald-950/30 px-2.5 py-1 rounded border border-emerald-900/40">
                2-Year Verified Scorecards
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* THE THREE USERS BREAKDOWN */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold">
            Tailored Experiences
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
            Designed for Every Stakeholder in Hiring
          </p>
          <p className="mt-3 text-sm text-slate-400">
            SignalCraft replaces guesswork with demonstrable proof for developers, reviewers, and employers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card 1: BUILDER */}
          <div className="bg-slate-900/70 border border-blue-500/20 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="inline-block text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                Candidate Persona
              </div>
              <h3 className="text-2xl font-bold text-white">Builder</h3>
              <p className="mt-2 text-sm text-slate-300 font-medium">
                Prove your technical capabilities.
              </p>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Take practical backend challenges, submit repository code with an Architectural Decision Record (ADR), and earn an authoritative 2-year scorecard you can reuse across companies.
              </p>

              <div className="mt-6 space-y-2 border-t border-slate-800 pt-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>Solve realistic API, SQL, & concurrency challenges</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>Defend trade-offs with 5-point ADR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>Reusable scorecard valid for 2 Years</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/builder"
                onClick={() => setActiveRole('builder')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
              >
                <span>Enter as Builder</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Card 2: REVIEWER */}
          <div className="bg-slate-900/70 border border-purple-500/20 rounded-2xl p-7 flex flex-col justify-between hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="inline-block text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2">
                Expert Evaluator
              </div>
              <h3 className="text-2xl font-bold text-white">Reviewer</h3>
              <p className="mt-2 text-sm text-slate-300 font-medium">
                Verify engineering evidence.
              </p>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Review submitted code, inspect integrity checks, review AI advisory pre-scores, and assign authoritative ratings across Correctness, Architecture, Code Quality, and Trade-offs.
              </p>
 
              <div className="mt-6 space-y-2 border-t border-slate-800 pt-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">✓</span>
                  <span>AI assists, but human reviewer score is authoritative</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">✓</span>
                  <span>Standardized 4-metric technical rubric (1–5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold">✓</span>
                  <span>Reviewer credibility metric tracking calibration</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/reviewer"
                onClick={() => setActiveRole('reviewer')}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20"
              >
                <span>Enter as Reviewer</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Card 3: RECRUITER */}
          <div className="bg-slate-900/70 border border-emerald-500/20 rounded-2xl p-7 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="inline-block text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Hiring Team
              </div>
              <h3 className="text-2xl font-bold text-white">Recruiter</h3>
              <p className="mt-2 text-sm text-slate-300 font-medium">
                Discover verified capabilities.
              </p>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Post roles with required technical skills, match against verified engineers, inspect the actual code & ADR evidence behind scores, and shortlist verified talent.
              </p>

              <div className="mt-6 space-y-2 border-t border-slate-800 pt-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Filter by verified skills, not unverified claims</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Inspect evidence (code, ADR, query optimizations)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Instant 1-click candidate shortlisting</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/recruiter"
                onClick={() => setActiveRole('recruiter')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <span>Enter as Recruiter</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* HIGHLIGHT: 2-YEAR VERIFIED SCORECARD PREVIEW */}
      <section className="py-16 bg-gradient-to-b from-slate-900/50 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    STANDARDIZED ARTIFACT
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    VALID FOR 2 YEARS ✓
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2">
                  Verified Technical Scorecard
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Scorecard ID: <span className="font-mono text-slate-300">SC-BE-2026-001</span> • Issued: Sept 2026 • Valid Until: Sept 2028
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Verified Technical Score</div>
                <div className="text-4xl font-extrabold text-blue-400 font-mono">85 <span className="text-lg text-slate-500 font-normal">/ 100</span></div>
              </div>
            </div>

            <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-mono">Java</div>
                <div className="text-lg font-bold text-white mt-1">86/100</div>
                <div className="text-[11px] text-blue-400">Verified ✓</div>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-mono">REST API</div>
                <div className="text-lg font-bold text-white mt-1">91/100</div>
                <div className="text-[11px] text-blue-400">Verified ✓</div>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-mono">SQL</div>
                <div className="text-lg font-bold text-white mt-1">82/100</div>
                <div className="text-[11px] text-blue-400">Verified ✓</div>
              </div>
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-mono">Debugging</div>
                <div className="text-lg font-bold text-white mt-1">88/100</div>
                <div className="text-[11px] text-blue-400">Verified ✓</div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Verified by Senior Reviewer: <strong className="text-slate-200">Ananya Rao (Staff Systems Engineer)</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/builder/scorecard"
                  className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-medium transition-all"
                >
                  View Full Scorecard Demo →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
