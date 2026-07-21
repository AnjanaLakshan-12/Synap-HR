using final_assignment.DTOs;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;

namespace final_assignment.Controllers
{
    [Route("api/organizations")]
    [ApiController]
    public class OrganizationController : ControllerBase
    {
        private readonly IOrganizationRepository _organizationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IJobRepository _jobRepository;
        private readonly AuditServices _auditServices;

        public OrganizationController(
            IOrganizationRepository organizationRepository,
            IUserRepository userRepository,
            IJobRepository jobRepository,
            AuditServices auditServices)
        {
            _organizationRepository = organizationRepository;
            _userRepository = userRepository;
            _jobRepository = jobRepository;
            _auditServices = auditServices;
        }

        // GET: api/organizations/my (Recruiters & Hiring Managers maintain their own company profile)
        [Authorize(Roles = "Recruiter,HiringManager")]
        [HttpGet("my")]
        public IActionResult GetMyOrganization()
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = _userRepository.GetById(userId);

            if (user == null || user.OrganizationId == null)
            {
                return NotFound(new { message = "User is not associated with any organization." });
            }

            var org = _organizationRepository.GetById(user.OrganizationId.Value);
            if (org == null)
            {
                return NotFound(new { message = "Organization profile not found." });
            }

            return Ok(org);
        }

        // PUT: api/organizations/my (Recruiters & Hiring Managers update company profile)
        [Authorize(Roles = "Recruiter,HiringManager")]
        [HttpPut("my")]
        public IActionResult UpdateMyOrganization([FromBody] OrganizationDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = _userRepository.GetById(userId);

            if (user == null || user.OrganizationId == null)
            {
                return NotFound(new { message = "User is not associated with any organization." });
            }

            var org = _organizationRepository.GetById(user.OrganizationId.Value);
            if (org == null)
            {
                return NotFound(new { message = "Organization profile not found." });
            }

            org.Name = string.IsNullOrWhiteSpace(dto.Name) ? org.Name : dto.Name;
            org.Industry = dto.Industry ?? org.Industry;
            org.Location = dto.Location ?? org.Location;
            org.Description = dto.Description ?? org.Description;
            org.WebsiteUrl = dto.WebsiteUrl ?? org.WebsiteUrl;
            org.ContactEmail = dto.ContactEmail ?? org.ContactEmail;
            org.ContactPhone = dto.ContactPhone ?? org.ContactPhone;
            org.CompanySize = dto.CompanySize ?? org.CompanySize;

            _organizationRepository.Update(org);
            _auditServices.Log(userId, $"Updated Organization profile for '{org.Name}'", "Organization");

            return Ok(new
            {
                message = "Organization profile updated successfully",
                organization = org
            });
        }

        // GET: api/organizations/{id}/public (Candidates & all users inspect Company Profile from job posts)
        [AllowAnonymous]
        [HttpGet("{id}/public")]
        public IActionResult GetPublicOrganizationProfile(int id)
        {
            var org = _organizationRepository.GetById(id);
            if (org == null)
            {
                return NotFound(new { message = "Organization not found." });
            }

            var activeJobs = _jobRepository.GetAll()
                .Where(j => j.OrganizationId == id && j.IsActive && j.ClosingDate.Date >= DateTime.Now.Date)
                .Select(j => new
                {
                    j.Id,
                    j.Title,
                    j.JobRole,
                    j.RequiredSkills,
                    j.EmploymentType,
                    j.Location,
                    j.ClosingDate
                })
                .ToList();

            return Ok(new
            {
                org.Id,
                org.Name,
                org.Industry,
                org.Location,
                org.Description,
                org.WebsiteUrl,
                org.ContactEmail,
                org.ContactPhone,
                org.CompanySize,
                org.IsActive,
                departments = org.Departments.Select(d => new { d.Id, d.Name }).ToList(),
                activeJobs
            });
        }
    }
}
