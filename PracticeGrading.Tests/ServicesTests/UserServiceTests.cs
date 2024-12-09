using FluentAssertions;
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
    public async Task TestLoginMember()
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
    public async Task TestLoginNonexistentUser()
    {
        var request = new LoginAdminRequest("non-existent", "password");

        var action = async () => await UserService.LoginAdmin(request);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with UserName {request.UserName} was not found.");
    }
}