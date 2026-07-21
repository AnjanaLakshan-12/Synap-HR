namespace final_assignment.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = "";
        public string EntityName { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
