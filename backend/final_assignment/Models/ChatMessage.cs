using System;

namespace final_assignment.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }

        public int ApplicationId { get; set; }
        public Application? Application { get; set; }

        public int SenderId { get; set; }
        public User? Sender { get; set; }

        public string SenderName { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty; // Candidate, Recruiter, HiringManager
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
