import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Mail, Users, Briefcase, X, RefreshCw } from 'lucide-react';

interface PublicJob {
  id: number;
  title: string;
  jobRole: string;
  requiredSkills: string;
  employmentType: string;
  location?: string;
  closingDate: string;
}

interface PublicOrganization {
  id: number;
  name: string;
  industry: string;
  location: string;
  description: string;
  websiteUrl: string;
  contactEmail: string;
  contactPhone: string;
  companySize: string;
  isActive: boolean;
  departments: { id: number; name: string }[];
  activeJobs: PublicJob[];
}

interface OrganizationProfileModalProps {
  organizationId: number;
  onClose: () => void;
  onApplyClick?: (jobId: number) => void;
}

export const OrganizationProfileModal: React.FC<OrganizationProfileModalProps> = ({
  organizationId,
  onClose,
  onApplyClick
}) => {
  const [org, setOrg] = useState<PublicOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [organizationId]);

  const fetchOrganizationDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5163/api/organizations/${organizationId}/public`);
      if (response.ok) {
        const data = await response.json();
        setOrg(data);
      } else {
        setOrg(null);
      }
    } catch (err) {
      console.error("Error fetching organization public profile", err);
      setOrg(null);
    } finally {
      setLoading(false);
    }
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
      zIndex: 3100
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '780px',
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
              width: '3.2rem',
              height: '3.2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a7f3d0 0%, #059669 100%)',
              color: '#022c22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              boxShadow: '0 2px 10px rgba(167, 243, 208, 0.3)'
            }}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {org?.name || 'Company Profile'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#a7f3d0', opacity: 0.9 }}>
                {org?.industry || 'Enterprise Organization'} • Verified Corporate Profile
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b' }}>
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ margin: '0 auto 0.5rem', color: '#059669' }} />
              Loading organization details...
            </div>
          ) : !org ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              Organization details unavailable.
            </div>
          ) : (
            <>
              {/* Quick Contact & Info Grid */}
              <div style={{
                background: '#f2f9f4',
                border: '1px solid #d1fae5',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.85rem',
                fontSize: '0.88rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                  <MapPin className="w-4 h-4 text-emerald-600" style={{ color: '#059669' }} />
                  <span><strong>Headquarters:</strong> {org.location || 'Not specified'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                  <Users className="w-4 h-4 text-emerald-600" style={{ color: '#059669' }} />
                  <span><strong>Company Size:</strong> {org.companySize || 'Corporate'}</span>
                </div>

                {org.websiteUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                    <Globe className="w-4 h-4 text-emerald-600" style={{ color: '#059669' }} />
                    <a href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 600, textDecoration: 'underline' }}>
                      Visit Website
                    </a>
                  </div>
                )}

                {org.contactEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                    <Mail className="w-4 h-4 text-emerald-600" style={{ color: '#059669' }} />
                    <span>{org.contactEmail}</span>
                  </div>
                )}
              </div>

              {/* Company Overview */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#064e3b', fontWeight: 700 }}>
                  Company Overview & Culture
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, background: '#f2f9f4', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid #d1fae5', whiteSpace: 'pre-line' }}>
                  {org.description || `${org.name} is a leading enterprise organization operating in the ${org.industry} industry.`}
                </p>
              </div>

              {/* Active Open Openings at Organization */}
              <div>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', color: '#064e3b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase className="w-4 h-4 text-emerald-600" style={{ color: '#059669' }} />
                  Active Job Openings at {org.name} ({org.activeJobs.length})
                </h4>

                {org.activeJobs.length === 0 ? (
                  <p style={{ fontSize: '0.88rem', color: '#64748b', fontStyle: 'italic' }}>
                    No open positions posted by this organization currently.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {org.activeJobs.map((job) => (
                      <div key={job.id} style={{
                        padding: '0.85rem 1.1rem',
                        background: '#ffffff',
                        border: '1px solid #d1fae5',
                        borderLeft: '4px solid #059669',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <h5 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#064e3b' }}>
                            {job.title}
                          </h5>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Role: {job.jobRole} • Skills: <code style={{ color: '#047857' }}>{job.requiredSkills}</code>
                          </div>
                        </div>

                        {onApplyClick && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => { onClose(); onApplyClick(job.id); }}
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', fontWeight: 700 }}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Bar */}
          <div style={{ borderTop: '1px solid #d1fae5', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
