using System;
using final_assignment.Enums;

namespace final_assignment.Models
{
    public class NotificationLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public User? User { get; set; }
        public string Recipient { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public bool IsSent { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
