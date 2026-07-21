import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, User, FileText, CheckCircle, Upload, 
  Trash2, Search, ArrowRight, RefreshCw, Send, Calendar, MessageSquare, Sparkles, Building2
} from 'lucide-react';
import { ChatMessengerModal } from '../components/ChatMessengerModal';
import { OrganizationProfileModal } from '../components/OrganizationProfileModal';

interface CandidateDashboardProps {
  token: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

interface Job {
  id: number;
  title: string;
  description: string;
  requiredSkills: string;
  jobRole: string;
  employmentType: string;
  location?: string;
  closingDate: string;
  organizationId?: number;
}

interface AIRecommendedJobItem {
  job: Job;
  matchScore: number;
  aiRecommendationReason: string;
  keySkillMatches: string;
  industryFitCategory: string;
}

interface CandidateCV {
  id: number;
  cvTitle: string;
  filePath: string;
  uploadedAt: string;
}

interface CandidateProfile {
  id?: number;
  phoneNumber: string;
  address: string;
  professionalSummary: string;
  skills: string;
  experience: string;
  education: string;
  certifications: string;
  linkedInUrl: string;
  portfolioUrl: string;
}

interface Application {
  id: number;
  jobId: number;
  job?: Job;
  candidateCVId: number;
  candidateCV?: CandidateCV;
  status: number; // 0 = Applied, 1 = Shortlisted, 2 = InterviewScheduled, 3 = Selected, 4 = Rejected, 5 = OnHold
  matchScore: number;
  appliedAt: string;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ token, showToast }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'forYou' | 'profile' | 'applications'>('jobs');
  const [loading, setLoading] = useState(false);
  const [aiRecommendedJobs, setAiRecommendedJobs] = useState<AIRecommendedJobItem[]>([]);
  const [loadingAiJobs, setLoadingAiJobs] = useState(false);

  // Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CandidateCV[]>([]);
  const [profile, setProfile] = useState<CandidateProfile>({
    phoneNumber: '',
    address: '',
    professionalSummary: '',
    skills: '',
    experience: '',
    education: '',
    certifications: '',
    linkedInUrl: '',
    portfolioUrl: ''
  });
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');

