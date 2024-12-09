using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using PracticeGrading.API.Models.Requests;

namespace PracticeGrading.Tests.EndpointsTests;

public class CriteriaEndpointsTests : TestBase
{
    [SetUp]
    public new async Task SetUp()
    {
        var loginRequest = new LoginAdminRequest("admin", "admin");

        var response = await Client.PostAsJsonAsync("/login", loginRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseContent);
        var token = jsonDoc.RootElement.GetProperty("token").GetString();
        
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Test]
    public async Task TestCreateCriteria()
    {
        var criteria = new CriteriaRequest(null, "name", null, [], []);

        var response = await Client.PostAsJsonAsync("/criteria/new", criteria);

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestGetCriteriaById()
    {
        var criteria = new CriteriaRequest(null, "name", null, [], []);

        await Client.PostAsJsonAsync("/criteria/new", criteria);
        var response = await Client.GetAsync("/criteria?id=1");

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestGetAllCriteria()
    {
        var response = await Client.GetAsync("/criteria");

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestUpdateCriteria()
    {
        var criteria = new CriteriaRequest(null, "name", null, [], []);

        await Client.PostAsJsonAsync("/criteria/new", criteria);
        
        var updatedCriteria = new CriteriaRequest(1, "name", "comment", [], []);
        
        var response = await Client.PutAsJsonAsync("/criteria/update", updatedCriteria);

        response.EnsureSuccessStatusCode();
    }
    
    [Test]
    public async Task TestDeleteCriteria()
    {
        var criteria = new CriteriaRequest(null, "name", null, [], []);

        await Client.PostAsJsonAsync("/criteria/new", criteria);
        var response = await Client.DeleteAsync("/criteria/delete?id=1");

        response.EnsureSuccessStatusCode();
    }
}