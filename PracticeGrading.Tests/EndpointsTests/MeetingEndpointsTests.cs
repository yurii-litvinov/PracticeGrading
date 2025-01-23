using System.Net.Http.Json;
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
}