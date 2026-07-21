
using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IApplicationRepository
    {
        List<Application> GetAll();
        Application? GetById(int id);
        void Add(Application application);
        void Update(Application application);
    }
}
