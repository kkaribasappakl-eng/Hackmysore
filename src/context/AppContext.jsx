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
  getBuilderScorecards
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
  const [backendAvailable, setBackendAvailable] = useState(null); // true | false | null (checking)
  const [activeRole, setActiveRole] = useState(null); // 'builder' | 'reviewer' | 'recruiter' | null

  // Flow State Tracking (Connects Builder -> Reviewer -> Recruiter seamlessly)
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
  const [builderSubmission, setBuilderSubmission] = useState({
    repoUrl: "https://github.com/rahul-sharma/signalcraft-order-service",
    demoUrl: "https://order-service-demo.signalcraft.dev",
    explanation: "Engineered a Spring Boot Order Service with pessimistic write-locks on inventory reservation and idempotent request hash tables.",
    adr: {
      what: "Order Management REST API with deterministic lifecycle and atomic stock reservation.",
      why: "Pessimistic DB row-level reservation guarantees zero stock oversell under high concurrency.",
      alternatives: "Evaluated optimistic retries; rejected due to retry avalanche under flash traffic.",
      tradeoffs: "Accepted higher lock duration for guaranteed ACID transactional integrity.",
      scaling: "Scale horizontally with PostgreSQL read replicas and Kafka outbox event streaming."
    },
    statusStep: 4,
    submitted: true
  });

  // Verify backend availability and hydrate initial state
  useEffect(() => {
    async function initBackend() {
      const healthRes = await getHealth();
      if (healthRes.success) {
        setBackendAvailable(true);
        // Hydrate from backend API
        loadInitialData();
      } else {
        setBackendAvailable(false);
        // Fallback to local data
        setCandidates(mockRecruiterData.candidates);
        setJobs(mockRecruiterData.roles);
        setChallenges(mockChallenges);
        setReviewQueue(mockReviewQueue);
      }
    }
    initBackend();
  }, []);

  async function loadInitialData() {
    try {
      // 1. Load Builder (ID 1)
      const bRes = await getUser(1);
      if (bRes.success && bRes.data) {
        setBuilderUser(bRes.data);
      }

      // 2. Load Reviewer (ID 4 or 3)
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

      // 8. Load Builder Scorecards
      const scRes = await getBuilderScorecards(1);
      if (scRes.success && Array.isArray(scRes.data)) {
        setBuilderScorecards(scRes.data);
        if (scRes.data.length > 0) {
          setActiveScorecardId(scRes.data[0].id);
        }
      }
    } catch (e) {
      console.warn("Failed to load initial data from backend, using fallback:", e);
    }
  }

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
    const res = await getBuilderScorecards(1);
    if (res.success && Array.isArray(res.data)) {
      setBuilderScorecards(res.data);
      if (res.data.length > 0) {
        setActiveScorecardId(res.data[0].id);
      }
    }
  };

  // Recruiter Shortlist action
  const toggleShortlist = async (candidateId, jobId = 1) => {
    const exists = shortlistedCandidateIds.includes(candidateId);
    if (!exists) {
      setShortlistedCandidateIds(prev => [...prev, candidateId]);
      // Call backend POST /api/shortlist
      await apiShortlistCandidate({
        job_id: jobId,
        builder_id: candidateId,
        recruiter_id: 5
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
    const payload = {
      company: newJobData.company || "TechNova Solutions",
      title: newJobData.title || "Backend Developer",
      description: newJobData.description || "Engineering role",
      required_skills: newJobData.skills && newJobData.skills.length > 0 ? newJobData.skills : ["Java", "SQL", "REST API"],
      difficulty: newJobData.difficulty || "Intermediate",
      created_by: 5
    };

    const res = await apiCreateJob(payload);
    if (res.success && res.data) {
      await refreshJobs();
      return res.data;
    }

    // Local fallback
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
    const payload = {
      submission_id: Number(submissionId),
      reviewer_id: 4, // Ananya Rao
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

    // Local fallback
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

  return (
    <AppContext.Provider
      value={{
        // Backend health status
        backendAvailable,
        // Active role
        activeRole,
        setActiveRole,
        // Active flow IDs
        activeAssessmentId,
        setActiveAssessmentId,
        activeSubmissionId,
        setActiveSubmissionId,
        activeReviewId,
        setActiveReviewId,
        activeScorecardId,
        setActiveScorecardId,
        // Builder
        builderUser,
        builderProfile: builderUser ? {
          ...mockBuilderProfile,
          name: builderUser.name,
          role: builderUser.domain,
          skills: builderUser.skills || mockBuilderProfile.skills
        } : mockBuilderProfile,
        scorecardData: mockScorecardData,
        builderScorecards,
        challenges: challenges.length > 0 ? challenges : mockChallenges,
        assessmentData: mockAssessmentData,
        builderSubmission,
        setBuilderSubmission,
        refreshBuilderScorecards,
        // Reviewer
        reviewerUser,
        reviewerProfile: {
          ...mockReviewerProfile,
          name: reviewerUser ? reviewerUser.name : mockReviewerProfile.name,
          credibilityScore: reviewerCredibility,
          pendingReviewsCount: reviewQueue.length
        },
        reviewQueue,
        completedReviews,
        submitReview,
        refreshQueue,
        // Recruiter
        recruiterUser,
        companyData: mockRecruiterData,
        jobs: jobs.length > 0 ? jobs : mockRecruiterData.roles,
        addJob,
        refreshJobs,
        candidates: candidates.length > 0 ? candidates : mockRecruiterData.candidates,
        refreshCandidates,
        toggleShortlist,
        isShortlisted,
        shortlistCount: (mockRecruiterData.shortlistedCount || 14) + shortlistedCandidateIds.length
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
