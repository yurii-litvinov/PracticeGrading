using FluentAssertions;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;
using System.Net;
using System.Net.Http.Json;

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
        var mark = new MemberMarkRequest(null, MemberId, 3, [], 5, string.Empty);
        var response = await Client.PostAsJsonAsync("/marks/new", mark);

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestGetMarkById()
    {
        var mark = new MemberMarkRequest(null, MemberId, 3, [], 5, string.Empty);
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
        var mark = new MemberMarkRequest(null, MemberId, 3, [], 5, string.Empty);
        await Client.PostAsJsonAsync("/marks/new", mark);
        var updatedMark = new MemberMarkRequest(null, MemberId, 3, [], MemberId, string.Empty);

        var response = await Client.PutAsJsonAsync("/marks/update", updatedMark);

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestDeleteMark()
    {
        var mark = new MemberMarkRequest(null, MemberId, 3, [], 5, string.Empty);
        await Client.PostAsJsonAsync("/marks/new", mark);

        var response = await Client.DeleteAsync($"/marks/delete?workId=3&memberId={MemberId}");

        response.EnsureSuccessStatusCode();
    }

    [Test]
    public async Task TestMemberIdFromRequestIsIgnored()
    {
        await LoginApprovedMember();

        const int ForgedMemberId = int.MaxValue;

        var request = new MemberMarkRequest(
            Id: null,
            MemberId: ForgedMemberId,
            StudentWorkId: 3,
            CriteriaMarks: [],
            Mark: 5,    
            Comment: string.Empty);

        var response =
            await Client.PostAsJsonAsync(
                "/marks/new",
                request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        dbContext.ChangeTracker.Clear();

        var authenticatedMemberMark =
            await MarkRepository.GetById(
                MemberId,
                3);

        authenticatedMemberMark.Should().NotBeNull();
        authenticatedMemberMark.MemberId.Should().Be(MemberId);

        var forgedMemberMark =
            await MarkRepository.GetById(
                ForgedMemberId,
                3);

        forgedMemberMark.Should().BeNull();
    }

    [Test]
    public async Task TestMemberCannotCreateMarkForAnotherMeeting()
    {
        await LoginApprovedMember();

        var anotherWorkId =
            await CreateWorkForAnotherMeeting();

        var request = new MemberMarkRequest(
            Id: null,
            MemberId: MemberId,
            StudentWorkId: anotherWorkId,
            CriteriaMarks: [],
            Mark: 5,
            Comment: string.Empty);

        var response =
            await Client.PostAsJsonAsync(
                "/marks/new",
                request);

        response.StatusCode
            .Should()
            .Be(HttpStatusCode.Forbidden);

        dbContext.ChangeTracker.Clear();

        var mark = await MarkRepository.GetById(
            MemberId,
            anotherWorkId);

        mark.Should().BeNull();
    }

    [Test]
    public async Task TestMemberCannotGetMarksFromAnotherMeeting()
    {
        await LoginApprovedMember();

        var anotherWorkId =
            await CreateWorkForAnotherMeeting();

        var response = await Client.GetAsync(
            $"/marks?workId={anotherWorkId}");

        response.StatusCode
            .Should()
            .Be(HttpStatusCode.Forbidden);
    }

    private async Task<int> CreateWorkForAnotherMeeting()
    {
        var work = new StudentWork
        {
            StudentName = "Another Student",
            Theme = "Another Theme",
            Supervisor = "Another Supervisor",
            AverageCriteriaMarks = [],
        };

        var meeting = new Meeting
        {
            DateAndTime = DateTime.UtcNow,
            CriteriaGroup = new CriteriaGroup
            {
                Name = "Another Criteria Group",
            },
            StudentWorks = [work],
            Members = [],
        };

        await MeetingRepository.Create(meeting);

        return work.Id;
    }
}