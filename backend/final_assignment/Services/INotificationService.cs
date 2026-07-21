using System.Collections.Generic;
using System.Threading.Tasks;
using final_assignment.Models;

namespace final_assignment.Services
{
    public interface INotificationService
    {
        Task SendEmailAsync(string toEmail, string subject, string body, int? userId = null);
        Task SendSmsAsync(string toPhone, string message, int? userId = null);
        Task<List<NotificationLog>> GetUserNotificationsAsync(int userId);
        Task MarkUserNotificationsAsReadAsync(int userId);
    }
}
