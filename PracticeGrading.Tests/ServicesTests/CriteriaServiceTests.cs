using FluentAssertions;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class CriteriaServiceTests : TestBase
{
    [Test]
    public async Task TestAddCriteria()
    {
        var rules = new List<AddRuleRequest>
        {
            new("desc1", 1),
            new("desc2", 2),
            new("desc3", 3),
        };

        var request = new CriteriaRequest(null, "name", null, rules, rules);

        await CriteriaService.AddCriteria(request);

        var criteria = await CriteriaRepository.GetAll();

        criteria.Should().HaveCount(1);
        criteria.First().Name.Should().BeEquivalentTo(request.Name);
        criteria.First().Rules.Should().HaveCount(rules.Count * 2);
    }

    [Test]
    public async Task TestGetAllCriteria()
    {
        await CriteriaRepository.Create(new Criteria { Name = "name" });
        await CriteriaRepository.Create(new Criteria { Name = "name" });

        CriteriaService.GetCriteria().Result.Should().HaveCount(2);
    }

    [Test]
    public async Task TestGetCriteriaById()
    {
        var criteria = new Criteria { Id = 10, Name = "name" };
        await CriteriaRepository.Create(criteria);

        var criteriaList = await CriteriaService.GetCriteria(criteria.Id);

        criteriaList.First().Name.Should().BeEquivalentTo(criteria.Name);
    }

    [Test]
    public async Task TestGetNonexistentCriteriaById()
    {
        const int id = 123;
        var action = async () => await CriteriaService.GetCriteria(id);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Criteria with ID {id} was not found.");
    }

    [Test]
    public async Task TestUpdateCriteria()
    {
        var criteria = new Criteria { Id = 10, Name = "name" };
        await CriteriaRepository.Create(criteria);

        var request = new CriteriaRequest(
            criteria.Id,
            "new_name",
            null,
            [],
            []);
        
        await CriteriaService.UpdateCriteria(request);

        var criteriaList = await CriteriaService.GetCriteria(request.Id);

        criteriaList.First().Name.Should().BeEquivalentTo(request.Name);
    }

    [Test]
    public async Task TestUpdateNonexistentCriteria()
    {
        var request = new CriteriaRequest(
            321,
            "name",
            null,
            [],
            []);
        
        var action = async () => await CriteriaService.UpdateCriteria(request);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Criteria with ID {request.Id} was not found.");
    }

    [Test]
    public async Task TestDeleteCriteria()
    {
        var criteria = new Criteria { Id = 10, Name = "name" };
        await CriteriaRepository.Create(criteria);

        await CriteriaService.DeleteCriteria(criteria.Id);

        var criteriaList = await CriteriaService.GetCriteria();

        criteriaList.Should().BeEmpty();
    }

    [Test]
    public async Task TestDeleteNonexistentCriteria()
    {
        const int id = 123;
        var action = async () => await CriteriaService.DeleteCriteria(id);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Criteria with ID {id} was not found.");
    }
}