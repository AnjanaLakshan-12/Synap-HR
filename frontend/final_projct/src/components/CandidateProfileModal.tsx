import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, 
  Globe, FileText, MessageSquare, X, RefreshCw, ExternalLink
} from 'lucide-react';

interface CandidateProfile {
  id: number;
  candidateId: number;
  phoneNumber?: string;
  address?: string;
  professionalSummary?: string;
  skills?: string;
  experience?: string;
  education?: string;
  certifications?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  updatedAt?: string;
}

interface CandidateProfileModalProps {
  token: string;
  candidateUserId: number;
  candidateName: string;
  candidateEmail: string;
  resumeCvId?: number;
  applicationId?: number;
  jobTitle?: string;
  onClose: () => void;
  onOpenChat?: (appId: number, jobTitle: string, candName: string) => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  token,
  candidateUserId,
  candidateName,
  candidateEmail,
  resumeCvId,
  applicationId,
  jobTitle,
  onClose,
  onOpenChat
}) => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidateProfile();
  }, [candidateUserId]);

  const fetchCandidateProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5163/api/candidate-profile/candidate/${candidateUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching candidate profile", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const getSkillsArray = (skillsStr?: string) => {
    if (!skillsStr) return [];
    return skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2800
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        textAlign: 'left',
        padding: 0,
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        background: '#ffffff'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669 0%, #a7f3d0 100%)',
              color: '#022c22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              {candidateName ? candidateName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                {candidateName}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#a7f3d0', opacity: 0.9 }}>
                Applicant Background & Qualifications Profile
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Contact Bar */}
          <div style={{
            background: '#f2f9f4',
            border: '1px solid #d1fae5',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
              <Mail className="w-4 h-4" style={{ color: '#059669' }} />
              <span>{candidateEmail}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
              <Phone className="w-4 h-4" style={{ color: '#059669' }} />
              <span>{profile?.phoneNumber || 'No phone provided'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
              <MapPin className="w-4 h-4" style={{ color: '#059669' }} />
              <span>{profile?.address || 'No location specified'}</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ margin: '0 auto 0.5rem' }} />
              Loading profile details...
            </div>
          ) : (
            <>
              {/* Professional Summary */}
              {profile?.professionalSummary && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User className="w-4 h-4" style={{ color: '#059669' }} />
                    <span>Professional Summary</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, background: '#f2f9f4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                    {profile.professionalSummary}
                  </p>
                </div>
              )}

              {/* Skills */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#064e3b' }}>Core Skills & Tech Stack</h4>
                {getSkillsArray(profile?.skills).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {getSkillsArray(profile?.skills).map((skill, idx) => (
                      <span key={idx} style={{
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No skills listed</span>
                )}
              </div>

              {/* Grid: Work Experience & Education */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase className="w-4 h-4" style={{ color: '#059669' }} />
                    <span>Work Experience</span>
                  </h4>
                  <div style={{ background: '#f2f9f4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5', fontSize: '0.88rem', color: '#334155', minHeight: '80px', whiteSpace: 'pre-line' }}>
                    {profile?.experience || 'No experience detailed.'}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <GraduationCap className="w-4 h-4" style={{ color: '#059669' }} />
                    <span>Education & Qualifications</span>
                  </h4>
                  <div style={{ background: '#f2f9f4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5', fontSize: '0.88rem', color: '#334155', minHeight: '80px', whiteSpace: 'pre-line' }}>
                    {profile?.education || 'No education detailed.'}
                  </div>
                </div>
              </div>

              {/* Certifications & Social Links */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award className="w-4 h-4" style={{ color: '#059669' }} />
                    <span>Certifications</span>
                  </h4>
                  <div style={{ background: '#f2f9f4', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5', fontSize: '0.88rem', color: '#334155' }}>
                    {profile?.certifications || 'No certifications recorded.'}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#064e3b' }}>Portfolio & Social Links</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {profile?.linkedInUrl ? (
                      <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', justifyContent: 'flex-start', color: '#0077b5', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <Globe className="w-4 h-4" />
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No LinkedIn link</span>
                    )}

                    {profile?.portfolioUrl ? (
                      <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', justifyContent: 'flex-start', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <Globe className="w-4 h-4" />
                        <span>Personal Portfolio</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No portfolio link</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Bar */}
          <div style={{ borderTop: '1px solid #d1fae5', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a
              href={resumeCvId 
                ? `http://localhost:5163/api/candidate-cv/${resumeCvId}/download?token=${token}`
                : `http://localhost:5163/api/candidate-cv/by-candidate/${candidateUserId}/download?token=${token}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 }}
              onClick={async (e) => {
                e.preventDefault();
                const downloadUrl = resumeCvId 
                  ? `http://localhost:5163/api/candidate-cv/${resumeCvId}/download`
                  : `http://localhost:5163/api/candidate-cv/by-candidate/${candidateUserId}/download`;
                try {
                  const res = await fetch(downloadUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `${candidateName.replace(/\s+/g, '_')}_CV`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  } else {
                    alert("No downloadable CV file attachment found for this candidate.");
                  }
                } catch (err) {
                  console.error("Fetch download error", err);
                  alert("Error downloading CV file.");
                }
              }}
            >
              <FileText className="w-4 h-4" style={{ color: '#059669' }} />
              <span>Download / View Resume</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div style={{ flex: 1 }} />

            {applicationId && onOpenChat && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { onClose(); onOpenChat(applicationId, jobTitle || 'Position', candidateName); }}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', border: 'none', borderRadius: '8px' }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Start Live Chat</span>
              </button>
            )}

            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}>
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