  // CV Upload Form
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);

  // Apply Action Form
  const [applyJobId, setApplyJobId] = useState<number | null>(null);
  const [applyCVId, setApplyCVId] = useState('');

  // Active Chat State
  const [activeChatApp, setActiveChatApp] = useState<{ id: number; jobTitle: string; candidateName: string } | null>(null);

  // View Organization Profile Modal State
  const [selectedOrgIdForView, setSelectedOrgIdForView] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCandidateData();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'forYou') {
      fetchAiRecommendedJobs();
    }
  }, [activeTab]);

  const fetchAiRecommendedJobs = async () => {
    if (!token) return;
    setLoadingAiJobs(true);
    try {
      const response = await fetch('http://localhost:5163/api/candidate-profile/ai-recommended-jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAiRecommendedJobs(data);
      } else {
        showToast('Error loading AI recommended jobs', 'error');
      }
    } catch (err: any) {
      console.error("Error fetching AI recommended jobs", err);
      showToast('Failed to load Gemini AI job recommendations', 'error');
    } finally {
      setLoadingAiJobs(false);
    }
  };

  const fetchCandidateData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch active jobs (non-expired)
      const jobsRes = await fetch('http://localhost:5163/api/jobs/active', { headers });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // 2. Fetch profile
      const profileRes = await fetch('http://localhost:5163/api/candidate-profile/my', { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData) {
          setProfile({
            phoneNumber: profileData.phoneNumber || '',
            address: profileData.address || '',
            professionalSummary: profileData.professionalSummary || '',
            skills: profileData.skills || '',
            experience: profileData.experience || '',
            education: profileData.education || '',
            certifications: profileData.certifications || '',
            linkedInUrl: profileData.linkedInUrl || '',
            portfolioUrl: profileData.portfolioUrl || ''
          });
        }
      }

      // 3. Fetch CVs
      const cvsRes = await fetch('http://localhost:5163/api/candidate-cv/my', { headers });
      if (cvsRes.ok) {
        const cvsData = await cvsRes.json();
        setCvs(cvsData);
      }

      // 4. Fetch my applications
      const appsRes = await fetch('http://localhost:5163/api/applications/my', { headers });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setMyApplications(appsData);
      }

      // 5. Fetch my scheduled interviews (calendar)
      const calendarRes = await fetch('http://localhost:5163/api/interviews/my-calendar', { headers });
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        setInterviews(calendarData);
      }
    } catch (err) {
      showToast('Error syncing candidate dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5163/api/candidate-profile/my', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to save profile');
      showToast('Candidate Profile saved successfully!', 'success');
      fetchCandidateData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCVUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setUploadingCV(true);
    const formData = new FormData();
    formData.append('file', cvFile);

    try {
      const response = await fetch('http://localhost:5163/api/candidate-cv/upload-file', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'CV Upload failed');
      }

      showToast('Resume uploaded and scanned by AI parser successfully!', 'success');
      setCvFile(null);
      // Reset input element
      const fileInput = document.getElementById('cv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchCandidateData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingCV(false);
    }
  };

  const handleDeleteCV = async (cvId: number) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) return;

    try {
      const response = await fetch(`http://localhost:5163/api/candidate-cv/${cvId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Deletion failed');
      showToast('CV deleted successfully', 'success');
      fetchCandidateData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApplyClick = (jobId: number) => {
    if (cvs.length === 0) {
      showToast('Please upload at least one CV/Resume first!', 'error');
      setActiveTab('profile');
      return;
    }
    setApplyJobId(jobId);
    setApplyCVId(cvs[0]?.id.toString() || '');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJobId || !applyCVId) return;

    try {
      const response = await fetch('http://localhost:5163/api/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId: applyJobId, candidateCVId: applyCVId }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errMsg = 'Failed to submit application. Make sure you haven\'t already applied to this job.';
        try {
          const errObj = JSON.parse(text);
          errMsg = errObj.message || errMsg;
        } catch {
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }

      showToast('Application submitted successfully! Your match score has been computed.', 'success');
      setApplyJobId(null);
      fetchCandidateData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getGoogleCalendarUrl = (intItem: any) => {
    const title = encodeURIComponent(`Interview: ${intItem.jobTitle}`);
    const details = encodeURIComponent(`Scheduled interview with ${intItem.interviewerName}.\nMeeting Link: ${intItem.meetingLink || 'N/A'}`);
    const location = encodeURIComponent(intItem.interviewMode === 0 ? (intItem.meetingLink || 'Online') : 'In-Person (Office)');

    const startDate = new Date(intItem.interviewDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatISO = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatISO(startDate)}/${formatISO(endDate)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return <span className="badge badge-applied">Applied</span>;
      case 2: return <span className="badge badge-shortlisted">Shortlisted</span>;
      case 3: return <span className="badge badge-interview">Interview Scheduled</span>;
      case 4: return <span className="badge badge-selected">Selected</span>;
      case 5: return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge badge-hold">On Hold</span>;
    }
  };

  const filteredJobs = jobs.filter(job => {
    const isNotExpired = new Date(job.closingDate).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0);
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.requiredSkills.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    return isNotExpired && matchesSearch;
  });

  const filteredApplications = myApplications.filter(app => {
        const matchesSearch = (app.job?.title || '').toLowerCase().includes(appSearchTerm.toLowerCase());
    const matchesStatus = appStatusFilter === 'All' || app.status.toString() === appStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Candidate Job Portal</h1>
          <p>Explore career opportunities, submit application profiles, and manage interview schedules</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={fetchCandidateData} disabled={loading} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Candidate KPI Metrics Strip */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h4>Open Opportunities</h4>
            <div className="metric-value">{jobs.length}</div>
            <div className="metric-subtext">Active positions available</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>My Applications</h4>
            <div className="metric-value">{myApplications.length}</div>
            <div className="metric-subtext">Tracked submissions</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Scheduled Interviews</h4>
            <div className="metric-value">{interviews.length}</div>
            <div className="metric-subtext">Upcoming evaluation sessions</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Briefcase className="w-4 h-4" /> Browse Jobs
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'forYou' ? 'active' : ''}`} onClick={() => setActiveTab('forYou')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeTab === 'forYou' ? '#ffffff' : '#059669', fontWeight: 700 }}>
            <Sparkles className="w-4 h-4" style={{ color: activeTab === 'forYou' ? '#a7f3d0' : '#059669' }} /> For You (AI Recommended)
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User className="w-4 h-4" /> My Profile & Resumes
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText className="w-4 h-4" /> Track Applications ({myApplications.length})
          </div>
        </button>
      </div>

      {loading && !applyJobId && activeTab !== 'forYou' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <RefreshCw className="w-6 h-6 animate-spin text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>
      )}

      {/* Tab: Browse Jobs */}
      {activeTab === 'jobs' && (
        <div>
          {/* Job Filter Bar */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1rem', 
            borderRadius: 'var(--radius)', 
            border: '1px solid var(--border-color)',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.1rem',
                height: '1.1rem',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by job title, skills, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredJobs.length}</strong> of {jobs.length} open positions
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No job openings found matching your search.</p>
          ) : (
            <div className="grid-cols-2">
              {filteredJobs.map((job) => {
                const hasApplied = myApplications.some(app => app.jobId === job.id);
                return (
                  <div key={job.id} className="job-card" style={{ textAlign: 'left' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064e3b', margin: 0 }}>{job.title}</h3>
                        <span className="badge badge-applied" style={{ fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{job.employmentType}</span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', margin: '0.5rem 0' }}>
                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>
                          {job.jobRole}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                          Closes: {new Date(job.closingDate).toLocaleDateString()}
                        </span>
                        {job.location && (
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#047857', 
                            background: '#ecfdf5', 
                            border: '1px solid #a7f3d0',
                            padding: '1px 8px',
                            borderRadius: '9999px',
                            fontWeight: 600
                          }}>
                            📍 {job.location}
                          </span>
                        )}
                        {job.organizationId && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrgIdForView(job.organizationId!)}
                            style={{
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              padding: '1px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            <span>View Company Profile</span>
                          </button>
                        )}
                      </div>

                      <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                        {job.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid #d1fae5', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', background: '#f2f9f4', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                        <span style={{ color: '#064e3b', fontWeight: 700 }}>Required Skills:</span>{' '}
                        <span style={{ color: '#047857', fontWeight: 600 }}>{job.requiredSkills}</span>
                      </div>

                      {hasApplied ? (
                        <button className="btn btn-secondary" style={{ width: '100%', cursor: 'not-allowed', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }} disabled>
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>Applied Already</span>
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => handleApplyClick(job.id)} style={{ width: '100%', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', fontWeight: 700 }}>
                          <span>Quick Apply</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: ✨ For You (AI Recommended) */}
      {activeTab === 'forYou' && (
        <div>
          {/* AI Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
            padding: '1.5rem 1.75rem',
            borderRadius: '16px',
            color: '#ffffff',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(2, 44, 34, 0.18)',
            border: '1px solid #a7f3d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '50%',
                background: 'rgba(167, 243, 208, 0.2)',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(167, 243, 208, 0.3)'
              }}>
                <Sparkles className="w-6 h-6" style={{ color: '#a7f3d0' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Gemini AI Career Matchmaker Engine
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem', color: '#a7f3d0', opacity: 0.95, lineHeight: 1.4 }}>
                  Deep semantic AI evaluation of your profile summary, skills, experience, and uploaded CV against open positions.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn"
              onClick={fetchAiRecommendedJobs}
              disabled={loadingAiJobs}
              style={{
                background: '#a7f3d0',
                color: '#022c22',
                fontWeight: 800,
                border: 'none',
                padding: '0.65rem 1.35rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(167, 243, 208, 0.4)'
              }}
            >
              <RefreshCw className={`w-4 h-4 ${loadingAiJobs ? 'animate-spin' : ''}`} />
              <span>Re-Analyze Profile Match</span>
            </button>
          </div>

          {loadingAiJobs ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #d1fae5', boxShadow: '0 4px 14px rgba(2,44,34,0.05)' }}>
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#059669', margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#064e3b', margin: '0 0 0.4rem 0' }}>
                Gemini AI is analyzing your profile...
              </h4>
              <p style={{ color: '#4b5563', fontSize: '0.88rem', margin: 0 }}>
                Evaluating domain synergy, technical skills, and career trajectory against active corporate positions.
              </p>
            </div>
          ) : aiRecommendedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #d1fae5' }}>
              <User className="w-10 h-10 opacity-30 mx-auto mb-2" style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#064e3b', marginBottom: '0.5rem' }}>No AI Job Recommendations Available Yet</h3>
              <p style={{ color: '#4b5563', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                Please complete your <strong>Candidate Profile Parameters</strong> or upload a <strong>Resume / CV</strong> so Gemini AI can generate personalized job matches for you.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('profile')} style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', fontWeight: 700, padding: '0.65rem 1.5rem' }}>
                Complete Profile & Upload Resume
              </button>
            </div>
          ) : (
            <div className="grid-cols-2">
              {aiRecommendedJobs.map(({ job, matchScore, aiRecommendationReason, keySkillMatches, industryFitCategory }) => {
                const hasApplied = myApplications.some(app => app.jobId === job.id);

                return (
                  <div key={job.id} className="job-card" style={{ textAlign: 'left', borderLeftColor: matchScore >= 80 ? '#059669' : '#d97706' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064e3b', margin: 0 }}>{job.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                          <span style={{
                            background: matchScore >= 80 ? '#d1fae5' : '#fffbeb',
                            color: matchScore >= 80 ? '#065f46' : '#b45309',
                            border: matchScore >= 80 ? '1px solid #6ee7b7' : '1px solid #fde68a',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {matchScore}% AI Match
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', margin: '0.5rem 0' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: '#f2f9f4', 
                          color: '#064e3b', 
                          border: '1px solid #d1fae5', 
                          padding: '1px 8px', 
                          borderRadius: '9999px', 
                          fontWeight: 700 
                        }}>
                          {industryFitCategory}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>{job.jobRole}</span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>•</span>
                        <span className="badge badge-applied" style={{ fontSize: '0.72rem', fontWeight: 700 }}>{job.employmentType}</span>
                        {job.location && (
                          <span style={{ fontSize: '0.75rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                            📍 {job.location}
                          </span>
                        )}
                        {job.organizationId && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrgIdForView(job.organizationId!)}
                            style={{
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              padding: '1px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            <span>View Company Profile</span>
                          </button>
                        )}
                      </div>

                      {/* Gemini AI Insights Container */}
                      <div style={{
                        background: '#f2f9f4',
                        border: '1px solid #d1fae5',
                        borderRadius: '10px',
                        padding: '0.8rem 1rem',
                        marginTop: '0.85rem'
                      }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                          <Sparkles className="w-3.5 h-3.5" /> Why Gemini AI Recommended This Job:
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#064e3b', lineHeight: 1.45, fontWeight: 500 }}>
                          {aiRecommendationReason}
                        </p>
                      </div>

                      <p style={{ marginTop: '0.85rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                        {job.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid #d1fae5', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.82rem', background: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                        <span style={{ color: '#064e3b', fontWeight: 700 }}>AI Evaluated Competencies:</span>{' '}
                        <span style={{ color: '#047857', fontWeight: 600 }}>{keySkillMatches || job.requiredSkills}</span>
                      </div>

                      {hasApplied ? (
                        <button className="btn btn-secondary" style={{ width: '100%', cursor: 'not-allowed', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }} disabled>
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>Applied Already</span>
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => handleApplyClick(job.id)} style={{ width: '100%', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', fontWeight: 700 }}>
                          <span>Quick Apply with AI Match</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile & Resumes */}
      {activeTab === 'profile' && (
        <div className="grid-cols-2">
          {/* Candidate Profile Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User className="w-5 h-5 text-primary" /> Profile Parameters
            </h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +1 555-0199"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Chicago, IL"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Professional Summary</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Full-stack developer with 5 years of C# / ASP.NET experience..."
                  value={profile.professionalSummary}
                  onChange={(e) => setProfile({ ...profile, professionalSummary: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Core Skills (Comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. C#, SQL, React, AWS"
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Experience Details</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="List companies, roles, and major projects..."
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Education</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. BS in Computer Science"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Certifications</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. AWS Solutions Architect"
                    value={profile.certifications}
                    onChange={(e) => setProfile({ ...profile, certifications: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://linkedin.com/in/username"
                    value={profile.linkedInUrl}
                    onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Portfolio URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://myportfolio.dev"
                    value={profile.portfolioUrl}
                    onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Profile Parameters
              </button>
            </form>
          </div>

          {/* CV Upload Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload className="w-5 h-5 text-primary" /> Upload Resume/CV
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Supports <strong>.pdf</strong> and <strong>.txt</strong> formats. Uploading will automatically trigger our text parser engine.
              </p>

              <form onSubmit={handleCVUploadSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="file"
                  id="cv-file-input"
                  className="form-control"
                  accept=".pdf,.txt"
                  onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={uploadingCV || !cvFile}>
                  {uploadingCV ? <RefreshCw className="w-4 h-4 animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} /> : 'Scan & Upload'}
                </button>
              </form>
            </div>

            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '1.5rem' }}>My Uploaded Resumes ({cvs.length})</h3>
              {cvs.length === 0 ? (
                <p>No CVs uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cvs.map((cvItem) => (
                    <div key={cvItem.id} style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
                        <FileText className="w-5 h-5 text-accent-cyan" />
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-white)' }}>{cvItem.cvTitle}</strong>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded: {new Date(cvItem.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteCV(cvItem.id)}
                        style={{ padding: '0.4rem', borderRadius: '8px' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Track Applications */}
      {activeTab === 'applications' && (
        <div className="card">
          {/* Upcoming Scheduled Interviews */}
          {interviews.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar className="w-5 h-5 text-accent-cyan" /> Upcoming Scheduled Interviews
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {interviews.map((int) => (
                  <div key={int.id} className="job-card" style={{ borderLeft: '4px solid var(--accent-cyan)', background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', borderLeftWidth: '4px', borderLeftColor: 'var(--accent-cyan)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ color: 'var(--text-white)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{int.jobTitle}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Interviewer: <strong>{int.interviewerName}</strong> | Mode: <strong>{int.interviewMode === 0 ? 'Online (Teams/Meet)' : 'In-Person (Office)'}</strong>
                        </p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-white)' }}>
                          Date & Time: <strong>{new Date(int.interviewDate).toLocaleString()}</strong>
                        </p>
                        {int.meetingLink && (
                          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                            Meeting Link: <a href={int.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>{int.meetingLink}</a>
                          </p>
                        )}
                        <a
                          href={getGoogleCalendarUrl(int)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            marginTop: '0.75rem',
                            textDecoration: 'none',
                            background: 'rgba(66, 133, 244, 0.15)',
                            border: '1px solid rgba(66, 133, 244, 0.4)',
                            color: '#4285F4'
                          }}
                        >
                          <Calendar className="w-4 h-4" /> Add to Google Calendar
                        </a>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>My Application History</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredApplications.length}</strong> of {myApplications.length} records
            </div>
          </div>

          {/* Applications Filter Toolbar */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1.5rem', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1rem', 
            borderRadius: 'var(--radius)', 
            border: '1px solid var(--border-color)',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.1rem',
                height: '1.1rem',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                className="form-control"
                placeholder="Filter by job title..."
                value={appSearchTerm}
                onChange={(e) => setAppSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div style={{ minWidth: '200px' }}>
              <select
                className="form-control"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="All">All Application Statuses</option>
                <option value="1">Applied</option>
                <option value="2">Shortlisted</option>
                <option value="3">Interview Scheduled</option>
                <option value="4">Selected</option>
                <option value="5">Rejected</option>
                <option value="6">On Hold</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <p style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>No application records match your filter criteria.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Resume Used</th>
                    <th>Date Applied</th>
                    <th>AI Match Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                        {app.job?.title || `Job ID: ${app.jobId}`}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText className="w-4 h-4 text-accent-cyan" />
                          <span>{app.candidateCV?.cvTitle || `CV ID: ${app.candidateCVId}`}</span>
                        </span>
                      </td>
                      <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            fontWeight: 600,
                            color: app.matchScore >= 70 ? 'var(--success)' : app.matchScore >= 40 ? 'var(--warning)' : 'var(--danger)'
                          }}>{app.matchScore}%</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match</span>
                        </div>
                      </td>
                      <td>{getStatusText(app.status)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                          onClick={() => setActiveChatApp({ id: app.id, jobTitle: app.job?.title || 'Position', candidateName: 'You' })}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Hiring Team</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Apply Selection Modal */}
      {applyJobId !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '440px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Submit Application</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Select which uploaded resume to use for applying to this position:
            </p>

            <form onSubmit={handleApplySubmit}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Choose CV / Resume *</label>
                <select
                  className="form-control"
                  value={applyCVId}
                  onChange={(e) => setApplyCVId(e.target.value)}
                  required
                >
                  {cvs.map((cvItem) => (
                    <option key={cvItem.id} value={cvItem.id}>{cvItem.cvTitle}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setApplyJobId(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Send className="w-4 h-4" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Chat Messenger Modal */}
      {activeChatApp && (
        <ChatMessengerModal
          token={token}
          applicationId={activeChatApp.id}
          jobTitle={activeChatApp.jobTitle}
          candidateName={activeChatApp.candidateName}
          onClose={() => setActiveChatApp(null)}
        />
      )}

      {/* Organization Profile Modal */}
      {selectedOrgIdForView && (
        <OrganizationProfileModal
          organizationId={selectedOrgIdForView}
          onClose={() => setSelectedOrgIdForView(null)}
          onApplyClick={(jobId) => handleApplyClick(jobId)}
        />
      )}
    </div>
  );
};
