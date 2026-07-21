import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CalendarRange, Brain } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      >
        <source src="/landing-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Emerald Glassmorphic Backdrop Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(2, 44, 34, 0.78) 0%, rgba(6, 78, 59, 0.85) 60%, rgba(2, 44, 34, 0.92) 100%)',
        backdropFilter: 'blur(4px)',
        zIndex: 1
      }} />

      {/* Content Layer */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Hero Section */}
        <section style={{ 
          padding: '6rem 1.5rem 4rem', 
          textAlign: 'center', 
          maxWidth: '960px', 
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.75rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'rgba(167, 243, 208, 0.2)',
            border: '1px solid rgba(167, 243, 208, 0.4)',
            padding: '0.5rem 1.35rem',
            borderRadius: '9999px',
            fontSize: '0.92rem',
            color: '#a7f3d0',
            fontWeight: 800,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 15px rgba(2, 44, 34, 0.3)'
          }}>
            <img src="/logo.png" alt="SynapHR" style={{ height: '1.4rem', width: 'auto' }} />
            <span>AI - POWERED TALENT MANAGEMENT</span>
          </div>
          
          <h1 style={{ fontSize: '3.8rem', lineHeight: 1.15, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Hire Smart, Apply Faster with <br />
            <span style={{ 
              background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(167, 243, 208, 0.2))'
            }}>
              SynapHR
            </span>
          </h1>
          
          <p style={{ fontSize: '1.2rem', maxWidth: '680px', margin: '0 auto', color: '#d1fae5', lineHeight: 1.6, opacity: 0.95 }}>
            An end-to-end corporate talent management platform powered by Gemini AI candidate job recommendations, automatic resume parsing, interview scheduling, and live internal messaging.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.9rem 2.2rem', fontSize: '1rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: '1px solid #34d399', boxShadow: '0 4px 20px rgba(5, 150, 105, 0.4)', color: '#ffffff', fontWeight: 700 }}>
              <span>Access Platform</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '0.9rem 2.2rem', fontSize: '1rem', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(8px)', fontWeight: 600 }}>
              Candidate Portal
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container" style={{ paddingBottom: '6rem', maxWidth: '1720px', width: '96%', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.2rem', fontWeight: 800, color: '#ffffff' }}>
            Platform Capabilities
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem', 
              textAlign: 'left',
              background: 'rgba(2, 44, 34, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(167, 243, 208, 0.25)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.75rem'
            }}>
              <div style={{ 
                background: 'rgba(167, 243, 208, 0.2)', 
                padding: '0.75rem', 
                borderRadius: '12px', 
                width: 'fit-content',
                border: '1px solid rgba(167, 243, 208, 0.3)'
              }}>
                <Brain className="w-6 h-6" style={{ color: '#a7f3d0' }} />
              </div>
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700 }}>Automatic Match Scoring</h3>
              <p style={{ color: '#d1fae5', opacity: 0.9, lineHeight: 1.5, fontSize: '0.95rem' }}>Candidates upload PDF/TXT resumes. Our background engine automatically extracts CV text and calculates a score against required job skills.</p>
            </div>

            <div className="card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem', 
              textAlign: 'left',
              background: 'rgba(2, 44, 34, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(167, 243, 208, 0.25)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.75rem'
            }}>
              <div style={{ 
                background: 'rgba(167, 243, 208, 0.2)', 
                padding: '0.75rem', 
                borderRadius: '12px', 
                width: 'fit-content',
                border: '1px solid rgba(167, 243, 208, 0.3)'
              }}>
                <CalendarRange className="w-6 h-6" style={{ color: '#a7f3d0' }} />
              </div>
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700 }}>Calendar & Meeting Links</h3>
              <p style={{ color: '#d1fae5', opacity: 0.9, lineHeight: 1.5, fontSize: '0.95rem' }}>Recruiters schedule interviews with shortlisted candidates. It automatically generates a Google Calendar event and meeting URL.</p>
            </div>

            <div className="card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem', 
              textAlign: 'left',
              background: 'rgba(2, 44, 34, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(167, 243, 208, 0.25)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.75rem'
            }}>
              <div style={{ 
                background: 'rgba(167, 243, 208, 0.2)', 
                padding: '0.75rem', 
                borderRadius: '12px', 
                width: 'fit-content',
                border: '1px solid rgba(167, 243, 208, 0.3)'
              }}>
                <ShieldCheck className="w-6 h-6" style={{ color: '#a7f3d0' }} />
              </div>
              <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700 }}>Audit Trails & Security</h3>
              <p style={{ color: '#d1fae5', opacity: 0.9, lineHeight: 1.5, fontSize: '0.95rem' }}>Every action is protected by role-based access control (RBAC). Admins can view an immutable trail of events to monitor system activity.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ 
          marginTop: 'auto', 
          borderTop: '1px solid rgba(167, 243, 208, 0.2)', 
          padding: '2rem 1.5rem', 
          textAlign: 'center',
          background: 'rgba(2, 44, 34, 0.85)',
          backdropFilter: 'blur(8px)'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#a7f3d0' }}>
            &copy; {new Date().getFullYear()} SynapHR. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};
