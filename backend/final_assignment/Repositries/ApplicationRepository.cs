using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Repositries
{
    public class ApplicationRepository : IApplicationRepository
    {
        private readonly AppDbContext _context;
        public ApplicationRepository(AppDbContext context)
        {
            _context = context;
        }

        public void Add(Application application)
        {
            _context.Applications.Add(application);
            _context.SaveChanges();
        }

        public List<Application> GetAll()
        {
            return _context.Applications
                .Include(a => a.Job)
                .Include(a => a.Candidate)
                .Include(a => a.CandidateCV)
                .ToList();
        }

        public Application? GetById(int id)
        {
            return _context.Applications
                  .Include(a => a.Job)
                  .Include(a => a.Candidate)
                  .Include(a => a.CandidateCV)
                  .FirstOrDefault(a => a.Id == id);
        }

        public void Update(Application application)
        {
            _context.Applications.Update(application);
            _context.SaveChanges();
        }
    }
}
