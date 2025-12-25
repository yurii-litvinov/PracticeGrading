using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NPOI.Util.ArrayExtensions;
using PracticeGrading.API.Models;
using PracticeGrading.API.Models.Requests;
using PracticeGrading.Data.Entities;

namespace PracticeGrading.Tests.ServicesTests;

public class UserServiceTests : TestBase
{
    [Test]
    public async Task TestLoginAdmin()
    {
        var request = new LoginAdminRequest("admin", "admin");
        var token = await UserService.LoginAdmin(request);

        token.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestLoginMemberAsAdmin()
    {
        var member = new User
        {
            UserName = "member",
            RoleId = 2
        };

        await UserRepository.Create(member);

        var request = new LoginAdminRequest(member.UserName, "password");
        var token = await UserService.LoginAdmin(request);

        token.Should().BeEmpty();
    }

    [Test]
    public async Task TestLoginAdminWithWrongPassword()
    {
        var request = new LoginAdminRequest("admin", "wrong");
        var token = await UserService.LoginAdmin(request);

        token.Should().BeEmpty();
    }

    [Test]
    public async Task TestLoginNonexistentUserAsAdmin()
    {
        var request = new LoginAdminRequest("non-existent", "password");

        var action = async () => await UserService.LoginAdmin(request);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with UserName {request.UserName} was not found.");
    }

    [Test]
    public async Task TestLoginMember()
    {
        await CreateTestMeeting();

        var request = new LoginMemberRequest(MemberId, null!, 1);
        var token = await UserService.LoginMember(request);

        token.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestLoginNonexistentMember()
    {
        await CreateTestMeeting();

        var request = new LoginMemberRequest(0, "nonexistent", 1);
        var token = await UserService.LoginMember(request);

        token.Should().NotBeEmpty();
    }

    [Test]
    public async Task TestCreateMember()
    {
        var member = new MemberRequest(0, "member");
        int id = await UserService.AddNewMember(member);
        var addedMember = await UserRepository.GetUserById(id);

        addedMember.Should().NotBeNull();

        addedMember.UserName.Should().Be("member");

        await UserRepository.Delete(addedMember);
    }

    [Test]
    public async Task TestDeleteMember()
    {
        var member = new MemberRequest(0, "member");
        int id = await UserService.AddNewMember(member);
        var addedMember = await UserRepository.GetUserById(id);

        addedMember.Should().NotBeNull();

        addedMember.UserName.Should().Be("member");

        await UserService.DeleteMember(addedMember.Id);

        var afterDeleteMember = await UserRepository.GetUserById(id);

        afterDeleteMember.Should().BeNull();
    }

    [Test]
    public async Task TestUpdateMember()
    {
        User user = new User { Id = 0, UserName = "member", RoleId = (int)RolesEnum.Member };
        int id = await UserRepository.Create(user);
        var addedMember = await UserRepository.GetUserById(id);
        dbContext.Entry(user).State = EntityState.Detached;

        addedMember.Should().NotBeNull();

        addedMember.UserName.Should().Be("member");

        var updatedMember = new MemberRequest(
            Id: addedMember.Id,
            Name: "updated member");

        await UserService.UpdateMember(updatedMember);
    }

    [Test]
    public async Task SearchMembersByNameAsyncTest()
    {
        int count = 10;
        var memberIds = new int[count];
        var users = new User[count];

        for (int i = 0; i < count; i++)
        {
            users[i] = new User { UserName = $"member{i}", RoleId = 2 };
        }

        await Task.WhenAll(memberIds.Select((_, index) =>
            UserRepository.Create(users[index])
        ));

        var firstHalfMembers = await UserService.SearchMembersByNameAsync("member", 0, count / 2);

        firstHalfMembers.Should().NotBeNull();
        firstHalfMembers.Length.Should().Be(count / 2);

        firstHalfMembers.Select((member, index) => (member, index))
            .All(pair => pair.member.Name == $"member{pair.index}").Should().BeTrue();

        var secondHalfMembers = await UserService.SearchMembersByNameAsync("member", count / 2, count);

        secondHalfMembers.Should().NotBeNull();
        secondHalfMembers.Length.Should().Be(count % 2 == 0 ? count / 2 : (count / 2) + 1);

        secondHalfMembers.Select((member, index) => (member, index))
            .All(pair => pair.member.Name == $"member{pair.index + (count / 2)}").Should().BeTrue();

        await Task.WhenAll(memberIds.Select((_, index) =>
            UserRepository.Delete(users[index])));
        
    }
}