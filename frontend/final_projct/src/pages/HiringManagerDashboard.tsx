import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, RefreshCw, MessageSquare, Award, FileText, 
  ExternalLink, Search, Mail, Send, CheckCircle, XCircle, Clock, User, Building2
} from 'lucide-react';
import { ChatMessengerModal } from '../components/ChatMessengerModal';
import { CandidateProfileModal } from '../components/CandidateProfileModal';
import { OrganizationManagementModal } from '../components/OrganizationManagementModal';

interface HiringManagerDashboardProps {
  token: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

interface Job {
  id: number;
  title: string;
  requiredSkills: string;
  location: string;
}

interface User {
  fullName: string;
  email: string;
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
  candidate?: User;
  jobId: number;
  job?: Job;
  candidateCVId: number;
  candidateCV?: CandidateCV;
}

interface Interview {
  id: number;
  applicationId: number;
  application?: Application;
  interviewDate: string;
  interviewMode: number; // 0 = Online, 1 = InPerson
  meetingLink: string;
  feedback: string;
  decision: number; // 0 = Pending, 1 = Selected, 2 = Rejected, 3 = OnHold
}

export const HiringManagerDashboard: React.FC<HiringManagerDashboardProps> = ({ token, showToast }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Feedback Form Modal State
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [decisionChoice, setDecisionChoice] = useState('2'); // 2 = Selected, 3 = Rejected, 4 = OnHold (from backend HiringDecision enum)
  const [enhancingAI, setEnhancingAI] = useState(false);

  // Email Compose Modal State
  const [emailModalInterview, setEmailModalInterview] = useState<Interview | null>(null);
  const [emailTemplateType, setEmailTemplateType] = useState<'Selected' | 'Rejected' | 'OnHold'>('Selected');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

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
  const [decisionFilter, setDecisionFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Organization Profile Management State
  const [showOrgModal, setShowOrgModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInterviews();
  }, [token]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5163/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load interviews list');
      const data = await response.json();
      setInterviews(data);
    } catch (err: any) {
      showToast(err.message || 'Error loading interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedbackModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setFeedbackText(interview.feedback || '');
    setDecisionChoice(interview.decision === 1 ? '2' : interview.decision.toString());
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview || !feedbackText) {
      showToast('Please enter feedback text', 'error');
      return;
    }

    // API puts feedback in query param, decision choice in body:
    // e.g. PUT /api/interviews/{id}/feedback?feedback={feedbackText}
    // Body: decision (number)
    try {
      const response = await fetch(
        `http://localhost:5163/api/interviews/${selectedInterview.id}/feedback?feedback=${encodeURIComponent(feedbackText)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(parseInt(decisionChoice)),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to submit feedback');
      }

      showToast('Hiring feedback and decision submitted successfully!', 'success');
      setSelectedInterview(null);
      fetchInterviews();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredInterviews = interviews.filter(int => {
    const matchesDecision = decisionFilter === 'All' || int.decision.toString() === decisionFilter;
    const matchesMode = modeFilter === 'All' || int.interviewMode.toString() === modeFilter;
    const matchesSearch = (int.application?.candidate?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (int.application?.job?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDecision && matchesMode && matchesSearch;
  });

  const getDecisionText = (decision: number) => {
    // 1 = Pending, 2 = Selected, 3 = Rejected, 4 = OnHold
    switch (decision) {
      case 1: return <span className="badge badge-applied">Pending Decision</span>;
      case 2: return <span className="badge badge-selected">Selected</span>;
      case 3: return <span className="badge badge-rejected">Rejected</span>;
      case 4: return <span className="badge badge-hold">Put on Hold</span>;
      default: return <span className="badge badge-applied">Pending Decision</span>;
    }
  };

  const handleEnhanceFeedbackAI = async () => {
    if (!feedbackText.trim() || !selectedInterview) {
      showToast('Please enter your raw feedback notes first.', 'error');
      return;
    }
    setEnhancingAI(true);
    try {
      const response = await fetch('http://localhost:5163/api/interviews/enhance-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rawNotes: feedbackText,
          candidateName: selectedInterview.application?.candidate?.fullName || 'Candidate',
          jobTitle: selectedInterview.application?.job?.title || 'Position'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enhancedFeedback) {
          setFeedbackText(data.enhancedFeedback);
          showToast('Feedback polished successfully with Gemini AI!', 'success');
        }
      } else {
        const errText = await response.text();
        showToast(`AI error: ${errText}`, 'error');
      }
    } catch (err) {
      console.error("Error calling AI enhance endpoint", err);
      showToast('Error enhancing feedback with AI.', 'error');
    } finally {
      setEnhancingAI(false);
    }
  };

  const openEmailModal = (interview: Interview, defaultType: 'Selected' | 'Rejected' | 'OnHold' = 'Selected') => {
    setEmailModalInterview(interview);
    applyEmailTemplate(defaultType, interview);
  };

  const applyEmailTemplate = (type: 'Selected' | 'Rejected' | 'OnHold', interview: Interview) => {
    setEmailTemplateType(type);
    const candidateName = interview.application?.candidate?.fullName || 'Candidate';
    const jobTitle = interview.application?.job?.title || 'Position';
    const orgName = 'Our Organization';

    if (type === 'Selected') {
      setEmailSubject(`Congratulations! Selected for ${jobTitle} Position`);
      setEmailBody(
`Dear ${candidateName},

We are thrilled to inform you that following your interview evaluation, you have been SELECTED for the ${jobTitle} position at ${orgName}!

Our HR recruitment team will be in touch with you shortly regarding your formal offer details, onboarding timeline, and next steps.

Congratulations once again on your outstanding performance throughout the evaluation process!

Best regards,
Hiring Panel & Executive Committee`
      );
    } else if (type === 'Rejected') {
      setEmailSubject(`Application Update: ${jobTitle} Position`);
      setEmailBody(
`Dear ${candidateName},

Thank you for taking the time to interview for the ${jobTitle} position with us.

After careful evaluation of all interviewed candidates, we regret to inform you that we have decided to proceed with another applicant whose background more closely matches our immediate requirements for this role.

We sincerely appreciate the time and effort you invested in our recruitment process and wish you all the best in your professional journey.

Best regards,
Hiring Panel & Executive Committee`
      );
    } else {
      setEmailSubject(`Application Status Update: ${jobTitle}`);
      setEmailBody(
`Dear ${candidateName},

Thank you for participating in your recent evaluation interview for the ${jobTitle} position.

We are writing to let you know that your application is currently ON HOLD as we complete final evaluations for remaining candidates. We anticipate finalizing our hiring decision shortly and will share an update with you as soon as possible.

Thank you for your continued patience.

Best regards,
Hiring Panel & Executive Committee`
      );
    }
  };

  const handleSendCandidateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalInterview) return;
    setSendingEmail(true);
    try {
      const response = await fetch('http://localhost:5163/api/interviews/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId: emailModalInterview.applicationId,
          decisionType: emailTemplateType,
          subject: emailSubject,
          body: emailBody
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || 'Real candidate email sent successfully via SMTP!', 'success');
        setEmailModalInterview(null);
      } else {
        const errText = await response.text();
        showToast(`Email dispatch error: ${errText}`, 'error');
      }
    } catch (err) {
      console.error("Error sending email to candidate", err);
      showToast('Error sending candidate email via SMTP.', 'error');
    } finally {
      setSendingEmail(false);
    }
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

    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar className="w-5 h-5 text-primary" /> Monthly Interview Schedule
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-white)', textTransform: 'capitalize' }}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
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
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '0.5rem' }}>
          {weekdays.map((w) => (
            <span key={w} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{w}</span>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {daysGrid.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} style={{ minHeight: '80px', background: 'transparent' }} />;
            }
            
            const dayInterviews = interviews.filter((i) => {
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
                  minHeight: '80px',
                  background: isToday ? 'rgba(var(--primary-rgb), 0.08)' : 'rgba(255,255,255,0.01)',
                  border: isToday ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isToday ? 'var(--accent-cyan)' : 'var(--text-muted)', textAlign: 'left' }}>
                  {day.getDate()}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  {dayInterviews.map((int) => {
                    const timeStr = new Date(int.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const isEvaluated = int.decision !== 1;
                    return (
                      <div 
                        key={int.id} 
                        style={{
                          fontSize: '0.7rem',
                          background: isEvaluated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isEvaluated ? 'var(--success)' : '#60a5fa',
                          border: isEvaluated ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onClick={() => handleOpenFeedbackModal(int)}
                        title={`Click to evaluate: ${timeStr} - ${int.application?.candidate?.fullName || 'Candidate'}`}
                      >
                        {timeStr} - {int.application?.candidate?.fullName || 'Candidate'}
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

  return (
    <div className="container" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Hiring Panel</h1>
          <p>Review scheduled interviews, evaluate candidate profiles, and input selection feedback</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowOrgModal(true)} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 }}>
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Company Profile</span>
          </button>
          <button className="btn btn-secondary" onClick={fetchInterviews} disabled={loading} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Manager KPI Metrics Strip */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h4>Assigned Interviews</h4>
            <div className="metric-value">{interviews.length}</div>
            <div className="metric-subtext">Total candidate sessions</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Pending Evaluations</h4>
            <div className="metric-value">
              {interviews.filter(i => i.decision === 0).length}
            </div>
            <div className="metric-subtext">Awaiting assessment feedback</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Evaluations Completed</h4>
            <div className="metric-value">
              {interviews.filter(i => i.decision !== 0).length}
            </div>
            <div className="metric-subtext">Hiring decisions submitted</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <RefreshCw className="w-6 h-6 animate-spin text-primary" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>
      )}

      {/* Monthly Calendar Grid */}
      {!loading && renderCalendar()}

      {/* Interviews List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar className="w-5 h-5 text-primary" /> Interview Schedule
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredInterviews.length}</strong> of {interviews.length} assigned interviews
          </div>
        </div>

        {/* Interviews Filter Bar */}
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
              placeholder="Search candidate name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-control"
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
            >
              <option value="All">All Hiring Decisions</option>
              <option value="0">Pending Evaluation</option>
              <option value="1">Selected</option>
              <option value="2">Rejected</option>
              <option value="3">On Hold</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="All">All Modes</option>
              <option value="0">Online Teams/Meet</option>
              <option value="1">In-Person Office</option>
            </select>
          </div>
        </div>
        
        {filteredInterviews.length === 0 ? (
          <p style={{ padding: '1.5rem 0', color: 'var(--text-muted)' }}>No interviews match the selected criteria.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Interview Date</th>
                  <th>Candidate</th>
                  <th>Candidate CV</th>
                  <th>Job Opening</th>
                  <th>Mode / Location</th>
                  <th>Meeting Connection</th>
                  <th>Feedback Given</th>
                  <th>Hiring Decision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((int) => (
                  <tr key={int.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                      {new Date(int.interviewDate).toLocaleString()}
                    </td>
                    <td>
                      {int.application?.candidate?.fullName || '—'}
                    </td>
                    <td>
                      {(int.application?.candidateCV?.id || int.application?.candidateCVId) ? (
                        <a 
                          href={`http://localhost:5163/api/candidate-cv/${int.application?.candidateCV?.id || int.application?.candidateCVId}/download`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <FileText className="w-3.5 h-3.5 text-accent-cyan" />
                          <span>View Resume</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No Resume</span>
                      )}
                    </td>
                    <td>
                      {int.application?.job?.title || '—'}
                    </td>
                    <td>
                      {int.interviewMode === 0 ? (
                        <span style={{ color: 'var(--accent-cyan)' }}>Online Teams/Meet</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>In-Person Office</span>
                      )}
                    </td>
                    <td>
                      {int.meetingLink ? (
                        <a 
                          href={int.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                        >
                          <span>Connect Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {int.feedback || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None submitted</span>}
                    </td>
                    <td>{getDecisionText(int.decision)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setInspectProfileData({
                            candidateUserId: int.application?.candidateId || 0,
                            candidateName: int.application?.candidate?.fullName || 'Candidate',
                            candidateEmail: int.application?.candidate?.email || 'Candidate Email',
                            resumeCvId: int.application?.candidateCV?.id || int.application?.candidateCVId,
                            applicationId: int.applicationId,
                            jobTitle: int.application?.job?.title || 'Position'
                          })}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f2f9f4', color: '#064e3b', border: '1px solid #d1fae5' }}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleOpenFeedbackModal(int)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{int.decision === 1 ? 'Evaluate' : 'Edit Decision'}</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                          onClick={() => openEmailModal(int, int.decision === 2 ? 'Selected' : int.decision === 3 ? 'Rejected' : int.decision === 4 ? 'OnHold' : 'Selected')}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Email</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                          onClick={() => setActiveChatApp({ id: int.applicationId, jobTitle: int.application?.job?.title || 'Position', candidateName: int.application?.candidate?.fullName || 'Candidate' })}
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

      {/* Feedback Submission Modal */}
      {selectedInterview && (
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
          <div className="card" style={{ width: '90%', maxWidth: '500px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Submit Interview Assessment</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Candidate: <strong>{selectedInterview.application?.candidate?.fullName}</strong> for position <strong>{selectedInterview.application?.job?.title}</strong>
            </p>

            {/* Resume preview helper */}
            {selectedInterview.application?.candidateCV && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText className="w-4.5 h-4.5 text-accent-cyan" />
                  <span style={{ fontSize: '0.85rem' }}>{selectedInterview.application.candidateCV.cvTitle}</span>
                </div>
                <a 
                  href={`http://localhost:5163/api/candidate-cv/${selectedInterview.application?.candidateCV?.id || selectedInterview.application?.candidateCVId}/download?token=${token}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary" 
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  onClick={async (e) => {
                    e.preventDefault();
                    const cvId = selectedInterview.application?.candidateCV?.id || selectedInterview.application?.candidateCVId;
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
                        link.download = `${(selectedInterview.application?.candidate?.fullName || 'Candidate').replace(/\s+/g, '_')}_CV`;
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
                  <span>Open CV / Resume</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label className="form-label">Hiring Decision Option *</label>
                <select
                  className="form-control"
                  value={decisionChoice}
                  onChange={(e) => setDecisionChoice(e.target.value)}
                  required
                >
                  <option value="2">Selected (Approve candidate for hire)</option>
                  <option value="3">Rejected (Do not proceed with candidate)</option>
                  <option value="4">On Hold (Keep application open for review)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Interview Assessment & Performance Feedback *</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleEnhanceFeedbackAI}
                    disabled={enhancingAI || !feedbackText.trim()}
                    style={{ 
                      padding: '0.25rem 0.65rem', 
                      fontSize: '0.75rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem', 
                      background: 'rgba(124, 58, 237, 0.15)', 
                      border: '1px solid rgba(124, 58, 237, 0.4)', 
                      color: '#a78bfa',
                      fontWeight: 600
                    }}
                  >
                    {enhancingAI ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                    ) : (
                      <span>✨ Generate AI Enhanced Feedback</span>
                    )}
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Type your raw interview evaluation notes here, then click 'Generate AI Enhanced Feedback' to polish into an executive evaluation report..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedInterview(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Award className="w-4 h-4" />
                  <span>Submit Assessment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Real Candidate Email Compose Modal */}
      {emailModalInterview && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail className="w-5 h-5 text-primary" />
                <span>Send Candidate Email via SMTP</span>
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setEmailModalInterview(null)}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div>Recipient: <strong>{emailModalInterview.application?.candidate?.fullName}</strong> ({emailModalInterview.application?.candidate?.email || 'Candidate Email'})</div>
              <div>Position: <strong>{emailModalInterview.application?.job?.title}</strong></div>
            </div>

            {/* Template Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Select Predefined Decision Template:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${emailTemplateType === 'Selected' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem', justifyContent: 'center' }}
                  onClick={() => applyEmailTemplate('Selected', emailModalInterview)}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> 🟢 Selected (Offer)
                </button>
                <button
                  type="button"
                  className={`btn ${emailTemplateType === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem', justifyContent: 'center' }}
                  onClick={() => applyEmailTemplate('Rejected', emailModalInterview)}
                >
                  <XCircle className="w-3.5 h-3.5" /> 🔴 Rejected (Regret)
                </button>
                <button
                  type="button"
                  className={`btn ${emailTemplateType === 'OnHold' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem', justifyContent: 'center' }}
                  onClick={() => applyEmailTemplate('OnHold', emailModalInterview)}
                >
                  <Clock className="w-3.5 h-3.5" /> 🟡 On Hold (Review)
                </button>
              </div>
            </div>

            <form onSubmit={handleSendCandidateEmail}>
              <div className="form-group">
                <label className="form-label">Email Subject *</label>
                <input
                  type="text"
                  className="form-control"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Message Body *</label>
                <textarea
                  className="form-control"
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  required
                  style={{ resize: 'vertical', fontFamily: 'sans-serif' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={sendingEmail} style={{ flex: 1, display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}>
                  {sendingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Real Email via SMTP</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setEmailModalInterview(null)}>Cancel</button>
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
