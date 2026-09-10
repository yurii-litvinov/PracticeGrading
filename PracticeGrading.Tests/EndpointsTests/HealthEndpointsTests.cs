using System.Net;

namespace PracticeGrading.Tests.EndpointsTests;

public class HealthEndpointsTests : TestBase
{
    [Test]
    public async Task TestLiveness()
    {
        var response = await Client.GetAsync("/health/live");

        Assert.That(
            response.StatusCode,
            Is.EqualTo(HttpStatusCode.NoContent));
    }
}