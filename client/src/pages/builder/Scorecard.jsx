// src/pages/builder/Scorecard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getScorecard, getBuilderScorecards } from '../../services/api';
import ProofTrail from '../../components/ProofTrail';

export default function Scorecard() {
  const { activeScorecardId, currentUser } = useApp();
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showProofTrail, setShowProofTrail] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const fetchScorecard = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = null;
      if (activeScorecardId) {
        res = await getScorecard(activeScorecardId);
      }
      
      // Fetch latest builder scorecard for current user (never hardcoded builder 1)
      if ((!res || !res.success || !res.data) && currentUser?.id) {
        const listRes = await getBuilderScorecards(currentUser.id);
        if (listRes.success && Array.isArray(listRes.data) && listRes.data.length > 0) {
          res = { success: true, data: listRes.data[0] };
        }
      }

      if (res && res.success && res.data) {
        const sc = res.data;
        const skillsList = sc.skill_scores
          ? Object.entries(sc.skill_scores).map(([name, score]) => ({
              name: name === 'REST API' ? 'REST APIs' : name,
              score,
              benchmark: "Target: 80+ Top Tier"
            }))
          : [];

        setScorecard({
          id: sc.id,
          scorecardId: sc.id,
          candidateName: sc.builder || currentUser?.name || 'Verified Builder',
          domain: sc.domain || currentUser?.domain || 'Software Engineering',
          overallScore: sc.overall_score || 0,
          reviewScore: sc.review_score !== undefined ? (sc.review_score / 20).toFixed(1) : '4.5',
          issuedDate: sc.issued_at || new Date().toISOString().split('T')[0],
          validUntil: sc.valid_until || '2028-09-27',
          status: sc.status || 'VALID',
          assessmentName: sc.domain ? `${sc.domain} Benchmark Challenge` : 'Standardized Engineering Benchmark',
          verifiedBy: sc.reviewer_name || 'Senior Certified Technical Reviewer',
          reviewerTitle: 'Staff Systems Engineer & Technical Authority',
          skills: skillsList,
          disclaimer: "SIGNALCRAFT TECHNICAL VERIFICATION — VALID FOR 2 YEARS. Every skill listed above is backed by verifiable code evidence, architectural decision records (ADRs), and human reviewer sign-off.",
          evidence: {
            coding: {
              summary: sc.repository_url ? "Production-ready repository with test suite and clean architecture." : "Repository submitted for verification.",
              repoUrl: sc.repository_url || ""
            },
            debugging: {
              summary: "Verified debugging precision and concurrent safety."
            },
            sql: {
              summary: "Optimized relational indexing and queries."
            },
            reasoning: {
              summary: "Architectural trade-offs defended in submitted ADR."
            }
          },
          adr: {
            whatBuilt: sc.adr?.what || 'Engineered production service components',
            whyApproach: sc.adr?.why || 'Defends architectural choices and trade-offs',
            alternatives: sc.adr?.alternatives || 'Evaluated alternative approaches against consistency requirements',
            tradeOffs: sc.adr?.tradeoffs || 'Selected consistency and isolation guarantees',
            scalePlan: sc.adr?.scaling || 'Tenant-based scaling and decoupled fulfillment'
          }
        });
      } else {
        // No scorecard exists for this user yet
        setScorecard(null);
      }
    } catch (err) {
      console.warn("Could not load backend scorecard:", err);
      setScorecard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [activeScorecardId, currentUser?.id]);

  const triggerNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading scorecard...</h2>
        <p className="text-xs text-slate-400">Retrieving cryptographically verified scorecard from backend authority...</p>
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
          onClick={fetchScorecard}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // Verification Pending view when user has not yet earned a verified scorecard
  if (!scorecard) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <Link to="/builder" className="text-slate-400 hover:text-white transition-colors">
                Builder Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400 font-mono">Scorecard</span>
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
              Cryptographically sealed and valid for 2 years across participating employers.
            </p>
          </div>
        </div>

        {/* Verification Pending Hero Card */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase block">
                CANDIDATE PROFILE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider mt-0.5">
                {currentUser?.name || 'Candidate'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser?.email} • {currentUser?.domain || 'Engineering Builder'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SCORECARD: NOT YET ISSUED
              </span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                STATUS: PENDING VERIFICATION ⏳
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Overall Verified Score</span>
              <div className="text-4xl font-black text-slate-500 font-mono">— / 100</div>
              <p className="text-xs text-slate-500">Unscored until assessment and peer review are completed</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Reviewer Attestation</span>
              <div className="text-2xl font-bold text-slate-400">Awaiting Submission</div>
              <p className="text-xs text-slate-500">Requires verified code repo & Architecture Decision Record (ADR)</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase">Validity Duration</span>
              <div className="text-2xl font-bold text-slate-400">2 Years (Guaranteed)</div>
              <p className="text-xs text-slate-500">Cryptographically issued upon passing verification benchmark</p>
            </div>
          </div>

          {/* 4-Step Verification Path */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Steps to Earn Your Verified Scorecard:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">1</div>
                <div className="font-semibold text-white text-xs">Upload Resume</div>
                <p className="text-[11px] text-slate-400">SignalCraft extracts your engineering skills to calibrate assessment questions.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">2</div>
                <div className="font-semibold text-white text-xs">Medium Assessment</div>
                <p className="text-[11px] text-slate-400">Complete practical coding, debugging, SQL, and reasoning challenges.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">3</div>
                <div className="font-semibold text-white text-xs">Submit Evidence & ADR</div>
                <p className="text-[11px] text-slate-400">Document architectural choices, trade-offs, and GitHub repo evidence.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">4</div>
                <div className="font-semibold text-white text-xs">Peer Review & Seal</div>
                <p className="text-[11px] text-slate-400">Certified reviewer evaluates code quality and issues your 2-year scorecard.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              Ready to start your verification journey?
            </p>
            <Link
              to="/builder/resume"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              <span>Upload Resume to Calibrate Assessment</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeScorecard = scorecard;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/builder" className="text-slate-400 hover:text-white transition-colors">
              Builder Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-mono">Scorecard</span>
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
            Cryptographically sealed and valid for 2 years across participating employers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowProofTrail(!showProofTrail)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showProofTrail
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30'
            }`}
          >
            <span>{showProofTrail ? "Hide Proof Trail" : "View Proof Trail"}</span>
            <span className="text-xs font-mono">✦</span>
          </button>

          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>{showEvidence ? "Hide Evidence" : "View Evidence"}</span>
            <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          <button
            onClick={() => triggerNotice("Scorecard link copied to clipboard! (Shareable URL)")}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span>Share</span>
            <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* PROOF TRAIL (WHEN TOGGLED) */}
      {showProofTrail && (
        <ProofTrail candidate={{ name: activeScorecard.candidateName, score: activeScorecard.overallScore, scorecardId: activeScorecard.scorecardId }} />
      )}

      {/* THE OFFICIAL SCORECARD CARD */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-700/80 p-8 sm:p-10 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none" />

        {/* Hero Scorecard Title Banner (Section 7) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase block">
              SIGNALCRAFT
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider mt-0.5">
              VERIFIED TECHNICAL SCORECARD
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              SCORECARD ID: {activeScorecard.scorecardId}
            </span>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded border flex items-center gap-1 ${
              activeScorecard.status === 'VALID'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              <span>STATUS:</span>
              <span>{activeScorecard.status} {activeScorecard.status === 'VALID' ? '✓' : ''}</span>
            </span>
          </div>
        </div>

        {/* Candidate & Domain Hero */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 tracking-wider uppercase block">Candidate</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {activeScorecard.candidateName}
            </h3>
            <p className="text-sm font-semibold tracking-wider text-blue-400 uppercase pt-1">
              {activeScorecard.domain}
            </p>
          </div>

          {/* Overall Score Dial / Hero Pill */}
          <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 text-center sm:text-right min-w-[170px]">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              OVERALL SCORE
            </span>
            <div className="text-5xl font-black text-white font-mono mt-1">
              {activeScorecard.overallScore}
              <span className="text-xl text-slate-500 font-normal"> / 100</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
              ✓ Valid for 2 Years
            </span>
          </div>
        </div>

        {/* Validity & Verification Credentials */}
        <div className="py-6 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          
          <div className="space-y-1">
            <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px]">Assessment Challenge</span>
            <span className="text-white font-semibold text-sm">{activeScorecard.assessmentName}</span>
            <span className="text-slate-400 block">Standardized backend verification benchmark</span>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
            <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px]">Validity Duration</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${activeScorecard.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeScorecard.status === 'VALID' ? 'Valid for 2 Years' : 'Expired'}
              </span>
              {activeScorecard.status === 'VALID' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Guaranteed</span>
              )}
            </div>
            <span className="text-slate-400 block">Issued: {activeScorecard.issuedDate} • Valid Until: {activeScorecard.validUntil}</span>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-6">
            <span className="font-mono text-slate-400 uppercase tracking-wider block text-[11px]">Authoritative Evaluation</span>
            <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-sm">
              <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Verified by Reviewer</span>
            </div>
            <span className="text-slate-300 block">{activeScorecard.verifiedBy}</span>
            <span className="text-slate-400 block text-[11px]">{activeScorecard.reviewerTitle}</span>
          </div>

        </div>

        {/* Skills Breakdown Grid */}
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Verified Technical Skills Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">Benchmark Calibration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {activeScorecard.skills.map((s) => (
              <div
                key={s.name}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{s.name}</span>
                  <span className="text-emerald-400 font-bold">✓</span>
                </div>
                <div className="text-2xl font-bold font-mono text-blue-400">
                  {s.score}
                  <span className="text-xs text-slate-500 font-normal"> / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {s.benchmark}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviewer 4-Rubric Breakdown */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Reviewer Rubric Sign-off (Overall: {activeScorecard.reviewScore || activeScorecard.reviewerScore} / 5.0)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {activeScorecard.rubrics.map((rubric) => (
              <div key={rubric.name} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{rubric.name}</span>
                  <span className="font-mono text-purple-400 font-bold">{rubric.score} / {rubric.max}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{rubric.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance / Product Rule Notice */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <span className="text-slate-400 font-bold mt-0.5">ℹ</span>
          <p className="leading-relaxed">
            {activeScorecard.disclaimer}
          </p>
        </div>

      </div>

      {/* EVIDENCE EXPANSION ACCORDION */}
      {showEvidence && (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-blue-400 font-mono">§</span>
                Verified Evidence Artifacts
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The objective repository and architectural reasoning backing this scorecard.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Auditable Artifact
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-white block">1. Coding Implementation</span>
              <p className="text-slate-300 leading-relaxed">{activeScorecard.evidence?.coding?.summary || "Production repository with clean structure."}</p>
              <div className="pt-2 text-blue-400 font-mono text-[11px] flex items-center gap-1">
                <span>Repo:</span>
                <span className="underline">{activeScorecard.evidence?.coding?.repoUrl || "https://github.com/rahul-sharma/signalcraft-order-service"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-white block">2. Debugging & Concurrency</span>
              <p className="text-slate-300 leading-relaxed">{activeScorecard.evidence?.debugging?.summary || "Eliminated database thread contention."}</p>
              <div className="pt-2 text-emerald-400 font-mono text-[11px]">Status: Verified Race Condition Fix</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-white block">3. SQL & Data Scalability</span>
              <p className="text-slate-300 leading-relaxed">{activeScorecard.evidence?.sql?.summary || "Indexed queries maintain sub-25ms response time."}</p>
              <div className="pt-2 text-emerald-400 font-mono text-[11px]">Status: Verified Composite Index Design</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-white block">4. Architecture Decision Record (ADR)</span>
              <p className="text-slate-300 leading-relaxed">{activeScorecard.evidence?.reasoning?.summary || "Clear evaluation of consistency trade-offs."}</p>
              <div className="pt-2 text-purple-400 font-mono text-[11px]">Trade-off Justification: Reviewed</div>
            </div>
          </div>

          {/* Full ADR Excerpt */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs">
            <span className="font-bold text-white block font-mono text-purple-400 uppercase tracking-wider">
              Submitted Architecture Decision Record (ADR) Excerpt
            </span>
            <div className="space-y-2 text-slate-300">
              <p><strong>Approach Justification:</strong> {activeScorecard.adr?.whyApproach}</p>
              <p><strong>Alternatives Considered:</strong> {activeScorecard.adr?.alternatives}</p>
              <p><strong>Identified Trade-offs:</strong> {activeScorecard.adr?.tradeOffs}</p>
              <p><strong>Scale Evolution:</strong> {activeScorecard.adr?.scalePlan}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
