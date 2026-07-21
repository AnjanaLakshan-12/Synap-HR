using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;

namespace final_assignment.Services
{
    public class AuditServices
    {
        private readonly IAuditLogRepository _logRepository;
        public AuditServices(IAuditLogRepository logRepository)
        {
            this._logRepository = logRepository;
        }

        public void Log(int? userID,string action,string entityName)
        {
            var auditlog = new AuditLog
            {
                UserId = userID,
                Action = action,
                EntityName = entityName,
                CreatedAt = DateTime.Now
            };

            _logRepository.Add(auditlog);
        }


    }
}
