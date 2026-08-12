namespace PracticeGrading.Tests.ServicesTests;

using FluentAssertions;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using PracticeGrading.API.Models;
using PracticeGrading.Data.Entities;

public class TrustedMemberAccessServiceTests: TestBase
{
    [Test]
    public async Task TestIssueTrustedAccess()
    {
        var member = await CreateMember();

        var token =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var savedAccess =
            await this.TrustedMemberAccessRepository.GetByMemberId(member.Id);

        savedAccess.Should().NotBeNull();
        savedAccess.TokenHash.Should().NotBe(token);
        savedAccess.TokenHash.Should().HaveLength(64);
        savedAccess.RevokedAt.Should().BeNull();

        var authenticatedMember =
            await this.TrustedMemberAccessService.GetMemberByToken(token);

        authenticatedMember.Should().NotBeNull();
        authenticatedMember.Id.Should().Be(member.Id);
    }

    [Test]
    public async Task TestTestReissueTrustedAccessInvalidatesPreviousToken()
    {
        var member = await CreateMember();

        var firstToken =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var secondToken =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        firstToken.Should().NotBe(secondToken);

        var memberByFirstToken =
            await this.TrustedMemberAccessService.GetMemberByToken(firstToken);

        memberByFirstToken.Should().BeNull();

        var memberBySecondToken =
            await this.TrustedMemberAccessService.GetMemberByToken(secondToken);

        memberBySecondToken.Should().NotBeNull();
        memberBySecondToken.Id.Should().Be(member.Id);
    }

    [Test]
    public async Task TestRevokeTrustedAccess()
    {
        var member = await CreateMember();

        var token =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var revoked =
            await this.TrustedMemberAccessService.RevokeAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var authenticatedMember =
            await this.TrustedMemberAccessService.GetMemberByToken(token);

        var savedAccess
            = await this.TrustedMemberAccessRepository.GetByMemberId(member.Id);

        revoked.Should().BeTrue();
        authenticatedMember.Should().BeNull();
        savedAccess.Should().NotBeNull();
        savedAccess.RevokedAt.Should().NotBeNull();
    }

    [Test]
    public async Task TestRevokeAlreadyRevokedAccess()
    {
        var member = await CreateMember();

        await this.TrustedMemberAccessService.IssueAccess(member.Id);
        await this.TrustedMemberAccessService.RevokeAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var revokedAgain =
            await this.TrustedMemberAccessService.RevokeAccess(member.Id);

        revokedAgain.Should().BeFalse();
    }

    [Test]
    public async Task TestTrustedMemberLoginAddsMemberToMeeting()
    {
        var member = await CreateMember();
        var meeting = await CreateMeetingWithoutMembers();

        var trustedAccessToken =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var jwtToken =
            await this.TrustedMemberAccessService.LoginTrustedMember(
                meeting.Id,
                trustedAccessToken);

        this.dbContext.ChangeTracker.Clear();

        var savedMeeting =
            await this.MeetingRepository.GetById(meeting.Id);

        jwtToken.Should().NotBeNullOrEmpty();

        savedMeeting.Should().NotBeNull();
        savedMeeting.Members.Should().ContainSingle(
            existingMember => existingMember.Id == member.Id);
    }

    [Test]
    public async Task TestTrustedMemberLoginDoesNotAddDuplicateMember()
    {
        var member = await CreateMember();

        var meeting = new Meeting
        {
            DateAndTime = DateTime.UtcNow,
            CriteriaGroup = CreateCriteriaGroup(),
            StudentWorks = [],
            Members = [member],
        };

        await this.MeetingRepository.Create(meeting);

        var trustedAccessToken =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var jwtToken =
            await this.TrustedMemberAccessService.LoginTrustedMember(
                meeting.Id,
                trustedAccessToken);

        this.dbContext.ChangeTracker.Clear();

        var savedMeeting =
            await this.MeetingRepository.GetById(meeting.Id);

        jwtToken.Should().NotBeNullOrEmpty();

        savedMeeting.Should().NotBeNull();
        savedMeeting.Members.Should().ContainSingle(
            existingMember => existingMember.Id == member.Id);
    }

    [Test]
    public async Task TestTrustedMemberLoginWithInvalidToken()
    {
        var meeting = await CreateMeetingWithoutMembers();

        var jwtToken =
            await this.TrustedMemberAccessService.LoginTrustedMember(
                meeting.Id,
                "123");

        jwtToken.Should().BeNull();
    }

    [Test]
    public async Task TestTrustedMemberLoginToNonexistentMeeting()
    {
        var member = await CreateMember();

        var trustedAccessToken =
            await this.TrustedMemberAccessService.IssueAccess(member.Id);

        var action = async () =>
            await this.TrustedMemberAccessService.LoginTrustedMember(
                123,
                trustedAccessToken);

        await action.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Test]
    public async Task TestTrustedAccessStatus()
    {
        var member = await CreateMember();

        var initialStatus =
            await this.TrustedMemberAccessService.GetAccessStatus(member.Id);

        initialStatus.IsIssued.Should().BeFalse();
        initialStatus.IsActive.Should().BeFalse();

        await this.TrustedMemberAccessService.IssueAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var activeStatus =
            await this.TrustedMemberAccessService.GetAccessStatus(member.Id);

        activeStatus.IsIssued.Should().BeTrue();
        activeStatus.IsActive.Should().BeTrue();
        activeStatus.CreatedAt.Should().NotBeNull();
        activeStatus.RevokedAt.Should().BeNull();

        await this.TrustedMemberAccessService.RevokeAccess(member.Id);

        this.dbContext.ChangeTracker.Clear();

        var revokedStatus =
            await this.TrustedMemberAccessService.GetAccessStatus(member.Id);

        revokedStatus.IsIssued.Should().BeTrue();
        revokedStatus.IsActive.Should().BeFalse();
        revokedStatus.RevokedAt.Should().NotBeNull();
    }

    [Test]
    public async Task TestIssueTrustedAccessForAdmin()
    {
        var action = async () =>
            await TrustedMemberAccessService.IssueAccess(1);

        await action.Should().ThrowAsync<InvalidOperationException>();
    }

    private async Task<User> CreateMember()
    {
        var member = new User
        {
            UserName = "trusted-member",
            RoleId = (int)RolesEnum.Member,
        };

        member.Id = await this.UserRepository.Create(member);

        return member;
    }

    private async Task<Meeting> CreateMeetingWithoutMembers()
    {
        var meeting = new Meeting
        {
            DateAndTime = DateTime.UtcNow,
            CriteriaGroup = CreateCriteriaGroup(),
            StudentWorks = [],
            Members = [],
        };

        await MeetingRepository.Create(meeting);

        return meeting;
    }

    private static CriteriaGroup CreateCriteriaGroup()
    {
        return new CriteriaGroup
        {
            Name = "Test criteria group",
        };
    }
}
