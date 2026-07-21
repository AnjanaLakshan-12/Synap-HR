namespace final_assignment.Models
{
    public class Department
    {
        public int Id { get; set; }

        public string Name { get; set; } = "";

        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }
        public bool IsActive { get; set; } = true;

        public List<Job> Jobs { get; set; } = new();
    }
}
