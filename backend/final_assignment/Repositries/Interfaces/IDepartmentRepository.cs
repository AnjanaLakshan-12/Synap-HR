using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IDepartmentRepository
    {
        List<Department> GetAll();
        Department? GetById(int id);
        List<Department> GetByOrganizationId(int organizationId);
        void Add(Department department);
        void Update(Department department);
        void Delete(Department department);
    }
}
