using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IJobRepository
    {
        List<Job> GetAll();
        Job? GetById(int id);
        void Add(Job job);
        void Update(Job job);
        void Delete(Job job);
    }
}
