// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickDemoLogin, currentUser } = useApp();

  // Parse URL query params (?role=BUILDER & redirect=...)
  const queryParams = new URLSearchParams(location.search);
  const initialRoleParam = queryParams.get('role');
  const redirectParam = queryParams.get('redirect');

  // Role tab state: 'BUILDER' | 'REVIEWER' | 'RECRUITER'
  const [selectedRole, setSelectedRole] = useState(() => {
    if (initialRoleParam) {
      const upper = initialRoleParam.toUpperCase();
      if (['BUILDER', 'REVIEWER', 'RECRUITER'].includes(upper)) return upper;
    }
    return 'BUILDER';
  });

  // Credential presets
  const rolePresets = {
    BUILDER: {
      email: 'rahul@example.com',
      password: 'password123',
      name: 'Rahul Sharma',
      badge: 'Builder Persona',
      color: 'blue',
      description: 'Upload resume, receive skill-matched practical assessment, submit code/ADR evidence, and earn 2-year verified scorecard.'
    },
    REVIEWER: {
      email: 'ananya@example.com',
      password: 'password123',
      name: 'Ananya Rao',
      badge: 'Reviewer Persona',
      color: 'purple',
      description: 'Review assigned candidate code & ADR, evaluate 4 rubric pillars, use AI as advisory only, and provide authoritative human scoring.'
    },
    RECRUITER: {
      email: 'meera@technova.example',
      password: 'password123',
      name: 'Meera Kapoor',
      badge: 'Recruiter Persona',
      color: 'emerald',
      description: 'Post job requirements, search candidates by verified skills, inspect complete proof trails & scorecards, and shortlist top talent.'
    }
  };

  const [email, setEmail] = useState(rolePresets[selectedRole].email);
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated and matches, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      const role = currentUser.role.toUpperCase();
      if (redirectParam) {
        navigate(redirectParam);
      } else if (role === 'BUILDER') {
        navigate('/builder');
      } else if (role === 'REVIEWER') {
        navigate('/reviewer');
      } else if (role === 'RECRUITER') {
        navigate('/recruiter');
      }
    }
  }, [currentUser, navigate, redirectParam]);

  // When switching tabs, auto-fill standard demo email for that role
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setEmail(rolePresets[role].email);
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password, selectedRole);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
    } else {
      // Navigate to destination
      if (redirectParam) {
        navigate(redirectParam);
      } else if (res.user.role === 'BUILDER') {
        navigate('/builder');
      } else if (res.user.role === 'REVIEWER') {
        navigate('/reviewer');
      } else if (res.user.role === 'RECRUITER') {
        navigate('/recruiter');
      }
    }
  };

  const handleQuickDemoLogin = async (role) => {
    setLoading(true);
    setError(null);
    const res = await quickDemoLogin(role);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
    } else {
      if (redirectParam) {
        navigate(redirectParam);
      } else if (role === 'BUILDER') {
        navigate('/builder');
      } else if (role === 'REVIEWER') {
        navigate('/reviewer');
      } else if (role === 'RECRUITER') {
        navigate('/recruiter');
      }
    }
  };

  const currentPreset = rolePresets[selectedRole];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      
      {/* Background ambient lighting tailored to role */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] blur-[140px] rounded-full pointer-events-none transition-all duration-700 ${
          selectedRole === 'BUILDER'
            ? 'bg-blue-600/15'
            : selectedRole === 'REVIEWER'
            ? 'bg-purple-600/15'
            : 'bg-emerald-600/15'
        }`}
      />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Role-Based Access Control • Cryptographic Verification</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Sign In to SignalCraft
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Choose your designated engineering portal. Dashboards and capabilities are strictly role-isolated.
          </p>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => handleRoleChange('BUILDER')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'BUILDER'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>Builder</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('REVIEWER')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'REVIEWER'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>Reviewer</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('RECRUITER')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'RECRUITER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>Recruiter</span>
          </button>
        </div>

        {/* ROLE INFO CARD */}
        <div
          className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all ${
            selectedRole === 'BUILDER'
              ? 'bg-blue-950/30 border-blue-500/20 text-blue-300'
              : selectedRole === 'REVIEWER'
              ? 'bg-purple-950/30 border-purple-500/20 text-purple-300'
              : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
          }`}
        >
          <div className="font-semibold text-white flex items-center gap-2 mb-1">
            <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
              {currentPreset.badge}
            </span>
            <span>{currentPreset.name}</span>
          </div>
          <p className="text-slate-400">{currentPreset.description}</p>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address ({selectedRole.toLowerCase()} account)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Demo: password123</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
              selectedRole === 'BUILDER'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                : selectedRole === 'REVIEWER'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()} Portal</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          {/* Quick Demo Login (Judges Shortcut) */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemoLogin(selectedRole)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all flex items-center justify-center gap-2 hover:border-slate-600"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>1-Click Demo Login as {currentPreset.name}</span>
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500">
          <span>Need to switch role? </span>
          <button
            type="button"
            onClick={() => handleRoleChange(selectedRole === 'BUILDER' ? 'REVIEWER' : (selectedRole === 'REVIEWER' ? 'RECRUITER' : 'BUILDER'))}
            className="text-blue-400 hover:underline font-medium"
          >
            Switch to next role
          </button>
        </div>

      </div>
    </div>
  );
}
