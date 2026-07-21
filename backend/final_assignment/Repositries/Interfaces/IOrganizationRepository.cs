using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IOrganizationRepository
    {
        List<Organization> GetAll();
        Organization? GetById(int id);
        void Add(Organization organization);
        void Update(Organization organization);
        void Delete(Organization organization);
    }
}
