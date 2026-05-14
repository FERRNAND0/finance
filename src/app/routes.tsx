import { createBrowserRouter, Navigate } from 'react-router';
import { AuthPage } from './pages/AuthPage';
import { TwoFactorPage } from './pages/TwoFactorPage';
import { DashboardPage } from './pages/DashboardPage';
import { ManagementPage } from './pages/ManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { Layout } from './components/Layout';

import { useApp } from './contexts/AppContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  return <Layout>{children}</Layout>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function VerifyGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  // Убрали старую проверку pendingVerification.
  // Теперь страница 2FA сама проверяет, передали ли ей email.
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: (
      <AuthGuard>
        <AuthPage />
      </AuthGuard>
    ),
  },
  {
    path: '/auth/verify',
    element: (
      <VerifyGuard>
        <TwoFactorPage />
      </VerifyGuard>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/management',
    element: (
      <ProtectedRoute>
        <ManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
