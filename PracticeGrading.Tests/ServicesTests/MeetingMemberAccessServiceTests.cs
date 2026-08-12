namespace PracticeGrading.Tests.ServicesTests;

using FluentAssertions;
using PracticeGrading.API.Models;
using PracticeGrading.Data.Entities;

public class MeetingMemberAccessServiceTests : TestBase
{
    [Test]
    public async Task TestCreateRequestForExistingMember()
    {
        await CreateTestMeeting();

        var (result, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        result.Should().Be(
            CreateMeetingMemberAccessResult.Success);

        token.Should().NotBeNullOrWhiteSpace();

        var tokenHash =
            AccessTokenService.HashToken(token!);

        dbContext.ChangeTracker.Clear();

        var access =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        access.Should().NotBeNull();
        access.MeetingId.Should().Be(MeetingId);
        access.MemberId.Should().Be(MemberId);
        access.Status.Should().Be(
            MeetingMemberAccessStatus.Pending);
        access.CreatedAt.Should().BeCloseTo(
            DateTime.UtcNow,
            TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task TestCreateRequestForNewMember()
    {
        await CreateTestMeeting();

        var (result, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "New Commission Member");

        result.Should().Be(
            CreateMeetingMemberAccessResult.Success);

        token.Should().NotBeNullOrWhiteSpace();

        var tokenHash =
            AccessTokenService.HashToken(token!);

        dbContext.ChangeTracker.Clear();

        var access =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        access.Should().NotBeNull();
        access.Member.Should().NotBeNull();
        access.Member!.UserName.Should().Be(
            "New Commission Member");
        access.Member.RoleId.Should().Be(
            (int)RolesEnum.Member);
        access.Status.Should().Be(
            MeetingMemberAccessStatus.Pending);

        var meeting =
            await MeetingRepository.GetById(MeetingId);

        meeting.Should().NotBeNull();

        (meeting!.Members ?? [])
            .Should()
            .NotContain(member =>
                member.Id == access.MemberId);
    }

    [Test]
    public async Task TestCreateRequestForMissingMeeting()
    {
        await CreateTestMeeting();

        var (result, token) =
            await MeetingMemberAccessService.CreateRequest(
                int.MaxValue,
                MemberId,
                null);

        result.Should().Be(
            CreateMeetingMemberAccessResult.MeetingNotFound);

        token.Should().BeNull();
    }

    [Test]
    public async Task TestCreateRequestForMissingMember()
    {
        await CreateTestMeeting();

        var (result, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                int.MaxValue,
                null);

        result.Should().Be(
            CreateMeetingMemberAccessResult.MemberNotFound);

        token.Should().BeNull();
    }

    [Test]
    public async Task TestCreateRequestWithoutMemberOrName()
    {
        await CreateTestMeeting();

        var (result, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "   ");

        result.Should().Be(
            CreateMeetingMemberAccessResult.InvalidMemberName);

        token.Should().BeNull();
    }

    [Test]
    public async Task TestCreateRequestForAdmin()
    {
        await CreateTestMeeting();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var (result, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                admin!.Id,
                null);

        result.Should().Be(
            CreateMeetingMemberAccessResult.InvalidMember);

        token.Should().BeNull();
    }

    [Test]
    public async Task TestGetStatus()
    {
        await CreateTestMeeting();

        var (creationResult, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        creationResult.Should().Be(
            CreateMeetingMemberAccessResult.Success);

        token.Should().NotBeNullOrWhiteSpace();

        dbContext.ChangeTracker.Clear();

        var status =
            await MeetingMemberAccessService.GetStatus(
                MeetingId,
                token);

        status.Should().NotBeNull();
        status.MeetingId.Should().Be(MeetingId);
        status.MemberId.Should().Be(MemberId);
        status.MemberName.Should().Be("member");
        status.Status.Should().Be(
            MeetingMemberAccessStatus.Pending);
        status.StatusChangedAt.Should().BeNull();
    }

    [Test]
    public async Task TestGetStatusWithInvalidToken()
    {
        await CreateTestMeeting();

        var status =
            await MeetingMemberAccessService.GetStatus(
                MeetingId,
                "invalid-access-token");

        status.Should().BeNull();
    }

    [Test]
    public async Task TestGetStatusWithoutToken()
    {
        await CreateTestMeeting();

        var status =
            await MeetingMemberAccessService.GetStatus(
                MeetingId,
                null);

        status.Should().BeNull();
    }

    [Test]
    public async Task TestGetStatusForAnotherMeeting()
    {
        await CreateTestMeeting();

        var (_, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        token.Should().NotBeNullOrWhiteSpace();

        var status =
            await MeetingMemberAccessService.GetStatus(
                MeetingId + 1,
                token);

        status.Should().BeNull();
    }

    [Test]
    public async Task TestApproveRequest()
    {
        await CreateTestMeeting();

        var (creationResult, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "Approved Member");

        creationResult.Should().Be(
            CreateMeetingMemberAccessResult.Success);
        token.Should().NotBeNullOrWhiteSpace();

        var tokenHash =
            AccessTokenService.HashToken(token!);

        var access =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        access.Should().NotBeNull();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                access!.Id,
                admin!.Id);

        approvalResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        dbContext.ChangeTracker.Clear();

        var savedAccess =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        savedAccess.Should().NotBeNull();
        savedAccess.Status.Should().Be(
            MeetingMemberAccessStatus.Approved);
        savedAccess.StatusChangedByUserId.Should().Be(admin.Id);
        savedAccess.StatusChangedAt.Should().NotBeNull();
        savedAccess.StatusChangedAt.Should().BeCloseTo(
            DateTime.UtcNow,
            TimeSpan.FromSeconds(5));

        var meeting =
            await MeetingRepository.GetById(MeetingId);

        meeting.Should().NotBeNull();

        (meeting!.Members ?? [])
            .Should()
            .Contain(member =>
                member.Id == savedAccess.MemberId);
    }

    [Test]
    public async Task TestRejectRequest()
    {
        await CreateTestMeeting();

        var (creationResult, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "Rejected Member");

        creationResult.Should().Be(
            CreateMeetingMemberAccessResult.Success);
        token.Should().NotBeNullOrWhiteSpace();

        var tokenHash =
            AccessTokenService.HashToken(token!);

        var access =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

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

        dbContext.ChangeTracker.Clear();

        var savedAccess =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        savedAccess.Should().NotBeNull();
        savedAccess.Status.Should().Be(
            MeetingMemberAccessStatus.Rejected);
        savedAccess.StatusChangedByUserId.Should().Be(admin.Id);
        savedAccess.StatusChangedAt.Should().NotBeNull();

        var meeting =
            await MeetingRepository.GetById(MeetingId);

        meeting.Should().NotBeNull();

        (meeting!.Members ?? [])
            .Should()
            .NotContain(member =>
                member.Id == savedAccess.MemberId);
    }

    [Test]
    public async Task TestCannotProcessRequestTwice()
    {
        await CreateTestMeeting();

        var (_, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "Processed Member");

        token.Should().NotBeNullOrWhiteSpace();

        var tokenHash =
            AccessTokenService.HashToken(token!);

        var access =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        access.Should().NotBeNull();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                access!.Id,
                admin!.Id);

        approvalResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        var rejectionResult =
            await MeetingMemberAccessService.RejectRequest(
                MeetingId,
                access.Id,
                admin.Id);

        rejectionResult.Should().Be(
            ProcessMeetingMemberAccessResult.AlreadyProcessed);

        dbContext.ChangeTracker.Clear();

        var savedAccess =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        savedAccess.Should().NotBeNull();
        savedAccess.Status.Should().Be(
            MeetingMemberAccessStatus.Approved);
    }

    [Test]
    public async Task TestLoginApprovedMember()
    {
        await CreateTestMeeting();

        var (_, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        token.Should().NotBeNullOrWhiteSpace();

        var jwtBeforeApproval =
            await MeetingMemberAccessService.LoginApprovedMember(
                MeetingId,
                token);

        jwtBeforeApproval.Should().BeNull();

        var tokenHash =
            AccessTokenService.HashToken(token!);

        var access =
            await MeetingMemberAccessRepository
                .GetByTokenHash(tokenHash);

        access.Should().NotBeNull();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                access!.Id,
                admin!.Id);

        approvalResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        var jwtAfterApproval =
            await MeetingMemberAccessService.LoginApprovedMember(
                MeetingId,
                token);

        jwtAfterApproval.Should().NotBeNullOrWhiteSpace();
    }

    [Test]
    public async Task TestApproveMissingRequest()
    {
        await CreateTestMeeting();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var result =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                int.MaxValue,
                admin!.Id);

        result.Should().Be(
            ProcessMeetingMemberAccessResult.AccessNotFound);
    }

    [Test]
    public async Task TestApproveRequestForAnotherMeeting()
    {
        await CreateTestMeeting();

        var (_, token) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        token.Should().NotBeNullOrWhiteSpace();

        var access =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(token!));

        var admin =
            await UserRepository.GetByUserName("admin");

        access.Should().NotBeNull();
        admin.Should().NotBeNull();

        var result =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId + 1,
                access!.Id,
                admin!.Id);

        result.Should().Be(
            ProcessMeetingMemberAccessResult.AccessNotFound);
    }

