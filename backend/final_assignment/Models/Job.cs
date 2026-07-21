namespace final_assignment.Models
{
    public class Job
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public string JobRole { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;

        public DateTime ClosingDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;

        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public int DepartmentId { get; set; }
        public Department? Department { get; set; }



        public int RecruiterId { get; set; }
        public User? Recruiter { get; set; } //When EF(entity framework) Core looks at User? Recruiter, it says: "Wait, User is a complex object class containing its own IDs, Names, and Emails. A single database column cannot hold an entire object cluster."
    



    }
}
