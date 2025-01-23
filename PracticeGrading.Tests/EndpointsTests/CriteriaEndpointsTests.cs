using System.Net.Http.Json;
using PracticeGrading.API.Models.Requests;

namespace PracticeGrading.Tests.EndpointsTests;

public class CriteriaEndpointsTests : TestBase
{
    [SetUp]
    public new async Task SetUp()
    {
        await LoginAdmin();
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