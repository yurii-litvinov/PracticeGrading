namespace PracticeGrading.Tests.IntegrationsTests;

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PracticeGrading.Data;
using PracticeGrading.Data.Repositories;

public class MemberCreationConcurrencyTests
{
    [Test]
    public async Task ConcurrentRequestsCreateOnlyOneNormalizedMember()
    {
        var connectionString = Environment.GetEnvironmentVariable("PRACTICEGRADING_TEST_POSTGRES");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Assert.Ignore("Set PRACTICEGRADING_TEST_POSTGRES to run the PostgreSQL concurrency test.");
        }

        var databaseName = "member_creation_test_" + Guid.NewGuid().ToString("N");
        await using var admin = new NpgsqlConnection(connectionString);
        await admin.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{databaseName}\"", admin))
        {
            await create.ExecuteNonQueryAsync();
        }

        try
        {
            var settings = new NpgsqlConnectionStringBuilder(connectionString) { Database = databaseName, Pooling = false };
            var options = new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(settings.ConnectionString).Options;
            await using (var setup = new AppDbContext(options))
            {
                await setup.Database.EnsureCreatedAsync();
            }

            async Task<int?> CreateMember(string name)
            {
                await using var context = new AppDbContext(options);
                var repository = new UserRepository(context, new MeetingRepository(context));
                return await repository.CreateMemberIfNameAvailable(name);
            }

            var names = new[]
            {
                "Иванов Иван Иванович", "  ИВАНОВ   Иван Иванович  ",
                "Иванов\tИван\tИванович", "иванов иван иванович",
                "Иванов Иван Иванович", "Иванов Иван Иванович",
            };
            var results = await Task.WhenAll(names.Select(CreateMember));

            results.Count(id => id.HasValue).Should().Be(1);
            await using var verification = new AppDbContext(options);
            var members = await verification.Users.Where(user => user.RoleId == 2).ToArrayAsync();
            members.Should().ContainSingle();
            MemberNames.Normalize(members[0].UserName).Should().Be("иванов иван иванович");
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }
}
