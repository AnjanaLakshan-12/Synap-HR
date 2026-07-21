using System.Collections.Generic;
using System.Threading.Tasks;
using final_assignment.Models;

namespace final_assignment.Services
{
    public interface IAIService
    {
        Task<CVAnalysisResult?> AnalyzeCVAsync(string cvText, string jobRequiredSkills, string jobDescription);
        Task<ExtractedProfileData?> ParseCVTextAsync(string cvText);
        Task<string> EnhanceFeedbackAsync(string rawNotes, string candidateName, string jobTitle);
        Task<List<AIMatchedJobResult>> GetAIMatchedJobsAsync(CandidateProfile? profile, string? cvText, List<Job> availableJobs);
    }

    public class CVAnalysisResult
    {
        public int MatchScore { get; set; }
        public string FitAnalysis { get; set; } = string.Empty;
        public string ExtractedSkills { get; set; } = string.Empty;
        public string AutomatedFeedback { get; set; } = string.Empty;
    }

    public class ExtractedProfileData
    {
        public string ProfessionalSummary { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string Experience { get; set; } = string.Empty;
        public string Education { get; set; } = string.Empty;
        public string Certifications { get; set; } = string.Empty;
    }

    public class AIMatchedJobResult
    {
        public int JobId { get; set; }
        public int MatchScore { get; set; }
        public string AIRecommendationReason { get; set; } = string.Empty;
        public string KeySkillMatches { get; set; } = string.Empty;
        public string IndustryFitCategory { get; set; } = string.Empty;
    }
}
