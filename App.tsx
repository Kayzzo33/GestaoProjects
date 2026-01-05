
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import { User, UserRole } from './types';
import { db } from './db';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import PendingActivationPage from './pages/PendingActivationPage';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const userData = await db.getUserByUid(fUser.uid);
          setUser(userData);
        } catch (e) {
          console.error("Auth profile fetch error:", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

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

const HomeRedirect = () => {
  const { user, firebaseUser, loading } = useAuth();
  if (loading) return null;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/pending" replace />;
  return user.role === UserRole.ADMIN ? <Navigate to="/admin" replace /> : <Navigate to="/client" replace />;
};

export default App;
