using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IUserRepository
    {
        List<User> GetAll();
        User? GetById(int id);
        User? GetByEmail(string email);
        bool EmailExists(string email);
        void Add(User user);
        void Update(User user);
    }
}
