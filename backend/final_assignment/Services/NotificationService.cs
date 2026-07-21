using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using final_assignment.Data;
using final_assignment.Enums;
using final_assignment.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace final_assignment.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, IConfiguration configuration, ILogger<NotificationService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body, int? userId = null)
        {
            var log = new NotificationLog
            {
                UserId = userId,
                Recipient = toEmail,
                Title = subject,
                Message = body,
                Type = NotificationType.Email,
                IsSent = false,
                SentAt = DateTime.UtcNow
            };

            var smtpHost = _configuration["Smtp:Host"];
            var smtpPortStr = _configuration["Smtp:Port"];
            var smtpUser = _configuration["Smtp:Username"];
            var smtpPass = _configuration["Smtp:Password"];
            var senderEmail = _configuration["Smtp:SenderEmail"] ?? "no-reply@recruitment.com";
            var senderName = _configuration["Smtp:SenderName"] ?? "Recruitment Platform";

            bool smtpConfigured = !string.IsNullOrWhiteSpace(smtpHost) && 
                                  !string.IsNullOrWhiteSpace(smtpUser) && 
                                  !string.IsNullOrWhiteSpace(smtpPass);

            if (smtpConfigured)
            {
                try
                {
                    int smtpPort = int.TryParse(smtpPortStr, out var p) ? p : 587;
                    bool enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;

                    using (var mail = new MailMessage())
                    {
                        mail.From = new MailAddress(senderEmail, senderName);
                        mail.To.Add(new MailAddress(toEmail));
                        mail.Subject = subject;
                        mail.Body = body;
                        mail.IsBodyHtml = true;

                        using (var smtp = new SmtpClient(smtpHost, smtpPort))
                        {
                            smtp.Credentials = new NetworkCredential(smtpUser, smtpPass);
                            smtp.EnableSsl = enableSsl;
                            await smtp.SendMailAsync(mail);
                        }
                    }

                    log.IsSent = true;
                    _logger.LogInformation("Real email sent to {Email} with subject: {Subject}", toEmail, subject);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send real email to {Email}. Falling back to simulation.", toEmail);
                    SimulateEmailToConsole(toEmail, subject, body);
                    log.IsSent = false;
                }
            }
            else
            {
                SimulateEmailToConsole(toEmail, subject, body);
                log.IsSent = true; // Mark as sent in simulation mode
            }

            _context.NotificationLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task SendSmsAsync(string toPhone, string message, int? userId = null)
        {
            var log = new NotificationLog
            {
                UserId = userId,
                Recipient = toPhone,
                Title = "SMS Notification",
                Message = message,
                Type = NotificationType.SMS,
                IsSent = false,
                SentAt = DateTime.UtcNow
            };

            // SMS Simulation
            Console.WriteLine();
            Console.WriteLine("==========================================================================");
            Console.WriteLine("📱 [SMS SIMULATION SENDING]");
            Console.WriteLine($"   To:      {toPhone}");
            Console.WriteLine($"   Body:    {message}");
            Console.WriteLine("==========================================================================");
            Console.WriteLine();

            log.IsSent = true; // Mark as sent in simulation mode
            
            _context.NotificationLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<List<NotificationLog>> GetUserNotificationsAsync(int userId)
        {
            return _context.NotificationLogs
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.SentAt)
                .ToList();
        }

        public async Task MarkUserNotificationsAsReadAsync(int userId)
        {
            var unreadLogs = _context.NotificationLogs
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToList();

            if (unreadLogs.Any())
            {
                foreach (var log in unreadLogs)
                {
                    log.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }
        }

        private void SimulateEmailToConsole(string toEmail, string subject, string body)
        {
            Console.WriteLine();
            Console.WriteLine("==========================================================================");
            Console.WriteLine("📧 [EMAIL SIMULATION SENDING]");
            Console.WriteLine($"   To:      {toEmail}");
            Console.WriteLine($"   Subject: {subject}");
            Console.WriteLine($"   Body:    {body}");
            Console.WriteLine("==========================================================================");
            Console.WriteLine();
        }
    }
}
