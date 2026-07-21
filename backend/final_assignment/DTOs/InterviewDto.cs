using final_assignment.Enums;

namespace final_assignment.DTOs
{
    public class InterviewDto
    {
        public int ApplicationId { get; set; }
        public int? InterviewerId { get; set; }
        public DateTime InterviewDate { get; set; }
        public InterviewMode InterviewMode { get; set; } = InterviewMode.Online;
        public string MeetingLink { get; set; } = string.Empty;
    }
}
