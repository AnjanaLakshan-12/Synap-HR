import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { token: string; fullName: string; email: string; role: string }) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5163/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Invalid credentials';
        try {
          const errObj = JSON.parse(errorText);
          errorMsg = errObj.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      onLoginSuccess(data);
      showToast('Logged in successfully', 'success');

      // Navigate based on role
      const role = data.role.toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'recruiter') {
        navigate('/recruiter');
      } else if (role === 'hiringmanager') {
        navigate('/hiring-manager');
      } else {
        navigate('/candidate');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.25rem' }}>
          <img src="/logo.png" alt="SynapHR Logo" style={{ height: '3.5rem', width: 'auto', marginBottom: '0.5rem', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064e3b', margin: 0 }}>SynapHR</h2>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
            AI - POWERED TALENT MANAGEMENT
          </span>
        </div>
        <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', color: '#4b5563' }}>Log in to access your talent management portal</p>

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <User style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.1rem',
                height: '1.1rem',
                color: 'var(--text-muted)'
              }} />
              <input
                type="email"
                className="form-control"
                placeholder="admin@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.1rem',
                height: '1.1rem',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}>
          <span>Are you a candidate?</span>
          <a href="/register" style={{ fontWeight: 500 }}>Create an account</a>
        </div>
      </div>
    </div>
  );
};
