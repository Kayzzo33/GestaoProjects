import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { UserRole } from './types.ts';
import LoginPage from './pages/LoginPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import ClientDashboard from './pages/ClientDashboard.tsx';
import PendingActivationPage from './pages/PendingActivationPage.tsx';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, firebaseUser, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-medium">Verificando segurança do Hub...</div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/pending" replace />;
  
  if (roles && !roles.includes(user.role)) {
    return user.role === UserRole.ADMIN ? <Navigate to="/admin" replace /> : <Navigate to="/client" replace />;
  }

  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user, firebaseUser, loading } = useAuth();
  if (loading) return null;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/pending" replace />;
  return user.role === UserRole.ADMIN ? <Navigate to="/admin" replace /> : <Navigate to="/client" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pending" element={<PendingActivationPage />} />
          <Route path="/admin/*" element={<ProtectedRoute roles={[UserRole.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/client/*" element={<ProtectedRoute roles={[UserRole.CLIENT]}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;