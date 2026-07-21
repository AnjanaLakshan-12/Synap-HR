using final_assignment.DTOs;
using final_assignment.Enums;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using final_assignment.Repositries;
using System.Text;


namespace final_assignment.Services
{
    public class InterviewServices
    {
        private readonly IInterviewRepository _interviewRepository;
        private readonly AuditServices _auditServices;
        private readonly IApplicationRepository _applicationRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;

        public InterviewServices(
            IInterviewRepository interviewRepository,
            AuditServices auditServices,
            IApplicationRepository applicationRepository,
            IUserRepository userRepository,
            INotificationService notificationService)
        {
            _interviewRepository = interviewRepository;
            _auditServices = auditServices;
            _applicationRepository = applicationRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
        }

        private bool CanAccessApplication(Application application, int staffId)
        {
            var staff = _userRepository.GetById(staffId);

            if (staff == null || staff.OrganizationId == null)
                return false;

            if (application.Job == null)
                return false;

            if (application.Job.OrganizationId != staff.OrganizationId)
                return false;

            return true;
        }

        public async Task<Interview?> ScheduleAsync(InterviewDto dto, int recruiterId)
        {
            var application = _applicationRepository.GetById(dto.ApplicationId);

            if (application == null)
                return null;

            if (!CanAccessApplication(application, recruiterId))
                return null;

            // Allow scheduling for Applied, Shortlisted, or InterviewScheduled
            if (application.Status != ApplicationStatus.Applied &&
                application.Status != ApplicationStatus.Shortlisted &&
                application.Status != ApplicationStatus.InterviewScheduled)
            {
                return null;
            }

            // Check if an interview already exists for this application (reschedule support)
            var existingInterviews = _interviewRepository.GetAll();
            var existingInterview = existingInterviews?.FirstOrDefault(i => i.ApplicationId == dto.ApplicationId);

            Interview interview;
            if (existingInterview != null)
            {
                existingInterview.InterviewerId = dto.InterviewerId;
                existingInterview.InterviewDate = dto.InterviewDate;
                existingInterview.InterviewMode = dto.InterviewMode;
                existingInterview.MeetingLink = dto.MeetingLink;
                existingInterview.Decision = HiringDecision.Pending;
                existingInterview.ReminderSent = false;

                _interviewRepository.Update(existingInterview);
                interview = existingInterview;
            }
            else
            {
                interview = new Interview
                {
                    ApplicationId = dto.ApplicationId,
                    InterviewerId = dto.InterviewerId,
                    InterviewDate = dto.InterviewDate,
                    InterviewMode = dto.InterviewMode,
                    MeetingLink = dto.MeetingLink,
                    Decision = HiringDecision.Pending,
                    ReminderSent = false
                };

                _interviewRepository.Add(interview);
            }

            application.Status = ApplicationStatus.InterviewScheduled;
            _applicationRepository.Update(application);

            _auditServices.Log(recruiterId, $"Interview scheduled/updated for Application ID {dto.ApplicationId} with interviewer {dto.InterviewerId}", "Interview");

            var candidate = _userRepository.GetById(application.CandidateId);
            var interviewer = dto.InterviewerId.HasValue ? _userRepository.GetById(dto.InterviewerId.Value) : null;
            var jobTitle = application.Job?.Title ?? "Position";

            if (candidate != null)
            {
                var modeStr = dto.InterviewMode == InterviewMode.Online ? "Online Video Meeting" : "In-Person (Office)";
                var subject = $"Interview Scheduled: {jobTitle}";
                var body = $@"
                    <h3>Interview Scheduled!</h3>
                    <p>Dear {candidate.FullName},</p>
                    <p>An interview session has been scheduled for your application for the <strong>{jobTitle}</strong> position.</p>
                    <p><strong>Date & Time:</strong> {dto.InterviewDate:f}</p>
                    <p><strong>Mode:</strong> {modeStr}</p>
                    {(dto.InterviewMode == InterviewMode.Online && !string.IsNullOrWhiteSpace(dto.MeetingLink) 
                        ? $"<p><strong>Meeting Link:</strong> <a href='{dto.MeetingLink}' target='_blank'>{dto.MeetingLink}</a></p>" 
                        : "")}
                    <p>You can sync this appointment to your Google Calendar directly from your candidate portal.</p>
                    <br/>
                    <p>Best regards,<br/>SynapHR Talent Acquisition Team</p>";

                await _notificationService.SendEmailAsync(candidate.Email, subject, body, candidate.Id);

                var smsText = $"Interview Scheduled: You have an interview for {jobTitle} on {dto.InterviewDate:g}. Link: {dto.MeetingLink}";
                await _notificationService.SendSmsAsync(candidate.Email, smsText, candidate.Id);
            }

            if (interviewer != null)
            {
                var subject = $"Evaluation Assigned: Interview for {candidate?.FullName ?? "Candidate"}";
                var body = $@"
                    <h3>New Interview Assignment</h3>
                    <p>Dear {interviewer.FullName},</p>
                    <p>You have been assigned to conduct an evaluation interview for candidate <strong>{candidate?.FullName ?? "Candidate"}</strong> for the position of <strong>{jobTitle}</strong>.</p>
                    <p><strong>Date & Time:</strong> {dto.InterviewDate:f}</p>
                    {(dto.InterviewMode == InterviewMode.Online && !string.IsNullOrWhiteSpace(dto.MeetingLink) 
                        ? $"<p><strong>Meeting Link:</strong> <a href='{dto.MeetingLink}' target='_blank'>{dto.MeetingLink}</a></p>" 
                        : "")}
                    <br/>
                    <p>Best regards,<br/>SynapHR Talent Acquisition Team</p>";

                await _notificationService.SendEmailAsync(interviewer.Email, subject, body, interviewer.Id);

                var smsText = $"Alert: You have been assigned to conduct an interview for {candidate?.FullName ?? "Candidate"} on {dto.InterviewDate:g}. Link: {dto.MeetingLink}";
                await _notificationService.SendSmsAsync(interviewer.Email, smsText, interviewer.Id);
            }

            return interview;
        }
        

