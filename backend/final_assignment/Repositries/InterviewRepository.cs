using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Repositries
{
    public class InterviewRepository : IInterviewRepository
    {
        private readonly AppDbContext _context;
        public InterviewRepository(AppDbContext context)
        {
            _context = context;
        }

        public void Add(Interview interview)
        {
            _context.Interviews.Add(interview);
            _context.SaveChanges();
        }

        public List<Interview> GetAll()
        {
            return _context.Interviews
                .Include(i => i.Interviewer)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Job)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Candidate)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.CandidateCV)
                .ToList();
        }

        public Interview? GetById(int id)
        {
            return _context.Interviews
                .Include(i => i.Interviewer)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Job)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.Candidate)
                .Include(i => i.Application)
                    .ThenInclude(a => a!.CandidateCV)
                .FirstOrDefault(i => i.Id == id);
        }

        public void Update(Interview interview)
        {
            _context.Interviews.Update(interview);
            _context.SaveChanges();
        }
    }
}