    [Test]
    public async Task TestGetPendingRequests()
    {
        await CreateTestMeeting();

        var (_, firstToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "Pending Member");

        var (_, secondToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "Approved Member");

        var (_, thirdToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                0,
                "Rejected Member");

        firstToken.Should().NotBeNullOrWhiteSpace();
        secondToken.Should().NotBeNullOrWhiteSpace();
        thirdToken.Should().NotBeNullOrWhiteSpace();

        var approvedAccess =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(secondToken!));

        var rejectedAccess =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(thirdToken!));

        approvedAccess.Should().NotBeNull();
        rejectedAccess.Should().NotBeNull();

        var admin =
            await UserRepository.GetByUserName("admin");

        admin.Should().NotBeNull();

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                approvedAccess!.Id,
                admin!.Id);

        approvalResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        var rejectionResult =
            await MeetingMemberAccessService.RejectRequest(
                MeetingId,
                rejectedAccess!.Id,
                admin.Id);

        rejectionResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        dbContext.ChangeTracker.Clear();

        var requests =
            await MeetingMemberAccessService.GetPendingRequests(
                MeetingId);

        requests.Should().ContainSingle();

        var pendingRequest = requests.Single();

        pendingRequest.MemberName.Should().Be(
            "Pending Member");
        pendingRequest.MemberId.Should().NotBe(0);
        pendingRequest.CreatedAt.Should().BeCloseTo(
            DateTime.UtcNow,
            TimeSpan.FromSeconds(5));
    }

    [Test]
    public async Task TestRevokeApprovedAccess()
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

        var approvalResult =
            await MeetingMemberAccessService.ApproveRequest(
                MeetingId,
                access!.Id,
                admin!.Id);

        approvalResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        var revocationResult =
            await MeetingMemberAccessService.RevokeRequest(
                MeetingId,
                access.Id,
                admin.Id);

        revocationResult.Should().Be(
            ProcessMeetingMemberAccessResult.Success);

        dbContext.ChangeTracker.Clear();

        var revokedAccess =
            await MeetingMemberAccessRepository.GetById(
                access.Id);

        revokedAccess.Should().NotBeNull();

        revokedAccess!.Status.Should().Be(
            MeetingMemberAccessStatus.Revoked);

        revokedAccess.StatusChangedByUserId.Should().Be(
            admin.Id);

        revokedAccess.StatusChangedAt.Should().NotBeNull();

        var jwt =
            await MeetingMemberAccessService
                .LoginApprovedMember(
                    MeetingId,
                    accessToken!);

        jwt.Should().BeNull();
    }

    [Test]
    public async Task TestCannotRevokePendingAccess()
    {
        await CreateTestMeeting();

        var (creationResult, accessToken) =
            await MeetingMemberAccessService.CreateRequest(
                MeetingId,
                MemberId,
                null);

        creationResult.Should().Be(
            CreateMeetingMemberAccessResult.Success);

        var access =
            await MeetingMemberAccessRepository.GetByTokenHash(
                AccessTokenService.HashToken(accessToken!));

        var admin =
            await UserRepository.GetByUserName("admin");

        access.Should().NotBeNull();
        admin.Should().NotBeNull();

        var result =
            await MeetingMemberAccessService.RevokeRequest(
                MeetingId,
                access!.Id,
                admin!.Id);

        result.Should().Be(
            ProcessMeetingMemberAccessResult.AlreadyProcessed);
    }
}