using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using final_assignment.Data;
using final_assignment.Models;
using final_assignment.Repositries.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace final_assignment.Services
{
    public class ChatServices
    {
        private readonly AppDbContext _context;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;

        public ChatServices(
            AppDbContext context, 
            IUserRepository userRepository, 
            INotificationService notificationService)
        {
            _context = context;
            _userRepository = userRepository;
            _notificationService = notificationService;
        }

        public async Task<List<ChatMessage>> GetMessagesAsync(int applicationId)
        {
            return await _context.ChatMessages
                .Where(c => c.ApplicationId == applicationId)
                .OrderBy(c => c.SentAt)
                .ToListAsync();
        }

        public async Task<ChatMessage?> SendMessageAsync(int applicationId, int senderId, string messageText)
        {
            var application = await _context.Applications
                .Include(a => a.Candidate)
                .Include(a => a.Job)
                .FirstOrDefaultAsync(a => a.Id == applicationId);

            if (application == null) return null;

            var sender = _userRepository.GetById(senderId);
            if (sender == null) return null;

            var chatMsg = new ChatMessage
            {
                ApplicationId = applicationId,
                SenderId = senderId,
                SenderName = sender.FullName,
                SenderRole = sender.Role,
                Message = messageText,
                IsRead = false,
                SentAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(chatMsg);
            await _context.SaveChangesAsync();

            // Trigger real alert to recipient
            int? recipientUserId = null;
            if (sender.Role.ToLower() == "candidate")
            {
                // Send alert to recruiter who created the job
                recipientUserId = application.Job?.RecruiterId;
            }
            else
            {
                // Send alert to candidate
                recipientUserId = application.CandidateId;
            }

            if (recipientUserId.HasValue)
            {
                var recipientUser = _userRepository.GetById(recipientUserId.Value);
                if (recipientUser != null && !string.IsNullOrWhiteSpace(recipientUser.Email))
                {
                    var title = $"New Message from {sender.FullName} ({sender.Role}) regarding {application.Job?.Title ?? "Application"}";
                    await _notificationService.SendEmailAsync(recipientUser.Email, title, messageText, recipientUserId.Value);
                }
            }

            return chatMsg;
        }

        public async Task MarkAsReadAsync(int applicationId, int currentUserId)
        {
            var unreadMsgs = await _context.ChatMessages
                .Where(c => c.ApplicationId == applicationId && c.SenderId != currentUserId && !c.IsRead)
                .ToListAsync();

            if (unreadMsgs.Any())
            {
                foreach (var msg in unreadMsgs)
                {
                    msg.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }
        }
    }
}
