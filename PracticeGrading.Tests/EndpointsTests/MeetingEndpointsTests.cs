using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using PracticeGrading.API.Models.Requests;

namespace PracticeGrading.Tests.EndpointsTests;

public class MeetingEndpointsTests : TestBase
{
    [SetUp]
    public new async Task SetUp()
    {
        await LoginAdmin();
    }

    [Test]
    public async Task TestCreateMeeting()
    {
        var meeting = new MeetingRequest(
            null,
            DateTime.UtcNow,
            null,
            null,
            null,
            null,
            [],
            [],
            []);

        var response = await Client.PostAsJsonAsync("/meetings/new", meeting);

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestGetMeetingById()
    {
        var meeting = new MeetingRequest(
            null,
            DateTime.UtcNow,
            null,
            null,
            null,
            null,
            [],
            [],
            []);

        await Client.PostAsJsonAsync("/meetings/new", meeting);
        var response = await Client.GetAsync("/meetings?id=1");

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestGetAllMeetings()
    {
        var response = await Client.GetAsync("/meetings");

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestUpdateMeeting()
    {
        var meeting = new MeetingRequest(
            null,
            DateTime.UtcNow,
            null,
            null,
            null,
            null,
            [],
            [],
            []);

        await Client.PostAsJsonAsync("/meetings/new", meeting);

        var updatedMeeting = new MeetingRequest(
            1,
            DateTime.UtcNow,
            "3389",
            null,
            null,
            null,
            [],
            [],
            []);

        var response = await Client.PutAsJsonAsync("/meetings/update", updatedMeeting);

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestDeleteMeeting()
    {
        var meeting = new MeetingRequest(
            null,
            DateTime.UtcNow,
            null,
            null,
            null,
            null,
            [],
            [],
            []);

        await Client.PostAsJsonAsync("/meetings/new", meeting);
        var response = await Client.DeleteAsync("/meetings/delete?id=1");

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestGetMembers()
    {
        var meeting = new MeetingRequest(
            null,
            DateTime.UtcNow,
            null,
            null,
            null,
            null,
            [],
            [],
            []);

        await Client.PostAsJsonAsync("/meetings/new", meeting);
        var response = await Client.GetAsync("/meetings/members?id=1");

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestSetFinalMark()
    {
        var meeting = new MeetingRequest(
            null,
            DateTime.UtcNow,
            null,
            null,
            null,
            null,
            [
                new StudentWorkRequest(
                    10,
                    string.Empty,
                    null,
                    string.Empty,
                    string.Empty,
                    null,
                    null,
                    null,
                    null,
                    null)
            ],
            [],
            []);

        await Client.PostAsJsonAsync("/meetings/new", meeting);
        var response = await Client.PutAsync("/meetings/setMark?meetingId=1&workId=10&mark=5", null);

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestCreateMeetingsFromFile()
    {
        var filePath = Path.Combine("TestData", "vkr_test.xlsx");
        await using var stream = new MemoryStream(await File.ReadAllBytesAsync(filePath));
        var file = new FormFile(stream, 0, stream.Length, "file", Path.GetFileName(filePath));

        var headers = new List<string> { "studentName", "theme", "supervisor", "reviewer" };
        var separator = new List<List<string>> { new() { "date" }, new() { "time, auditorium", "info" } };
        const int membersColumn = 5;

        using var content = new MultipartFormDataContent();
        content.Add(new StreamContent(file.OpenReadStream()), "file", file.FileName);
        content.Add(new StringContent(JsonSerializer.Serialize(headers), Encoding.UTF8, "application/json"), "headers");
        content.Add(new StringContent(JsonSerializer.Serialize(separator), Encoding.UTF8, "application/json"), "separator");
        content.Add(new StringContent(membersColumn.ToString()), "membersColumn");

        var response = await Client.PostAsync("/meetings/fromFile", content);

        response.EnsureSuccessStatusCode();
    }
}