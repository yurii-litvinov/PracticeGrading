using FluentAssertions;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.RepositoriesTests;

public class MarkRepositoryTests : TestBase
{
    [SetUp]
    public new async Task SetUp()
    {
        await CreateTestMeeting();
    }
    
    [Test]
    public async Task TestMarkCreation()
    {
        var mark = new MemberMark { MemberId = 5, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 };

        await MarkRepository.Create(mark);

        var newMark = await MarkRepository.GetById(mark.MemberId, mark.StudentWorkId);

        newMark.Should().NotBeNull();
        newMark.Mark.Should().Be(mark.Mark);
    }

    [Test]
    public async Task TestMarkGetting()
    {
        var mark = new MemberMark
        {
            MemberId = 5, 
            StudentWorkId = 3,
            CriteriaMarks = [new CriteriaMark { CriteriaId = 2, SelectedRules = [], Mark = 5 }],
            Mark = 5
        };

        await MarkRepository.Create(mark);

        var newMark = await MarkRepository.GetById(mark.MemberId, mark.StudentWorkId);

        newMark.Should().NotBeNull();
        newMark.CriteriaMarks.Should().NotBeNull();
        newMark.Mark.Should().Be(mark.Mark);
        newMark.CriteriaMarks.Should().HaveCount(1);
    }
    
    [Test]
    public async Task TestMarkUpdate()
    {
        var mark = new MemberMark { MemberId = 5, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 };

        await MarkRepository.Create(mark);

        mark.Mark = 4;

        await MarkRepository.Update(mark);

        var newMark = await MarkRepository.GetById(mark.MemberId, mark.StudentWorkId);

        newMark.Should().NotBeNull();
        newMark.Mark.Should().Be(mark.Mark);
    }
    
    [Test]
    public async Task TestMarkDeletion()
    {
        var mark = new MemberMark { MemberId = 5, StudentWorkId = 3, CriteriaMarks = [], Mark = 5 };

        await MarkRepository.Create(mark);
        await MarkRepository.Delete(mark);

        var marks = await MarkRepository.GetAll(mark.StudentWorkId);

        marks.Should().NotContain(mark);
    }
}