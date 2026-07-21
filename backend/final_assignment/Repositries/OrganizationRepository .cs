using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Repositries
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly AppDbContext _context;

        public OrganizationRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Organization> GetAll()
        {
            return _context.Organizations
                .Include(o => o.Departments)
                .ToList();
        }

        public Organization? GetById(int id)
        {
            return _context.Organizations
                .Include(o => o.Departments)
                .FirstOrDefault(o => o.Id == id);
        }

        public void Add(Organization organization)
        {
            _context.Organizations.Add(organization);
            _context.SaveChanges();
        }

        public void Update(Organization organization)
        {
            _context.Organizations.Update(organization);
            _context.SaveChanges();
        }

        public void Delete(Organization organization)
        {
            _context.Organizations.Remove(organization);
            _context.SaveChanges();
        }
    }
}