        public List<Interview>? GetAll()
        {
            return _interviewRepository.GetAll();
        }

        public Interview? GetById(int id)
        {
            return _interviewRepository.GetById(id);
        }

        public List<Interview> GetMyCalendar(int userId, string role)
        {
            var interviews = _interviewRepository.GetAll() ?? new List<Interview>();

            if (string.Equals(role, "Candidate", StringComparison.OrdinalIgnoreCase))
            {
                return interviews
                    .Where(i => i.Application != null && i.Application.CandidateId == userId)
                    .ToList();
            }
            else if (string.Equals(role, "HiringManager", StringComparison.OrdinalIgnoreCase))
            {
                return interviews
                    .Where(i => i.InterviewerId == userId)
                    .ToList();
            }
            else if (string.Equals(role, "Recruiter", StringComparison.OrdinalIgnoreCase))
            {
                return interviews
                    .Where(i => i.Application != null && i.Application.Job != null && i.Application.Job.RecruiterId == userId)
                    .ToList();
            }

            return new List<Interview>();
        }


        public async Task<Interview?> AddFeedbackAsync(int id, string feedback, HiringDecision decision, int managerid)
        {
            var interview = _interviewRepository.GetById(id);

            if (interview == null)
                return null;

            var application = _applicationRepository.GetById(interview.ApplicationId);

            if (application == null)
                return null;

            interview.Feedback = feedback;
            interview.Decision = decision;

            if (decision == HiringDecision.Selected)
                application.Status = ApplicationStatus.Selected;
            else if (decision == HiringDecision.Rejected)
                application.Status = ApplicationStatus.Rejected;
            else if (decision == HiringDecision.OnHold)
                application.Status = ApplicationStatus.OnHold;

            _interviewRepository.Update(interview);
            _applicationRepository.Update(application);

            _auditServices.Log(managerid, "Interview feedback and hiring decision added", "Interview");

            // If manager selects candidate, send real email & SMS
            if (decision == HiringDecision.Selected)
            {
                var candidate = _userRepository.GetById(application.CandidateId);
                if (candidate != null)
                {
                    var jobTitle = application.Job?.Title ?? "Position";
                    var subject = $"Congratulations! You are Selected for {jobTitle}";
                    var body = $@"
                        <h3>Congratulations! You Are Selected!</h3>
                        <p>Dear {candidate.FullName},</p>
                        <p>We are thrilled to inform you that following your interview evaluation, you have been <strong>Selected</strong> for the <strong>{jobTitle}</strong> position!</p>
                        <p>Our HR representative will reach out to you shortly with the official offer letter and onboarding details.</p>
                        <br/>
                        <p>Best regards,<br/>Recruitment Team</p>";

                    await _notificationService.SendEmailAsync(candidate.Email, subject, body, candidate.Id);
                }
            }

            return interview;
        }

    }
}
