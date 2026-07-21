namespace final_assignment.Models
{
    public class Organization
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Industry { get; set; } = "";
        public string Location { get; set; } = "";
        public string Description { get; set; } = "";
        public string WebsiteUrl { get; set; } = "";
        public string ContactEmail { get; set; } = "";
        public string ContactPhone { get; set; } = "";
        public string CompanySize { get; set; } = "";
        public bool IsActive { get; set; } = true;

        public List<Department> Departments { get; set; } = new();
        public List<User> Users { get; set; } = new();
    }
}
