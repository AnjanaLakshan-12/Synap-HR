using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;

namespace final_assignment.Repositries
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;
        public UserRepository(AppDbContext context)
        {
            _context = context;
        }


        public void Add(User user)
        {
            _context.Users.Add(user);
            _context.SaveChanges();
        }

        public bool EmailExists(string email)
        {
            return  _context.Users.Any(x => x.Email == email);
        }

        public List<User> GetAll()
        {
            return _context.Users.ToList(); 
        }

        public User? GetByEmail(string email)
        {
            return _context.Users.FirstOrDefault(x=>x.Email == email);
        }

        public User? GetById(int id)
        {
            return _context.Users.Find(id);
        }

        public void Update(User user)
        {
            _context.Users.Update(user);
            _context.SaveChanges();
        }
    }
}
