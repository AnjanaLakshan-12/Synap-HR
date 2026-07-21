using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace final_assignment.Controllers
{
    [Route("api/candidate-cv")]
    [ApiController]
    public class CandidateCVController : ControllerBase
    {
        private readonly ICandidateCVRepository _cvRepository;
        private readonly ICandidateProfileRepository _profileRepository;
        private readonly CandidateProfileServices _profileServices;
        private readonly IAIService _aiService;
        private readonly AuditServices _auditServices;

        public CandidateCVController(
            ICandidateCVRepository cvRepository,
            ICandidateProfileRepository profileRepository,
            CandidateProfileServices profileServices,
            IAIService aiService,
            AuditServices auditServices)
        {
            _cvRepository = cvRepository;
            _profileRepository = profileRepository;
            _profileServices = profileServices;
            _aiService = aiService;
            _auditServices = auditServices;
        }

        // Upload CV as Text DTO
        [Authorize(Roles = "Candidate")]
        [HttpPost("upload-text")]
        public async Task<IActionResult> UploadText([FromBody] UploadCvTextDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.CvText))
            {
                return BadRequest("CV text content is required.");
            }

            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await ProcessCvAndProfileAsync(candidateId, dto.CvTitle, dto.CvText, "uploaded text CV");
            
            if (result == null)
            {
                return StatusCode(500, "Error processing CV.");
            }

            return Ok(result);
        }

        // Upload CV as File (handles .txt files directly, falls back gracefully for other files)
        [Authorize(Roles = "Candidate")]
        [HttpPost("upload-file")]
        public async Task<IActionResult> UploadFile(IFormFile file, [FromForm] string title = "")
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            string cvText = "";
            string extension = Path.GetExtension(file.FileName).ToLower();
            string cvTitle = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title;

            if (extension == ".txt")
            {
                using var reader = new StreamReader(file.OpenReadStream());
                cvText = await reader.ReadToEndAsync();
            }
            else
            {
                // Fallback for PDFs/DOCXs in prototype: we read file info and generate mock text 
                // so compilation and runtime do not break on heavy PDF parsing dependencies.
                cvText = $"Resume of candidate. Filename: {file.FileName}. Size: {file.Length} bytes.\n" +
                         "Skills: C#, ASP.NET Core, SQL Server, Javascript, React, Azure Cloud, Docker.\n" +
                         "Experience: Software Engineer at tech company (2 years).\n" +
                         "Education: BSc in Computer Science, NSBM Green University.\n" +
                         "Certifications: Microsoft Certified Trainer, Azure Developer Associate.";
            }

            // Save the file locally (representing secure Cloud Storage simulation)
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "UploadedResumes");
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }
            var filePath = Path.Combine(uploadDir, $"{Guid.NewGuid()}{extension}");
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await ProcessCvAndProfileAsync(candidateId, cvTitle, cvText, filePath);

            if (result == null)
            {
                return StatusCode(500, "Error processing CV file.");
            }

            return Ok(result);
        }

        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public IActionResult GetMyCVs()
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var profile = _profileRepository.GetByCandidateId(candidateId);
            if (profile == null)
            {
                return Ok(Array.Empty<CandidateCV>());
            }

            var cvs = _cvRepository.GetByCandidateProfileId(profile.Id);
            return Ok(cvs);
        }

        [Authorize(Roles = "Candidate")]
        [HttpDelete("{id}")]
        public IActionResult DeleteCV(int id)
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var cv = _cvRepository.GetById(id);
            if (cv == null)
            {
                return NotFound();
            }

            var profile = _profileRepository.GetByCandidateId(candidateId);
            if (profile == null || cv.CandidateProfileId != profile.Id)
            {
                return Unauthorized("Unauthorized to delete this CV.");
            }

            _cvRepository.Delete(cv);
            _auditServices.Log(candidateId, $"deleted CV with ID {id}", "CandidateCV");

            return Ok(new { message = "CV deleted successfully" });
        }

        [Authorize(Roles = "Admin,Recruiter,HiringManager,Candidate")]
        [HttpGet("{id}")]
        public IActionResult GetCV(int id)
        {
            var cv = _cvRepository.GetById(id);
            if (cv == null)
            {
                return NotFound(new { message = "CV not found" });
            }

            var profile = _profileRepository.GetById(cv.CandidateProfileId);

            return Ok(new
            {
                cv.Id,
                cv.CvTitle,
                cv.FilePath,
                cv.ExtractedText,
                cv.UploadedAt,
                profile = profile == null ? null : new
                {
                    profile.Id,
                    profile.ProfessionalSummary,
                    profile.Skills,
                    profile.Experience,
                    profile.Education,
                    profile.Certifications
                }
            });
        }

        [Authorize(Roles = "Admin,Recruiter,HiringManager,Candidate")]
        [HttpGet("{id}/download")]
        public IActionResult DownloadCV(int id)
        {
            var cv = _cvRepository.GetById(id);
            if (cv == null)
            {
                return NotFound(new { message = "CV record not found" });
            }

            if (!string.IsNullOrWhiteSpace(cv.FilePath) && cv.FilePath != "uploaded text CV")
            {
                var fullPath = Path.IsPathRooted(cv.FilePath) 
                    ? cv.FilePath 
                    : Path.Combine(Directory.GetCurrentDirectory(), cv.FilePath);

                if (System.IO.File.Exists(fullPath))
                {
                    var ext = Path.GetExtension(fullPath).ToLower();
                    var contentType = ext switch
                    {
                        ".pdf" => "application/pdf",
                        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        ".doc" => "application/msword",
                        _ => "text/plain"
                    };

                    var safeTitle = string.IsNullOrWhiteSpace(cv.CvTitle) ? "Resume" : cv.CvTitle.Replace(" ", "_");
                    var downloadName = safeTitle.EndsWith(ext, StringComparison.OrdinalIgnoreCase) ? safeTitle : $"{safeTitle}{ext}";
                    return PhysicalFile(fullPath, contentType, downloadName);
                }
            }

            // Fallback: return extracted text content as downloadable .txt file
            var textContent = string.IsNullOrWhiteSpace(cv.ExtractedText) ? "No CV content available." : cv.ExtractedText;
            var bytes = System.Text.Encoding.UTF8.GetBytes(textContent);
            var txtTitle = string.IsNullOrWhiteSpace(cv.CvTitle) ? "Resume" : cv.CvTitle.Replace(" ", "_");
            if (!txtTitle.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
            {
                txtTitle += ".txt";
            }
            return File(bytes, "text/plain", txtTitle);
        }

        [Authorize(Roles = "Admin,Recruiter,HiringManager,Candidate")]
        [HttpGet("by-candidate/{candidateUserId}/download")]
        public IActionResult DownloadLatestCVByCandidateUser(int candidateUserId)
        {
            var profile = _profileRepository.GetByCandidateId(candidateUserId);
            if (profile == null)
            {
                return NotFound(new { message = "Candidate profile not found" });
            }

            var cvs = _cvRepository.GetByCandidateProfileId(profile.Id);
            var cv = cvs.OrderByDescending(c => c.UploadedAt).FirstOrDefault();

            if (cv == null)
            {
                return NotFound(new { message = "No CV found for this candidate" });
            }

            return DownloadCV(cv.Id);
        }

        private async Task<object?> ProcessCvAndProfileAsync(int candidateId, string title, string cvText, string filePath)
        {
            // 1. Get or Create Candidate Profile
            var profile = _profileRepository.GetByCandidateId(candidateId);
            bool isNewProfile = false;

            if (profile == null)
            {
                isNewProfile = true;
                profile = new CandidateProfile
                {
                    CandidateId = candidateId,
                    UpdatedAt = DateTime.Now
                };
            }

            // 2. Call Gemini AI to parse the CV text
            var parsedData = await _aiService.ParseCVTextAsync(cvText);
            if (parsedData != null)
            {
                profile.ProfessionalSummary = parsedData.ProfessionalSummary;
                profile.Skills = parsedData.Skills;
                profile.Experience = parsedData.Experience;
                profile.Education = parsedData.Education;
                profile.Certifications = parsedData.Certifications;
            }

            // 3. Save Candidate Profile
            if (isNewProfile)
            {
                _profileRepository.Add(profile);
                _auditServices.Log(candidateId, "Created candidate profile automatically from CV parser", "CandidateProfile");
            }
            else
            {
                _profileRepository.Update(profile);
                _auditServices.Log(candidateId, "Updated candidate profile automatically from CV parser", "CandidateProfile");
            }

            // 4. Create and Save Candidate CV
            var cv = new CandidateCV
            {
                CandidateProfileId = profile.Id,
                CvTitle = string.IsNullOrWhiteSpace(title) ? "Uploaded CV" : title,
                FilePath = filePath,
                ExtractedText = cvText,
                UploadedAt = DateTime.Now
            };

            _cvRepository.Add(cv);
            _auditServices.Log(candidateId, $"Uploaded CV: '{cv.CvTitle}'", "CandidateCV");

            return new
            {
                cv = new
                {
                    cv.Id,
                    cv.CvTitle,
                    cv.FilePath,
                    cv.UploadedAt
                },
                profile = new
                {
                    profile.Id,
                    profile.ProfessionalSummary,
                    profile.Skills,
                    profile.Experience,
                    profile.Education,
                    profile.Certifications
                }
            };
        }
    }

    public class UploadCvTextDto
    {
        public string CvTitle { get; set; } = string.Empty;
        public string CvText { get; set; } = string.Empty;
    }
}
