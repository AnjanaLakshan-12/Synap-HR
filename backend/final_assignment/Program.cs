using final_assignment.Data;
using final_assignment.Repositries;
using final_assignment.Repositries.Interfaces;
using final_assignment.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

//add database to the container
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


// Add services to the container
builder.Services.AddScoped<ApplicationServices>();
builder.Services.AddScoped<AuditServices>();
builder.Services.AddScoped<AuthServices>();
builder.Services.AddScoped<InterviewServices>();
builder.Services.AddScoped<JobServices>();
builder.Services.AddScoped<JwtServices>();
builder.Services.AddScoped<CandidateProfileServices>();
builder.Services.AddScoped<ChatServices>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHostedService<InterviewReminderService>();
builder.Services.AddHttpClient<IAIService, GeminiAIService>();



//add interfaces to the container
//AddScoped meaning for every request .net create an new instance
//"Whenever any part of my website requests the IMemberRepository blueprint, automatically create a new instance of the MemberRepository class to do the actual work."
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IInterviewRepository, InterviewRepository>();
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICandidateProfileRepository, CandidateProfileRepository>();
builder.Services.AddScoped<IOrganizationRepository, OrganizationRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<ICandidateCVRepository, CandidateCVRepository>();


//add controllers to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();




// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey!)
        )
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();


//allow Cross-Origin Resource Sharing
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});





var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}


if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("ReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

