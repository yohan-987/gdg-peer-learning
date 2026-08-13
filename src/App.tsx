import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import ProfileSetup from '@/pages/ProfileSetup';
import Dashboard from '@/pages/Dashboard';
import DomainDetail from '@/pages/DomainDetail';
import Profile from '@/pages/Profile';
import Leaderboard from '@/pages/Leaderboard';
import Doubts from '@/pages/Doubts';
import DoubtDetail from '@/pages/DoubtDetail';
import Team from '@/pages/Team';
import { LoadingState } from '@/components/States';

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <LoadingState />
      </div>
    );
  }
  if (!profile) {
    return <Navigate to="/profile-setup" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProfileGate>
              <Dashboard />
            </ProfileGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/domain/:domainId"
        element={
          <ProtectedRoute>
            <ProfileGate>
              <DomainDetail />
            </ProfileGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doubts"
        element={
          <ProtectedRoute>
            <ProfileGate>
              <Doubts />
            </ProfileGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doubts/:doubtId"
        element={
          <ProtectedRoute>
            <ProfileGate>
              <DoubtDetail />
            </ProfileGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <ProfileGate>
              <Team />
            </ProfileGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <ProfileGate>
              <Leaderboard />
            </ProfileGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
