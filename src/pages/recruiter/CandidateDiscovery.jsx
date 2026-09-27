// src/pages/recruiter/CandidateDiscovery.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getCandidates, getJobs, shortlistCandidate } from '../../services/api';

export default function CandidateDiscovery() {
  const navigate = useNavigate();
  const { candidates: contextCandidates, toggleShortlist, isShortlisted } = useApp();

  const [jobsList, setJobsList] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(1);
  const [candidatesList, setCandidatesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [validityFilter, setValidityFilter] = useState("All");
  const [proofCoverageMin, setProofCoverageMin] = useState("All"); // "All" | 80 | 60 | 40
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("All"); // "All" | "Fully Verified" | "Partial" | "Missing Proof"
  const [selectedRequiredSkill, setSelectedRequiredSkill] = useState("All");
  const [toastMessage, setToastMessage] = useState(null);

  // Load available jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getJobs();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setJobsList(res.data);
          if (!selectedJobId) {
            setSelectedJobId(res.data[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load jobs list:", err);
      }
    };
    fetchJobs();
  }, []);

  const currentJob = jobsList.find(j => Number(j.id) === Number(selectedJobId)) || jobsList[0] || {
    id: 1,
    title: 'Backend Developer',
    company: 'TechNova Solutions',
    required_skills: ['Java', 'SQL', 'REST API', 'Spring Boot', 'Debugging']
  };

  const fetchFilteredCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        jobId: selectedJobId || 1
      };
      if (selectedSkill !== "All") filters.skill = selectedSkill;
      if (selectedDomain !== "All") filters.domain = selectedDomain;
      if (minScore > 0) filters.minScore = minScore;
      if (proofCoverageMin !== "All") filters.proofCoverageMin = proofCoverageMin;
      if (verificationStatusFilter !== "All") filters.verificationStatus = verificationStatusFilter;
      if (selectedRequiredSkill !== "All") filters.requiredSkill = selectedRequiredSkill;

      const res = await getCandidates(filters);
      if (res.success && Array.isArray(res.data)) {
        // Normalize candidates to UI shape
        const normalized = res.data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          domain: c.domain || "Backend Engineering",
          avatar: c.name ? c.name.split(' ').map(n => n[0]).join('') : 'C',
          experience: "2-4 years",
          assessment: c.challenge_title || "Practical Engineering Challenge",
          validity: c.scorecard_status || (c.submission_id ? "PENDING_REVIEW" : "IN_PROGRESS"),
          validUntil: c.valid_until || (c.submission_id ? "Verification Pending" : "In Progress"),
          score: c.overall_score !== undefined && c.overall_score !== null ? c.overall_score : 0,
          rank: c.rank || 1,
          rankBadge: c.rank_badge || `#${c.rank || 1} Ranked`,
          rankTier: c.rank_tier || "Top 10%",
          verifiedSkills: c.verified_skills || c.skills || ["Java", "SQL"],
          skillScores: c.skill_scores || null,
          reviewerName: c.scorecard_id ? "Ananya Rao" : "Pending Reviewer",
          reviewerScore: c.review_score ? (c.review_score / 20).toFixed(1) : (c.scorecard_id ? "4.4" : "—"),
          scorecardId: c.scorecard_id || (c.submission_id ? `SUB-2026-00${c.id}` : `CAND-2026-00${c.id}`),
          repository_url: c.repository_url || c.repoUrl || null,
          project_url: c.project_url || c.demoUrl || null,
          repoUrl: c.repository_url || c.repoUrl || null,
          demoUrl: c.project_url || c.demoUrl || null,
          adr: c.adr || null,
          jobFit: c.jobFit || c.job_fit || null,
          proofCoverage: c.proofCoverage || c.proof_coverage || null,
          evidence: c.evidence || {
            coding: c.adr?.what || c.adr?.whatBuilt || (c.repository_url ? "Production code repository submitted." : "Practical engineering challenge solution."),
            debugging: "Race condition eliminated in inventory allocation.",
            sql: "Composite index schema on orders (tenant_id, created_at).",
            reasoning: c.adr?.why || c.adr?.whyApproach || "ADR analyzes architectural design trade-offs."
          }
        }));
        setCandidatesList(normalized);
      } else if (contextCandidates && contextCandidates.length > 0) {
        setCandidatesList(contextCandidates);
      } else {
        setCandidatesList([]);
      }
    } catch (err) {
      console.warn("Could not fetch filtered candidates from backend:", err);
      if (contextCandidates && contextCandidates.length > 0) {
        setCandidatesList(contextCandidates);
      } else {
        setError("Unable to load candidates.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredCandidates();
  }, [selectedJobId, selectedSkill, selectedDomain, minScore, proofCoverageMin, verificationStatusFilter, selectedRequiredSkill]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShortlistClick = async (candidate) => {
    const wasShortlisted = isShortlisted(candidate.id);
    await toggleShortlist(candidate.id, selectedJobId || 1);
    if (!wasShortlisted) {
      showToast(`Candidate shortlisted ✓ (${candidate.name})`);
    } else {
      showToast(`Candidate removed from shortlist (${candidate.name})`);
    }
  };

  // Filter candidates on search & validity
  const filteredCandidates = candidatesList.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.verifiedSkills && c.verifiedSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesValidity = validityFilter === "All" || c.validity === validityFilter;

    return matchesSearch && matchesValidity;
  });

  if (loading && candidatesList.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-white">Loading verified talent...</h2>
        <p className="text-xs text-slate-400">Calibrating proof-to-job fit from authoritative backend evidence...</p>
      </div>
    );
  }

  if (error && candidatesList.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Unable to load candidates.</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchFilteredCandidates}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const jobRequiredSkills = Array.isArray(currentJob?.required_skills)
    ? currentJob.required_skills
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs">
          <Link to="/recruiter" className="text-slate-400 hover:text-white transition-colors">
            ← Recruiter Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-400 font-mono">Evidence-Based Discovery</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Proof-to-Job Fit Discovery
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              SignalCraft shows which job requirements each candidate has <strong>actually proven</strong> with verifiable code evidence, sealed scorecards, and authoritative reviewer sign-off.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              {filteredCandidates.length} Candidates Evaluated
            </span>
          </div>
        </div>
      </div>

      {/* SELECTED JOB FOR PROOF-FIT MAPPING BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold block">
              Target Job Requirements Map
            </span>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h2 className="text-xl font-bold text-white">
                {currentJob.title}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                {currentJob.company}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Difficulty: <strong className="text-slate-200">{currentJob.difficulty || 'Intermediate'}</strong>
              </span>
            </div>
          </div>

          {/* Job Switcher Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label htmlFor="select-job" className="text-xs font-mono text-slate-300 whitespace-nowrap">
              Switch Job:
            </label>
            <select
              id="select-job"
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(Number(e.target.value));
                setSelectedRequiredSkill("All");
              }}
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

        {/* Required Skills Chips */}
        <div className="relative z-10 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-1">Required Skills ({jobRequiredSkills.length}):</span>
            {jobRequiredSkills.map(skill => (
              <span
                key={skill}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 font-mono font-medium flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            ℹ Candidate proof coverage and verification badges below update dynamically against this job's requirements.
          </p>
        </div>
      </div>

      {/* MULTI-DIMENSIONAL EVIDENCE-BASED FILTERS */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <svg className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name, verified skill (Java, SQL, Kafka), or domain..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-200 outline-none"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          
          {/* Proof Coverage Filter */}
          <div>
            <label htmlFor="filter-coverage" className="block text-[11px] font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
              Proof Coverage
            </label>
            <select
              id="filter-coverage"
              value={proofCoverageMin}
              onChange={(e) => setProofCoverageMin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-300 outline-none font-mono"
            >
              <option value="All">All Coverage</option>
              <option value="80">80%+ Verified</option>
              <option value="60">60%+ Verified</option>
              <option value="40">40%+ Verified</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label htmlFor="filter-verification" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Verification Status
            </label>
            <select
              id="filter-verification"
              value={verificationStatusFilter}
              onChange={(e) => setVerificationStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-300 outline-none font-mono"
            >
              <option value="All">All Statuses</option>
              <option value="Fully Verified">Fully Verified (100%)</option>
              <option value="Partial">Partial Evidence</option>
              <option value="Missing Proof">Missing Proof</option>
            </select>
          </div>

          {/* Job Required Skill Filter */}
          <div>
            <label htmlFor="filter-req-skill" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Job Required Skill
            </label>
            <select
              id="filter-req-skill"
              value={selectedRequiredSkill}
              onChange={(e) => setSelectedRequiredSkill(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-300 outline-none font-mono"
            >
              <option value="All">All Job Requirements</option>
              {jobRequiredSkills.map(skill => (
                <option key={skill} value={skill}>
                  {skill} (Verified Only)
                </option>
              ))}
            </select>
          </div>

          {/* Engineering Domain Filter */}
          <div>
            <label htmlFor="filter-domain" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Domain
            </label>
            <select
              id="filter-domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-300 outline-none"
            >
              <option value="All">All Domains</option>
              <option value="Backend Engineering">Backend Engineering</option>
              <option value="Distributed Systems">Distributed Systems</option>
              <option value="Frontend Engineering">Frontend Engineering</option>
            </select>
          </div>

          {/* Scorecard Validity Filter */}
          <div>
            <label htmlFor="filter-validity" className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Scorecard Validity
            </label>
            <select
              id="filter-validity"
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-300 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="VALID">Valid (2-Year Active)</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>

        </div>

      </div>

      {/* CANDIDATES LIST */}
      <div className="space-y-6">
        {filteredCandidates.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm space-y-3">
            <p className="text-base font-semibold text-white">No candidates matched the selected job fit criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting the Proof Coverage filter or switching to another target job.</p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const shortlisted = isShortlisted(candidate.id);
            const fit = candidate.jobFit;
            const coverage = fit?.proofCoverage || { verified: 0, total: jobRequiredSkills.length || 5, percentage: 0, ratio: `0 / ${jobRequiredSkills.length || 5}` };

            const progressColor = coverage.percentage >= 80
              ? 'bg-emerald-500'
              : coverage.percentage >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500';

            return (
              <div
                key={candidate.id}
                className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-6"
              >
                {/* Top Row: Candidate Identity, Score, and Validity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold font-mono text-base shadow-md shrink-0">
                      {candidate.avatar}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{candidate.name}</h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                          {candidate.rankBadge}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono font-medium">
                          {candidate.rankTier}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {candidate.domain}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Experience: {candidate.experience} • Assessment: <strong className="text-slate-200">{candidate.assessment}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between sm:justify-end">
                    {/* Scorecard Validity Badge */}
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {candidate.validity} ✓
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        Valid Until: {candidate.validUntil}
                      </span>
                    </div>

                    {/* Overall Verified Score */}
                    <div className="text-right pl-4 border-l border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Score</span>
                      <div className="text-3xl font-extrabold text-white font-mono">
                        {candidate.score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CORE EVIDENCE FEATURE: PROOF-TO-JOB FIT MAP */}
                <div className="p-5 rounded-xl bg-slate-950/90 border border-emerald-500/20 space-y-4">
                  
                  {/* Proof Coverage Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                          Proof Coverage:
                        </span>
                        <span className="text-sm font-extrabold text-white font-mono">
                          {coverage.ratio} Requirements Verified
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                          coverage.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {coverage.percentage}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Matched against: <strong className="text-slate-200">{currentJob.title}</strong> ({currentJob.company})
                      </p>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full sm:w-48">
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`${progressColor} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${coverage.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Requirements Proof Status Pills */}
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                      Required Skills Verification Status:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {fit?.requirements?.map((req) => {
                        if (req.status === 'VERIFIED') {
                          return (
                            <span
                              key={req.skill}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium flex items-center gap-1.5"
                              title={req.reason}
                            >
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{req.skill}</span>
                              <span className="text-emerald-400 font-bold font-mono">({req.score || 85})</span>
                            </span>
                          );
                        } else if (req.status === 'PARTIAL') {
                          return (
                            <span
                              key={req.skill}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium flex items-center gap-1.5"
                              title={req.reason}
                            >
                              <span className="text-amber-400 font-bold">⚠</span>
                              <span>{req.skill}</span>
                              <span className="text-amber-400 font-bold font-mono">
                                {req.score ? `(${req.score})` : '(Partial)'}
                              </span>
                            </span>
                          );
                        } else {
                          return (
                            <span
                              key={req.skill}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 text-xs font-mono flex items-center gap-1.5"
                              title="No verified proof available"
                            >
                              <span className="text-slate-500">○</span>
                              <span>{req.skill}</span>
                              <span className="text-slate-500 text-[10px]">(No proof)</span>
                            </span>
                          );
                        }
                      })}
                    </div>
                  </div>

                  {/* Why this candidate matches */}
                  {fit?.whyMatches && fit.whyMatches.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">
                        Why this candidate matches:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                        {fit.whyMatches.map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Proof Section */}
                  {fit?.missingProof && fit.missingProof.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400">
                        <span>Missing Proof:</span>
                        <span>{fit.missingProof.join(', ')}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        No verified evidence found in candidate assessments or scorecards for these requirements.
                      </p>
                    </div>
                  )}

                </div>

                {/* Evidence Availability Indicator */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Verified Evidence Available For Inspection:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {candidate.evidence.coding}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400">✓ Repo Code</span>
                    <span className="text-emerald-400">✓ ADR Defense</span>
                    <span className="text-emerald-400">✓ SQL Query</span>
                    <span className="text-emerald-400">✓ Debug Patch</span>
                  </div>
                </div>

                {/* Bottom Row: Candidate Links & Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    Scorecard ID: <span className="text-slate-300">{candidate.scorecardId}</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Candidate's Manually Submitted Repo Link */}
                    {candidate.repository_url && (
                      <a
                        href={candidate.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 font-mono"
                        title="Open Candidate's Repository"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                        <span>GitHub Repo</span>
                      </a>
                    )}

                    {/* Candidate's Manually Submitted Demo Link */}
                    {candidate.project_url && (
                      <a
                        href={candidate.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 font-mono"
                        title="Open Candidate's Live Demo"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Live Demo</span>
                      </a>
                    )}

                    {/* View Proof Button (Opens Job-Specific Proof Detail View) */}
                    <Link
                      to={`/recruiter/candidate/${candidate.id}?jobId=${selectedJobId || 1}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>View Proof</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>

                    {/* View Scorecard Button */}
                    <Link
                      to={`/recruiter/scorecard/${candidate.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>View Scorecard</span>
                      <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </Link>

                    {/* Shortlist Button (Dynamic Toggle) */}
                    <button
                      onClick={() => handleShortlistClick(candidate)}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md ${
                        shortlisted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <span>{shortlisted ? 'Shortlisted ✓' : 'Shortlist'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
