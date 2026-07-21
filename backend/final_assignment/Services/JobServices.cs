using final_assignment.DTOs;
using final_assignment.Models;
using final_assignment.Repositries;
using final_assignment.Repositries.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Security.Claims;

namespace final_assignment.Services
{
    public class JobServices
    {
        private readonly IJobRepository _jobrepository;
        private readonly AuditServices _auditService;
        private readonly IUserRepository _userRepository;
        private readonly IDepartmentRepository _departmentRepository;
        public JobServices(IJobRepository jobrepository ,AuditServices auditservices, IUserRepository _userRepository, IDepartmentRepository _departmentRepository)
        {
            _jobrepository = jobrepository;
            _auditService = auditservices;
            this._userRepository = _userRepository;
            this._departmentRepository = _departmentRepository;
        }


        public List<Job> GetAll()
        {
            return _jobrepository.GetAll();
        }

        public List<Job> GetJobsForRecruiterOrganization(int recruiterId)
        {
            var recruiter = _userRepository.GetById(recruiterId);
            if (recruiter == null || recruiter.OrganizationId == null)
            {
                return new List<Job>();
            }

            return _jobrepository.GetAll()
                .Where(j => j.OrganizationId == recruiter.OrganizationId.Value)
                .ToList();
        }

        public List<Job> GetActiveAndOpenJobs()
        {
            var today = DateTime.Now.Date;
            return _jobrepository.GetAll()
                .Where(j => j.IsActive && j.ClosingDate.Date >= today)
                .ToList();
        }


        public Job? GetById(int id)
        {
            return _jobrepository.GetById(id);
        }


        public Job? Create(JobDto dto, int recruiterId)
        {
            var recruiter = _userRepository.GetById(recruiterId);

            if (recruiter == null || recruiter.OrganizationId == null)
            {
                return null;
            }


            var department = _departmentRepository.GetById(dto.DepartmentId);

            if (department == null || department.OrganizationId != recruiter.OrganizationId)
            {
                return null;
            }

            var job = new Job
            {
                Title = dto.Title,
                Description = dto.Description,
                RequiredSkills = dto.RequiredSkills,
                JobRole = dto.JobRole,
                EmploymentType = dto.EmploymentType,
                Location = dto.Location,
                ClosingDate = dto.ClosingDate,

                RecruiterId = recruiterId,
                OrganizationId = recruiter.OrganizationId.Value,
                DepartmentId = dto.DepartmentId
            };

            _jobrepository.Add(job);
            _auditService.Log(recruiterId, "created job", "Job");

            return job;
        }



        public Job? Update(int id, JobDto dto, int userid)
        {
            var job = _jobrepository.GetById(id);
            if (job == null)
            {
                return null;
            }
            else if(userid != job.RecruiterId)
            {
                return null;
            }
            else
            {
                job.Title = dto.Title;
                job.Description = dto.Description;
                job.RequiredSkills = dto.RequiredSkills;
                job.Location = dto.Location;

                _jobrepository.Update(job);
                _auditService.Log(userid, "job updated", "job");

                return job;
            }
        }

        public Job? Delete(int id, int userid)
        {
            var job = _jobrepository.GetById(id);
            if (job == null)
            {
                return null;
            }
            else if (userid != job.RecruiterId)
            {
                return null;
            }
            else
            {
                _jobrepository.Delete(job);
                _auditService.Log(userid, "job deleted", "job");

                return job;
            }
        }


    }
}