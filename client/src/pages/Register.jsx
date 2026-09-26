// client/src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useApp();

  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: (initialRole && ['BUILDER', 'REVIEWER', 'RECRUITER'].includes(initialRole.toUpperCase()))
      ? initialRole.toUpperCase()
      : 'BUILDER'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roleOptions = [
    {
      role: 'BUILDER',
      title: 'Builder',
      badge: 'Student / Engineer',
      description: 'Upload resume, receive tailored practical challenges, submit code & ADR, earn 2-year scorecard.',
      color: 'blue'
    },
    {
      role: 'REVIEWER',
      title: 'Reviewer',
      badge: 'Peer / Senior Engineer',
      description: 'Review assigned submissions, evaluate 4 rubric pillars, authoritative scoring.',
      color: 'purple'
    },
    {
      role: 'RECRUITER',
      title: 'Recruiter',
      badge: 'Hiring Manager',
      description: 'Create job opportunities, search verified builders by real proof trails, shortlist.',
      color: 'emerald'
    }
  ];


  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!formData.name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      });

      if (!res.success) {
        setError(res.message || 'Registration failed.');
        setLoading(false);
      } else {
        // Redirect to Login page with registered state & email prefilled
        navigate(`/login?email=${encodeURIComponent(formData.email.trim())}&registered=true`);
      }
    } catch (err) {
      setError('An error occurred during account creation.');
      setLoading(false);
    }
  };

  const selectedRoleMeta = roleOptions.find(r => r.role === formData.role) || roleOptions[0];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      
      {/* Background glow tailored to selected role */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[380px] blur-[140px] rounded-full pointer-events-none transition-all duration-700 ${
          formData.role === 'BUILDER'
            ? 'bg-blue-600/15'
            : formData.role === 'REVIEWER'
            ? 'bg-purple-600/15'
            : 'bg-emerald-600/15'
        }`}
      />

      <div className="max-w-xl w-full space-y-6 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Step 1 of 2: Create Account in SignalCraft Database</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Register New Account
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Choose your role to get started. After registration, sign in to access your designated dashboard.
          </p>
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

        {/* FORM */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5 bg-slate-900/70 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          
          {/* STEP A: ROLE SELECTION */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Your Role (Determines Your Dashboard Access)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {roleOptions.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleChange('role', opt.role)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    formData.role === opt.role
                      ? opt.role === 'BUILDER'
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-md shadow-blue-500/20'
                        : opt.role === 'REVIEWER'
                        ? 'bg-purple-950/60 border-purple-500 text-white shadow-md shadow-purple-500/20'
                        : 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{opt.title}</span>
                      {formData.role === opt.role && (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{opt.badge}</div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP B: NAME & EMAIL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="new_reg_name"
                autoComplete="off"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Nayana Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="new_reg_email"
                autoComplete="off"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. nayana@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* STEP D: PASSWORD & CONFIRM PASSWORD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password (min 6 chars)
              </label>
              <input
                type="password"
                name="new_reg_pass"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Create password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="new_reg_pass_confirm"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
              formData.role === 'BUILDER'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                : formData.role === 'REVIEWER'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
            } disabled:opacity-50`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Registering Account in Database...</span>
              </>
            ) : (
              <>
                <span>Complete Registration as {selectedRoleMeta.title}</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>

          {/* FOOTER LINK */}
          <div className="pt-2 text-center text-xs text-slate-400">
            <span>Already have a registered account? </span>
            <Link to="/login" className="text-blue-400 hover:underline font-semibold">
              Sign In Here →
            </Link>
          </div>

        </form>

      </div>
    </div>
  );
}
