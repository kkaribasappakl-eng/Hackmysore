// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">SignalCraft</span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              “Show what you can build — not just what you claim.”
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              A standardized technical verification layer for engineering hiring. Replaces resume claims and arbitrary trivia with practical engineering proof, authoritative human review, and reusable 2-year scorecards.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Valid for 2 Years • Reusable Across Companies
              </span>
            </div>
          </div>

          {/* Core Roles */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Core Personas</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/builder" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Builder — Prove technical ability
                </Link>
              </li>
              <li>
                <Link to="/reviewer" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Reviewer — Verify code & ADRs
                </Link>
              </li>
              <li>
                <Link to="/recruiter" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Recruiter — Discover verified engineers
                </Link>
              </li>
            </ul>
          </div>

          {/* Workflow */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Verification Model</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-400 font-semibold">1. BUILD</span>
                <span>Practical tasks & code</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-400 font-semibold">2. EXPLAIN</span>
                <span>ADR & trade-offs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-purple-400 font-semibold">3. VERIFY</span>
                <span>Human expert sign-off</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-semibold">4. DISCOVER</span>
                <span>Evidence-backed hiring</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Compliance & AI Note */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            SignalCraft Prototype • Phase 1 Frontend Demonstration. AI operates solely as an assistance layer; final evaluations are human-verified.
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            Note: Scorecards represent standardized engineering evaluations and are not official government certifications.
          </div>
        </div>
      </div>
    </footer>
  );
}
