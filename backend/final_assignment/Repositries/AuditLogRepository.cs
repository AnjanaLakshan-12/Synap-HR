using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;

namespace final_assignment.Repositries
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly AppDbContext _context;
        public AuditLogRepository(AppDbContext context)
        {
            _context = context;
        }

        public void Add(AuditLog auditLog)
        {
            _context.AuditLogs.Add(auditLog);
            _context.SaveChanges();
        }

        public List<AuditLog> GetAll()
        {
            return _context.AuditLogs.ToList();
        }
    }
}
