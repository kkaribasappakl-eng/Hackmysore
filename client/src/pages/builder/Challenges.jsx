// src/pages/builder/Challenges.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getChallenges } from '../../services/api';

export default function Challenges() {
  const { challenges: fallbackChallenges } = useApp();
  const [challenges, setChallenges] = useState(fallbackChallenges);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getChallenges();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setChallenges(res.data);
      } else {
        setChallenges(fallbackChallenges);
      }
    } catch (err) {
      setError('Unable to load challenges.');
      setChallenges(fallbackChallenges);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link to="/builder" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Builder Dashboard
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-blue-400 font-mono">Challenges</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">
          Engineering Challenges
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Practical, prerequisite-driven engineering scenarios designed to evaluate coding correctness, debugging precision, SQL performance, and architectural trade-off defense.
        </p>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchChallenges}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prerequisite Flow Notice */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-3">
        <span className="text-blue-400 text-base">ℹ</span>
        <div>
          <span className="font-semibold text-white">Prerequisite-Based Progression: </span>
          SignalCraft unlocks advanced architectural & incident-debugging challenges only after verifying fundamental REST API and relational database capabilities.
        </div>
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-sm">
          Loading challenges from backend...
        </div>
      ) : (
        /* Challenge Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => {
            const isLocked = challenge.status === 'Locked' || challenge.difficulty === 'Advanced';
            const challengeId = challenge.id;
            
            return (
              <div
                key={challengeId}
                className={`rounded-2xl border flex flex-col justify-between p-6 transition-all ${
                  isLocked
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5'
                }`}
              >
                <div>
                  {/* Badges: Difficulty & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-medium ${
                      challenge.difficulty === 'Intermediate'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {challenge.difficulty}
                    </span>

                    <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 ${
                      isLocked
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isLocked ? (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Locked
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Available
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {challenge.title}
                  </h2>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {challenge.description || challenge.summary}
                  </p>

                  {/* Skills Assessed */}
                  <div className="mt-4">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                      Skills Assessed:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(challenge.skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Prerequisites */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Prerequisites:
                    </span>
                    <div className="space-y-1">
                      {(challenge.prerequisites || ['Java Basics', 'REST Fundamentals']).map((prereq, idx) => (
                        <div key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className={isLocked ? "text-amber-400" : "text-blue-400"}>•</span>
                          <span>{prereq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-800/60">
                  {isLocked ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800/50 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-800 flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Prerequisite Required
                    </button>
                  ) : (
                    <Link
                      to={`/builder/challenges/${challengeId}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium text-center shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>View Challenge</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
