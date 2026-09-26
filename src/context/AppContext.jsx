// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getHealth,
  getUser,
  getJobs,
  createJob as apiCreateJob,
  getChallenges,
  getReviewQueue,
  createReview as apiCreateReview,
  getCandidates,
  shortlistCandidate as apiShortlistCandidate,
  getBuilderScorecards,
  registerUser,
  loginUser,
  getAuthMe,
  logoutUser,
  getDemoUsers,
  uploadResume as apiUploadResume,
  getBuilderResume,
  getAuthToken,
  setAuthToken,
  clearAuthToken
} from '../services/api';

import {
  mockBuilderProfile,
  mockScorecardData,
  mockChallenges,
  mockAssessmentData,
  mockReviewerProfile,
  mockReviewQueue,
  mockRecruiterData
} from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Backend availability state
  const [backendAvailable, setBackendAvailable] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('signalcraft_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Flow State Tracking
  const [activeAssessmentId, setActiveAssessmentId] = useState(1);
  const [activeSubmissionId, setActiveSubmissionId] = useState(1);
  const [activeReviewId, setActiveReviewId] = useState(1);
  const [activeScorecardId, setActiveScorecardId] = useState('SC-BE-2026-001');

  // Recruiter dynamic state
  const [candidates, setCandidates] = useState([]);
  const [shortlistedCandidateIds, setShortlistedCandidateIds] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recruiterUser, setRecruiterUser] = useState(null);

  // Reviewer dynamic state
  const [reviewQueue, setReviewQueue] = useState([]);
  const [completedReviews, setCompletedReviews] = useState([]);
  const [reviewerUser, setReviewerUser] = useState(null);
  const [reviewerCredibility, setReviewerCredibility] = useState(92);

  // Builder dynamic state
  const [builderUser, setBuilderUser] = useState(null);
  const [builderScorecards, setBuilderScorecards] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [builderSubmission, setBuilderSubmission] = useState(null);

  // Verify backend availability and hydrate initial state
  useEffect(() => {
    async function init() {
      setAuthLoading(true);
      try {
        const healthRes = await getHealth();
        if (healthRes.success) {
          setBackendAvailable(true);

          // Verify stored token session if present
          const token = getAuthToken();
          if (token) {
            const meRes = await getAuthMe();
            if (meRes.success && meRes.data) {
              setCurrentUser(meRes.data);
              localStorage.setItem('signalcraft_user', JSON.stringify(meRes.data));
            } else {
              // Token expired or invalid
              clearAuthToken();
              setCurrentUser(null);
            }
          }

          // Hydrate general data
          await loadInitialData();
        } else {
          setBackendAvailable(false);
          // Fallback to local data
          setCandidates(mockRecruiterData.candidates);
          setJobs(mockRecruiterData.roles);
          setChallenges(mockChallenges);
          setReviewQueue(mockReviewQueue);
        }
      } catch (err) {
        console.warn('Init error:', err);
        setBackendAvailable(false);
      } finally {
        setAuthLoading(false);
      }
    }

    init();
  }, []);

  async function loadInitialData() {
    try {
      // 1. Load Builder (ID 1)
      const bRes = await getUser(1);
      if (bRes.success && bRes.data) {
        setBuilderUser(bRes.data);
      }

      // 2. Load Reviewer (ID 4)
      const rRes = await getUser(4);
      if (rRes.success && rRes.data) {
        setReviewerUser(rRes.data);
      }

      // 3. Load Recruiter (ID 5)
      const recRes = await getUser(5);
      if (recRes.success && recRes.data) {
        setRecruiterUser(recRes.data);
      }

      // 4. Load Challenges
      const chRes = await getChallenges();
      if (chRes.success && Array.isArray(chRes.data) && chRes.data.length > 0) {
        setChallenges(chRes.data);
      } else {
        setChallenges(mockChallenges);
      }

      // 5. Load Jobs
      const jRes = await getJobs();
      if (jRes.success && Array.isArray(jRes.data) && jRes.data.length > 0) {
        setJobs(jRes.data);
      } else {
        setJobs(mockRecruiterData.roles);
      }

      // 6. Load Review Queue
      const qRes = await getReviewQueue();
      if (qRes.success && Array.isArray(qRes.data)) {
        setReviewQueue(qRes.data);
      } else {
        setReviewQueue(mockReviewQueue);
      }

      // 7. Load Candidates
      const cRes = await getCandidates();
      if (cRes.success && Array.isArray(cRes.data) && cRes.data.length > 0) {
        setCandidates(cRes.data);
      } else {
        setCandidates(mockRecruiterData.candidates);
      }

      // 8. Load Builder Scorecards for current user if builder
      if (currentUser?.role === 'BUILDER') {
        const scRes = await getBuilderScorecards(currentUser.id);
        if (scRes.success && Array.isArray(scRes.data)) {
          setBuilderScorecards(scRes.data);
          if (scRes.data.length > 0) {
            setActiveScorecardId(scRes.data[0].id);
          }
        }
        // 9. Load latest resume for current builder
        const resResume = await getBuilderResume(currentUser.id);
        if (resResume.success && resResume.data) {
          setUploadedResume(resResume.data);
        }
      }
    } catch (e) {
      console.warn("Failed to load initial data from backend, using fallback:", e);
    }
  }

  // Authentication Handlers
  const register = async (userData) => {
    return await registerUser(userData);
  };

  const login = async (email, password, role) => {
    const res = await loginUser({ email, password, role });
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      if (res.data.user.role === 'BUILDER') {
        setBuilderUser(res.data.user);
      } else if (res.data.user.role === 'REVIEWER') {
        setReviewerUser(res.data.user);
      } else if (res.data.user.role === 'RECRUITER') {
        setRecruiterUser(res.data.user);
      }
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Instant 1-Click Demo Login for Hackathon Judges
  const quickDemoLogin = async (roleName) => {
    const credentials = {
      BUILDER: { email: 'rahul@example.com', password: 'password123', role: 'BUILDER' },
      REVIEWER: { email: 'ananya@example.com', password: 'password123', role: 'REVIEWER' },
      RECRUITER: { email: 'meera@technova.example', password: 'password123', role: 'RECRUITER' }
    };

    const target = credentials[roleName.toUpperCase()];
    if (!target) return { success: false, message: 'Invalid demo role' };

    return await login(target.email, target.password, target.role);
  };

  // Resume Upload & Skill Extraction Flow
  const submitResume = async ({ builder_id, filename, resume_text }) => {
    const targetBuilderId = builder_id || currentUser?.id || 1;
    const res = await apiUploadResume({
      builder_id: targetBuilderId,
      filename: filename || 'resume.pdf',
      resume_text
    });

    if (res.success && res.data) {
      setUploadedResume(res.data);
      if (res.data.assessment_id) {
        setActiveAssessmentId(res.data.assessment_id);
      }
      // Update builder user skills in state
      if (currentUser?.id === targetBuilderId) {
        setCurrentUser(prev => ({
          ...prev,
          skills: res.data.extracted_skills,
          domain: res.data.domain
        }));
      }
      return { success: true, data: res.data };
    }
    return { success: false, message: res.message || 'Failed to analyze resume' };
  };

  // Refresh functions for components
  const refreshJobs = async () => {
    const res = await getJobs();
    if (res.success && Array.isArray(res.data)) {
      setJobs(res.data);
    }
  };

  const refreshCandidates = async (filters = {}) => {
    const res = await getCandidates(filters);
    if (res.success && Array.isArray(res.data)) {
      setCandidates(res.data);
      return res.data;
    }
    return candidates;
  };

  const refreshQueue = async () => {
    const res = await getReviewQueue();
    if (res.success && Array.isArray(res.data)) {
      setReviewQueue(res.data);
    }
  };

  const refreshBuilderScorecards = async () => {
    const bId = currentUser?.role === 'BUILDER' ? currentUser.id : 1;
    const res = await getBuilderScorecards(bId);
    if (res.success && Array.isArray(res.data)) {
      setBuilderScorecards(res.data);
      if (res.data.length > 0) {
        setActiveScorecardId(res.data[0].id);
      }
    }
  };

  // Recruiter Shortlist action
  const toggleShortlist = async (candidateId, jobId = 1) => {
    const recruiterId = currentUser?.role === 'RECRUITER' ? currentUser.id : 5;
    const exists = shortlistedCandidateIds.includes(candidateId);
    if (!exists) {
      setShortlistedCandidateIds(prev => [...prev, candidateId]);
      await apiShortlistCandidate({
        job_id: jobId,
        builder_id: candidateId,
        recruiter_id: recruiterId
      });
    } else {
      setShortlistedCandidateIds(prev => prev.filter(id => id !== candidateId));
    }

    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const newStatus = c.status === "Shortlisted" ? "Available" : "Shortlisted";
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const isShortlisted = (candidateId) => {
    return shortlistedCandidateIds.includes(candidateId);
  };

  // Recruiter Add Job action
  const addJob = async (newJobData) => {
    const recruiterId = currentUser?.role === 'RECRUITER' ? currentUser.id : 5;
    const payload = {
      company: newJobData.company || "TechNova Solutions",
      title: newJobData.title || "Backend Developer",
      description: newJobData.description || "Engineering role",
      required_skills: newJobData.skills && newJobData.skills.length > 0 ? newJobData.skills : ["Java", "SQL", "REST API"],
      difficulty: newJobData.difficulty || "Intermediate",
      created_by: recruiterId
    };

    const res = await apiCreateJob(payload);
    if (res.success && res.data) {
      await refreshJobs();
      return res.data;
    }

    const localJob = {
      id: `job-${Date.now()}`,
      ...payload,
      matchedCandidatesCount: 12,
      postedDate: "Just now"
    };
    setJobs(prev => [localJob, ...prev]);
    return localJob;
  };

  // Reviewer Submit Review action
  const submitReview = async (submissionId, reviewResult) => {
    const reviewerId = currentUser?.role === 'REVIEWER' ? currentUser.id : 4;
    const payload = {
      submission_id: Number(submissionId),
      reviewer_id: reviewerId,
      correctness: reviewResult.rubrics?.correctness || 4.5,
      architecture: reviewResult.rubrics?.architecture || 4.2,
      code_quality: reviewResult.rubrics?.codeQuality || 4.0,
      tradeoff_awareness: reviewResult.rubrics?.tradeOffs || 4.5,
      feedback: reviewResult.feedback || "Verified implementation and strong ADR."
    };

    const res = await apiCreateReview(payload);
    if (res.success && res.data) {
      setActiveReviewId(res.data.id);
      setCompletedReviews(prev => [res.data, ...prev]);
      setReviewerCredibility(prev => Math.min(99, prev + 1));
      await refreshQueue();
      return res.data;
    }

    const existing = reviewQueue.find(r => r.id === submissionId || r.submission_id === submissionId);
    const completed = {
      ...existing,
      status: "Reviewed",
      finalScore: reviewResult.finalScore || 4.3,
      rubrics: reviewResult.rubrics,
      feedback: reviewResult.feedback,
      completedAt: "Just now"
    };
    setCompletedReviews(prev => [completed, ...prev]);
    setReviewQueue(prev => prev.filter(r => (r.id !== submissionId && r.submission_id !== submissionId)));
    setReviewerCredibility(prev => Math.min(99, prev + 1));
    return completed;
  };

  const activeRole = currentUser?.role?.toLowerCase() || null;

  return (
    <AppContext.Provider
      value={{
        // Backend health status
        backendAvailable,
        // Auth session
        currentUser,
        setCurrentUser,
        authLoading,
        register,
        login,
        logout,
        quickDemoLogin,
        activeRole,
        // Active flow IDs
        activeAssessmentId,
        setActiveAssessmentId,
        activeSubmissionId,
        setActiveSubmissionId,
        activeReviewId,
        setActiveReviewId,
        activeScorecardId,
        setActiveScorecardId,
        // Resume Flow
        uploadedResume,
        setUploadedResume,
        submitResume,
        // Builder
        builderUser: (currentUser?.role === 'BUILDER' ? currentUser : builderUser),
        builderProfile: (currentUser?.role === 'BUILDER' ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.domain || 'Engineering Builder',
          skills: currentUser.skills || []
        } : (builderUser ? {
          id: builderUser.id,
          name: builderUser.name,
          email: builderUser.email,
          role: builderUser.domain || 'Engineering Builder',
          skills: builderUser.skills || []
        } : null)),
        scorecardData: mockScorecardData,
        builderScorecards,
        challenges: challenges.length > 0 ? challenges : mockChallenges,
        assessmentData: mockAssessmentData,
        builderSubmission,
        setBuilderSubmission,
        refreshBuilderScorecards,
        // Reviewer
        reviewerUser: (currentUser?.role === 'REVIEWER' ? currentUser : reviewerUser),
        reviewerProfile: {
          ...mockReviewerProfile,
          name: currentUser?.role === 'REVIEWER' ? currentUser.name : (reviewerUser ? reviewerUser.name : mockReviewerProfile.name),
          domain: currentUser?.role === 'REVIEWER' ? (currentUser.domain || 'Backend Engineering') : (reviewerUser ? reviewerUser.domain : mockReviewerProfile.domain),
          skills: currentUser?.role === 'REVIEWER' && currentUser.skills ? currentUser.skills : (reviewerUser?.skills || mockReviewerProfile.skills),
          credibilityScore: reviewerCredibility,
          reviewsCount: completedReviews.length + 18
        },
        reviewQueue,
        completedReviews,
        submitReview,
        refreshQueue,
        // Recruiter
        recruiterUser: (currentUser?.role === 'RECRUITER' ? currentUser : recruiterUser),
        recruiterProfile: {
          name: currentUser?.role === 'RECRUITER' ? currentUser.name : (recruiterUser ? recruiterUser.name : "Meera Kapoor"),
          title: "Technical Talent Lead & Engineering Recruiter",
          company: recruiterUser?.domain || mockRecruiterData?.company || "TechNova Solutions",
          logo: mockRecruiterData?.logo || "TN"
        },
        companyData: mockRecruiterData,
        jobs,
        candidates,
        refreshCandidates,
        refreshJobs,
        shortlistedCandidateIds,
        toggleShortlist,
        isShortlisted,
        shortlistCount: shortlistedCandidateIds.length,
        addJob
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
