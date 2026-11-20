using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.API.Services;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.EndpointsTests;

public class MemberMergeEndpointsTests : TestBase
{
    [Test]
    public async Task MergeRequiresAdminAndReturnsPreviewWithoutSecrets()
    {
        await CreateTestMeeting();
        var duplicate = new User { UserName = "duplicate", RoleId = 2 };
        dbContext.Users.Add(duplicate);
        await dbContext.SaveChangesAsync();
        dbContext.TrustedMemberAccesses.Add(new TrustedMemberAccess { MemberId = duplicate.Id, TokenHash = "SECRET_HASH", CreatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();
        var ids = new[] { MemberId, duplicate.Id };
        Assert.That((await Client.PostAsJsonAsync("/members/merge/preview", ids)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        await LoginApprovedMember();
        Assert.That((await Client.PostAsJsonAsync("/members/merge/preview", ids)).StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        await LoginAdmin();
        var response = await Client.PostAsJsonAsync("/members/merge/preview", ids);
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var json = await response.Content.ReadAsStringAsync();
        Assert.That(json, Does.Not.Contain("SECRET_HASH"));
        var version = JsonDocument.Parse(json).RootElement.GetProperty("version").GetString()!;
        var request = new MemberMergeRequest(ids, MemberId, new MemberRequest(MemberId, "Merged"), null, new(), version);
        var merged = await Client.PostAsJsonAsync("/members/merge", request);
        Assert.That(merged.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((await merged.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32(), Is.EqualTo(MemberId));
    }
}
