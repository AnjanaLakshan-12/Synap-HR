using final_assignment.Enums;
using System.ComponentModel.DataAnnotations;

namespace final_assignment.Models
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "Candidate";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;


        public int? OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }
    }
}
