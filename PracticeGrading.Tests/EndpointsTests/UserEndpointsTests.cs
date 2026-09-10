using FluentAssertions;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace PracticeGrading.Tests.EndpointsTests;

public class UserEndpointsTests : TestBase
{
    [Test]
    public async Task TestLoginAdmin()
    {
        var loginRequest =
            new LoginAdminRequest("admin", "admin");

        var response = await Client.PostAsJsonAsync(
            "/login",
            loginRequest);

        response.EnsureSuccessStatusCode();

        var responseBody =
            await response.Content.ReadAsStringAsync();

        responseBody.Should().Contain("token");
    }

    [Test]
    public async Task TestLoginAdminWithWrongPassword()
    {
        var loginRequest =
            new LoginAdminRequest("admin", "123");

        var response = await Client.PostAsJsonAsync(
            "/login",
            loginRequest);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized);
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

        var user =
            await UserRepository.GetUserById(1);

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
        await CreateTestMeeting();
        await LoginApprovedMember();

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
            await UserRepository.GetByUserName(
                "new-admin");

        newAdmin.Should().NotBeNull();

        newAdmin!.RoleId.Should().Be(
            (int)RolesEnum.Admin);

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
        await CreateTestMeeting();
        await LoginApprovedMember();

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

    [Test]
    public async Task TestTrustedMemberLogin()
    {
        var member = await CreateMember();

        var meeting =
            await CreateMeetingWithoutMembers();

        var trustedAccessToken =
            await TrustedMemberAccessService
                .IssueAccess(member.Id);

        dbContext.ChangeTracker.Clear();

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{meeting.Id}/trusted-login");

        request.Headers.Add(
            "X-Trusted-Access-Token",
            trustedAccessToken);

        var response =
            await Client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var responseBody =
            await response.Content
                .ReadFromJsonAsync<JsonElement>();

        var jwtToken = responseBody
            .GetProperty("token")
            .GetString();

        jwtToken.Should().NotBeNullOrWhiteSpace();
    }

    [Test]
    public async Task TestRevokedTrustedAccessInvalidatesIssuedJwt()
    {
        var member = await CreateMember();

        var meeting =
            await CreateMeetingWithoutMembers();

        await LoginAdmin();

        var issueResponse = await Client.PostAsync(
            $"/members/{member.Id}/trusted-access",
            content: null);

        issueResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var issueJson =
            await issueResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var trustedAccessToken = issueJson
            .GetProperty("token")
            .GetString();

        trustedAccessToken.Should().NotBeNullOrWhiteSpace();

        Client.DefaultRequestHeaders.Authorization = null;

        using var loginRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{meeting.Id}/trusted-login");

        loginRequest.Headers.Add(
            "X-Trusted-Access-Token",
            trustedAccessToken);

        var loginResponse =
            await Client.SendAsync(loginRequest);

        loginResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var loginJson =
            await loginResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var memberJwt = loginJson
            .GetProperty("token")
            .GetString();

        memberJwt.Should().NotBeNullOrWhiteSpace();

        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                memberJwt);

        var responseBeforeRevocation = await Client.GetAsync(
            $"/meetings/{meeting.Id}/access-requests/pending");

        responseBeforeRevocation.StatusCode.Should().Be(
            HttpStatusCode.OK);

        await LoginAdmin();

        var revokeResponse = await Client.DeleteAsync(
            $"/members/{member.Id}/trusted-access");

        revokeResponse.StatusCode.Should().Be(
            HttpStatusCode.NoContent);

        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                memberJwt);

        var responseAfterRevocation = await Client.GetAsync(
            $"/meetings/{meeting.Id}/access-requests/pending");

        responseAfterRevocation.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestTrustedMemberLoginWithInvalidToken()
    {
        var meeting =
            await CreateMeetingWithoutMembers();

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{meeting.Id}/trusted-login");

        request.Headers.Add(
            "X-Trusted-Access-Token",
            "invalid-token");

        var response =
            await Client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestTrustedMemberLoginWithoutToken()
    {
        var meeting =
            await CreateMeetingWithoutMembers();

        var response = await Client.PostAsync(
            $"/meetings/{meeting.Id}/trusted-login",
            content: null);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized);
    }

    private async Task<User> CreateMember()
    {
        var member = new User
        {
            UserName = "trusted-member",
            RoleId = (int)RolesEnum.Member,
        };

        member.Id =
            await UserRepository.Create(member);

        return member;
    }

    private async Task<Meeting>
        CreateMeetingWithoutMembers()
    {
        var meeting = new Meeting
        {
            DateAndTime = DateTime.UtcNow,
            CriteriaGroup = new CriteriaGroup
            {
                Name = "Test criteria group",
            },
            StudentWorks = [],
            Members = [],
        };

        await MeetingRepository.Create(meeting);

        return meeting;
    }
}