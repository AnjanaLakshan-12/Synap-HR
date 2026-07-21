using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Repositries
{
    public class CandidateProfileRepository : ICandidateProfileRepository
    {
        private readonly AppDbContext _context;

        public CandidateProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        public CandidateProfile? GetByCandidateId(int candidateId)
        {
            return _context.CandidateProfiles
                .Include(p => p.Candidate)
                .FirstOrDefault(p => p.CandidateId == candidateId);
        }

        public CandidateProfile? GetById(int id)
        {
            return _context.CandidateProfiles
                .Include(p => p.Candidate)
                .FirstOrDefault(p => p.Id == id);
        }

        public List<CandidateProfile> GetAll()
        {
            return _context.CandidateProfiles
                .Include(p => p.Candidate)
                .ToList();
        }

        public void Add(CandidateProfile profile)
        {
            _context.CandidateProfiles.Add(profile);
            _context.SaveChanges();
        }

        public void Update(CandidateProfile profile)
        {
            _context.CandidateProfiles.Update(profile);
            _context.SaveChanges();
        }
    }
}
