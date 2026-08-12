using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PracticeGrading.API;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Repositories;
using PracticeGrading.API.Services;
using PracticeGrading.Data;
using PracticeGrading.Data.Entities;
using PracticeGrading.Data.Repositories;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace PracticeGrading.Tests;

public class TestBase
{
    private WebApplicationFactory<Program> factory;
    protected AppDbContext dbContext;

    protected HttpClient Client;

    protected UserRepository UserRepository;
    protected MeetingRepository MeetingRepository;
    protected CriteriaGroupRepository CriteriaGroupRepository;
    protected CriteriaRepository CriteriaRepository;
    protected MarkRepository MarkRepository;
    protected TrustedMemberAccessRepository TrustedMemberAccessRepository;
    protected MeetingMemberAccessRepository MeetingMemberAccessRepository;

    protected IOptions<JwtOptions> JwtOptions;

    protected JwtService JwtService;
    protected UserService UserService;
    protected MeetingService MeetingService;
    protected CriteriaGroupService CriteriaGroupService;
    protected CriteriaService CriteriaService;
    protected MarkService MarkService;
    protected TrustedMemberAccessService TrustedMemberAccessService;
    protected MeetingMemberAccessService MeetingMemberAccessService;
    protected AccessTokenService AccessTokenService;
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
        TrustedMemberAccessRepository = new TrustedMemberAccessRepository(dbContext);
        MeetingMemberAccessRepository =
            new MeetingMemberAccessRepository(dbContext);

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
        AccessTokenService = new AccessTokenService();

        TrustedMemberAccessService =
            new TrustedMemberAccessService(
                TrustedMemberAccessRepository,
                UserRepository,
                MeetingRepository,
                AccessTokenService,
                JwtService);

        MeetingMemberAccessService =
            new MeetingMemberAccessService(
                MeetingMemberAccessRepository,
                MeetingRepository,
                UserRepository,
                AccessTokenService,
                JwtService);

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
            CriteriaGroup = new CriteriaGroup { Id = 12, Name = string.Empty },
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

    protected async Task LoginApprovedMember()
    {
        var (creationResult, accessToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        if (creationResult !=
                CreateMeetingMemberAccessResult.Success ||
            string.IsNullOrWhiteSpace(accessToken))
        {
            throw new InvalidOperationException(
                "Failed to create meeting access request.");
        }

        var access =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(accessToken));

        var admin =
            await UserRepository.GetByUserName("admin");

        if (access is null || admin is null)
        {
            throw new InvalidOperationException(
                "Failed to prepare meeting access request.");
        }

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                access.Id,
                admin.Id);

        if (approvalResult !=
            ProcessMeetingMemberAccessResult.Success)
        {
            throw new InvalidOperationException(
                "Failed to approve meeting access request.");
        }

        Client.DefaultRequestHeaders.Authorization = null;

        using var loginRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{MeetingId}/member-login");

        loginRequest.Headers.Add(
            "X-Meeting-Access-Token",
            accessToken);

        var loginResponse =
            await Client.SendAsync(loginRequest);

        loginResponse.EnsureSuccessStatusCode();

        var loginJson =
            await loginResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var jwt = loginJson
            .GetProperty("token")
            .GetString();

        if (string.IsNullOrWhiteSpace(jwt))
        {
            throw new InvalidOperationException(
                "Member JWT was not returned.");
        }

        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                jwt);
    }
}