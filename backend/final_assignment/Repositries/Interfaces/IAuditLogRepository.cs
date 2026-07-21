using final_assignment.Models;

namespace final_assignment.Repositries.Interfaces
{
    public interface IAuditLogRepository
    {
        List<AuditLog> GetAll();
        void Add(AuditLog auditLog);
    }
}

// we use reposity interfaces because if we wanted to change the database oneday we only have to change the class only