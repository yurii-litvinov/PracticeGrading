using FluentAssertions;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.RepositoriesTests;

public class MeetingRepositoryTests : TestBase
{
    [Test]
    public async Task TestMeetingCreation()
    {
        var meeting = new Meeting
        {
            Id = 1,
            Auditorium = "3389",
            DateAndTime = DateTime.Now,
            Info = "some_info",
            CriteriaGroup = TestCriteriaGroup,
            StudentWorks = [TestWork]
        };

        await MeetingRepository.Create(meeting);

        var newMeeting = await MeetingRepository.GetById(meeting.Id);

        newMeeting.Should().NotBeNull();
        newMeeting.Auditorium.Should().Be(meeting.Auditorium);
    }

    [Test]
    public async Task TestMeetingGetting()
    {
        var members = new List<User>
        {
            new() { UserName = "member1" },
            new() { UserName = "member2" }
        };

        var works = new List<StudentWork>
        {
            new() { StudentName = "student1", Supervisor = "supervisor1", Theme = "theme1", AverageCriteriaMarks = []},
            new() { StudentName = "student2", Supervisor = "supervisor2", Theme = "theme2", AverageCriteriaMarks = [] },
            new() { StudentName = "student3", Supervisor = "supervisor3", Theme = "theme3", AverageCriteriaMarks = []}
        };

        var meeting = new Meeting
        {
            Id = 10,
            CriteriaGroup = TestCriteriaGroup,
            Members = members,
            StudentWorks = works
        };

        await MeetingRepository.Create(meeting);

        var newMeeting = await MeetingRepository.GetById(meeting.Id);

        newMeeting.Should().NotBeNull();
        newMeeting.CriteriaGroup.Should().NotBeNull();
        newMeeting.Members.Should().NotBeNull();
        newMeeting.StudentWorks.Should().NotBeNull();

        newMeeting.Members.Should().BeEquivalentTo(members);
        newMeeting.StudentWorks.Should().BeEquivalentTo(works);
    }

    [Test]
    public async Task TestMeetingUpdate()
    {
        var meeting = new Meeting
        {
            Id = 3,
            Info = "some_info",
            CriteriaGroup = TestCriteriaGroup,
            StudentWorks = []
        };

        await MeetingRepository.Create(meeting);

        meeting.Info = "new_info";
        await MeetingRepository.Update(meeting);

        var updatedMeeting = await MeetingRepository.GetById(meeting.Id);

        updatedMeeting.Should().NotBeNull();
        updatedMeeting.Info.Should().Be(meeting.Info);
    }

    [Test]
    public async Task TestMeetingDeletion()
    {
        var meeting = new Meeting
        {
            Id = 2,
            Info = "delete_this",
            CriteriaGroup = TestCriteriaGroup,
            StudentWorks = [TestWork]
        };

        await MeetingRepository.Create(meeting);
        await MeetingRepository.Delete(meeting);

        var meetings = await MeetingRepository.GetAll();

        meetings.Should().NotContain(meeting);
    }
}