using final_assignment.DTOs;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace final_assignment.Controllers
{
    [Route("api/candidate-profile")]
    [ApiController]
    public class CandidateProfileController : ControllerBase
    {
        private readonly CandidateProfileServices _profileServices;
        private readonly JobServices _jobServices;
        private readonly ICandidateCVRepository _cvRepository;
        private readonly IAIService _aiService;

        public CandidateProfileController(
            CandidateProfileServices profileServices,
            JobServices jobServices,
            ICandidateCVRepository cvRepository,
            IAIService aiService)
        {
            _profileServices = profileServices;
            _jobServices = jobServices;
            _cvRepository = cvRepository;
            _aiService = aiService;
        }

        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public IActionResult GetMyProfile()
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var profile = _profileServices.GetMyProfile(candidateId);

            if (profile == null)
                return NotFound(new { message = "Profile not created yet" });

            return Ok(profile);
        }

        [Authorize(Roles = "Candidate")]
        [HttpPost("my")]
        public IActionResult CreateOrUpdateProfile([FromBody] CandidateProfileDto dto)
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var profile = _profileServices.CreateOrUpdate(dto, candidateId);

            return Ok(new
            {
                message = "Profile saved successfully",
                profile
            });
        }

        [Authorize(Roles = "Candidate")]
        [HttpGet("ai-recommended-jobs")]
        public async Task<IActionResult> GetAIRecommendedJobs()
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var profile = _profileServices.GetMyProfile(candidateId);
            
            // Get latest candidate CV text if available
            string? cvText = null;
            if (profile != null)
            {
                var cvs = _cvRepository.GetByCandidateProfileId(profile.Id);
                var latestCv = cvs.OrderByDescending(c => c.UploadedAt).FirstOrDefault();
                cvText = latestCv?.ExtractedText;
            }

            var openJobs = _jobServices.GetActiveAndOpenJobs();

            if (openJobs == null || openJobs.Count == 0)
            {
                return Ok(Array.Empty<object>());
            }

            // Call Gemini AI Recommendation Service
            var recommendations = await _aiService.GetAIMatchedJobsAsync(profile, cvText, openJobs);

            // Combine AI match data with full job details
            var result = openJobs.Select(job =>
            {
                var rec = recommendations.FirstOrDefault(r => r.JobId == job.Id);
                int score = rec?.MatchScore ?? 50;
                string reason = rec?.AIRecommendationReason ?? "Job profile matches overall technical competencies.";
                string skillsMatch = rec?.KeySkillMatches ?? job.RequiredSkills;
                string fitCategory = rec?.IndustryFitCategory ?? (score >= 80 ? "Strong Direct Match" : "Career Growth Opportunity");

                return new
                {
                    job = new
                    {
                        job.Id,
                        job.Title,
                        job.Description,
                        job.RequiredSkills,
                        job.JobRole,
                        job.EmploymentType,
                        job.Location,
                        job.ClosingDate,
                        job.RecruiterId,
                        job.OrganizationId,
                        job.DepartmentId
                    },
                    matchScore = score,
                    aiRecommendationReason = reason,
                    keySkillMatches = skillsMatch,
                    industryFitCategory = fitCategory
                };
            })
            .OrderByDescending(r => r.matchScore)
            .ToList();

            return Ok(result);
        }

        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        [HttpGet]
        public IActionResult GetAllProfiles()
        {
            return Ok(_profileServices.GetAllProfiles());
        }

        [Authorize(Roles = "Recruiter,HiringManager,Admin")]
        [HttpGet("candidate/{candidateUserId}")]
        public IActionResult GetProfileByCandidateUserId(int candidateUserId)
        {
            var profile = _profileServices.GetMyProfile(candidateUserId);
            if (profile == null)
            {
                return NotFound(new { message = "Candidate profile details not created yet." });
            }
            return Ok(profile);
        }
    }
}
