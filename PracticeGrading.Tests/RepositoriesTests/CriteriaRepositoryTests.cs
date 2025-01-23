using FluentAssertions;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.RepositoriesTests;

public class CriteriaRepositoryTests : TestBase
{
    [Test]
    public async Task TestCriteriaCreation()
    {
        var criteria = new Criteria
        {
            Id = 1,
            Name = "name"
        };

        await CriteriaRepository.Create(criteria);

        var newCriteria = await CriteriaRepository.GetById(criteria.Id);

        newCriteria.Should().NotBeNull();
        newCriteria.Name.Should().Be(criteria.Name);
    }

    [Test]
    public async Task TestCriteriaGetting()
    {
        var rules = new List<Rule>
        {
            new() { Description = "desc1" },
            new() { Description = "desc2" },
            new() { Description = "desc3" },
        };

        var criteria = new Criteria
        {
            Id = 10,
            Name = "name",
            Rules = rules,
        };

        await CriteriaRepository.Create(criteria);

        var newCriteria = await CriteriaRepository.GetById(criteria.Id);

        newCriteria.Should().NotBeNull();
        newCriteria.Rules.Should().NotBeNull();
        newCriteria.Rules.Should().BeEquivalentTo(rules);
    }

    [Test]
    public async Task TestCriteriaUpdate()
    {
        var criteria = new Criteria
        {
            Id = 3,
            Name = "some_name"
        };

        await CriteriaRepository.Create(criteria);

        criteria.Name = "new_name";
        await CriteriaRepository.Update(criteria);

        var updatedCriteria = await CriteriaRepository.GetById(criteria.Id);

        updatedCriteria.Should().NotBeNull();
        updatedCriteria.Name.Should().Be(criteria.Name);
    }

    [Test]
    public async Task TestCriteriaDeletion()
    {
        var criteria = new Criteria
        {
            Id = 2,
            Name = "delete_this"
        };

        await CriteriaRepository.Create(criteria);
        await CriteriaRepository.Delete(criteria);

        var criteriaList = await CriteriaRepository.GetAll();

        criteriaList.Should().NotContain(criteria);
    }
}