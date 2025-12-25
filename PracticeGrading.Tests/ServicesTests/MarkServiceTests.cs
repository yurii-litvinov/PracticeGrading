using FluentAssertions;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class MarkServiceTests : TestBase
{
    [SetUp]
    public new async Task SetUp()
    {
        await CreateTestMeeting();
    }

    [Test]
    public async Task TestAddMark()
    {
        var request = new MemberMarkRequest(null, 4, 3, [], 5, string.Empty);
        await MarkService.AddMemberMark(request);

        var marks = await MarkService.GetMemberMarks(request.StudentWorkId);

        marks.Should().HaveCount(1);
        marks.First().Mark.Should().Be(request.Mark);
    }

    [Test]
    public async Task TestGetAllMarks()
    {
        await MarkRepository.Create(new MemberMark { MemberId = 4, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 });
        await MarkRepository.Create(new MemberMark { MemberId = 5, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 });

        MarkService.GetMemberMarks(3).Result.Should().HaveCount(2);
    }

    [Test]
    public async Task TestGetMarkById()
    {
        await MarkRepository.Create(new MemberMark { MemberId = 4, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 });

        MarkService.GetMemberMarks(3, 4).Result.First().Mark.Should().Be(5);
    }

    [Test]
    public async Task TestGetNonexistentMarkById()
    {
        var marks = await MarkService.GetMemberMarks(3, 1);

        marks.First().Id.Should().Be(0);
        marks.First().Mark.Should().Be(0);
    }

    [Test]
    public async Task TestUpdateMark()
    {
        var mark = new MemberMark { MemberId = 4, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 };
        await MarkRepository.Create(mark);

        var request = new MemberMarkRequest(null, mark.MemberId, mark.StudentWorkId, [], 4, string.Empty);
        await MarkService.UpdateMemberMark(request);

        MarkService.GetMemberMarks(3, 4).Result.First().Mark.Should().Be(request.Mark);
    }

    [Test]
    public async Task TestUpdateNonexistentMark()
    {
        var request = new MemberMarkRequest(null, 123, 321, [], 4, string.Empty);
        var action = async () => await MarkService.UpdateMemberMark(request);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage(
                $"Member mark with member ID {request.MemberId} and student work ID {request.StudentWorkId}  was not found.");
    }

    [Test]
    public async Task TestDeleteMark()
    {
        var mark = new MemberMark { MemberId = 4, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 };
        await MarkRepository.Create(mark);

        await MarkService.DeleteMemberMark(mark.StudentWorkId, mark.MemberId);

        MarkService.GetMemberMarks(mark.StudentWorkId).Result.Should().BeEmpty();
    }

    [Test]
    public async Task TestDeleteNonexistentMark()
    {
        const int workId = 123;
        const int memberId = 321;
        var action = async () => await MarkService.DeleteMemberMark(workId, memberId);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage(
                $"Member mark with member ID {memberId} and student work ID {workId}  was not found.");
    }
}