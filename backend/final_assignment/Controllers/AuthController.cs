using final_assignment.DTOs;
using final_assignment.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace final_assignment.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthServices _authServices;
        public AuthController(AuthServices authServices)
        { 
            _authServices = authServices;
        }

        //register this should only work for candidate because service layer is set role as candidate
        [HttpPost("register")]
        public IActionResult Register(RegisterDto dto)
        {
            var result = _authServices.Register(dto);

            if (result == "email already exist")
                return BadRequest(result);

            return Ok(result);
        }


        //login
        [HttpPost("login")]
        public IActionResult Login(LoginDto dto)
        {
            var result = _authServices.Login(dto);
            if (result is string error)
            {
                return BadRequest(error);
            }

            return Ok(result);
        }

    }
}


