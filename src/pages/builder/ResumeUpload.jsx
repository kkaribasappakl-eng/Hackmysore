// src/pages/builder/ResumeUpload.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getResumeSamples, getBuilderResume } from '../../services/api';

/**
 * Intelligent helper to extract human-readable text tokens from PDF or binary content
 */
function extractReadableTextFromBinary(raw, filename = '') {
  if (!raw) return '';
  
  // 1. Extract parenthesized text tokens in PDF like (Hello World)
  const cleanTokens = [];
  const parenMatches = raw.match(/\(([^)]{2,100})\)/g);
  if (parenMatches && parenMatches.length > 3) {
    parenMatches.forEach(m => {
      const cleaned = m.slice(1, -1).trim();
      if (cleaned.length >= 2 && !/[\x00-\x08\x0E-\x1F]/.test(cleaned)) {
        cleanTokens.push(cleaned);
      }
    });
  }

  // 2. Extract technical skill words from raw text
  const knownKeywords = [
    'react', 'javascript', 'typescript', 'python', 'java', 'sql', 'fastapi',
    'django', 'flask', 'node', 'express', 'nextjs', 'tailwind', 'redux', 'css',
    'html', 'docker', 'kubernetes', 'postgres', 'postgresql', 'mysql', 'mongodb',
    'kafka', 'redis', 'rest', 'api', 'microservices', 'debugging', 'concurrency',
    'engineer', 'developer', 'frontend', 'backend', 'fullstack', 'software',
    'experience', 'projects', 'education', 'skills', 'architecture', 'systems',
    'pandas', 'numpy', 'pytorch', 'machine learning', 'cloud', 'aws', 'git'
  ];

  const wordMatches = raw.match(/[A-Za-z0-9+#./-]{3,30}/g) || [];
  const matchedKeywords = new Set();
  wordMatches.forEach(w => {
    const lw = w.toLowerCase();
    if (knownKeywords.some(k => lw.includes(k) || k.includes(lw))) {
      matchedKeywords.add(w);
    }
  });

  // 3. Extract readable lines
  const printableLines = raw
    .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line.length >= 10 && (line.match(/[A-Za-z]/g) || []).length / line.length > 0.6);

  let synthesized = '';
  if (cleanTokens.length > 0) {
    synthesized += cleanTokens.slice(0, 100).join(' ') + '\n\n';
  }
  if (printableLines.length > 0) {
    synthesized += printableLines.slice(0, 30).join('\n') + '\n\n';
  }
  if (matchedKeywords.size > 0) {
    synthesized += 'Technical Skills & Core Competencies: ' + Array.from(matchedKeywords).join(', ');
  }

  return synthesized.trim() || `Candidate Technical Resume: ${filename}\nClaimed Skills: ${Array.from(matchedKeywords).join(', ') || 'Software Engineering, Problem Solving, REST API'}`;
}

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { currentUser, submitResume, setActiveAssessmentId } = useApp();

  const [filename, setFilename] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [existingResume, setExistingResume] = useState(null);

  // Load existing resume and samples
  useEffect(() => {
    async function loadData() {
      try {
        const samplesRes = await getResumeSamples();
        if (samplesRes.success && Array.isArray(samplesRes.data)) {
          setSamples(samplesRes.data);
        }

        if (currentUser?.id) {
          const res = await getBuilderResume(currentUser.id);
          if (res.success && res.data) {
            setExistingResume(res.data);
          }
        }
      } catch (e) {
        console.warn('Could not load samples:', e);
      }
    }
    loadData();
  }, [currentUser]);

  const handleUseSample = (sample) => {
    setSelectedSampleId(sample.id);
    setFilename(sample.filename);
    setResumeText(sample.sampleText);
    setError(null);
    setAnalysisResult(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedSampleId(null);
      setFilename(file.name);
      setAnalysisResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const rawContent = event.target?.result || '';
        if (file.name.toLowerCase().endsWith('.pdf') || rawContent.startsWith('%PDF')) {
          const cleanText = extractReadableTextFromBinary(rawContent, file.name);
          setResumeText(cleanText);
        } else {
          setResumeText(rawContent);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExtractAndMatch = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError('Please provide your resume text, upload a file, or select a sample resume.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await submitResume({
        builder_id: currentUser?.id,
        filename: filename || 'my_resume.pdf',
        resume_text: resumeText
      });

      if (res.success && res.data) {
        setAnalysisResult(res.data);
        setExistingResume(res.data);
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
          Upload any engineering resume or choose a preset below. SignalCraft extracts claimed skills across Frontend, Backend, Python/Data, and Systems, tailoring a medium-level challenge to prove your capabilities.
        </p>
      </div>

      {/* EXISTING RESUME ON FILE */}
      {existingResume && !analysisResult && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Current Resume on File</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {existingResume.filename || 'resume.pdf'} • <span className="text-blue-400">{existingResume.domain || 'Engineering'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(existingResume.extracted_skills || []).slice(0, 6).map((skill) => (
                <span key={skill} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFilename('');
                setResumeText('');
                setSelectedSampleId(null);
                setAnalysisResult(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
            >
              Switch / Upload Different Resume
            </button>
            <Link
              to="/builder/assessment"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <span>Continue to Assessment</span>
              <span>→</span>
            </Link>
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

        {/* PRESET SAMPLES SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Or Choose a Verified Engineering Resume Preset
            </label>
            <span className="text-[11px] text-blue-400 font-mono">
              Instant 1-Click Role Calibration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {samples.map((sample) => {
              const isSelected = selectedSampleId === sample.id || filename === sample.filename;
              const icons = {
                'sample-backend': '☕',
                'sample-frontend': '⚛️',
                'sample-python': '🐍',
                'sample-fullstack': '🌐'
              };
              const icon = icons[sample.id] || '📄';

              return (
                <button
                  type="button"
                  key={sample.id}
                  onClick={() => handleUseSample(sample)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xl">{icon}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                        isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {sample.domain.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white leading-tight">
                      {sample.title}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-[120px]">
                      {sample.filename}
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      isSelected ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {isSelected ? '✓ Loaded' : 'Select →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Upload Any Custom Resume (.pdf, .txt, .docx)
          </label>
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-6 text-center transition-all bg-slate-950/40">
            <svg className="w-10 h-10 text-slate-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-sm font-medium text-slate-200">
              {filename ? (
                <span className="text-blue-400 font-mono font-semibold">{filename}</span>
              ) : (
                <span>Choose any resume file or drag and drop</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or text format up to 5MB</p>
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resume Content / Extracted Claims Text
            </label>
            <span className="text-[11px] text-slate-500">
              Editable • Add or adjust any technical keywords
            </span>
          </div>
          <textarea
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste or edit your resume text here (technical skills, work history, projects)..."
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
                Tailored Practical Challenge
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

    </div>
  );
}
