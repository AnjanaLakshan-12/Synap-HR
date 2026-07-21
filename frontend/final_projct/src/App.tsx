import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { HiringManagerDashboard } from './pages/HiringManagerDashboard';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface UserSession {
  token: string;
  fullName: string;
  email: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load session from local storage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('user_session');
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch {
        localStorage.removeItem('user_session');
      }
    }
  }, []);

  const handleLoginSuccess = (sessionData: UserSession) => {
    setUser(sessionData);
    localStorage.setItem('user_session', JSON.stringify(sessionData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
    showToast('Logged out successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const hasRole = (role: string) => {
    return user && user.role.toLowerCase() === role.toLowerCase();
  };

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to={
                  user.role.toLowerCase() === 'admin' ? '/admin' :
                  user.role.toLowerCase() === 'recruiter' ? '/recruiter' :
                  user.role.toLowerCase() === 'hiringmanager' ? '/hiring-manager' : '/candidate'
                } replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} showToast={showToast} />
              )
            } 
          />
          
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" replace /> : <Register showToast={showToast} />} 
          />
          
          {/* Role Protected Routes */}
          <Route 
            path="/admin" 
            element={
              hasRole('admin') ? (
                <AdminDashboard token={user!.token} showToast={showToast} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          <Route 
            path="/recruiter" 
            element={
              hasRole('recruiter') ? (
                <RecruiterDashboard token={user!.token} showToast={showToast} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route 
            path="/candidate" 
            element={
              hasRole('candidate') ? (
                <CandidateDashboard token={user!.token} showToast={showToast} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route 
            path="/hiring-manager" 
            element={
              hasRole('hiringmanager') ? (
                <HiringManagerDashboard token={user!.token} showToast={showToast} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Toast Alerts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Router>
  );
}

export default App;
