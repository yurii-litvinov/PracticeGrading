using FluentAssertions;
using PracticeGrading.API.Models.Requests;
using System.Net.Http.Json;
using System.Text.Json;

namespace PracticeGrading.Tests.EndpointsTests;

public class MemberEndpointsTests : TestBase
{
    private MemberRequest member;
    [SetUp]
    public new async Task SetUp()
    {
        await LoginAdmin();
        member = new MemberRequest(
            Id: 0,
            Name: "testMember",
            Email: "Email",
            Phone: "7777777777",
            InformationRu: "Информация",
            InformationEn: "Info"
        );
    }

    [Test]
    public async Task TestAddMember()
    {
        var response = await Client.PostAsJsonAsync("/members", member);
        response.EnsureSuccessStatusCode();

        var jsonElement = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = jsonElement.GetProperty("id").GetInt32();

        var addedMember = await UserRepository.GetUserById(id);

        addedMember.Should().NotBeNull();
        addedMember.UserName.Should().Be(member.Name);
        addedMember.Email.Should().Be(member.Email);
        addedMember.Phone.Should().Be(member.Phone);
        addedMember.InformationRu.Should().Be(member.InformationRu);
        addedMember.InformationEn.Should().Be(member.InformationEn);

        await UserRepository.Delete(addedMember);
    }

    [Test]
    public async Task TestDeleteMember()
    {
        await Client.PostAsJsonAsync("/members", member);
        var response = await Client.DeleteAsync($"/members?id={member.Id}");
        response.EnsureSuccessStatusCode();

        var deletedMember = await UserRepository.GetUserById(member.Id);
        deletedMember.Should().BeNull();
    }

    [Test]
    public async Task TestUpdateMember()
    {
        var postResponse = await Client.PostAsJsonAsync("/members", member);
        var jsonElement = await postResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = jsonElement.GetProperty("id").GetInt32();

        var newMember = new MemberRequest(
            Id: id,
            Name: "testMember2",
            Email: "Email2",
            Phone: "77777777772",
            InformationRu: "Информация2",
            InformationEn: "Info2"
        );

        await Client.PutAsJsonAsync("members", newMember);

        var updatedMember = await UserRepository.GetUserById(id);

        updatedMember.Should().NotBeNull();
        updatedMember.UserName.Should().Be(newMember.Name);
        updatedMember.Email.Should().Be(newMember.Email);
        updatedMember.Phone.Should().Be(newMember.Phone);
        updatedMember.InformationRu.Should().Be(newMember.InformationRu);
        updatedMember.InformationEn.Should().Be(newMember.InformationEn);
    }
}