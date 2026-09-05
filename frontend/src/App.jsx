import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AmbientBackground from './components/common/AmbientBackground';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemEditorPage from './pages/ProblemEditorPage';
import SkillAssessmentPage from './pages/SkillAssessmentPage';
import RoadmapPage from './pages/RoadmapPage';
import MentorChatPage from './pages/MentorChatPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import PlaygroundPage from './pages/PlaygroundPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin Route wrapper
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isFullHeightWorkspace = location.pathname.startsWith('/playground') || location.pathname.startsWith('/problems/');

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      <AmbientBackground />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <main className={`flex-1 ${isFullHeightWorkspace ? 'pt-1' : 'pt-4'}`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/problems/:slug" element={<ProblemEditorPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute><SkillAssessmentPage /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
            <Route path="/mentor" element={<ProtectedRoute><MentorChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Admin Protected Route */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* Catch all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {!isFullHeightWorkspace && <Footer />}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
