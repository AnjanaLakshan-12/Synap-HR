using System;
using System.Security.Claims;
using System.Threading.Tasks;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace final_assignment.Controllers
{
    [Route("api/chat")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly ChatServices _chatServices;

        public ChatController(ChatServices chatServices)
        {
            _chatServices = chatServices;
        }

        [HttpGet("application/{applicationId}")]
        public async Task<IActionResult> GetMessages(int applicationId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var messages = await _chatServices.GetMessagesAsync(applicationId);
            await _chatServices.MarkAsReadAsync(applicationId, userId);

            return Ok(messages);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendChatMessageDto dto)
        {
            if (dto == null || dto.ApplicationId <= 0 || string.IsNullOrWhiteSpace(dto.MessageText))
            {
                return BadRequest("Application ID and message text are required.");
            }

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var msg = await _chatServices.SendMessageAsync(dto.ApplicationId, userId, dto.MessageText);

            if (msg == null)
            {
                return BadRequest("Could not send chat message. Invalid application or user.");
            }

            return Ok(msg);
        }

        [HttpPut("application/{applicationId}/read")]
        public async Task<IActionResult> MarkRead(int applicationId)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            await _chatServices.MarkAsReadAsync(applicationId, userId);
            return Ok(new { message = "Messages marked as read" });
        }
    }

    public class SendChatMessageDto
    {
        public int ApplicationId { get; set; }
        public string MessageText { get; set; } = string.Empty;
    }
}
