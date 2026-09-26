// src/pages/recruiter/CreateJob.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function CreateJob() {
  const navigate = useNavigate();
  const { addJob, companyData } = useApp();

  const [formData, setFormData] = useState({
    title: "Backend Developer",
    company: companyData.company,
    description: "Looking for an engineer to architect high-throughput transactional APIs, implement resilient locking mechanisms, and maintain data consistency across distributed services.",
    skillsInput: "Java, SQL, REST API, Spring Boot",
    experience: "2-4 years",
    difficulty: "Intermediate",
    location: "Bengaluru / Hybrid"
  });

  const [createdJob, setCreatedJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const skillsArray = formData.skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const newJob = await addJob({
        title: formData.title,
        company: formData.company,
        description: formData.description,
        skills: skillsArray,
        experience: formData.experience,
        difficulty: formData.difficulty,
        location: formData.location
      });

      setCreatedJob(newJob || {
        title: formData.title,
        company: formData.company,
        experience: formData.experience,
        difficulty: formData.difficulty,
        matchedCandidatesCount: 12
      });
    } catch (err) {
      console.error("Failed to create job:", err);
      setError("Unable to create job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/recruiter" className="text-slate-400 hover:text-white transition-colors">
          Recruiter Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-emerald-400 font-mono">Create Job</span>
      </div>

      {!createdJob ? (
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold mb-2">
              Role Specification
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Create Engineering Requirement
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Define required skills and difficulty. SignalCraft automatically maps your requirements to standardized practical verification challenges.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="job-title" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                  Job Title <span className="text-rose-400">*</span>
                </label>
                <input
                  id="job-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-200 outline-none"
                  placeholder="e.g. Backend Developer"
                />
              </div>

              <div>
                <label htmlFor="company-name" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                  Company
                </label>
                <input
                  id="company-name"
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="job-desc" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                Job Description
              </label>
              <textarea
                id="job-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-200 outline-none leading-relaxed resize-y"
                placeholder="Briefly describe the engineering mission..."
              />
            </div>

            <div>
              <label htmlFor="skills-input" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                Required Technical Skills <span className="text-slate-500">(Comma separated)</span>
              </label>
              <input
                id="skills-input"
                type="text"
                required
                value={formData.skillsInput}
                onChange={(e) => setFormData(prev => ({ ...prev, skillsInput: e.target.value }))}
                placeholder="Java, SQL, REST API, Spring Boot"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-200 outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                SignalCraft tests and verifies these skills directly with code evidence.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="exp-select" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                  Experience Level
                </label>
                <select
                  id="exp-select"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 outline-none"
                >
                  <option value="1-3 years">1-3 years (Junior / Mid)</option>
                  <option value="2-4 years">2-4 years (Mid)</option>
                  <option value="4-7 years">4-7 years (Senior)</option>
                  <option value="7+ years">7+ years (Staff / Lead)</option>
                </select>
              </div>

              <div>
                <label htmlFor="diff-select" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                  Challenge Difficulty
                </label>
                <select
                  id="diff-select"
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 outline-none"
                >
                  <option value="Beginner">Beginner (Foundations)</option>
                  <option value="Intermediate">Intermediate (Production REST)</option>
                  <option value="Advanced">Advanced (High Scale & Concurrency)</option>
                </select>
              </div>

              <div>
                <label htmlFor="loc-input" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                  Location / Mode
                </label>
                <input
                  id="loc-input"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <Link
                to="/recruiter"
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2 ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <span>{submitting ? 'Creating Job...' : 'Create Role'}</span>
                {!submitting && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* CONFIRMATION STATE WITH REQUIRED MESSAGE */
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-emerald-500/30 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl font-bold">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              Role Successfully Published ✓
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {createdJob.title}
            </h2>
            <p className="text-xs text-slate-400">
              {createdJob.company} • {createdJob.experience} • {createdJob.difficulty}
            </p>
          </div>

          {/* REQUIRED MESSAGE FROM PROMPT */}
          <div className="max-w-xl mx-auto p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-left text-xs text-slate-200 flex items-start gap-3">
            <span className="text-emerald-400 text-base font-bold">⚡</span>
            <div>
              <span className="font-bold text-white block text-sm mb-1">Challenge Mapping Protocol:</span>
              <p className="leading-relaxed text-emerald-200">
                “SignalCraft will map required skills to suitable technical challenges.”
              </p>
              <p className="text-slate-400 mt-2 text-[11px]">
                Matched against: <strong>Backend Order Management API</strong> & <strong>Production API Debugging</strong>.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/recruiter/candidates"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <span>Discover Matching Candidates ({createdJob.matchedCandidatesCount})</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              to="/recruiter"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
            >
              Back to Recruiter Dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
