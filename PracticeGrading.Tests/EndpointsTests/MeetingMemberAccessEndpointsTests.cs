namespace PracticeGrading.Tests.EndpointsTests;

using FluentAssertions;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using PracticeGrading.API.Models.DTOs;

public class MeetingMemberAccessEndpointsTests : TestBase
{
    [Test]
    public async Task TestCreateAccessRequest()
    {
        await CreateTestMeeting();

        var request =
            new CreateMeetingMemberAccessRequest(
                MemberId,
                null);

        var response = await Client.PostAsJsonAsync(
            $"/meetings/{MeetingId}/access-requests",
            request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseJson =
            await response.Content.ReadFromJsonAsync<JsonElement>();

        var token = responseJson
            .GetProperty("token")
            .GetString();

        token.Should().NotBeNullOrWhiteSpace();

        dbContext.ChangeTracker.Clear();

        var access =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(token!));

        access.Should().NotBeNull();
        access.MeetingId.Should().Be(MeetingId);
        access.MemberId.Should().Be(MemberId);
        access.Status.Should().Be(
            MeetingMemberAccessStatus.Pending);
    }

    [Test]
    public async Task TestGetAccessRequestStatus()
    {
        await CreateTestMeeting();

        var creationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    MemberId,
                    null));

        creationResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var creationJson =
            await creationResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var token = creationJson
            .GetProperty("token")
            .GetString();

        token.Should().NotBeNullOrWhiteSpace();

        using var statusRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"/meetings/{MeetingId}/access-requests/status");

        statusRequest.Headers.Add(
            "X-Meeting-Access-Token",
            token);

        var statusResponse =
            await Client.SendAsync(statusRequest);

        statusResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var status =
            await statusResponse.Content
                .ReadFromJsonAsync<
                    MeetingMemberAccessStatusDto>();

        status.Should().NotBeNull();
        status.MeetingId.Should().Be(MeetingId);
        status.MemberId.Should().Be(MemberId);
        status.Status.Should().Be(
            MeetingMemberAccessStatus.Pending);
    }

    [Test]
    public async Task TestGetAccessRequestStatusWithoutToken()
    {
        await CreateTestMeeting();

        var response = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/status");

        response.StatusCode
            .Should()
            .Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestGetAccessRequestStatusWithInvalidToken()
    {
        await CreateTestMeeting();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/meetings/{MeetingId}/access-requests/status");

        request.Headers.Add(
            "X-Meeting-Access-Token",
            "invalid-token");

        var response = await Client.SendAsync(request);

        response.StatusCode
            .Should()
            .Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestAdminApprovesAccessRequestAndMemberGetsJwt()
    {
        await CreateTestMeeting();

        var creationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    MemberId,
                    null));

        creationResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var creationJson =
            await creationResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var accessToken = creationJson
            .GetProperty("token")
            .GetString();

        accessToken.Should().NotBeNullOrWhiteSpace();

        await LoginAdmin();

        var pendingResponse = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        pendingResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var pendingRequests =
            await pendingResponse.Content.ReadFromJsonAsync<
                List<PendingMeetingMemberAccessDto>>();

        pendingRequests.Should().NotBeNull();
        pendingRequests.Should().ContainSingle();

        var pendingRequest = pendingRequests!.Single();

        pendingRequest.MemberId.Should().Be(MemberId);

        var approvalResponse = await Client.PostAsync(
            $"/meetings/{MeetingId}/access-requests/" +
            $"{pendingRequest.Id}/approve",
            null);

        approvalResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        Client.DefaultRequestHeaders.Authorization = null;

        using var loginRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{MeetingId}/member-login");

        loginRequest.Headers.Add(
            "X-Meeting-Access-Token",
            accessToken);

        var loginResponse =
            await Client.SendAsync(loginRequest);

        loginResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var loginJson =
            await loginResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var jwt = loginJson
            .GetProperty("token")
            .GetString();

        jwt.Should().NotBeNullOrWhiteSpace();
    }

    [Test]
    public async Task TestGetPendingRequestsWithoutAuthorization()
    {
        await CreateTestMeeting();

        var response = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        response.StatusCode
            .Should()
            .Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestPendingMemberCannotGetJwt()
    {
        await CreateTestMeeting();

        var creationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    MemberId,
                    null));

        var creationJson =
            await creationResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var accessToken = creationJson
            .GetProperty("token")
            .GetString();

        using var loginRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{MeetingId}/member-login");

        loginRequest.Headers.Add(
            "X-Meeting-Access-Token",
            accessToken);

        var loginResponse =
            await Client.SendAsync(loginRequest);

        loginResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestMemberCannotManageAnotherMeeting()
    {
        await CreateTestMeeting();

        var memberJwt = await CreateApprovedMemberAndGetJwt();

        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                memberJwt);

        var response = await Client.GetAsync(
            $"/meetings/{MeetingId + 1}/access-requests/pending");

        response.StatusCode
            .Should()
            .Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestApprovedMemberCanApproveRequestInSameMeeting()
    {
        await CreateTestMeeting();

        var memberJwt = await CreateApprovedMemberAndGetJwt();

        Client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                memberJwt);

        var secondCreationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    0,
                    "Second Member"));

        secondCreationResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var secondCreationJson =
            await secondCreationResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var secondAccessToken = secondCreationJson
            .GetProperty("token")
            .GetString();

        secondAccessToken.Should().NotBeNullOrWhiteSpace();

        var pendingResponse = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        pendingResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var pendingRequests =
            await pendingResponse.Content.ReadFromJsonAsync<
                List<PendingMeetingMemberAccessDto>>();

        pendingRequests.Should().NotBeNull();

        var secondRequest = pendingRequests!
            .Single(request =>
                request.MemberName == "Second Member");

        var approvalResponse = await Client.PostAsync(
            $"/meetings/{MeetingId}/access-requests/" +
            $"{secondRequest.Id}/approve",
            null);

        approvalResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var statusRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"/meetings/{MeetingId}/access-requests/status");

        statusRequest.Headers.Add(
            "X-Meeting-Access-Token",
            secondAccessToken);

        var statusResponse =
            await Client.SendAsync(statusRequest);

        var status =
            await statusResponse.Content.ReadFromJsonAsync<
                MeetingMemberAccessStatusDto>();

        status.Should().NotBeNull();
        status.Status.Should().Be(
            MeetingMemberAccessStatus.Approved);
    }

    [Test]
    public async Task TestPendingMemberCanReadMeeting()
    {
        await CreateTestMeeting();

        var (creationResult, accessToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        creationResult.Should().Be(
            CreateMeetingMemberAccessResult.Success);

        accessToken.Should().NotBeNullOrWhiteSpace();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/meetings/{MeetingId}/read-only");

        request.Headers.Add(
            "X-Meeting-Access-Token",
            accessToken!);

        var response = await Client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var meeting = await response.Content
            .ReadFromJsonAsync<MeetingDto>();

        meeting.Should().NotBeNull();
        meeting!.Id.Should().Be(MeetingId);
        meeting.StudentWorks.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestReadOnlyMeetingWithInvalidToken()
    {
        await CreateTestMeeting();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/meetings/{MeetingId}/read-only");

        request.Headers.Add(
            "X-Meeting-Access-Token",
            "invalid-token");

        var response = await Client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task TestRejectedMemberCannotReadMeeting()
    {
        await CreateTestMeeting();

        var (creationResult, accessToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        creationResult.Should().Be(
            CreateMeetingMemberAccessResult.Success);

        accessToken.Should().NotBeNullOrWhiteSpace();

        var access =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(accessToken!));

        access.Should().NotBeNull();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var rejectionResult =
            await MeetingMemberAccessService.RejectRequest(
                MeetingId,
                access!.Id,
                admin!.Id);

        rejectionResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"/meetings/{MeetingId}/read-only");

        request.Headers.Add(
            "X-Meeting-Access-Token",
            accessToken!);

        var response = await Client.SendAsync(request);

        response.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestAdminCanGetAndRevokeApprovedAccess()
    {
        await CreateTestMeeting();

        var access =
            await CreateApprovedMeetingAccess();

        await LoginAdmin();

        var listResponse = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/approved");

        listResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var approvedAccesses =
            await listResponse.Content.ReadFromJsonAsync<
                List<ApprovedMeetingMemberAccessDto>>();

        approvedAccesses.Should().NotBeNull();

        approvedAccesses.Should().Contain(
            approvedAccess =>
                approvedAccess.Id == access.Id);

        var revokeResponse = await Client.PostAsync(
            $"/meetings/{MeetingId}/access-requests/{access.Id}/revoke",
            content: null);

        revokeResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);
    }

    [Test]
    public async Task TestMemberCannotRevokeApprovedAccess()
    {
        await CreateTestMeeting();

        var access =
            await CreateApprovedMeetingAccess();

        await LoginApprovedMember();

        var response = await Client.PostAsync(
            $"/meetings/{MeetingId}/access-requests/{access.Id}/revoke",
            content: null);

        response.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    private async Task<MeetingMemberAccess>
        CreateApprovedMeetingAccess()
    {
        var (creationResult, accessToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        if (creationResult !=
                CreateMeetingMemberAccessResult.Success ||
            string.IsNullOrWhiteSpace(accessToken))
        {
            throw new InvalidOperationException(
                "Failed to create meeting access request.");
        }

        var access =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(accessToken));

        var admin =
            await UserRepository.GetByUserName("admin");

        if (access is null || admin is null)
        {
            throw new InvalidOperationException(
                "Failed to prepare approved meeting access.");
        }

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                access.Id,
                admin.Id);

        if (approvalResult !=
            ProcessMeetingMemberAccessResult.Success)
        {
            throw new InvalidOperationException(
                "Failed to approve meeting access.");
        }

        return access;
    }

    private async Task<string> CreateApprovedMemberAndGetJwt()
    {
        Client.DefaultRequestHeaders.Authorization = null;

        var creationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    MemberId,
                    null));

        creationResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var creationJson =
            await creationResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var accessToken = creationJson
            .GetProperty("token")
            .GetString();

        accessToken.Should().NotBeNullOrWhiteSpace();

        await LoginAdmin();

        var pendingResponse = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        var pendingRequests =
            await pendingResponse.Content.ReadFromJsonAsync<
                List<PendingMeetingMemberAccessDto>>();

        pendingRequests.Should().NotBeNull();

        var pendingRequest = pendingRequests!.Single();

        var approvalResponse = await Client.PostAsync(
            $"/meetings/{MeetingId}/access-requests/" +
            $"{pendingRequest.Id}/approve",
            null);

        approvalResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        Client.DefaultRequestHeaders.Authorization = null;

        using var loginRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"/meetings/{MeetingId}/member-login");

        loginRequest.Headers.Add(
            "X-Meeting-Access-Token",
            accessToken);

        var loginResponse =
            await Client.SendAsync(loginRequest);

        loginResponse.StatusCode
            .Should()
            .Be(HttpStatusCode.OK);

        var loginJson =
            await loginResponse.Content
                .ReadFromJsonAsync<JsonElement>();

        var jwt = loginJson
            .GetProperty("token")
            .GetString();

        jwt.Should().NotBeNullOrWhiteSpace();

        return jwt!;
    }

    [Test]
    public async Task TestRevokedMeetingAccessInvalidatesIssuedJwt()
    {
        await CreateTestMeeting();
        await LoginApprovedMember();

        var responseBeforeRevocation = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        responseBeforeRevocation.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var approvedAccesses =
            await MeetingMemberAccessRepository
                .GetApprovedByMeetingId(MeetingId);

        var access = approvedAccesses.Single(item =>
            item.MemberId == MemberId);

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var revokeResult =
            await MeetingMemberAccessService.RevokeRequest(
                MeetingId,
                access.Id,
                admin!.Id);

        revokeResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        dbContext.ChangeTracker.Clear();

        var responseAfterRevocation = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        responseAfterRevocation.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestApprovedMemberCanGetOnlyAuthorizedMeeting()
    {
        await CreateTestMeeting();

        var anotherMeeting = new Meeting
        {
            DateAndTime = DateTime.UtcNow,
            CriteriaGroup = new CriteriaGroup
            {
                Name = "Another criteria group",
            },
            StudentWorks = [],
            Members = [],
        };

        await MeetingRepository.Create(anotherMeeting);

        dbContext.ChangeTracker.Clear();

        await LoginApprovedMember();

        var ownMeetingResponse = await Client.GetAsync(
            $"/meetings?id={MeetingId}");

        ownMeetingResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var anotherMeetingResponse = await Client.GetAsync(
            $"/meetings?id={anotherMeeting.Id}");

        anotherMeetingResponse.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);

        var allMeetingsResponse = await Client.GetAsync(
            "/meetings");

        allMeetingsResponse.StatusCode.Should().Be(
            HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task TestConcurrentApprovalReturnsConflict()
    {
        await CreateTestMeeting();

        var creationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    MemberId,
                    null));

        creationResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        await LoginAdmin();

        var pendingResponse = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        pendingResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var pendingRequests =
            await pendingResponse.Content.ReadFromJsonAsync<
                List<PendingMeetingMemberAccessDto>>();

        pendingRequests.Should().NotBeNull();
        pendingRequests.Should().ContainSingle();

        var accessId = pendingRequests!.Single().Id;

        var endpoint =
            $"/meetings/{MeetingId}/access-requests/" +
            $"{accessId}/approve";

        var firstApproval =
            Client.PostAsync(endpoint, content: null);

        var secondApproval =
            Client.PostAsync(endpoint, content: null);

        var responses = await Task.WhenAll(
            firstApproval,
            secondApproval);

        var statusCodes = responses
            .Select(response => response.StatusCode)
            .ToList();

        statusCodes.Should().ContainSingle(
            status => status == HttpStatusCode.OK);

        statusCodes.Should().ContainSingle(
            status => status == HttpStatusCode.Conflict);

        dbContext.ChangeTracker.Clear();

        var savedAccess =
            await MeetingMemberAccessRepository.GetById(
                accessId);

        savedAccess.Should().NotBeNull();
        savedAccess!.Status.Should().Be(
            MeetingMemberAccessStatus.Approved);
    }

    [Test]
    public async Task TestConcurrentRevocationReturnsConflict()
    {
        await CreateTestMeeting();

        var access =
            await CreateApprovedMeetingAccess();

        await LoginAdmin();

        var endpoint =
            $"/meetings/{MeetingId}/access-requests/" +
            $"{access.Id}/revoke";

        var firstRevocation =
            Client.PostAsync(endpoint, content: null);

        var secondRevocation =
            Client.PostAsync(endpoint, content: null);

        var responses = await Task.WhenAll(
            firstRevocation,
            secondRevocation);

        var statusCodes = responses
            .Select(response => response.StatusCode)
            .ToList();

        statusCodes.Should().ContainSingle(
            status => status == HttpStatusCode.OK);

        statusCodes.Should().ContainSingle(
            status => status == HttpStatusCode.Conflict);

        dbContext.ChangeTracker.Clear();

        var savedAccess =
            await MeetingMemberAccessRepository.GetById(
                access.Id);

        savedAccess.Should().NotBeNull();
        savedAccess!.Status.Should().Be(
            MeetingMemberAccessStatus.Revoked);
    }

    [Test]
    public async Task TestConcurrentApprovalAndRejection()
    {
        await CreateTestMeeting();

        const string memberName =
            "Concurrent Decision Member";

        var creationResponse =
            await Client.PostAsJsonAsync(
                $"/meetings/{MeetingId}/access-requests",
                new CreateMeetingMemberAccessRequest(
                    0,
                    memberName));

        creationResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        await LoginAdmin();

        var pendingResponse = await Client.GetAsync(
            $"/meetings/{MeetingId}/access-requests/pending");

        pendingResponse.StatusCode.Should().Be(
            HttpStatusCode.OK);

        var pendingRequests =
            await pendingResponse.Content.ReadFromJsonAsync<
                List<PendingMeetingMemberAccessDto>>();

        pendingRequests.Should().NotBeNull();

        var accessId = pendingRequests!
            .Single(request =>
                request.MemberName == memberName)
            .Id;

        var endpoint =
            $"/meetings/{MeetingId}/access-requests/" +
            $"{accessId}";

        var approval =
            Client.PostAsync(
                $"{endpoint}/approve",
                content: null);

        var rejection =
            Client.PostAsync(
                $"{endpoint}/reject",
                content: null);

        var responses = await Task.WhenAll(
            approval,
            rejection);

        var statusCodes = responses
            .Select(response => response.StatusCode)
            .ToList();

        statusCodes.Should().ContainSingle(
            status => status == HttpStatusCode.OK);

        statusCodes.Should().ContainSingle(
            status => status == HttpStatusCode.Conflict);

        dbContext.ChangeTracker.Clear();

        var savedAccess =
            await MeetingMemberAccessRepository.GetById(
                accessId);

        savedAccess.Should().NotBeNull();

        savedAccess!.Status.Should().BeOneOf(
            MeetingMemberAccessStatus.Approved,
            MeetingMemberAccessStatus.Rejected);
    }
}