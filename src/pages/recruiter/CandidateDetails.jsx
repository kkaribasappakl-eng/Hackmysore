// src/pages/recruiter/CandidateDetails.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ProofTrail from '../../components/ProofTrail';

export default function CandidateDetails() {
  const { candidateId } = useParams();
  const { candidates, toggleShortlist, isShortlisted } = useApp();

  const candidate = candidates.find(c => c.id === candidateId) || candidates[0];
  const shortlisted = isShortlisted(candidate.id);

  const [activeTab, setActiveTab] = useState('trail'); // 'trail' | 'artifacts'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShortlist = async () => {
    const wasShortlisted = isShortlisted(candidate.id);
    await toggleShortlist(candidate.id, 1);
    if (!wasShortlisted) {
      showToast("Candidate shortlisted ✓");
    } else {
      showToast("Candidate removed from shortlist");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/recruiter" className="text-slate-400 hover:text-white transition-colors">
          Recruiter Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <Link to="/recruiter/candidates" className="text-slate-400 hover:text-white transition-colors">
          Candidate Discovery
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-emerald-400 font-mono">{candidate.name}</span>
      </div>

      {/* Hero Candidate Profile Card */}
      <div className="p-7 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-lg shrink-0">
            {candidate.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{candidate.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                {candidate.validity} ✓
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Domain: <strong className="text-slate-200">{candidate.domain}</strong> • Experience: {candidate.experience}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Scorecard ID: <span className="text-blue-400">{candidate.scorecardId}</span> • Valid Until: <span className="text-emerald-400">{candidate.validUntil}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between md:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Verified Score</span>
            <div className="text-4xl font-extrabold text-white font-mono">
              {candidate.score} <span className="text-lg text-slate-500 font-normal">/ 100</span>
            </div>
          </div>

          <button
            onClick={handleShortlist}
            className={`px-6 py-3 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-2 ${
              shortlisted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
            }`}
          >
            <span>{shortlisted ? 'Candidate Shortlisted ✓' : 'Shortlist Candidate'}</span>
          </button>
        </div>
      </div>

      {/* VIEW TOGGLE TABS: PROOF TRAIL VS RAW ARTIFACTS */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('trail')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'trail'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>Verified Proof Trail (9 Steps)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 font-mono">Core</span>
        </button>

        <button
          onClick={() => setActiveTab('artifacts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'artifacts'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>Detailed Evidence Artifacts</span>
        </button>

        <Link
          to={`/recruiter/scorecard/${candidate.id}`}
          className="ml-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
        >
          <span>Inspect Scorecard</span>
          <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

      {/* TAB 1: PROOF TRAIL (SECTION 5) */}
      {activeTab === 'trail' && (
        <ProofTrail candidate={candidate} />
      )}

      {/* TAB 2: DETAILED EVIDENCE SUMMARY & REVIEWER AUDIT */}
      {activeTab === 'artifacts' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Evidence Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-sm">§</span>
                Verified Technical Evidence
              </h2>
              <span className="text-xs font-mono text-slate-400">Objective Artifacts</span>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Evidence 1: Coding */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Coding</span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span>✓</span> Verified
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mt-1">
                  {candidate.evidence.coding}
                </p>
              </div>

              {/* Evidence 2: Debugging */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Debugging</span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span>✓</span> Verified
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mt-1">
                  {candidate.evidence.debugging}
                </p>
              </div>

              {/* Evidence 3: SQL */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">SQL</span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <span>✓</span> Verified
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mt-1">
                  {candidate.evidence.sql}
                </p>
              </div>

              {/* Evidence 4: Technical Reasoning */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Technical Reasoning</span>
                  <span className="text-purple-400 font-mono font-bold flex items-center gap-1">
                    <span>✓</span> Reviewed
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mt-1">
                  {candidate.evidence.reasoning}
                </p>
              </div>

            </div>
          </div>

          {/* Verified Skills Breakdown */}
          <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Assessed Skills Calibration
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {candidate.skillBreakdown?.map((item) => (
                <div key={item.skill} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-xs block">{item.skill}</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                    {item.score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Reviewer Details & Scorecard Nav */}
        <div className="space-y-6">
          
          {/* Reviewer Card */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-purple-500/20 space-y-4">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block font-semibold">
              Evaluation Authority
            </span>

            <div className="space-y-1">
              <span className="text-slate-400 text-xs block">Verified by:</span>
              <div className="text-lg font-bold text-white">{candidate.reviewerName}</div>
              <div className="text-xs text-slate-400">{candidate.reviewerTitle}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Reviewer Score
              </span>
              <div className="text-3xl font-extrabold text-purple-400 font-mono mt-1">
                {candidate.reviewerScore} <span className="text-sm text-slate-500 font-normal">/ 5.0</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">
                Authoritative Human Evaluation
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Assessment: <strong className="text-slate-200">{candidate.assessment}</strong>
            </p>
          </div>

          {/* Quick Scorecard Link */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Scorecard Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect the sealed 2-year verification document used across participating employers.
            </p>
            <Link
              to={`/recruiter/scorecard/${candidate.id}`}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>Inspect Full Scorecard</span>
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

        </div>

      </div>
      )}

    </div>
  );
}
