namespace PracticeGrading.Tests.IntegrationsTests;

using Microsoft.EntityFrameworkCore;
using Npgsql;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using PracticeGrading.Data;
using PracticeGrading.Data.Entities;

public class MemberMergePostgresTests
{
    [Test]
    public async Task MergeRespectsUniqueKeysAndPreservesSelectedChildren()
    {
        var connectionString = Environment.GetEnvironmentVariable("PRACTICEGRADING_TEST_POSTGRES");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Assert.Ignore("Set PRACTICEGRADING_TEST_POSTGRES to run the PostgreSQL merge test.");
        }

        var databaseName = "member_merge_test_" + Guid.NewGuid().ToString("N");
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
            await using var context = new AppDbContext(options);
            await context.Database.EnsureCreatedAsync();
            var target = new User { UserName = "Target", RoleId = 2 };
            var source = new User { UserName = "Source", RoleId = 2 };
            var meeting = new Meeting { CriteriaGroup = await context.CriteriaGroup.FirstAsync(), StudentWorks = [], Members = [target, source], DateAndTime = DateTime.UtcNow };
            var work = new StudentWork { StudentName = "Student", Theme = "Theme", Supervisor = "Supervisor", AverageCriteriaMarks = [], Meeting = meeting };
            context.StudentWorks.Add(work);
            await context.SaveChangesAsync();
            var criterion = await context.Criteria.FirstAsync();
            var discard = new MemberMark { Member = target, StudentWork = work, Mark = 3, CriteriaMarks = [new CriteriaMark { CriteriaId = criterion.Id, Mark = 3, SelectedRules = [] }] };
            var keep = new MemberMark { Member = source, StudentWork = work, Mark = 5, CriteriaMarks = [new CriteriaMark { CriteriaId = criterion.Id, Mark = 5, Comment = "keep", SelectedRules = [] }] };
            var trusted = new TrustedMemberAccess { Member = source, TokenHash = "keep", CreatedAt = DateTime.UtcNow };
            context.MemberMarks.AddRange(discard, keep);
            context.TrustedMemberAccesses.AddRange(trusted, new TrustedMemberAccess { Member = target, TokenHash = "discard", CreatedAt = DateTime.UtcNow });
            context.MeetingMemberAccesses.Add(new MeetingMemberAccess { Member = source, Meeting = meeting, TokenHash = "meeting", StatusChangedByUser = source, Status = MeetingMemberAccessStatus.Approved });
            await context.SaveChangesAsync();
            var service = new MemberMergeService(context);
            var ids = new[] { target.Id, source.Id };
            var preview = await service.Preview(ids);
            await service.Merge(new MemberMergeRequest(ids, target.Id, new MemberRequest(target.Id, "Merged"), trusted.Id,
                new() { [work.Id] = keep.Id }, preview.Version));
            context.ChangeTracker.Clear();
            Assert.That(await context.Users.AnyAsync(u => u.Id == source.Id), Is.False);
            Assert.That((await context.TrustedMemberAccesses.SingleAsync()).MemberId, Is.EqualTo(target.Id));
            var retained = await context.MemberMarks.Include(m => m.CriteriaMarks).SingleAsync();
            Assert.That(retained.Id, Is.EqualTo(keep.Id));
            Assert.That(retained.CriteriaMarks.Single().Comment, Is.EqualTo("keep"));
            Assert.That(await context.Set<CriteriaMark>().CountAsync(), Is.EqualTo(1));
            Assert.That((await context.Meetings.Include(m => m.Members).SingleAsync()).Members.Count, Is.EqualTo(1));
            var access = await context.MeetingMemberAccesses.SingleAsync();
            Assert.That(access.MemberId, Is.EqualTo(target.Id));
            Assert.That(access.StatusChangedByUserId, Is.EqualTo(target.Id));
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP DATABASE \"{databaseName}\" WITH (FORCE)", admin);
            await drop.ExecuteNonQueryAsync();
        }
    }
}
