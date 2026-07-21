using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Repositries
{
    public class CandidateCVRepository : ICandidateCVRepository
    {
        private readonly AppDbContext _context;

        public CandidateCVRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<CandidateCV> GetAll()
        {
            return _context.CandidateCVs
                .Include(c => c.CandidateProfile)
                .ToList();
        }

        public CandidateCV? GetById(int id)
        {
            return _context.CandidateCVs
                .Include(c => c.CandidateProfile)
                .FirstOrDefault(c => c.Id == id);
        }

        public List<CandidateCV> GetByCandidateProfileId(int candidateProfileId)
        {
            return _context.CandidateCVs
                .Where(c => c.CandidateProfileId == candidateProfileId)
                .ToList();
        }

        public void Add(CandidateCV cv)
        {
            _context.CandidateCVs.Add(cv);
            _context.SaveChanges();
        }

        public void Update(CandidateCV cv)
        {
            _context.CandidateCVs.Update(cv);
            _context.SaveChanges();
        }

        public void Delete(CandidateCV cv)
        {
            _context.CandidateCVs.Remove(cv);
            _context.SaveChanges();
        }
    }
}
