using final_assignment.Enums;
namespace final_assignment.Models
{
    public class Application
    {
        public int Id {  get; set; }
        public int CandidateId { get; set; }
        public User? Candidate {  get; set; }


        public int JobId {  get; set; }
        public Job? Job { get; set; }

        public int CandidateCVId { get; set; }
        public CandidateCV? CandidateCV { get; set; }

        public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
        public int MatchScore { get; set; } = 0;
        public DateTime AppliedAt { get; set; } = DateTime.Now;



    }
}
    