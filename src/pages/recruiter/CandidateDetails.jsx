// src/pages/recruiter/CandidateDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getCandidate, getCandidateJobFit, getJobs } from '../../services/api';
import ProofTrail from '../../components/ProofTrail';

export default function CandidateDetails() {
  const { candidateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '1';

  const { candidates, toggleShortlist, isShortlisted } = useApp();

  const [selectedJobId, setSelectedJobId] = useState(Number(initialJobId));
  const [jobsList, setJobsList] = useState([]);
  const [candidateData, setCandidateData] = useState(null);
  const [jobFitData, setJobFitData] = useState(null);
  const [activeTab, setActiveTab] = useState('jobfit'); // 'jobfit' | 'trail' | 'artifacts'
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load available jobs list
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getJobs();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setJobsList(res.data);
        }
      } catch (err) {
        console.warn("Could not load jobs in CandidateDetails:", err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch candidate details & job fit
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [candRes, fitRes] = await Promise.all([
          getCandidate(candidateId, selectedJobId),
          getCandidateJobFit(candidateId, selectedJobId)
        ]);

        if (candRes.success && candRes.data) {
          setCandidateData(candRes.data);
        }
        if (fitRes.success && fitRes.data) {
          setJobFitData(fitRes.data);
        }
      } catch (e) {
        console.warn("Could not fetch candidate details or job fit:", e);
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchAll();
    }
  }, [candidateId, selectedJobId]);

  const candidate = candidateData || candidates.find(c => String(c.id) === String(candidateId)) || candidates[0] || {};
  const fit = jobFitData || candidate.jobFit || null;
  const coverage = fit?.proofCoverage || { verified: 0, total: 5, percentage: 0, ratio: '0 / 5' };
  const shortlisted = isShortlisted(candidate.id);

  const currentJob = jobsList.find(j => Number(j.id) === Number(selectedJobId)) || jobsList[0] || {
    id: selectedJobId || 1,
    title: fit?.jobTitle || 'Backend Developer',
    company: fit?.jobCompany || 'TechNova Solutions',
    required_skills: fit?.requiredSkills || ['Java', 'SQL', 'REST API', 'Spring Boot', 'Debugging']
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShortlist = async () => {
    const wasShortlisted = isShortlisted(candidate.id);
    await toggleShortlist(candidate.id, selectedJobId || 1);
    if (!wasShortlisted) {
      showToast("Candidate shortlisted ✓");
    } else {
      showToast("Candidate removed from shortlist");
    }
  };

  const handleJobChange = (newJobId) => {
    const idNum = Number(newJobId);
    setSelectedJobId(idNum);
    setSearchParams({ jobId: String(idNum) });
  };

  const progressColor = coverage.percentage >= 80
    ? 'bg-emerald-500'
    : coverage.percentage >= 50
      ? 'bg-blue-500'
      : 'bg-amber-500';

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
        <Link to={`/recruiter/candidates?jobId=${selectedJobId}`} className="text-slate-400 hover:text-white transition-colors">
          Candidate Discovery
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-emerald-400 font-mono">{candidate.name}</span>
      </div>

      {/* Hero Candidate Profile Card */}
      <div className="p-7 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold font-mono shadow-lg shrink-0">
            {candidate.avatar || (candidate.name ? candidate.name.split(' ').map(n=>n[0]).join('') : 'C')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{candidate.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                {candidate.validity || candidate.scorecard_status || "PENDING_REVIEW"} ✓
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Domain: <strong className="text-slate-200">{candidate.domain}</strong> • Experience: {candidate.experience || "2-4 years"}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Scorecard ID: <span className="text-blue-400">{candidate.scorecardId || candidate.scorecard_id || 'Pending Review'}</span> • Valid Until: <span className="text-emerald-400">{candidate.validUntil || candidate.valid_until || 'Verification Pending'}</span>
            </p>
            {/* Manually Submitted Repo & Demo Links */}
            <div className="flex flex-wrap items-center gap-2.5 mt-3">
              {(candidate.repository_url || candidate.repoUrl) && (
                <a
                  href={candidate.repository_url || candidate.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 text-xs font-mono font-medium transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Candidate GitHub Repo</span>
                </a>
              )}
              {(candidate.project_url || candidate.demoUrl) && (
                <a
                  href={candidate.project_url || candidate.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-mono font-medium transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Live Staging Demo</span>
                </a>
              )}
            </div>
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

      {/* VIEW TOGGLE TABS */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('jobfit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'jobfit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>Proof-to-Job Fit Map</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-200 font-mono font-bold">
            {coverage.ratio}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trail')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'trail'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>Verified Proof Trail (9 Steps)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200 font-mono">Audit</span>
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

      {/* ======================================================== */}
      {/* TAB 1: PROOF-TO-JOB FIT MAP (CORE FEATURE) */}
      {/* ======================================================== */}
      {activeTab === 'jobfit' && (
        <div className="space-y-8">
          
          {/* Top Job Selector & Proof Coverage Header */}
          <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-600/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold block">
                  Candidate Evidence Evaluation
                </span>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {candidate.name} → {currentJob.title}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    {currentJob.company}
                  </span>
                </div>
              </div>

              {/* Job Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="details-select-job" className="text-xs font-mono text-slate-300 whitespace-nowrap">
                  Evaluating For:
                </label>
                <select
                  id="details-select-job"
                  value={selectedJobId}
                  onChange={(e) => handleJobChange(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-semibold text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {jobsList.map(j => (
                    <option key={j.id} value={j.id} className="bg-slate-950 text-white">
                      {j.title} ({j.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Proof Coverage Metrics Bar */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white font-mono">{coverage.ratio}</span>
                  <span className="text-xs font-mono text-slate-400">Requirements Verified</span>
                  <span className={`text-sm px-2.5 py-0.5 rounded-lg font-mono font-bold ${
                    coverage.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {coverage.percentage}% Coverage
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-emerald-400 font-semibold">{coverage.verified} Verified</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-semibold">{coverage.partial} Partial</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-semibold">{coverage.missing} Missing</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`${progressColor} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${coverage.percentage}%` }}
                />
              </div>
            </div>

          </div>

          {/* REQUIREMENTS BREAKDOWN TABLE */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Job Requirement → Verified Proof Mapping
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed calibration for every skill required by {currentJob.title}.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Deterministic Evidence
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Job Requirement</th>
                    <th className="py-3 px-4">Verified Score</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4">Evidence Sources</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {fit?.requirements?.map((req) => {
                    const isVerified = req.status === 'VERIFIED';
                    const isPartial = req.status === 'PARTIAL';

                    return (
                      <tr key={req.skill} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white text-sm">
                          {req.skill}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          {req.score !== null ? (
                            <span className={isVerified ? 'text-emerald-400' : 'text-amber-400'}>
                              {req.score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-normal">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isVerified && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold inline-flex items-center gap-1.5">
                              <span>✓</span> VERIFIED
                            </span>
                          )}
                          {isPartial && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold inline-flex items-center gap-1.5">
                              <span>⚠</span> PARTIAL
                            </span>
                          )}
                          {!isVerified && !isPartial && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 font-mono inline-flex items-center gap-1.5">
                              <span>○</span> MISSING
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {req.evidence && req.evidence.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {req.evidence.map((ev, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                                >
                                  ✓ {ev.type}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">No verified proof</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* EVIDENCE DETAILS SECTION */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400 font-mono">§</span>
                Detailed Evidence By Requirement
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every verified claim is backed by concrete technical artifacts and authoritative evaluations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fit?.requirements?.filter(r => r.status !== 'MISSING').map((req) => (
                <div
                  key={req.skill}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{req.skill}</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      req.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {req.status} {req.score ? `(${req.score})` : ''}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                      Evidence Trail:
                    </span>
                    {req.evidence?.map((ev, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="leading-snug">{ev.label}</span>
                      </div>
                    ))}
                  </div>

                  {req.reason && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-900">
                      "{req.reason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MISSING / WEAK PROOF SECTION */}
          {(fit?.missingProof?.length > 0 || fit?.partialProof?.length > 0) && (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-base font-bold text-white font-mono">
                  Missing / Weak Proof Callout
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                The recruiter must evaluate these unverified or partially verified requirements before making a hiring decision:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {fit?.missingProof?.map(skill => (
                  <div key={skill} className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 font-mono">{skill}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold">
                        MISSING
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      No verified evidence found in candidate assessments, repositories, or scorecards.
                    </p>
                  </div>
                ))}

                {fit?.partialProof?.map(skill => (
                  <div key={skill} className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 font-mono">{skill}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold">
                        PARTIAL
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Demonstrated in project deliverables or architecture description, but lacks formal calibrated score or scored below target.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VERIFIED SCORECARD CALIBRATION SECTION */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Verified Technical Scorecard Calibration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official 2-year verified credential sealed in SignalCraft authority.
                </p>
              </div>
              <Link
                to={`/recruiter/scorecard/${candidate.id}`}
                className="text-xs text-purple-400 hover:text-purple-300 font-mono font-bold flex items-center gap-1"
              >
                <span>View Full Scorecard</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {candidate.skill_scores && Object.entries(candidate.skill_scores).map(([sName, sScore]) => (
                <div key={sName} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">{sName}</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 block">
                    {sScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">Verified 2-Year Active</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PROOF TRAIL (9-STEP AUDIT CHAIN) */}
      {/* ======================================================== */}
      {activeTab === 'trail' && (
        <ProofTrail candidate={candidate} />
      )}

      {/* ======================================================== */}
      {/* TAB 3: DETAILED EVIDENCE ARTIFACTS */}
      {/* ======================================================== */}
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
                    {candidate.evidence?.coding}
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
                    {candidate.evidence?.debugging}
                  </p>
                </div>

                {/* Evidence 3: SQL */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">SQL / Data</span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span>✓</span> Verified
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mt-1">
                    {candidate.evidence?.sql}
                  </p>
                </div>

                {/* Evidence 4: Reasoning */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Technical Reasoning</span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span>✓</span> Verified
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed mt-1">
                    {candidate.evidence?.reasoning}
                  </p>
                </div>

              </div>
            </div>

            {/* Candidate Deliverables & 5-Part ADR */}
            {(candidate.repository_url || candidate.project_url || candidate.adr) && (
              <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-blue-400 font-mono text-sm">📦</span>
                    Candidate Deliverables & Architecture Decision Record (ADR)
                  </h2>
                  <span className="text-xs font-mono text-emerald-400">Live Artifacts</span>
                </div>

                {/* Links */}
                <div className="flex flex-wrap items-center gap-3">
                  {(candidate.repository_url || candidate.repoUrl) && (
                    <a
                      href={candidate.repository_url || candidate.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 text-xs font-mono font-medium transition-all flex items-center gap-2"
                    >
                      <span>Source Repository:</span>
                      <span className="underline">{candidate.repository_url || candidate.repoUrl}</span>
                    </a>
                  )}
                  {(candidate.project_url || candidate.demoUrl) && (
                    <a
                      href={candidate.project_url || candidate.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-mono font-medium transition-all flex items-center gap-2"
                    >
                      <span>Live Demo:</span>
                      <span className="underline">{candidate.project_url || candidate.demoUrl}</span>
                    </a>
                  )}
                </div>

                {/* ADR 5 Questions */}
                {candidate.adr && (
                  <div className="space-y-3 pt-2 text-xs">
                    {(candidate.adr.what || candidate.adr.whatBuilt) && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-0.5">1. What was built:</span>
                        <p className="text-slate-200">{candidate.adr.what || candidate.adr.whatBuilt}</p>
                      </div>
                    )}
                    {(candidate.adr.why || candidate.adr.whyApproach) && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-0.5">2. Why this approach:</span>
                        <p className="text-slate-200">{candidate.adr.why || candidate.adr.whyApproach}</p>
                      </div>
                    )}
                    {candidate.adr.alternatives && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-0.5">3. Alternatives considered:</span>
                        <p className="text-slate-200">{candidate.adr.alternatives}</p>
                      </div>
                    )}
                    {(candidate.adr.tradeoffs || candidate.adr.tradeOffs) && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-0.5">4. Trade-offs made:</span>
                        <p className="text-slate-200">{candidate.adr.tradeoffs || candidate.adr.tradeOffs}</p>
                      </div>
                    )}
                    {(candidate.adr.scaling || candidate.adr.scalePlan) && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-0.5">5. Scale plan:</span>
                        <p className="text-slate-200">{candidate.adr.scaling || candidate.adr.scalePlan}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Reviewer Authority Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-purple-500/20 space-y-4">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block font-semibold">
                Evaluation Authority
              </span>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold font-mono">
                  AR
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ananya Rao</h4>
                  <p className="text-xs text-slate-400">Principal Architect • Calibrated Reviewer</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Authority Review Score:</span>
                <span className="text-xl font-bold font-mono text-purple-400">
                  {candidate.review_score ? (candidate.review_score / 20).toFixed(1) : "4.4"} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Reviewer evaluated code quality, concurrency guarantees, and trade-off defense.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
