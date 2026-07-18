using FluentAssertions;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using System.Net;
using System.Net.Http.Json;

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

    [Test]
    public async Task TestLoginMember()
    {
        await CreateTestMeeting();

        var loginRequest = new LoginMemberRequest(MemberId, null!, MeetingId);

        var response = await Client.PostAsJsonAsync("member/login", loginRequest);

        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        responseBody.Should().Contain("token");
    }

    [Test]
    public async Task TestChangePasswordAsAdminSuccessfully()
    {
        await LoginAdmin();

        var request = new ChangePasswordRequest(
            CurrentPassword: "admin",
            NewPassword: "new-admin-password");

        var response = await Client.PutAsJsonAsync(
            "/users/me/password",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.NoContent);

        dbContext.ChangeTracker.Clear();

        var user = await UserRepository.GetUserById(1);

        user.Should().NotBeNull();

        BCrypt.Net.BCrypt.Verify(
                request.NewPassword,
                user!.PasswordHash!)
            .Should()
            .BeTrue();
    }

    [Test]
    public async Task TestChangePasswordWithoutAuthentication()
    {
        var request = new ChangePasswordRequest(
            CurrentPassword: "admin",
            NewPassword: "new-admin-password");

        var response = await Client.PutAsJsonAsync(
            "/users/me/password",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestChangePasswordAsMember()
    {
        await LoginMember();

        var request = new ChangePasswordRequest(
            CurrentPassword: "some-password",
            NewPassword: "new-valid-password");

        var response = await Client.PutAsJsonAsync(
            "/users/me/password",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestChangePasswordWithInvalidCurrentPassword()
    {
        await LoginAdmin();

        var request = new ChangePasswordRequest(
            CurrentPassword: "wrong-password",
            NewPassword: "new-admin-password");

        var response = await Client.PutAsJsonAsync(
            "/users/me/password",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task TestCreateAdminSuccessfully()
    {
        await LoginAdmin();

        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "new-admin-password",
            CurrentPassword: "admin");

        var response = await Client.PostAsJsonAsync(
            "/admins",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Created);

        dbContext.ChangeTracker.Clear();

        var newAdmin =
            await UserRepository.GetByUserName("new-admin");

        newAdmin.Should().NotBeNull();
        newAdmin!.RoleId.Should().Be((int)RolesEnum.Admin);

        BCrypt.Net.BCrypt.Verify(
                request.Password,
                newAdmin.PasswordHash!)
            .Should()
            .BeTrue();
    }

    [Test]
    public async Task TestCreateAdminWithoutAuthentication()
    {
        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "new-admin-password",
            CurrentPassword: "admin");

        var response = await Client.PostAsJsonAsync(
            "/admins",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestCreateAdminAsMember()
    {
        await LoginMember();

        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "new-admin-password",
            CurrentPassword: "some-password");

        var response = await Client.PostAsJsonAsync(
            "/admins",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestCreateAdminWithInvalidCurrentPassword()
    {
        await LoginAdmin();

        var request = new CreateAdminRequest(
            UserName: "new-admin",
            Password: "new-admin-password",
            CurrentPassword: "wrong-password");

        var response = await Client.PostAsJsonAsync(
            "/admins",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task TestCreateAdminWithExistingUserName()
    {
        await LoginAdmin();

        var request = new CreateAdminRequest(
            UserName: "admin",
            Password: "new-admin-password",
            CurrentPassword: "admin");

        var response = await Client.PostAsJsonAsync(
            "/admins",
            request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Conflict);
    }
}