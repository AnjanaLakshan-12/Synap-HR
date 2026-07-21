using final_assignment.DTOs;
using final_assignment.Enums;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace final_assignment.Controllers
{
    [Route("api/applications")]
    [ApiController]
    public class ApplicationController : ControllerBase
    {

        private readonly ApplicationServices _applicationServices;
        public ApplicationController(ApplicationServices applicationServices)
        {
            _applicationServices = applicationServices;
        }


        [Authorize(Roles ="Candidate")]
        [HttpPost("apply")]
        public async Task<IActionResult> Apply([FromBody]ApplicationDto dto)
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var application = await _applicationServices.ApplyAsync(dto, candidateId);

            if (application == null) 
            {
                return NotFound(new {message= "The job you are applying for was not found." });
            }

            //return Ok(application);
            return CreatedAtAction("GetApplication", new { id = application.Id }, application);  //application in here is the actual data payload sent back in the HTTP response body

        }
        [HttpGet("{id}", Name = "GetApplication")] // The Name parameter allows cross-controller linking
        public IActionResult GetApplication(int id)
        {
            var application = _applicationServices.GetById(id);

            if (application == null)
                return NotFound();

            return Ok(application);
        }


        [Authorize(Roles ="Recruiter,HiringManager")]
        [HttpGet]
        public IActionResult GetApplications()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            return Ok(_applicationServices.GetApplicationsForStaff(userId));
        }



        [Authorize(Roles = "Recruiter")]
        [HttpPut("{id}/shortlist")]
        public async Task<IActionResult> Shortlist(int id)
        {
            int recruiterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var application = await _applicationServices.ShortlistingAsync(id, recruiterId);

            if (application == null) 
            {  
                return NotFound(); 
            }

            return Ok(new {message = "application added to shortlist" ,application});
        }


        [Authorize(Roles = "HiringManager , Recruiter")]
        [HttpPut("{id}/decision")]
        public async Task<IActionResult> MakeDecision(int id,[FromQuery] ApplicationStatus decision)
        {
            int managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);


            var application = await _applicationServices.MakeDecisionAsync(id, decision, managerId);

            if (application == null)
            {
                return NotFound(new { message = "apllication was not found." });
            }

            return Ok(new { message = "application adeed to shortlist", application });
        }


        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public IActionResult GetMyApplications()
        {
            int candidateId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var applications = _applicationServices.GetByCandidateId(candidateId);

            return Ok(applications);
        }




    }
}
