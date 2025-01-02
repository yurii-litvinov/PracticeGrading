using FluentAssertions;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class MeetingServiceTests : TestBase
{
    [Test]
    public async Task TestAddMeeting()
    {
        var criteriaList = new List<Criteria>
        {
            new() { Id = 1, Name = "criteria1" },
            new() { Id = 2, Name = "criteria2" }
        };

        var works = new List<StudentWorkRequest>
        {
            new(null,
                "student",
                string.Empty,
                "theme",
                "supervisor",
                null,
                null,
                null,
                null,
                null),
        };

        foreach (var criteria in criteriaList)
        {
            await CriteriaRepository.Create(criteria);
        }

        var request = new MeetingRequest(
            null,
            DateTime.UtcNow,
            "3389",
            null,
            null,
            null,
            works,
            [
                new MemberRequest(null, "member1"),
                new MemberRequest(null, "member2"),
                new MemberRequest(null, "member3")
            ],
            [1, 2]);

        await MeetingService.AddMeeting(request);

        var meetings = await MeetingRepository.GetAll();

        meetings.Should().HaveCount(1);
        meetings.First().Auditorium.Should().BeEquivalentTo(request.Auditorium);
        meetings.First().StudentWorks.Should().HaveCount(works.Count);
        meetings.First().Members.Should().HaveCount(request.Members.Count);
        meetings.First().Criteria.Should().HaveCount(criteriaList.Count);
    }

    [Test]
    public async Task TestGetAllMeetings()
    {
        await MeetingRepository.Create(new Meeting { Criteria = [TestCriteria], StudentWorks = [TestWork] });
        await MeetingRepository.Create(new Meeting { Criteria = [TestCriteria], StudentWorks = [TestWork] });

        MeetingService.GetMeeting().Result.Should().HaveCount(2);
    }

    [Test]
    public async Task TestGetMeetingById()
    {
        var meeting = new Meeting { Id = 10, Info = "info", Criteria = [TestCriteria], StudentWorks = [TestWork] };
        await MeetingRepository.Create(meeting);

        var meetings = await MeetingService.GetMeeting(meeting.Id);

        meetings.First().Auditorium.Should().BeEquivalentTo(meeting.Auditorium);
    }

    [Test]
    public async Task TestGetNonexistentMeetingById()
    {
        const int id = 123;
        var action = async () => await MeetingService.GetMeeting(id);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Meeting with ID {id} was not found.");
    }

    [Test]
    public async Task TestUpdateMeeting()
    {
        var meeting = new Meeting { Id = 100, Info = "info", Criteria = [TestCriteria], StudentWorks = [TestWork] };
        await MeetingRepository.Create(meeting);

        var workRequest = new StudentWorkRequest(1,
            string.Empty,
            string.Empty,
            string.Empty,
            string.Empty,
            null,
            null,
            null,
            null,
            null);

        var request = new MeetingRequest(
            meeting.Id,
            DateTime.UtcNow,
            "3389",
            null,
            null,
            null,
            [workRequest],
            [],
            []);
        await MeetingService.UpdateMeeting(request);

        var meetings = await MeetingService.GetMeeting(request.Id);

        meetings.First().Auditorium.Should().BeEquivalentTo(request.Auditorium);
        meetings.First().Info.Should().BeEquivalentTo(request.Info);
    }

    [Test]
    public async Task TestUpdateNonexistentMeeting()
    {
        var request = new MeetingRequest(
            321,
            DateTime.UtcNow,
            "3389",
            null,
            null,
            null,
            [],
            [],
            []);
        var action = async () => await MeetingService.UpdateMeeting(request);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Meeting with ID {request.Id} was not found.");
    }

    [Test]
    public async Task TestDeleteMeeting()
    {
        var meeting = new Meeting { Id = 10, Criteria = [TestCriteria], StudentWorks = [TestWork] };
        await MeetingRepository.Create(meeting);

        await MeetingService.DeleteMeeting(meeting.Id);

        var meetings = await MeetingService.GetMeeting();

        meetings.Should().BeEmpty();
    }

    [Test]
    public async Task TestDeleteNonexistentMeeting()
    {
        const int id = 123;
        var action = async () => await MeetingService.DeleteMeeting(id);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Meeting with ID {id} was not found.");
    }
}