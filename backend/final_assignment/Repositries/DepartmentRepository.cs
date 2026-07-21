using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Repositries
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly AppDbContext _context;

        public DepartmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Department> GetAll()
        {
            return _context.Departments
                .Include(d => d.Organization)
                .ToList();
        }

        public Department? GetById(int id)
        {
            return _context.Departments
                .Include(d => d.Organization)
                .FirstOrDefault(d => d.Id == id);
        }

        public List<Department> GetByOrganizationId(int organizationId)
        {
            return _context.Departments
                .Where(d => d.OrganizationId == organizationId)
                .ToList();
        }

        public void Add(Department department)
        {
            _context.Departments.Add(department);
            _context.SaveChanges();
        }

        public void Update(Department department)
        {
            _context.Departments.Update(department);
            _context.SaveChanges();
        }

        public void Delete(Department department)
        {
            _context.Departments.Remove(department);
            _context.SaveChanges();
        }
    }
}
