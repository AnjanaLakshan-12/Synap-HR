using final_assignment.DTOs;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;

namespace final_assignment.Services
{
    public class CandidateProfileServices
    {
        private readonly ICandidateProfileRepository _profileRepository;
        private readonly AuditServices _auditServices;

        public CandidateProfileServices(
            ICandidateProfileRepository profileRepository,
            AuditServices auditServices)
        {
            _profileRepository = profileRepository;
            _auditServices = auditServices;
        }

        public CandidateProfile CreateOrUpdate(CandidateProfileDto dto, int candidateId)
        {
            var profile = _profileRepository.GetByCandidateId(candidateId);

            if (profile == null)
            {
                profile = new CandidateProfile
                {
                    CandidateId = candidateId,
                    PhoneNumber = dto.PhoneNumber,
                    Address = dto.Address,
                    ProfessionalSummary = dto.ProfessionalSummary,
                    Skills = dto.Skills,
                    Experience = dto.Experience,
                    Education = dto.Education,
                    Certifications = dto.Certifications,
                    LinkedInUrl = dto.LinkedInUrl,
                    PortfolioUrl = dto.PortfolioUrl,
                    UpdatedAt = DateTime.Now
                };

                _profileRepository.Add(profile);
                _auditServices.Log(candidateId, "created candidate profile", "CandidateProfile");

                return profile;
            }

            profile.PhoneNumber = dto.PhoneNumber;
            profile.Address = dto.Address;
            profile.ProfessionalSummary = dto.ProfessionalSummary;
            profile.Skills = dto.Skills;
            profile.Experience = dto.Experience;
            profile.Education = dto.Education;
            profile.Certifications = dto.Certifications;
            profile.LinkedInUrl = dto.LinkedInUrl;
            profile.PortfolioUrl = dto.PortfolioUrl;
            profile.UpdatedAt = DateTime.Now;

            _profileRepository.Update(profile);
            _auditServices.Log(candidateId, "updated candidate profile", "CandidateProfile");

            return profile;
        }

        public CandidateProfile? GetMyProfile(int candidateId)
        {
            return _profileRepository.GetByCandidateId(candidateId);
        }

        public List<CandidateProfile> GetAllProfiles()
        {
            return _profileRepository.GetAll();
        }
    }
}
