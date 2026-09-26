// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const location = useLocation();
  const { activeRole, setActiveRole, shortlistCount } = useApp();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Builder', path: '/builder', role: 'builder' },
    { label: 'Reviewer', path: '/reviewer', role: 'reviewer' },
    { label: 'Recruiter', path: '/recruiter', role: 'recruiter' },
  ];

  const getRoleBadge = () => {
    if (location.pathname.startsWith('/builder')) {
      return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Builder Mode</span>;
    }
    if (location.pathname.startsWith('/reviewer')) {
      return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Reviewer Mode</span>;
    }
    if (location.pathname.startsWith('/recruiter')) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Recruiter Mode</span>
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
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">Prototype</span>
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
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = link.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (link.role) setActiveRole(link.role);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
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

        {/* Action Button: Role Selection */}
        <div className="flex items-center gap-3">
          <Link
            to="/role-selection"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-700/80 rounded-lg transition-all"
          >
            <span>Switch Role</span>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </div>

      </div>
    </header>
  );
}
