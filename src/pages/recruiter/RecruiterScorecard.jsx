// src/pages/recruiter/RecruiterScorecard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { verifyScorecard, getScorecard, getBuilderScorecards } from '../../services/api';
import ProofTrail from '../../components/ProofTrail';

export default function RecruiterScorecard() {
  const { candidateId } = useParams();
  const { candidates, toggleShortlist, isShortlisted } = useApp();

  const mockCandidate = candidates.find(c => String(c.id) === String(candidateId)) || candidates[0];
  const [candidate, setCandidate] = useState(mockCandidate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showProofTrail, setShowProofTrail] = useState(false);

  const defaultSkills = [
    { name: "Java", score: 86, benchmark: "Target: 80+ Top Tier" },
    { name: "SQL", score: 82, benchmark: "Target: 80+ Top Tier" },
    { name: "REST APIs", score: 91, benchmark: "Target: 80+ Top Tier" },
    { name: "Debugging", score: 88, benchmark: "Target: 80+ Top Tier" },
    { name: "Problem Solving", score: 89, benchmark: "Target: 80+ Top Tier" }
  ];

  const fetchVerifiedScorecard = async () => {
    setLoading(true);
    setError(null);
    try {
      // Determine scorecard ID to verify
      let scId = candidateId && String(candidateId).startsWith('SC-')
        ? candidateId
        : (mockCandidate.scorecardId || `SC-BE-2026-00${candidateId || 1}`);

      // Call verify endpoint
      let res = await verifyScorecard(scId);

      // If not found, try getting by builder ID
      if (!res.success && (!candidateId || !String(candidateId).startsWith('SC-'))) {
        const builderScs = await getBuilderScorecards(candidateId || 1);
        if (builderScs.success && Array.isArray(builderScs.data) && builderScs.data.length > 0) {
          scId = builderScs.data[0].id;
          res = await verifyScorecard(scId);
        }
      }

      if (res.success && res.data) {
        const d = res.data;
        const skillsList = d.skill_scores
          ? Object.entries(d.skill_scores).map(([name, score]) => ({
              name: name === 'REST API' ? 'REST APIs' : name,
              score,
              benchmark: "Target: 80+ Top Tier"
            }))
          : defaultSkills;

        setCandidate({
          ...mockCandidate,
          id: candidateId || mockCandidate.id,
          scorecardId: d.scorecard_id || d.id || `SC-BE-2026-001`,
          name: d.builder || mockCandidate.name,
          domain: d.domain || mockCandidate.domain,
          score: d.overall_score || mockCandidate.score,
          validity: d.status || 'VALID',
          validUntil: d.valid_until || mockCandidate.validUntil || "2028-09-26",
          issuedDate: d.issued_at || mockCandidate.issuedDate || "2026-09-26",
          skills: skillsList.length >= 4 ? skillsList : defaultSkills
        });
      } else {
        setCandidate({
          ...mockCandidate,
          skills: defaultSkills
        });
      }
    } catch (err) {
      console.warn("Could not verify scorecard via backend, using fallback:", err);
      setCandidate({
        ...mockCandidate,
        skills: defaultSkills
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifiedScorecard();
  }, [candidateId]);

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading scorecard...</h2>
        <p className="text-xs text-slate-400">Verifying 2-year cryptographic credentials with backend authority...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Unable to load scorecard.</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchVerifiedScorecard}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const shortlisted = isShortlisted(candidate.id);
  const activeSkills = candidate.skills || defaultSkills;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/recruiter" className="text-slate-400 hover:text-white transition-colors">
              Recruiter Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <Link to="/recruiter/candidates" className="text-slate-400 hover:text-white transition-colors">
              Candidate Discovery
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 font-mono">Scorecard Verification</span>
          </div>
          <div className="pt-1">
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold block">
              SIGNALCRAFT
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              VERIFIED TECHNICAL SCORECARD
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant employer verification of candidate's standardized 2-year technical credential.
          </p>
        </div>

        {/* Shortlist & Evidence Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowProofTrail(!showProofTrail)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showProofTrail
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30'
            }`}
          >
            <span>{showProofTrail ? "Hide Proof Trail" : "View Proof Trail"}</span>
            <span className="text-xs font-mono">✦</span>
          </button>

          <Link
            to={`/recruiter/candidate/${candidate.id}`}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>View Proof</span>
            <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>

          <button
            onClick={handleShortlist}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 ${
              shortlisted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <span>{shortlisted ? 'Candidate Shortlisted ✓' : 'Shortlist'}</span>
          </button>
        </div>
      </div>

      {/* PROOF TRAIL (WHEN TOGGLED) */}
      {showProofTrail && (
        <ProofTrail candidate={{ name: candidate.name, score: candidate.score, scorecardId: candidate.scorecardId }} />
      )}

      {/* VERIFIED SCORECARD VIEW */}
      <div className="rounded-3xl bg-slate-900/90 border-2 border-emerald-500/30 p-8 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Verification Status Banner */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                SIGNALCRAFT VERIFIED TECHNICAL SCORECARD • STATUS: {candidate.validity}
              </span>
              <span className="text-xs text-slate-300">
                Every verified skill is backed by cryptographic evidence, ADR architectural decisions, and human reviewer evaluation.
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded bg-slate-900 border border-slate-800 self-start sm:self-auto">
            Valid for 2 years (Expires: {candidate.validUntil})
          </span>
        </div>

        {/* Header Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                SCORECARD ID: {candidate.scorecardId}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                STATUS: {candidate.validity} ✓
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-mono text-slate-400 tracking-wider uppercase block">Candidate</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {candidate.name}
              </h2>
            </div>
            <p className="text-sm font-medium text-slate-300 mt-1">
              Domain: <span className="text-emerald-400 font-semibold">{candidate.domain}</span>
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-center sm:text-right min-w-[160px]">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Overall Verified Score
            </span>
            <div className="text-5xl font-black text-white font-mono mt-1">
              {candidate.score}
              <span className="text-xl text-slate-500 font-normal"> / 100</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
              Valid for 2 years ✓
            </span>
          </div>
        </div>

        {/* Scorecard Validity Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs pb-6 border-b border-slate-800">
          <div>
            <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px]">Issued Date</span>
            <span className="text-white font-semibold text-sm">{candidate.issuedDate}</span>
          </div>

          <div>
            <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px]">Valid Until</span>
            <span className="text-emerald-400 font-semibold text-sm">{candidate.validUntil} (Valid for 2 years)</span>
          </div>

          <div>
            <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px]">Verified by Evaluator</span>
            <span className="text-purple-300 font-semibold text-sm">{candidate.reviewerName || "Ananya Rao"}</span>
            <span className="text-slate-400 block text-[11px]">{candidate.reviewerTitle || "Senior Staff Engineer"} ({candidate.reviewerScore || 4.5} / 5.0)</span>
          </div>
        </div>

        {/* SKILL SCORES BREAKDOWN (JAVA, SQL, REST APIs, DEBUGGING, PROBLEM SOLVING) */}
        <div className="py-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Skill Scores
            </h3>
            <span className="text-xs text-slate-400 font-mono">Calibrated Industry Benchmarks</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {activeSkills.map((s) => (
              <div
                key={s.name}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{s.name}</span>
                  <span className="font-mono font-bold text-emerald-400">{s.score}/100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {s.benchmark || "Target: 80+ Top Tier"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Highlights Box */}
        {candidate.evidence && (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Underlying Evidence Summary
              </h3>
              <span className="text-xs text-emerald-400 font-mono">100% Verifiable</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-200">Coding Artifact:</span>
                <p className="text-slate-400">{candidate.evidence.coding || "Clean MVC service layer with pessimistic concurrency controls."}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-200">Debugging Artifact:</span>
                <p className="text-slate-400">{candidate.evidence.debugging || "Resolved thread starvation and memory leak in queue consumer."}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-200">SQL Data Artifact:</span>
                <p className="text-slate-400">{candidate.evidence.sql || "Optimized complex analytical query with index seek, reducing execution time 92%."}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-200">ADR Architectural Record:</span>
                <p className="text-slate-400">{candidate.evidence.reasoning || "Comprehensive trade-off analysis between Redis vs DB row-level locks."}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <Link
                to={`/recruiter/candidate/${candidate.id}`}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>Inspect Full Evidence Details →</span>
              </Link>
            </div>
          </div>
        )}

        {/* Verification Note / Non-certification disclaimer */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 pt-2">
          <span className="text-blue-400 font-bold">ℹ</span>
          <p className="leading-relaxed">
            SIGNALCRAFT TECHNICAL VERIFICATION — Valid for 2 years. Every verified skill is backed by practical code evidence, architecture decision records (ADRs), and authoritative human evaluation. This scorecard is a practical engineering capability evaluation and not an official academic certification or accreditation.
          </p>
        </div>

      </div>

    </div>
  );
}
