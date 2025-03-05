using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PracticeGrading.API;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using PracticeGrading.Data;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

namespace PracticeGrading.Tests;

public class TestBase
{
    private WebApplicationFactory<Program> _factory;
    private AppDbContext _dbContext;

    protected HttpClient Client;

    protected UserRepository UserRepository;
    protected MeetingRepository MeetingRepository;
    protected CriteriaRepository CriteriaRepository;
    protected MarkRepository MarkRepository;

    protected IOptions<JwtOptions> JwtOptions;

    protected JwtService JwtService;
    protected UserService UserService;
    protected MeetingService MeetingService;
    protected CriteriaService CriteriaService;
    protected MarkService MarkService;

    protected StudentWork TestWork = new()
        { StudentName = string.Empty, Theme = string.Empty, Supervisor = string.Empty, AverageCriteriaMarks = [] };

    protected Criteria TestCriteria = new() { Name = string.Empty };

    [SetUp]
    public void SetUp()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    services.AddDbContext<AppDbContext>(options =>
                        options.UseInMemoryDatabase("test_db"));
                });
            });

        Client = _factory.CreateClient();

        var scope = _factory.Services.CreateScope();
        _dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        _dbContext.Database.EnsureCreated();

        UserRepository = new UserRepository(_dbContext);
        MeetingRepository = new MeetingRepository(_dbContext);
        CriteriaRepository = new CriteriaRepository(_dbContext);
        MarkRepository = new MarkRepository(_dbContext);

        JwtOptions = Options.Create(new JwtOptions
        {
            SecretKey = "TestSecretKeyTestSecretKeyTestSecretKey",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            Expires = TimeSpan.FromMinutes(20)
        });

        JwtService = new JwtService(JwtOptions);
        UserService = new UserService(UserRepository, JwtService);
        MeetingService = new MeetingService(MeetingRepository, CriteriaRepository, UserRepository);
        CriteriaService = new CriteriaService(CriteriaRepository);
        MarkService = new MarkService(MarkRepository, CriteriaRepository);

        if (!Directory.GetCurrentDirectory().Contains("Debug")) return;
        var projectDirectory = Directory.GetParent(Directory.GetCurrentDirectory())?.Parent?.Parent?.FullName;
        Directory.SetCurrentDirectory(projectDirectory ?? throw new InvalidOperationException());
    }

    [TearDown]
    public void TearDown()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
        _factory.Dispose();
        Client.Dispose();
    }

    protected async Task CreateTestMeeting()
    {
        var meeting = new Meeting
        {
            Id = 1,
            DateAndTime = DateTime.Now,
            Criteria = [new Criteria { Id = 2, Name = string.Empty }],
            StudentWorks =
            [
                new StudentWork
                {
                    Id = 3, StudentName = string.Empty, Theme = string.Empty, Supervisor = string.Empty,
                    AverageCriteriaMarks = []
                }
            ],
            Members = [new User { Id = 4, UserName = "member" }]
        };

        await MeetingRepository.Create(meeting);
    }

    protected async Task LoginAdmin()
    {
        var loginRequest = new LoginAdminRequest("admin", "admin");

        var response = await Client.PostAsJsonAsync("/login", loginRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseContent);
        var token = jsonDoc.RootElement.GetProperty("token").GetString();

        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}