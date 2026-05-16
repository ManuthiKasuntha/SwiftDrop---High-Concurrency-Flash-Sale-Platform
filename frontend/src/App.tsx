import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import EventDetail from './pages/EventDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="container mt-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<MainLayout />}>
            <Route index element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="event/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
