using final_assignment.DTOs;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace final_assignment.Controllers
{
    [Route("api/jobs")]
    [ApiController]
    public class JobController : ControllerBase
    {
        private readonly JobServices _jobServices;
        public JobController(JobServices jobServices)
        {
            _jobServices = jobServices;
        }

        [HttpGet]
        public IActionResult GetJobs()
        {
            return Ok(_jobServices.GetAll());
        }

        [HttpGet("active")]
        public IActionResult GetActiveJobs()
        {
            return Ok(_jobServices.GetActiveAndOpenJobs());
        }

        [Authorize(Roles = "Recruiter")]
        [HttpGet("my-organization")]
        public IActionResult GetMyOrganizationJobs()
        {
            int recruiterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(_jobServices.GetJobsForRecruiterOrganization(recruiterId));
        }


        [HttpGet("{id}")]
        public IActionResult GetJob(int id)
        {
            var job = _jobServices.GetById(id);

            if (job == null)
                return NotFound(new {message = "can't find this job"});

            return Ok(job);
        }

        [Authorize(Roles = "Recruiter")]
        [HttpPost("add")]
        public IActionResult CreateJob([FromBody]JobDto dto)
        {
            int recruiterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var job = _jobServices.Create(dto, recruiterId);

            if (job == null)
            {
                return BadRequest(new
                {
                    message = "Cannot create job. Recruiter must belong to an organization and selected department must belong to that organization."
                });
            }


            return Ok(job);
        }

        [Authorize(Roles = "Recruiter")]
        [HttpPut("{id}")]
        public IActionResult UpdateJob(int id, [FromBody] JobDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var job = _jobServices.Update(id, dto, userId);
            if (job == null)
            {
                return NotFound(new { message = "Job not found or update unauthorized." }); ;
            }

            return Ok(job);
        }


        [Authorize(Roles = "Recruiter")]
        [HttpDelete("{id}")]
        public IActionResult DeleteJob(int id)
        {
            int userid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var job = _jobServices.Delete(id, userid);
            if (job == null)
            {
                return NotFound(new {message = "Job not found or delete unauthorized" });
            }

            return Ok(new { message = "job deleted successfully" });
        }
    }
}
