using System;
using System.Security.Claims;
using System.Threading.Tasks;
using final_assignment.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace final_assignment.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var logs = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(logs);
        }

        [HttpPut("mark-read")]
        public async Task<IActionResult> MarkNotificationsAsRead()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            await _notificationService.MarkUserNotificationsAsReadAsync(userId);
            return Ok(new { message = "Notifications marked as read" });
        }
    }
}
