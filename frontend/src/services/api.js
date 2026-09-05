import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codementor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected routes (not login/register)
      const isAuthUrl = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('codementor_token');
        localStorage.removeItem('codementor_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  demoLogin: (role = 'user') => api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
};

export const problemsAPI = {
  getProblems: (params) => api.get('/problems', { params }),
  getTopics: () => api.get('/problems/topics'),
  getProblemBySlug: (slug) => api.get(`/problems/${slug}`),
};

export const submissionsAPI = {
  runCode: (code, language, problemId = null, customInput = null) =>
    api.post('/submissions/run', {
      code,
      language,
      problem_id: problemId,
      custom_input: customInput,
    }),
  submitCode: (problemId, code, language) =>
    api.post('/submissions/submit', {
      problem_id: problemId,
      code,
      language,
    }),
  getUserSubmissions: (limit = 20) => api.get('/submissions/user', { params: { limit } }),
  getSubmission: (id) => api.get(`/submissions/${id}`),
};

export const assessmentAPI = {
  getOverview: () => api.get('/assessment/overview'),
  getRoadmap: () => api.get('/assessment/roadmap'),
};

export const mentorAPI = {
  chat: (message, problemContext = null, codeContext = null) =>
    api.post('/mentor/chat', {
      message,
      problem_context: problemContext,
      code_context: codeContext,
    }),
  getHistory: () => api.get('/mentor/history'),
  clearHistory: () => api.delete('/mentor/history'),
};

export const gamificationAPI = {
  getLeaderboard: () => api.get('/gamification/leaderboard'),
  getBadges: () => api.get('/gamification/badges'),
  getDailyChallenge: () => api.get('/gamification/daily-challenge'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createProblem: (data) => api.post('/admin/problems', data),
  updateProblem: (id, data) => api.put(`/admin/problems/${id}`, data),
  deleteProblem: (id) => api.delete(`/admin/problems/${id}`),
};

export const analysisAPI = {
  analyzeCode: (data) => api.post('/analysis/analyze', data),
  getSessionSummary: (sessionId) => api.get(`/analysis/session/${sessionId}`),
  clearSession: (sessionId) => api.delete(`/analysis/session/${sessionId}`),
};

export default api;
