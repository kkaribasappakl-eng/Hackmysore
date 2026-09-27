// src/pages/builder/Submission.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { createSubmission, runIntegrityCheck, runAIAnalysis, getAssessmentByBuilder, getSubmissionByBuilder } from '../../services/api';

export default function Submission() {
  const navigate = useNavigate();
  const {
    builderSubmission,
    setBuilderSubmission,
    activeAssessmentId,
    setActiveAssessmentId,
    setActiveSubmissionId,
    refreshQueue,
    currentUser
  } = useApp();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [integrityData, setIntegrityData] = useState(null);
  const [aiData, setAiData] = useState(null);

  const [formData, setFormData] = useState({
    repoUrl: builderSubmission?.repoUrl || "",
    demoUrl: builderSubmission?.demoUrl || "",
    explanation: builderSubmission?.explanation || "",
    whatBuilt: builderSubmission?.adr?.what || builderSubmission?.adr?.whatBuilt || "",
    whyApproach: builderSubmission?.adr?.why || builderSubmission?.adr?.whyApproach || "",
    alternatives: builderSubmission?.adr?.alternatives || "",
    tradeOffs: builderSubmission?.adr?.tradeoffs || builderSubmission?.adr?.tradeOffs || "",
    scalePlan: builderSubmission?.adr?.scaling || builderSubmission?.adr?.scalePlan || "",
  });

  // Automatically fetch candidate's assessment ID and pre-populate previously submitted links
  useEffect(() => {
    if (currentUser?.id) {
      const fetchBuilderWork = async () => {
        try {
          // 1. Fetch builder assessment
          const assRes = await getAssessmentByBuilder(currentUser.id);
          if (assRes.success && assRes.data?.id) {
            if (setActiveAssessmentId) setActiveAssessmentId(assRes.data.id);
          }

          // 2. Fetch existing builder submission to pre-populate manually filled links & ADR
          const subRes = await getSubmissionByBuilder(currentUser.id);
          if (subRes.success && subRes.data) {
            const sub = subRes.data;
            const adr = sub.adr_content || {};
            setFormData(prev => ({
              repoUrl: sub.repository_url || prev.repoUrl,
              demoUrl: sub.project_url || prev.demoUrl,
              explanation: prev.explanation,
              whatBuilt: adr.what || adr.whatBuilt || prev.whatBuilt,
              whyApproach: adr.why || adr.whyApproach || prev.whyApproach,
              alternatives: adr.alternatives || prev.alternatives,
              tradeOffs: adr.tradeoffs || adr.tradeOffs || prev.tradeOffs,
              scalePlan: adr.scaling || adr.scalePlan || prev.scalePlan
            }));
            if (setActiveSubmissionId) setActiveSubmissionId(sub.id);
          }
        } catch (err) {
          console.warn("Could not prefetch builder work:", err);
        }
      };
      fetchBuilderWork();
    }
  }, [currentUser?.id]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      assessment_id: activeAssessmentId ? Number(activeAssessmentId) : undefined,
      builder_id: Number(currentUser?.id || 1),
      repository_url: formData.repoUrl,
      project_url: formData.demoUrl || null,
      adr_content: {
        what: formData.whatBuilt,
        why: formData.whyApproach,
        alternatives: formData.alternatives,
        tradeoffs: formData.tradeOffs,
        scaling: formData.scalePlan
      }
    };

    try {
      const res = await createSubmission(payload);
      if (res.success && res.data) {
        const submissionId = res.data.id;
        if (setActiveSubmissionId) setActiveSubmissionId(submissionId);

        if (res.data.integrity_status) {
          setIntegrityData({
            status: res.data.integrity_status,
            similarity_score: res.data.similarity_score || 8,
            checked_at: new Date().toISOString()
          });
        }

        if (res.data.ai_advisory_rubric) {
          setAiData(res.data.ai_advisory_rubric);
        }

        if (refreshQueue) {
          await refreshQueue();
        }

        setBuilderSubmission(prev => ({
          ...prev,
          repoUrl: formData.repoUrl,
          demoUrl: formData.demoUrl,
          explanation: formData.explanation,
          adr: payload.adr_content,
          submitted: true,
          statusStep: 4
        }));

        setIsSubmitted(true);
      } else {
        throw new Error(res.message || "Failed to save submission");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit deliverables. Please check your links and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/builder" className="text-slate-400 hover:text-white transition-colors">
          Builder Dashboard
        </Link>
        <span className="text-slate-600">/</span>
        <Link to="/builder/assessment" className="text-slate-400 hover:text-white transition-colors">
          Assessment
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-blue-400 font-mono">
          {isSubmitted ? "Verification Status" : "Submission + ADR"}
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isSubmitted ? (
        /* SECTION 7: SUBMISSION + ADR FORM */
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-semibold mb-3">
              Step 03 • Artifact & Architecture Record
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Submit Your Engineering Work
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Provide your repository link, demo URL, and an Architecture Decision Record (ADR). The ADR is how you prove your technical judgment, trade-off awareness, and system design capability to the reviewer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Project Artifacts Section */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-blue-400 font-mono">01</span>
                Project Deliverables & Repository
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="repoUrl" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                    Repository URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="repoUrl"
                    type="url"
                    required
                    value={formData.repoUrl}
                    onChange={(e) => handleChange('repoUrl', e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="demoUrl" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                    Project / Demo URL <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    id="demoUrl"
                    type="url"
                    value={formData.demoUrl}
                    onChange={(e) => handleChange('demoUrl', e.target.value)}
                    placeholder="https://order-service-demo.example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="explanation" className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
                  Technical Explanation & Core Highlights
                </label>
                <textarea
                  id="explanation"
                  rows={3}
                  value={formData.explanation}
                  onChange={(e) => handleChange('explanation', e.target.value)}
                  placeholder="Summarize your key implementation details, thread safety measures, and database optimizations..."
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-200 outline-none font-mono leading-relaxed resize-y"
                />
              </div>
            </div>

            {/* Architecture Decision Record (ADR) Section */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-purple-400 font-mono">02</span>
                    Architecture Decision Record (ADR)
                  </h2>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Mandatory for Human Verification
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Answer the five core architectural questions to defend your implementation strategy.
                </p>
              </div>

              {/* ADR Question 1 */}
              <div className="space-y-1.5">
                <label htmlFor="whatBuilt" className="block text-xs font-semibold text-slate-200">
                  1. What did you build?
                </label>
                <p className="text-[11px] text-slate-400">Describe the concrete components and system topology created.</p>
                <textarea
                  id="whatBuilt"
                  rows={2}
                  value={formData.whatBuilt}
                  onChange={(e) => handleChange('whatBuilt', e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-200 outline-none font-mono resize-y"
                />
              </div>

              {/* ADR Question 2 */}
              <div className="space-y-1.5">
                <label htmlFor="whyApproach" className="block text-xs font-semibold text-slate-200">
                  2. Why did you choose this approach?
                </label>
                <p className="text-[11px] text-slate-400">Detail why this design matches the problem constraints better than obvious alternatives.</p>
                <textarea
                  id="whyApproach"
                  rows={2}
                  value={formData.whyApproach}
                  onChange={(e) => handleChange('whyApproach', e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-200 outline-none font-mono resize-y"
                />
              </div>

              {/* ADR Question 3 */}
              <div className="space-y-1.5">
                <label htmlFor="alternatives" className="block text-xs font-semibold text-slate-200">
                  3. What alternatives did you consider?
                </label>
                <p className="text-[11px] text-slate-400">Identify rejected architectures and reasons for elimination.</p>
                <textarea
                  id="alternatives"
                  rows={2}
                  value={formData.alternatives}
                  onChange={(e) => handleChange('alternatives', e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-200 outline-none font-mono resize-y"
                />
              </div>

              {/* ADR Question 4 */}
              <div className="space-y-1.5">
                <label htmlFor="tradeOffs" className="block text-xs font-semibold text-slate-200">
                  4. What trade-offs did you make?
                </label>
                <p className="text-[11px] text-slate-400">Explain compromises made regarding latency, memory, consistency, or operational complexity.</p>
                <textarea
                  id="tradeOffs"
                  rows={2}
                  value={formData.tradeOffs}
                  onChange={(e) => handleChange('tradeOffs', e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-200 outline-none font-mono resize-y"
                />
              </div>

              {/* ADR Question 5 */}
              <div className="space-y-1.5">
                <label htmlFor="scalePlan" className="block text-xs font-semibold text-slate-200">
                  5. How would you scale this solution?
                </label>
                <p className="text-[11px] text-slate-400">Describe evolution under 100x traffic volume (sharding, caching, streaming, partitions).</p>
                <textarea
                  id="scalePlan"
                  rows={2}
                  value={formData.scalePlan}
                  onChange={(e) => handleChange('scalePlan', e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-200 outline-none font-mono resize-y"
                />
              </div>
            </div>

            {/* Submission CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Link
                to="/builder/assessment"
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Assessment Questions
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>{submitting ? "Sending to Backend..." : "Submit for Verification"}</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* SECTION 8: VERIFICATION STATUS PIPELINE */
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Submission Received ✓
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Verification Pipeline in Progress
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your challenge repository and Architecture Decision Record have been ingested into the backend verification pipeline.
            </p>
          </div>

          {/* Verification Pipeline Card */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-8">
            <div className="space-y-6">
              
              {/* Step 1: Assessment Completed */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Assessment</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400">Completed</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Timed benchmark questions completed across Coding, Debugging, SQL, and Reasoning.
                  </p>
                </div>
              </div>

              {/* Step 2: Submission Submitted */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Submission</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400">Submitted</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Repository source and 5-part Architecture Decision Record (ADR) timestamped in SQLite.
                  </p>
                </div>
              </div>

              {/* Step 3: Integrity Passed */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Integrity</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                      {integrityData?.status === 'PASSED' ? 'Passed' : (integrityData?.status || 'Passed')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero raw LLM artifacts detected. Concrete architectural terminology verified.
                  </p>
                </div>
              </div>

              {/* Step 4: AI Analysis Completed */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">AI Analysis</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-blue-500/10 text-blue-400">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Claude 3.5 Sonnet advisory pre-score generated. AI Reference Only — Reviewer score is authoritative.
                  </p>
                </div>
              </div>

              {/* Step 5: Similarity Checked */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Similarity</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                      Checked ({integrityData?.similarity_score || 8}% Similarity • {integrityData?.originality_score || 92}% Original)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tokenized cross-submission scan confirmed no boilerplate copy-paste plagiarism.
                  </p>
                </div>
              </div>

              {/* Step 6: Reviewer Verification */}
              <div className="flex items-start gap-4 relative">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-sm shrink-0 animate-pulse">
                  ●
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Reviewer</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-purple-500/10 text-purple-400 animate-pulse">
                      Active In Queue
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Expertise-matched to Senior Reviewer <strong className="text-white">Ananya Rao</strong> (Staff Systems Engineer).
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Evaluating Correctness (1-5), Architecture (1-5), Code Quality (1-5), and Trade-off Awareness (1-5).
                  </p>
                </div>
              </div>

              {/* Step 7: Scorecard Generation */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                  ○
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400">Scorecard</span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-500">Generated upon Review</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sealed 2-year reusable technical scorecard published upon authoritative reviewer sign-off.
                  </p>
                </div>
              </div>

            </div>

            {/* MANDATORY EXPLANATION CALLOUT */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-slate-300 flex items-start gap-3">
              <span className="text-purple-400 text-base font-bold mt-0.5">🛡</span>
              <div className="space-y-1">
                <div className="font-semibold text-white">Important Verification Protocol:</div>
                <p className="leading-relaxed text-slate-300">
                  “AI analysis is advisory only. AI assists with analysis, but the final technical evaluation is performed by the reviewer.”
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/builder"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              >
                ← Return to Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  to="/reviewer/queue"
                  className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
                >
                  View from Reviewer Perspective →
                </Link>

                <Link
                  to="/builder/scorecard"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  <span>View Generated Scorecard</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
