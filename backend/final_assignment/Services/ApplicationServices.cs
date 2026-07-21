using final_assignment.DTOs;
using final_assignment.Enums;
using final_assignment.Models;
using final_assignment.Repositries;
using final_assignment.Repositries.Interfaces;

namespace final_assignment.Services
{
    public class ApplicationServices
    {
        private readonly IApplicationRepository _applicationrepository;
        private readonly IJobRepository _jobRepository;
        private readonly AuditServices _auditServices;
        private readonly ICandidateCVRepository _candidateCVRepository;
        private readonly IUserRepository _userRepository;
        private readonly IAIService _aiService;
        private readonly INotificationService _notificationService;

        public ApplicationServices(
            IApplicationRepository applicationrepository,
            IJobRepository jobRepository,
            ICandidateCVRepository candidateCVRepository,
            IUserRepository userRepository,
            AuditServices auditServices,
            IAIService aiService,
            INotificationService notificationService)
        {
            _applicationrepository = applicationrepository;
            _jobRepository = jobRepository;
            _candidateCVRepository = candidateCVRepository;
            _userRepository = userRepository;
            _auditServices = auditServices;
            _aiService = aiService;
            _notificationService = notificationService;
        }

        //
        public async Task<Application?> ApplyAsync(ApplicationDto dto, int candidateId)
        {
            var job = _jobRepository.GetById(dto.JobId);

            if (job == null || !job.IsActive || job.ClosingDate.Date < DateTime.Now.Date)
                return null;

            if (!int.TryParse(dto.CandidateCVId, out var candidateCvId))
                return null;

            var selectedCv = _candidateCVRepository.GetById(candidateCvId);

            if (selectedCv == null)
                return null;

            if (selectedCv.CandidateProfile == null || selectedCv.CandidateProfile.CandidateId != candidateId)
                return null;

            var alreadyApplied = _applicationrepository.GetAll()
                .Any(a => a.CandidateId == candidateId && a.JobId == dto.JobId);

            if (alreadyApplied)
                return null;

            // Call Gemini AI analysis service
            var analysis = await _aiService.AnalyzeCVAsync(selectedCv.ExtractedText, job.RequiredSkills, job.Description);
            int matchScore = analysis?.MatchScore ?? 0;
            string feedback = analysis?.AutomatedFeedback ?? "No feedback generated.";

            var application = new Application
            {
                CandidateId = candidateId,
                JobId = dto.JobId,
                CandidateCVId = candidateCvId,
                Status = ApplicationStatus.Applied,
                MatchScore = matchScore
            };

            _applicationrepository.Add(application);
            _auditServices.Log(candidateId, $"Applied to job {job.Title}. AI Score: {matchScore}%. Feedback: {feedback}", "Application");

            // Notify Recruiter about the new application submission
            var recruiter = _userRepository.GetById(job.RecruiterId);
            var candidateUser = _userRepository.GetById(candidateId);
            if (recruiter != null && candidateUser != null)
            {
                var subject = $"New Candidate Application: {job.Title}";
                var body = $@"
                    <h3>New Application Received</h3>
                    <p>Dear {recruiter.FullName},</p>
                    <p>A new application has been submitted for your job posting: <strong>{job.Title}</strong>.</p>
                    <p><strong>Candidate Name:</strong> {candidateUser.FullName}</p>
                    <p><strong>AI Fit Score:</strong> {matchScore}%</p>
                    <p>Please log in to your recruiter dashboard to review the profile details and shortlist decision.</p>
                    <br/>
                    <p>Best regards,<br/>Recruitment System</p>";

                await _notificationService.SendSmsAsync(recruiter.Email, $"Alert: New application for '{job.Title}' from {candidateUser.FullName}. AI Score: {matchScore}%.", recruiter.Id);
            }

            return application;
        
        }

        public List<Application> GetAll()
        {
            return _applicationrepository.GetAll();
        }

        public List<Application> GetApplicationsForStaff(int userId)
        {
            var user = _userRepository.GetById(userId);

            if (user == null || user.OrganizationId == null)
                return new List<Application>();

            var applications = _applicationrepository.GetAll();
            var isRecruiter = string.Equals(user.Role, "Recruiter", StringComparison.OrdinalIgnoreCase);

            return applications
                .Where(a => a.Job != null)
                .Where(a =>
                {
                    var sameOrgAndDepartment = a.Job!.OrganizationId == user.OrganizationId &&
                        (user.DepartmentId == null || a.Job.DepartmentId == user.DepartmentId);

                    if (!sameOrgAndDepartment && !isRecruiter)
                        return false;

                    return isRecruiter ? a.Job.RecruiterId == user.Id || sameOrgAndDepartment : true;
                })
                .ToList();
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

            if (staff.DepartmentId != null && application.Job.DepartmentId != staff.DepartmentId)
                return false;

            return true;
        }

        public async Task<Application?> ShortlistingAsync(int id, int recruiterId)
        {
            var application = _applicationrepository.GetById(id);

            if (application == null)
                return null;

            if (!CanAccessApplication(application, recruiterId))
                return null;

            application.Status = ApplicationStatus.Shortlisted;

            _applicationrepository.Update(application);
            _auditServices.Log(recruiterId, "application added to shortlist", "application");

            var candidate = _userRepository.GetById(application.CandidateId);
            if (candidate != null)
            {
                var jobTitle = application.Job?.Title ?? "Position";
                var subject = $"Application Status Update: Shortlisted for {jobTitle}";
                var body = $@"
                    <h3>Congratulations! You've been shortlisted!</h3>
                    <p>Dear {candidate.FullName},</p>
                    <p>We are pleased to inform you that your application for the <strong>{jobTitle}</strong> position has been <strong>Shortlisted</strong>.</p>
                    <p>Our recruitment team will review your profile and contact you soon to schedule an interview.</p>
                    <br/>
                    <p>Best regards,<br/>Recruitment Team</p>";

                await _notificationService.SendSmsAsync(candidate.Email, $"Good news! You have been shortlisted for the {jobTitle} position. We will contact you soon for an interview.", candidate.Id);
            }

            return application;
        }

