using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query.Internal;
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
        
        var request = new LoginMemberRequest(MemberId, null!,  1);
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
}