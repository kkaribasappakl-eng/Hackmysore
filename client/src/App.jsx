// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Top Pages
import Landing from './pages/Landing';
import RoleSelection from './pages/RoleSelection';

// Builder Pages
import BuilderDashboard from './pages/builder/BuilderDashboard';
import Challenges from './pages/builder/Challenges';
import ChallengeDetails from './pages/builder/ChallengeDetails';
import Assessment from './pages/builder/Assessment';
import Submission from './pages/builder/Submission';
import Scorecard from './pages/builder/Scorecard';

// Reviewer Pages
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ReviewQueue from './pages/reviewer/ReviewQueue';
import ReviewSubmission from './pages/reviewer/ReviewSubmission';
import ReviewResult from './pages/reviewer/ReviewResult';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CreateJob from './pages/recruiter/CreateJob';
import CandidateDiscovery from './pages/recruiter/CandidateDiscovery';
import CandidateDetails from './pages/recruiter/CandidateDetails';
import RecruiterScorecard from './pages/recruiter/RecruiterScorecard';

import { useApp } from './context/AppContext';

function BackendStatusBanner() {
  const { backendAvailable } = useApp();
  if (backendAvailable !== false) return null;
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-mono text-center flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span>Backend unavailable — using limited demo mode.</span>
    </div>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      <BackendStatusBanner />
      <Navbar />
      <main className="flex-1">

            <Routes>
              {/* Home & Persona Selection */}
              <Route path="/" element={<Landing />} />
              <Route path="/role-selection" element={<RoleSelection />} />

              {/* Builder Flow */}
              <Route path="/builder" element={<BuilderDashboard />} />
              <Route path="/builder/challenges" element={<Challenges />} />
              <Route path="/builder/challenges/:challengeId" element={<ChallengeDetails />} />
              <Route path="/builder/challenge-details" element={<ChallengeDetails />} />
              <Route path="/builder/assessment" element={<Assessment />} />
              <Route path="/builder/submission" element={<Submission />} />
              <Route path="/builder/scorecard" element={<Scorecard />} />

              {/* Reviewer Flow */}
              <Route path="/reviewer" element={<ReviewerDashboard />} />
              <Route path="/reviewer/queue" element={<ReviewQueue />} />
              <Route path="/reviewer/review/:submissionId" element={<ReviewSubmission />} />
              <Route path="/reviewer/review" element={<ReviewSubmission />} />
              <Route path="/reviewer/result" element={<ReviewResult />} />

              {/* Recruiter Flow */}
              <Route path="/recruiter" element={<RecruiterDashboard />} />
              <Route path="/recruiter/create-job" element={<CreateJob />} />
              <Route path="/recruiter/candidates" element={<CandidateDiscovery />} />
              <Route path="/recruiter/candidate/:candidateId" element={<CandidateDetails />} />
              <Route path="/recruiter/scorecard/:candidateId" element={<RecruiterScorecard />} />
              <Route path="/recruiter/scorecard" element={<RecruiterScorecard />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <MainLayout />
      </Router>
    </AppProvider>
  );
}

