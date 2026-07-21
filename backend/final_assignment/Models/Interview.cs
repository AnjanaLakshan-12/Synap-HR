using final_assignment.Enums;

namespace final_assignment.Models
{
    public class Interview
    {
        public int Id { get; set; }

        public int ApplicationId { get; set; }
        public Application? Application { get; set; }

        public int? InterviewerId { get; set; }
        public User? Interviewer { get; set; }

        public DateTime InterviewDate { get; set; }
        public InterviewMode InterviewMode { get; set; } = InterviewMode.Online;
        public string MeetingLink { get; set; } = string.Empty;
        public string Feedback { get; set; } = string.Empty;
        public HiringDecision Decision { get; set; } = HiringDecision.Pending;
        public bool ReminderSent { get; set; } = false;
    }
}
