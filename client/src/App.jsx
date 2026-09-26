// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Top Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/RoleSelection';

// Builder Pages
import BuilderDashboard from './pages/builder/BuilderDashboard';
import ResumeUpload from './pages/builder/ResumeUpload';
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
          {/* Public Authentication & Landing */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/role-selection" element={<RoleSelection />} />

          {/* Protected Builder Flow */}
          <Route
            path="/builder"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <BuilderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/resume"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <ResumeUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/challenges"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <Challenges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/challenges/:challengeId"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <ChallengeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/challenge-details"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <ChallengeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/assessment"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/submission"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <Submission />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/scorecard"
            element={
              <ProtectedRoute allowedRoles={['BUILDER']}>
                <Scorecard />
              </ProtectedRoute>
            }
          />

          {/* Protected Reviewer Flow */}
          <Route
            path="/reviewer"
            element={
              <ProtectedRoute allowedRoles={['REVIEWER']}>
                <ReviewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/queue"
            element={
              <ProtectedRoute allowedRoles={['REVIEWER']}>
                <ReviewQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/review/:submissionId"
            element={
              <ProtectedRoute allowedRoles={['REVIEWER']}>
                <ReviewSubmission />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/review"
            element={
              <ProtectedRoute allowedRoles={['REVIEWER']}>
                <ReviewSubmission />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/result"
            element={
              <ProtectedRoute allowedRoles={['REVIEWER']}>
                <ReviewResult />
              </ProtectedRoute>
            }
          />

          {/* Protected Recruiter Flow */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/create-job"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CreateJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/candidates"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CandidateDiscovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/candidate/:candidateId"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <CandidateDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/scorecard/:candidateId"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterScorecard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/scorecard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER']}>
                <RecruiterScorecard />
              </ProtectedRoute>
            }
          />

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
