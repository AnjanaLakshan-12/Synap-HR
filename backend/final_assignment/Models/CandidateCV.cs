namespace final_assignment.Models
{
    public class CandidateCV
    {
        public int Id { get; set; }

        public int CandidateProfileId { get; set; }
        public CandidateProfile? CandidateProfile { get; set; }

        public string CvTitle { get; set; } = "";
        public string FilePath { get; set; } = "";
        public string ExtractedText { get; set; } = "";
        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}
