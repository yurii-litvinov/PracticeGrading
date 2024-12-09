using System.Net.Http.Json;
using FluentAssertions;
using PracticeGrading.API.Models.Requests;

namespace PracticeGrading.Tests.EndpointsTests;

public class UserEndpointsTests : TestBase
{
    [Test]
    public async Task TestLoginAdmin()
    {
        var loginRequest = new LoginAdminRequest("admin", "admin");

        var response = await Client.PostAsJsonAsync("/login", loginRequest);

        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().Contain("token");
    }

    [Test]
    public async Task TestLoginAdminWithWrongPassword()
    {
        var loginRequest = new LoginAdminRequest("admin", "123");

        var response = await Client.PostAsJsonAsync("/login", loginRequest);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }
}