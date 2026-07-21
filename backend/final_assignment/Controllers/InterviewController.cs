using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using final_assignment.DTOs;
using final_assignment.Enums;
using final_assignment.Models;
using final_assignment.Services;
using final_assignment.Repositries.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace final_assignment.Controllers
{
    [Route("api/interviews")]
    [ApiController]
    public class InterviewController : ControllerBase
    {
        private readonly InterviewServices _interviewServices;
        private readonly IAIService _aiService;
        private readonly INotificationService _notificationService;
        private readonly IApplicationRepository _applicationRepository;

        public InterviewController(
            InterviewServices interviewServices, 
            IAIService aiService,
            INotificationService notificationService,
            IApplicationRepository applicationRepository)
        {
            _interviewServices = interviewServices;
            _aiService = aiService;
            _notificationService = notificationService;
            _applicationRepository = applicationRepository;
        }

        [Authorize(Roles = "Recruiter,HiringManager")]
        [HttpGet]
        public IActionResult GetInterviews()
        {
            return Ok(_interviewServices.GetAll());
        }

        [Authorize(Roles = "Recruiter,HiringManager")]
        [HttpGet("{id}")]
        public IActionResult GetInterview(int id)
        {
            var interview = _interviewServices.GetById(id);

            if (interview == null)
            {
                return NotFound();
            }

            return Ok(interview);
        }

        [Authorize(Roles = "Recruiter")]
        [HttpPost("schedule")]
        [HttpPost]
        public async Task<IActionResult> ScheduleInterview([FromBody] InterviewDto dto)
        {
            int recruiterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var interview = await _interviewServices.ScheduleAsync(dto, recruiterId);

            if (interview == null)
            {
                return BadRequest(new { message = "Failed to schedule interview. Ensure candidate application exists and is eligible." });
            }

            return Ok(new { message = "interview scheduled successfully", interview });
        }

        [Authorize(Roles = "HiringManager")]
        [HttpPut("{id}/feedback")]
        public async Task<IActionResult> AddFeedback(int id, [FromQuery] string feedback, [FromBody] HiringDecision decision)
        {
            int managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var interview = await _interviewServices.AddFeedbackAsync(id, feedback, decision, managerId);

            if (interview == null)
            {
                return NotFound(new { message = "interview was not found" });
            }

            return Ok(new { message = "feedback added successfully", interview });
        }

        // Retrieve role-based calendar events for Candidate, Recruiter, or HiringManager
        [Authorize]
        [HttpGet("my-calendar")]
        public IActionResult GetMyCalendar()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var roleClaim = User.FindFirstValue(ClaimTypes.Role) ?? "";

            var interviews = _interviewServices.GetMyCalendar(userId, roleClaim);

            var result = interviews.Select(i => new
            {
                i.Id,
                i.ApplicationId,
                JobTitle = i.Application?.Job?.Title ?? "Position",
                CandidateName = i.Application?.Candidate?.FullName ?? "Applicant",
                InterviewerName = i.Interviewer?.FullName ?? "Pending Assignment",
                i.InterviewDate,
                i.InterviewMode,
                i.MeetingLink,
                i.Feedback,
                Decision = i.Decision.ToString()
            });

            return Ok(result);
        }

        [Authorize(Roles = "HiringManager,Recruiter")]
        [HttpPost("enhance-feedback")]
        public async Task<IActionResult> EnhanceFeedback([FromBody] EnhanceFeedbackDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.RawNotes))
            {
                return BadRequest("Please enter raw feedback notes first before enhancing with AI.");
            }

            var enhanced = await _aiService.EnhanceFeedbackAsync(dto.RawNotes, dto.CandidateName ?? "Candidate", dto.JobTitle ?? "Position");
            return Ok(new { enhancedFeedback = enhanced });
        }

        [Authorize(Roles = "HiringManager,Recruiter")]
        [HttpPost("send-email")]
        public async Task<IActionResult> SendCandidateEmail([FromBody] SendCandidateEmailDto dto)
        {
            if (dto == null || dto.ApplicationId <= 0)
            {
                return BadRequest("Application ID is required.");
            }

            var app = _applicationRepository.GetById(dto.ApplicationId);
            if (app == null || app.Candidate == null)
            {
                return NotFound("Application or Candidate details not found.");
            }

            var candidateEmail = app.Candidate.Email;
            if (string.IsNullOrWhiteSpace(candidateEmail))
            {
                return BadRequest("Candidate does not have a valid email address configured.");
            }

            var subject = string.IsNullOrWhiteSpace(dto.Subject) 
                ? $"Application Update: {app.Job?.Title ?? "Position"}" 
                : dto.Subject;

            var body = string.IsNullOrWhiteSpace(dto.Body) 
                ? $"Dear {app.Candidate.FullName},\n\nYour application status for {app.Job?.Title ?? "the position"} has been updated to: {dto.DecisionType}.\n\nBest regards,\nHiring Committee"
                : dto.Body;

            await _notificationService.SendEmailAsync(candidateEmail, subject, body, app.CandidateId);

            return Ok(new { message = $"Email successfully sent to {candidateEmail}", recipient = candidateEmail });
        }
    }

    public class EnhanceFeedbackDto
    {
        public string RawNotes { get; set; } = string.Empty;
        public string? CandidateName { get; set; }
        public string? JobTitle { get; set; }
    }

    public class SendCandidateEmailDto
    {
        public int ApplicationId { get; set; }
        public string DecisionType { get; set; } = string.Empty; // "Selected", "Rejected", "OnHold"
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }
}
