using System.Net.Http.Json;
using PracticeGrading.API.Models.Requests;

namespace PracticeGrading.Tests.EndpointsTests;

public class MarkEndpointsTests : TestBase
{
    [SetUp]
    public new async Task SetUp()
    {
        await LoginAdmin();
        await CreateTestMeeting();
    }
    
    [Test]
    public async Task TestCreateMark()
    {
        var mark = new MemberMarkRequest(null, 4, 3, [], 5, string.Empty);
        var response = await Client.PostAsJsonAsync("/marks/new", mark);

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestGetMarkById()
    {
        var mark = new MemberMarkRequest(null, 4, 3, [], 5, string.Empty);
        await Client.PostAsJsonAsync("/marks/new", mark);
        var response = await Client.GetAsync("/marks?workId=3&memberId=4");

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestGetAllMarks()
    {
        var response = await Client.GetAsync("/marks?workId=3");

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestUpdateMark()
    {
        var mark = new MemberMarkRequest(null, 4, 3, [], 5, string.Empty);
        await Client.PostAsJsonAsync("/marks/new", mark);
        var updatedMark = new MemberMarkRequest(null, 4, 3, [], 4, string.Empty);
        
        var response = await Client.PutAsJsonAsync("/marks/update", updatedMark);

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestDeleteMark()
    {
        var mark = new MemberMarkRequest(null, 4, 3, [], 5, string.Empty);
        await Client.PostAsJsonAsync("/marks/new", mark);
        
        var response = await Client.DeleteAsync("/marks/delete?workId=3&memberId=4");

        response.EnsureSuccessStatusCode();
    }
}