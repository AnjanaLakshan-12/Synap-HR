using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using final_assignment.Data;
using final_assignment.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace final_assignment.Services
{
    public class InterviewReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<InterviewReminderService> _logger;

        public InterviewReminderService(IServiceProvider serviceProvider, ILogger<InterviewReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Interview Reminder Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Interview Reminder Worker running check at: {time}", DateTimeOffset.Now);

                try
                {
                    await CheckAndSendRemindersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while running the interview reminder checks.");
                }

                // Check every 1 minute for demonstration/simulation responsiveness
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("Interview Reminder Background Service is stopping.");
        }

        private async Task CheckAndSendRemindersAsync()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var now = DateTime.UtcNow;
                var reminderLimit = now.AddHours(24);

                var upcomingInterviews = await context.Interviews
                    .Include(i => i.Interviewer)
                    .Include(i => i.Application)
                        .ThenInclude(a => a!.Candidate)
                    .Include(i => i.Application)
                        .ThenInclude(a => a!.Job)
                    .Where(i => i.InterviewDate > now && i.InterviewDate <= reminderLimit && !i.ReminderSent)
                    .ToListAsync();

                if (!upcomingInterviews.Any())
                {
                    _logger.LogInformation("No pending upcoming interview reminders to send.");
                    return;
                }

                _logger.LogInformation("Found {Count} upcoming interviews requiring reminders.", upcomingInterviews.Count);

                foreach (var interview in upcomingInterviews)
                {
                    var candidate = interview.Application?.Candidate;
                    var interviewer = interview.Interviewer;
                    var jobTitle = interview.Application?.Job?.Title ?? "Position";

                    // 1. Send Reminder to Candidate
                    if (candidate != null)
                    {
                        var candidateSms = $"Reminder: You have an interview for {jobTitle} on {interview.InterviewDate.ToLocalTime()}. Link: {interview.MeetingLink}";
                        await notificationService.SendSmsAsync(candidate.Email, candidateSms, candidate.Id);
                    }

                    // 2. Send Reminder to Interviewer (Manager)
                    if (interviewer != null)
                    {
                        var managerSms = $"Reminder: You are conducting an interview for {candidate?.FullName ?? "Candidate"} on {interview.InterviewDate.ToLocalTime()}. Link: {interview.MeetingLink}";
                        await notificationService.SendSmsAsync(interviewer.Email, managerSms, interviewer.Id);
                    }

                    interview.ReminderSent = true;
                }

                await context.SaveChangesAsync();
                _logger.LogInformation("Successfully sent reminders and updated records.");
            }
        }
    }
}
