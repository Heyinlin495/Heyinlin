// App — main router and layout
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PostDetail from './pages/PostDetail';
import ProjectDetail from './pages/ProjectDetail';
import NewPost from './pages/NewPost';
import NewProject from './pages/NewProject';
import EditPost from './pages/EditPost';
import EditProject from './pages/EditProject';
import { LoginForm, RegisterForm } from './components/Auth/AuthForms';
import ProfileEdit from './components/Profile/ProfileEdit';
import Messages from './components/Messages/Messages';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/a/:slug" element={<PostDetail />} />
            <Route path="/p/:slug" element={<ProjectDetail />} />
            <Route path="/new-post" element={
              <ProtectedRoute><NewPost /></ProtectedRoute>
            } />
            <Route path="/new-project" element={
              <ProtectedRoute><NewProject /></ProtectedRoute>
            } />
            <Route path="/edit-post/:slug" element={
              <ProtectedRoute><EditPost /></ProtectedRoute>
            } />
            <Route path="/edit-project/:slug" element={
              <ProtectedRoute><EditProject /></ProtectedRoute>
            } />
            <Route path="/edit-profile" element={
              <ProtectedRoute><ProfileEdit /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
            <Route path="/messages/:username" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
          </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
