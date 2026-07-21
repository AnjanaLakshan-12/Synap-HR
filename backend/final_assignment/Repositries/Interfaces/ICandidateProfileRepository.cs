using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface ICandidateProfileRepository
    {
        CandidateProfile? GetByCandidateId(int candidateId);
        CandidateProfile? GetById(int id);
        List<CandidateProfile> GetAll();
        void Add(CandidateProfile profile);
        void Update(CandidateProfile profile);
    }
}
