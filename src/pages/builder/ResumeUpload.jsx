// src/pages/builder/ResumeUpload.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getResumeSamples, getBuilderResume } from '../../services/api';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { currentUser, submitResume, setActiveAssessmentId } = useApp();

  const [filename, setFilename] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [samples, setSamples] = useState([]);
  const [existingResume, setExistingResume] = useState(null);

  // Load existing resume and samples
  useEffect(() => {
    async function loadData() {
      try {
        const samplesRes = await getResumeSamples();
        if (samplesRes.success && Array.isArray(samplesRes.data)) {
          setSamples(samplesRes.data);
        }

        const bId = currentUser?.id || 1;
        const res = await getBuilderResume(bId);
        if (res.success && res.data) {
          setExistingResume(res.data);
        }
      } catch (e) {
        console.warn('Could not load samples:', e);
      }
    }
    loadData();
  }, [currentUser]);

  const handleUseSample = (sample) => {
    setFilename(sample.filename);
    setResumeText(sample.sampleText);
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilename(file.name);
      // Read text content
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target?.result || '');
      };
      reader.readAsText(file);
    }
  };

  const handleExtractAndMatch = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError('Please provide your resume text or select a sample resume.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await submitResume({
        builder_id: currentUser?.id || 1,
        filename: filename || 'my_resume.pdf',
        resume_text: resumeText
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
        if (res.data.assessment_id) {
          setActiveAssessmentId(res.data.assessment_id);
        }
      } else {
        setError(res.message || 'Failed to extract skills from resume.');
      }
    } catch (err) {
      setError('An error occurred during resume processing.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Step 1: Skill Extraction & Assessment Tailoring</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Resume-Based Practical Assessment
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Upload your resume to extract engineering competencies. SignalCraft automatically tailors a medium-level practical challenge to prove your claimed skills.
        </p>
      </div>

      {/* SAMPLE RESUME SELECTORS */}
      {samples.length > 0 && (
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Instant Demo Options (Click to load sample candidate profile)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleUseSample(s)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  filename === s.filename
                    ? 'bg-blue-950/50 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="font-semibold text-sm text-white mb-1 flex items-center justify-between">
                  <span>{s.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400">
                    {s.domain}
                  </span>
                </div>
                <div className="text-xs text-slate-400 line-clamp-2 font-mono">
                  {s.sampleText.slice(0, 140)}...
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* UPLOAD FORM */}
      <form onSubmit={handleExtractAndMatch} className="bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Upload Resume File (.pdf, .txt, .docx)
          </label>
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-6 text-center transition-all bg-slate-950/40">
            <svg className="w-10 h-10 text-slate-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-sm font-medium text-slate-200">
              {filename ? (
                <span className="text-blue-400 font-mono font-semibold">{filename}</span>
              ) : (
                <span>Choose a file or drag and drop</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">PDF or text format up to 5MB</p>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
              className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Resume Content Textarea */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Resume Content / Claims Text
          </label>
          <textarea
            rows={7}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here (technical skills, work history, projects)..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isAnalyzing}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Analyzing Competencies & Tailoring Challenge...</span>
            </>
          ) : (
            <>
              <span>Extract Skills & Generate Practical Assessment</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* ANALYSIS & MATCHED CHALLENGE RESULT */}
      {analysisResult && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-6 sm:p-8 rounded-2xl border border-blue-500/40 shadow-2xl space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Competency Profile Extracted
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Domain: {analysisResult.domain}
              </h2>
              <p className="text-xs text-slate-400">
                Estimated Experience: {analysisResult.experience_years} Years • File: {analysisResult.filename}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-xs">
              {analysisResult.extracted_skills.length} Technical Skills Detected
            </div>
          </div>

          {/* Extracted Skills Pills with Confidence */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Extracted Engineering Skills & Confidence
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {analysisResult.extracted_skills.map((skill) => {
                const conf = analysisResult.confidence_scores?.[skill] || 90;
                return (
                  <div
                    key={skill}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-200">{skill}</span>
                    <span className="text-[11px] font-mono text-blue-400 font-semibold">{conf}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tailored Medium-Level Assessment Card */}
          <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-blue-400 font-bold">
                Tailored Medium-Level Practical Challenge
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                {analysisResult.matched_challenge?.difficulty || 'Intermediate'}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                {analysisResult.matched_challenge?.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Challenge is calibrated to assess {analysisResult.extracted_skills.slice(0, 4).join(', ')} under realistic production conditions.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Format: 45-Minute Timed Assessment + Code & ADR Submission</span>
              </div>

              <button
                onClick={() => navigate('/builder/assessment')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <span>Start Practical Assessment</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* EXISTING RESUME ON FILE */}
      {!analysisResult && existingResume && (
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Existing Resume on File
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {existingResume.filename || 'Rahul_Sharma_Resume.pdf'} • {existingResume.domain}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {existingResume.extracted_skills?.slice(0, 6).map((skill) => (
                <span key={skill} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/builder/assessment"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            Continue to Assessment →
          </Link>
        </div>
      )}

    </div>
  );
}
