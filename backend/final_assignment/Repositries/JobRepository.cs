using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;

namespace final_assignment.Repositries
{
    public class JobRepository : IJobRepository
    {
        private readonly AppDbContext _context;
        public JobRepository(AppDbContext context)
        {
            _context = context;
        }

        public void Add(Job job)
        {
            _context.Jobs.Add(job);
            _context.SaveChanges();
        }

        public void Delete(Job job)
        {  
            _context.Jobs.Remove(job);
            _context.SaveChanges();
        }
        

        public List<Job> GetAll()
        {
            return _context.Jobs.ToList();
        }

        public Job? GetById(int id)
        {
            return _context.Jobs.Find(id);
        }

        public void Update(Job job)
        {
            _context.Jobs.Update(job);
            _context.SaveChanges();
        }
    }
}
