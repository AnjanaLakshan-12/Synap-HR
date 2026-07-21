using final_assignment.DTOs;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using final_assignment.Enums;
using BC = BCrypt.Net.BCrypt;



namespace final_assignment.Services
{
    public class AuthServices
    {
        private readonly IUserRepository _userRepository;
        private readonly AuditServices _auditService;
        private readonly JwtServices _jwtServices;


        public AuthServices(IUserRepository userRepository, AuditServices auditServices, JwtServices jwtServices)
        {
            _userRepository = userRepository;
            _auditService = auditServices;
            this._jwtServices = jwtServices;
        }

        //create user - cadidate
        public String Register(RegisterDto dto)
        {
            if (_userRepository.EmailExists(dto.Email))
            {
                return "email already exist";
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Candidate"

            };

            _userRepository.Add(user);
            _auditService.Log(user.Id, "user registered", "user");
            return "User registered successfully";

        }

        //create other users
        public string CreateUserByAdmin(CreateUserDto dto, int adminId)
        {
            if (_userRepository.EmailExists(dto.Email))
            {
                return "email already exist";
            }

            var allowduserRoles = new List<string> { "Admin", "Recruiter", "HiringManager" };

            if (!allowduserRoles.Contains(dto.Role))
            {
                return "invalid user role";
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                IsActive = true,
                CreatedAt = DateTime.Now,
                OrganizationId = dto.OrganizationId,
                DepartmentId = dto.DepartmentId
            };

            _userRepository.Add(user);
            _auditService.Log(adminId, $"Admin created user with role {dto.Role}", "User");
            return "User created successfully";


        }


        public object? Login(LoginDto dto)
        {
            var user = _userRepository.GetByEmail(dto.Email);

            if (user == null)
            {
                return "user didnt exist";
            }
                

            bool validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

            if (!validPassword)
            {
                return "password incorrect";
            }
                

            var token = _jwtServices.GenerateToken(user);

            _auditService.Log(user.Id, "User logged in", "User");

            return new
            {
                token,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role.ToString()
            };
        }
        //change user status
        //create other user roles



    }
    
}
