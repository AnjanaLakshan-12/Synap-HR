import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LogOut, Shield, Briefcase, GraduationCap, UserCheck, 
  Bell, X
} from 'lucide-react';

interface NavbarProps {
  user: {
    token: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  onLogout: () => void;
}

interface AlertItem {
  id: number;
  title: string;
  message: string;
  type: number;
  isSent: boolean;
  isRead: boolean;
  sentAt: string;
  recipient: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.token) {
      fetchAlerts();
      // Poll alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.token]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch('http://localhost:5163/api/notifications', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Error fetching alerts in navbar", err);
    }
  };

  const handleTogglePopover = async () => {
    const nextState = !showPopover;
    setShowPopover(nextState);

    if (nextState && user?.token) {
      fetchAlerts();
      // Mark as read when opening dropdown
      try {
        await fetch('http://localhost:5163/api/notifications/mark-read', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      } catch (err) {
        console.error("Error marking alerts as read", err);
      }
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const r = user.role.toLowerCase();
    if (r === 'admin') {
      return (
        <span className="badge" style={{ background: 'rgba(167, 243, 208, 0.2)', color: '#a7f3d0', border: '1px solid rgba(167, 243, 208, 0.4)' }}>
          <Shield className="w-3 h-3" style={{ marginRight: '0.25rem' }} /> System Admin
        </span>
      );
    }
    if (r === 'recruiter') {
      return (
        <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
          <Briefcase className="w-3 h-3" style={{ marginRight: '0.25rem' }} /> Recruiter
        </span>
      );
    }
    if (r === 'hiringmanager') {
      return (
        <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#e9d5ff', border: '1px solid rgba(192, 132, 252, 0.4)' }}>
          <UserCheck className="w-3 h-3" style={{ marginRight: '0.25rem' }} /> Hiring Manager
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#a7f3d0', border: '1px solid rgba(52, 211, 153, 0.4)' }}>
        <GraduationCap className="w-3 h-3" style={{ marginRight: '0.25rem' }} /> Candidate
      </span>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const r = user.role.toLowerCase();
    if (r === 'admin') return '/admin';
    if (r === 'recruiter') return '/recruiter';
    if (r === 'hiringmanager') return '/hiring-manager';
    return '/candidate';
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <header style={{
      background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
      borderBottom: '1px solid rgba(167, 243, 208, 0.2)',
      boxShadow: '0 4px 20px rgba(2, 44, 34, 0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container" style={{
        padding: '0.8rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1720px',
        width: '96%',
        margin: '0 auto'
      }}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <img 
              src="/logo.png" 
              alt="SynapHR Logo" 
              style={{ 
                height: '2.6rem', 
                width: 'auto', 
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(167, 243, 208, 0.3))' 
              }} 
            />
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1, display: 'block' }}>
                Synap<span style={{ color: '#a7f3d0' }}>HR</span>
              </span>
              <span style={{ fontSize: '0.6rem', display: 'block', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '1px', fontWeight: 800, opacity: 0.95 }}>
                AI - POWERED TALENT MANAGEMENT
              </span>
            </div>
          </Link>

          {/* Quick Nav Link for Logged In Role */}
          {user && (
            <Link 
              to={getDashboardPath()} 
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: location.pathname === getDashboardPath() ? '#ffffff' : '#a7f3d0',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                background: location.pathname === getDashboardPath() ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                transition: 'var(--transition)'
              }}
            >
              Console Workspace
            </Link>
          )}
        </div>

        {/* User Profile & Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }} ref={popoverRef}>
            {getRoleBadge()}

            {/* Notification Bell Icon Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn"
                onClick={handleTogglePopover}
                style={{
                  padding: '0.45rem',
                  borderRadius: '50%',
                  background: showPopover ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Alerts"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    border: '2px solid #022c22'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Unified Alerts Popover Dropdown */}
              {showPopover && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: '0',
                  width: '380px',
                  maxWidth: '90vw',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 16px 40px rgba(2, 44, 34, 0.25), 0 0 0 1px rgba(5, 150, 105, 0.1)',
                  zIndex: 2500,
                  overflow: 'hidden',
                  textAlign: 'left'
                }}>
                  {/* Popover Header */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid #d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f2f9f4'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#064e3b' }}>Alerts</span>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowPopover(false)} 
                      style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Single Alerts List */}
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {alerts.length === 0 ? (
                      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                        <Bell className="w-8 h-8 opacity-30 mx-auto mb-2" style={{ margin: '0 auto 0.5rem' }} />
                        No alerts recorded yet.
                      </div>
                    ) : (
                      alerts.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: '0.85rem 1.25rem',
                            borderBottom: '1px solid #f2f9f4',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start',
                            background: item.isRead ? '#ffffff' : '#f0fdf4',
                            transition: 'background 0.2s ease'
                          }}
                        >
                          <div style={{
                            width: '2.2rem',
                            height: '2.2rem',
                            borderRadius: '50%',
                            background: '#ecfdf5',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '1px solid #a7f3d0'
                          }}>
                            <Bell className="w-4 h-4" />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#064e3b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.title}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', flexShrink: 0 }}>
                                {getTimeAgo(item.sentAt)}
                              </span>
                            </div>

                            <div 
                              style={{ 
                                fontSize: '0.8rem', 
                                color: '#334155', 
                                background: 'rgba(255, 255, 255, 0.8)', 
                                padding: '0.35rem 0.6rem', 
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                marginTop: '0.25rem',
                                whiteSpace: 'pre-line' 
                              }}
                              dangerouslySetInnerHTML={{ __html: item.message }}
                            />
                          </div>

                          {!item.isRead && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', flexShrink: 0, marginTop: '0.4rem' }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div style={{
                    padding: '0.65rem 1.25rem',
                    background: '#f2f9f4',
                    borderTop: '1px solid #d1fae5',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowPopover(false)}>
                      Close Alerts Menu
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* User Capsule */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '0.25rem 0.75rem 0.25rem 0.35rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div className="user-avatar-circle" style={{ background: 'linear-gradient(135deg, #059669 0%, #a7f3d0 100%)', color: '#022c22', fontWeight: 800 }}>
                {getInitials(user.fullName)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                  {user.fullName}
                </span>
                <span style={{ color: '#a7f3d0', fontSize: '0.72rem', display: 'block', opacity: 0.9 }}>
                  {user.email}
                </span>
              </div>
            </div>

            <button 
              className="btn" 
              onClick={handleLogoutClick}
              style={{ 
                padding: '0.4rem 0.85rem', 
                fontSize: '0.82rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login" className="btn" style={{ padding: '0.45rem 1.1rem', fontSize: '0.88rem', background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.88rem', background: '#a7f3d0', color: '#022c22', fontWeight: 800 }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
