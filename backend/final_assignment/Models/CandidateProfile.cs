namespace final_assignment.Models
{
    public class CandidateProfile
    {
        public int Id { get; set; }

        public int CandidateId { get; set; }
        public User? Candidate { get; set; }

        public string PhoneNumber { get; set; } = "";
        public string Address { get; set; } = "";
        public string ProfessionalSummary { get; set; } = "";
        public string Skills { get; set; } = "";
        public string Experience { get; set; } = "";
        public string Education { get; set; } = "";
        public string Certifications { get; set; } = "";
        public string LinkedInUrl { get; set; } = "";
        public string PortfolioUrl { get; set; } = "";
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