        public async Task<Application?> RejectAsync(int id, int recruiterId)
        {
            var application = _applicationrepository.GetById(id);

            if (application == null)
                return null;

            if (!CanAccessApplication(application, recruiterId))
                return null;

            application.Status = ApplicationStatus.Rejected;

            _applicationrepository.Update(application);
            _auditServices.Log(recruiterId, "application rejected", "application");

            var candidate = _userRepository.GetById(application.CandidateId);
            if (candidate != null)
            {
                var jobTitle = application.Job?.Title ?? "Position";
                var subject = $"Application Status Update: Rejected for {jobTitle}";
                var body = $@"
                    <h3>Application Update</h3>
                    <p>Dear {candidate.FullName},</p>
                    <p>Thank you for taking the time to apply for the <strong>{jobTitle}</strong> position.</p>
                    <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
                    <p>We appreciate your interest in our organization and wish you the best in your future endeavors.</p>
                    <br/>
                    <p>Best regards,<br/>Recruitment Team</p>";

                await _notificationService.SendSmsAsync(candidate.Email, $"Thank you for your interest in the {jobTitle} position. We regret to inform you that we are not moving forward at this time.", candidate.Id);
            }

            return application;
        }

        public async Task<Application?> MakeDecisionAsync(int id, ApplicationStatus decision, int managerid)
        {
            var application = _applicationrepository.GetById(id);

            if (application == null)
            {
                return null;
            }

            if (!CanAccessApplication(application, managerid))
                return null;

            application.Status = decision;

            _applicationrepository.Update(application);
            _auditServices.Log(managerid, $"made hiring decision: {decision}", "application");

            var candidate = _userRepository.GetById(application.CandidateId);
            if (candidate != null)
            {
                var jobTitle = application.Job?.Title ?? "Position";
                string subject = $"Application Status Update: {decision} for {jobTitle}";
                string body = "";
                string smsMessage = "";

                if (decision == ApplicationStatus.Selected)
                {
                    body = $@"
                        <h3>Congratulations! You are Selected!</h3>
                        <p>Dear {candidate.FullName},</p>
                        <p>We are absolutely thrilled to inform you that you have been <strong>Selected</strong> for the <strong>{jobTitle}</strong> position!</p>
                        <p>Our HR representative will reach out to you shortly with the official offer letter and onboarding details.</p>
                        <br/>
                        <p>Best regards,<br/>Recruitment Team</p>";
                    smsMessage = $"Congratulations! You have been selected for the {jobTitle} position. Welcome to the team!";
                }
                else if (decision == ApplicationStatus.Rejected)
                {
                    body = $@"
                        <h3>Application Update</h3>
                        <p>Dear {candidate.FullName},</p>
                        <p>Thank you for taking the time to apply and interview for the <strong>{jobTitle}</strong> position.</p>
                        <p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.</p>
                        <p>We appreciate your interest in our organization and wish you the best in your future endeavors.</p>
                        <br/>
                        <p>Best regards,<br/>Recruitment Team</p>";
                    smsMessage = $"Thank you for interviewing for the {jobTitle} position. We regret to inform you that we are not moving forward. Best of luck!";
                }
                else if (decision == ApplicationStatus.OnHold)
                {
                    body = $@"
                        <h3>Application Update</h3>
                        <p>Dear {candidate.FullName},</p>
                        <p>We wanted to let you know that your application for the <strong>{jobTitle}</strong> position has been placed <strong>On Hold</strong>.</p>
                        <p>We are still reviewing candidates and will keep your profile open. We will reach out to you as soon as there is an update.</p>
                        <br/>
                        <p>Best regards,<br/>Recruitment Team</p>";
                    smsMessage = $"Your application for the {jobTitle} position is currently on hold. We will update you soon.";
                }

                if (decision == ApplicationStatus.Selected && !string.IsNullOrEmpty(body))
                {
                    await _notificationService.SendEmailAsync(candidate.Email, subject, body, candidate.Id);
                }
                else if (!string.IsNullOrEmpty(smsMessage))
                {
                    await _notificationService.SendSmsAsync(candidate.Email, smsMessage, candidate.Id);
                }
            }

            return application;
        }



        //kjsanaskjcacsknaclacacaca

        //public int? CalculateMatchScore(string skills, string resume)
        //{
        //    var skills = requiredSkills.Split(',', StringSplitOptions.RemoveEmptyEntries);
        //    int matched = 0;

        //    foreach (var skill in skills)
        //    {
        //        if (resumeText.ToLower().Contains(skill.Trim().ToLower()))
        //            matched++;
        //    }

        //    if (skills.Length == 0)
        //        return 0;

        //    return matched * 100 / skills.Length;
        //}


        public Application? GetById(int id)
        {
            var application = _applicationrepository.GetById(id);
            return application;
        }

        internal object GetByCandidateId(int candidateId)
        {
            return _applicationrepository.GetAll()
                .Where(a => a.CandidateId == candidateId)
                .ToList();
        }

        private int CalculateMatchScore(string requiredSkills, string resumeText)
        {
            if (string.IsNullOrWhiteSpace(requiredSkills))
                return 0;

            var skills = requiredSkills
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (skills.Length == 0)
                return 0;

            var matched = skills.Count(skill =>
                resumeText.Contains(skill, StringComparison.OrdinalIgnoreCase));

            return matched * 100 / skills.Length;
        }
    }
}
