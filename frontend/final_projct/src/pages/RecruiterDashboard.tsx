import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, Calendar, Plus, RefreshCw, FileText, 
  CheckCircle, XCircle, ExternalLink, MapPin, Search, MessageSquare, User, Building2
} from 'lucide-react';
import { ChatMessengerModal } from '../components/ChatMessengerModal';
import { CandidateProfileModal } from '../components/CandidateProfileModal';
import { OrganizationManagementModal } from '../components/OrganizationManagementModal';

interface RecruiterDashboardProps {
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
  location: string;
  closingDate: string;
  departmentId: number;
}


interface CandidateCV {
  id: number;
  cvTitle: string;
  filePath: string;
  extractedText: string;
}


interface Application {
  id: number;
  candidateId: number;
  candidate?: {
    fullName: string;
    email: string;
  };
  jobId: number;
  job?: Job;
  candidateCVId: number;
  candidateCV?: CandidateCV;
  status: number; // 0 = Applied, 1 = Shortlisted, 2 = InterviewScheduled, 3 = Selected, 4 = Rejected, 5 = OnHold
  matchScore: number;
  appliedAt: string;
}

interface Department {
  id: number;
  name: string;
  organizationId: number;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ token, showToast }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'interviews'>('jobs');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);

  // Job Creation Form
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [jobRoleType, setJobRoleType] = useState('Developer');
  const [jobEmployType, setJobEmployType] = useState('FullTime');
  const [jobLocation, setJobLocation] = useState('');
  const [jobClosingDate, setJobClosingDate] = useState('');
  const [jobDeptId, setJobDeptId] = useState('');

  // Interview Schedule Form Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewMode, setInterviewMode] = useState('0'); // 0 = Online, 1 = InPerson
  const [meetingLink, setMeetingLink] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [allSystemInterviews, setAllSystemInterviews] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Active Chat State
  const [activeChatApp, setActiveChatApp] = useState<{ id: number; jobTitle: string; candidateName: string } | null>(null);

  // Candidate Profile Inspector State
  const [inspectProfileData, setInspectProfileData] = useState<{
    candidateUserId: number;
    candidateName: string;
    candidateEmail: string;
    resumeCvId?: number;
    applicationId?: number;
    jobTitle?: string;
  } | null>(null);

  // Table Filters
  const [appJobFilter, setAppJobFilter] = useState('All');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appScoreFilter, setAppScoreFilter] = useState('All');
  const [appCandidateSearch, setAppCandidateSearch] = useState('');

  const [intManagerFilter, setIntManagerFilter] = useState('All');
  const [intModeFilter, setIntModeFilter] = useState('All');
  const [intSearchTerm, setIntSearchTerm] = useState('');

  // Organization Profile Management State
  const [showOrgModal, setShowOrgModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRecruiterData();
  }, [token]);

  // Decode basic info from token if possible or fetch
  const fetchRecruiterData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch organization jobs for this recruiter
      const jobsRes = await fetch('http://localhost:5163/api/jobs/my-organization', { headers });
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // 2. Fetch departments
      const deptsRes = await fetch('http://localhost:5163/api/admin/departments', { headers });
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }

      // 3. Fetch organizations (needed for display)
      const orgsRes = await fetch('http://localhost:5163/api/admin/organizations', { headers });
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData);
      }

      // 4. Fetch applications for recruiter's scope
      const appsRes = await fetch('http://localhost:5163/api/applications', { headers });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }

      // 5. Fetch scheduled interviews (calendar)
      const calendarRes = await fetch('http://localhost:5163/api/interviews/my-calendar', { headers });
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json();
        setInterviews(calendarData);
      }
    } catch (err) {
      showToast('Error loading recruiter metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobSkills || !jobDeptId || !jobClosingDate) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const payload = {
      title: jobTitle,
      description: jobDescription,
      requiredSkills: jobSkills,
      jobRole: jobRoleType,
      employmentType: jobEmployType,
      location: jobLocation,
      closingDate: jobClosingDate,
      departmentId: parseInt(jobDeptId)
    };

    try {
      const response = await fetch('http://localhost:5163/api/jobs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to create job');
      }

      showToast('Job listing published successfully!', 'success');
      setJobTitle('');
      setJobDescription('');
      setJobSkills('');
      setJobLocation('');
      setJobClosingDate('');
      setJobDeptId('');
      fetchRecruiterData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleShortlist = async (appId: number) => {
    try {
      const response = await fetch(`http://localhost:5163/api/applications/${appId}/shortlist`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Shortlisting failed');
      showToast('Application shortlisted successfully!', 'success');
      fetchRecruiterData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (appId: number) => {
    try {
      // 5 = Rejected status in backend ApplicationStatus enum
      const response = await fetch(`http://localhost:5163/api/applications/${appId}/decision?decision=5`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Rejection failed');
      showToast('Application rejected', 'success');
      fetchRecruiterData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchDepartmentManagers = async (deptId?: number) => {
    try {
      const url = deptId 
        ? `http://localhost:5163/api/admin/hiring-managers?departmentId=${deptId}`
        : `http://localhost:5163/api/admin/hiring-managers`;
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
        if (data.length > 0) {
          setSelectedManagerId(data[0].id.toString());
        } else {
          setSelectedManagerId('');
        }
      }
    } catch {
      showToast('Error loading managers for department', 'error');
    }
  };

  const fetchAllInterviews = async () => {
    try {
      const response = await fetch('http://localhost:5163/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllSystemInterviews(data);
      }
    } catch (err) {
      console.error("Error loading system interviews", err);
    }
  };

  const handleOpenScheduleModal = (app: Application) => {
    setSelectedApp(app);
    setInterviewDate('');
    setInterviewMode('0');
    // Pre-populate with mock Google Meet link
    setMeetingLink('https://meet.google.com/' + Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5));
    setSelectedManagerId('');
    setManagers([]);
    fetchDepartmentManagers(app.job?.departmentId);
    fetchAllInterviews();
    setCurrentMonth(new Date());
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const daysGrid: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      daysGrid.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      daysGrid.push(new Date(year, month, d));
    }
    
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const managerInterviews = allSystemInterviews.filter(
      (i) => i.interviewerId === parseInt(selectedManagerId)
    );

    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-white)', textTransform: 'capitalize' }}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h4>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            >
              &lt; Prev
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            >
              Next &gt;
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '0.5rem' }}>
          {weekdays.map((w) => (
            <span key={w} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{w}</span>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {daysGrid.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} style={{ minHeight: '55px', background: 'transparent' }} />;
            }
            
            const dayInterviews = managerInterviews.filter((i) => {
              const intDate = new Date(i.interviewDate);
              return (
                intDate.getFullYear() === day.getFullYear() &&
                intDate.getMonth() === day.getMonth() &&
                intDate.getDate() === day.getDate()
              );
            });
            
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
              <div 
                key={day.toISOString()} 
                style={{
                  minHeight: '60px',
                  background: isToday ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.01)',
                  border: isToday ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => {
                  const formattedDate = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0') + 'T10:00';
                  setInterviewDate(formattedDate);
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {day.getDate()}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', overflow: 'hidden' }}>
                  {dayInterviews.map((int) => {
                    const timeStr = new Date(int.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div 
                        key={int.id} 
                        style={{
                          fontSize: '0.6rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          padding: '1px 2px',
                          borderRadius: '3px',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                        title={`${timeStr} - ${int.application?.candidate?.fullName || 'Candidate'}`}
                      >
                        {timeStr}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !interviewDate) return;
    if (!selectedManagerId) {
      showToast('Please assign a hiring manager from the department to conduct the interview', 'error');
      return;
    }

    const payload = {
      applicationId: selectedApp.id,
      interviewerId: parseInt(selectedManagerId),
      interviewDate: interviewDate,
      interviewMode: parseInt(interviewMode),
      meetingLink: meetingLink
    };

    try {
      const response = await fetch('http://localhost:5163/api/interviews/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to schedule interview');
      }

      showToast(`Interview scheduled and assigned to manager successfully!`, 'success');
      setSelectedApp(null);
      fetchRecruiterData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
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

  const filteredApplications = applications.filter((app: Application) => {
    const matchesJob = appJobFilter === 'All' || app.jobId.toString() === appJobFilter;
    const matchesStatus = appStatusFilter === 'All' || app.status.toString() === appStatusFilter;
    const matchesSearch = (app.candidate?.fullName || '').toLowerCase().includes(appCandidateSearch.toLowerCase());
    
    let matchesScore = true;
    if (appScoreFilter === 'High') matchesScore = app.matchScore >= 70;
    else if (appScoreFilter === 'Medium') matchesScore = app.matchScore >= 40 && app.matchScore < 70;
    else if (appScoreFilter === 'Low') matchesScore = app.matchScore < 40;

    return matchesJob && matchesStatus && matchesSearch && matchesScore;
  });

  const filteredInterviews = interviews.filter((int: any) => {
    const matchesManager = intManagerFilter === 'All' || int.interviewerName === intManagerFilter;
    const matchesMode = intModeFilter === 'All' || int.interviewMode.toString() === intModeFilter;
    const matchesSearch = (int.candidateName || '').toLowerCase().includes(intSearchTerm.toLowerCase()) ||
                          (int.jobTitle || '').toLowerCase().includes(intSearchTerm.toLowerCase());
    return matchesManager && matchesMode && matchesSearch;
  });

  return (
    <div className="container" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Recruitment Console</h1>
          <p>Publish job openings, review candidate submissions, and organize interviews</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowOrgModal(true)} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 }}>
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Company Profile</span>
          </button>
          <button className="btn btn-secondary" onClick={fetchRecruiterData} disabled={loading} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h4>Active Job Openings</h4>
            <div className="metric-value">{jobs.length}</div>
            <div className="metric-subtext">Published across organization</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Candidate Submissions</h4>
            <div className="metric-value">{applications.length}</div>
            <div className="metric-subtext">Total received applications</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Scheduled Interviews</h4>
            <div className="metric-value">{interviews.length}</div>
            <div className="metric-subtext">Active manager sessions</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Selected Candidates</h4>
            <div className="metric-value">
              {applications.filter(a => a.status === 4).length}
            </div>
            <div className="metric-subtext">Offers / Selections made</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Briefcase className="w-4 h-4" /> Manage Jobs
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users className="w-4 h-4" /> Candidate Applications ({applications.length})
          </div>
        </button>
        <button className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => setActiveTab('interviews')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar className="w-4 h-4" /> Scheduled Interviews ({interviews.length})
          </div>
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <RefreshCw className="w-6 h-6 animate-spin text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>
      )}

      {/* Tab: Post/Manage Jobs */}
      {activeTab === 'jobs' && (
        <div className="grid-cols-2">
          {/* Post Job Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus className="w-5 h-5 text-primary" /> Post New Opening
            </h3>
            <form onSubmit={handlePostJob}>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Dotnet Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills Required * (Comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. C#, SQL Server, ASP.NET Core, React"
                  value={jobSkills}
                  onChange={(e) => setJobSkills(e.target.value)}
                  required
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Role Category</label>
                  <select
                    className="form-control"
                    value={jobRoleType}
                    onChange={(e) => setJobRoleType(e.target.value)}
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Manager">Manager</option>
                    <option value="QA">Quality Assurance</option>
                    <option value="HR">HR / Recruiter</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Employment Type</label>
                  <select
                    className="form-control"
                    value={jobEmployType}
                    onChange={(e) => setJobEmployType(e.target.value)}
                  >
                    <option value="FullTime">Full Time</option>
                    <option value="PartTime">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Department *</label>
                  <select
                    className="form-control"
                    value={jobDeptId}
                    onChange={(e) => setJobDeptId(e.target.value)}
                    required
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept) => {
                      const orgName = organizations.find(o => o.id === dept.organizationId)?.name || 'Unknown Org';
                      return (
                        <option key={dept.id} value={dept.id}>{dept.name} ({orgName})</option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Closing Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={jobClosingDate}
                    onChange={(e) => setJobClosingDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Job Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Remote / Chicago office"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Job Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Outline job responsibilities, experience needed, benefits..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Publish Job Listing
              </button>
            </form>
          </div>

          {/* Jobs List */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Active Job Listings</h3>
            {jobs.length === 0 ? (
              <p>No job openings created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map((job) => {
                  const dept = departments.find(d => d.id === job.departmentId);
                  return (
                    <div key={job.id} className="job-card" style={{ textAlign: 'left' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '1.1rem' }}>{job.title}</h4>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {new Date(job.closingDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? (
                              <span className="badge badge-rejected" style={{ fontSize: '0.75rem' }}>Closed (Expired)</span>
                            ) : (
                              <span className="badge badge-shortlisted" style={{ fontSize: '0.75rem' }}>Open</span>
                            )}
                            <span className="badge badge-applied" style={{ fontSize: '0.75rem' }}>{job.employmentType}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Department: {dept?.name || '—'} | Role: {job.jobRole}
                        </p>
                        {job.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {job.description || 'No description provided.'}
                        </p>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Skills: </span>
                        <code style={{ fontSize: '0.75rem' }}>{job.requiredSkills}</code>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Candidate Applications */}
      {activeTab === 'applications' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Incoming Job Applications</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredApplications.length}</strong> of {applications.length} applications
            </div>
          </div>

          {/* Applications Filter Bar */}
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
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
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
                placeholder="Search candidate name..."
                value={appCandidateSearch}
                onChange={(e) => setAppCandidateSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={appJobFilter}
                onChange={(e) => setAppJobFilter(e.target.value)}
              >
                <option value="All">All Job Postings</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '170px' }}>
              <select
                className="form-control"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="1">Applied</option>
                <option value="2">Shortlisted</option>
                <option value="3">Interview Scheduled</option>
                <option value="4">Selected</option>
                <option value="5">Rejected</option>
                <option value="6">On Hold</option>
              </select>
            </div>

            <div style={{ minWidth: '170px' }}>
              <select
                className="form-control"
                value={appScoreFilter}
                onChange={(e) => setAppScoreFilter(e.target.value)}
              >
                <option value="All">All AI Match Scores</option>
                <option value="High">High Match (≥ 70%)</option>
                <option value="Medium">Medium Match (40%-69%)</option>
                <option value="Low">Low Match (&lt; 40%)</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <p style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>No applications match the selected filter criteria.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job Applied</th>
                    <th>Candidate</th>
                    <th>Email</th>
                    <th>CV / Resume</th>
                    <th>AI Match Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-white)' }}>
                        {app.job?.title || `Job ID: ${app.jobId}`}
                      </td>
                      <td>{app.candidate?.fullName || `Candidate ID: ${app.candidateId}`}</td>
                      <td>{app.candidate?.email || '—'}</td>
                      <td>
                        {app.candidateCV ? (
                          <a 
                            href={`http://localhost:5163/api/candidate-cv/${app.candidateCV.id}/download?token=${token}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={async (e) => {
                              e.preventDefault();
                              const cvId = app.candidateCV?.id;
                              if (!cvId) return;
                              try {
                                const res = await fetch(`http://localhost:5163/api/candidate-cv/${cvId}/download`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = `${(app.candidate?.fullName || 'Candidate').replace(/\s+/g, '_')}_CV`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(blobUrl);
                                }
                              } catch (err) {
                                console.error("Fetch download fallback error", err);
                              }
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 text-accent-cyan" />
                            <span>{app.candidateCV.cvTitle || 'View Resume'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No Resume</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ 
                            flex: 1, 
                            height: '6px', 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '99px',
                            minWidth: '50px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${app.matchScore}%`, 
                              height: '100%', 
                              background: app.matchScore >= 70 ? 'var(--success)' : app.matchScore >= 40 ? 'var(--warning)' : 'var(--danger)'
                            }} />
                          </div>
                          <span style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600,
                            color: app.matchScore >= 70 ? 'var(--success)' : app.matchScore >= 40 ? 'var(--warning)' : 'var(--danger)'
                          }}>{app.matchScore}%</span>
                        </div>
                      </td>
                      <td>{getStatusText(app.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {app.status === 1 && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleShortlist(app.id)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Shortlist</span>
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => handleReject(app.id)}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {app.status === 2 && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleOpenScheduleModal(app)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Schedule</span>
                            </button>
                          )}

                          {app.status > 2 && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Process Active
                            </span>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#f2f9f4', color: '#064e3b', border: '1px solid #d1fae5' }}
                            onClick={() => setInspectProfileData({
                              candidateUserId: app.candidateId,
                              candidateName: app.candidate?.fullName || 'Candidate',
                              candidateEmail: app.candidate?.email || 'Candidate Email',
                              resumeCvId: app.candidateCV?.id || app.candidateCVId,
                              applicationId: app.id,
                              jobTitle: app.job?.title || 'Position'
                            })}
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                            onClick={() => setActiveChatApp({ id: app.id, jobTitle: app.job?.title || 'Position', candidateName: app.candidate?.fullName || 'Candidate' })}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Live Chat</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Scheduled Interviews */}
      {activeTab === 'interviews' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Recruitment Interview Calendar</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredInterviews.length}</strong> of {interviews.length} interviews
            </div>
          </div>

          {/* Scheduled Interviews Filter Bar */}
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
                placeholder="Search candidate or job..."
                value={intSearchTerm}
                onChange={(e) => setIntSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={intManagerFilter}
                onChange={(e) => setIntManagerFilter(e.target.value)}
              >
                <option value="All">All Hiring Managers</option>
                {Array.from(new Set(interviews.map(i => i.interviewerName).filter(Boolean))).map(mgr => (
                  <option key={mgr} value={mgr}>{mgr}</option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '160px' }}>
              <select
                className="form-control"
                value={intModeFilter}
                onChange={(e) => setIntModeFilter(e.target.value)}
              >
                <option value="All">All Modes</option>
                <option value="0">Online (Teams/Meet)</option>
                <option value="1">In-Person (Office)</option>
              </select>
            </div>
          </div>

          {filteredInterviews.length === 0 ? (
            <p style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>No interviews match the filter criteria.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job Opening</th>
                    <th>Candidate</th>
                    <th>Interviewer (Manager)</th>
                    <th>Date & Time</th>
                    <th>Mode</th>
                    <th>Meeting Connection</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((int) => (
                    <tr key={int.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{int.jobTitle}</td>
                      <td>{int.candidateName}</td>
                      <td>{int.interviewerName}</td>
                      <td>{new Date(int.interviewDate).toLocaleString()}</td>
                      <td>
                        {int.interviewMode === 0 ? (
                          <span style={{ color: 'var(--accent-cyan)' }}>Online</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>In-Person</span>
                        )}
                      </td>
                      <td>
                        {int.meetingLink ? (
                          <a href={int.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>Connect Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Interview Schedule Modal */}
      {selectedApp && (
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
          <div className="card" style={{ width: '95%', maxWidth: '980px', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Schedule Interview & Check Availability</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Candidate: <strong>{selectedApp.candidate?.fullName}</strong> for position <strong>{selectedApp.job?.title}</strong>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
              {/* Left Column: Form */}
              <form onSubmit={handleScheduleInterviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Assign Hiring Manager (Interviewer) *</label>
                  <select
                    className="form-control"
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    required
                  >
                    <option value="">Select Department Manager...</option>
                    {managers.map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>{mgr.fullName} ({mgr.email})</option>
                    ))}
                  </select>
                  {managers.length === 0 && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      ⚠️ Warning: No Hiring Managers found for this job's department!
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Interview Mode</label>
                  <select
                    className="form-control"
                    value={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.value)}
                  >
                    <option value="0">Online (Microsoft Teams / Google Meet)</option>
                    <option value="1">In-Person (Office Headquarters)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting URL (Auto-generated mock link)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedApp(null)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Schedule Event
                  </button>
                </div>
              </form>

              {/* Right Column: Calendar Check */}
              <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-white)' }}>
                  Interviewer Calendar Availability
                </h4>
                {selectedManagerId ? (
                  renderCalendar()
                ) : (
                  <div style={{
                    height: '300px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    padding: '2rem',
                    textAlign: 'center'
                  }}>
                    <span>Select a Hiring Manager on the left to review their calendar availability and scheduled interviews.</span>
                  </div>
                )}
              </div>
            </div>
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

      {/* Candidate Profile Inspector Modal */}
      {inspectProfileData && (
        <CandidateProfileModal
          token={token}
          candidateUserId={inspectProfileData.candidateUserId}
          candidateName={inspectProfileData.candidateName}
          candidateEmail={inspectProfileData.candidateEmail}
          resumeCvId={inspectProfileData.resumeCvId}
          applicationId={inspectProfileData.applicationId}
          jobTitle={inspectProfileData.jobTitle}
          onClose={() => setInspectProfileData(null)}
          onOpenChat={(appId, jTitle, cName) => setActiveChatApp({ id: appId, jobTitle: jTitle, candidateName: cName })}
        />
      )}

      {/* Organization Profile Management Modal */}
      {showOrgModal && (
        <OrganizationManagementModal
          token={token}
          onClose={() => setShowOrgModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
