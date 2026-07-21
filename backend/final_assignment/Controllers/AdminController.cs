using final_assignment.DTOs;
using final_assignment.Models;
using final_assignment.Enums;
using final_assignment.Repositries.Interfaces;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace final_assignment.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJobRepository _jobRepository;
        private readonly IApplicationRepository _applicationRepository;
        private readonly IInterviewRepository _interviewRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IOrganizationRepository _organizationRepository;
        private readonly IDepartmentRepository _departmentRepository;
        private readonly AuthServices _authservices;

        public AdminController(
            IUserRepository userRepository,
            IJobRepository jobRepository,
            IApplicationRepository applicationRepository,
            IInterviewRepository interviewRepository,
            IAuditLogRepository auditLogRepository,
            IOrganizationRepository organizationRepository,
            IDepartmentRepository departmentRepository,
            AuthServices authServices)
        {
            _userRepository = userRepository;
            _jobRepository = jobRepository;
            _applicationRepository = applicationRepository;
            _interviewRepository = interviewRepository;
            _auditLogRepository = auditLogRepository;
            _organizationRepository = organizationRepository;
            _departmentRepository = departmentRepository;
            _authservices = authServices;
        }
        
        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            var users = _userRepository.GetAll();

            var result = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsActive = u.IsActive
            });

            return Ok(result);
        }
        
        [Authorize(Roles = "Admin")]
        [HttpGet("dashboard")]
        public IActionResult Dashboard()
        {
            return Ok(new
            {
                Users = _userRepository.GetAll().Count,
                Jobs = _jobRepository.GetAll().Count,
                Applications = _applicationRepository.GetAll().Count,
                Interviews = _interviewRepository.GetAll().Count,
                Organizations = _organizationRepository.GetAll().Count,
                Departments = _departmentRepository.GetAll().Count
            });
        }
        
        [Authorize(Roles = "Admin")]
        [HttpGet("auditlogs")]
        public IActionResult GetAuditLogs()
        {
            var logs = _auditLogRepository.GetAll();
            var users = _userRepository.GetAll();

            var result = logs.Select(l => new
            {
                l.Id,
                l.UserId,
                UserEmail = users.FirstOrDefault(u => u.Id == l.UserId)?.Email ?? "System/Unknown",
                UserFullName = users.FirstOrDefault(u => u.Id == l.UserId)?.FullName ?? "System/Unknown",
                l.Action,
                l.EntityName,
                l.CreatedAt
            }).OrderByDescending(l => l.CreatedAt);

            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("users")]
        public IActionResult CreateUser([FromBody]CreateUserDto dto)
        {
            int adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = _authservices.CreateUserByAdmin(dto, adminId);

            if (result == "email already exist" || result == "invalid user role")
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // Organizations CRUD
        [Authorize(Roles = "Admin")]
        [HttpPost("organizations")]
        public IActionResult CreateOrganization([FromBody] OrganizationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Organization Name is required");

            var org = new Organization
            {
                Name = dto.Name,
                Industry = dto.Industry,
                Location = dto.Location
            };

            _organizationRepository.Add(org);
            return Ok(org);
        }

        [Authorize(Roles = "Admin,Recruiter,HiringManager")]
        [HttpGet("organizations")]
        public IActionResult GetOrganizations()
        {
            return Ok(_organizationRepository.GetAll());
        }

        // Departments CRUD
        [Authorize(Roles = "Admin")]
        [HttpPost("departments")]
        public IActionResult CreateDepartment([FromBody] DepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Department Name is required");

            var org = _organizationRepository.GetById(dto.OrganizationId);
            if (org == null)
                return BadRequest("Organization not found");

            var dept = new Department
            {
                Name = dto.Name,
                OrganizationId = dto.OrganizationId
            };

            _departmentRepository.Add(dept);
            return Ok(dept);
        }

        [Authorize(Roles = "Admin,Recruiter,HiringManager")]
        [HttpGet("departments")]
        public IActionResult GetDepartments()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = _userRepository.GetById(userId);

            if (user != null && string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(_departmentRepository.GetAll());
            }

            if (user == null || user.OrganizationId == null)
            {
                return Ok(new List<Department>());
            }

            var orgDepts = _departmentRepository.GetAll()
                .Where(d => d.OrganizationId == user.OrganizationId.Value)
                .ToList();

            return Ok(orgDepts);
        }

        [Authorize(Roles = "Admin,Recruiter")]
        [HttpGet("hiring-managers")]
        public IActionResult GetHiringManagers([FromQuery] int? departmentId = null)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = _userRepository.GetById(userId);

            var managers = _userRepository.GetAll()
                .Where(u => u.Role == "HiringManager" && u.IsActive);

            if (user != null && !string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                if (user.OrganizationId == null) return Ok(new List<object>());
                managers = managers.Where(u => u.OrganizationId == user.OrganizationId.Value);
            }

            if (departmentId.HasValue)
            {
                managers = managers.Where(u => u.DepartmentId == departmentId.Value);
            }

            var result = managers.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.DepartmentId,
                u.OrganizationId
            });

            return Ok(result);
        }

        // ================= FULL ADMIN CRUD & DEACTIVATION ENDPOINTS =================

        // User Edit & Deactivate
        [Authorize(Roles = "Admin")]
        [HttpPut("users/{id}")]
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return NotFound("User not found");

            if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Role)) user.Role = dto.Role;
            
            user.OrganizationId = dto.OrganizationId;
            user.DepartmentId = dto.DepartmentId;

            _userRepository.Update(user);
            return Ok(user);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("users/{id}/toggle-status")]
        public IActionResult ToggleUserStatus(int id)
        {
            var user = _userRepository.GetById(id);
            if (user == null) return NotFound("User not found");

            user.IsActive = !user.IsActive;
            _userRepository.Update(user);
            return Ok(new { message = $"User account status updated to {(user.IsActive ? "Active" : "Deactivated")}", isActive = user.IsActive });
        }

        // Organization Edit, Deactivate & Delete
        [Authorize(Roles = "Admin")]
        [HttpPut("organizations/{id}")]
        public IActionResult UpdateOrganization(int id, [FromBody] OrganizationDto dto)
        {
            var org = _organizationRepository.GetById(id);
            if (org == null) return NotFound("Organization not found");

            if (!string.IsNullOrWhiteSpace(dto.Name)) org.Name = dto.Name;
            org.Industry = dto.Industry ?? "";
            org.Location = dto.Location ?? "";

            _organizationRepository.Update(org);
            return Ok(org);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("organizations/{id}/toggle-status")]
        public IActionResult ToggleOrganizationStatus(int id)
        {
            var org = _organizationRepository.GetById(id);
            if (org == null) return NotFound("Organization not found");

            org.IsActive = !org.IsActive;
            _organizationRepository.Update(org);
            return Ok(new { message = $"Organization is now {(org.IsActive ? "Active" : "Deactivated")}", isActive = org.IsActive });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("organizations/{id}")]
        public IActionResult DeleteOrganization(int id)
        {
            var org = _organizationRepository.GetById(id);
            if (org == null) return NotFound("Organization not found");

            var linkedUsers = _userRepository.GetAll().Any(u => u.OrganizationId == id);
            if (linkedUsers)
            {
                // Soft deactivate to protect foreign key relational integrity
                org.IsActive = false;
                _organizationRepository.Update(org);
                return Ok(new { message = "Organization has linked users/jobs. Soft-deactivated successfully.", isDeactivated = true });
            }

            _organizationRepository.Delete(org);
            return Ok(new { message = "Organization deleted successfully" });
        }

        // Department Edit, Deactivate & Delete
        [Authorize(Roles = "Admin")]
        [HttpPut("departments/{id}")]
        public IActionResult UpdateDepartment(int id, [FromBody] DepartmentDto dto)
        {
            var dept = _departmentRepository.GetById(id);
            if (dept == null) return NotFound("Department not found");

            if (!string.IsNullOrWhiteSpace(dto.Name)) dept.Name = dto.Name;
            if (dto.OrganizationId > 0) dept.OrganizationId = dto.OrganizationId;

            _departmentRepository.Update(dept);
            return Ok(dept);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("departments/{id}/toggle-status")]
        public IActionResult ToggleDepartmentStatus(int id)
        {
            var dept = _departmentRepository.GetById(id);
            if (dept == null) return NotFound("Department not found");

            dept.IsActive = !dept.IsActive;
            _departmentRepository.Update(dept);
            return Ok(new { message = $"Department is now {(dept.IsActive ? "Active" : "Deactivated")}", isActive = dept.IsActive });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("departments/{id}")]
        public IActionResult DeleteDepartment(int id)
        {
            var dept = _departmentRepository.GetById(id);
            if (dept == null) return NotFound("Department not found");

            var linkedJobs = _jobRepository.GetAll().Any(j => j.DepartmentId == id);
            var linkedUsers = _userRepository.GetAll().Any(u => u.DepartmentId == id);

            if (linkedJobs || linkedUsers)
            {
                // Soft deactivate to protect foreign key relational integrity
                dept.IsActive = false;
                _departmentRepository.Update(dept);
                return Ok(new { message = "Department has linked jobs/users. Soft-deactivated successfully.", isDeactivated = true });
            }

            _departmentRepository.Delete(dept);
            return Ok(new { message = "Department deleted successfully" });
        }
    }
}
