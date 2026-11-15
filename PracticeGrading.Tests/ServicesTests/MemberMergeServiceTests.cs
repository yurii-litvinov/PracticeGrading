using Microsoft.EntityFrameworkCore;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class MemberMergeServiceTests : TestBase
{
    [Test]
    public async Task MergeTransfersRelationshipsAndSelectedAccess()
    {
        await CreateTestMeeting();
        var duplicate = new User { UserName = "duplicate", RoleId = 2 };
        dbContext.Users.Add(duplicate);
        await dbContext.SaveChangesAsync();
        dbContext.TrustedMemberAccesses.AddRange(
            new TrustedMemberAccess { MemberId = MemberId, TokenHash = "old", CreatedAt = DateTime.UtcNow },
            new TrustedMemberAccess { MemberId = duplicate.Id, TokenHash = "keep", CreatedAt = DateTime.UtcNow });
        var first = new MemberMark { MemberId = MemberId, StudentWorkId = 3, Mark = 3, CriteriaMarks = [] };
        var keep = new MemberMark { MemberId = duplicate.Id, StudentWorkId = 3, Mark = 5, CriteriaMarks = [] };
        dbContext.MemberMarks.AddRange(first, keep);
        var access = new MeetingMemberAccess { MemberId = duplicate.Id, MeetingId = 1, TokenHash = "meeting", StatusChangedByUserId = duplicate.Id };
        dbContext.MeetingMemberAccesses.Add(access);
        await dbContext.SaveChangesAsync();
        var trustedId = await dbContext.TrustedMemberAccesses.Where(a => a.MemberId == duplicate.Id).Select(a => a.Id).SingleAsync();
        var service = new MemberMergeService(dbContext);
        var ids = new[] { MemberId, duplicate.Id };
        var preview = await service.Preview(ids);
        await service.Merge(new MemberMergeRequest(ids, MemberId, new MemberRequest(MemberId, "Merged", InformationRu: "Combined"),
            trustedId, new() { [3] = keep.Id }, preview.Version));
        dbContext.ChangeTracker.Clear();
        Assert.That(await dbContext.Users.AnyAsync(u => u.Id == duplicate.Id), Is.False);
        Assert.That((await dbContext.Users.SingleAsync(u => u.Id == MemberId)).InformationRu, Is.EqualTo("Combined"));
        var mark = await dbContext.MemberMarks.SingleAsync();
        Assert.That(mark.Id, Is.EqualTo(keep.Id));
        Assert.That(mark.MemberId, Is.EqualTo(MemberId));
        var trusted = await dbContext.TrustedMemberAccesses.SingleAsync();
        Assert.That(trusted.Id, Is.EqualTo(trustedId));
        Assert.That(trusted.MemberId, Is.EqualTo(MemberId));
        var moved = await dbContext.MeetingMemberAccesses.SingleAsync();
        Assert.That(moved.MemberId, Is.EqualTo(MemberId));
        Assert.That(moved.StatusChangedByUserId, Is.EqualTo(MemberId));
        Assert.That((await dbContext.Meetings.Include(m => m.Members).SingleAsync()).Members.Select(m => m.Id), Is.EquivalentTo(new[] { MemberId }));
    }

    [Test]
    public async Task MergeRejectsStalePreviewAndAdministrators()
    {
        await CreateTestMeeting();
        var duplicate = new User { UserName = "duplicate", RoleId = 2 };
        dbContext.Users.Add(duplicate);
        await dbContext.SaveChangesAsync();
        var service = new MemberMergeService(dbContext);
        var ids = new[] { MemberId, duplicate.Id };
        var preview = await service.Preview(ids);
        duplicate.Email = "new@example.org";
        await dbContext.SaveChangesAsync();
        Assert.ThrowsAsync<InvalidOperationException>(() => service.Merge(new MemberMergeRequest(ids, MemberId,
            new MemberRequest(MemberId, "Merged"), null, new(), preview.Version)));
        Assert.That(await dbContext.Users.CountAsync(u => ids.Contains(u.Id)), Is.EqualTo(2));
        Assert.ThrowsAsync<InvalidOperationException>(() => service.Preview(new[] { 1, MemberId }));
    }

    [Test]
    public async Task MissingConflictChoiceDoesNotDeleteData()
    {
        await CreateTestMeeting();
        var duplicate = new User { UserName = "duplicate", RoleId = 2 };
        dbContext.Users.Add(duplicate);
        await dbContext.SaveChangesAsync();
        dbContext.MemberMarks.AddRange(new MemberMark { MemberId = MemberId, StudentWorkId = 3, Mark = 3, CriteriaMarks = [] },
            new MemberMark { MemberId = duplicate.Id, StudentWorkId = 3, Mark = 5, CriteriaMarks = [] });
        await dbContext.SaveChangesAsync();
        var service = new MemberMergeService(dbContext);
        var ids = new[] { MemberId, duplicate.Id };
        var preview = await service.Preview(ids);
        Assert.ThrowsAsync<InvalidOperationException>(() => service.Merge(new MemberMergeRequest(ids, MemberId,
            new MemberRequest(MemberId, "Merged"), null, new(), preview.Version)));
        Assert.That(await dbContext.MemberMarks.CountAsync(), Is.EqualTo(2));
    }
}
