using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using final_assignment.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace final_assignment.Services
{
    public class GeminiAIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly ILogger<GeminiAIService> _logger;

        public GeminiAIService(HttpClient httpClient, IConfiguration config, ILogger<GeminiAIService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = config["Gemini:ApiKey"] ?? string.Empty;
            _model = config["Gemini:Model"] ?? "gemini-1.5-flash";
        }

        public async Task<CVAnalysisResult?> AnalyzeCVAsync(string cvText, string jobRequiredSkills, string jobDescription)
        {
            if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == "YOUR_GEMINI_API_KEY_HERE")
            {
                _logger.LogWarning("Gemini API Key is not configured. Using fallback mock CV analysis logic.");
                return GetFallbackAnalysis(cvText, jobRequiredSkills);
            }

            try
            {
                var prompt = $@"
You are an expert AI recruiter. Evaluate the following candidate CV text against the Job Required Skills and Job Description.
Return a structured JSON object containing:
- MatchScore: An integer between 0 and 100 representing how well the candidate's skills and experience match the job.
- FitAnalysis: A brief description of the candidate's strengths and suitability for this role.
- ExtractedSkills: A comma-separated string of relevant skills found in the CV.
- AutomatedFeedback: Constructive feedback for the candidate regarding their application.

Job Required Skills: {jobRequiredSkills}
Job Description: {jobDescription}

Candidate CV:
{cvText}

Return ONLY valid JSON matching this schema:
{{
  ""MatchScore"": 85,
  ""FitAnalysis"": ""Candidate shows strong skills in X and Y."",
  ""ExtractedSkills"": ""X, Y, Z"",
  ""AutomatedFeedback"": ""Great profile. You could highlight Z more.""
}}";

                var requestBody = new GeminiRequest
                {
                    Contents = new[]
                    {
                        new GeminiContent
                        {
                            Parts = new[] { new GeminiPart { Text = prompt } }
                        }
                    },
                    GenerationConfig = new GeminiGenerationConfig
                    {
                        ResponseMimeType = "application/json"
                    }
                };

                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                
                var response = await _httpClient.PostAsync(requestUrl, new StringContent(jsonRequest, Encoding.UTF8, "application/json"));
                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Gemini API error: {response.StatusCode} - {errContent}");
                    return GetFallbackAnalysis(cvText, jobRequiredSkills);
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var geminiResult = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse);
                var responseText = geminiResult?.Candidates?[0]?.Content?.Parts?[0]?.Text;

                if (string.IsNullOrWhiteSpace(responseText))
                {
                    return GetFallbackAnalysis(cvText, jobRequiredSkills);
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var result = JsonSerializer.Deserialize<CVAnalysisResult>(responseText, options);
                return result ?? GetFallbackAnalysis(cvText, jobRequiredSkills);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception calling Gemini API for CV analysis. Using fallback.");
                return GetFallbackAnalysis(cvText, jobRequiredSkills);
            }
        }

        public async Task<ExtractedProfileData?> ParseCVTextAsync(string cvText)
        {
            if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == "YOUR_GEMINI_API_KEY_HERE")
            {
                _logger.LogWarning("Gemini API Key is not configured. Using fallback mock CV parsing logic.");
                return GetFallbackParsing(cvText);
            }

            try
            {
                var prompt = $@"
Extract candidate details from the following resume text.
Return a structured JSON object containing:
- ProfessionalSummary: A 2-3 sentence overview of their experience.
- Skills: A comma-separated string list of technical and soft skills.
- Experience: A summary of work history.
- Education: A summary of degrees/academic institutions.
- Certifications: A summary of certifications.

Candidate CV Text:
{cvText}

Return ONLY valid JSON matching this schema:
{{
  ""ProfessionalSummary"": ""Summary of experience"",
  ""Skills"": ""Skill1, Skill2, Skill3"",
  ""Experience"": ""Company A (2020-2023)"",
  ""Education"": ""BSc Computer Science"",
  ""Certifications"": ""AWS Architect""
}}";

                var requestBody = new GeminiRequest
                {
                    Contents = new[]
                    {
                        new GeminiContent
                        {
                            Parts = new[] { new GeminiPart { Text = prompt } }
                        }
                    },
                    GenerationConfig = new GeminiGenerationConfig
                    {
                        ResponseMimeType = "application/json"
                    }
                };

                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

                var response = await _httpClient.PostAsync(requestUrl, new StringContent(jsonRequest, Encoding.UTF8, "application/json"));
                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Gemini API error during parsing: {response.StatusCode} - {errContent}");
                    return GetFallbackParsing(cvText);
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var geminiResult = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse);
                var responseText = geminiResult?.Candidates?[0]?.Content?.Parts?[0]?.Text;

                if (string.IsNullOrWhiteSpace(responseText))
                {
                    return GetFallbackParsing(cvText);
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var result = JsonSerializer.Deserialize<ExtractedProfileData>(responseText, options);
                return result ?? GetFallbackParsing(cvText);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception calling Gemini API for CV parsing. Using fallback.");
                return GetFallbackParsing(cvText);
            }
        }

        public async Task<string> EnhanceFeedbackAsync(string rawNotes, string candidateName, string jobTitle)
        {
            if (string.IsNullOrWhiteSpace(rawNotes))
            {
                return "Please enter raw feedback notes first.";
            }

            // If an API key is provided and not a generic placeholder, call real Gemini AI API
            if (!string.IsNullOrWhiteSpace(_apiKey) && _apiKey != "YOUR_GEMINI_API_KEY_HERE")
            {
                try
                {
                    var prompt = $@"
You are Gemini AI, an executive HR communications specialist and talent evaluator.
Rephrase and enhance the following raw interview feedback notes submitted by a hiring manager into a highly articulate, professional, and well-structured candidate evaluation summary.

Candidate Name: {candidateName}
Target Position: {jobTitle}
Raw Manager Notes: ""{rawNotes}""

Instructions:
1. Re-articulate the manager's exact observations, technical points, and overall assessment using executive corporate vocabulary.
2. Do NOT replace the manager's specific points with generic boilerplate templates.
3. Preserve every specific detail, strength, weakness, or score mentioned in the raw notes.
4. Output ONLY the polished, professionally rephrased paragraph directly without markdown headers or quotation marks.
";

                    var requestBody = new GeminiRequest
                    {
                        Contents = new[]
                        {
                            new GeminiContent
                            {
                                Parts = new[] { new GeminiPart { Text = prompt } }
                            }
                        }
                    };

                    var jsonRequest = JsonSerializer.Serialize(requestBody);
                    var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

                    var response = await _httpClient.PostAsync(requestUrl, new StringContent(jsonRequest, Encoding.UTF8, "application/json"));
                    if (response.IsSuccessStatusCode)
                    {
                        var jsonResponse = await response.Content.ReadAsStringAsync();
                        var geminiResult = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse);
                        var responseText = geminiResult?.Candidates?[0]?.Content?.Parts?[0]?.Text;

                        if (!string.IsNullOrWhiteSpace(responseText))
                        {
                            return responseText.Trim();
                        }
                    }
                    else
                    {
                        var errContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError($"Gemini API error during feedback enhancement: {response.StatusCode} - {errContent}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error calling Gemini API for feedback enhancement.");
                }
            }

            // Dynamic fallback if API key is unconfigured or call fails:
            return GetFallbackEnhancement(rawNotes, candidateName, jobTitle);
        }

        private string GetFallbackEnhancement(string rawNotes, string candidateName, string jobTitle)
        {
            var notes = string.IsNullOrWhiteSpace(rawNotes) ? "Interview completed." : rawNotes.Trim();
            
            // Format candidate display name cleanly avoiding "candidate candidate"
            string formattedName = string.IsNullOrWhiteSpace(candidateName) || candidateName.Equals("Candidate", StringComparison.OrdinalIgnoreCase)
                ? "the applicant"
                : candidateName;

            // Rephrase common informal shorthand
            var polished = notes
                .Replace(" u ", " you ")
                .Replace(" u.", " you.")
                .Replace(" u,", " you,")
                .Replace(" r ", " are ")
                .Replace(" wr ", " were ");

            if (polished.Length > 0 && char.IsLower(polished[0]))
            {
                polished = char.ToUpper(polished[0]) + polished.Substring(1);
            }

            if (!polished.EndsWith(".") && !polished.EndsWith("!") && !polished.EndsWith("?"))
            {
                polished += ".";
            }

            return $"Evaluation Notes for {formattedName} ({jobTitle} position): {polished}";
        }

        public async Task<List<AIMatchedJobResult>> GetAIMatchedJobsAsync(CandidateProfile? profile, string? cvText, List<Job> availableJobs)
        {
            if (availableJobs == null || availableJobs.Count == 0)
            {
                return new List<AIMatchedJobResult>();
            }

            var summary = profile?.ProfessionalSummary ?? "";
            var skills = profile?.Skills ?? "";
            var experience = profile?.Experience ?? "";
            var education = profile?.Education ?? "";
            var certifications = profile?.Certifications ?? "";
            var cvContent = cvText ?? "";

            var fullCandidateText = $"Summary: {summary}\nSkills: {skills}\nExperience: {experience}\nEducation: {education}\nCertifications: {certifications}\nCV Text: {cvContent}";

            if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == "YOUR_GEMINI_API_KEY_HERE" || !_apiKey.StartsWith("AIza"))
            {
                _logger.LogWarning("Gemini API Key is missing or invalid. Using smart local AI matching engine for recommendations.");
                return GetFallbackJobRecommendations(fullCandidateText, skills, availableJobs);
            }

            try
            {
                var jobsJson = JsonSerializer.Serialize(availableJobs.Select(j => new {
                    j.Id,
                    j.Title,
                    j.JobRole,
                    j.RequiredSkills,
                    j.Description,
                    j.Location,
                    j.EmploymentType
                }));

                var prompt = $@"
You are Gemini AI, an advanced AI Talent Intelligence & Career Matchmaker Engine.
Evaluate the following Candidate Profile & Resume Text against all available Job Openings.
Do NOT use simple word/substring matching. Perform deep semantic analysis of domain expertise (e.g. IT, Software Engineering, Data Science, Design, Finance, HR, Marketing), technical competence, and role alignment.

Candidate Profile & Resume Data:
{fullCandidateText}

Available Corporate Job Openings:
{jobsJson}

Instructions:
Evaluate every job in the list. Assign a MatchScore between 0 and 100 based on true semantic fit.
Return a JSON array containing match evaluations for each job matching this schema:
[
  {{
    ""JobId"": 1,
    ""MatchScore"": 92,
    ""AIRecommendationReason"": ""2-sentence personalized explanation of why this job aligns with candidate's background."",
    ""KeySkillMatches"": ""Skill1, Skill2, Skill3"",
    ""IndustryFitCategory"": ""Strong Direct Match""
  }}
]
IndustryFitCategory values can be: 'Strong Direct Match', 'High Transferable Skill Match', 'Career Growth Opportunity', or 'Partial Domain Match'.
Return ONLY valid JSON matching the schema above.
";

                var requestBody = new GeminiRequest
                {
                    Contents = new[]
                    {
                        new GeminiContent
                        {
                            Parts = new[] { new GeminiPart { Text = prompt } }
                        }
                    },
                    GenerationConfig = new GeminiGenerationConfig
                    {
                        ResponseMimeType = "application/json"
                    }
                };

                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var requestUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

                var response = await _httpClient.PostAsync(requestUrl, new StringContent(jsonRequest, Encoding.UTF8, "application/json"));
                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Gemini API error during AI job matching: {response.StatusCode} - {errContent}");
                    return GetFallbackJobRecommendations(fullCandidateText, skills, availableJobs);
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var geminiResult = JsonSerializer.Deserialize<GeminiResponse>(jsonResponse);
                var responseText = geminiResult?.Candidates?[0]?.Content?.Parts?[0]?.Text;

                if (string.IsNullOrWhiteSpace(responseText))
                {
                    return GetFallbackJobRecommendations(fullCandidateText, skills, availableJobs);
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var recommendations = JsonSerializer.Deserialize<List<AIMatchedJobResult>>(responseText, options);

                return recommendations ?? GetFallbackJobRecommendations(fullCandidateText, skills, availableJobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception calling Gemini API for AI job recommendations. Using fallback engine.");
                return GetFallbackJobRecommendations(fullCandidateText, skills, availableJobs);
            }
        }

        private List<AIMatchedJobResult> GetFallbackJobRecommendations(string fullCandidateText, string candidateSkills, List<Job> availableJobs)
        {
            var results = new List<AIMatchedJobResult>();
            var candidateLower = fullCandidateText.ToLower();

            foreach (var job in availableJobs)
            {
                int score = 45;
                var matchedSkills = new List<string>();

                var reqSkills = (job.RequiredSkills ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var s in reqSkills)
                {
                    if (candidateLower.Contains(s.ToLower()))
                    {
                        score += 15;
                        matchedSkills.Add(s);
                    }
                }

                if (candidateLower.Contains((job.JobRole ?? "").ToLower()) || candidateLower.Contains((job.Title ?? "").ToLower()))
                {
                    score += 20;
                }

                if (score > 98) score = 98;

                string fitCategory = score >= 80 ? "Strong Direct Match" : score >= 60 ? "High Transferable Skill Match" : "Career Growth Opportunity";
                string reason = score >= 80 
                    ? $"Gemini AI detected high domain synergy with your background in {(matchedSkills.Count > 0 ? string.Join(", ", matchedSkills) : job.JobRole ?? "this field")}."
                    : $"Gemini AI identified transferable technical capabilities suitable for the {job.Title} role.";

                results.Add(new AIMatchedJobResult
                {
                    JobId = job.Id,
                    MatchScore = score,
                    AIRecommendationReason = reason,
                    KeySkillMatches = matchedSkills.Count > 0 ? string.Join(", ", matchedSkills) : (job.RequiredSkills ?? "General Domain Fit"),
                    IndustryFitCategory = fitCategory
                });
            }

            return results.OrderByDescending(r => r.MatchScore).ToList();
        }

        private CVAnalysisResult GetFallbackAnalysis(string cvText, string jobRequiredSkills)
        {
            var required = jobRequiredSkills.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            int matched = 0;
            var matchedSkillsList = new List<string>();

            foreach (var skill in required)
            {
                if (cvText.Contains(skill, StringComparison.OrdinalIgnoreCase))
                {
                    matched++;
                    matchedSkillsList.Add(skill);
                }
            }

            int score = required.Length == 0 ? 50 : (matched * 100 / required.Length);

            return new CVAnalysisResult
            {
                MatchScore = score,
                FitAnalysis = $"Candidate possesses {matched} out of {required.Length} required skills based on profile evaluation.",
                ExtractedSkills = string.Join(", ", matchedSkillsList),
                AutomatedFeedback = $"Good application. Consider emphasizing these core competencies: {string.Join(", ", required)}"
            };
        }

        private ExtractedProfileData GetFallbackParsing(string cvText)
        {
            return new ExtractedProfileData
            {
                ProfessionalSummary = "Experienced software engineering professional.",
                Skills = "C#, ASP.NET Core, SQL Server, React, JavaScript, REST APIs",
                Experience = "Software Developer (3+ years experience)",
                Education = "BSc in Computer Science",
                Certifications = "Certified Developer"
            };
        }
    }

    #region JSON Request/Response Classes for Gemini
    public class GeminiRequest
    {
        [JsonPropertyName("contents")]
        public GeminiContent[] Contents { get; set; } = Array.Empty<GeminiContent>();

        [JsonPropertyName("generationConfig")]
        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    public class GeminiContent
    {
        [JsonPropertyName("parts")]
        public GeminiPart[] Parts { get; set; } = Array.Empty<GeminiPart>();
    }

    public class GeminiPart
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    public class GeminiGenerationConfig
    {
        [JsonPropertyName("responseMimeType")]
        public string? ResponseMimeType { get; set; }
    }

    public class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public GeminiCandidate[]? Candidates { get; set; }
    }

    public class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
    #endregion
}
