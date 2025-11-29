using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PracticeGrading.API;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using PracticeGrading.Data;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;

namespace PracticeGrading.Tests;

public class TestBase
{
    private WebApplicationFactory<Program> factory;
    private AppDbContext dbContext;

    protected HttpClient Client;

    protected UserRepository UserRepository;
    protected MeetingRepository MeetingRepository;
    protected CriteriaGroupRepository CriteriaGroupRepository;
    protected CriteriaRepository CriteriaRepository;
    protected MarkRepository MarkRepository;

    protected IOptions<JwtOptions> JwtOptions;

    protected JwtService JwtService;
    protected UserService UserService;
    protected MeetingService MeetingService;
    protected CriteriaGroupService CriteriaGroupService;
    protected CriteriaService CriteriaService;
    protected MarkService MarkService; 

    protected StudentWork TestWork = new()
        { StudentName = string.Empty, Theme = string.Empty, Supervisor = string.Empty, AverageCriteriaMarks = [] };

    protected Criteria TestCriteria = new() { Name = string.Empty };
    
    protected CriteriaGroup TestCriteriaGroup = new() { Name = string.Empty };

    protected int MeetingId = 1;
    protected int MemberId = 0;

    [SetUp]
    public void SetUp()
    {
        factory = new WebApplicationFactory<Program>()
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

        Client = factory.CreateClient();

        var scope = factory.Services.CreateScope();
        dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.Database.EnsureCreated();

        MeetingRepository = new MeetingRepository(dbContext);
        UserRepository = new UserRepository(dbContext, MeetingRepository);
        CriteriaGroupRepository = new CriteriaGroupRepository(dbContext);
        CriteriaRepository = new CriteriaRepository(dbContext);
        MarkRepository = new MarkRepository(dbContext);

        JwtOptions = Options.Create(new JwtOptions
        {
            SecretKey = "TestSecretKeyTestSecretKeyTestSecretKey",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            Expires = TimeSpan.FromMinutes(20)
        });

        JwtService = new JwtService(JwtOptions);
        UserService = new UserService(UserRepository, JwtService);
        MeetingService = new MeetingService(MeetingRepository, CriteriaGroupRepository, UserRepository, MarkRepository);
        CriteriaGroupService = new CriteriaGroupService(CriteriaGroupRepository, CriteriaRepository);
        CriteriaService = new CriteriaService(CriteriaRepository, CriteriaGroupRepository);
        MarkService = new MarkService(MarkRepository);

        if (!Directory.GetCurrentDirectory().Contains("Debug")) return;
        var projectDirectory = Directory.GetParent(Directory.GetCurrentDirectory())?.Parent?.Parent?.FullName;
        Directory.SetCurrentDirectory(projectDirectory ?? throw new InvalidOperationException());
    }

    [TearDown]
    public void TearDown()
    {
        dbContext.Database.EnsureDeleted();
        dbContext.Dispose();
        factory.Dispose();
        Client.Dispose();
    }

    protected async Task CreateTestMeeting()
    {
        var user = new User { UserName = "member", RoleId = (int)RolesEnum.Member };
        MemberId = await UserRepository.Create(user);
        user.Id = MemberId;
        var meeting = new Meeting
        {
            Id = 1,
            DateAndTime = DateTime.Now,
            CriteriaGroup = new CriteriaGroup{Id = 12, Name = string.Empty},
            StudentWorks =
            [
                new StudentWork
                {
                    Id = 3, StudentName = string.Empty, Theme = string.Empty, Supervisor = string.Empty,
                    AverageCriteriaMarks = []
                }
            ],
            Members = [user!]
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