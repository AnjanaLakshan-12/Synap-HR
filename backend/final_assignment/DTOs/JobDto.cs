namespace final_assignment.DTOs
{
    public class JobDto
    {
        public int DepartmentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string RequiredSkills { get; set; } = string.Empty;
        public string JobRole { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime ClosingDate { get; set; }
    }
}
