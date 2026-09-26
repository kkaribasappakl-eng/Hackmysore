// src/services/api.js
// SignalCraft Centralized API Client with Cryptographic Role Authentication

const API_BASE_URL = 'http://localhost:4000/api';

// In-memory + LocalStorage token storage
let authToken = typeof window !== 'undefined' ? localStorage.getItem('signalcraft_token') : null;

export function setAuthToken(token) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('signalcraft_token', token);
    } else {
      localStorage.removeItem('signalcraft_token');
    }
  }
}

export function getAuthToken() {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('signalcraft_token');
  }
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('signalcraft_token');
    localStorage.removeItem('signalcraft_user');
  }
}

/**
 * Reusable request helper that:
 * - Sends HTTP requests
 * - Injects Bearer authorization token
 * - Parses JSON responses
 * - Handles HTTP and network errors
 * - Returns consistent structured responses
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    let data = null;
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text };
    }

    if (!response.ok) {
      const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        status: response.status
      };
    }

    return {
      success: true,
      data: data?.data !== undefined ? data.data : data,
      message: data?.message || 'Success',
      status: response.status
    };
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    return {
      success: false,
      error: 'Backend unavailable — using limited demo mode.',
      message: 'Backend unavailable — using limited demo mode.',
      networkError: true
    };
  }
}

// 0. Authentication & Role Session
export async function loginUser(credentials) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  if (res.success && res.data?.token) {
    setAuthToken(res.data.token);
    if (typeof window !== 'undefined' && res.data.user) {
      localStorage.setItem('signalcraft_user', JSON.stringify(res.data.user));
    }
  }
  return res;
}

export async function getAuthMe() {
  return request('/auth/me');
}

export async function logoutUser() {
  const res = await request('/auth/logout', { method: 'POST' });
  clearAuthToken();
  return res;
}

export async function getDemoUsers() {
  return request('/auth/demo-users');
}

// 1. Health Check
export async function getHealth() {
  return request('/health');
}

// 2. Resume & Skill Extraction
export async function uploadResume(resumePayload) {
  return request('/resume/upload', {
    method: 'POST',
    body: JSON.stringify(resumePayload)
  });
}

export async function getBuilderResume(builderId) {
  return request(`/resume/builder/${builderId}`);
}

export async function getResumeSamples() {
  return request('/resume/samples');
}

// 3. Users
export async function getUsers() {
  return request('/users');
}

export async function getUser(id) {
  return request(`/users/${id}`);
}

export async function getUsersByRole(role) {
  return request(`/users/role/${encodeURIComponent(role)}`);
}

// 4. Jobs
export async function getJobs() {
  return request('/jobs');
}

export async function getJob(id) {
  return request(`/jobs/${id}`);
}

export async function createJob(jobData) {
  return request('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
}

// 5. Challenges
export async function getChallenges() {
  return request('/challenges');
}

export async function getChallenge(id) {
  return request(`/challenges/${id}`);
}

export async function getChallengesByDomain(domain) {
  return request(`/challenges/domain/${encodeURIComponent(domain)}`);
}

// 6. Assessments
export async function startAssessment(challengeId, builderId = 1) {
  return request('/assessments', {
    method: 'POST',
    body: JSON.stringify({
      challenge_id: Number(challengeId),
      builder_id: Number(builderId)
    })
  });
}

export async function getAssessment(id) {
  return request(`/assessments/${id}`);
}

export async function getAssessmentQuestions(assessmentId) {
  return request(`/assessments/${assessmentId}/questions`);
}

export async function submitAssessmentAnswers(assessmentId, answers) {
  return request(`/assessments/${assessmentId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answers })
  });
}

export async function evaluateAssessment(assessmentId) {
  return request(`/assessments/${assessmentId}/evaluate`, {
    method: 'POST'
  });
}

export async function completeAssessment(id) {
  return request(`/assessments/${id}/complete`, {
    method: 'POST'
  });
}

// 7. Submissions
export async function createSubmission(submissionData) {
  return request('/submissions', {
    method: 'POST',
    body: JSON.stringify(submissionData)
  });
}

export async function getSubmission(id) {
  return request(`/submissions/${id}`);
}

export async function getSubmissionsByStatus(status) {
  return request(`/submissions/status/${encodeURIComponent(status)}`);
}

export async function runIntegrityCheck(submissionId) {
  return request(`/submissions/${submissionId}/integrity-check`, {
    method: 'POST'
  });
}

export async function runAIAnalysis(submissionId) {
  return request(`/submissions/${submissionId}/ai-analysis`, {
    method: 'POST'
  });
}

// 8. Reviews
export async function getReviewQueue(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.reviewer_id) queryParams.append('reviewer_id', params.reviewer_id);
  if (params.matched_only !== undefined && params.matched_only !== null) queryParams.append('matched_only', params.matched_only);
  if (params.status) queryParams.append('status', params.status);
  const qs = queryParams.toString();
  return request(qs ? `/reviews/queue?${qs}` : '/reviews/queue');
}

export async function createReview(reviewData) {
  return request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
}

// 9. Scorecards
export async function generateScorecard(scorecardData) {
  return request('/scorecards/generate', {
    method: 'POST',
    body: JSON.stringify(scorecardData)
  });
}

export async function getScorecard(id) {
  return request(`/scorecards/${encodeURIComponent(id)}`);
}

export async function getBuilderScorecards(builderId) {
  return request(`/scorecards/builder/${builderId}`);
}

export async function verifyScorecard(scorecardId) {
  return request(`/scorecards/verify/${encodeURIComponent(scorecardId)}`);
}

// 10. Candidates & Rankings
export async function getCandidates(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.skill && filters.skill !== 'All') {
    queryParams.append('skill', filters.skill);
  }
  if (filters.domain && filters.domain !== 'All') {
    queryParams.append('domain', filters.domain);
  }
  if (filters.minScore !== undefined && filters.minScore !== null && filters.minScore !== '') {
    queryParams.append('minScore', filters.minScore);
  }
  if (filters.sort) {
    queryParams.append('sort', filters.sort);
  }

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/candidates?${queryString}` : '/candidates';
  return request(endpoint);
}

export async function getRankings(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.skill && filters.skill !== 'All') {
    queryParams.append('skill', filters.skill);
  }
  if (filters.domain && filters.domain !== 'All') {
    queryParams.append('domain', filters.domain);
  }
  if (filters.minScore !== undefined && filters.minScore !== null && filters.minScore !== '') {
    queryParams.append('minScore', filters.minScore);
  }

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/candidates/rankings?${queryString}` : '/candidates/rankings';
  return request(endpoint);
}

export async function getRankingEvents() {
  return request('/rankings/events');
}

// 11. Shortlist
export async function shortlistCandidate(shortlistData) {
  return request('/shortlist', {
    method: 'POST',
    body: JSON.stringify(shortlistData)
  });
}

export async function getShortlistByJob(jobId) {
  return request(`/shortlist/job/${jobId}`);
}
