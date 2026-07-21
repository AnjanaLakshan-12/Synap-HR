using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface ICandidateCVRepository
    {
        List<CandidateCV> GetAll();
        CandidateCV? GetById(int id);
        List<CandidateCV> GetByCandidateProfileId(int candidateProfileId);
        void Add(CandidateCV cv);
        void Update(CandidateCV cv);
        void Delete(CandidateCV cv);
    }
}
