// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, shortlistCount } = useApp();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const userRole = currentUser?.role?.toUpperCase();

  // Role-specific navigation links
  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { label: 'Home', path: '/' },
        { label: 'Platform Philosophy', path: '/#evidence' }
      ];
    }

    if (userRole === 'BUILDER') {
      return [
        { label: 'Dashboard', path: '/builder' },
        { label: 'Upload Resume', path: '/builder/resume' },
        { label: 'Challenges', path: '/builder/challenges' },
        { label: 'My Scorecard', path: '/builder/scorecard' }
      ];
    }

    if (userRole === 'REVIEWER') {
      return [
        { label: 'Reviewer Dashboard', path: '/reviewer' },
        { label: 'Review Queue', path: '/reviewer/queue' }
      ];
    }

    if (userRole === 'RECRUITER') {
      return [
        { label: 'Recruiter Dashboard', path: '/recruiter' },
        { label: 'Post Job', path: '/recruiter/create-job' },
        { label: 'Candidate Discovery', path: '/recruiter/candidates' },
        { label: 'Scorecards', path: '/recruiter/scorecard' }
      ];
    }

    return [{ label: 'Home', path: '/' }];
  };

  const navLinks = getNavLinks();

  const getRoleBadge = () => {
    if (!currentUser) return null;

    if (userRole === 'BUILDER') {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Builder • {currentUser.name}</span>
        </span>
      );
    }

    if (userRole === 'REVIEWER') {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Reviewer • {currentUser.name}</span>
        </span>
      );
    }

    if (userRole === 'RECRUITER') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Recruiter • {currentUser.name}</span>
          </span>
          {shortlistCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              ★ {shortlistCount} Shortlisted
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SignalCraft
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">RBAC</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:block">Technical Verification Layer</span>
            </div>
          </Link>

          {/* Active Mode Tag */}
          <div className="hidden md:block pl-2 border-l border-slate-800">
            {getRoleBadge()}
          </div>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = link.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button: Sign In or Sign Out */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono hidden lg:inline">
                {currentUser.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-all"
              >
                <span>Sign Out</span>
                <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 rounded-lg transition-all"
            >
              <span>Sign In</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
