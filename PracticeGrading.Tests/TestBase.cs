using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PracticeGrading.API;
using PracticeGrading.API.Services;
using PracticeGrading.Data;
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

    protected IOptions<JwtOptions> JwtOptions;
    
    protected JwtService JwtService;
    protected UserService UserService;
    protected MeetingService MeetingService;
    protected CriteriaService CriteriaService;

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
        
        JwtOptions = Options.Create(new JwtOptions
        {
            SecretKey = "TestSecretKeyTestSecretKeyTestSecretKey",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            Expires = TimeSpan.FromMinutes(20)
        });

        JwtService = new JwtService(JwtOptions);
        UserService = new UserService(UserRepository, JwtService);
        MeetingService = new MeetingService(MeetingRepository, CriteriaRepository);
        CriteriaService = new CriteriaService(CriteriaRepository);
    }

    [TearDown]
    public void TearDown()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
        _factory.Dispose();
        Client.Dispose();
    }
}

