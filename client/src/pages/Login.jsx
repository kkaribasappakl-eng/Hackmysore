// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();

  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || '';
  const isRegisteredParam = queryParams.get('registered') === 'true';
  const redirectParam = queryParams.get('redirect');

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(
    isRegisteredParam ? 'Account created successfully in database! Please sign in with your credentials.' : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim().toLowerCase(), password);

      if (!res.success) {
        setError(res.message || 'Invalid email or password.');
        setLoading(false);
      } else {
        // Read user role directly from database response and route to their protected dashboard
        const role = (res.user?.role || '').toUpperCase();

        if (redirectParam) {
          navigate(redirectParam);
        } else if (role === 'BUILDER') {
          navigate('/builder');
        } else if (role === 'REVIEWER') {
          navigate('/reviewer');
        } else if (role === 'RECRUITER') {
          navigate('/recruiter');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError('An error occurred during sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Step 2 of 2: Authenticate & Access Protected Dashboard</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Sign In to SignalCraft
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Enter your registered email and password. Your role will be verified against the database to grant access to your dashboard.
          </p>
        </div>

        {/* REGISTRATION SUCCESS NOTICE */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <svg className="w-4 h-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

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
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/70 p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Verifying Credentials & Role...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          {/* REGISTER LINK */}
          <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Don't have an account yet? </span>
            <Link to="/register" className="text-blue-400 hover:underline font-semibold">
              Register Here →
            </Link>
          </div>

        </form>

        {/* ROLE REGISTRATION SHORTCUTS */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 text-center space-y-2">
          <div className="font-semibold text-slate-300">Register as a new user:</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/register?role=BUILDER"
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              + Builder Account
            </Link>
            <Link
              to="/register?role=REVIEWER"
              className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
            >
              + Reviewer Account
            </Link>
            <Link
              to="/register?role=RECRUITER"
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              + Recruiter Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
