using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IInterviewRepository
    {
        List<Interview> GetAll();
        Interview? GetById(int id);
        void Add(Interview interview);
        void Update(Interview interview);
    }
}
